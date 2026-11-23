const express = require('express');
const router = express.Router();
const Mustache = require('mustache');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');
const { buildTemplateData, sanitizeValue, normalizeTemplate } = require('../utils/cvData');

const uploadDir = path.join(__dirname, '..', 'uploads', 'avatars');
fs.mkdirSync(uploadDir, { recursive: true });

// Extension comes from the declared image type, never from the uploaded
// filename — an upload called "x.html" used to keep that extension on disk.
const IMAGE_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadDir),
  filename: (_, file, cb) => cb(null, `${uuidv4()}${IMAGE_EXTENSIONS[file.mimetype] || '.img'}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_, file, cb) => {
    if (IMAGE_EXTENSIONS[file.mimetype]) cb(null, true);
    else cb(new Error('Only JPG, PNG, GIF or WebP images are allowed'));
  },
});

function requireVerified(req, res, next) {
  if (!req.user?.verified) return res.status(403).json({ error: 'Account not verified' });
  next();
}

/**
 * Convert a local avatar path to a base64 data URI.
 * This is essential for Puppeteer PDF rendering since it can't resolve local paths.
 */
function avatarToBase64(avatarUrl) {
  if (!avatarUrl) return null;
  // Already a data URI or external URL
  if (avatarUrl.startsWith('data:') || avatarUrl.startsWith('http')) return avatarUrl;
  // Local path like /uploads/avatars/xxx.jpg
  const localPath = path.join(__dirname, '..', avatarUrl);
  try {
    if (fs.existsSync(localPath)) {
      const data = fs.readFileSync(localPath);
      const ext = path.extname(localPath).toLowerCase();
      const mime = ext === '.png' ? 'image/png'
        : ext === '.gif' ? 'image/gif'
        : ext === '.webp' ? 'image/webp'
        : 'image/jpeg';
      return `data:${mime};base64,${data.toString('base64')}`;
    }
  } catch (e) {
    console.error('Avatar base64 conversion failed:', e.message);
  }
  return avatarUrl;
}

/* ---------- TEMPLATE LIST ---------- */
router.get('/templates', async (req, res) => {
  try {
    const rows = await req.app.locals.db.allAsync(
      'SELECT id, name, preview_img, description, COALESCE(is_premium, 0) as is_premium, COALESCE(required_plan, \'free\') as required_plan FROM cv_templates WHERE is_active = 1'
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load templates' }); }
});

/**
 * A CV is rendered either with a built-in template or with one of the user's own
 * saved designs. Both paths end up here, and a user template is only ever loaded
 * for the user who owns it.
 */
async function loadTemplate(db, { templateId, userTemplateId, userId }) {
  if (userTemplateId) {
    const row = await db.getAsync(
      'SELECT name, html_template, stylesheet, config FROM user_templates WHERE id = ? AND user_id = ?',
      [userTemplateId, userId]
    );
    if (!row) return null;
    let print = {};
    try { print = (JSON.parse(row.config) || {}).print || {}; } catch { /* config is optional */ }
    return { name: row.name, html_template: row.html_template, stylesheet: row.stylesheet, print };
  }
  const row = await db.getAsync(
    'SELECT name, html_template, stylesheet FROM cv_templates WHERE id = ? AND is_active = 1',
    [templateId]
  );
  return row || null;
}

/* ---------- MY CV ---------- */
router.get('/my', verifyToken, async (req, res) => {
  try {
    const row = await req.app.locals.db.getAsync(
      'SELECT id, template_id, user_template_id, data FROM cvs WHERE user_id = ? LIMIT 1',
      [req.user.userId]
    );
    if (!row) return res.json(null);
    res.json({
      id: row.id,
      template_id: row.template_id,
      user_template_id: row.user_template_id || null,
      data: JSON.parse(row.data),
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load CV' }); }
});

/* ---------- SAVE CV ---------- */
router.post(
  '/save',
  verifyToken,
  [
    body('templateId').optional({ nullable: true }).isInt(),
    body('userTemplateId').optional({ nullable: true }).isInt(),
    body('data').isObject(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { data } = req.body;
    const userTemplateId = req.body.userTemplateId || null;
    const templateId = userTemplateId ? null : req.body.templateId || null;
    if (!templateId && !userTemplateId) {
      return res.status(400).json({ error: 'Choose a template first' });
    }

    const db = req.app.locals.db;
    try {
      // Never let a CV point at someone else's saved design.
      const template = await loadTemplate(db, { templateId, userTemplateId, userId: req.user.userId });
      if (!template) return res.status(404).json({ error: 'Template not found' });

      const jsonStr = JSON.stringify(sanitizeValue(data));
      const updated = await db.runAsync(
        `UPDATE cvs SET template_id=?,user_template_id=?,data=?,updated_at=datetime('now') WHERE user_id=?`,
        [templateId, userTemplateId, jsonStr, req.user.userId]
      );
      if (updated.changes === 0) {
        await db.runAsync(
          `INSERT INTO cvs (user_id,template_id,user_template_id,data,created_at,updated_at) VALUES (?,?,?,?,datetime('now'),datetime('now'))`,
          [req.user.userId, templateId, userTemplateId, jsonStr]
        );
      }
      res.json({ message: 'CV saved' });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to save CV' }); }
  }
);

/* ---------- CV PREVIEW (HTML) ---------- */
router.get('/preview', verifyToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const cv = await db.getAsync(
      'SELECT data, template_id, user_template_id FROM cvs WHERE user_id = ?',
      [req.user.userId]
    );
    if (!cv) return res.status(404).json({ error: 'No CV found' });

    const template = await loadTemplate(db, {
      templateId: cv.template_id,
      userTemplateId: cv.user_template_id,
      userId: req.user.userId,
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const data = JSON.parse(cv.data);

    // Resolve avatar to full URL for preview
    let avatar = data.avatar;
    if (avatar && !avatar.startsWith('data:') && !avatar.startsWith('http')) {
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
      avatar = `${baseUrl}${avatar}`;
    }

    const html = Mustache.render(normalizeTemplate(template.html_template), buildTemplateData(data, { avatar }));
    res.json({ html: `<style>${template.stylesheet}</style>${html}` });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Preview failed' }); }
});

/* ---------- TEMPLATE PREVIEW (by ID, no auth) ---------- */
router.get('/template-preview/:id', async (req, res) => {
  try {
    const t = await req.app.locals.db.getAsync('SELECT html_template, stylesheet FROM cv_templates WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!t) return res.status(404).json({ error: 'Template not found' });
    const sampleData = { firstName: 'Jane', lastName: 'Doe', jobTitle: 'Software Engineer', email: 'jane@example.com', phone: '+1 555-0123', location: 'San Francisco, CA', summary: 'Passionate software engineer with 5+ years of experience building modern web applications.', experience: [{ title: 'Senior Developer', company: 'TechCorp', start: '2022', end: 'Present', description: 'Led a team of 6 engineers building microservices.' }], education: [{ degree: 'BSc Computer Science', school: 'MIT', year: '2019' }], skills: [{ name: 'React' }, { name: 'Node.js' }, { name: 'Python' }, { name: 'AWS' }], languages: [{ name: 'English', level: 'Native' }, { name: 'Spanish', level: 'Conversational' }] };
    const html = Mustache.render(normalizeTemplate(t.html_template), buildTemplateData(sampleData));
    res.json({ html: `<style>${t.stylesheet}</style>${html}` });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Preview failed' }); }
});

/* ---------- RAW TEMPLATE (for client-side live preview) ---------- */
router.get('/template-raw/:id', async (req, res) => {
  try {
    const t = await req.app.locals.db.getAsync('SELECT html_template, stylesheet FROM cv_templates WHERE id = ? AND is_active = 1', [req.params.id]);
    if (!t) return res.status(404).json({ error: 'Template not found' });
    res.json({ html_template: t.html_template, stylesheet: t.stylesheet });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to load template' }); }
});

/* ---------- DOWNLOAD PDF ---------- */
router.get('/download/:cvId', verifyToken, requireVerified, async (req, res) => {
  let browser = null;
  try {
    const db = req.app.locals.db;
    const row = await db.getAsync(
      'SELECT data, template_id, user_template_id FROM cvs WHERE id = ? AND user_id = ?',
      [req.params.cvId, req.user.userId]
    );
    if (!row) return res.status(404).json({ error: 'CV not found' });

    const template = await loadTemplate(db, {
      templateId: row.template_id,
      userTemplateId: row.user_template_id,
      userId: req.user.userId,
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const data = JSON.parse(row.data);

    // Puppeteer can't resolve local paths, so inline the avatar as a data URI.
    const renderData = buildTemplateData(data, {
      avatar: data.avatar ? avatarToBase64(data.avatar) : data.avatar,
    });
    const { color1, color2 } = renderData;

    const html = Mustache.render(normalizeTemplate(template.html_template), renderData);

    // Keep a job, degree or list row whole across a page break. Custom designs
    // ship these rules themselves; built-in templates never had them, so an
    // entry could be sliced in half by the page edge.
    const printRules = '.cv-entry,.cv-list li,.cv-skill,.cv-hobby{break-inside:avoid;page-break-inside:avoid}'
      + '.cv-title{break-after:avoid;page-break-after:avoid}'
      + '.cv-header{break-after:avoid;page-break-after:avoid}';

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${template.stylesheet}</style>`
      + `<style>:root,.cv-root{--cv-c1:${color1};--cv-c2:${color2}}</style>`
      + `<style>${printRules}</style></head><body>${html}</body></html>`;

    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      timeout: 30000,
    });
    const page = await browser.newPage();
    await page.setContent(fullHtml, { waitUntil: 'networkidle0', timeout: 15000 });

    // A saved design carries its own page size and margins; built-in templates
    // keep the previous defaults.
    const print = template.print || {};
    const margin = Number.isFinite(print.margin) ? `${print.margin}mm` : null;
    const pdf = await page.pdf({
      format: print.size === 'letter' ? 'Letter' : 'A4',
      printBackground: true,
      margin: margin
        ? { top: margin, bottom: margin, left: margin, right: margin }
        : { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' },
    });
    await browser.close();
    browser = null;

    // Set headers BEFORE sending data
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CV_${req.params.cvId}.pdf"`);
    res.setHeader('Content-Length', pdf.length);
    res.end(pdf);
  } catch (err) {
    console.error('PDF generation error:', err);
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate PDF: ' + err.message });
    }
  }
});

/* ---------- UPLOAD AVATAR ---------- */
// Multer's own errors are handled here so a rejected file answers with a clear
// 400 instead of falling through to the generic 500 handler.
router.post('/upload-avatar', verifyToken, (req, res) => {
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Image must be 2 MB or smaller'
        : err.message || 'Avatar upload failed';
      return res.status(400).json({ error: message });
    }
    if (!req.file) return res.status(400).json({ error: 'No image received' });
    res.json({ url: `/uploads/avatars/${req.file.filename}` });
  });
});

module.exports = router;
