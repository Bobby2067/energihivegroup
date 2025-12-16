import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { auth } from '@/lib/auth';
import { orders, payments, batteryModels, users, priceTiers } from '@/lib/db/schema';
import { eq, and, desc, sql, gte, lte, or, like, asc, count, inArray } from 'drizzle-orm';
import { applyRateLimit, rateLimitPresets } from '@/lib/rate-limit';
import { v4 as uuidv4 } from 'uuid';

// Order interfaces
export interface OrderItem {
  id: string;
  productId: string;
  productType: 'battery' | 'solar' | 'service' | 'accessory';
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  metadata?: Record<string, any>;
}

export interface AustralianAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT';
  postalCode: string; // Australian postcodes are 4 digits
  country: 'Australia';
  phone?: string;
  email?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number; // GST (10% in Australia)
  discount?: number;
  total: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  shippingAddress?: AustralianAddress;
  billingAddress?: AustralianAddress;
  paymentId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  trackingNumber?: string;
  shippingMethod?: 'standard' | 'express' | 'pickup' | 'installation';
  shippingCost: number;
  estimatedDelivery?: string;
  metadata?: Record<string, any>;
}

export interface InventoryUpdate {
  productId: string;
  quantity: number;
  operation: 'increment' | 'decrement';
}

// Validation schemas
const australianAddressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  line1: z.string().min(3, "Address line 1 must be at least 3 characters"),
  line2: z.string().optional(),
  city: z.string().min(2, "City must be at least 2 characters"),
  state: z.enum(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']),
  postalCode: z.string().regex(/^\d{4}$/, "Australian postcodes must be 4 digits"),
  country: z.literal('Australia'),
  phone: z.string().regex(/^(\+61|0)[2-478](\d{8}|\d{4}\s\d{4})$/, "Must be a valid Australian phone number").optional(),
  email: z.string().email("Must be a valid email address").optional(),
});

const orderItemSchema = z.object({
  productId: z.string().uuid("Must be a valid product ID"),
  productType: z.enum(['battery', 'solar', 'service', 'accessory']),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  metadata: z.record(z.string(), z.any()).optional(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  shippingAddress: australianAddressSchema.optional(),
  billingAddress: australianAddressSchema.optional(),
  notes: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express', 'pickup', 'installation']).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const updateOrderSchema = z.object({
  items: z.array(orderItemSchema).optional(),
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  shippingAddress: australianAddressSchema.optional(),
  billingAddress: australianAddressSchema.optional(),
  notes: z.string().optional(),
  paymentId: z.string().uuid("Must be a valid payment ID").optional(),
  trackingNumber: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express', 'pickup', 'installation']).optional(),
  estimatedDelivery: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

const queryParamsSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minTotal: z.coerce.number().optional(),
  maxTotal: z.coerce.number().optional(),
  productId: z.string().uuid("Must be a valid product ID").optional(),
  productType: z.enum(['battery', 'solar', 'service', 'accessory']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['createdAt', 'updatedAt', 'total']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Authentication middleware
async function authenticateRequest(req: NextRequest) {
  const session = await auth();

  if (!session || !session.user) {
    return { authenticated: false, error: 'Unauthorized', userId: null };
  }

  return { authenticated: true, error: null, userId: session.user.id };
}

// Helper function to calculate Australian GST (10%)
function calculateGST(subtotal: number): number {
  return Math.round((subtotal * 0.1) * 100) / 100; // 10% GST rounded to 2 decimal places
}

// Helper function to calculate shipping cost
async function calculateShippingCost(
  items: OrderItem[],
  shippingMethod: 'standard' | 'express' | 'pickup' | 'installation' = 'standard',
  shippingAddress?: AustralianAddress
): Promise<number> {
  // Base shipping costs
  const shippingCosts = {
    standard: 15.00,
    express: 25.00,
    pickup: 0.00,
    installation: 150.00
  };

  let cost = shippingCosts[shippingMethod];

  // If it's installation, we need to calculate based on the products
  if (shippingMethod === 'installation') {
    const hasBattery = items.some(item => item.productType === 'battery');
    const hasSolar = items.some(item => item.productType === 'solar');

    if (hasBattery && hasSolar) {
      cost = 250.00; // Combined installation is more expensive
    }
  }

  // For standard and express shipping, adjust based on total weight/value
  if (shippingMethod === 'standard' || shippingMethod === 'express') {
    const totalValue = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Free shipping for orders over $1000
    if (totalValue >= 1000) {
      return shippingMethod === 'standard' ? 0 : 10.00;
    }

    // Add remote area surcharge if applicable (NT remote postcodes)
    if (shippingAddress) {
      const remotePostcodes = ['0800', '0810', '0820', '0830', '0840', '0850', '0860', '0870', '0880', '0885', '0886'];
      if (remotePostcodes.includes(shippingAddress.postalCode)) {
        cost += 15.00;
      }
    }
  }

  return cost;
}

// Helper function to update inventory
async function updateInventory(updates: InventoryUpdate[]): Promise<{ success: boolean, error?: string }> {
  try {
    // Process each inventory update
    for (const update of updates) {
      const { productId, quantity, operation } = update;

      // Get current inventory (using batteryModels table)
      const [battery] = await db
        .select({ stockQuantity: batteryModels.stockQuantity })
        .from(batteryModels)
        .where(eq(batteryModels.id, productId))
        .limit(1);

      if (!battery) {
        return { success: false, error: `Product ${productId} not found in inventory` };
      }

      // Calculate new quantity
      let newQuantity = battery.stockQuantity || 0;
      if (operation === 'increment') {
        newQuantity += quantity;
      } else {
        newQuantity -= quantity;

        // Check if we have enough inventory
        if (newQuantity < 0) {
          return {
            success: false,
            error: `Insufficient inventory for product ${productId}. Available: ${battery.stockQuantity}, Requested: ${quantity}`
          };
        }
      }

      // Update inventory
      await db
        .update(batteryModels)
        .set({ stockQuantity: newQuantity })
        .where(eq(batteryModels.id, productId));
    }

    return { success: true };
  } catch (error) {
    console.error('Inventory update error:', error);
    return { success: false, error: 'Failed to update inventory' };
  }
}

// Generate unique order number
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

// GET handler for retrieving orders
export async function GET(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const path = url.pathname.split('/');

    // Check if this is a request for a specific order
    if (path.length > 3 && path[3]) {
      const orderId = path[3];

      try {
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, orderId))
          .limit(1);

        if (!order) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check if user owns this order or is admin
        if (order.userId !== userId) {
          // Check if user is admin
          const [userRole] = await db
            .select({ role: users.role })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

          if (!userRole || !['platform_admin', 'super_admin'].includes(userRole.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
          }
        }

        return NextResponse.json(order);
      } catch (error) {
        console.error('Order fetch error:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
      }
    }

    // Handle order listing with filtering and pagination
    try {
      const validatedParams = queryParamsSchema.parse(searchParams);
      const {
        status,
        startDate,
        endDate,
        minTotal,
        maxTotal,
        productId,
        productType,
        page,
        limit,
        sortBy,
        sortOrder,
      } = validatedParams;

      // Check if user is admin
      const [userRole] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const isAdmin = userRole && ['platform_admin', 'super_admin'].includes(userRole.role);

      // Build conditions array
      const conditions = [];

      // Regular users can only see their own orders
      if (!isAdmin) {
        conditions.push(eq(orders.userId, userId));
      }

      // Apply filters
      if (status) {
        conditions.push(eq(orders.status, status));
      }

      if (startDate) {
        conditions.push(gte(orders.createdAt, new Date(startDate)));
      }

      if (endDate) {
        conditions.push(lte(orders.createdAt, new Date(endDate)));
      }

      if (minTotal) {
        conditions.push(gte(orders.total, minTotal.toString()));
      }

      if (maxTotal) {
        conditions.push(lte(orders.total, maxTotal.toString()));
      }

      // For product filtering, we need to filter by batteryModelId
      // Note: This simplified version only supports battery filtering since the schema uses batteryModelId
      if (productId) {
        conditions.push(eq(orders.batteryModelId, productId));
      }

      // Build the where clause
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ value: total }] = await db
        .select({ value: count() })
        .from(orders)
        .where(whereClause);

      // Apply sorting
      const orderByClause = sortOrder === 'asc'
        ? asc(orders[sortBy])
        : desc(orders[sortBy]);

      // Apply pagination
      const offset = (page - 1) * limit;

      const data = await db
        .select()
        .from(orders)
        .where(whereClause)
        .orderBy(orderByClause)
        .limit(limit)
        .offset(offset);

      return NextResponse.json({
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil((total || 0) / limit),
        },
      });

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid query parameters', details: validationError.format() }, { status: 400 });
      }
      throw validationError;
    }

  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating new orders
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req, rateLimitPresets.api);
    if (rateLimitResult) return rateLimitResult;

    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const body = await req.json();
      const validatedOrder = createOrderSchema.parse(body);

      // Get product details for each item
      const orderItems: OrderItem[] = [];
      let subtotal = 0;
      let primaryBatteryId: string | null = null;
      let totalQuantity = 0;

      for (const item of validatedOrder.items) {
        // For now, we only support battery products in the simplified schema
        if (item.productType !== 'battery') {
          return NextResponse.json({
            error: `Product type ${item.productType} is not yet supported. Only battery orders are currently supported.`
          }, { status: 400 });
        }

        // Get product details from batteryModels
        const [battery] = await db
          .select()
          .from(batteryModels)
          .where(eq(batteryModels.id, item.productId))
          .limit(1);

        if (!battery) {
          return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
        }

        // Check if product is active
        if (!battery.isActive) {
          return NextResponse.json({ error: `Product is not available: ${battery.name}` }, { status: 400 });
        }

        // Check inventory
        const stockQuantity = battery.stockQuantity || 0;

        if (stockQuantity < item.quantity) {
          return NextResponse.json({
            error: `Insufficient inventory for product: ${battery.name}`,
            available: stockQuantity,
            requested: item.quantity
          }, { status: 400 });
        }

        // Use the first battery as the primary battery for the order
        if (!primaryBatteryId) {
          primaryBatteryId = battery.id;
          totalQuantity = item.quantity;
        }

        // Calculate item total
        const unitPrice = parseFloat(battery.basePrice || '0');
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        // Add to order items
        orderItems.push({
          id: uuidv4(),
          productId: item.productId,
          productType: 'battery',
          name: battery.name,
          description: battery.description || '',
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice,
          metadata: item.metadata
        });
      }

      // Calculate tax (GST)
      const tax = calculateGST(subtotal);

      // Calculate shipping cost
      const shippingMethod = validatedOrder.shippingMethod || 'standard';
      const shippingCost = await calculateShippingCost(
        orderItems,
        shippingMethod,
        validatedOrder.shippingAddress
      );

      // Calculate total
      const total = subtotal + tax + shippingCost;

      // Convert AustralianAddress to schema format
      const shippingAddressData = validatedOrder.shippingAddress ? {
        street: `${validatedOrder.shippingAddress.line1}${validatedOrder.shippingAddress.line2 ? ', ' + validatedOrder.shippingAddress.line2 : ''}`,
        city: validatedOrder.shippingAddress.city,
        state: validatedOrder.shippingAddress.state,
        postcode: validatedOrder.shippingAddress.postalCode,
        country: validatedOrder.shippingAddress.country,
      } : undefined;

      const billingAddressData = validatedOrder.billingAddress ? {
        street: `${validatedOrder.billingAddress.line1}${validatedOrder.billingAddress.line2 ? ', ' + validatedOrder.billingAddress.line2 : ''}`,
        city: validatedOrder.billingAddress.city,
        state: validatedOrder.billingAddress.state,
        postcode: validatedOrder.billingAddress.postalCode,
        country: validatedOrder.billingAddress.country,
      } : shippingAddressData;

      // Create new order with transaction
      const order = await db.transaction(async (tx) => {
        // Create the order
        const [newOrder] = await tx
          .insert(orders)
          .values({
            orderNumber: generateOrderNumber(),
            userId: userId,
            status: 'pending',
            batteryModelId: primaryBatteryId,
            quantity: totalQuantity,
            subtotal: subtotal.toString(),
            discount: '0',
            tax: tax.toString(),
            shippingCost: shippingCost.toString(),
            total: total.toString(),
            shippingAddress: shippingAddressData,
            billingAddress: billingAddressData,
            notes: validatedOrder.notes,
            metadata: {
              ...validatedOrder.metadata,
              items: orderItems,
              shippingMethod: shippingMethod,
            },
          })
          .returning();

        // Update inventory for all items
        for (const item of orderItems) {
          const [battery] = await tx
            .select({ stockQuantity: batteryModels.stockQuantity })
            .from(batteryModels)
            .where(eq(batteryModels.id, item.productId))
            .limit(1);

          if (battery) {
            await tx
              .update(batteryModels)
              .set({ stockQuantity: (battery.stockQuantity || 0) - item.quantity })
              .where(eq(batteryModels.id, item.productId));
          }
        }

        return newOrder;
      });

      return NextResponse.json(order, { status: 201 });

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Invalid order data',
          details: validationError.format()
        }, { status: 400 });
      }
      throw validationError;
    }

  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT handler for updating orders
export async function PUT(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/');

    if (path.length < 4) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const orderId = path[3];

    try {
      const body = await req.json();
      const validatedUpdate = updateOrderSchema.parse(body);

      // Check if order exists and belongs to user
      const [existingOrder] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!existingOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Check if user owns this order or is admin
      let isAdmin = false;
      if (existingOrder.userId !== userId) {
        // Check if user is admin
        const [userRole] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!userRole || !['platform_admin', 'super_admin'].includes(userRole.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        isAdmin = true;
      }

      // Prevent updates to completed, cancelled, or refunded orders (except by admin)
      const restrictedStatuses = ['delivered', 'cancelled', 'refunded'];
      if (restrictedStatuses.includes(existingOrder.status) && !isAdmin) {
        return NextResponse.json({
          error: `Cannot update ${existingOrder.status} order`,
        }, { status: 400 });
      }

      // Handle item updates (if any)
      let subtotal = parseFloat(existingOrder.subtotal || '0');
      let primaryBatteryId = existingOrder.batteryModelId;
      let totalQuantity = existingOrder.quantity;
      let orderItems = (existingOrder.metadata as any)?.items || [];

      if (validatedUpdate.items) {
        // First, return all existing items to inventory
        for (const item of orderItems) {
          await db
            .update(batteryModels)
            .set({
              stockQuantity: sql`${batteryModels.stockQuantity} + ${item.quantity}`
            })
            .where(eq(batteryModels.id, item.productId));
        }

        // Get product details for new items
        orderItems = [];
        subtotal = 0;
        primaryBatteryId = null;
        totalQuantity = 0;

        for (const item of validatedUpdate.items) {
          if (item.productType !== 'battery') {
            return NextResponse.json({
              error: `Product type ${item.productType} is not yet supported.`
            }, { status: 400 });
          }

          // Get product details
          const [battery] = await db
            .select()
            .from(batteryModels)
            .where(eq(batteryModels.id, item.productId))
            .limit(1);

          if (!battery) {
            return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
          }

          // Check inventory
          if ((battery.stockQuantity || 0) < item.quantity) {
            return NextResponse.json({
              error: `Insufficient inventory for product: ${battery.name}`,
              available: battery.stockQuantity,
              requested: item.quantity
            }, { status: 400 });
          }

          if (!primaryBatteryId) {
            primaryBatteryId = battery.id;
            totalQuantity = item.quantity;
          }

          // Calculate item total
          const unitPrice = parseFloat(battery.basePrice || '0');
          const totalPrice = unitPrice * item.quantity;
          subtotal += totalPrice;

          // Add to order items
          orderItems.push({
            id: uuidv4(),
            productId: item.productId,
            productType: 'battery',
            name: battery.name,
            description: battery.description,
            quantity: item.quantity,
            unitPrice: unitPrice,
            totalPrice,
            metadata: item.metadata
          });

          // Reserve new items
          await db
            .update(batteryModels)
            .set({
              stockQuantity: sql`${batteryModels.stockQuantity} - ${item.quantity}`
            })
            .where(eq(batteryModels.id, item.productId));
        }
      }

      // Calculate tax
      const tax = calculateGST(subtotal);

      // Calculate shipping cost
      const shippingMethod = validatedUpdate.shippingMethod || (existingOrder.metadata as any)?.shippingMethod || 'standard';
      const shippingAddress = validatedUpdate.shippingAddress || existingOrder.shippingAddress;

      const shippingCost = await calculateShippingCost(
        orderItems,
        shippingMethod,
        shippingAddress as any
      );

      // Calculate total
      const total = subtotal + tax + shippingCost;

      // Convert addresses if provided
      const shippingAddressData = validatedUpdate.shippingAddress ? {
        street: `${validatedUpdate.shippingAddress.line1}${validatedUpdate.shippingAddress.line2 ? ', ' + validatedUpdate.shippingAddress.line2 : ''}`,
        city: validatedUpdate.shippingAddress.city,
        state: validatedUpdate.shippingAddress.state,
        postcode: validatedUpdate.shippingAddress.postalCode,
        country: validatedUpdate.shippingAddress.country,
      } : undefined;

      const billingAddressData = validatedUpdate.billingAddress ? {
        street: `${validatedUpdate.billingAddress.line1}${validatedUpdate.billingAddress.line2 ? ', ' + validatedUpdate.billingAddress.line2 : ''}`,
        city: validatedUpdate.billingAddress.city,
        state: validatedUpdate.billingAddress.state,
        postcode: validatedUpdate.billingAddress.postalCode,
        country: validatedUpdate.billingAddress.country,
      } : undefined;

      // Prepare updates
      const updates: any = {
        status: validatedUpdate.status,
        batteryModelId: primaryBatteryId,
        quantity: totalQuantity,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        shippingCost: shippingCost.toString(),
        total: total.toString(),
        shippingAddress: shippingAddressData,
        billingAddress: billingAddressData,
        trackingNumber: validatedUpdate.trackingNumber,
        estimatedDelivery: validatedUpdate.estimatedDelivery ? new Date(validatedUpdate.estimatedDelivery) : undefined,
        notes: validatedUpdate.notes,
        metadata: {
          ...existingOrder.metadata,
          ...validatedUpdate.metadata,
          items: orderItems,
          shippingMethod: shippingMethod,
        },
        updatedAt: new Date(),
      };

      // Add timestamps based on status changes
      if (validatedUpdate.status) {
        if (validatedUpdate.status === 'delivered' && existingOrder.status !== 'delivered') {
          updates.deliveredAt = new Date();
        }
      }

      // Remove undefined values
      Object.keys(updates).forEach(key => {
        if (updates[key] === undefined) {
          delete updates[key];
        }
      });

      // Update order
      const [updatedOrder] = await db
        .update(orders)
        .set(updates)
        .where(eq(orders.id, orderId))
        .returning();

      if (!updatedOrder) {
        return NextResponse.json({
          error: 'Failed to update order'
        }, { status: 500 });
      }

      return NextResponse.json(updatedOrder);

    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({
          error: 'Invalid update data',
          details: validationError.format()
        }, { status: 400 });
      }
      throw validationError;
    }

  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE handler for cancelling orders
export async function DELETE(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/');

    if (path.length < 4) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    const orderId = path[3];

    try {
      // Check if order exists and belongs to user
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Check if user owns this order or is admin
      let isAdmin = false;
      if (order.userId !== userId) {
        // Check if user is admin
        const [userRole] = await db
          .select({ role: users.role })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!userRole || !['platform_admin', 'super_admin'].includes(userRole.role)) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        isAdmin = true;
      }

      // Only allow cancellation of pending or confirmed orders
      const allowedStatuses = ['pending', 'confirmed'];
      if (!allowedStatuses.includes(order.status)) {
        return NextResponse.json({
          error: `Cannot cancel ${order.status} order`,
        }, { status: 400 });
      }

      // Return items to inventory
      const orderItems = (order.metadata as any)?.items || [];

      await db.transaction(async (tx) => {
        for (const item of orderItems) {
          await tx
            .update(batteryModels)
            .set({
              stockQuantity: sql`${batteryModels.stockQuantity} + ${item.quantity}`
            })
            .where(eq(batteryModels.id, item.productId));
        }

        // Update order status to cancelled
        await tx
          .update(orders)
          .set({
            status: 'cancelled',
            updatedAt: new Date(),
            metadata: {
              ...order.metadata,
              cancellationReason: 'User cancelled',
              cancelledBy: userId,
              cancelledAt: new Date().toISOString(),
            }
          })
          .where(eq(orders.id, orderId));
      });

      return NextResponse.json({
        success: true,
        message: 'Order cancelled successfully'
      });

    } catch (error) {
      console.error('Order cancellation error:', error);
      return NextResponse.json({
        error: 'Failed to cancel order',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
