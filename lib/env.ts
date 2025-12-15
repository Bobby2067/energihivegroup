/**
 * Environment Variable Validation
 *
 * Validates all required environment variables at startup
 * Prevents deployment with missing or invalid configuration
 */

import { z } from 'zod';

// Define schema for all environment variables
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),

  // NextAuth
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  NEXTAUTH_SECRET: z
    .string()
    .min(32, 'NEXTAUTH_SECRET must be at least 32 characters for security'),

  // Email (optional in development, required in production)
  EMAIL_SERVER_HOST: z.string().optional(),
  EMAIL_SERVER_PORT: z.coerce.number().optional(),
  EMAIL_SERVER_USER: z.string().optional(),
  EMAIL_SERVER_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),

  // Australian Payment Systems
  BPAY_BILLER_CODE: z.string().regex(/^\d{6}$/, 'BPAY_BILLER_CODE must be 6 digits').optional(),
  BPAY_CUSTOMER_REFERENCE_PREFIX: z.string().optional(),
  BPAY_WEBHOOK_SECRET: z.string().min(32).optional(),

  PAYID_IDENTIFIER: z.string().optional(),
  PAYID_BUSINESS_NAME: z.string().optional(),

  BANK_ACCOUNT_NAME: z.string().optional(),
  BANK_BSB: z.string().regex(/^\d{3}-\d{3}$/, 'BANK_BSB must be in format XXX-XXX').optional(),
  BANK_ACCOUNT_NUMBER: z.string().regex(/^\d{6,10}$/, 'BANK_ACCOUNT_NUMBER must be 6-10 digits').optional(),
  BANK_REFERENCE_PREFIX: z.string().optional(),

  GOCARDLESS_ACCESS_TOKEN: z.string().optional(),
  GOCARDLESS_ENVIRONMENT: z.enum(['sandbox', 'live']).optional(),
  GOCARDLESS_WEBHOOK_SECRET: z.string().min(32).optional(),

  // Battery APIs
  ALPHAESS_API_URL: z.string().url().optional(),
  ALPHAESS_API_KEY: z.string().optional(),
  ALPHAESS_API_SECRET: z.string().optional(),

  LG_API_URL: z.string().url().optional(),
  LG_API_KEY: z.string().optional(),
  LG_API_SECRET: z.string().optional(),

  // Battery Simulation (development)
  ENABLE_BATTERY_SIMULATION: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  ENABLE_BATTERY_SIMULATION_FALLBACK: z
    .string()
    .transform(val => val === 'true')
    .optional(),

  // Feature Flags
  FEATURE_VIRTUAL_POWER_PLANT: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  FEATURE_AI_OPTIMIZATION: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  FEATURE_COMMUNITY_FORUMS: z
    .string()
    .transform(val => val === 'true')
    .optional(),
  FEATURE_NEWSLETTER_SYSTEM: z
    .string()
    .transform(val => val === 'true')
    .optional(),

  // Security
  RATE_LIMIT_REQUESTS: z.coerce.number().default(60),
  SESSION_EXPIRY: z.coerce.number().default(604800), // 7 days

  // Encryption (for battery API credentials)
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY must be 64 characters (32 bytes hex)').optional(),
});

// Production-specific validation
const productionEnvSchema = envSchema.extend({
  // Make email required in production
  EMAIL_SERVER_HOST: z.string().min(1, 'EMAIL_SERVER_HOST required in production'),
  EMAIL_SERVER_USER: z.string().min(1, 'EMAIL_SERVER_USER required in production'),
  EMAIL_SERVER_PASSWORD: z.string().min(1, 'EMAIL_SERVER_PASSWORD required in production'),
  EMAIL_FROM: z.string().email('EMAIL_FROM required in production'),

  // Make payment providers required in production
  GOCARDLESS_ACCESS_TOKEN: z.string().min(1, 'GOCARDLESS_ACCESS_TOKEN required in production'),
  GOCARDLESS_WEBHOOK_SECRET: z.string().min(32, 'GOCARDLESS_WEBHOOK_SECRET required in production'),

  // Make encryption required in production
  ENCRYPTION_KEY: z.string().length(64, 'ENCRYPTION_KEY required in production for credential encryption'),
});

/**
 * Validate environment variables
 *
 * @throws Error if required variables are missing or invalid
 * @returns Validated and typed environment variables
 */
export function validateEnv() {
  const isProduction = process.env.NODE_ENV === 'production';

  try {
    // Use production schema in production, regular schema otherwise
    const schema = isProduction ? productionEnvSchema : envSchema;
    const env = schema.parse(process.env);

    // Additional custom validation
    if (isProduction) {
      // Ensure GoCardless is in live mode
      if (env.GOCARDLESS_ENVIRONMENT === 'sandbox') {
        throw new Error('GOCARDLESS_ENVIRONMENT must be "live" in production');
      }

      // Ensure simulation is disabled
      if (env.ENABLE_BATTERY_SIMULATION) {
        throw new Error('ENABLE_BATTERY_SIMULATION must be false in production');
      }
    }

    return env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `  - ${issue.path.join('.')}: ${issue.message}`).join('\n');

      throw new Error(`Environment variable validation failed:\n${issues}\n\nPlease check your .env.local file.`);
    }

    throw error;
  }
}

/**
 * Type-safe environment variables
 *
 * Use this instead of process.env for full type safety
 */
export const env = validateEnv();

// Export types for use in other files
export type Env = ReturnType<typeof validateEnv>;
