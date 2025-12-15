/**
 * Payment Webhook Signature Verification
 *
 * Secure verification of webhook signatures from payment providers
 * to prevent forgery and replay attacks
 */

import crypto from 'crypto';

/**
 * Verify GoCardless webhook signature
 *
 * @param payload - Raw request body as string
 * @param signature - Signature from Webhook-Signature header
 * @param secret - GoCardless webhook secret from environment
 * @returns True if signature is valid
 */
export function verifyGoCardlessSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret) {
    throw new Error('GOCARDLESS_WEBHOOK_SECRET not configured');
  }

  if (!signature) {
    return false;
  }

  // GoCardless uses HMAC-SHA256
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Use timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Verify BPAY webhook signature (if they provide one)
 *
 * Note: BPAY typically uses polling rather than webhooks,
 * but this is here for completeness
 */
export function verifyBPAYSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  if (!secret || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Prevent replay attacks by checking webhook timestamp
 *
 * @param timestamp - Timestamp from webhook (Unix timestamp in seconds)
 * @param maxAgeSeconds - Maximum age in seconds (default: 5 minutes)
 * @returns True if timestamp is recent enough
 */
export function isWebhookTimestampValid(
  timestamp: number,
  maxAgeSeconds: number = 300
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const age = now - timestamp;

  // Reject if timestamp is in the future (clock skew tolerance: 60s)
  if (age < -60) {
    return false;
  }

  // Reject if timestamp is too old
  if (age > maxAgeSeconds) {
    return false;
  }

  return true;
}

/**
 * Extract and verify webhook signature from request
 *
 * @param request - Next.js Request object
 * @param provider - Payment provider name
 * @returns Verification result
 */
export async function verifyWebhookRequest(
  request: Request,
  provider: 'gocardless' | 'bpay'
): Promise<{ verified: boolean; error?: string; payload?: string }> {
  try {
    // Read body as text (needed for signature verification)
    const payload = await request.text();

    if (!payload) {
      return { verified: false, error: 'Empty request body' };
    }

    // Get signature from header
    let signature: string | null = null;
    let secret: string | undefined;

    if (provider === 'gocardless') {
      signature = request.headers.get('Webhook-Signature');
      secret = process.env.GOCARDLESS_WEBHOOK_SECRET;
    } else if (provider === 'bpay') {
      signature = request.headers.get('X-BPAY-Signature');
      secret = process.env.BPAY_WEBHOOK_SECRET;
    }

    if (!signature) {
      return { verified: false, error: 'Missing webhook signature header' };
    }

    if (!secret) {
      return { verified: false, error: `${provider.toUpperCase()}_WEBHOOK_SECRET not configured` };
    }

    // Verify signature
    const isValid =
      provider === 'gocardless'
        ? verifyGoCardlessSignature(payload, signature, secret)
        : verifyBPAYSignature(payload, signature, secret);

    if (!isValid) {
      return { verified: false, error: 'Invalid webhook signature' };
    }

    return { verified: true, payload };
  } catch (error) {
    return {
      verified: false,
      error: `Webhook verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
