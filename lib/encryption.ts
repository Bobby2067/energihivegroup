/**
 * Encryption Utilities
 *
 * AES-256-GCM encryption for sensitive data like battery API credentials
 * Uses a 32-byte encryption key from environment variables
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 16 bytes for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM auth tag
const SALT_LENGTH = 64; // 64 bytes for salt

/**
 * Get encryption key from environment
 * The key should be a 64-character hex string (32 bytes)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }

  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 characters (32 bytes hex)');
  }

  return Buffer.from(key, 'hex');
}

/**
 * Generate a new encryption key (for initial setup)
 *
 * @returns 64-character hex string suitable for ENCRYPTION_KEY
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypt sensitive data
 *
 * @param data - Plain text data to encrypt
 * @returns Encrypted data as base64 string (includes IV and auth tag)
 */
export function encrypt(data: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    const combined = Buffer.concat([
      iv,
      authTag,
      Buffer.from(encrypted, 'hex'),
    ]);

    return combined.toString('base64');
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt sensitive data
 *
 * @param encryptedData - Encrypted data as base64 string
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');

    // Extract IV, auth tag, and encrypted data
    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt JSON object (for battery API credentials)
 *
 * @param data - Object to encrypt
 * @returns Encrypted data as base64 string
 */
export function encryptJSON<T>(data: T): string {
  return encrypt(JSON.stringify(data));
}

/**
 * Decrypt JSON object
 *
 * @param encryptedData - Encrypted data as base64 string
 * @returns Decrypted object
 */
export function decryptJSON<T>(encryptedData: string): T {
  const decrypted = decrypt(encryptedData);
  return JSON.parse(decrypted) as T;
}

/**
 * Helper to encrypt battery API credentials before storing in database
 *
 * @param credentials - Battery API credentials object
 * @returns Encrypted credentials as base64 string
 */
export function encryptBatteryCredentials(credentials: Record<string, any>): string {
  if (!credentials || Object.keys(credentials).length === 0) {
    throw new Error('Cannot encrypt empty credentials');
  }

  return encryptJSON(credentials);
}

/**
 * Helper to decrypt battery API credentials from database
 *
 * @param encryptedCredentials - Encrypted credentials as base64 string
 * @returns Decrypted credentials object
 */
export function decryptBatteryCredentials(encryptedCredentials: string): Record<string, any> {
  if (!encryptedCredentials) {
    throw new Error('Cannot decrypt empty credentials');
  }

  return decryptJSON<Record<string, any>>(encryptedCredentials);
}

/**
 * Check if data appears to be encrypted
 *
 * @param data - String to check
 * @returns True if data looks like it's encrypted
 */
export function isEncrypted(data: string): boolean {
  try {
    // Try to decode as base64
    const buffer = Buffer.from(data, 'base64');

    // Check if it's a valid base64 string and has minimum length
    const minLength = IV_LENGTH + AUTH_TAG_LENGTH + 16; // IV + tag + min encrypted data
    return buffer.length >= minLength && buffer.toString('base64') === data;
  } catch {
    return false;
  }
}
