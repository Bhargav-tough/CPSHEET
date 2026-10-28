const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'cpsheet_auth_super_secret_jwt_key_2026';

/**
 * Hashes a password using crypto.scrypt with a random 16-byte salt.
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

/**
 * Verifies password against stored salt and hash using timingSafeEqual.
 */
function verifyPassword(password, salt, storedHash) {
  try {
    if (!password || !salt || !storedHash) return false;
    const computedHash = crypto.scryptSync(password, salt, 64).toString('hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (computedBuffer.length !== storedBuffer.length) return false;
    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generates an HMAC-SHA256 signed JWT token without external dependencies.
 */
function generateToken(payload, expiresInDays = 30) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expiresInDays * 24 * 60 * 60;
  const fullPayload = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${fullPayload}`)
    .digest('base64url');
  return `${header}.${fullPayload}.${signature}`;
}

/**
 * Verifies an HMAC-SHA256 signed JWT token.
 * Returns decoded payload if valid, null otherwise.
 */
function verifyToken(token) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${payload}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expSigBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return null;
    }

    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }
    return decoded;
  } catch {
    return null;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
};

