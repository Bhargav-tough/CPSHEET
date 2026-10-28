const { verifyToken } = require('../utils/authUtils');
const User = require('../models/User');

/**
 * Middleware that authenticates a regular user via JWT Bearer token.
 * Populates req.user.
 */
const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please sign in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ message: 'Invalid or expired session. Please sign in again.' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User account not found.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Authentication error', error: err.message });
  }
};

module.exports = userAuth;

