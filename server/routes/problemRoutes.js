const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');
const AdminPasskey = require('../models/AdminPasskey');
const adminAuth = require('../middleware/adminAuth');
const { hashPasskey, verifyPasskey } = require('../utils/cryptoUtils');

// ─── PASSKEY MANAGEMENT ROUTES ───────────────────────────────────────────────

// GET /api/problems/passkey-status — check if the passkey has been set up in MongoDB
router.get('/passkey-status', async (req, res) => {
  try {
    const count = await AdminPasskey.countDocuments();
    res.json({ isSetup: count > 0 });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/problems/setup-passkey — first-time passkey setup ONLY
// Once created, nobody else can ever call this endpoint to create or overwrite it!
router.post('/setup-passkey', async (req, res) => {
  try {
    const count = await AdminPasskey.countDocuments();
    if (count > 0) {
      return res.status(403).json({
        message: 'Admin passkey has already been created. Nobody else can create it.',
      });
    }

    const { passkey } = req.body;
    if (!passkey || typeof passkey !== 'string' || passkey.trim().length < 4) {
      return res.status(400).json({
        message: 'Passkey must be at least 4 characters long.',
      });
    }

    const { salt, hash } = hashPasskey(passkey.trim());
    await AdminPasskey.create({
      passkeyHash: hash,
      salt,
    });

    res.status(201).json({
      success: true,
      message: 'Admin passkey created and saved securely in MongoDB.',
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create passkey', error: err.message });
  }
});

// POST /api/problems/verify-passkey — validate passkey against MongoDB
router.post('/verify-passkey', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let passkey = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      passkey = authHeader.split(' ')[1];
    } else if (req.body && req.body.passkey) {
      passkey = req.body.passkey;
    }

    if (!passkey) {
      return res.status(401).json({ valid: false, message: 'No passkey provided.' });
    }

    const admin = await AdminPasskey.findOne();
    if (!admin) {
      return res.status(400).json({
        valid: false,
        notSetup: true,
        message: 'Admin passkey has not been created yet.',
      });
    }

    const isValid = verifyPasskey(passkey, admin.salt, admin.passkeyHash);
    if (isValid) {
      return res.json({ valid: true });
    }

    return res.status(403).json({ valid: false, message: 'Invalid passkey.' });
  } catch (err) {
    res.status(500).json({ valid: false, message: 'Verification error', error: err.message });
  }
});

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// GET all problems (with optional search & rating filter)
router.get('/', async (req, res) => {
  try {
    const { search, rating, tag } = req.query;
    const query = {};

    if (rating) query.rating = Number(rating);
    if (tag) query.tags = { $in: [tag] };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const problems = await Problem.find(query).sort({ rating: 1, createdAt: -1 });
    res.json(problems);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET a single problem by ID
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found.' });
    res.json(problem);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── ADMIN-PROTECTED ROUTES ───────────────────────────────────────────────────

// POST — create a new problem
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, url, rating, tags } = req.body;
    const problem = new Problem({ name, url, rating, tags });
    await problem.save();
    res.status(201).json(problem);
  } catch (err) {
    res.status(400).json({ message: 'Validation error', error: err.message });
  }
});

// PUT — update a problem
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, url, rating, tags } = req.body;
    const problem = await Problem.findByIdAndUpdate(
      req.params.id,
      { name, url, rating, tags },
      { new: true, runValidators: true }
    );
    if (!problem) return res.status(404).json({ message: 'Problem not found.' });
    res.json(problem);
  } catch (err) {
    res.status(400).json({ message: 'Validation error', error: err.message });
  }
});

// DELETE — remove a problem
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ message: 'Problem not found.' });
    res.json({ message: 'Problem deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
