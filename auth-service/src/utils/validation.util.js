class ValidationUtil {
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static sanitizeInput(input) {
    return input.trim();
  }
}

module.exports = ValidationUtil;