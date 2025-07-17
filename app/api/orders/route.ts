import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
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
  status: 'draft' | 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
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
  state: z.enum(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'], {
    errorMap: () => ({ message: "Must be a valid Australian state or territory" })
  }),
  postalCode: z.string().regex(/^\d{4}$/, "Australian postcodes must be 4 digits"),
  country: z.literal('Australia'),
  phone: z.string().regex(/^(\+61|0)[2-478](\d{8}|\d{4}\s\d{4})$/, "Must be a valid Australian phone number").optional(),
  email: z.string().email("Must be a valid email address").optional(),
});

const orderItemSchema = z.object({
  productId: z.string().uuid("Must be a valid product ID"),
  productType: z.enum(['battery', 'solar', 'service', 'accessory']),
  quantity: z.number().int().positive("Quantity must be a positive integer"),
  metadata: z.record(z.any()).optional(),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, "Order must contain at least one item"),
  shippingAddress: australianAddressSchema.optional(),
  billingAddress: australianAddressSchema.optional(),
  notes: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express', 'pickup', 'installation']).optional(),
  metadata: z.record(z.any()).optional(),
});

const updateOrderSchema = z.object({
  items: z.array(orderItemSchema).optional(),
  status: z.enum(['draft', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
  shippingAddress: australianAddressSchema.optional(),
  billingAddress: australianAddressSchema.optional(),
  notes: z.string().optional(),
  paymentId: z.string().uuid("Must be a valid payment ID").optional(),
  trackingNumber: z.string().optional(),
  shippingMethod: z.enum(['standard', 'express', 'pickup', 'installation']).optional(),
  estimatedDelivery: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

const queryParamsSchema = z.object({
  status: z.enum(['draft', 'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']).optional(),
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
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
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
    
    // Add remote area surcharge if applicable
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
  const supabase = createClient();
  
  try {
    // Process each inventory update
    for (const update of updates) {
      const { productId, quantity, operation } = update;
      
      // Get current inventory
      const { data: inventory, error } = await supabase
        .from('inventory')
        .select('quantity')
        .eq('productId', productId)
        .single();
        
      if (error) {
        return { success: false, error: `Product ${productId} not found in inventory` };
      }
      
      // Calculate new quantity
      let newQuantity = inventory.quantity;
      if (operation === 'increment') {
        newQuantity += quantity;
      } else {
        newQuantity -= quantity;
        
        // Check if we have enough inventory
        if (newQuantity < 0) {
          return { 
            success: false, 
            error: `Insufficient inventory for product ${productId}. Available: ${inventory.quantity}, Requested: ${quantity}` 
          };
        }
      }
      
      // Update inventory
      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('productId', productId);
        
      if (updateError) {
        return { success: false, error: `Failed to update inventory for product ${productId}` };
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Inventory update error:', error);
    return { success: false, error: 'Failed to update inventory' };
  }
}

// GET handler for retrieving orders
export async function GET(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const path = url.pathname.split('/');
    
    // Check if this is a request for a specific order
    if (path.length > 3) {
      const orderId = path[3];
      
      const supabase = createClient();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (orderError || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      
      // Check if user owns this order or is admin
      if (order.userId !== userId) {
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
      
      return NextResponse.json(order);
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
      
      const supabase = createClient();
      
      // Check if user is admin
      const { data: userRole } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      
      let query = supabase.from('orders').select('*', { count: 'exact' });
      
      // Regular users can only see their own orders
      if (!userRole || userRole.role !== 'admin') {
        query = query.eq('userId', userId);
      }
      
      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }
      
      if (startDate) {
        query = query.gte('createdAt', startDate);
      }
      
      if (endDate) {
        query = query.lte('createdAt', endDate);
      }
      
      if (minTotal) {
        query = query.gte('total', minTotal);
      }
      
      if (maxTotal) {
        query = query.lte('total', maxTotal);
      }
      
      // For product filtering, we need to use a more complex query
      if (productId || productType) {
        // First get the orders with the specified product
        const { data: matchingOrders, error: matchingError } = await supabase.rpc(
          'filter_orders_by_product',
          { 
            product_id: productId || null,
            product_type: productType || null
          }
        );
        
        if (matchingError) {
          return NextResponse.json({ error: 'Failed to filter by product', details: matchingError.message }, { status: 500 });
        }
        
        if (matchingOrders && matchingOrders.length > 0) {
          const orderIds = matchingOrders.map(o => o.id);
          query = query.in('id', orderIds);
        } else {
          // No matching orders, return empty result
          return NextResponse.json({
            data: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0,
            },
          });
        }
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error: ordersError, count } = await query;
      
      if (ordersError) {
        return NextResponse.json({ error: 'Failed to fetch orders', details: ordersError.message }, { status: 500 });
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
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating new orders
export async function POST(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      const body = await req.json();
      const validatedOrder = createOrderSchema.parse(body);
      
      const supabase = createClient();
      
      // Get product details for each item
      const orderItems: OrderItem[] = [];
      let subtotal = 0;
      
      for (const item of validatedOrder.items) {
        // Get product details
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('id, name, description, price, type')
          .eq('id', item.productId)
          .single();
          
        if (productError || !product) {
          return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
        }
        
        // Check inventory
        const { data: inventory, error: inventoryError } = await supabase
          .from('inventory')
          .select('quantity')
          .eq('productId', item.productId)
          .single();
          
        if (inventoryError || !inventory) {
          return NextResponse.json({ error: `Inventory not found for product: ${item.productId}` }, { status: 404 });
        }
        
        if (inventory.quantity < item.quantity) {
          return NextResponse.json({ 
            error: `Insufficient inventory for product: ${product.name}`,
            available: inventory.quantity,
            requested: item.quantity
          }, { status: 400 });
        }
        
        // Calculate item total
        const totalPrice = product.price * item.quantity;
        subtotal += totalPrice;
        
        // Add to order items
        orderItems.push({
          id: uuidv4(),
          productId: item.productId,
          productType: product.type,
          name: product.name,
          description: product.description,
          quantity: item.quantity,
          unitPrice: product.price,
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
      
      // Create new order
      const newOrder: Omit<Order, 'id'> = {
        userId,
        items: orderItems,
        subtotal,
        tax,
        total,
        status: 'draft',
        shippingAddress: validatedOrder.shippingAddress,
        billingAddress: validatedOrder.billingAddress || validatedOrder.shippingAddress,
        notes: validatedOrder.notes,
        shippingMethod,
        shippingCost,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: validatedOrder.metadata
      };
      
      const { data: order, error: insertError } = await supabase
        .from('orders')
        .insert({
          id: uuidv4(),
          ...newOrder
        })
        .select()
        .single();
        
      if (insertError) {
        return NextResponse.json({ 
          error: 'Failed to create order',
          details: insertError.message
        }, { status: 500 });
      }
      
      // Update inventory (reserve items)
      const inventoryUpdates: InventoryUpdate[] = orderItems.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        operation: 'decrement'
      }));
      
      const inventoryResult = await updateInventory(inventoryUpdates);
      
      if (!inventoryResult.success) {
        // If inventory update fails, delete the order and return error
        await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
          
        return NextResponse.json({ 
          error: 'Failed to update inventory',
          details: inventoryResult.error
        }, { status: 500 });
      }
      
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
    
    if (!authenticated) {
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
      
      const supabase = createClient();
      
      // Check if order exists and belongs to user
      const { data: existingOrder, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
        
      if (orderError || !existingOrder) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }
      
      // Check if user owns this order or is admin
      if (existingOrder.userId !== userId) {
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
      
      // Prevent updates to completed, cancelled, or refunded orders (except by admin)
      const restrictedStatuses = ['delivered', 'cancelled', 'refunded'];
      if (
        restrictedStatuses.includes(existingOrder.status) && 
        (!userRole || userRole.role !== 'admin')
      ) {
        return NextResponse.json({ 
          error: `Cannot update ${existingOrder.status} order`,
        }, { status: 400 });
      }
      
      // Handle item updates (if any)
      let subtotal = existingOrder.subtotal;
      let orderItems = existingOrder.items;
      
      if (validatedUpdate.items) {
        // Calculate inventory changes
        const inventoryUpdates: InventoryUpdate[] = [];
        
        // First, return all existing items to inventory
        for (const item of existingOrder.items) {
          inventoryUpdates.push({
            productId: item.productId,
            quantity: item.quantity,
            operation: 'increment'
          });
        }
        
        // Get product details for new items
        orderItems = [];
        subtotal = 0;
        
        for (const item of validatedUpdate.items) {
          // Get product details
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('id, name, description, price, type')
            .eq('id', item.productId)
            .single();
            
          if (productError || !product) {
            return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 404 });
          }
          
          // Calculate item total
          const totalPrice = product.price * item.quantity;
          subtotal += totalPrice;
          
          // Add to order items
          orderItems.push({
            id: uuidv4(),
            productId: item.productId,
            productType: product.type,
            name: product.name,
            description: product.description,
            quantity: item.quantity,
            unitPrice: product.price,
            totalPrice,
            metadata: item.metadata
          });
          
          // Reserve new items
          inventoryUpdates.push({
            productId: item.productId,
            quantity: item.quantity,
            operation: 'decrement'
          });
        }
        
        // Update inventory
        const inventoryResult = await updateInventory(inventoryUpdates);
        
        if (!inventoryResult.success) {
          return NextResponse.json({ 
            error: 'Failed to update inventory',
            details: inventoryResult.error
          }, { status: 500 });
        }
      }
      
      // Calculate tax
      const tax = calculateGST(subtotal);
      
      // Calculate shipping cost
      const shippingMethod = validatedUpdate.shippingMethod || existingOrder.shippingMethod || 'standard';
      const shippingAddress = validatedUpdate.shippingAddress || existingOrder.shippingAddress;
      
      const shippingCost = await calculateShippingCost(
        orderItems,
        shippingMethod,
        shippingAddress
      );
      
      // Calculate total
      const total = subtotal + tax + shippingCost;
      
      // Prepare updates
      const updates: Partial<Order> = {
        ...validatedUpdate,
        items: orderItems,
        subtotal,
        tax,
        total,
        shippingCost,
        updatedAt: new Date().toISOString(),
      };
      
      // Add timestamps based on status changes
      if (validatedUpdate.status) {
        if (validatedUpdate.status === 'delivered' && existingOrder.status !== 'delivered') {
          updates.completedAt = new Date().toISOString();
        } else if (validatedUpdate.status === 'cancelled' && existingOrder.status !== 'cancelled') {
          updates.cancelledAt = new Date().toISOString();
        } else if (validatedUpdate.status === 'refunded' && existingOrder.status !== 'refunded') {
          updates.refundedAt = new Date().toISOString();
        }
      }
      
      // Update order
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();
        
      if (updateError) {
        return NextResponse.json({ 
          error: 'Failed to update order',
          details: updateError.message
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
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/');
    
    if (path.length < 4) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }
    
    const orderId = path[3];
    
    const supabase = createClient();
    
    // Check if order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
      
    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // Check if user owns this order or is admin
    if (order.userId !== userId) {
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
    
    // Only allow cancellation of draft, pending, or paid orders
    const allowedStatuses = ['draft', 'pending', 'paid'];
    if (!allowedStatuses.includes(order.status)) {
      return NextResponse.json({ 
        error: `Cannot cancel ${order.status} order`,
      }, { status: 400 });
    }
    
    // If order has a payment, cancel it
    if (order.paymentId) {
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select('*')
        .eq('id', order.paymentId)
        .single();
        
      if (!paymentError && payment) {
        // Only try to cancel if payment is pending or processing
        if (payment.status === 'pending' || payment.status === 'processing') {
          // Make API call to cancel payment
          const response = await fetch(`/api/payments/${payment.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            return NextResponse.json({ 
              error: 'Failed to cancel payment',
              details: await response.json()
            }, { status: 500 });
          }
        }
      }
    }
    
    // Return items to inventory
    const inventoryUpdates: InventoryUpdate[] = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      operation: 'increment'
    }));
    
    const inventoryResult = await updateInventory(inventoryUpdates);
    
    if (!inventoryResult.success) {
      return NextResponse.json({ 
        error: 'Failed to update inventory',
        details: inventoryResult.error
      }, { status: 500 });
    }
    
    // Update order status to cancelled
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
        cancelledAt: new Date().toISOString(),
        metadata: {
          ...order.metadata,
          cancellationReason: 'User cancelled',
          cancelledBy: userId
        }
      })
      .eq('id', orderId);
      
    if (updateError) {
      return NextResponse.json({ 
        error: 'Failed to cancel order',
        details: updateError.message
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Order cancelled successfully'
    });
    
  } catch (error) {
    console.error('Order API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
