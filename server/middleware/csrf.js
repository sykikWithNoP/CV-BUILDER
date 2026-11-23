const crypto = require('crypto');

/**
 * CSRF Protection via Double-Submit Cookie Pattern.
 * - On GET /api/auth/csrf-token: sets a CSRF cookie and returns the token.
 * - On state-changing requests (POST/PUT/DELETE): validates X-CSRF-Token header matches cookie.
 */

function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

function csrfProtection(req, res, next) {
  // Skip for safe methods and specific endpoints
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  // Exact paths only: a prefix match let '/api/auth/verify' wave through
  // anything starting with it, such as '/api/auth/verify-code'.
  const skipPaths = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/forgot-password',
    '/api/auth/resend-verification',
    '/api/cookie/consent',
    '/api/organizations/request-affiliation',
  ];

  if (safeMethods.includes(req.method)) return next();
  if (skipPaths.includes(req.path)) return next();

  const cookieToken = req.cookies?.csrf_token;
  const headerToken = req.headers['x-csrf-token'];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }

  next();
}

function csrfTokenRoute(req, res) {
  const token = generateCsrfToken();
  res.cookie('csrf_token', token, {
    httpOnly: false, // Must be readable by JS
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });
  res.json({ csrfToken: token });
}

module.exports = { csrfProtection, csrfTokenRoute };
