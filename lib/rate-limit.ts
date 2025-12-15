/**
 * Rate Limiting Middleware
 *
 * Protects API routes from abuse using in-memory rate limiting
 * For production, consider using Upstash Redis or similar
 */

import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store (use Redis in production for distributed systems)
const store: RateLimitStore = {};

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 60000);

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  max: number;

  /**
   * Time window in milliseconds
   */
  windowMs: number;

  /**
   * Custom identifier function (defaults to IP address)
   */
  identifier?: (req: NextRequest) => string;

  /**
   * Message to return when rate limit is exceeded
   */
  message?: string;
}

/**
 * Get client identifier from request
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get real IP from headers (Vercel/proxies)
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier
  return 'unknown';
}

/**
 * Rate limit middleware
 *
 * @param config - Rate limit configuration
 * @returns Middleware function
 *
 * @example
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const rateLimitResult = await rateLimit({
 *     max: 5,
 *     windowMs: 60000, // 1 minute
 *   })(req);
 *
 *   if (rateLimitResult) {
 *     return rateLimitResult; // Returns 429 response
 *   }
 *
 *   // Continue with request handling
 * }
 * ```
 */
export function rateLimit(config: RateLimitConfig) {
  const {
    max,
    windowMs,
    identifier = getClientIdentifier,
    message = 'Too many requests, please try again later.',
  } = config;

  return async (req: NextRequest): Promise<NextResponse | null> => {
    const clientId = identifier(req);
    const key = `${req.nextUrl.pathname}:${clientId}`;
    const now = Date.now();

    // Get or create rate limit entry
    let entry = store[key];

    if (!entry || entry.resetTime < now) {
      // Create new entry
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      store[key] = entry;
      return null; // Allow request
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

      return NextResponse.json(
        {
          error: message,
          retryAfter,
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': entry.resetTime.toString(),
          },
        }
      );
    }

    // Request allowed, return null
    return null;
  };
}

/**
 * Predefined rate limit configurations
 */
export const rateLimitPresets = {
  /**
   * Strict rate limit for authentication endpoints
   * 5 requests per minute
   */
  auth: {
    max: 5,
    windowMs: 60000,
    message: 'Too many authentication attempts, please try again in a minute.',
  },

  /**
   * Moderate rate limit for API endpoints
   * 60 requests per minute
   */
  api: {
    max: 60,
    windowMs: 60000,
    message: 'Too many requests, please slow down.',
  },

  /**
   * Strict rate limit for payment operations
   * 10 requests per minute
   */
  payments: {
    max: 10,
    windowMs: 60000,
    message: 'Too many payment requests, please wait before retrying.',
  },

  /**
   * Very strict for webhook endpoints
   * 100 requests per minute (webhooks can be frequent)
   */
  webhooks: {
    max: 100,
    windowMs: 60000,
    message: 'Webhook rate limit exceeded.',
  },

  /**
   * Lenient for public read-only endpoints
   * 120 requests per minute
   */
  public: {
    max: 120,
    windowMs: 60000,
    message: 'Too many requests.',
  },
};

/**
 * Helper to apply rate limiting to API routes
 *
 * @example
 * ```ts
 * export async function POST(req: NextRequest) {
 *   const rateLimitError = await applyRateLimit(req, rateLimitPresets.auth);
 *   if (rateLimitError) return rateLimitError;
 *
 *   // Handle request
 * }
 * ```
 */
export async function applyRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<NextResponse | null> {
  return rateLimit(config)(req);
}
