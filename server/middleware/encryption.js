const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error('ENCRYPTION_KEY not set');
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt plaintext with AES-256-GCM
 * Returns: iv:authTag:ciphertext (hex encoded)
 */
function encrypt(plaintext) {
  if (!plaintext) return plaintext;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM ciphertext
 */
function decrypt(ciphertext) {
  if (!ciphertext || !ciphertext.includes(':')) return ciphertext;
  try {
    const key = getKey();
    const [ivHex, authTagHex, encryptedHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (e) {
    // If decryption fails, return original (might be unencrypted legacy data)
    return ciphertext;
  }
}

/**
 * SHA-256 hash for indexed lookups (e.g., email search)
 */
function hashForLookup(value) {
  if (!value) return value;
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
}

/**
 * Generate a secure random token
 */
function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = { encrypt, decrypt, hashForLookup, generateToken, generateOTP };
