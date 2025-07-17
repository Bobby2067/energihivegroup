-- Energi Hive Platform - Supabase Schema
-- Australian Energy Management Platform Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- Set up storage for battery system images and documents
INSERT INTO storage.buckets (id, name, public) VALUES ('battery_images', 'Battery Images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('user_documents', 'User Documents', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('product_images', 'Product Images', true);

-- =================================================================
-- AUTHENTICATION AND USER PROFILES
-- =================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  company_name TEXT,
  abn TEXT,
  is_installer BOOLEAN DEFAULT FALSE,
  is_business BOOLEAN DEFAULT FALSE,
  cec_accreditation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Australian specific fields
  state TEXT CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),
  postcode TEXT,
  nmi TEXT, -- National Metering Identifier
  distributor TEXT, -- Electricity distributor
  
  CONSTRAINT valid_abn CHECK (abn ~ '^[0-9]{11}$'),
  CONSTRAINT valid_postcode CHECK (postcode ~ '^[0-9]{4}$')
);

-- User addresses
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  address_type TEXT CHECK (address_type IN ('billing', 'shipping', 'installation')),
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  suburb TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),
  postcode TEXT NOT NULL CHECK (postcode ~ '^[0-9]{4}$'),
  country TEXT DEFAULT 'Australia',
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User preferences
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'system',
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  marketing_emails BOOLEAN DEFAULT TRUE,
  tou_notifications BOOLEAN DEFAULT TRUE, -- Time-of-use rate change notifications
  battery_alerts BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =================================================================
-- BATTERY SYSTEMS AND PRODUCTS
-- =================================================================

-- Battery manufacturers
CREATE TABLE public.manufacturers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  support_email TEXT,
  support_phone TEXT,
  australian_office BOOLEAN DEFAULT FALSE,
  cec_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Battery product models
CREATE TABLE public.battery_models (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  manufacturer_id UUID REFERENCES public.manufacturers(id) ON DELETE CASCADE,
  model_name TEXT NOT NULL,
  capacity_kwh DECIMAL(10, 2) NOT NULL,
  max_power_kw DECIMAL(10, 2) NOT NULL,
  voltage DECIMAL(10, 2),
  chemistry TEXT CHECK (chemistry IN ('lithium-ion', 'lithium-iron-phosphate', 'lead-acid', 'other')),
  warranty_years INTEGER NOT NULL,
  warranty_cycles INTEGER,
  round_trip_efficiency DECIMAL(5, 2),
  depth_of_discharge DECIMAL(5, 2),
  dimensions TEXT,
  weight DECIMAL(10, 2),
  indoor_rated BOOLEAN DEFAULT FALSE,
  ip_rating TEXT,
  operating_temp_min DECIMAL(5, 2),
  operating_temp_max DECIMAL(5, 2),
  price_aud DECIMAL(10, 2),
  image_url TEXT,
  datasheet_url TEXT,
  api_integration BOOLEAN DEFAULT FALSE,
  api_type TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Australian specific fields
  cec_approved BOOLEAN DEFAULT FALSE,
  cec_listing_date DATE,
  clean_energy_rebate_eligible BOOLEAN DEFAULT FALSE,
  vpp_compatible BOOLEAN DEFAULT FALSE,
  australian_warranty BOOLEAN DEFAULT TRUE
);

-- Installed battery systems
CREATE TABLE public.battery_systems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  battery_model_id UUID REFERENCES public.battery_models(id),
  system_name TEXT,
  serial_number TEXT,
  capacity_kwh DECIMAL(10, 2) NOT NULL,
  installation_date DATE,
  installer_id UUID REFERENCES public.profiles(id),
  address_id UUID REFERENCES public.addresses(id),
  inverter_model TEXT,
  inverter_serial TEXT,
  solar_capacity_kw DECIMAL(10, 2),
  monitoring_enabled BOOLEAN DEFAULT TRUE,
  api_connection_status TEXT DEFAULT 'disconnected',
  api_credentials JSONB,
  last_connected_at TIMESTAMP WITH TIME ZONE,
  firmware_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Australian specific fields
  nmi TEXT, -- National Metering Identifier
  rebate_claimed BOOLEAN DEFAULT FALSE,
  rebate_amount DECIMAL(10, 2),
  vpp_enrolled BOOLEAN DEFAULT FALSE,
  vpp_provider TEXT,
  distributor TEXT, -- Electricity distributor
  tariff_type TEXT CHECK (tariff_type IN ('flat', 'tou', 'demand', 'controlled-load')),
  export_limit_kw DECIMAL(10, 2)
);

-- Battery system monitoring data
CREATE TABLE public.battery_monitoring (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_id UUID REFERENCES public.battery_systems(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  battery_power_w DECIMAL(10, 2), -- Positive for charging, negative for discharging
  grid_power_w DECIMAL(10, 2), -- Positive for import, negative for export
  solar_power_w DECIMAL(10, 2),
  load_power_w DECIMAL(10, 2),
  daily_solar_generation_kwh DECIMAL(10, 3),
  daily_consumption_kwh DECIMAL(10, 3),
  daily_grid_import_kwh DECIMAL(10, 3),
  daily_grid_export_kwh DECIMAL(10, 3),
  daily_battery_charge_kwh DECIMAL(10, 3),
  daily_battery_discharge_kwh DECIMAL(10, 3),
  battery_temperature DECIMAL(5, 2),
  inverter_temperature DECIMAL(5, 2),
  grid_voltage DECIMAL(5, 2),
  grid_frequency DECIMAL(5, 2),
  system_mode TEXT,
  is_charging BOOLEAN,
  is_discharging BOOLEAN,
  is_exporting BOOLEAN,
  is_importing BOOLEAN,
  alerts JSONB,
  raw_data JSONB,
  
  -- LG RESU specific fields
  cell_balancing BOOLEAN,
  battery_modules INTEGER,
  module_temperatures DECIMAL(5, 2)[],
  cell_voltage_deviation DECIMAL(5, 3),
  
  -- Time-of-use period at time of reading
  tou_period TEXT CHECK (tou_period IN ('peak', 'shoulder', 'off-peak')),
  current_rate_cents DECIMAL(10, 2),
  feed_in_rate_cents DECIMAL(10, 2)
);

-- Battery system alerts
CREATE TABLE public.battery_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system_id UUID REFERENCES public.battery_systems(id) ON DELETE CASCADE,
  alert_code TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  acknowledged_by UUID REFERENCES public.profiles(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Products catalog
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_type TEXT CHECK (product_type IN ('battery', 'inverter', 'solar', 'accessory', 'service')),
  name TEXT NOT NULL,
  description TEXT,
  manufacturer_id UUID REFERENCES public.manufacturers(id),
  model_id UUID REFERENCES public.battery_models(id),
  sku TEXT UNIQUE,
  price_aud DECIMAL(10, 2) NOT NULL,
  sale_price_aud DECIMAL(10, 2),
  gst_included BOOLEAN DEFAULT TRUE,
  stock_quantity INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  image_urls TEXT[],
  specifications JSONB,
  warranty_info TEXT,
  shipping_weight_kg DECIMAL(10, 2),
  shipping_dimensions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Australian specific fields
  energy_rating INTEGER CHECK (energy_rating >= 0 AND energy_rating <= 10),
  cec_approved BOOLEAN DEFAULT FALSE,
  rebate_eligible BOOLEAN DEFAULT FALSE,
  rebate_amount DECIMAL(10, 2)
);

-- =================================================================
-- ORDERS AND PAYMENTS
-- =================================================================

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal_aud DECIMAL(10, 2) NOT NULL,
  shipping_aud DECIMAL(10, 2) DEFAULT 0,
  gst_aud DECIMAL(10, 2) NOT NULL,
  discount_aud DECIMAL(10, 2) DEFAULT 0,
  total_aud DECIMAL(10, 2) NOT NULL,
  shipping_address_id UUID REFERENCES public.addresses(id),
  billing_address_id UUID REFERENCES public.addresses(id),
  notes TEXT,
  tracking_number TEXT,
  shipping_provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Australian specific fields
  abn TEXT,
  purchase_order_number TEXT,
  tax_invoice_number TEXT,
  business_purchase BOOLEAN DEFAULT FALSE
);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_aud DECIMAL(10, 2) NOT NULL,
  subtotal_aud DECIMAL(10, 2) NOT NULL,
  gst_aud DECIMAL(10, 2) NOT NULL,
  discount_aud DECIMAL(10, 2) DEFAULT 0,
  total_aud DECIMAL(10, 2) NOT NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Australian payment methods
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  method_type TEXT CHECK (method_type IN ('bpay', 'payid', 'bank_transfer', 'gocardless', 'card')),
  is_default BOOLEAN DEFAULT FALSE,
  
  -- For bank transfers
  account_name TEXT,
  bsb TEXT,
  account_number TEXT,
  
  -- For PayID
  payid TEXT,
  payid_type TEXT CHECK (payid_type IN ('email', 'phone', 'abn')),
  
  -- For GoCardless
  gocardless_mandate_id TEXT,
  gocardless_customer_id TEXT,
  
  -- For cards (tokenized)
  card_type TEXT,
  last_four TEXT,
  expiry_month INTEGER,
  expiry_year INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure sensitive data is encrypted or masked
  CONSTRAINT mask_account_number CHECK (
    account_number IS NULL OR 
    account_number ~ '^X+\d{4}$'
  )
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  payment_type TEXT CHECK (payment_type IN ('bpay', 'payid', 'bank_transfer', 'gocardless', 'card')),
  amount_aud DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  transaction_id TEXT,
  reference TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Australian specific fields
  bpay_reference TEXT,
  bpay_biller_code TEXT,
  payid_reference TEXT,
  gocardless_payment_id TEXT,
  bank_receipt_id TEXT
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE NOT NULL,
  amount_aud DECIMAL(10, 2) NOT NULL,
  gst_aud DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'issued', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  pdf_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Australian specific fields
  abn TEXT,
  purchase_order_number TEXT,
  tax_invoice BOOLEAN DEFAULT TRUE
);

-- =================================================================
-- AUSTRALIAN ENERGY MARKET
-- =================================================================

-- Electricity retailers
CREATE TABLE public.electricity_retailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  logo_url TEXT,
  website TEXT,
  support_email TEXT,
  support_phone TEXT,
  states TEXT[] CHECK (ARRAY_LENGTH(states, 1) > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Electricity tariffs
CREATE TABLE public.electricity_tariffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer_id UUID REFERENCES public.electricity_retailers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tariff_type TEXT CHECK (tariff_type IN ('flat', 'tou', 'demand', 'controlled-load')),
  state TEXT CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT')),
  distributor TEXT,
  daily_supply_charge_cents DECIMAL(10, 2) NOT NULL,
  peak_rate_cents DECIMAL(10, 2),
  shoulder_rate_cents DECIMAL(10, 2),
  off_peak_rate_cents DECIMAL(10, 2),
  flat_rate_cents DECIMAL(10, 2),
  feed_in_tariff_cents DECIMAL(10, 2) NOT NULL,
  peak_hours JSONB,
  shoulder_hours JSONB,
  off_peak_hours JSONB,
  controlled_load_rate_cents DECIMAL(10, 2),
  controlled_load_hours JSONB,
  demand_charge_rate DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User electricity plans
CREATE TABLE public.user_electricity_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  retailer_id UUID REFERENCES public.electricity_retailers(id),
  tariff_id UUID REFERENCES public.electricity_tariffs(id),
  nmi TEXT,
  plan_name TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Energy savings
CREATE TABLE public.energy_savings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  system_id UUID REFERENCES public.battery_systems(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  self_consumption_kwh DECIMAL(10, 3) NOT NULL,
  self_consumption_savings_aud DECIMAL(10, 2) NOT NULL,
  export_kwh DECIMAL(10, 3) NOT NULL,
  export_income_aud DECIMAL(10, 2) NOT NULL,
  peak_avoided_kwh DECIMAL(10, 3),
  peak_savings_aud DECIMAL(10, 2),
  shoulder_avoided_kwh DECIMAL(10, 3),
  shoulder_savings_aud DECIMAL(10, 2),
  total_savings_aud DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Australian rebates
CREATE TABLE public.rebates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  state TEXT CHECK (state IN ('NSW', 'VIC', 'QLD', 'SA', 'WA', 'TAS', 'NT', 'ACT', 'federal')),
  description TEXT,
  eligibility_criteria TEXT,
  amount_aud DECIMAL(10, 2),
  calculation_method TEXT,
  start_date DATE,
  end_date DATE,
  website_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User rebate claims
CREATE TABLE public.user_rebate_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rebate_id UUID REFERENCES public.rebates(id) ON DELETE CASCADE,
  system_id UUID REFERENCES public.battery_systems(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'submitted', 'approved', 'rejected', 'paid')),
  amount_claimed_aud DECIMAL(10, 2) NOT NULL,
  amount_approved_aud DECIMAL(10, 2),
  application_date DATE,
  approval_date DATE,
  payment_date DATE,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Virtual Power Plant (VPP) programs
CREATE TABLE public.vpp_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  states TEXT[] CHECK (ARRAY_LENGTH(states, 1) > 0),
  payment_structure TEXT,
  min_battery_capacity_kwh DECIMAL(10, 2),
  compatible_batteries TEXT[],
  website_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User VPP enrollments
CREATE TABLE public.user_vpp_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  system_id UUID REFERENCES public.battery_systems(id) ON DELETE CASCADE,
  vpp_program_id UUID REFERENCES public.vpp_programs(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  enrollment_date DATE,
  termination_date DATE,
  contract_reference TEXT,
  payment_rate_aud DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- VPP events
CREATE TABLE public.vpp_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vpp_program_id UUID REFERENCES public.vpp_programs(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('dispatch', 'test', 'forecast')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  payment_rate_aud DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User VPP event participation
CREATE TABLE public.user_vpp_participation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  system_id UUID REFERENCES public.battery_systems(id) ON DELETE CASCADE,
  vpp_event_id UUID REFERENCES public.vpp_events(id) ON DELETE CASCADE,
  participated BOOLEAN DEFAULT FALSE,
  energy_contributed_kwh DECIMAL(10, 3),
  payment_amount_aud DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =================================================================
-- ROW LEVEL SECURITY POLICIES
-- =================================================================

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battery_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battery_monitoring ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battery_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_electricity_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.energy_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rebate_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vpp_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_vpp_participation ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for addresses
CREATE POLICY "Users can view their own addresses"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own addresses"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own addresses"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for battery systems
CREATE POLICY "Users can view their own battery systems"
  ON public.battery_systems FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own battery systems"
  ON public.battery_systems FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own battery systems"
  ON public.battery_systems FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policies for battery monitoring
CREATE POLICY "Users can view their own battery monitoring data"
  ON public.battery_monitoring FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.battery_systems
      WHERE battery_systems.id = battery_monitoring.system_id
      AND battery_systems.user_id = auth.uid()
    )
  );

-- Create policies for orders
CREATE POLICY "Users can view their own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

-- Create policies for payment methods
CREATE POLICY "Users can view their own payment methods"
  ON public.payment_methods FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods"
  ON public.payment_methods FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods"
  ON public.payment_methods FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods"
  ON public.payment_methods FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for energy savings
CREATE POLICY "Users can view their own energy savings"
  ON public.energy_savings FOR SELECT
  USING (auth.uid() = user_id);

-- =================================================================
-- FUNCTIONS AND TRIGGERS
-- =================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at
  BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_battery_systems_updated_at
  BEFORE UPDATE ON public.battery_systems
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user_registration()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_registration();

-- Function to calculate GST (10% in Australia)
CREATE OR REPLACE FUNCTION public.calculate_gst(amount DECIMAL)
RETURNS DECIMAL AS $$
BEGIN
  RETURN ROUND((amount * 0.1)::numeric, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
  order_prefix TEXT := 'EH';
  order_date TEXT := to_char(current_date, 'YYMMDD');
  random_suffix TEXT := lpad(floor(random() * 10000)::text, 4, '0');
BEGIN
  RETURN order_prefix || order_date || random_suffix;
END;
$$ LANGUAGE plpgsql;

-- Function to generate a unique invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  invoice_prefix TEXT := 'INV';
  invoice_date TEXT := to_char(current_date, 'YYMMDD');
  random_suffix TEXT := lpad(floor(random() * 10000)::text, 4, '0');
BEGIN
  RETURN invoice_prefix || invoice_date || random_suffix;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate energy savings
CREATE OR REPLACE FUNCTION public.calculate_energy_savings(
  p_system_id UUID,
  p_date DATE
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_self_consumption_kwh DECIMAL;
  v_export_kwh DECIMAL;
  v_peak_avoided_kwh DECIMAL;
  v_shoulder_avoided_kwh DECIMAL;
  v_tariff_id UUID;
  v_peak_rate DECIMAL;
  v_shoulder_rate DECIMAL;
  v_feed_in_rate DECIMAL;
  v_self_consumption_savings DECIMAL;
  v_export_income DECIMAL;
  v_peak_savings DECIMAL;
  v_shoulder_savings DECIMAL;
  v_total_savings DECIMAL;
BEGIN
  -- Get the user ID for this battery system
  SELECT user_id INTO v_user_id
  FROM public.battery_systems
  WHERE id = p_system_id;
  
  -- Get the user's electricity tariff
  SELECT tariff_id INTO v_tariff_id
  FROM public.user_electricity_plans
  WHERE user_id = v_user_id AND is_current = TRUE
  LIMIT 1;
  
  -- Get tariff rates
  SELECT 
    peak_rate_cents / 100, 
    shoulder_rate_cents / 100, 
    feed_in_tariff_cents / 100
  INTO 
    v_peak_rate, 
    v_shoulder_rate, 
    v_feed_in_rate
  FROM public.electricity_tariffs
  WHERE id = v_tariff_id;
  
  -- Calculate energy metrics for the day
  SELECT 
    SUM(CASE WHEN battery_power_w < 0 THEN ABS(battery_power_w) * 0.25 / 1000 ELSE 0 END),
    SUM(CASE WHEN grid_power_w < 0 THEN ABS(grid_power_w) * 0.25 / 1000 ELSE 0 END),
    SUM(CASE 
          WHEN battery_power_w < 0 AND tou_period = 'peak' 
          THEN ABS(battery_power_w) * 0.25 / 1000 
          ELSE 0 
        END),
    SUM(CASE 
          WHEN battery_power_w < 0 AND tou_period = 'shoulder' 
          THEN ABS(battery_power_w) * 0.25 / 1000 
          ELSE 0 
        END)
  INTO 
    v_self_consumption_kwh,
    v_export_kwh,
    v_peak_avoided_kwh,
    v_shoulder_avoided_kwh
  FROM public.battery_monitoring
  WHERE 
    system_id = p_system_id AND
    DATE(timestamp) = p_date;
  
  -- Calculate financial savings
  v_self_consumption_savings := COALESCE(v_self_consumption_kwh, 0) * COALESCE(v_peak_rate, 0.3);
  v_export_income := COALESCE(v_export_kwh, 0) * COALESCE(v_feed_in_rate, 0.05);
  v_peak_savings := COALESCE(v_peak_avoided_kwh, 0) * COALESCE(v_peak_rate, 0.3);
  v_shoulder_savings := COALESCE(v_shoulder_avoided_kwh, 0) * COALESCE(v_shoulder_rate, 0.2);
  v_total_savings := COALESCE(v_self_consumption_savings, 0) + COALESCE(v_export_income, 0);
  
  -- Insert or update energy savings record
  INSERT INTO public.energy_savings (
    user_id,
    system_id,
    date,
    self_consumption_kwh,
    self_consumption_savings_aud,
    export_kwh,
    export_income_aud,
    peak_avoided_kwh,
    peak_savings_aud,
    shoulder_avoided_kwh,
    shoulder_savings_aud,
    total_savings_aud
  ) VALUES (
    v_user_id,
    p_system_id,
    p_date,
    COALESCE(v_self_consumption_kwh, 0),
    COALESCE(v_self_consumption_savings, 0),
    COALESCE(v_export_kwh, 0),
    COALESCE(v_export_income, 0),
    COALESCE(v_peak_avoided_kwh, 0),
    COALESCE(v_peak_savings, 0),
    COALESCE(v_shoulder_avoided_kwh, 0),
    COALESCE(v_shoulder_savings, 0),
    COALESCE(v_total_savings, 0)
  )
  ON CONFLICT (user_id, system_id, date)
  DO UPDATE SET
    self_consumption_kwh = COALESCE(v_self_consumption_kwh, 0),
    self_consumption_savings_aud = COALESCE(v_self_consumption_savings, 0),
    export_kwh = COALESCE(v_export_kwh, 0),
    export_income_aud = COALESCE(v_export_income, 0),
    peak_avoided_kwh = COALESCE(v_peak_avoided_kwh, 0),
    peak_savings_aud = COALESCE(v_peak_savings, 0),
    shoulder_avoided_kwh = COALESCE(v_shoulder_avoided_kwh, 0),
    shoulder_savings_aud = COALESCE(v_shoulder_savings, 0),
    total_savings_aud = COALESCE(v_total_savings, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to determine time-of-use period
CREATE OR REPLACE FUNCTION public.get_tou_period(
  p_timestamp TIMESTAMP WITH TIME ZONE,
  p_tariff_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_hour INTEGER;
  v_minute INTEGER;
  v_day_of_week INTEGER;
  v_peak_hours JSONB;
  v_shoulder_hours JSONB;
  v_off_peak_hours JSONB;
  v_period TEXT;
BEGIN
  -- Extract time components
  v_hour := EXTRACT(HOUR FROM p_timestamp);
  v_minute := EXTRACT(MINUTE FROM p_timestamp);
  v_day_of_week := EXTRACT(DOW FROM p_timestamp); -- 0 = Sunday, 6 = Saturday
  
  -- Get tariff time periods
  SELECT 
    peak_hours,
    shoulder_hours,
    off_peak_hours
  INTO 
    v_peak_hours,
    v_shoulder_hours,
    v_off_peak_hours
  FROM public.electricity_tariffs
  WHERE id = p_tariff_id;
  
  -- Default to off-peak
  v_period := 'off-peak';
  
  -- Check if current time is in peak period
  IF v_peak_hours IS NOT NULL THEN
    -- Example peak_hours format: {"weekdays": {"start": "14:00", "end": "20:00"}}
    IF (v_day_of_week BETWEEN 1 AND 5 AND 
        v_peak_hours->>'weekdays' IS NOT NULL AND
        (v_hour > (v_peak_hours->'weekdays'->>'start')::INTEGER AND 
         v_hour < (v_peak_hours->'weekdays'->>'end')::INTEGER)) OR
       (v_day_of_week IN (0, 6) AND 
        v_peak_hours->>'weekends' IS NOT NULL AND
        (v_hour > (v_peak_hours->'weekends'->>'start')::INTEGER AND 
         v_hour < (v_peak_hours->'weekends'->>'end')::INTEGER)) THEN
      v_period := 'peak';
    END IF;
  END IF;
  
  -- Check if current time is in shoulder period
  IF v_shoulder_hours IS NOT NULL AND v_period = 'off-peak' THEN
    -- Example shoulder_hours format: {"weekdays": [{"start": "7:00", "end": "14:00"}, {"start": "20:00", "end": "22:00"}]}
    IF (v_day_of_week BETWEEN 1 AND 5 AND 
        v_shoulder_hours->>'weekdays' IS NOT NULL AND
        ((v_hour >= (v_shoulder_hours->'weekdays'->0->>'start')::INTEGER AND 
          v_hour < (v_shoulder_hours->'weekdays'->0->>'end')::INTEGER) OR
         (v_hour >= (v_shoulder_hours->'weekdays'->1->>'start')::INTEGER AND 
          v_hour < (v_shoulder_hours->'weekdays'->1->>'end')::INTEGER))) OR
       (v_day_of_week IN (0, 6) AND 
        v_shoulder_hours->>'weekends' IS NOT NULL AND
        ((v_hour >= (v_shoulder_hours->'weekends'->0->>'start')::INTEGER AND 
          v_hour < (v_shoulder_hours->'weekends'->0->>'end')::INTEGER))) THEN
      v_period := 'shoulder';
    END IF;
  END IF;
  
  RETURN v_period;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- INDEXES
-- =================================================================

-- Create indexes for frequently queried columns
CREATE INDEX idx_battery_systems_user_id ON public.battery_systems(user_id);
CREATE INDEX idx_battery_monitoring_system_id ON public.battery_monitoring(system_id);
CREATE INDEX idx_battery_monitoring_timestamp ON public.battery_monitoring(timestamp);
CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_payments_order_id ON public.payments(order_id);
CREATE INDEX idx_energy_savings_user_id ON public.energy_savings(user_id);
CREATE INDEX idx_energy_savings_system_id ON public.energy_savings(system_id);
CREATE INDEX idx_energy_savings_date ON public.energy_savings(date);
CREATE INDEX idx_user_vpp_enrollments_user_id ON public.user_vpp_enrollments(user_id);
CREATE INDEX idx_user_vpp_enrollments_system_id ON public.user_vpp_enrollments(system_id);

-- Create composite indexes for common query patterns
CREATE INDEX idx_battery_monitoring_system_date ON public.battery_monitoring(system_id, DATE(timestamp));
CREATE INDEX idx_energy_savings_user_system_date ON public.energy_savings(user_id, system_id, date);
CREATE INDEX idx_orders_user_status ON public.orders(user_id, status);
CREATE INDEX idx_payments_user_status ON public.payments(user_id, status);
