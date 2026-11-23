const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');

/* ---------- LIST USER TEMPLATES ---------- */
router.get('/', verifyToken, async (req, res) => {
  try {
    // The markup and stylesheet come back with the list so the dashboard can
    // render a saved design in the live preview without a second round trip.
    const rows = await req.app.locals.db.allAsync(
      'SELECT id, name, config, stylesheet, html_template, created_at, updated_at FROM user_templates WHERE user_id = ? ORDER BY updated_at DESC',
      [req.user.userId]
    );
    res.json(rows.map((r) => {
      let config = {};
      try { config = JSON.parse(r.config); } catch { /* keep an empty config */ }
      return { ...r, config };
    }));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

/* ---------- SAVE NEW TEMPLATE ---------- */
router.post(
  '/',
  verifyToken,
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('config').isObject(),
    body('stylesheet').isString(),
    body('htmlTemplate').isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, config, stylesheet, htmlTemplate } = req.body;
    const db = req.app.locals.db;

    try {
      // Limit to 10 saved templates per user
      const count = await db.getAsync('SELECT COUNT(*) as c FROM user_templates WHERE user_id = ?', [req.user.userId]);
      if (count.c >= 10) return res.status(400).json({ error: 'Maximum 10 saved templates allowed' });

      const result = await db.runAsync(
        `INSERT INTO user_templates (user_id, name, config, stylesheet, html_template, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [req.user.userId, name, JSON.stringify(config), stylesheet, htmlTemplate]
      );
      res.status(201).json({ id: result.lastID, message: 'Template saved' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to save template' });
    }
  }
);

/* ---------- UPDATE TEMPLATE ---------- */
router.put(
  '/:id',
  verifyToken,
  [
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('config').optional().isObject(),
    body('stylesheet').optional().isString(),
    body('htmlTemplate').optional().isString(),
  ],
  async (req, res) => {
    const db = req.app.locals.db;
    try {
      const existing = await db.getAsync('SELECT id FROM user_templates WHERE id = ? AND user_id = ?', [req.params.id, req.user.userId]);
      if (!existing) return res.status(404).json({ error: 'Template not found' });

      const updates = [];
      const params = [];
      if (req.body.name) { updates.push('name = ?'); params.push(req.body.name); }
      if (req.body.config) { updates.push('config = ?'); params.push(JSON.stringify(req.body.config)); }
      if (req.body.stylesheet) { updates.push('stylesheet = ?'); params.push(req.body.stylesheet); }
      if (req.body.htmlTemplate) { updates.push('html_template = ?'); params.push(req.body.htmlTemplate); }
      updates.push("updated_at = datetime('now')");
      params.push(req.params.id, req.user.userId);

      await db.runAsync(`UPDATE user_templates SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`, params);
      res.json({ message: 'Template updated' });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to update template' });
    }
  }
);

/* ---------- DELETE TEMPLATE ---------- */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const result = await req.app.locals.db.runAsync(
      'DELETE FROM user_templates WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    if (result.changes === 0) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

/* ---------- PREVIEW TEMPLATE ---------- */
router.get('/:id/preview', verifyToken, async (req, res) => {
  try {
    const t = await req.app.locals.db.getAsync(
      'SELECT html_template, stylesheet FROM user_templates WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.userId]
    );
    if (!t) return res.status(404).json({ error: 'Template not found' });

    const Mustache = require('mustache');
    const sampleData = {
      firstName: 'Jane', lastName: 'Doe', jobTitle: 'Software Engineer',
      email: 'jane@example.com', phone: '+1 555-0123', location: 'San Francisco, CA',
      summary: 'Passionate software engineer with 5+ years of experience.',
      experience: [{ title: 'Senior Developer', company: 'TechCorp', start: '2022', end: 'Present', description: 'Led a team of 6 engineers.' }],
      education: [{ degree: 'BSc Computer Science', school: 'MIT', year: '2019' }],
      skills: [{ name: 'React' }, { name: 'Node.js' }, { name: 'Python' }],
      languages: [{ name: 'English', level: 'Native' }],
    };
    const html = Mustache.render(t.html_template, sampleData);
    res.json({ html: `<style>${t.stylesheet}</style>${html}` });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Preview failed' });
  }
});

module.exports = router;
