const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/login-logs', verifyToken, requireAdmin, async (req, res) => {
  try {
    const rows = await req.app.locals.db.allAsync(
      `SELECT l.id, u.email, l.ip_address, l.user_agent, l.success, l.created_at
       FROM login_logs l LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC LIMIT 100`
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load login logs' }); }
});

module.exports = router;
