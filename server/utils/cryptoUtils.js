const crypto = require('crypto');

/**
 * Hashes a passkey using crypto.scrypt with a random 16-byte salt.
 * @param {string} passkey
 * @returns {{ salt: string, hash: string }}
 */
function hashPasskey(passkey) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(passkey, salt, 64).toString('hex');
  return { salt, hash };
}

/**
 * Verifies a passkey against a stored salt and hash using timingSafeEqual.
 * @param {string} passkey
 * @param {string} salt
 * @param {string} storedHash
 * @returns {boolean}
 */
function verifyPasskey(passkey, salt, storedHash) {
  try {
    if (!passkey || !salt || !storedHash) return false;
    const computedHash = crypto.scryptSync(passkey, salt, 64).toString('hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (computedBuffer.length !== storedBuffer.length) return false;
    return crypto.timingSafeEqual(computedBuffer, storedBuffer);
  } catch {
    return false;
  }
}

module.exports = {
  hashPasskey,
  verifyPasskey,
};
