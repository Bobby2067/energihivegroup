#!/usr/bin/env ts-node
/**
 * Energi Hive Platform - Database Seed Script
 * 
 * This script populates the Supabase database with initial data for:
 * - Manufacturers
 * - Battery models
 * - Products
 * - Australian electricity retailers and tariffs
 * - VPP programs
 * - Rebates
 * 
 * Usage:
 * npm run seed
 * 
 * Note: This script requires the following environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY (not the anon key)
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createClient } = require('@supabase/supabase-js');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const dotenv = require('dotenv');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4: uuidv4 } = require('uuid');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key (admin privileges)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Australian states
const STATES = ['NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT'];

// Seed data for manufacturers
const manufacturers = [
  {
    id: uuidv4(),
    name: 'LG Energy Solution',
    logo_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    website: 'https://www.lgessbattery.com/au',
    support_email: 'support@lgessbattery.com.au',
    support_phone: '1300 677 273',
    australian_office: true,
    cec_approved: true,
  },
  {
    id: uuidv4(),
    name: 'AlphaESS',
    logo_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    website: 'https://www.alpha-ess.com/au',
    support_email: 'support@alpha-ess.com.au',
    support_phone: '1300 968 933',
    australian_office: true,
    cec_approved: true,
  },
  {
    id: uuidv4(),
    name: 'Tesla',
    logo_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    website: 'https://www.tesla.com/en_au/powerwall',
    support_email: 'support@tesla.com',
    support_phone: '1800 646 952',
    australian_office: true,
    cec_approved: true,
  },
  {
    id: uuidv4(),
    name: 'BYD',
    logo_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    website: 'https://www.byd.com/au',
    support_email: 'support@byd.com',
    support_phone: '1800 BYD AUS',
    australian_office: true,
    cec_approved: true,
  },
  {
    id: uuidv4(),
    name: 'SolaX Power',
    logo_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    website: 'https://www.solaxpower.com/au',
    support_email: 'service@solaxpower.com',
    support_phone: '1300 476 529',
    australian_office: true,
    cec_approved: true,
  },
];

// Seed data for battery models
const batteryModels = [
  {
    id: uuidv4(),
    manufacturer_id: manufacturers[0].id, // LG
    model_name: 'RESU10H Prime',
    capacity_kwh: 9.6,
    max_power_kw: 5.0,
    voltage: 400,
    chemistry: 'lithium-ion',
    warranty_years: 10,
    warranty_cycles: 4000,
    round_trip_efficiency: 94.5,
    depth_of_discharge: 95.0,
    dimensions: '744 x 907 x 206 mm',
    weight: 97.0,
    indoor_rated: true,
    ip_rating: 'IP55',
    operating_temp_min: -10.0,
    operating_temp_max: 45.0,
    price_aud: 9500.00,
    image_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    datasheet_url: 'https://www.lgessbattery.com/au/home-battery/resu-prime',
    api_integration: true,
    api_type: 'LG API',
    is_active: true,
    cec_approved: true,
    cec_listing_date: '2021-03-15',
    clean_energy_rebate_eligible: true,
    vpp_compatible: true,
    australian_warranty: true,
  },
  {
    id: uuidv4(),
    manufacturer_id: manufacturers[1].id, // AlphaESS
    model_name: 'SMILE-B3',
    capacity_kwh: 11.5,
    max_power_kw: 5.0,
    voltage: 48,
    chemistry: 'lithium-iron-phosphate',
    warranty_years: 10,
    warranty_cycles: 6000,
    round_trip_efficiency: 95.0,
    depth_of_discharge: 100.0,
    dimensions: '650 x 565 x 200 mm',
    weight: 105.0,
    indoor_rated: true,
    ip_rating: 'IP65',
    operating_temp_min: -10.0,
    operating_temp_max: 50.0,
    price_aud: 8500.00,
    image_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    datasheet_url: 'https://www.alpha-ess.com/au/smile-b3',
    api_integration: true,
    api_type: 'AlphaESS API',
    is_active: true,
    cec_approved: true,
    cec_listing_date: '2020-05-20',
    clean_energy_rebate_eligible: true,
    vpp_compatible: true,
    australian_warranty: true,
  },
  {
    id: uuidv4(),
    manufacturer_id: manufacturers[2].id, // Tesla
    model_name: 'Powerwall 2',
    capacity_kwh: 13.5,
    max_power_kw: 5.0,
    voltage: 50,
    chemistry: 'lithium-ion',
    warranty_years: 10,
    warranty_cycles: 3500,
    round_trip_efficiency: 90.0,
    depth_of_discharge: 100.0,
    dimensions: '1150 x 755 x 155 mm',
    weight: 114.0,
    indoor_rated: false,
    ip_rating: 'IP67',
    operating_temp_min: -20.0,
    operating_temp_max: 50.0,
    price_aud: 12500.00,
    image_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    datasheet_url: 'https://www.tesla.com/en_au/powerwall',
    api_integration: true,
    api_type: 'Tesla API',
    is_active: true,
    cec_approved: true,
    cec_listing_date: '2019-01-10',
    clean_energy_rebate_eligible: true,
    vpp_compatible: true,
    australian_warranty: true,
  },
];

// Seed data for products
const products = [
  {
    id: uuidv4(),
    product_type: 'battery',
    name: 'LG RESU10H Prime Home Battery System',
    description: 'Premium home battery system with 9.6kWh capacity and 5kW power output. Perfect for Australian homes with solar.',
    manufacturer_id: manufacturers[0].id, // LG
    model_id: batteryModels[0].id, // RESU10H
    sku: 'LG-RESU10H-AU',
    price_aud: 9500.00,
    sale_price_aud: 8995.00,
    gst_included: true,
    stock_quantity: 15,
    is_featured: true,
    is_active: true,
    image_urls: [
      'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
      'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    ],
    specifications: {
      capacity: '9.6kWh',
      power: '5kW',
      dimensions: '744 x 907 x 206 mm',
      weight: '97kg',
      warranty: '10 years',
      chemistry: 'Lithium-ion',
    },
    warranty_info: '10 years or 4000 cycles, whichever comes first. Australian consumer law applies.',
    shipping_weight_kg: 105.0,
    shipping_dimensions: '850 x 1000 x 300 mm',
    energy_rating: 8,
    cec_approved: true,
    rebate_eligible: true,
    rebate_amount: 3500.00,
  },
  {
    id: uuidv4(),
    product_type: 'battery',
    name: 'AlphaESS SMILE-B3 Home Battery',
    description: 'High-capacity LFP battery with 11.5kWh storage and 5kW output. Designed for Australian conditions with excellent cycle life.',
    manufacturer_id: manufacturers[1].id, // AlphaESS
    model_id: batteryModels[1].id, // SMILE-B3
    sku: 'ALPHA-SMILE-B3',
    price_aud: 8500.00,
    sale_price_aud: 7995.00,
    gst_included: true,
    stock_quantity: 23,
    is_featured: true,
    is_active: true,
    image_urls: [
      'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
      'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    ],
    specifications: {
      capacity: '11.5kWh',
      power: '5kW',
      dimensions: '650 x 565 x 200 mm',
      weight: '105kg',
      warranty: '10 years',
      chemistry: 'Lithium Iron Phosphate',
    },
    warranty_info: '10 years or 6000 cycles, whichever comes first. Australian consumer law applies.',
    shipping_weight_kg: 115.0,
    shipping_dimensions: '750 x 650 x 300 mm',
    energy_rating: 9,
    cec_approved: true,
    rebate_eligible: true,
    rebate_amount: 3500.00,
  },
  {
    id: uuidv4(),
    product_type: 'battery',
    name: 'Tesla Powerwall 2',
    description: 'The Tesla Powerwall 2 is a rechargeable lithium-ion battery with liquid thermal management system. Completely automated, it requires no maintenance.',
    manufacturer_id: manufacturers[2].id, // Tesla
    model_id: batteryModels[2].id, // Powerwall 2
    sku: 'TESLA-PW2-AU',
    price_aud: 12500.00,
    sale_price_aud: 11995.00,
    gst_included: true,
    stock_quantity: 8,
    is_featured: true,
    is_active: true,
    image_urls: [
      'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
      'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    ],
    specifications: {
      capacity: '13.5kWh',
      power: '5kW continuous, 7kW peak',
      dimensions: '1150 x 755 x 155 mm',
      weight: '114kg',
      warranty: '10 years',
      chemistry: 'Lithium-ion',
    },
    warranty_info: '10 years unlimited cycles. Australian consumer law applies.',
    shipping_weight_kg: 125.0,
    shipping_dimensions: '1200 x 800 x 200 mm',
    energy_rating: 10,
    cec_approved: true,
    rebate_eligible: true,
    rebate_amount: 4000.00,
  },
];

// Seed data for electricity retailers
const electricityRetailers = [
  {
    id: uuidv4(),
    name: 'AGL Energy',
    logo_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    website: 'https://www.agl.com.au',
    support_email: 'support@agl.com.au',
    support_phone: '131 245',
    states: ['NSW', 'VIC', 'QLD', 'SA'],
  },
  {
    id: uuidv4(),
    name: 'Origin Energy',
    logo_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    website: 'https://www.originenergy.com.au',
    support_email: 'support@originenergy.com.au',
    support_phone: '13 24 61',
    states: ['NSW', 'VIC', 'QLD', 'SA', 'ACT'],
  },
  {
    id: uuidv4(),
    name: 'Energy Australia',
    logo_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    website: 'https://www.energyaustralia.com.au',
    support_email: 'support@energyaustralia.com.au',
    support_phone: '133 466',
    states: ['NSW', 'VIC', 'QLD', 'SA'],
  },
  {
    id: uuidv4(),
    name: 'Amber Electric',
    logo_url: 'https://images.unsplash.com/photo-1640584006436-d0f4ba7b8560?q=80&w=200',
    website: 'https://www.amber.com.au',
    support_email: 'support@amber.com.au',
    support_phone: '1800 531 907',
    states: ['NSW', 'VIC', 'QLD', 'SA'],
  },
];

// Seed data for electricity tariffs
const electricityTariffs = [
  {
    id: uuidv4(),
    retailer_id: electricityRetailers[0].id, // AGL
    name: 'AGL Solar Savers TOU',
    tariff_type: 'tou',
    state: 'NSW',
    distributor: 'Ausgrid',
    daily_supply_charge_cents: 95.0,
    peak_rate_cents: 40.0,
    shoulder_rate_cents: 25.0,
    off_peak_rate_cents: 15.0,
    feed_in_tariff_cents: 5.0,
    peak_hours: {
      weekdays: { start: '14:00', end: '20:00' },
      weekends: { start: '14:00', end: '20:00' },
    },
    shoulder_hours: {
      weekdays: [
        { start: '7:00', end: '14:00' },
        { start: '20:00', end: '22:00' },
      ],
      weekends: [
        { start: '7:00', end: '14:00' },
        { start: '20:00', end: '22:00' },
      ],
    },
    off_peak_hours: {
      weekdays: [
        { start: '0:00', end: '7:00' },
        { start: '22:00', end: '24:00' },
      ],
      weekends: [
        { start: '0:00', end: '7:00' },
        { start: '22:00', end: '24:00' },
      ],
    },
    is_active: true,
  },
  {
    id: uuidv4(),
    retailer_id: electricityRetailers[1].id, // Origin
    name: 'Origin Solar Boost Plus',
    tariff_type: 'tou',
    state: 'VIC',
    distributor: 'Citipower',
    daily_supply_charge_cents: 110.0,
    peak_rate_cents: 38.5,
    shoulder_rate_cents: 24.0,
    off_peak_rate_cents: 16.5,
    feed_in_tariff_cents: 6.0,
    peak_hours: {
      weekdays: { start: '15:00', end: '21:00' },
      weekends: { start: '15:00', end: '21:00' },
    },
    shoulder_hours: {
      weekdays: [
        { start: '7:00', end: '15:00' },
        { start: '21:00', end: '22:00' },
      ],
      weekends: [
        { start: '7:00', end: '15:00' },
        { start: '21:00', end: '22:00' },
      ],
    },
    off_peak_hours: {
      weekdays: [
        { start: '0:00', end: '7:00' },
        { start: '22:00', end: '24:00' },
      ],
      weekends: [
        { start: '0:00', end: '7:00' },
        { start: '22:00', end: '24:00' },
      ],
    },
    is_active: true,
  },
  {
    id: uuidv4(),
    retailer_id: electricityRetailers[2].id, // Energy Australia
    name: 'EA Solar Home',
    tariff_type: 'tou',
    state: 'QLD',
    distributor: 'Energex',
    daily_supply_charge_cents: 105.0,
    peak_rate_cents: 42.0,
    shoulder_rate_cents: 26.0,
    off_peak_rate_cents: 17.0,
    feed_in_tariff_cents: 8.0,
    peak_hours: {
      weekdays: { start: '16:00', end: '20:00' },
      weekends: { start: '16:00', end: '20:00' },
    },
    shoulder_hours: {
      weekdays: [
        { start: '7:00', end: '16:00' },
        { start: '20:00', end: '22:00' },
      ],
      weekends: [
        { start: '7:00', end: '16:00' },
        { start: '20:00', end: '22:00' },
      ],
    },
    off_peak_hours: {
      weekdays: [
        { start: '0:00', end: '7:00' },
        { start: '22:00', end: '24:00' },
      ],
      weekends: [
        { start: '0:00', end: '7:00' },
        { start: '22:00', end: '24:00' },
      ],
    },
    is_active: true,
  },
  {
    id: uuidv4(),
    retailer_id: electricityRetailers[3].id, // Amber
    name: 'Amber Wholesale + Markup',
    tariff_type: 'tou',
    state: 'SA',
    distributor: 'SA Power Networks',
    daily_supply_charge_cents: 95.0,
    peak_rate_cents: 45.0,
    shoulder_rate_cents: 28.0,
    off_peak_rate_cents: 12.0,
    feed_in_tariff_cents: 10.0,
    peak_hours: {
      weekdays: { start: '15:00', end: '21:00' },
      weekends: { start: '15:00', end: '21:00' },
    },
    shoulder_hours: {
      weekdays: [
        { start: '6:00', end: '15:00' },
        { start: '21:00', end: '23:00' },
      ],
      weekends: [
        { start: '6:00', end: '15:00' },
        { start: '21:00', end: '23:00' },
      ],
    },
    off_peak_hours: {
      weekdays: [
        { start: '0:00', end: '6:00' },
        { start: '23:00', end: '24:00' },
      ],
      weekends: [
        { start: '0:00', end: '6:00' },
        { start: '23:00', end: '24:00' },
      ],
    },
    is_active: true,
  },
];

// Seed data for VPP programs
const vppPrograms = [
  {
    id: uuidv4(),
    provider: 'AGL',
    name: 'AGL Virtual Power Plant',
    description: 'Join AGL\'s Virtual Power Plant and earn credits for allowing your battery to support the grid during peak demand.',
    states: ['NSW', 'VIC', 'QLD', 'SA'],
    payment_structure: 'Monthly credits on electricity bill + event-based payments',
    min_battery_capacity_kwh: 5.0,
    compatible_batteries: ['Tesla Powerwall 2', 'LG RESU10H Prime', 'AlphaESS SMILE-B3'],
    website_url: 'https://www.agl.com.au/solar-renewables/solar-battery-vpp',
    is_active: true,
  },
  {
    id: uuidv4(),
    provider: 'Simply Energy',
    name: 'VPPx',
    description: 'Simply Energy VPPx program offers South Australian households with solar and battery systems the opportunity to earn additional value.',
    states: ['SA'],
    payment_structure: 'Upfront payment + ongoing energy bill credits',
    min_battery_capacity_kwh: 7.0,
    compatible_batteries: ['Tesla Powerwall 2', 'LG RESU10H Prime', 'SolaX Battery'],
    website_url: 'https://www.simplyenergy.com.au/energy-solutions/vppx',
    is_active: true,
  },
  {
    id: uuidv4(),
    provider: 'Energy Australia',
    name: 'PowerResponse',
    description: 'PowerResponse helps balance energy supply during high demand periods by allowing Energy Australia to access your battery storage.',
    states: ['NSW', 'VIC'],
    payment_structure: 'Event-based payments + annual bonus',
    min_battery_capacity_kwh: 5.0,
    compatible_batteries: ['Tesla Powerwall 2', 'LG RESU10H Prime', 'AlphaESS SMILE-B3'],
    website_url: 'https://www.energyaustralia.com.au/powerresponse',
    is_active: true,
  },
];

// Seed data for Australian rebates
const rebates = [
  {
    id: uuidv4(),
    name: 'Solar Homes Program - Battery Rebate',
    provider: 'Solar Victoria',
    state: 'VIC',
    description: 'Eligible Victorian households can claim a rebate up to $3,500 for the installation of a solar battery system.',
    eligibility_criteria: 'Must be homeowner, combined household income less than $180,000, property value less than $3 million, no existing battery.',
    amount_aud: 3500.00,
    calculation_method: 'Fixed amount',
    start_date: '2021-07-01',
    end_date: '2024-06-30',
    website_url: 'https://www.solar.vic.gov.au/solar-battery-rebate',
    is_active: true,
  },
  {
    id: uuidv4(),
    name: 'Home Battery Scheme',
    provider: 'Government of South Australia',
    state: 'SA',
    description: 'The Home Battery Scheme provides South Australian households with subsidies to install home battery systems.',
    eligibility_criteria: 'Must be SA resident, property owner, have existing or new solar PV system.',
    amount_aud: 2000.00,
    calculation_method: 'Fixed amount',
    start_date: '2018-10-29',
    end_date: '2023-12-31',
    website_url: 'https://homebatteryscheme.sa.gov.au/',
    is_active: true,
  },
  {
    id: uuidv4(),
    name: 'Empowering Homes Program',
    provider: 'NSW Government',
    state: 'NSW',
    description: 'Interest-free loans for battery and solar-battery systems to eligible NSW residents.',
    eligibility_criteria: 'Owner-occupier, household income up to $180,000, eligible postcodes.',
    amount_aud: 9000.00,
    calculation_method: 'Interest-free loan',
    start_date: '2020-02-01',
    end_date: '2024-12-31',
    website_url: 'https://energy.nsw.gov.au/empowering-homes',
    is_active: true,
  },
  {
    id: uuidv4(),
    name: 'Next Generation Energy Storage Program',
    provider: 'ACT Government',
    state: 'ACT',
    description: 'Rebates for battery storage systems in ACT homes and businesses.',
    eligibility_criteria: 'ACT property, new or existing solar PV system.',
    amount_aud: 3500.00,
    calculation_method: 'Per kWh of battery capacity',
    start_date: '2016-01-01',
    end_date: '2023-12-31',
    website_url: 'https://www.climatechoices.act.gov.au/policy-programs/next-generation-energy-storage',
    is_active: true,
  },
];

/**
 * Insert seed data into the database
 */
async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Insert manufacturers
    console.log('Inserting manufacturers...');
    const { error: manufacturersError } = await supabase
      .from('manufacturers')
      .upsert(manufacturers, { onConflict: 'name' });
    
    if (manufacturersError) throw manufacturersError;
    console.log(`✅ Inserted ${manufacturers.length} manufacturers`);

    // Insert battery models
    console.log('Inserting battery models...');
    const { error: batteryModelsError } = await supabase
      .from('battery_models')
      .upsert(batteryModels, { onConflict: 'id' });
    
    if (batteryModelsError) throw batteryModelsError;
    console.log(`✅ Inserted ${batteryModels.length} battery models`);

    // Insert products
    console.log('Inserting products...');
    const { error: productsError } = await supabase
      .from('products')
      .upsert(products, { onConflict: 'id' });
    
    if (productsError) throw productsError;
    console.log(`✅ Inserted ${products.length} products`);

    // Insert electricity retailers
    console.log('Inserting electricity retailers...');
    const { error: retailersError } = await supabase
      .from('electricity_retailers')
      .upsert(electricityRetailers, { onConflict: 'name' });
    
    if (retailersError) throw retailersError;
    console.log(`✅ Inserted ${electricityRetailers.length} electricity retailers`);

    // Insert electricity tariffs
    console.log('Inserting electricity tariffs...');
    const { error: tariffsError } = await supabase
      .from('electricity_tariffs')
      .upsert(electricityTariffs, { onConflict: 'id' });
    
    if (tariffsError) throw tariffsError;
    console.log(`✅ Inserted ${electricityTariffs.length} electricity tariffs`);

    // Insert VPP programs
    console.log('Inserting VPP programs...');
    const { error: vppError } = await supabase
      .from('vpp_programs')
      .upsert(vppPrograms, { onConflict: 'id' });
    
    if (vppError) throw vppError;
    console.log(`✅ Inserted ${vppPrograms.length} VPP programs`);

    // Insert rebates
    console.log('Inserting rebates...');
    const { error: rebatesError } = await supabase
      .from('rebates')
      .upsert(rebates, { onConflict: 'id' });
    
    if (rebatesError) throw rebatesError;
    console.log(`✅ Inserted ${rebates.length} rebates`);

    // Create a simulated battery system for demo purposes
    console.log('Creating simulated battery data...');
    
    // Generate 24 hours of simulated battery monitoring data
    const now = new Date();
    const batterySystemId = uuidv4();
    const simulatedMonitoringData = [];
    
    // Create a simulated battery system
    const simulatedSystem = {
      id: batterySystemId,
      user_id: null, // Will be updated when a user claims this system
      battery_model_id: batteryModels[1].id, // AlphaESS SMILE-B3
      system_name: 'Demo Battery System',
      serial_number: 'DEMO-SIM-123456',
      capacity_kwh: 11.5,
      installation_date: '2023-01-15',
      installer_id: null,
      address_id: null,
      inverter_model: 'AlphaESS X1-Hybrid-G4',
      inverter_serial: 'INV-SIM-123456',
      solar_capacity_kw: 6.6,
      monitoring_enabled: true,
      api_connection_status: 'connected',
      api_credentials: { demo: true },
      last_connected_at: now.toISOString(),
      firmware_version: '2.5.1',
      nmi: '4102345678',
      rebate_claimed: true,
      rebate_amount: 3500.00,
      vpp_enrolled: true,
      vpp_provider: 'AGL VPP',
      distributor: 'Ausgrid',
      tariff_type: 'tou',
      export_limit_kw: 5.0,
    };
    
    // Insert the simulated system
    const { error: systemError } = await supabase
      .from('battery_systems')
      .upsert([simulatedSystem]);
    
    if (systemError) throw systemError;
    
    // Generate 24 hours of monitoring data with 15-minute intervals
    for (let i = 0; i < 96; i++) {
      const timestamp = new Date(now.getTime() - (96 - i) * 15 * 60 * 1000);
      const hour = timestamp.getHours();
      
      // Simulate realistic battery behavior based on time of day
      let solarPower = 0;
      if (hour >= 6 && hour <= 18) {
        // Daytime solar generation curve (bell shape)
        const hoursSinceSunrise = hour - 6;
        const peakFactor = 1 - Math.abs((hoursSinceSunrise - 6) / 6);
        solarPower = Math.round(5000 * peakFactor * (0.8 + Math.random() * 0.4));
      }
      
      // Simulate home consumption (higher in morning and evening)
      let loadPower = 300 + Math.random() * 200; // Base load
      if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 22)) {
        loadPower += 1000 + Math.random() * 1000; // Peak usage times
      }
      loadPower = Math.round(loadPower);
      
      // Battery power depends on solar and load
      let batteryPower = 0;
      let gridPower = 0;
      let batteryLevel = 0;
      
      // Time-based battery behavior
      if (hour >= 0 && hour < 6) {
        // Overnight: Charge from grid during off-peak
        batteryLevel = 30 + (hour * 10); // 30% to 80%
        batteryPower = 2000; // Charging
        gridPower = loadPower + batteryPower;
      } else if (hour >= 6 && hour < 14) {
        // Morning to afternoon: Solar charges battery
        batteryLevel = 80 + ((hour - 6) * 2); // 80% to 95%
        if (solarPower > loadPower) {
          batteryPower = Math.min(3000, solarPower - loadPower); // Charging from excess solar
          gridPower = 0;
        } else {
          batteryPower = 0;
          gridPower = loadPower - solarPower;
        }
      } else if (hour >= 14 && hour < 20) {
        // Peak period: Battery discharges
        batteryLevel = 95 - ((hour - 14) * 10); // 95% down to 35%
        batteryPower = -3000; // Discharging
        gridPower = Math.max(0, loadPower + batteryPower - solarPower);
      } else {
        // Evening: Battery continues to discharge
        batteryLevel = 35 - ((hour - 20) * 1); // 35% down to 30%
        batteryPower = -1000; // Discharging
        gridPower = Math.max(0, loadPower + batteryPower - solarPower);
      }
      
      // Add some randomness
      batteryLevel = Math.max(10, Math.min(100, Math.round(batteryLevel + (Math.random() * 6 - 3))));
      batteryPower = Math.round(batteryPower * (0.9 + Math.random() * 0.2));
      gridPower = Math.round(gridPower * (0.9 + Math.random() * 0.2));
      
      // Determine TOU period
      let touPeriod = 'off-peak';
      let currentRate = 15.0;
      if (hour >= 14 && hour < 20) {
        touPeriod = 'peak';
        currentRate = 40.0;
      } else if ((hour >= 7 && hour < 14) || (hour >= 20 && hour < 22)) {
        touPeriod = 'shoulder';
        currentRate = 25.0;
      }
      
      // Create monitoring entry
      simulatedMonitoringData.push({
        id: uuidv4(),
        system_id: batterySystemId,
        timestamp: timestamp.toISOString(),
        battery_level: batteryLevel,
        battery_power_w: batteryPower,
        grid_power_w: gridPower,
        solar_power_w: solarPower,
        load_power_w: loadPower,
        daily_solar_generation_kwh: (solarPower * 0.25 / 1000), // 15-minute kWh
        daily_consumption_kwh: (loadPower * 0.25 / 1000),
        daily_grid_import_kwh: Math.max(0, gridPower * 0.25 / 1000),
        daily_grid_export_kwh: Math.max(0, -gridPower * 0.25 / 1000),
        daily_battery_charge_kwh: Math.max(0, batteryPower * 0.25 / 1000),
        daily_battery_discharge_kwh: Math.max(0, -batteryPower * 0.25 / 1000),
        battery_temperature: 25 + Math.random() * 10,
        inverter_temperature: 30 + Math.random() * 15,
        grid_voltage: 230 + Math.random() * 10,
        grid_frequency: 50 + (Math.random() * 0.5 - 0.25),
        system_mode: batteryPower > 0 ? 'charging' : batteryPower < 0 ? 'discharging' : 'idle',
        is_charging: batteryPower > 0,
        is_discharging: batteryPower < 0,
        is_exporting: gridPower < 0,
        is_importing: gridPower > 0,
        alerts: [],
        tou_period: touPeriod,
        current_rate_cents: currentRate,
        feed_in_rate_cents: 5.0,
        cell_balancing: Math.random() > 0.8, // Occasional cell balancing
        battery_modules: 3,
        module_temperatures: [
          24 + Math.random() * 8,
          25 + Math.random() * 8,
          26 + Math.random() * 8,
        ],
        cell_voltage_deviation: 0.01 + Math.random() * 0.04,
      });
    }
    
    // Insert the monitoring data
    const { error: monitoringError } = await supabase
      .from('battery_monitoring')
      .upsert(simulatedMonitoringData);
    
    if (monitoringError) throw monitoringError;
    console.log(`✅ Created simulated battery system with ${simulatedMonitoringData.length} monitoring entries`);

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();
