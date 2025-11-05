const express = require('express');
const authService = require('../services/auth.service');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const data = req.body;
    const result = await authService.register(data);

    res.status(201).json({
      status: 'success',
      data: result,
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      status: 'error',
      message: error.message || 'Registration failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const data = req.body;
    const result = await authService.login(data);

    res.status(200).json({
      status: 'success',
      data: result,
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      status: 'error',
      message: error.message || 'Login failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Refresh Token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required',
        timestamp: new Date().toISOString(),
      });
    }

    const tokens = await authService.refreshToken(refreshToken);

    res.status(200).json({
      status: 'success',
      data: { tokens },
      message: 'Token refreshed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: error.message || 'Token refresh failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// moved /me to users routes

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logout successful',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;