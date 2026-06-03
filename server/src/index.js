require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes       = require('./routes/auth');
const businessRoutes   = require('./routes/businesses');
const slotRoutes       = require('./routes/slots');
const bookingRoutes    = require('./routes/bookings');
const queueRoutes      = require('./routes/queue');
const analyticsRoutes  = require('./routes/analytics');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/slots',      slotRoutes);
app.use('/api/bookings',   bookingRoutes);
app.use('/api/queue',      queueRoutes);
app.use('/api/analytics',  analyticsRoutes);

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const { initWhatsApp } = require('./services/whatsappService');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (process.env.ENABLE_LOCAL_WHATSAPP === 'true') {
    initWhatsApp();
  }
});
