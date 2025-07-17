import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { 
  createPayment, 
  getPaymentStatus, 
  cancelPayment,
  createBpayPayment,
  createPayIdPayment,
  createGoCardlessPayment,
  createBankTransferPayment,
  validatePaymentDetails
} from '@/lib/payments/client';

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
  metadata: z.record(z.any()).optional(),
  receiptEmail: z.string().email().optional()
});

const queryParamsSchema = z.object({
  orderId: z.string().uuid().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded']).optional(),
  paymentMethod: z.enum(['bpay', 'payid', 'gocardless', 'bank_transfer']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Authentication middleware
async function authenticateRequest(req: NextRequest) {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { authenticated: false, error: 'Unauthorized', userId: null };
  }
  
  return { authenticated: true, error: null, userId: session.user.id };
}

// GET handler for retrieving payment information
export async function GET(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const path = url.pathname.split('/');
    
    // Check if this is a request for a specific payment
    if (path.length > 3) {
      const paymentId = path[3];
      
      const supabase = createClient();
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();
        
      if (paymentError || !payment) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
      }
      
      // Check if user owns this payment or is admin
      if (payment.userId !== userId) {
        // Check if user is admin
        const { data: userRole } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .single();
          
        if (!userRole || userRole.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
      }
      
      // Get real-time payment status from payment provider
      const updatedStatus = await getPaymentStatus(payment);
      
      // If status has changed, update in database
      if (updatedStatus !== payment.status) {
        const { data: updatedPayment, error: updateError } = await supabase
          .from('payments')
          .update({ 
            status: updatedStatus,
            updatedAt: new Date().toISOString(),
            ...(updatedStatus === 'completed' ? { completedAt: new Date().toISOString() } : {}),
            ...(updatedStatus === 'refunded' ? { refundedAt: new Date().toISOString() } : {})
          })
          .eq('id', paymentId)
          .select()
          .single();
          
        if (!updateError) {
          return NextResponse.json(updatedPayment);
        }
      }
      
      return NextResponse.json(payment);
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
      
      const supabase = createClient();
      
      // Check if user is admin
      const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      let query = supabase.from('payments').select('*', { count: 'exact' });
      
      // Regular users can only see their own payments
      if (!userRole || userRole.role !== 'admin') {
        query = query.eq('userId', userId);
      }
      
      // Apply filters
      if (orderId) {
        query = query.eq('orderId', orderId);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (paymentMethod) {
        query = query.eq('paymentMethod', paymentMethod);
      }
      
      if (startDate) {
        query = query.gte('createdAt', startDate);
      }
      
      if (endDate) {
        query = query.lte('createdAt', endDate);
      }
      
      // Apply sorting
      query = query.order('createdAt', { ascending: false });
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error: paymentsError, count } = await query;
      
      if (paymentsError) {
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
      }
      
      return NextResponse.json({
        data,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil((count || 0) / limit),
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
    const { authenticated, error, userId } = await authenticateRequest(req);
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/');
    
    // Handle webhook callbacks from payment providers
    if (path.length > 3 && path[3] === 'webhook') {
      return handleWebhook(req);
    }
    
    // Handle payment creation
    try {
      const body = await req.json();
      const validatedPayment = createPaymentSchema.parse(body);
      
      const supabase = createClient();
      
      // Check if order exists and belongs to user
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', validatedPayment.orderId)
        .single();
        
      if (orderError || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      
      if (order.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      // Validate payment amount matches order total
      if (validatedPayment.amount !== order.total) {
        return NextResponse.json({ 
          error: 'Payment amount does not match order total',
          expected: order.total,
          received: validatedPayment.amount
        }, { status: 400 });
      }
      
      // Validate payment details based on payment method
      const validationResult = await validatePaymentDetails(
        validatedPayment.paymentMethod,
        validatedPayment.paymentDetails
      );
      
      if (!validationResult.valid) {
        return NextResponse.json({ 
          error: 'Invalid payment details',
          details: validationResult.errors
        }, { status: 400 });
      }
      
      // Create payment in the appropriate payment provider
      let paymentResult;
      
      switch (validatedPayment.paymentMethod) {
        case 'bpay':
          paymentResult = await createBpayPayment(
            validatedPayment.paymentDetails as BpayDetails,
            order
          );
          break;
        case 'payid':
          paymentResult = await createPayIdPayment(
            validatedPayment.paymentDetails as PayIdDetails,
            order
          );
          break;
        case 'gocardless':
          paymentResult = await createGoCardlessPayment(
            validatedPayment.paymentDetails as GoCardlessDetails,
            order
          );
          break;
        case 'bank_transfer':
          paymentResult = await createBankTransferPayment(
            validatedPayment.paymentDetails as BankTransferDetails,
            order
          );
          break;
        default:
          return NextResponse.json({ error: 'Unsupported payment method' }, { status: 400 });
      }
      
      if (!paymentResult.success) {
        return NextResponse.json({ 
          error: 'Payment creation failed',
          details: paymentResult.error
        }, { status: 500 });
      }
      
      // Create payment record in database
      const newPayment: Omit<Payment, 'id'> = {
        userId,
        orderId: validatedPayment.orderId,
        amount: validatedPayment.amount,
        currency: validatedPayment.currency,
        status: 'pending',
        paymentMethod: validatedPayment.paymentMethod,
        paymentDetails: validatedPayment.paymentDetails,
        metadata: {
          ...validatedPayment.metadata,
          providerPaymentId: paymentResult.paymentId,
          providerReference: paymentResult.reference
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        receiptEmail: validatedPayment.receiptEmail
      };
      
      const { data: payment, error: insertError } = await supabase
        .from('payments')
        .insert({
          id: uuidv4(),
          ...newPayment
        })
        .select()
        .single();
        
      if (insertError) {
        return NextResponse.json({ 
          error: 'Failed to create payment record',
          details: insertError.message
        }, { status: 500 });
      }
      
      // Update order with payment ID
      await supabase
        .from('orders')
        .update({
          paymentId: payment.id,
          status: 'pending',
          updatedAt: new Date().toISOString()
        })
        .eq('id', validatedPayment.orderId);
        
      // Return payment details with instructions
      return NextResponse.json({
        ...payment,
        instructions: paymentResult.instructions,
        redirectUrl: paymentResult.redirectUrl,
        expiresAt: paymentResult.expiresAt
      }, { status: 201 });
      
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
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/');
    
    if (path.length < 4) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }
    
    const paymentId = path[3];
    const body = await req.json();
    
    const supabase = createClient();
    
    // Check if user is admin
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    // Check if payment exists
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
      
    if (paymentError || !payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    // Only allow updating status and metadata
    const updates = {
      status: body.status,
      metadata: {
        ...payment.metadata,
        ...body.metadata
      },
      updatedAt: new Date().toISOString(),
      ...(body.status === 'completed' ? { completedAt: new Date().toISOString() } : {}),
      ...(body.status === 'refunded' ? { 
        refundedAt: new Date().toISOString(),
        refundReason: body.refundReason
      } : {})
    };
    
    const { data: updatedPayment, error: updateError } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', paymentId)
      .select()
      .single();
      
    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update payment',
        details: updateError.message
      }, { status: 500 });
    }
    
    // Update order status if payment status changed
    if (body.status && body.status !== payment.status) {
      let orderStatus;
      
      switch (body.status) {
        case 'completed':
          orderStatus = 'paid';
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
        await supabase
          .from('orders')
          .update({
            status: orderStatus,
            updatedAt: new Date().toISOString()
          })
          .eq('id', payment.orderId);
      }
    }
    
    return NextResponse.json(updatedPayment);
    
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE handler for cancelling payments
export async function DELETE(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/');
    
    if (path.length < 4) {
      return NextResponse.json({ error: 'Payment ID required' }, { status: 400 });
    }
    
    const paymentId = path[3];
    
    const supabase = createClient();
    
    // Check if payment exists and belongs to user
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .single();
      
    if (paymentError || !payment) {
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
      const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
        
      if (!userRole || userRole.role !== 'admin') {
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
    
    // Update payment status
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          cancellationReason: cancelResult.reason || 'User cancelled',
          cancelledBy: userId
        }
      })
      .eq('id', paymentId);
      
    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to update payment status',
        details: updateError.message
      }, { status: 500 });
    }
    
    // Update order status
    await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      })
      .eq('id', payment.orderId);
      
    return NextResponse.json({ 
      success: true,
      message: 'Payment cancelled successfully'
    });
    
  } catch (error) {
    console.error('Payment API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Webhook handler for payment provider callbacks
async function handleWebhook(req: NextRequest) {
  try {
    // Get webhook signature from headers
    const signature = req.headers.get('x-webhook-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 401 });
    }
    
    // Get webhook body
    const body = await req.json();
    
    // Verify webhook signature
    // This would normally be done using a library specific to the payment provider
    // For now, we'll assume it's valid
    
    const supabase = createClient();
    
    // Process webhook based on payment method
    const paymentMethod = body.paymentMethod;
    const providerPaymentId = body.paymentId;
    const status = body.status;
    const reference = body.reference;
    
    // Find payment by provider payment ID or reference
    const { data: payments, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .or(`metadata->providerPaymentId.eq.${providerPaymentId},metadata->providerReference.eq.${reference}`);
      
    if (paymentError || !payments || payments.length === 0) {
      // Log webhook for future reference even if payment not found
      await supabase
        .from('payment_webhooks')
        .insert({
          id: uuidv4(),
          paymentMethod,
          providerPaymentId,
          reference,
          status,
          payload: body,
          processedAt: new Date().toISOString(),
          success: false,
          error: 'Payment not found'
        });
        
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }
    
    const payment = payments[0];
    
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
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: paymentStatus,
        updatedAt: new Date().toISOString(),
        ...(paymentStatus === 'completed' ? { completedAt: new Date().toISOString() } : {}),
        ...(paymentStatus === 'refunded' ? { refundedAt: new Date().toISOString() } : {}),
        metadata: {
          ...payment.metadata,
          webhookReceived: new Date().toISOString(),
          webhookData: body
        }
      })
      .eq('id', payment.id);
      
    if (updateError) {
      // Log webhook error
      await supabase
        .from('payment_webhooks')
        .insert({
          id: uuidv4(),
          paymentId: payment.id,
          paymentMethod,
          providerPaymentId,
          reference,
          status,
          payload: body,
          processedAt: new Date().toISOString(),
          success: false,
          error: updateError.message
        });
        
      return NextResponse.json({ 
        error: 'Failed to update payment status',
        details: updateError.message
      }, { status: 500 });
    }
    
    // Update order status
    let orderStatus;
    switch (paymentStatus) {
      case 'completed':
        orderStatus = 'paid';
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
      await supabase
        .from('orders')
        .update({
          status: orderStatus,
          updatedAt: new Date().toISOString()
        })
        .eq('id', payment.orderId);
    }
    
    // Log successful webhook
    await supabase
      .from('payment_webhooks')
      .insert({
        id: uuidv4(),
        paymentId: payment.id,
        paymentMethod,
        providerPaymentId,
        reference,
        status,
        payload: body,
        processedAt: new Date().toISOString(),
        success: true
      });
      
    // Return success
    return NextResponse.json({ 
      success: true,
      message: 'Webhook processed successfully'
    });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    // Log webhook error
    const supabase = createClient();
    await supabase
      .from('payment_webhooks')
      .insert({
        id: uuidv4(),
        payload: await req.json().catch(() => ({})),
        processedAt: new Date().toISOString(),
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
