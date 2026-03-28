const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const path    = require('path');
require('dotenv').config();

const studentRoutes = require('./routes/studentRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ─── Serve Frontend static files (Tier 1) ─────────────────────────
app.use(express.static(path.join(__dirname, '../../frontend')));

// ─── API Routes (Tier 2) ──────────────────────────────────────────
app.use('/api/students', studentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Catch-all: send frontend index for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../frontend', 'index.html'));
});

// ─── Error handler ─────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start Server ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API base URL : http://localhost:${PORT}/api/students`);
  console.log(`💊 Health check : http://localhost:${PORT}/api/health`);
  console.log(`🌐 Frontend     : http://localhost:${PORT}\n`);
});

module.exports = app;
