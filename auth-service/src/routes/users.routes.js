const express = require('express');
const authMiddleware = require('../middleware/auth.middleware');
const authService = require('../services/auth.service');

const router = express.Router();

// Current authenticated user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await authService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found',
        timestamp: new Date().toISOString(),
      });
    }
    res.status(200).json({
      status: 'success',
      data: { user },
      message: 'User retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to retrieve user',
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;


