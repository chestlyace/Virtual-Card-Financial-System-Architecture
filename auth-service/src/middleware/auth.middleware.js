const JwtUtil = require('../utils/jwt.util');
const userRepo = require('../database/user.repository');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided',
        timestamp: new Date().toISOString(),
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = JwtUtil.verifyToken(token);

    // Check if user exists
    const user = await userRepo.findById(payload.userId);
    if (!user || user.account_status !== 'active') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token or user not found',
        timestamp: new Date().toISOString(),
      });
    }

    // Attach user to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired token',
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = authMiddleware;