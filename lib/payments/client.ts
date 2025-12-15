/**
 * Australian Payment System Client
 *
 * This module provides functions for processing payments using Australian payment methods:
 * BPAY, PayID, Direct Bank Transfer, and GoCardless (Direct Debit).
 *
 * It replaces Stripe functionality with local Australian payment options optimized
 * for the Australian energy market.
 */

import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

// Import GoCardless SDK for direct debit functionality
import gocardless from 'gocardless-nodejs';
import { PaymentStatus } from 'gocardless-nodejs/types/types';

// Import Drizzle schema
import * as schema from '@/lib/db/schema';

// Environment variables for payment configuration
const BPAY_BILLER_CODE = process.env.BPAY_BILLER_CODE || '123456';
const BPAY_CUSTOMER_REFERENCE_PREFIX = process.env.BPAY_CUSTOMER_REFERENCE_PREFIX || 'EHIVE';
const PAYID_IDENTIFIER = process.env.PAYID_IDENTIFIER || 'payments@energihive.com.au';
const PAYID_BUSINESS_NAME = process.env.PAYID_BUSINESS_NAME || 'Energi Hive Pty Ltd';
const BANK_ACCOUNT_NAME = process.env.BANK_ACCOUNT_NAME || 'Energi Hive Pty Ltd';
const BANK_BSB = process.env.BANK_BSB || '123-456';
const BANK_ACCOUNT_NUMBER = process.env.BANK_ACCOUNT_NUMBER || '12345678';
const BANK_REFERENCE_PREFIX = process.env.BANK_REFERENCE_PREFIX || 'EHIVE';
const GOCARDLESS_ACCESS_TOKEN = process.env.GOCARDLESS_ACCESS_TOKEN || '';
const GOCARDLESS_ENVIRONMENT = (process.env.GOCARDLESS_ENVIRONMENT || 'sandbox') as 'sandbox' | 'live';

// Initialize GoCardless client if token is available
const gcClient = GOCARDLESS_ACCESS_TOKEN
  ? gocardless(
      GOCARDLESS_ACCESS_TOKEN,
      GOCARDLESS_ENVIRONMENT,
      { raiseOnIdempotencyConflict: true }
    )
  : null;

// Payment method types
export type PaymentMethod = 'bpay' | 'payid' | 'bank_transfer' | 'gocardless';
export type PaymentType = 'deposit' | 'balance';
export type PaymentStatusType = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

// Validation schemas
const PaymentDetailsSchema = z.object({
  orderId: z.string().uuid(),
  userId: z.string().uuid(),
  paymentMethod: z.enum(['bpay', 'payid', 'bank_transfer', 'gocardless']),
  paymentType: z.enum(['deposit', 'balance']),
  amount: z.number().positive(),
  reference: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const BPayDetailsSchema = z.object({
  billerCode: z.string(),
  customerReference: z.string(),
});

const PayIDDetailsSchema = z.object({
  payidIdentifier: z.string(),
  businessName: z.string(),
  description: z.string().optional(),
});

const BankTransferDetailsSchema = z.object({
  accountName: z.string(),
  bsb: z.string(),
  accountNumber: z.string(),
  reference: z.string(),
});

const GoCardlessDetailsSchema = z.object({
  redirectUrl: z.string().url(),
  sessionId: z.string(),
  description: z.string().optional(),
});

// Interface definitions
export interface PaymentDetails {
  orderId: string;
  userId: string;
  paymentMethod: PaymentMethod;
  paymentType: PaymentType;
  amount: number;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface BPayDetails {
  billerCode: string;
  customerReference: string;
}

export interface PayIDDetails {
  payidIdentifier: string;
  businessName: string;
  description?: string;
}

export interface BankTransferDetails {
  accountName: string;
  bsb: string;
  accountNumber: string;
  reference: string;
}

export interface GoCardlessDetails {
  redirectUrl: string;
  sessionId: string;
  description?: string;
}

export interface PaymentResponse {
  paymentId: string;
  status: PaymentStatusType;
  reference: string;
  details: BPayDetails | PayIDDetails | BankTransferDetails | GoCardlessDetails;
  nextSteps?: {
    type: 'redirect' | 'instructions' | 'verification';
    message: string;
    url?: string;
  };
}

export interface PaymentVerificationResponse {
  verified: boolean;
  status: PaymentStatusType;
  message: string;
  nextSteps?: {
    type: 'redirect' | 'instructions' | 'complete';
    message: string;
    url?: string;
  };
}

/**
 * Generate a unique reference for a payment
 * @param method - Payment method
 * @param orderId - Order ID
 * @returns Unique payment reference
 */
export function generatePaymentReference(method: PaymentMethod, orderId: string): string {
  const shortId = orderId.substring(0, 8).toUpperCase();
  const timestamp = Date.now().toString().substring(6); // Last 7 digits of timestamp

  switch (method) {
    case 'bpay':
      return `${BPAY_CUSTOMER_REFERENCE_PREFIX}${shortId}${timestamp}`;
    case 'payid':
      return `PAYID-${shortId}-${timestamp}`;
    case 'bank_transfer':
      return `${BANK_REFERENCE_PREFIX}${shortId}${timestamp}`;
    case 'gocardless':
      return `GC-${shortId}-${timestamp}`;
    default:
      return `REF-${shortId}-${timestamp}`;
  }
}

/**
 * Create a new payment
 * @param details - Payment details
 * @param db - Drizzle database client
 * @returns Payment response
 */
export async function createPayment(
  details: PaymentDetails,
  db: PostgresJsDatabase<typeof schema>
): Promise<PaymentResponse> {
  try {
    // Validate payment details
    const validatedDetails = PaymentDetailsSchema.parse(details);

    // Generate reference if not provided
    const reference = validatedDetails.reference ||
      generatePaymentReference(validatedDetails.paymentMethod, validatedDetails.orderId);

    // Create payment record in database
    const [payment] = await db
      .insert(schema.payments)
      .values({
        orderId: validatedDetails.orderId,
        userId: validatedDetails.userId,
        paymentMethod: validatedDetails.paymentMethod,
        amount: validatedDetails.amount.toString(),
        status: 'pending',
        reference,
        metadata: validatedDetails.metadata || {},
      })
      .returning();

    if (!payment) throw new Error('Payment record creation failed');

    // Process based on payment method
    switch (validatedDetails.paymentMethod) {
      case 'bpay': {
        const bpayDetails: BPayDetails = {
          billerCode: BPAY_BILLER_CODE,
          customerReference: reference,
        };

        return {
          paymentId: payment.id,
          status: 'pending',
          reference,
          details: bpayDetails,
          nextSteps: {
            type: 'instructions',
            message: 'Please complete your BPAY payment using the provided details.',
          },
        };
      }

      case 'payid': {
        const payidDetails: PayIDDetails = {
          payidIdentifier: PAYID_IDENTIFIER,
          businessName: PAYID_BUSINESS_NAME,
          description: `Energi Hive ${validatedDetails.paymentType} payment for order ${validatedDetails.orderId.substring(0, 8)}`,
        };

        return {
          paymentId: payment.id,
          status: 'pending',
          reference,
          details: payidDetails,
          nextSteps: {
            type: 'instructions',
            message: 'Please complete your PayID payment using the provided details.',
          },
        };
      }

      case 'bank_transfer': {
        const bankDetails: BankTransferDetails = {
          accountName: BANK_ACCOUNT_NAME,
          bsb: BANK_BSB,
          accountNumber: BANK_ACCOUNT_NUMBER,
          reference,
        };

        return {
          paymentId: payment.id,
          status: 'pending',
          reference,
          details: bankDetails,
          nextSteps: {
            type: 'instructions',
            message: 'Please complete your bank transfer using the provided details.',
          },
        };
      }

      case 'gocardless': {
        if (!gcClient) {
          throw new Error('GoCardless is not configured. Please check your environment variables.');
        }

        // Create a GoCardless redirect flow
        const sessionId = uuidv4();
        const description = `Energi Hive ${validatedDetails.paymentType} payment for order ${validatedDetails.orderId.substring(0, 8)}`;
        const successRedirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payments/gocardless/redirect?session_id=${sessionId}`;

        const redirectFlow = await gcClient.redirectFlows.create({
          description,
          session_token: sessionId,
          success_redirect_url: successRedirectUrl,
          prefilled_customer: {
            email: validatedDetails.metadata?.email,
          },
        });

        // Update payment record with GoCardless flow ID
        await db
          .update(schema.payments)
          .set({
            metadata: {
              ...validatedDetails.metadata,
              gocardless_flow_id: redirectFlow.id,
              session_id: sessionId,
            },
            updatedAt: new Date(),
          })
          .where(eq(schema.payments.id, payment.id));

        const gcDetails: GoCardlessDetails = {
          redirectUrl: redirectFlow.redirect_url,
          sessionId,
          description,
        };

        return {
          paymentId: payment.id,
          status: 'processing',
          reference,
          details: gcDetails,
          nextSteps: {
            type: 'redirect',
            message: 'Please complete your Direct Debit setup with GoCardless.',
            url: redirectFlow.redirect_url,
          },
        };
      }

      default:
        throw new Error(`Unsupported payment method: ${validatedDetails.paymentMethod}`);
    }
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to create payment');
  }
}

/**
 * Complete a GoCardless redirect flow and set up the mandate
 * @param sessionId - Session ID from the redirect flow
 * @param redirectFlowId - Redirect flow ID from GoCardless
 * @param db - Drizzle database client
 * @returns Payment verification response
 */
export async function completeGoCardlessRedirectFlow(
  sessionId: string,
  redirectFlowId: string,
  db: PostgresJsDatabase<typeof schema>
): Promise<PaymentVerificationResponse> {
  try {
    if (!gcClient) {
      throw new Error('GoCardless is not configured. Please check your environment variables.');
    }

    // Find the payment with this session ID (metadata is JSONB so we need to search in it)
    const payments = await db
      .select()
      .from(schema.payments)
      .limit(100); // Get recent payments

    const payment = payments.find(p =>
      p.metadata && typeof p.metadata === 'object' &&
      'session_id' in p.metadata && p.metadata.session_id === sessionId
    );

    if (!payment) {
      throw new Error('Payment not found for this session');
    }

    // Complete the redirect flow
    const completedFlow = await gcClient.redirectFlows.complete(redirectFlowId, {
      session_token: sessionId,
    });

    // Create a payment with the mandate
    const gcPayment = await gcClient.payments.create({
      amount: Math.round(parseFloat(payment.amount) * 100), // Convert to cents
      currency: 'AUD',
      metadata: {
        order_id: payment.orderId,
        payment_id: payment.id,
      },
      links: {
        mandate: completedFlow.links.mandate,
      },
      description: `Energi Hive payment for order ${payment.orderId.substring(0, 8)}`,
    });

    // Update payment record with GoCardless mandate and payment IDs
    await db
      .update(schema.payments)
      .set({
        status: 'processing',
        metadata: {
          ...(payment.metadata as Record<string, any> || {}),
          gocardless_mandate_id: completedFlow.links.mandate,
          gocardless_customer_id: completedFlow.links.customer,
          gocardless_payment_id: gcPayment.id,
        },
        updatedAt: new Date(),
      })
      .where(eq(schema.payments.id, payment.id));

    // Update order status
    await db
      .update(schema.orders)
      .set({
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, payment.orderId));

    return {
      verified: true,
      status: 'processing',
      message: 'Direct Debit setup complete. Your payment is being processed.',
      nextSteps: {
        type: 'complete',
        message: 'Your payment has been set up successfully and will be processed automatically.',
      },
    };
  } catch (error) {
    console.error('Error completing GoCardless flow:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to complete GoCardless setup');
  }
}

/**
 * Verify a payment's status
 * @param paymentId - Payment ID to verify
 * @param db - Drizzle database client
 * @returns Payment verification response
 */
export async function verifyPayment(
  paymentId: string,
  db: PostgresJsDatabase<typeof schema>
): Promise<PaymentVerificationResponse> {
  try {
    // Get the payment record
    const [payment] = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.id, paymentId))
      .limit(1);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if payment is already verified
    if (payment.status === 'completed') {
      return {
        verified: true,
        status: 'completed',
        message: 'Payment has been verified and completed.',
        nextSteps: {
          type: 'complete',
          message: 'Your payment has been processed successfully.',
        },
      };
    }

    // Handle verification based on payment method
    switch (payment.paymentMethod) {
      case 'bpay':
      case 'payid':
      case 'bank_transfer': {
        // For manual payment methods, we simulate checking an external system
        // In a real implementation, this would query a bank API or payment gateway

        // For demo purposes, we'll randomly verify some payments
        // In production, this would be replaced with actual verification logic
        const isVerified = process.env.NODE_ENV === 'production'
          ? false // In production, manual verification required
          : Math.random() > 0.7; // In development, randomly verify for testing

        if (isVerified) {
          // Update payment status
          await db
            .update(schema.payments)
            .set({
              status: 'completed',
              completedAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(schema.payments.id, payment.id));

          // Update order status
          await db
            .update(schema.orders)
            .set({
              status: 'paid',
              updatedAt: new Date(),
            })
            .where(eq(schema.orders.id, payment.orderId));

          return {
            verified: true,
            status: 'completed',
            message: 'Payment has been verified and completed.',
            nextSteps: {
              type: 'complete',
              message: 'Your payment has been processed successfully.',
            },
          };
        }

        return {
          verified: false,
          status: 'pending',
          message: 'Payment is still pending verification.',
          nextSteps: {
            type: 'instructions',
            message: 'Please allow 1-2 business days for your payment to be processed.',
          },
        };
      }

      case 'gocardless': {
        if (!gcClient) {
          throw new Error('GoCardless is not configured. Please check your environment variables.');
        }

        // Check GoCardless payment status
        const metadata = payment.metadata as Record<string, any> | null;
        const gcPaymentId = metadata?.gocardless_payment_id;

        if (!gcPaymentId) {
          return {
            verified: false,
            status: 'processing',
            message: 'Direct Debit setup is complete, but payment is still being processed.',
            nextSteps: {
              type: 'instructions',
              message: 'Your payment is being processed and will be confirmed within 3-5 business days.',
            },
          };
        }

        // Get payment status from GoCardless
        const gcPayment = await gcClient.payments.get(gcPaymentId);

        if (gcPayment.status === PaymentStatus.Confirmed ||
            gcPayment.status === PaymentStatus.PaidOut) {
          // Update payment status
          await db
            .update(schema.payments)
            .set({
              status: 'completed',
              completedAt: new Date(),
              updatedAt: new Date(),
              metadata: {
                ...metadata,
                gocardless_status: gcPayment.status,
              },
            })
            .where(eq(schema.payments.id, payment.id));

          // Update order status
          await db
            .update(schema.orders)
            .set({
              status: 'paid',
              updatedAt: new Date(),
            })
            .where(eq(schema.orders.id, payment.orderId));

          return {
            verified: true,
            status: 'completed',
            message: 'Payment has been confirmed by GoCardless.',
            nextSteps: {
              type: 'complete',
              message: 'Your payment has been processed successfully.',
            },
          };
        } else if (gcPayment.status === PaymentStatus.Failed ||
                  gcPayment.status === PaymentStatus.Cancelled) {
          // Update payment status to failed
          await db
            .update(schema.payments)
            .set({
              status: 'failed',
              updatedAt: new Date(),
              metadata: {
                ...metadata,
                gocardless_status: gcPayment.status,
                failure_reason: gcPayment.status_details,
              },
            })
            .where(eq(schema.payments.id, payment.id));

          return {
            verified: false,
            status: 'failed',
            message: `Payment failed: ${gcPayment.status_details || 'Unknown reason'}`,
            nextSteps: {
              type: 'instructions',
              message: 'Please try a different payment method or contact support for assistance.',
            },
          };
        }

        // Payment is still pending or processing
        return {
          verified: false,
          status: 'processing',
          message: `Payment is currently ${gcPayment.status}`,
          nextSteps: {
            type: 'instructions',
            message: 'Your payment is being processed and will be confirmed within 3-5 business days.',
          },
        };
      }

      default:
        throw new Error(`Unsupported payment method: ${payment.paymentMethod}`);
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to verify payment');
  }
}

/**
 * Create a refund for a payment
 * @param paymentId - Payment ID to refund
 * @param amount - Amount to refund (optional, defaults to full amount)
 * @param reason - Reason for refund
 * @param db - Drizzle database client
 * @returns Refund response
 */
export async function createRefund(
  paymentId: string,
  amount?: number,
  reason: string = 'customer_requested',
  db: PostgresJsDatabase<typeof schema>
): Promise<{ success: boolean; message: string }> {
  try {
    // Get the payment record
    const [payment] = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.id, paymentId))
      .limit(1);

    if (!payment) {
      throw new Error('Payment not found');
    }

    // Check if payment can be refunded
    if (payment.status !== 'completed') {
      throw new Error(`Cannot refund payment with status: ${payment.status}`);
    }

    const refundAmount = amount || parseFloat(payment.amount);
    const metadata = payment.metadata as Record<string, any> | null;

    // Process refund based on payment method
    switch (payment.paymentMethod) {
      case 'gocardless': {
        if (!gcClient) {
          throw new Error('GoCardless is not configured. Please check your environment variables.');
        }

        const gcPaymentId = metadata?.gocardless_payment_id;

        if (!gcPaymentId) {
          throw new Error('GoCardless payment ID not found');
        }

        // Create refund in GoCardless
        await gcClient.refunds.create({
          amount: Math.round(refundAmount * 100), // Convert to cents
          links: {
            payment: gcPaymentId,
          },
          metadata: {
            reason,
            original_payment_id: payment.id,
          },
        });

        break;
      }

      case 'bpay':
      case 'payid':
      case 'bank_transfer': {
        // For manual payment methods, we just record the refund
        // In a real implementation, this would initiate a bank transfer
        break;
      }

      default:
        throw new Error(`Unsupported payment method for refunds: ${payment.paymentMethod}`);
    }

    // Update payment status to refunded
    await db
      .update(schema.payments)
      .set({
        status: 'refunded',
        refundedAt: new Date(),
        updatedAt: new Date(),
        metadata: {
          ...metadata,
          refund_amount: refundAmount,
          refund_reason: reason,
          refund_date: new Date().toISOString(),
        },
      })
      .where(eq(schema.payments.id, payment.id));

    // Update order status
    await db
      .update(schema.orders)
      .set({
        status: 'refunded',
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, payment.orderId));

    return {
      success: true,
      message: `Refund of $${refundAmount.toFixed(2)} processed successfully.`,
    };
  } catch (error) {
    console.error('Error creating refund:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to process refund');
  }
}

/**
 * Get payment details by ID
 * @param paymentId - Payment ID to retrieve
 * @param db - Drizzle database client
 * @returns Payment details
 */
export async function getPaymentById(
  paymentId: string,
  db: PostgresJsDatabase<typeof schema>
): Promise<any> {
  try {
    const [payment] = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.id, paymentId))
      .limit(1);

    if (!payment) throw new Error('Payment not found');

    return payment;
  } catch (error) {
    console.error('Error getting payment:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to get payment details');
  }
}

/**
 * Get all payments for an order
 * @param orderId - Order ID to retrieve payments for
 * @param db - Drizzle database client
 * @returns Array of payments
 */
export async function getPaymentsByOrderId(
  orderId: string,
  db: PostgresJsDatabase<typeof schema>
): Promise<any[]> {
  try {
    const payments = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.orderId, orderId))
      .orderBy(schema.payments.createdAt);

    return payments || [];
  } catch (error) {
    console.error('Error getting payments for order:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to get payments');
  }
}

/**
 * Get all payments for a user
 * @param userId - User ID to retrieve payments for
 * @param db - Drizzle database client
 * @returns Array of payments
 */
export async function getPaymentsByUserId(
  userId: string,
  db: PostgresJsDatabase<typeof schema>
): Promise<any[]> {
  try {
    const payments = await db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.userId, userId))
      .orderBy(schema.payments.createdAt);

    return payments || [];
  } catch (error) {
    console.error('Error getting payments for user:', error);
    throw error instanceof Error
      ? error
      : new Error('Failed to get payments');
  }
}

/**
 * Default export for convenience
 */
export default {
  createPayment,
  verifyPayment,
  completeGoCardlessRedirectFlow,
  createRefund,
  getPaymentById,
  getPaymentsByOrderId,
  getPaymentsByUserId,
  generatePaymentReference,
};
