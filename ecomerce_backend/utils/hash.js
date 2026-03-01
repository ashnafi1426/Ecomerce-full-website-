/**
 * PASSWORD HASHING UTILITIES
 * 
 * Uses bcrypt for secure password hashing.
 * bcrypt is slow by design to prevent brute force attacks.
 */

const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // Number of salt rounds (higher = more secure but slower)

/**
 * Hash a password
 * @param {String} password - Plain text password
 * @returns {Promise<String>} Hashed password
 */
const hashPassword = async (password) => {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    console.error('Password hashing failed:', error);
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare password with hash
 * @param {String} password - Plain text password
 * @param {String} hash - Hashed password from database
 * @returns {Promise<Boolean>} True if password matches, false otherwise
 */
const comparePassword = async (password, hash) => {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    console.error('Password comparison failed:', error);
    throw new Error('Password comparison failed');
  }
};

module.exports = {
  hashPassword,
  comparePassword
};
