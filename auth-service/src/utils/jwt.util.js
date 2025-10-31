const jwt = require('jsonwebtoken');
const config = require('../config/config');

class JwtUtil {
  static generateAccessToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.accessExpiry,
    });
  }

  static generateRefreshToken(payload) {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.refreshExpiry,
    });
  }

  static generateTokenPair(userId, email) {
    const payload = { userId, email };
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

module.exports = JwtUtil;