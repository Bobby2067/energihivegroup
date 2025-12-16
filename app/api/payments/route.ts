import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { auth } from '@/lib/auth';
import { payments, orders, users } from '@/lib/db/schema';
import { eq, and, desc, sql, gte, lte, or } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import {
  createPayment,
  verifyPayment
} from '@/lib/payments/client';
import { applyRateLimit, rateLimitPresets } from '@/lib/rate-limit';
import { verifyWebhookRequest } from '@/lib/payments/webhook-verification';

// Payment method types specific to Australian market
export type PaymentMethodType = 'bpay' | 'payid' | 'gocardless' | 'bank_transfer';

// BPAY specific details
export interface BpayDetails {
  billerCode: string;
  reference: string;
  amount: number;
  expiryDate: string;
}

// PayID specific details
export interface PayIdDetails {
  payId: string; // Can be phone number, email, ABN, etc.
  payIdType: 'phone' | 'email' | 'abn' | 'org_identifier';
  amount: number;
  description: string;
}

// GoCardless specific details
export interface GoCardlessDetails {
  accountName: string;
  bsb: string;
  accountNumber: string;
  amount: number;
  frequency?: 'one_off' | 'weekly' | 'monthly' | 'quarterly';
  startDate?: string;
  endDate?: string;
  maxPayments?: number;
}

// Bank Transfer specific details
export interface BankTransferDetails {
  accountName: string;
  bsb: string;
  accountNumber: string;
  amount: number;
  reference: string;
}

// Payment interface
export interface Payment {
  id: string;
  userId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
  paymentMethod: PaymentMethodType;
  paymentDetails: BpayDetails | PayIdDetails | GoCardlessDetails | BankTransferDetails;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  refundedAt?: string;
  refundReason?: string;
  receiptUrl?: string;
  receiptEmail?: string;
}

// Order interface
export interface Order {
  id: string;
  userId: string;
  items: Array<{
    id: string;
    productId: string;
    productType: 'battery' | 'solar' | 'service' | 'accessory';
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  discount?: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shippingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  paymentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Validation schemas
const bpayDetailsSchema = z.object({
  billerCode: z.string().regex(/^\d{3,10}$/, "Biller code must be 3-10 digits"),
  reference: z.string().min(6).max(20),
  amount: z.number().positive(),
  expiryDate: z.string().datetime()
});

const payIdDetailsSchema = z.object({
  payId: z.string().min(5),
  payIdType: z.enum(['phone', 'email', 'abn', 'org_identifier']),
  amount: z.number().positive(),
  description: z.string().max(280)
});

const goCardlessDetailsSchema = z.object({
  accountName: z.string().min(2),
  bsb: z.string().regex(/^\d{3}-\d{3}$/, "BSB must be in format XXX-XXX"),
  accountNumber: z.string().regex(/^\d{6,10}$/, "Account number must be 6-10 digits"),
  amount: z.number().positive(),
  frequency: z.enum(['one_off', 'weekly', 'monthly', 'quarterly']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxPayments: z.number().int().positive().optional()
});

const bankTransferDetailsSchema = z.object({
  accountName: z.string().min(2),
  bsb: z.string().regex(/^\d{3}-\d{3}$/, "BSB must be in format XXX-XXX"),
  accountNumber: z.string().regex(/^\d{6,10}$/, "Account number must be 6-10 digits"),
  amount: z.number().positive(),
  reference: z.string().min(3).max(18)
});

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.literal('AUD'), // Only AUD supported for Australian payments
  paymentMethod: z.enum(['bpay', 'payid', 'gocardless', 'bank_transfer']),
  paymentDetails: z.union([
    bpayDetailsSchema,
    payIdDetailsSchema,
    goCardlessDetailsSchema,
    bankTransferDetailsSchema
  ]),
  metadata: z.record(z.string(), z.any()).optional(),
  receiptEmail: z.string().email().optional()
});

const queryParamsSchema = z.object({
  orderId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'refunded']).optional(),
  paymentMethod: z.enum(['bpay', 'payid', 'gocardless', 'bank_transfer']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Helper function to get payment status from payment provider
async function getPaymentStatus(payment: any) {
  // Check payment provider and get real status
  // For GoCardless payments, we could query their API
  // For now, return current status
  return payment.status;
}

// Helper function to cancel payment with payment provider
async function cancelPayment(payment: any) {
  // Call payment provider's cancellation API
  // For now, return success if status allows cancellation
  if (payment.status === 'pending' || payment.status === 'processing') {
    return { success: true, message: 'Payment cancelled' };
  }
  return { success: false, error: 'Cannot cancel completed payment' };
}

// Authentication middleware
async function authenticateRequest(req: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return { authenticated: false, error: 'Unauthorized', userId: null };
    }

    return { authenticated: true, error: null, userId: session.user.id };
  } catch (error) {
    return { authenticated: false, error: 'Authentication error', userId: null };
  }
}

// GET handler for retrieving payment information
export async function GET(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const path = url.pathname.split('/');

    // Check if this is a request for a specific payment
    if (path.length > 3) {
      const paymentId = path[3];

      try {
        const [payment] = await db
          .select()
          .from(payments)
          .where(eq(payments.id, paymentId))
          .limit(1);

        if (!payment) {
          return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
        }

        // Check if user owns this payment or is admin
        if (payment.userId !== userId) {
          // Check if user is admin
          const [userRole] = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (!userRole || (userRole.role !== 'platform_admin' && userRole.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        }

        // Get real-time payment status from payment provider
        const updatedStatus = await getPaymentStatus(payment);

        // If status has changed, update in database
        if (updatedStatus !== payment.status) {
          const [updatedPayment] = await db
            .update(payments)
            .set({
              status: updatedStatus,
              updatedAt: new Date(),
              ...(updatedStatus === 'completed' ? { completedAt: new Date() } : {}),
              ...(updatedStatus === 'refunded' ? { refundedAt: new Date() } : {})
            })
            .where(eq(payments.id, paymentId))
            .returning();

          if (updatedPayment) {
            return NextResponse.json(updatedPayment);
          }
        }

        return NextResponse.json(payment);
      } catch (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 });
      }
    }

    // Handle payment listing with filtering and pagination
    try {
      const validatedParams = queryParamsSchema.parse(searchParams);
      const {
        orderId,
        status,
        paymentMethod,
        startDate,
        endDate,
        page,
        limit,
      } = validatedParams;

      // Check if user is admin
      const [userRole] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Build query conditions
      const conditions = [];

      // Regular users can only see their own payments
      if (!userRole || (userRole.role !== 'platform_admin' && userRole.role !== 'super_admin')) {
        conditions.push(eq(payments.userId, userId));
      }

      // Apply filters
      if (orderId) {
        conditions.push(eq(payments.orderId, orderId));
      }

      if (status) {
        conditions.push(eq(payments.status, status));
      }

      if (paymentMethod) {
        conditions.push(eq(payments.paymentMethod, paymentMethod));
      }

      if (startDate) {
        conditions.push(gte(payments.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(payments.createdAt, new Date(endDate)));
      }

      // Execute query with pagination
      const offset = (page - 1) * limit;

      const [data, countResult] = await Promise.all([
        db
          .select()
          .from(payments)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
          .orderBy(desc(payments.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(payments)
          .where(conditions.length > 0 ? and(...conditions) : undefined)
      ]);

      const total = Number(countResult[0]?.count || 0);

      return NextResponse.json({
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid query parameters', details: validationError.format() }, { status: 400 });
      }
      throw validationError;
    }

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating new payments
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const path = url.pathname.split('/');

    // Handle webhook callbacks from payment providers (no auth required)
    if (path.length > 3 && path[3] === 'webhook') {
      return handleWebhook(req);
    }

    // Apply rate limiting for payment creation
    const rateLimitResult = await applyRateLimit(req, rateLimitPresets.payments);
    if (rateLimitResult) return rateLimitResult;

    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle payment creation
    try {
      const body = await req.json();
      const validatedPayment = createPaymentSchema.parse(body);

      // The payment client's createPayment function handles everything:
      // - Validation
      // - Provider-specific payment creation
      // - Database record creation
      // - Error handling via thrown exceptions

      const paymentResult = await createPayment(
        {
          orderId: validatedPayment.orderId,
          userId,
          paymentMethod: validatedPayment.paymentMethod,
          paymentType: (validatedPayment as any).paymentType || 'balance',
          amount: validatedPayment.amount,
          reference: (validatedPayment as any).reference,
          metadata: validatedPayment.metadata
        },
        db
      );

      // Return payment response with all details
      return NextResponse.json(paymentResult, { status: 201 });

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Invalid payment data',
          details: validationError.format()
        }, { status: 400 });
      }
      throw validationError;
    }

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT handler for updating payments (admin only)
export async function PUT(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/');

    if (path.length < 4) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    const paymentId = path[3];
    const body = await req.json();

    try {
      // Check if user is admin
      const [userRole] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userRole || (userRole.role !== 'platform_admin' && userRole.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      // Check if payment exists
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      // Only allow updating status and metadata
      const updates: any = {
        status: body.status,
        metadata: {
          ...(payment.metadata as Record<string, any> || {}),
          ...(body.metadata || {})
        },
        updatedAt: new Date(),
      };

      if (body.status === 'completed') {
        updates.completedAt = new Date();
      }

      if (body.status === 'refunded') {
        updates.refundedAt = new Date();
        if (body.refundReason) {
          updates.metadata.refundReason = body.refundReason;
        }
      }

      const [updatedPayment] = await db
        .update(payments)
        .set(updates)
        .where(eq(payments.id, paymentId))
        .returning();

      if (!updatedPayment) {
        return NextResponse.json({
          error: 'Failed to update payment'
        }, { status: 500 });
      }

      // Update order status if payment status changed
      if (body.status && body.status !== payment.status) {
        let orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | undefined;

        switch (body.status) {
          case 'completed':
            orderStatus = 'confirmed';
            break;
          case 'failed':
            orderStatus = 'pending';
            break;
          case 'cancelled':
            orderStatus = 'cancelled';
            break;
          case 'refunded':
            orderStatus = 'refunded';
            break;
          default:
            orderStatus = undefined;
        }

        if (orderStatus) {
          await db
            .update(orders)
            .set({
              status: orderStatus,
              updatedAt: new Date()
            })
            .where(eq(orders.id, payment.orderId));
        }
      }

      return NextResponse.json(updatedPayment);

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
    }

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE handler for cancelling payments
export async function DELETE(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/');

    if (path.length < 4) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }

    const paymentId = path[3];

    try {
      // Check if payment exists and belongs to user
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.id, paymentId))
        .limit(1);

      if (!payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      // Only allow cancellation of pending or processing payments
      if (payment.status !== 'pending' && payment.status !== 'processing') {
        return NextResponse.json({
          error: 'Cannot cancel payment',
          details: `Payment status is ${payment.status}`
        }, { status: 400 });
      }

      if (payment.userId !== userId) {
        // Check if user is admin
        const [userRole] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!userRole || (userRole.role !== 'platform_admin' && userRole.role !== 'super_admin')) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }

      // Cancel payment with provider
      const cancelResult = await cancelPayment(payment);

      if (!cancelResult.success) {
        return NextResponse.json({
          error: 'Failed to cancel payment with provider',
          details: cancelResult.error
        }, { status: 500 });
      }

      // Update payment status (use 'failed' as there is no 'cancelled' in payment status enum)
      await db
        .update(payments)
        .set({
          status: 'failed',
          updatedAt: new Date(),
          metadata: {
            ...(payment.metadata as Record<string, any> || {}),
            cancellationReason: (cancelResult as any).reason || 'User cancelled',
            cancelledBy: userId
          }
        })
        .where(eq(payments.id, paymentId));

      // Update order status
      await db
        .update(orders)
        .set({
          status: 'cancelled',
          updatedAt: new Date()
        })
        .where(eq(orders.id, payment.orderId));

      return NextResponse.json({
        success: true,
        message: 'Payment cancelled successfully'
      });

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Failed to cancel payment' }, { status: 500 });
    }

  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Webhook handler for payment provider callbacks
async function handleWebhook(req: NextRequest) {
  try {
    // Verify webhook signature
    const verification = await verifyWebhookRequest(req.clone(), 'gocardless');
    if (!verification.verified) {
      return NextResponse.json({ error: verification.error }, { status: 401 });
    }

    // Get webhook body
    const body = await req.json();

    // Process webhook based on payment method
    const paymentMethod = body.paymentMethod;
    const providerPaymentId = body.paymentId;
    const status = body.status;
    const reference = body.reference;

    try {
      // Find payment by provider payment ID or reference
      const paymentResults = await db
        .select()
        .from(payments)
        .where(
          or(
            eq(payments.providerPaymentId, providerPaymentId),
            eq(payments.reference, reference)
          )
        )
        .limit(1);

      if (!paymentResults || paymentResults.length === 0) {
        // Log webhook for future reference even if payment not found
        // Note: payment_webhooks table may need to be created
        console.error('Payment not found for webhook', { providerPaymentId, reference });
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }

      const payment = paymentResults[0];

      // Map provider status to our status
      let paymentStatus;
      switch (status) {
        case 'succeeded':
        case 'paid':
        case 'confirmed':
          paymentStatus = 'completed';
          break;
        case 'failed':
        case 'declined':
          paymentStatus = 'failed';
          break;
        case 'cancelled':
          paymentStatus = 'cancelled';
          break;
        case 'refunded':
          paymentStatus = 'refunded';
          break;
        case 'processing':
          paymentStatus = 'processing';
          break;
        default:
          paymentStatus = 'pending';
      }

      // Update payment status
      const updates: any = {
        status: paymentStatus,
        updatedAt: new Date(),
        metadata: {
          ...(payment.metadata as Record<string, any> || {}),
          webhookReceived: new Date().toISOString(),
          webhookData: body
        }
      };

      if (paymentStatus === 'completed') {
        updates.completedAt = new Date();
      }

      if (paymentStatus === 'refunded') {
        updates.refundedAt = new Date();
      }

      await db
        .update(payments)
        .set(updates)
        .where(eq(payments.id, payment.id));

      // Update order status
      let orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | undefined;
      switch (paymentStatus) {
        case 'completed':
          orderStatus = 'confirmed';
          break;
        case 'failed':
          orderStatus = 'pending';
          break;
        case 'cancelled':
          orderStatus = 'cancelled';
          break;
        case 'refunded':
          orderStatus = 'refunded';
          break;
        default:
          orderStatus = undefined;
      }

      if (orderStatus) {
        await db
          .update(orders)
          .set({
            status: orderStatus,
            updatedAt: new Date()
          })
          .where(eq(orders.id, payment.orderId));
      }

      // Return success
      return NextResponse.json({
        success: true,
        message: 'Webhook processed successfully'
      });

    } catch (dbError) {
      console.error('Database error processing webhook:', dbError);
      return NextResponse.json({
        error: 'Failed to update payment status',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
