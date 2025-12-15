/**
 * Password Hashing Utilities
 *
 * Secure password hashing using bcryptjs with proper salt rounds
 */

import bcrypt from 'bcryptjs';

// Use 12 rounds for bcrypt (secure but not too slow)
const SALT_ROUNDS = 12;

/**
 * Hash a plain text password
 *
 * @param password - Plain text password (min 8 characters)
 * @returns Bcrypt hash string
 */
export async function hashPassword(password: string): Promise<string> {
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }

  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns True if password matches hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if password meets security requirements
 *
 * @param password - Password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { valid: false, error: 'Password must be less than 128 characters' };
  }

  // Check for at least one uppercase, one lowercase, one number
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasNumber) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    };
  }

  return { valid: true };
}
