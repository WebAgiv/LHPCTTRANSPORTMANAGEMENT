'use strict';
require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');
const rateLimit  = require('express-rate-limit');
const logger     = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Initialize DB pool (tests connection on startup)
require('./config/db');

const app = express();

// ── Security & Parsing ───────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true, methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ───────────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: msg => logger.http(msg.trim()) } }));

// ── Rate Limiting ─────────────────────────────────────────────────
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 500, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests. Please wait 15 minutes.' } }));
app.use('/api/auth/login', rateLimit({ windowMs: 15*60*1000, max: 20, message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' } }));

// ── Static Files ──────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', '..', 'uploads')));
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// ── API Routes ────────────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/dashboard',    require('./routes/dashboard'));
app.use('/api/students',     require('./routes/students'));
app.use('/api/routes',       require('./routes/routes'));
app.use('/api/buses',        require('./routes/buses'));
app.use('/api/drivers',      require('./routes/drivers'));
app.use('/api/payments',     require('./routes/payments'));
app.use('/api/expenses',     require('./routes/expenses'));
app.use('/api/notices',      require('./routes/notices'));
app.use('/api/security',     require('./routes/security'));
app.use('/api/reports',      require('./routes/reports'));
app.use('/api/activity',     require('./routes/activity'));
app.use('/api/fare-matrix',  require('./routes/fareMatrix'));

// ── Health Check ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  success: true,
  service: 'AITRC Vita Transport ERP',
  version: '4.0.0',
  status:  'running',
  time:    new Date().toISOString(),
  node:    process.version,
}));

// ── SPA Fallback ──────────────────────────────────────────────────
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html'))
);

// ── Error Handling ────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000');
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('════════════════════════════════════════════════');
  logger.info(`🚌  AITRC Transport ERP v4.0 started`);
  logger.info(`📊  Dashboard  : http://localhost:${PORT}`);
  logger.info(`🔌  API Base   : http://localhost:${PORT}/api`);
  logger.info(`🏥  Health     : http://localhost:${PORT}/api/health`);
  logger.info(`🌍  Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGTERM', () => { logger.info('SIGTERM received. Shutting down gracefully...'); server.close(() => { logger.info('Server closed'); process.exit(0); }); });
process.on('SIGINT',  () => { logger.info('SIGINT received. Shutting down...'); server.close(() => { process.exit(0); }); });

module.exports = app;
