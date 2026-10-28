const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Problem = require('../models/Problem');
const userAuth = require('../middleware/userAuth');
const { hashPassword, verifyPassword, generateToken } = require('../utils/authUtils');

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters.' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores.' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const existing = await User.findOne({ username: cleanUsername });
    if (existing) {
      return res.status(409).json({ message: 'Username is already taken. Please choose another.' });
    }

    const { salt, hash } = hashPassword(password);
    const user = await User.create({
      username: cleanUsername,
      passwordHash: hash,
      salt,
      solvedProblems: [],
    });

    const token = generateToken({ userId: user._id, username: user.username });
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        solvedProblems: user.solvedProblems,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = await User.findOne({ username: cleanUsername });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const isValid = verifyPassword(password, user.salt, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = generateToken({ userId: user._id, username: user.username });
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        solvedProblems: user.solvedProblems,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', userAuth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        username: req.user.username,
        solvedProblems: req.user.solvedProblems,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch user profile', error: err.message });
  }
});

// ─── POST /api/auth/toggle-solve/:problemId ──────────────────────────────────
router.post('/toggle-solve/:problemId', userAuth, async (req, res) => {
  try {
    const { problemId } = req.params;
    const user = req.user;

    const existingIndex = user.solvedProblems.findIndex(
      (id) => id.toString() === problemId.toString()
    );

    let isSolved = false;
    if (existingIndex > -1) {
      user.solvedProblems.splice(existingIndex, 1);
      isSolved = false;
    } else {
      user.solvedProblems.push(problemId);
      isSolved = true;
    }

    await user.save();

    res.json({
      success: true,
      isSolved,
      solvedProblems: user.solvedProblems,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update solved status', error: err.message });
  }
});

// ─── POST /api/auth/sync-solved ──────────────────────────────────────────────
router.post('/sync-solved', userAuth, async (req, res) => {
  try {
    const { solvedIds = [] } = req.body;
    const user = req.user;

    if (Array.isArray(solvedIds) && solvedIds.length > 0) {
      const currentSet = new Set(user.solvedProblems.map((id) => id.toString()));
      let updated = false;

      for (const id of solvedIds) {
        if (id && !currentSet.has(id.toString())) {
          user.solvedProblems.push(id);
          currentSet.add(id.toString());
          updated = true;
        }
      }

      if (updated) {
        await user.save();
      }
    }

    res.json({
      success: true,
      solvedProblems: user.solvedProblems,
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to sync solved problems', error: err.message });
  }
});

module.exports = router;

