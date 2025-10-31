const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/config');
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const { initSchema } = require('./database/mysql');

function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors());

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: 'Too many requests from this IP, please try again later',
  });
  app.use('/v1/api/', limiter);

  

  // Initialize database schema
  initSchema().catch((err) => {
    console.error('Failed to initialize database schema:', err);
    process.exit(1);
  });

  // API Routes
  app.use('/v1/api/auth', authRoutes);
  app.use('/v1/api/users', usersRoutes);

  // Serve the frontend HTML page
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      status: 'error',
      message: 'Route not found',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

module.exports = createApp;