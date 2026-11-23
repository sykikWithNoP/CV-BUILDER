require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const authRoutes = require('./routes/auth');
const cvRoutes = require('./routes/cv');
const adminRoutes = require('./routes/admin');
const userTemplateRoutes = require('./routes/user-templates');
const orgRoutes = require('./routes/organizations');
const cookieRoutes = require('./routes/cookie');
const aiRoutes = require('./routes/ai');
const { csrfProtection, csrfTokenRoute } = require('./middleware/csrf');

const app = express();

/* ---------- SECURITY HEADERS (Issue 31) ---------- */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.google.com/recaptcha/'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        objectSrc: ["'none'"],
        frameAncestors: ["'self'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hidePoweredBy: true,
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
    xssFilter: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
  })
);

// Additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  // Only API responses are uncacheable. Applying no-store to everything also hit
  // /uploads, so avatars were re-downloaded on every render despite their maxAge.
  if (!req.path.startsWith('/uploads')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  // Generate request ID for tracing
  req.requestId = crypto.randomBytes(8).toString('hex');
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

/* ---------- CORS ---------- */
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    // X-CSRF-Token must be allowed or every cross-origin write is blocked by the
    // browser before it reaches the CSRF middleware.
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  })
);

/* ---------- BODY PARSING (with size limits) ---------- */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

/* ---------- CSRF PROTECTION (Issue 8) ---------- */
app.use(csrfProtection);
app.get('/api/auth/csrf-token', csrfTokenRoute);

/* ---------- STATIC FILES ---------- */
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  dotfiles: 'deny',
  index: false,
}));

/* ---------- RATE LIMITING ---------- */
// Global rate limit
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_, res) => res.status(429).json({ error: 'Too many requests' }),
  })
);

// Stricter limit for sensitive routes
const sensitiveRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  handler: (_, res) => res.status(429).json({ error: 'Too many requests to this endpoint' }),
});
app.use('/api/cv/download', sensitiveRateLimit);
app.use('/api/cv/upload-avatar', sensitiveRateLimit);

/* ---------- REQUEST SANITIZATION (Anti-XSS/Injection) ---------- */
app.use((req, res, next) => {
  // Block requests with suspicious patterns in query/params
  const suspicious = /(<script|javascript:|on\w+=|eval\(|document\.|window\.|alert\()/i;
  const url = req.originalUrl || '';
  if (suspicious.test(url)) {
    return res.status(400).json({ error: 'Malicious request detected' });
  }
  // Block null bytes (used in some injection attacks)
  if (url.includes('\0') || url.includes('%00')) {
    return res.status(400).json({ error: 'Invalid request' });
  }
  next();
});

/* ---------- DATABASE (sqlite3 with promise helpers) ---------- */
const dbPath = path.join(__dirname, 'cv_builder.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database.');
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  const schemaPath = path.join(__dirname, 'db', 'schema_sqlite.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema, (err) => {
    if (err) console.error('Schema error:', err.message);
    else {
      console.log('✅ Database schema initialized.');
      // Migrations (safe — ALTER errors ignored for existing columns)
      db.run('ALTER TABLE users ADD COLUMN college_affiliation TEXT DEFAULT NULL', () => {});
      db.run('ALTER TABLE users ADD COLUMN org_id INTEGER', () => {});
      db.run('ALTER TABLE users ADD COLUMN is_premium BOOLEAN DEFAULT 0', () => {});
      db.run('ALTER TABLE users ADD COLUMN theme_preference TEXT DEFAULT "system"', () => {});
      db.run('ALTER TABLE cv_templates ADD COLUMN is_premium BOOLEAN DEFAULT 0', () => {});
      db.run('ALTER TABLE cv_templates ADD COLUMN required_plan TEXT DEFAULT "free"', () => {});
      // A CV can now be bound to one of the user's own saved designs instead of
      // a built-in template.
      db.run('ALTER TABLE cvs ADD COLUMN user_template_id INTEGER REFERENCES user_templates(id)', () => {});
      // Email verification by 6-digit code, alongside the existing link.
      db.run('ALTER TABLE email_verifications ADD COLUMN otp_code TEXT', () => {});
      // Apply template updates
      const updatePath = path.join(__dirname, 'db', 'update_templates.sql');
      if (fs.existsSync(updatePath)) {
        const updateSQL = fs.readFileSync(updatePath, 'utf8');
        db.exec(updateSQL, (err2) => {
          if (err2) console.error('Template update error:', err2.message);
          else console.log('✅ Templates updated.');
        });
      }
    }
  });
});

// Promise wrappers
db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });
};
db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });
};
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

app.locals.db = db;

/* ---------- ROUTES ---------- */
app.use('/api/auth', authRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/user-templates', userTemplateRoutes);
app.use('/api/organizations', orgRoutes);
app.use('/api/cookie', cookieRoutes);
app.use('/api/ai', aiRoutes);

/* ---------- HEALTH CHECK ---------- */
app.get('/api/health', (_, res) => res.json({ status: 'ok', uptime: process.uptime() }));

/* ---------- 404 ---------- */
app.use((_, res) => res.status(404).json({ error: 'Not found' }));

/* ---------- GLOBAL ERROR HANDLER ---------- */
app.use((err, req, res, _next) => {
  console.error(`[${req.requestId}] Unhandled error:`, err.message);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ---------- GRACEFUL SHUTDOWN ---------- */
process.on('SIGINT', () => {
  db.close(() => {
    console.log('Database connection closed.');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

/* ---------- START ---------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server listening on ${PORT}`));
