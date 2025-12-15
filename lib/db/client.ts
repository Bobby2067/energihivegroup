/**
 * Drizzle Database Client
 *
 * PostgreSQL connection using Neon serverless driver
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Create PostgreSQL connection
// For serverless environments like Vercel, use a single connection
const client = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1, // Single connection for serverless
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create Drizzle instance with schema
export const db = drizzle(client, { schema });

// Export schema for use in queries
export { schema };
