const adminMiddleware = (req, res, next) => {
  // Check if user is authenticated (authMiddleware should run before this)
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
      timestamp: new Date().toISOString(),
    });
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      status: 'error',
      message: 'Admin access required',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};

module.exports = adminMiddleware;

