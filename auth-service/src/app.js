const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/config');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const cardRoutes = require('./routes/card.routes');
const transactionRoutes = require('./routes/transaction.routes');
const { initSchema } = require('./database/mysql');

function createApp() {
  const app = express();

  // Security middleware with explicit CSP allowing only self-hosted scripts (no inline)
  app.use(helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "connect-src": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "frame-ancestors": ["'self'"],
      },
    },
  }));
  app.use(cors());

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting for API only
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later',
  });
  app.use('/v1/api', limiter);

  // Initialize database schema
  initSchema().catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });

  // API Routes
  app.use('/v1/api/auth', authRoutes);
  app.use('/v1/api/users', usersRoutes);

  // Register routes
app.use('/v1/api/cards', cardRoutes);
app.use('/v1/api/transactions', transactionRoutes);
app.use('/v1/api/users', usersRoutes);

  // Serve static frontend files (index.html, register.html, dashboard.html) from project root
  const staticDir = path.join(__dirname, '..');
  app.use((req, res, next) => {
    // Skip static handling for API routes
    if (req.path.startsWith('/v1/api')) return next();
    return next();
  }, express.static(staticDir, { index: false }));

  // Explicit routes for HTML pages
  app.get('/', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
  app.get('/index.html', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
  app.get('/register.html', (req, res) => {
    res.sendFile(path.join(staticDir, 'register.html'));
  });
  app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(staticDir, 'dashboard.html'));
  });

  // Basic health endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 404 handler (API and static)
  app.use((req, res) => {
    if (req.path.startsWith('/v1/api')) {
      return res.status(404).json({
        status: 'error',
        message: 'Route not found',
        timestamp: new Date().toISOString(),
      });
    }
    res.status(404).send('Page not found');
  });

  return app;
}

module.exports = createApp;
module.exports = createApp;