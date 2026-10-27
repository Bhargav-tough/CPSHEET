const AdminPasskey = require('../models/AdminPasskey');
const { verifyPasskey } = require('../utils/cryptoUtils');

/**
 * Admin authentication middleware.
 * Reads the passkey from the Authorization header (Bearer token).
 * Validates against the securely hashed passkey saved in MongoDB.
 */
const adminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No passkey provided.' });
    }

    const passkey = authHeader.split(' ')[1];
    if (!passkey) {
      return res.status(401).json({ message: 'Unauthorized: Empty passkey provided.' });
    }

    const admin = await AdminPasskey.findOne();
    if (!admin) {
      return res.status(403).json({
        message: 'Forbidden: Admin passkey has not been created yet in the database.',
      });
    }

    const isValid = verifyPasskey(passkey, admin.salt, admin.passkeyHash);
    if (!isValid) {
      return res.status(403).json({ message: 'Forbidden: Invalid passkey.' });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      message: 'Server authentication error',
      error: err.message,
    });
  }
};

module.exports = adminAuth;
