const bcrypt = require('bcryptjs');
const config = require('../config/config');

class PasswordUtil {
  static async hash(password) {
    return bcrypt.hash(password, config.bcrypt.saltRounds);
  }

  static async compare(password, hash) {
    return bcrypt.compare(password, hash);
  }

  static validate(password) {
    const errors = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*]/.test(password)) {
      errors.push('Password must contain at least one special character (!@#$%^&*)');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

module.exports = PasswordUtil;