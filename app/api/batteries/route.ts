import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { auth } from '@/lib/auth';
import { batteryModels, batterySystems, batteryMonitoring, brands, manufacturers, users } from '@/lib/db/schema';
import { eq, and, desc, sql, gte, lte, or, like, asc } from 'drizzle-orm';
import AlphaESSClient from '@/lib/batteries/alphaess';
import LGClient from '@/lib/batteries/lg';
import { applyRateLimit, rateLimitPresets } from '@/lib/rate-limit';

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
  const session = await auth();

  if (!session || !session.user) {
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
        const system = await db
          .select()
          .from(batterySystems)
          .where(eq(batterySystems.id, systemId))
          .limit(1)
          .then(rows => rows[0]);

        if (!system) {
          return NextResponse.json({ error: 'System not found' }, { status: 404 });
        }

        // Check if user owns this system
        if (system.userId !== userId) {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get monitoring data based on battery type
        let monitoringData: BatteryMonitoringData;

        if (system.apiProvider === 'alphaess') {
          // Get battery status from AlphaESS API
          const status = await AlphaESSClient.getBatteryStatus(system.serialNumber);
          monitoringData = status as any as BatteryMonitoringData;
        } else if (system.apiProvider === 'lg') {
          // Get battery status from LG API
          const status = await LGClient.getBatteryStatus(system.serialNumber);
          monitoringData = status as any as BatteryMonitoringData;
        } else {
          // Generic monitoring data retrieval
          const latestMonitoring = await db
            .select()
            .from(batteryMonitoring)
            .where(eq(batteryMonitoring.batterySystemId, systemId))
            .orderBy(desc(batteryMonitoring.createdAt))
            .limit(1)
            .then(rows => rows[0]);

          if (!latestMonitoring) {
            return NextResponse.json({ error: 'Monitoring data not available' }, { status: 404 });
          }

          monitoringData = latestMonitoring as any as BatteryMonitoringData;
        }

        return NextResponse.json(monitoringData);
      }
      
      // If requesting a specific system
      if (!authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const system = await db
        .select()
        .from(batterySystems)
        .where(eq(batterySystems.id, systemId))
        .limit(1)
        .then(rows => rows[0]);

      if (!system) {
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

      // Build conditions array
      const conditions = [];

      if (manufacturer) {
        // Need to join with manufacturers table
        conditions.push(eq(manufacturers.name, manufacturer));
      }

      if (minCapacity) {
        conditions.push(gte(batteryModels.capacity, minCapacity.toString()));
      }

      if (maxCapacity) {
        conditions.push(lte(batteryModels.capacity, maxCapacity.toString()));
      }

      if (minPrice) {
        conditions.push(gte(batteryModels.basePrice, minPrice.toString()));
      }

      if (maxPrice) {
        conditions.push(lte(batteryModels.basePrice, maxPrice.toString()));
      }

      // Note: rebateEligible and availableInAU are not in current schema
      // These would need to be added to metadata or as separate fields

      // Build query with joins
      const query = db
        .select({
          id: batteryModels.id,
          name: batteryModels.name,
          manufacturer: manufacturers.name,
          brand: brands.name,
          model: batteryModels.modelNumber,
          capacity: batteryModels.capacity,
          maxPower: batteryModels.maxDischargePower,
          cycles: batteryModels.cycleLife,
          warranty: batteryModels.warrantyYears,
          dimensions: batteryModels.dimensions,
          weight: batteryModels.weight,
          price: batteryModels.basePrice,
          description: batteryModels.description,
          imageUrl: sql<string>`${batteryModels.images}->0`,
          features: batteryModels.features,
          certifications: batteryModels.certifications,
          chemistry: batteryModels.chemistry,
          efficiency: batteryModels.efficiency,
          inStock: batteryModels.inStock,
          metadata: batteryModels.metadata,
        })
        .from(batteryModels)
        .leftJoin(manufacturers, eq(batteryModels.manufacturerId, manufacturers.id))
        .leftJoin(brands, eq(batteryModels.brandId, brands.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Apply sorting
      const sortColumn = {
        price: batteryModels.basePrice,
        capacity: batteryModels.capacity,
        warranty: batteryModels.warrantyYears,
        name: batteryModels.name,
      }[sortBy];

      const orderedQuery = query.orderBy(
        sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn)
      );

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedQuery = orderedQuery.limit(limit).offset(offset);

      // Execute query
      const data = await paginatedQuery;

      // Get total count
      const countQuery = db
        .select({ count: sql<number>`count(*)` })
        .from(batteryModels)
        .leftJoin(manufacturers, eq(batteryModels.manufacturerId, manufacturers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      const countResult = await countQuery;
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
    console.error('Battery API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST handler for creating new battery products or systems
export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req, rateLimitPresets.api);
    if (rateLimitResult) return rateLimitResult;

    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/');
    const body = await req.json();

    // Check if this is a request to add a new system
    if (path.length === 3) {
      try {
        // Validate battery system data
        const validatedSystem = batterySystemSchema.parse(body);

        // Check if the product exists
        const product = await db
          .select()
          .from(batteryModels)
          .where(eq(batteryModels.id, validatedSystem.productId))
          .limit(1)
          .then(rows => rows[0]);

        if (!product) {
          return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Create new battery system
        const newSystem = {
          userId,
          batteryModelId: validatedSystem.productId,
          serialNumber: validatedSystem.serialNumber,
          name: body.name || `Battery System ${validatedSystem.serialNumber}`,
          status: validatedSystem.status,
          installedAt: new Date(validatedSystem.installDate),
          installationAddress: {
            street: validatedSystem.location.address,
            city: validatedSystem.location.address.split(',')[1]?.trim() || '',
            state: validatedSystem.location.state,
            postcode: validatedSystem.location.postcode,
            country: 'Australia',
          },
          capacity: validatedSystem.configuration.capacity.toString(),
          apiProvider: body.apiProvider || null,
          // Store API credentials as JSON (consider encryption in production)
          apiCredentials: body.apiCredentials || null,
          metadata: {
            installerInfo: validatedSystem.installerInfo,
            gridConnection: validatedSystem.gridConnection,
            configuration: validatedSystem.configuration,
            firmwareVersion: validatedSystem.firmwareVersion,
            monitoringEnabled: validatedSystem.monitoringEnabled,
          },
        };

        const [insertedSystem] = await db
          .insert(batterySystems)
          .values(newSystem)
          .returning();

        // Note: Real-time monitoring setup would be handled by a separate service
        // that polls the battery status and stores it in the database

        return NextResponse.json(insertedSystem, { status: 201 });
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          return NextResponse.json({ error: 'Invalid battery system data', details: validationError.format() }, { status: 400 });
        }
        throw validationError;
      }
    }

    // If it's a request to add a new product (admin only)
    // Check if user is admin
    const user = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0]);

    if (!user || (user.role !== 'platform_admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    try {
      // Validate battery product data
      const validatedProduct = batteryProductSchema.parse(body);

      // Create new battery product
      const newProduct = {
        brandId: body.brandId,
        manufacturerId: body.manufacturerId,
        name: validatedProduct.name,
        slug: validatedProduct.name.toLowerCase().replace(/\s+/g, '-'),
        modelNumber: validatedProduct.model,
        description: validatedProduct.description,
        images: [validatedProduct.imageUrl],
        capacity: validatedProduct.capacity.toString(),
        chemistry: body.chemistry || 'lithium-ion',
        warrantyYears: validatedProduct.warranty,
        cycleLife: validatedProduct.cycles,
        maxDischargePower: validatedProduct.maxPower.toString(),
        maxChargePower: validatedProduct.maxPower.toString(),
        dimensions: validatedProduct.dimensions,
        weight: validatedProduct.weight.toString(),
        basePrice: validatedProduct.price.toString(),
        features: validatedProduct.features,
        certifications: validatedProduct.certifications,
        metadata: {
          rebateEligible: validatedProduct.rebateEligible,
          availableInAU: validatedProduct.availableInAU,
          datasheet: validatedProduct.datasheet,
          compatibleInverters: validatedProduct.compatibleInverters,
        },
      };

      const [insertedProduct] = await db
        .insert(batteryModels)
        .values(newProduct)
        .returning();

      return NextResponse.json(insertedProduct, { status: 201 });
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
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req, rateLimitPresets.api);
    if (rateLimitResult) return rateLimitResult;

    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/');

    if (path.length < 4) {
      return NextResponse.json({ error: 'System ID required' }, { status: 400 });
    }

    const systemId = path[3];
    const body = await req.json();

    // Check if system exists and belongs to user
    const system = await db
      .select()
      .from(batterySystems)
      .where(eq(batterySystems.id, systemId))
      .limit(1)
      .then(rows => rows[0]);

    if (!system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }

    if (system.userId !== userId) {
      // Check if user is admin
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then(rows => rows[0]);

      if (!user || (user.role !== 'platform_admin' && user.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Build updates object
    const updates: any = {
      updatedAt: new Date(),
    };

    if (body.name) updates.name = body.name;
    if (body.status) updates.status = body.status;
    if (body.capacity) updates.capacity = body.capacity.toString();
    if (body.apiProvider) updates.apiProvider = body.apiProvider;
    if (body.apiCredentials) {
      // Store API credentials as JSON (consider encryption in production)
      updates.apiCredentials = body.apiCredentials;
    }
    if (body.metadata) {
      updates.metadata = {
        ...(system.metadata as Record<string, any> || {}),
        ...body.metadata,
      };
    }

    // Update system
    const [updatedSystem] = await db
      .update(batterySystems)
      .set(updates)
      .where(eq(batterySystems.id, systemId))
      .returning();

    return NextResponse.json(updatedSystem);

  } catch (error) {
    console.error('Battery API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE handler for removing battery systems
export async function DELETE(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(req, rateLimitPresets.api);
    if (rateLimitResult) return rateLimitResult;

    const { authenticated, error, userId } = await authenticateRequest(req);

    if (!authenticated || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const path = url.pathname.split('/');

    if (path.length < 4) {
      return NextResponse.json({ error: 'System ID required' }, { status: 400 });
    }

    const systemId = path[3];

    // Check if system exists and belongs to user
    const system = await db
      .select()
      .from(batterySystems)
      .where(eq(batterySystems.id, systemId))
      .limit(1)
      .then(rows => rows[0]);

    if (!system) {
      return NextResponse.json({ error: 'System not found' }, { status: 404 });
    }

    if (system.userId !== userId) {
      // Check if user is admin
      const user = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then(rows => rows[0]);

      if (!user || (user.role !== 'platform_admin' && user.role !== 'super_admin')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    // Delete system (monitoring data will be cascade deleted)
    await db
      .delete(batterySystems)
      .where(eq(batterySystems.id, systemId));

    return NextResponse.json({ success: true, message: 'System deleted successfully' });

  } catch (error) {
    console.error('Battery API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
