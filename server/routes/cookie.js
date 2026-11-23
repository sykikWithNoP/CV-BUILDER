const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

/* POST /api/cookie/consent — Log cookie consent */
router.post(
  '/consent',
  [
    body('consentType').isIn(['essential', 'analytics', 'all']),
    body('sessionId').isString().isLength({ min: 8, max: 128 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { consentType, sessionId } = req.body;
    const db = req.app.locals.db;

    try {
      // Extract userId from token if available
      let userId = null;
      const jwt = require('jsonwebtoken');
      const token = req.cookies?.access_token;
      if (token) {
        try {
          const payload = jwt.verify(token, process.env.JWT_SECRET);
          userId = payload.userId;
        } catch (_) {}
      }

      await db.runAsync(
        `INSERT INTO cookie_consents (session_id, user_id, consent_given, consent_type, ip_address)
         VALUES (?, ?, 1, ?, ?)`,
        [sessionId, userId, consentType, req.ip]
      );

      res.json({ message: 'Consent recorded' });
    } catch (e) {
      console.error('Cookie consent error:', e.message);
      res.status(500).json({ error: 'Failed to record consent' });
    }
  }
);

module.exports = router;
