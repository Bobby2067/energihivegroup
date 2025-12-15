/**
 * Drizzle ORM Database Schema
 *
 * Complete schema for Energi Hive platform including:
 * - NextAuth v5 tables
 * - User profiles and roles
 * - Product catalog (batteries, brands, manufacturers)
 * - Orders and payments
 * - Battery systems and monitoring
 * - Rebates, reviews, and newsletters
 */

import { pgTable, text, timestamp, boolean, integer, decimal, json, uuid, pgEnum, primaryKey } from 'drizzle-orm/pg-core';
import type { AdapterAccount } from '@auth/core/adapters';

// ===== ENUMS =====

export const userRoleEnum = pgEnum('user_role', [
  'customer',
  'installer',
  'distributor',
  'community_leader',
  'community_admin',
  'platform_admin',
  'super_admin'
]);

export const batteryChemistryEnum = pgEnum('battery_chemistry', [
  'lithium_ion',
  'lithium_iron_phosphate',
  'lead_acid',
  'sodium_ion',
  'flow_battery'
]);

export const australianStateEnum = pgEnum('australian_state', [
  'NSW',
  'VIC',
  'QLD',
  'SA',
  'WA',
  'TAS',
  'NT',
  'ACT'
]);

export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing',
  'completed',
  'failed',
  'refunded'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'bpay',
  'payid',
  'gocardless',
  'bank_transfer'
]);

export const batterySystemStatusEnum = pgEnum('battery_system_status', [
  'active',
  'inactive',
  'maintenance',
  'error'
]);

// ===== NEXTAUTH V5 TABLES =====

export const users = pgTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  role: userRoleEnum('role').notNull().default('customer'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const accounts = pgTable('account', {
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').$type<AdapterAccount['type']>().notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (account) => ({
  compoundKey: primaryKey({
    columns: [account.provider, account.providerAccountId],
  }),
}));

export const sessions = pgTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

export const verificationTokens = pgTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

export const passwordResetTokens = pgTable('password_reset_token', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

// ===== USER PROFILES =====

export const profiles = pgTable('profiles', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('firstName'),
  lastName: text('lastName'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: australianStateEnum('state'),
  postcode: text('postcode'),
  country: text('country').default('Australia'),
  companyName: text('companyName'),
  abn: text('abn'),
  licenseNumber: text('licenseNumber'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

// ===== PRODUCT CATALOG =====

export const brands = pgTable('brands', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo: text('logo'),
  website: text('website'),
  countryOfOrigin: text('countryOfOrigin'),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const manufacturers = pgTable('manufacturers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  logo: text('logo'),
  website: text('website'),
  countryOfOrigin: text('countryOfOrigin'),
  certifications: json('certifications').$type<string[]>(),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const batteryModels = pgTable('battery_models', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  brandId: text('brandId')
    .notNull()
    .references(() => brands.id, { onDelete: 'cascade' }),
  manufacturerId: text('manufacturerId')
    .notNull()
    .references(() => manufacturers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  modelNumber: text('modelNumber').notNull(),
  description: text('description'),
  images: json('images').$type<string[]>(),

  // Technical specifications
  capacity: decimal('capacity', { precision: 10, scale: 2 }).notNull(), // kWh
  voltage: decimal('voltage', { precision: 10, scale: 2 }), // V
  chemistry: batteryChemistryEnum('chemistry').notNull(),
  warrantyYears: integer('warrantyYears'),
  cycleLife: integer('cycleLife'),
  maxDischargePower: decimal('maxDischargePower', { precision: 10, scale: 2 }), // kW
  maxChargePower: decimal('maxChargePower', { precision: 10, scale: 2 }), // kW
  efficiency: decimal('efficiency', { precision: 5, scale: 2 }), // percentage
  dimensions: json('dimensions').$type<{ width: number; height: number; depth: number }>(),
  weight: decimal('weight', { precision: 10, scale: 2 }), // kg

  // Pricing and availability
  basePrice: decimal('basePrice', { precision: 10, scale: 2 }).notNull(),
  installationCost: decimal('installationCost', { precision: 10, scale: 2 }),
  inStock: boolean('inStock').default(true),
  stockQuantity: integer('stockQuantity').default(0),

  // Features and certifications
  features: json('features').$type<string[]>(),
  certifications: json('certifications').$type<string[]>(),
  isActive: boolean('isActive').default(true),
  isFeatured: boolean('isFeatured').default(false),

  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const priceTiers = pgTable('price_tiers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  batteryModelId: text('batteryModelId')
    .notNull()
    .references(() => batteryModels.id, { onDelete: 'cascade' }),
  minQuantity: integer('minQuantity').notNull(),
  maxQuantity: integer('maxQuantity'),
  discountPercentage: decimal('discountPercentage', { precision: 5, scale: 2 }).notNull(),
  pricePerUnit: decimal('pricePerUnit', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

// ===== ORDERS AND PAYMENTS =====

export const orders = pgTable('orders', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderNumber: text('orderNumber').notNull().unique(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Order details
  status: orderStatusEnum('status').notNull().default('pending'),
  batteryModelId: text('batteryModelId')
    .references(() => batteryModels.id, { onDelete: 'set null' }),
  quantity: integer('quantity').notNull().default(1),

  // Pricing
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  discount: decimal('discount', { precision: 10, scale: 2 }).default('0'),
  tax: decimal('tax', { precision: 10, scale: 2 }).default('0'),
  shippingCost: decimal('shippingCost', { precision: 10, scale: 2 }).default('0'),
  total: decimal('total', { precision: 10, scale: 2 }).notNull(),

  // Shipping and billing
  shippingAddress: json('shippingAddress').$type<{
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  }>(),
  billingAddress: json('billingAddress').$type<{
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  }>(),

  // Tracking
  trackingNumber: text('trackingNumber'),
  estimatedDelivery: timestamp('estimatedDelivery', { mode: 'date' }),
  deliveredAt: timestamp('deliveredAt', { mode: 'date' }),

  // Notes and metadata
  notes: text('notes'),
  metadata: json('metadata').$type<Record<string, any>>(),

  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  orderId: text('orderId')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  // Payment details
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').notNull().default('pending'),
  paymentMethod: paymentMethodEnum('paymentMethod').notNull(),
  reference: text('reference').notNull().unique(),

  // Provider-specific data
  providerPaymentId: text('providerPaymentId'),
  providerResponse: json('providerResponse').$type<Record<string, any>>(),

  // Refund tracking
  refundedAmount: decimal('refundedAmount', { precision: 10, scale: 2 }).default('0'),
  refundedAt: timestamp('refundedAt', { mode: 'date' }),

  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
  completedAt: timestamp('completedAt', { mode: 'date' }),
});

// ===== BATTERY SYSTEMS AND MONITORING =====

export const batterySystems = pgTable('battery_systems', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  batteryModelId: text('batteryModelId')
    .references(() => batteryModels.id, { onDelete: 'set null' }),

  // System details
  serialNumber: text('serialNumber').notNull().unique(),
  name: text('name').notNull(),
  status: batterySystemStatusEnum('status').notNull().default('active'),

  // Installation details
  installedAt: timestamp('installedAt', { mode: 'date' }),
  installerId: text('installerId')
    .references(() => users.id, { onDelete: 'set null' }),
  installationAddress: json('installationAddress').$type<{
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  }>(),

  // Configuration
  capacity: decimal('capacity', { precision: 10, scale: 2 }).notNull(),
  maxChargePower: decimal('maxChargePower', { precision: 10, scale: 2 }),
  maxDischargePower: decimal('maxDischargePower', { precision: 10, scale: 2 }),

  // API integration
  apiProvider: text('apiProvider'), // 'alphaess', 'lg', etc.
  apiCredentials: json('apiCredentials').$type<Record<string, any>>(),
  lastSync: timestamp('lastSync', { mode: 'date' }),

  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const batteryMonitoring = pgTable('battery_monitoring', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  batterySystemId: text('batterySystemId')
    .notNull()
    .references(() => batterySystems.id, { onDelete: 'cascade' }),

  // State of charge and power
  stateOfCharge: decimal('stateOfCharge', { precision: 5, scale: 2 }).notNull(), // percentage
  power: decimal('power', { precision: 10, scale: 2 }).notNull(), // kW (positive = charging, negative = discharging)

  // Energy metrics
  energyIn: decimal('energyIn', { precision: 10, scale: 2 }), // kWh (total charged today)
  energyOut: decimal('energyOut', { precision: 10, scale: 2 }), // kWh (total discharged today)

  // Solar and grid
  solarGeneration: decimal('solarGeneration', { precision: 10, scale: 2 }), // kW
  gridImport: decimal('gridImport', { precision: 10, scale: 2 }), // kW
  gridExport: decimal('gridExport', { precision: 10, scale: 2 }), // kW

  // System health
  temperature: decimal('temperature', { precision: 5, scale: 2 }), // Celsius
  voltage: decimal('voltage', { precision: 10, scale: 2 }), // V
  current: decimal('current', { precision: 10, scale: 2 }), // A

  // Timestamps
  recordedAt: timestamp('recordedAt', { mode: 'date' }).notNull().defaultNow(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
});

// ===== REBATES AND REVIEWS =====

export const rebates = pgTable('rebates', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  state: australianStateEnum('state').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }),
  validFrom: timestamp('validFrom', { mode: 'date' }).notNull(),
  validUntil: timestamp('validUntil', { mode: 'date' }),
  eligibilityCriteria: json('eligibilityCriteria').$type<Record<string, any>>(),
  isActive: boolean('isActive').default(true),
  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  batteryModelId: text('batteryModelId')
    .notNull()
    .references(() => batteryModels.id, { onDelete: 'cascade' }),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  rating: integer('rating').notNull(), // 1-5
  title: text('title'),
  content: text('content'),
  pros: json('pros').$type<string[]>(),
  cons: json('cons').$type<string[]>(),

  isVerified: boolean('isVerified').default(false),
  isApproved: boolean('isApproved').default(false),

  metadata: json('metadata').$type<Record<string, any>>(),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull().defaultNow(),
});

export const newsletters = pgTable('newsletters', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  firstName: text('firstName'),
  lastName: text('lastName'),
  isSubscribed: boolean('isSubscribed').default(true),
  subscribedAt: timestamp('subscribedAt', { mode: 'date' }).notNull().defaultNow(),
  unsubscribedAt: timestamp('unsubscribedAt', { mode: 'date' }),
  metadata: json('metadata').$type<Record<string, any>>(),
});

// ===== TYPE EXPORTS =====

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type BatteryModel = typeof batteryModels.$inferSelect;
export type NewBatteryModel = typeof batteryModels.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type BatterySystem = typeof batterySystems.$inferSelect;
export type NewBatterySystem = typeof batterySystems.$inferInsert;
export type BatteryMonitoring = typeof batteryMonitoring.$inferSelect;
export type NewBatteryMonitoring = typeof batteryMonitoring.$inferInsert;
