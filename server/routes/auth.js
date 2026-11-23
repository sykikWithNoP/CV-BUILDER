const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { verifyToken } = require('../middleware/auth');
const { decodeEntities } = require('../utils/cvData');

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  handler: (_, res) => res.status(429).json({ error: 'Too many login attempts. Try later.' }),
});

const signupLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  handler: (_, res) => res.status(429).json({ error: 'Too many signup attempts. Try later.' }),
});

function sixDigitCode() {
  return String(crypto.randomInt(100000, 1000000));
}

/**
 * Sends the confirmation code (and keeps the one-click link working).
 * In development, where SMTP usually isn't configured, the code is logged so the
 * verification gateway can still be walked through.
 */
async function sendVerificationEmail(email, token, code) {
  const verifyLink = `${process.env.BASE_URL}/api/auth/verify?token=${token}`;
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"CV Builder" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Confirm your CV Builder email',
      html: `<div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:40px;background:#f8f9fa;border-radius:16px">
        <h2 style="color:#1a1a2e;margin-bottom:8px">Confirm your email</h2>
        <p style="color:#555">Enter this code in the app to activate your account:</p>
        <div style="text-align:center;margin:24px 0">
          <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#667eea;background:#eef0ff;padding:16px 32px;border-radius:12px;display:inline-block">${code}</span>
        </div>
        <p style="color:#555">Or <a href="${verifyLink}">click here</a> to confirm in one step.</p>
        <p style="color:#888;font-size:14px">This code expires in 24 hours.</p>
      </div>`,
    });
  } catch (e) {
    console.error('Verification email error:', e.message);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV] Verification code for ${email}: ${code}`);
    }
    throw e;
  }
}

function cookieOpts(maxAgeMs) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
  };
}

/* ---------- SIGN-UP ---------- */
router.post(
  '/signup', signupLimiter,
  [
    // Names are stored as typed. Escaping here turned "O'Brien" into
    // "O&#x27;Brien" in the database and on the CV; output escaping is handled
    // where the values are rendered instead.
    body('firstName').trim().isLength({ min: 2, max: 60 }),
    body('lastName').trim().isLength({ min: 2, max: 60 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/)
      .withMessage('Password needs an uppercase letter and a number.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { firstName, lastName, email, password } = req.body;
    const db = req.app.locals.db;
    try {
      const exists = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
      if (exists) return res.status(400).json({ error: 'Email already taken.' });
      const hash = await bcrypt.hash(password, 12);
      const result = await db.runAsync(
        `INSERT INTO users (first_name,last_name,email,password_hash,verified,created_at) VALUES (?,?,?,?,0,datetime('now'))`,
        [firstName, lastName, email, hash]
      );
      const userId = result.lastID;
      const token = crypto.randomBytes(32).toString('hex');
      const code = sixDigitCode();
      await db.runAsync(
        `INSERT INTO email_verifications (user_id,token,otp_code,expires_at) VALUES (?,?,?,datetime('now','+1 day'))`,
        [userId, token, code]
      );
      try { await sendVerificationEmail(email, token, code); } catch (e) { /* already logged */ }
      await db.runAsync(`INSERT INTO signup_logs (user_id,ip_address,user_agent,success) VALUES (?,?,?,1)`, [userId, req.ip, req.get('User-Agent')]);
      // Skipping the gateway is now opt-in (AUTO_VERIFY=true) rather than
      // automatic outside production, so the confirmation step is real in dev too.
      if (process.env.AUTO_VERIFY === 'true') {
        await db.runAsync('UPDATE users SET verified = 1 WHERE id = ?', [userId]);
      }
      res.status(201).json({
        message: 'Signup successful – check your email for the confirmation code.',
        requiresVerification: process.env.AUTO_VERIFY !== 'true',
      });
    } catch (e) {
      console.error(e);
      try { await db.runAsync(`INSERT INTO signup_logs (user_id,ip_address,user_agent,success) VALUES (NULL,?,?,0)`, [req.ip, req.get('User-Agent')]); } catch (_) {}
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ---------- EMAIL VERIFICATION ---------- */
router.get('/verify', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('Invalid token');
  const db = req.app.locals.db;
  try {
    const row = await db.getAsync(`SELECT user_id FROM email_verifications WHERE token = ? AND expires_at > datetime('now')`, [token]);
    if (!row) return res.status(400).send('Token expired or invalid');
    const userId = row.user_id;
    await db.runAsync('UPDATE users SET verified = 1 WHERE id = ?', [userId]);
    await db.runAsync('DELETE FROM email_verifications WHERE user_id = ?', [userId]);
    const accessToken = jwt.sign({ userId, verified: true }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_EXPIRES_IN });
    await db.runAsync(`INSERT OR REPLACE INTO refresh_tokens (user_id,token,expires_at) VALUES (?,?,datetime('now','+7 days'))`, [userId, refreshToken]);
    res.cookie('access_token', accessToken, cookieOpts(15*60*1000))
       .cookie('refresh_token', refreshToken, cookieOpts(7*24*60*60*1000))
       .redirect(`${process.env.FRONTEND_ORIGIN}/dashboard`);
  } catch (e) { console.error(e); res.status(500).send('Server error'); }
});

/* ---------- EMAIL CONFIRMATION BY CODE ---------- */
const verifyCodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  handler: (_, res) => res.status(429).json({ error: 'Too many attempts. Try again later.' }),
});

router.post(
  '/verify-code',
  verifyCodeLimiter,
  [body('email').isEmail().normalizeEmail(), body('code').isString().isLength({ min: 6, max: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Enter the 6-digit code from your email' });
    const { email, code } = req.body;
    const db = req.app.locals.db;
    try {
      const usr = await db.getAsync('SELECT id, verified, role FROM users WHERE email = ?', [email]);
      if (!usr) return res.status(400).json({ error: 'Invalid or expired code' });
      if (usr.verified) return res.json({ message: 'Email already confirmed', alreadyVerified: true });

      const row = await db.getAsync(
        `SELECT id FROM email_verifications WHERE user_id = ? AND otp_code = ? AND expires_at > datetime('now')`,
        [usr.id, code]
      );
      if (!row) return res.status(400).json({ error: 'Invalid or expired code' });

      await db.runAsync('UPDATE users SET verified = 1 WHERE id = ?', [usr.id]);
      await db.runAsync('DELETE FROM email_verifications WHERE user_id = ?', [usr.id]);

      // Confirming signs the user straight in, same as the emailed link does.
      const accessToken = jwt.sign({ userId: usr.id, verified: true, role: usr.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      const refreshToken = jwt.sign({ userId: usr.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_EXPIRES_IN });
      await db.runAsync(
        `INSERT OR REPLACE INTO refresh_tokens (user_id,token,expires_at) VALUES (?,?,datetime('now','+7 days'))`,
        [usr.id, refreshToken]
      );
      res.cookie('access_token', accessToken, cookieOpts(15 * 60 * 1000))
         .cookie('refresh_token', refreshToken, cookieOpts(7 * 24 * 60 * 60 * 1000))
         .json({ message: 'Email confirmed' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ---------- LOGIN ---------- */
router.post(
  '/login', loginLimiter,
  [body('email').isEmail().normalizeEmail(), body('password').exists()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email, password } = req.body;
    const db = req.app.locals.db;
    try {
      const usr = await db.getAsync(`SELECT id,password_hash,verified,failed_attempts,lock_until,role FROM users WHERE email = ?`, [email]);
      if (!usr) {
        await db.runAsync(`INSERT INTO login_logs (user_id,ip_address,user_agent,success) VALUES (NULL,?,?,0)`, [req.ip, req.get('User-Agent')]);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      if (usr.lock_until && new Date(usr.lock_until) > new Date())
        return res.status(429).json({ error: 'Account locked – try later.' });
      const match = await bcrypt.compare(password, usr.password_hash);
      if (!match) {
        const attempts = (usr.failed_attempts || 0) + 1;
        const lockUntil = attempts >= 5 ? new Date(Date.now() + 30*60*1000).toISOString() : null;
        await db.runAsync('UPDATE users SET failed_attempts=?,lock_until=? WHERE id=?', [attempts, lockUntil, usr.id]);
        await db.runAsync(`INSERT INTO login_logs (user_id,ip_address,user_agent,success) VALUES (?,?,?,0)`, [usr.id, req.ip, req.get('User-Agent')]);
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      await db.runAsync('UPDATE users SET failed_attempts=0,lock_until=NULL WHERE id=?', [usr.id]);
      const accessToken = jwt.sign({ userId: usr.id, verified: usr.verified, role: usr.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      const refreshToken = jwt.sign({ userId: usr.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_EXPIRES_IN });
      await db.runAsync(`INSERT OR REPLACE INTO refresh_tokens (user_id,token,expires_at) VALUES (?,?,datetime('now','+7 days'))`, [usr.id, refreshToken]);
      await db.runAsync(`INSERT INTO login_logs (user_id,ip_address,user_agent,success) VALUES (?,?,?,1)`, [usr.id, req.ip, req.get('User-Agent')]);
      res.cookie('access_token', accessToken, cookieOpts(15*60*1000))
         .cookie('refresh_token', refreshToken, cookieOpts(7*24*60*60*1000))
         .json({ message: 'Login successful' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
  }
);

/* ---------- REFRESH ---------- */
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const row = await req.app.locals.db.getAsync(`SELECT token FROM refresh_tokens WHERE user_id=? AND token=? AND expires_at>datetime('now')`, [payload.userId, token]);
    if (!row) return res.status(401).json({ error: 'Invalid refresh token' });
    const newAccess = jwt.sign({ userId: payload.userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.cookie('access_token', newAccess, cookieOpts(15*60*1000)).json({ message: 'Token refreshed' });
  } catch (e) { res.status(401).json({ error: 'Invalid refresh token' }); }
});

/* ---------- LOGOUT ---------- */
router.post('/logout', async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (token) {
    try {
      const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
      await req.app.locals.db.runAsync('DELETE FROM refresh_tokens WHERE user_id=?', [payload.userId]);
    } catch (_) {}
  }
  res.clearCookie('access_token').clearCookie('refresh_token').json({ message: 'Logged out' });
});

/* ---------- ME ---------- */
router.get('/me', async (req, res) => {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const row = await req.app.locals.db.getAsync(`SELECT id,first_name,last_name,email,verified,role,college_affiliation FROM users WHERE id=?`, [payload.userId]);
    if (!row) return res.status(404).json({ error: 'User not found' });
    // Accounts created before names were stored raw may hold HTML entities.
    res.json({
      ...row,
      first_name: decodeEntities(row.first_name || ''),
      last_name: decodeEntities(row.last_name || ''),
    });
  } catch (e) { res.status(401).json({ error: 'Invalid token' }); }
});

/* ---------- UPDATE PROFILE ---------- */
router.put(
  '/update-profile',
  verifyToken,
  [
    body('firstName').trim().isLength({ min: 2, max: 60 }),
    body('lastName').trim().isLength({ min: 2, max: 60 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'First and last name need 2–60 characters' });
    try {
      const { firstName, lastName } = req.body;
      await req.app.locals.db.runAsync('UPDATE users SET first_name=?,last_name=? WHERE id=?', [firstName, lastName, req.user.userId]);
      res.json({ message: 'Profile updated' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
  }
);

/* ---------- CHANGE PASSWORD ---------- */
router.put(
  '/change-password',
  verifyToken,
  [body('currentPassword').exists(), body('newPassword').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/)],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'New password needs min 8 chars, 1 uppercase, 1 number.' });
    try {
      const { currentPassword, newPassword } = req.body;
      const usr = await req.app.locals.db.getAsync('SELECT password_hash FROM users WHERE id=?', [req.user.userId]);
      if (!usr) return res.status(404).json({ error: 'User not found' });
      const match = await bcrypt.compare(currentPassword, usr.password_hash);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
      const hash = await bcrypt.hash(newPassword, 12);
      await req.app.locals.db.runAsync('UPDATE users SET password_hash=? WHERE id=?', [hash, req.user.userId]);
      // A password change invalidates every other session; this one gets a fresh
      // refresh token so the user is not signed out of the page they are on.
      await req.app.locals.db.runAsync('DELETE FROM refresh_tokens WHERE user_id=?', [req.user.userId]);
      const refreshToken = jwt.sign({ userId: req.user.userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_EXPIRES_IN });
      await req.app.locals.db.runAsync(
        `INSERT OR REPLACE INTO refresh_tokens (user_id,token,expires_at) VALUES (?,?,datetime('now','+7 days'))`,
        [req.user.userId, refreshToken]
      );
      res.cookie('refresh_token', refreshToken, cookieOpts(7 * 24 * 60 * 60 * 1000))
         .json({ message: 'Password changed successfully' });
    } catch (e) { console.error(e); res.status(500).json({ error: 'Server error' }); }
  }
);

/* ---------- FORGOT PASSWORD — Step 1: Send OTP (Issue 1) ---------- */
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  handler: (_, res) => res.status(429).json({ error: 'Too many reset attempts. Try later.' }),
});

router.post(
  '/forgot-password',
  forgotLimiter,
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email } = req.body;
    const db = req.app.locals.db;
    try {
      const usr = await db.getAsync('SELECT id, first_name FROM users WHERE email = ?', [email]);
      // Always return success to prevent email enumeration
      if (!usr) return res.json({ message: 'If that email exists, a verification code has been sent.' });

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const token = crypto.randomBytes(32).toString('hex');

      // Delete old reset tokens for this user
      await db.runAsync('DELETE FROM password_resets WHERE user_id = ?', [usr.id]);

      // Store OTP with 15-minute expiry
      await db.runAsync(
        `INSERT INTO password_resets (user_id, token, otp_code, expires_at, created_at)
         VALUES (?, ?, ?, datetime('now', '+15 minutes'), datetime('now'))`,
        [usr.id, token, otp]
      );

      // Send OTP email
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT),
          secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        });
        await transporter.sendMail({
          from: `"CV Builder" <${process.env.SMTP_USER}>`,
          to: email,
          subject: 'Your CV Builder verification code',
          html: `<div style="font-family:Inter,sans-serif;max-width:480px;margin:auto;padding:40px;background:#f8f9fa;border-radius:16px">
            <h2 style="color:#1a1a2e;margin-bottom:8px">Password Reset</h2>
            <p style="color:#555">Hi ${usr.first_name},</p>
            <p style="color:#555">Your verification code is:</p>
            <div style="text-align:center;margin:24px 0">
              <span style="font-size:36px;font-weight:800;letter-spacing:8px;color:#667eea;background:#eef0ff;padding:16px 32px;border-radius:12px;display:inline-block">${otp}</span>
            </div>
            <p style="color:#888;font-size:14px">This code expires in 15 minutes. If you didn't request this, ignore this email.</p>
          </div>`,
        });
      } catch (e) {
        console.error('Reset email error:', e.message);
        // In dev, log OTP to console
        if (process.env.NODE_ENV !== 'production') console.log(`[DEV] OTP for ${email}: ${otp}`);
      }

      res.json({ message: 'If that email exists, a verification code has been sent.', token });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ---------- FORGOT PASSWORD — Step 2: Verify OTP (Issue 1) ---------- */
router.post(
  '/verify-otp',
  [body('token').isString(), body('otp').isString().isLength({ min: 6, max: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { token, otp } = req.body;
    const db = req.app.locals.db;
    try {
      const row = await db.getAsync(
        `SELECT id, user_id FROM password_resets WHERE token = ? AND otp_code = ? AND used = 0 AND expires_at > datetime('now')`,
        [token, otp]
      );
      if (!row) return res.status(400).json({ error: 'Invalid or expired verification code' });

      // Generate a short-lived reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      await db.runAsync(
        'UPDATE password_resets SET token = ?, used = 0 WHERE id = ?',
        [resetToken, row.id]
      );

      res.json({ resetToken, message: 'Code verified. Set your new password.' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ---------- FORGOT PASSWORD — Step 3: Reset Password (Issue 1) ---------- */
router.post(
  '/reset-password',
  [
    body('resetToken').isString(),
    body('newPassword').isLength({ min: 8 }).matches(/[A-Z]/).matches(/[0-9]/)
      .withMessage('Password needs min 8 chars, 1 uppercase, 1 number.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { resetToken, newPassword } = req.body;
    const db = req.app.locals.db;
    try {
      const row = await db.getAsync(
        `SELECT id, user_id FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime('now')`,
        [resetToken]
      );
      if (!row) return res.status(400).json({ error: 'Invalid or expired reset token' });

      const hash = await bcrypt.hash(newPassword, 12);
      await db.runAsync('UPDATE users SET password_hash = ?, failed_attempts = 0, lock_until = NULL WHERE id = ?', [hash, row.user_id]);
      await db.runAsync('UPDATE password_resets SET used = 1 WHERE id = ?', [row.id]);

      res.json({ message: 'Password reset successfully. You can now login.' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

/* ---------- RESEND VERIFICATION EMAIL (Issue 4) ---------- */
router.post(
  '/resend-verification',
  [body('email').isEmail().normalizeEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { email } = req.body;
    const db = req.app.locals.db;
    try {
      const usr = await db.getAsync('SELECT id, verified FROM users WHERE email = ?', [email]);
      if (!usr) return res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
      if (usr.verified) return res.json({ message: 'Email is already verified.' });

      // Delete old tokens and create new
      await db.runAsync('DELETE FROM email_verifications WHERE user_id = ?', [usr.id]);
      const token = crypto.randomBytes(32).toString('hex');
      const code = sixDigitCode();
      await db.runAsync(
        `INSERT INTO email_verifications (user_id, token, otp_code, expires_at) VALUES (?, ?, ?, datetime('now', '+1 day'))`,
        [usr.id, token, code]
      );
      try { await sendVerificationEmail(email, token, code); } catch (e) { /* already logged */ }

      res.json({ message: 'If that email exists and is unverified, a new link has been sent.' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Server error' });
    }
  }
);

module.exports = router;

