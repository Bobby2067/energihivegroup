import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { AlphaESSClient } from '@/lib/batteries/alphaess';
import { LGClient } from '@/lib/batteries/lg';
import { v4 as uuidv4 } from 'uuid';

// Battery data interfaces
export interface BatteryProduct {
  id: string;
  name: string;
  manufacturer: 'AlphaESS' | 'LG RESU' | 'Tesla' | 'BYD' | 'Sonnen' | 'Other';
  model: string;
  capacity: number; // in kWh
  maxPower: number; // in kW
  cycles: number;
  warranty: number; // in years
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  weight: number; // in kg
  price: number; // in AUD
  rebateEligible: boolean; // Australian rebate eligibility
  certifications: string[]; // Australian certifications
  description: string;
  imageUrl: string;
  datasheet: string;
  features: string[];
  compatibleInverters: string[];
  availableInAU: boolean;
}

export interface BatterySystem {
  id: string;
  userId: string;
  productId: string;
  serialNumber: string;
  installDate: string;
  installerInfo: {
    name: string;
    license: string;
    company: string;
    contactNumber: string;
  };
  location: {
    address: string;
    postcode: string;
    state: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  gridConnection: {
    provider: string;
    nmi: string; // National Metering Identifier (Australia specific)
    tariff: string;
  };
  configuration: {
    capacity: number;
    modules: number;
    backup: boolean;
    selfConsumption: boolean;
    gridExport: boolean;
    timeOfUse: boolean;
  };
  status: 'active' | 'inactive' | 'maintenance' | 'error';
  lastUpdated: string;
  firmwareVersion: string;
  monitoringEnabled: boolean;
}

export interface BatteryMonitoringData {
  systemId: string;
  timestamp: string;
  stateOfCharge: number;
  powerFlow: {
    batteryToLoad: number;
    solarToBattery: number;
    solarToGrid: number;
    solarToLoad: number;
    gridToBattery: number;
    gridToLoad: number;
    batteryToGrid: number;
  };
  energy: {
    batteryCapacity: number;
    dailySolarGeneration: number;
    dailyConsumption: number;
    dailyGridImport: number;
    dailyGridExport: number;
    dailySelfConsumption: number;
  };
  temperature: number;
  voltage: number;
  current: number;
  cycles: number;
  alerts: {
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
    resolved: boolean;
  }[];
  forecast?: {
    nextChargePeriod: string;
    expectedMinSoC: number;
    weatherImpact: 'high' | 'medium' | 'low';
  };
}

// Validation schemas
const batteryProductSchema = z.object({
  name: z.string().min(1),
  manufacturer: z.enum(['AlphaESS', 'LG RESU', 'Tesla', 'BYD', 'Sonnen', 'Other']),
  model: z.string().min(1),
  capacity: z.number().positive(),
  maxPower: z.number().positive(),
  cycles: z.number().int().positive(),
  warranty: z.number().int().positive(),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
    depth: z.number().positive(),
  }),
  weight: z.number().positive(),
  price: z.number().positive(),
  rebateEligible: z.boolean(),
  certifications: z.array(z.string()),
  description: z.string(),
  imageUrl: z.string().url(),
  datasheet: z.string().url(),
  features: z.array(z.string()),
  compatibleInverters: z.array(z.string()),
  availableInAU: z.boolean(),
});

const batterySystemSchema = z.object({
  productId: z.string().uuid(),
  serialNumber: z.string().min(1),
  installDate: z.string().datetime(),
  installerInfo: z.object({
    name: z.string().min(1),
    license: z.string().min(1),
    company: z.string().min(1),
    contactNumber: z.string().min(1),
  }),
  location: z.object({
    address: z.string().min(1),
    postcode: z.string().length(4).regex(/^\d{4}$/), // Australian postcodes are 4 digits
    state: z.enum(['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT']), // Australian states
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).optional(),
  }),
  gridConnection: z.object({
    provider: z.string().min(1),
    nmi: z.string().length(10).regex(/^\d{10}$/), // Australian NMI format
    tariff: z.string().min(1),
  }),
  configuration: z.object({
    capacity: z.number().positive(),
    modules: z.number().int().positive(),
    backup: z.boolean(),
    selfConsumption: z.boolean(),
    gridExport: z.boolean(),
    timeOfUse: z.boolean(),
  }),
  status: z.enum(['active', 'inactive', 'maintenance', 'error']),
  firmwareVersion: z.string(),
  monitoringEnabled: z.boolean(),
});

const queryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  manufacturer: z.string().optional(),
  minCapacity: z.coerce.number().optional(),
  maxCapacity: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  rebateEligible: z.enum(['true', 'false']).optional(),
  availableInAU: z.enum(['true', 'false']).optional(),
  sortBy: z.enum(['price', 'capacity', 'warranty', 'name']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
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

// GET handler for listing battery products with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);
    
    // For product listing, we'll allow public access but log the user if authenticated
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams);
    const path = url.pathname.split('/');
    
    // Check if this is a request for a specific system or monitoring data
    if (path.length > 3) {
      const systemId = path[3];
      
      // If requesting monitoring data for a specific system
      if (path[4] === 'monitoring') {
        if (!authenticated) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Get real-time monitoring data
        const supabase = createClient();
        const { data: system, error: systemError } = await supabase
          .from('battery_systems')
          .select('*')
          .eq('id', systemId)
          .single();
          
        if (systemError || !system) {
          return NextResponse.json({ error: 'System not found' }, { status: 404 });
        }
        
        // Check if user owns this system
        if (system.userId !== userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        
        // Get monitoring data based on battery type
        let monitoringData: BatteryMonitoringData;
        
        if (system.manufacturer === 'AlphaESS') {
          const alphaESSClient = new AlphaESSClient();
          monitoringData = await alphaESSClient.getRealtimeData(system.serialNumber);
        } else if (system.manufacturer === 'LG RESU') {
          const lgClient = new LGClient();
          monitoringData = await lgClient.getRealtimeData(system.serialNumber);
        } else {
          // Generic monitoring data retrieval
          const { data, error: monitoringError } = await supabase
            .from('battery_monitoring')
            .select('*')
            .eq('systemId', systemId)
            .order('timestamp', { ascending: false })
            .limit(1)
            .single();
            
          if (monitoringError || !data) {
            return NextResponse.json({ error: 'Monitoring data not available' }, { status: 404 });
          }
          
          monitoringData = data as BatteryMonitoringData;
        }
        
        return NextResponse.json(monitoringData);
      }
      
      // If requesting a specific system
      if (!authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      const supabase = createClient();
      const { data: system, error: systemError } = await supabase
        .from('battery_systems')
        .select('*')
        .eq('id', systemId)
        .single();
        
      if (systemError || !system) {
        return NextResponse.json({ error: 'System not found' }, { status: 404 });
      }
      
      // Check if user owns this system
      if (system.userId !== userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      
      return NextResponse.json(system);
    }
    
    // Handle product listing with filtering and pagination
    try {
      const validatedParams = queryParamsSchema.parse(searchParams);
      const {
        page,
        limit,
        manufacturer,
        minCapacity,
        maxCapacity,
        minPrice,
        maxPrice,
        rebateEligible,
        availableInAU,
        sortBy,
        sortOrder,
      } = validatedParams;
      
      const supabase = createClient();
      let query = supabase.from('battery_products').select('*', { count: 'exact' });
      
      // Apply filters
      if (manufacturer) {
        query = query.eq('manufacturer', manufacturer);
      }
      
      if (minCapacity) {
        query = query.gte('capacity', minCapacity);
      }
      
      if (maxCapacity) {
        query = query.lte('capacity', maxCapacity);
      }
      
      if (minPrice) {
        query = query.gte('price', minPrice);
      }
      
      if (maxPrice) {
        query = query.lte('price', maxPrice);
      }
      
      if (rebateEligible) {
        query = query.eq('rebateEligible', rebateEligible === 'true');
      }
      
      if (availableInAU) {
        query = query.eq('availableInAU', availableInAU === 'true');
      }
      
      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);
      
      const { data, error: productsError, count } = await query;
      
      if (productsError) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
    console.error('Battery API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating new battery products or systems
export async function POST(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/');
    const body = await req.json();
    
    const supabase = createClient();
    
    // Check if this is a request to add a new system
    if (path.length === 3) {
      try {
        // Validate battery system data
        const validatedSystem = batterySystemSchema.parse(body);
        
        // Check if the product exists
        const { data: product, error: productError } = await supabase
          .from('battery_products')
          .select('id')
          .eq('id', validatedSystem.productId)
          .single();
          
        if (productError || !product) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }
        
        // Create new battery system
        const newSystem: BatterySystem = {
          id: uuidv4(),
          userId,
          ...validatedSystem,
          lastUpdated: new Date().toISOString(),
        };
        
        const { error: insertError } = await supabase
          .from('battery_systems')
          .insert(newSystem);
          
        if (insertError) {
          return NextResponse.json({ error: 'Failed to create battery system', details: insertError.message }, { status: 500 });
        }
        
        // Initialize monitoring for the system based on manufacturer
        if (body.manufacturer === 'AlphaESS') {
          const alphaESSClient = new AlphaESSClient();
          await alphaESSClient.initializeMonitoring(newSystem.serialNumber, newSystem.id);
        } else if (body.manufacturer === 'LG RESU') {
          const lgClient = new LGClient();
          await lgClient.initializeMonitoring(newSystem.serialNumber, newSystem.id);
        }
        
        return NextResponse.json(newSystem, { status: 201 });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return NextResponse.json({ error: 'Invalid battery system data', details: validationError.format() }, { status: 400 });
        }
        throw validationError;
      }
    }
    
    // If it's a request to add a new product (admin only)
    // Check if user is admin
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
      
    if (!userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    
    try {
      // Validate battery product data
      const validatedProduct = batteryProductSchema.parse(body);
      
      // Create new battery product
      const newProduct: BatteryProduct = {
        id: uuidv4(),
        ...validatedProduct,
      };
      
      const { error: insertError } = await supabase
        .from('battery_products')
        .insert(newProduct);
        
      if (insertError) {
        return NextResponse.json({ error: 'Failed to create battery product', details: insertError.message }, { status: 500 });
      }
      
      return NextResponse.json(newProduct, { status: 201 });
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid battery product data', details: validationError.format() }, { status: 400 });
      }
      throw validationError;
    }
    
  } catch (error) {
    console.error('Battery API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT handler for updating battery systems
export async function PUT(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/');
    
    if (path.length < 4) {
      return NextResponse.json({ error: 'System ID required' }, { status: 400 });
    }
    
    const systemId = path[3];
    const body = await req.json();
    
    const supabase = createClient();
    
    // Check if system exists and belongs to user
    const { data: system, error: systemError } = await supabase
      .from('battery_systems')
      .select('*')
      .eq('id', systemId)
      .single();
      
    if (systemError || !system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }
    
    if (system.userId !== userId) {
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
    
    // Update system
    const updates = {
      ...body,
      lastUpdated: new Date().toISOString(),
    };
    
    const { error: updateError } = await supabase
      .from('battery_systems')
      .update(updates)
      .eq('id', systemId);
      
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update system', details: updateError.message }, { status: 500 });
    }
    
    // Get updated system
    const { data: updatedSystem } = await supabase
      .from('battery_systems')
      .select('*')
      .eq('id', systemId)
      .single();
      
    return NextResponse.json(updatedSystem);
    
  } catch (error) {
    console.error('Battery API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE handler for removing battery systems
export async function DELETE(req: NextRequest) {
  try {
    const { authenticated, error, userId } = await authenticateRequest(req);
    
    if (!authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const url = new URL(req.url);
    const path = url.pathname.split('/');
    
    if (path.length < 4) {
      return NextResponse.json({ error: 'System ID required' }, { status: 400 });
    }
    
    const systemId = path[3];
    
    const supabase = createClient();
    
    // Check if system exists and belongs to user
    const { data: system, error: systemError } = await supabase
      .from('battery_systems')
      .select('*')
      .eq('id', systemId)
      .single();
      
    if (systemError || !system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }
    
    if (system.userId !== userId) {
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
    
    // Delete system
    const { error: deleteError } = await supabase
      .from('battery_systems')
      .delete()
      .eq('id', systemId);
      
    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete system', details: deleteError.message }, { status: 500 });
    }
    
    // Clean up monitoring data
    await supabase
      .from('battery_monitoring')
      .delete()
      .eq('systemId', systemId);
      
    return NextResponse.json({ success: true, message: 'System deleted successfully' });
    
  } catch (error) {
    console.error('Battery API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
