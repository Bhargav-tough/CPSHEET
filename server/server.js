require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const problemRoutes = require('./routes/problemRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL.replace(/\/+$/, ''), 'http://localhost:5173']
  : '*';

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/problems', problemRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.send('CP Sheet API is running.'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() }));

// ─── MongoDB Connection ───────────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
