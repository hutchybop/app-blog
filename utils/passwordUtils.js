const bcrypt = require("bcrypt");
const crypto = require("crypto");

class PasswordUtils {
  static async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateResetToken() {
    return crypto.randomBytes(20).toString("hex");
  }

  static generateResetTokenExpiry() {
    return Date.now() + 3600000; // 1 hour
  }
}

module.exports = PasswordUtils;