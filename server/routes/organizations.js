const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');

const affiliateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  handler: (_, res) => res.status(429).json({ error: 'Too many requests. Try later.' }),
});

async function sendOrgVerificationEmail(email, orgName, token) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const verifyLink = `${process.env.BASE_URL}/api/organizations/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"CV Builder" <${process.env.SMTP_USER}>`,
    to: email,
    subject: `Verify your organization: ${orgName}`,
    html: `<div style="font-family:Inter,sans-serif;max-width:500px;margin:auto;padding:32px;background:#f8f9fa;border-radius:12px">
      <h2 style="color:#1a1a2e">Organization Verification</h2>
      <p>Hello,</p>
      <p>Please verify <strong>${orgName}</strong> by clicking the link below:</p>
      <a href="${verifyLink}" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Verify Organization</a>
      <p style="color:#666;margin-top:24px;font-size:14px">This link expires in 48 hours.</p>
    </div>`,
  });
}

/* ---------- PUBLIC: Request Affiliation (Issue 9) ---------- */
router.post(
  '/request-affiliation',
  affiliateLimiter,
  [
    body('orgName').trim().isLength({ min: 2, max: 200 }).escape(),
    body('contactName').trim().isLength({ min: 2, max: 100 }).escape(),
    body('contactEmail').isEmail().normalizeEmail(),
    body('message').optional().trim().isLength({ max: 2000 }).escape(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { orgName, contactName, contactEmail, message } = req.body;
    const db = req.app.locals.db;

    try {
      // Check for duplicate pending requests
      const existing = await db.getAsync(
        "SELECT id FROM affiliation_requests WHERE contact_email = ? AND status = 'pending'",
        [contactEmail]
      );
      if (existing) return res.status(400).json({ error: 'A pending request already exists for this email' });

      await db.runAsync(
        `INSERT INTO affiliation_requests (org_name, contact_name, contact_email, message, status, created_at)
         VALUES (?, ?, ?, ?, 'pending', datetime('now'))`,
        [orgName, contactName, contactEmail, message || '']
      );

      res.status(201).json({ message: 'Affiliation request submitted successfully. We will review and contact you.' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to submit request' });
    }
  }
);

/* ---------- PUBLIC: Verify Org Email ---------- */
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Invalid token');
  const db = req.app.locals.db;
  try {
    const org = await db.getAsync(
      "SELECT id, name FROM organizations WHERE verification_token = ? AND verified = 0",
      [token]
    );
    if (!org) return res.status(400).send('Invalid or expired token');
    await db.runAsync(
      "UPDATE organizations SET verified = 1, verified_at = datetime('now'), verification_token = NULL WHERE id = ?",
      [org.id]
    );
    res.redirect(`${process.env.FRONTEND_ORIGIN}/affiliate?verified=true`);
  } catch (e) {
    console.error(e);
    res.status(500).send('Server error');
  }
});

/* ---------- ADMIN: List Organizations ---------- */
router.get('/admin/list', verifyToken, requireAdmin, async (req, res) => {
  try {
    const rows = await req.app.locals.db.allAsync(
      'SELECT * FROM organizations ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load organizations' });
  }
});

/* ---------- ADMIN: List Affiliation Requests ---------- */
router.get('/admin/requests', verifyToken, requireAdmin, async (req, res) => {
  try {
    const rows = await req.app.locals.db.allAsync(
      'SELECT * FROM affiliation_requests ORDER BY created_at DESC LIMIT 100'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load requests' });
  }
});

/* ---------- ADMIN: Approve Affiliation Request → Create Organization ---------- */
router.post('/admin/approve/:requestId', verifyToken, requireAdmin, async (req, res) => {
  const db = req.app.locals.db;
  try {
    const request = await db.getAsync('SELECT * FROM affiliation_requests WHERE id = ?', [req.params.requestId]);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.status !== 'pending') return res.status(400).json({ error: 'Request already processed' });

    const crypto = require('crypto');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create organization
    const result = await db.runAsync(
      `INSERT INTO organizations (name, contact_email, verified, payment_verified, plan, verification_token, created_at)
       VALUES (?, ?, 0, 0, 'free', ?, datetime('now'))`,
      [request.org_name, request.contact_email, verificationToken]
    );

    // Update request status
    await db.runAsync(
      "UPDATE affiliation_requests SET status = 'approved', reviewed_at = datetime('now') WHERE id = ?",
      [req.params.requestId]
    );

    // Send verification email
    try {
      await sendOrgVerificationEmail(request.contact_email, request.org_name, verificationToken);
    } catch (e) {
      console.error('Org verification email error:', e.message);
    }

    res.json({ message: 'Request approved, verification email sent', orgId: result.lastID });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to approve request' });
  }
});

/* ---------- ADMIN: Verify Payment ---------- */
router.put('/admin/verify-payment/:orgId', verifyToken, requireAdmin, async (req, res) => {
  const { paymentReference, plan } = req.body;
  const db = req.app.locals.db;
  try {
    await db.runAsync(
      "UPDATE organizations SET payment_verified = 1, payment_reference = ?, plan = ? WHERE id = ?",
      [paymentReference || 'manual', plan || 'premium', req.params.orgId]
    );
    res.json({ message: 'Payment verified, plan upgraded' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

/* ---------- ADMIN: Reject Request ---------- */
router.put('/admin/reject/:requestId', verifyToken, requireAdmin, async (req, res) => {
  try {
    await req.app.locals.db.runAsync(
      "UPDATE affiliation_requests SET status = 'rejected', reviewed_at = datetime('now') WHERE id = ?",
      [req.params.requestId]
    );
    res.json({ message: 'Request rejected' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

module.exports = router;
