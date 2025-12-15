#!/usr/bin/env ts-node
/**
 * Energi Hive Platform - Database Seed Script
 *
 * This script populates the PostgreSQL database with initial data for:
 * - Manufacturers
 * - Brands
 * - Battery models
 * - Australian rebate programs
 *
 * Usage:
 * npm run seed
 *
 * Note: This script requires DATABASE_URL in .env.local
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '../lib/db/schema';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Validate environment variables
if (!process.env.DATABASE_URL) {
  console.error('Missing required environment variable: DATABASE_URL');
  process.exit(1);
}

// Create database client
const client = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1,
});

const db = drizzle(client, { schema });

// Australian states
const STATES: Array<'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'NT' | 'ACT'> = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

/**
 * Insert seed data into the database
 */
async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Insert manufacturers
    console.log('Inserting manufacturers...');
    const manufacturers = [
      {
        id: uuidv4(),
        name: 'LG Energy Solution',
        country: 'South Korea',
        website: 'https://www.lgessbattery.com/au',
        logoUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        supportEmail: 'support@lgessbattery.com.au',
        supportPhone: '1300 677 273',
        cecApproved: true,
        description: 'Leading manufacturer of lithium-ion battery systems',
        establishedYear: 2011,
      },
      {
        id: uuidv4(),
        name: 'AlphaESS',
        country: 'China',
        website: 'https://www.alpha-ess.com/au',
        logoUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        supportEmail: 'support@alpha-ess.com.au',
        supportPhone: '1300 968 933',
        cecApproved: true,
        description: 'Specializing in lithium iron phosphate battery systems',
        establishedYear: 2012,
      },
      {
        id: uuidv4(),
        name: 'Tesla',
        country: 'United States',
        website: 'https://www.tesla.com/en_au/powerwall',
        logoUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        supportEmail: 'support@tesla.com',
        supportPhone: '1800 646 952',
        cecApproved: true,
        description: 'Premium home battery systems with integrated software',
        establishedYear: 2003,
      },
      {
        id: uuidv4(),
        name: 'BYD',
        country: 'China',
        website: 'https://www.byd.com/au',
        logoUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        supportEmail: 'support@byd.com',
        supportPhone: '1800 293 287',
        cecApproved: true,
        description: 'World leader in battery technology and energy storage',
        establishedYear: 1995,
      },
      {
        id: uuidv4(),
        name: 'SolaX Power',
        country: 'China',
        website: 'https://www.solaxpower.com/au',
        logoUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        supportEmail: 'service@solaxpower.com',
        supportPhone: '1300 476 529',
        cecApproved: true,
        description: 'Innovative solar and battery storage solutions',
        establishedYear: 2010,
      },
    ];

    await db.insert(schema.manufacturers).values(manufacturers).onConflictDoNothing();
    console.log(`✅ Inserted ${manufacturers.length} manufacturers`);

    // Insert brands
    console.log('Inserting brands...');
    const brands = [
      {
        id: uuidv4(),
        name: 'LG RESU',
        manufacturerId: manufacturers[0].id,
        description: 'Residential Energy Storage Unit series',
        logoUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'AlphaESS SMILE',
        manufacturerId: manufacturers[1].id,
        description: 'Modular home battery systems',
        logoUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'Tesla Powerwall',
        manufacturerId: manufacturers[2].id,
        description: 'Integrated home battery solution',
        logoUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        isActive: true,
      },
      {
        id: uuidv4(),
        name: 'BYD B-Box',
        manufacturerId: manufacturers[3].id,
        description: 'Modular battery storage systems',
        logoUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        isActive: true,
      },
    ];

    await db.insert(schema.brands).values(brands).onConflictDoNothing();
    console.log(`✅ Inserted ${brands.length} brands`);

    // Insert battery models
    console.log('Inserting battery models...');
    const batteryModels = [
      {
        id: uuidv4(),
        brandId: brands[0].id, // LG RESU
        modelName: 'RESU10H Prime',
        capacityKwh: '9.6',
        maxPowerKw: '5.0',
        voltage: '400',
        chemistry: 'lithium-ion' as const,
        warrantyYears: 10,
        warrantyCycles: 4000,
        roundTripEfficiency: '94.5',
        depthOfDischarge: '95.0',
        dimensions: '744 x 907 x 206 mm',
        weight: '97.0',
        indoorRated: true,
        ipRating: 'IP55',
        operatingTempMin: '-10.0',
        operatingTempMax: '45.0',
        priceAud: '9500.00',
        imageUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        datasheetUrl: 'https://www.lgessbattery.com/au/home-battery/resu-prime',
        cecApproved: true,
        isActive: true,
      },
      {
        id: uuidv4(),
        brandId: brands[1].id, // AlphaESS
        modelName: 'SMILE-B3',
        capacityKwh: '11.5',
        maxPowerKw: '5.0',
        voltage: '48',
        chemistry: 'lithium-iron-phosphate' as const,
        warrantyYears: 10,
        warrantyCycles: 6000,
        roundTripEfficiency: '95.0',
        depthOfDischarge: '100.0',
        dimensions: '650 x 565 x 200 mm',
        weight: '105.0',
        indoorRated: true,
        ipRating: 'IP65',
        operatingTempMin: '-10.0',
        operatingTempMax: '50.0',
        priceAud: '8500.00',
        imageUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        datasheetUrl: 'https://www.alpha-ess.com/au/smile-b3',
        cecApproved: true,
        isActive: true,
      },
      {
        id: uuidv4(),
        brandId: brands[2].id, // Tesla
        modelName: 'Powerwall 2',
        capacityKwh: '13.5',
        maxPowerKw: '5.0',
        voltage: '50',
        chemistry: 'lithium-ion' as const,
        warrantyYears: 10,
        warrantyCycles: 3500,
        roundTripEfficiency: '90.0',
        depthOfDischarge: '100.0',
        dimensions: '1150 x 755 x 155 mm',
        weight: '114.0',
        indoorRated: false,
        ipRating: 'IP67',
        operatingTempMin: '-20.0',
        operatingTempMax: '50.0',
        priceAud: '12500.00',
        imageUrl: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
        datasheetUrl: 'https://www.tesla.com/en_au/powerwall',
        cecApproved: true,
        isActive: true,
      },
    ];

    await db.insert(schema.batteryModels).values(batteryModels).onConflictDoNothing();
    console.log(`✅ Inserted ${batteryModels.length} battery models`);

    // Insert rebates
    console.log('Inserting Australian rebate programs...');
    const rebates = [
      {
        id: uuidv4(),
        state: 'VIC' as const,
        programName: 'Solar Homes Program - Battery Rebate',
        provider: 'Solar Victoria',
        description: 'Eligible Victorian households can claim a rebate up to $3,500 for the installation of a solar battery system.',
        amountAud: '3500.00',
        startDate: '2021-07-01',
        endDate: '2024-06-30',
        websiteUrl: 'https://www.solar.vic.gov.au/solar-battery-rebate',
        eligibilityCriteria: 'Must be homeowner, combined household income less than $180,000, property value less than $3 million, no existing battery.',
        isActive: true,
      },
      {
        id: uuidv4(),
        state: 'SA' as const,
        programName: 'Home Battery Scheme',
        provider: 'Government of South Australia',
        description: 'The Home Battery Scheme provides South Australian households with subsidies to install home battery systems.',
        amountAud: '2000.00',
        startDate: '2018-10-29',
        endDate: '2023-12-31',
        websiteUrl: 'https://homebatteryscheme.sa.gov.au/',
        eligibilityCriteria: 'Must be SA resident, property owner, have existing or new solar PV system.',
        isActive: true,
      },
      {
        id: uuidv4(),
        state: 'NSW' as const,
        programName: 'Empowering Homes Program',
        provider: 'NSW Government',
        description: 'Interest-free loans for battery and solar-battery systems to eligible NSW residents.',
        amountAud: '9000.00',
        startDate: '2020-02-01',
        endDate: '2024-12-31',
        websiteUrl: 'https://energy.nsw.gov.au/empowering-homes',
        eligibilityCriteria: 'Owner-occupier, household income up to $180,000, eligible postcodes.',
        isActive: true,
      },
      {
        id: uuidv4(),
        state: 'ACT' as const,
        programName: 'Next Generation Energy Storage Program',
        provider: 'ACT Government',
        description: 'Rebates for battery storage systems in ACT homes and businesses.',
        amountAud: '3500.00',
        startDate: '2016-01-01',
        endDate: '2023-12-31',
        websiteUrl: 'https://www.climatechoices.act.gov.au/policy-programs/next-generation-energy-storage',
        eligibilityCriteria: 'ACT property, new or existing solar PV system.',
        isActive: true,
      },
    ];

    await db.insert(schema.rebates).values(rebates).onConflictDoNothing();
    console.log(`✅ Inserted ${rebates.length} rebate programs`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the seed function
seedDatabase();
