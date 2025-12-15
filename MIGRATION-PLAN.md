# Energi Hive - Complete Migration & Fix Plan

**Target Base:** energi-hive-main (C:\Users\RobOgilvie\energi-hive-main)
**Migration Sources:**
- energi-hive-ultimate (C:\Users\RobOgilvie\energi-hive-ultimate)
- energi-hive-combined (current worktree)

**Goal:** Create production-ready Australian energy management platform

---

## Phase 1: Critical Fixes in energi-hive-main (Priority: IMMEDIATE)

### 1.1 Database Schema Fixes 🚨 CRITICAL

**Issue:** API routes expect database columns that don't exist in schema.sql

**Files to Fix:**
- `C:\Users\RobOgilvie\energi-hive-main\supabase\schema.sql`
- `C:\Users\RobOgilvie\energi-hive-main\app\api\payments\route.ts`
- `C:\Users\RobOgilvie\energi-hive-main\app\api\orders\route.ts`

**Required Schema Changes:**

```sql
-- 1. Add missing columns to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_response JSONB DEFAULT '{}';

-- 2. Add missing columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Add missing filter_orders_by_product RPC function
CREATE OR REPLACE FUNCTION filter_orders_by_product(
  product_id_param UUID,
  product_type_param TEXT
)
RETURNS SETOF orders AS $$
  SELECT DISTINCT o.*
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  JOIN products p ON oi.product_id = p.id
  WHERE p.id = product_id_param
    AND p.product_type = product_type_param
  ORDER BY o.created_at DESC;
$$ LANGUAGE sql STABLE;

-- 4. Add unique constraint on energy_savings
ALTER TABLE energy_savings
ADD CONSTRAINT energy_savings_user_system_date_unique
UNIQUE (user_id, system_id, date);

-- 5. Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_battery_monitoring_timestamp
ON battery_monitoring(system_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_payments_order_user
ON payments(order_id, user_id);

CREATE INDEX IF NOT EXISTS idx_orders_status_created
ON orders(status, created_at DESC);
```

**Estimated Time:** 1 hour

---

### 1.2 Missing UI Components 🚨 CRITICAL

**Issue:** Homepage references components that don't exist

**Files to Create:**

#### Component 1: `components/energy/energy-flow-chart.tsx`
```typescript
import { Card } from '@/components/ui/card';
import { Battery, Sun, Home, Zap } from 'lucide-react';

export function EnergyFlowChart() {
  return (
    <Card className="p-6">
      <div className="grid grid-cols-4 gap-4 items-center">
        <div className="flex flex-col items-center">
          <Sun className="w-12 h-12 text-yellow-500" />
          <span className="text-sm mt-2">Solar</span>
        </div>
        <div className="flex flex-col items-center">
          <Battery className="w-12 h-12 text-green-500" />
          <span className="text-sm mt-2">Battery</span>
        </div>
        <div className="flex flex-col items-center">
          <Zap className="w-12 h-12 text-purple-500" />
          <span className="text-sm mt-2">Grid</span>
        </div>
        <div className="flex flex-col items-center">
          <Home className="w-12 h-12 text-blue-500" />
          <span className="text-sm mt-2">Home</span>
        </div>
      </div>
    </Card>
  );
}
```

#### Component 2: `components/products/battery-product-card.tsx`
```typescript
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface BatteryProductCardProps {
  name: string;
  manufacturer: string;
  capacity: number;
  price: number;
  cecApproved?: boolean;
  rebateEligible?: boolean;
}

export function BatteryProductCard({
  name,
  manufacturer,
  capacity,
  price,
  cecApproved,
  rebateEligible,
}: BatteryProductCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <p className="text-sm text-muted-foreground">{manufacturer}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Capacity:</span>
            <span className="font-semibold">{capacity} kWh</span>
          </div>
          <div className="flex gap-2">
            {cecApproved && <Badge variant="secondary">CEC Approved</Badge>}
            {rebateEligible && <Badge variant="success">Rebate Eligible</Badge>}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <span className="text-2xl font-bold">${price.toLocaleString('en-AU')}</span>
        <Button>View Details</Button>
      </CardFooter>
    </Card>
  );
}
```

#### Component 3: `components/stats/market-stat-counter.tsx`
```typescript
import { Card, CardContent } from '@/components/ui/card';

interface MarketStatCounterProps {
  value: string | number;
  label: string;
  suffix?: string;
}

export function MarketStatCounter({ value, label, suffix = '' }: MarketStatCounterProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary">
            {value}{suffix}
          </div>
          <div className="text-sm text-muted-foreground mt-2">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Component 4: `components/testimonials/testimonial-carousel.tsx`
```typescript
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    name: 'Sarah Thompson',
    location: 'Sydney, NSW',
    text: 'Energi Hive helped me find the perfect battery system. My electricity bills have dropped by 60%!',
  },
  {
    name: 'Michael Chen',
    location: 'Melbourne, VIC',
    text: 'The monitoring dashboard is fantastic. I can see exactly how much I\'m saving in real-time.',
  },
  {
    name: 'Emma Wilson',
    location: 'Brisbane, QLD',
    text: 'Great platform for comparing batteries. The rebate tracking feature saved me thousands.',
  },
];

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="relative">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <p className="text-lg italic">"{testimonials[current].text}"</p>
            <div>
              <p className="font-semibold">{testimonials[current].name}</p>
              <p className="text-sm text-muted-foreground">{testimonials[current].location}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-center gap-4 mt-4">
        <Button variant="outline" size="icon" onClick={prev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={next}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

#### Component 5: `components/maps/australian-energy-map.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const states = [
  { name: 'NSW', installs: '45,231', color: 'bg-blue-500' },
  { name: 'VIC', installs: '38,567', color: 'bg-green-500' },
  { name: 'QLD', installs: '32,890', color: 'bg-yellow-500' },
  { name: 'SA', installs: '18,234', color: 'bg-orange-500' },
  { name: 'WA', installs: '15,678', color: 'bg-purple-500' },
  { name: 'TAS', installs: '4,123', color: 'bg-pink-500' },
  { name: 'NT', installs: '1,890', color: 'bg-red-500' },
  { name: 'ACT', installs: '6,234', color: 'bg-indigo-500' },
];

export function AustralianEnergyMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Battery Installations by State</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {states.map((state) => (
            <div key={state.name} className="space-y-2">
              <div className={`h-20 ${state.color} rounded flex items-center justify-center`}>
                <span className="text-white font-bold text-2xl">{state.name}</span>
              </div>
              <p className="text-center text-sm">{state.installs} installs</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

#### Component 6: `components/payments/payment-method-showcase.tsx`
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Building2, Smartphone, Landmark } from 'lucide-react';

const paymentMethods = [
  {
    icon: Building2,
    name: 'BPAY',
    description: 'Pay bills through your bank',
  },
  {
    icon: Smartphone,
    name: 'PayID',
    description: 'Instant transfers using your email or phone',
  },
  {
    icon: Landmark,
    name: 'Bank Transfer',
    description: 'Traditional BSB and account transfer',
  },
  {
    icon: CreditCard,
    name: 'Direct Debit',
    description: 'Automatic payments with GoCardless',
  },
];

export function PaymentMethodShowcase() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {paymentMethods.map((method) => (
        <Card key={method.name}>
          <CardHeader>
            <method.icon className="w-8 h-8 text-primary mb-2" />
            <CardTitle className="text-lg">{method.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{method.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

**Estimated Time:** 2 hours

---

### 1.3 Webhook Security Implementation 🚨 CRITICAL

**Issue:** Webhook handler accepts all requests without verification

**File to Fix:** `C:\Users\RobOgilvie\energi-hive-main\app\api\payments\route.ts`

**Implementation:**

```typescript
// Add webhook signature verification
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

// In POST /api/payments/webhook handler:
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get('x-webhook-signature') || '';

  // Verify signature
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.error('Invalid webhook signature');
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    );
  }

  // Process webhook...
}
```

**Add to .env:**
```bash
WEBHOOK_SECRET=your-secure-random-secret-here
```

**Estimated Time:** 1 hour

---

### 1.4 Payment Verification Implementation 🚨 HIGH

**Issue:** BPAY, PayID, and Bank Transfer verification are mocked

**File to Fix:** `C:\Users\RobOgilvie\energi-hive-main\lib\payments\client.ts`

**Options:**

**Option A: Implement Real APIs**
- BPAY: Integrate with BPAY Biller Direct API
- PayID: Integrate with NPP (New Payments Platform) API
- Bank Transfer: Partner with bank APIs for verification

**Option B: Manual Verification Workflow (Interim Solution)**

```typescript
// lib/payments/client.ts - Line 467

async function verifyBankTransfer(params: {
  amount: number;
  reference: string;
  bsb?: string;
  accountNumber?: string;
}): Promise<{ verified: boolean; transactionId?: string }> {
  if (process.env.NODE_ENV === 'development') {
    // Simulation for development
    return {
      verified: Math.random() > 0.3,
      transactionId: `SIM-${Date.now()}`,
    };
  }

  // Production: Manual verification required
  // Create a pending verification record in database
  const { data: verification } = await supabase
    .from('payment_verifications')
    .insert({
      payment_method: 'bank_transfer',
      amount: params.amount,
      reference: params.reference,
      status: 'pending_manual_review',
      metadata: { bsb: params.bsb, accountNumber: params.accountNumber },
    })
    .select()
    .single();

  // Send notification to admin for manual verification
  await sendAdminNotification({
    type: 'payment_verification_required',
    verificationId: verification.id,
    amount: params.amount,
    reference: params.reference,
  });

  return {
    verified: false, // Pending manual review
    transactionId: verification.id,
  };
}
```

**Required Database Table:**

```sql
CREATE TABLE payment_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_id UUID REFERENCES payments(id),
  payment_method TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_manual_review',
  verified_by UUID REFERENCES profiles(id),
  verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_verifications_status ON payment_verifications(status);
```

**Estimated Time:** 3 hours (interim solution) or 2+ weeks (real API integration)

---

### 1.5 Icon Fix 🚨 MEDIUM

**Issue:** AustraliaIcon doesn't exist in lucide-react

**File to Fix:** `C:\Users\RobOgilvie\energi-hive-main\app\page.tsx`

**Solution:**

```typescript
// Replace AustraliaIcon with Globe or MapPin
import { Globe, MapPin, Battery, Zap, Users } from 'lucide-react';

// Instead of <AustraliaIcon />
<Globe className="w-6 h-6" />
// or
<MapPin className="w-6 h-6" />
```

**Estimated Time:** 5 minutes

---

## Phase 2: Migrate Features from energi-hive-ultimate

### 2.1 Next.js 16 Upgrade ⚡ HIGH PRIORITY

**Benefit:** Security patches for CVE-2025-55182, CVE-2025-66478, CVE-2025-29927

**Steps:**

1. **Update package.json:**
```json
{
  "dependencies": {
    "next": "^16.0.7",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  }
}
```

2. **Update next.config.js for Turbopack:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable Turbopack (Next.js 16 feature)
  turbo: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  // ... rest of config
};
```

3. **Test all routes and API endpoints**

4. **Update development command:**
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start"
  }
}
```

**Files to Modify:**
- `package.json`
- `next.config.js`
- `.env.example` (add any new env vars)

**Estimated Time:** 2 hours + testing

---

### 2.2 Stripe Integration ⚡ MEDIUM PRIORITY

**Benefit:** Instant payment option for customers

**Copy from:** `C:\Users\RobOgilvie\energi-hive-ultimate\`

**Files to Copy/Create:**

1. **Install Stripe SDK:**
```bash
npm install stripe @stripe/stripe-js
```

2. **Create Stripe client:** `lib/payments/stripe.ts`
```typescript
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});
```

3. **Add Stripe payment method to existing payment client**

4. **Create webhook handler:** `app/api/payments/webhooks/stripe/route.ts`

5. **Add to .env:**
```bash
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Database Changes:**
```sql
ALTER TABLE payment_methods
ADD COLUMN stripe_payment_method_id TEXT;

ALTER TABLE payments
ADD COLUMN stripe_payment_intent_id TEXT;
```

**Estimated Time:** 4 hours

---

### 2.3 Advanced Validation Utilities ⚡ LOW PRIORITY

**Copy from:** `C:\Users\RobOgilvie\energi-hive-ultimate\lib\utils\australian-validation.ts`

**Features to Migrate:**
- Enhanced ABN checksum validation
- CEC accreditation number validation
- Postcode-to-state mapping function
- Australian phone number parsing

**File to Create:** `lib/utils/australian-validation.ts`

**Integration:** Update existing validation in:
- `app/api/batteries/route.ts`
- `app/api/orders/route.ts`
- User profile forms

**Estimated Time:** 2 hours

---

### 2.4 Multi-Role System ⚡ MEDIUM PRIORITY

**Copy from:** `C:\Users\RobOgilvie\energi-hive-ultimate\lib\db\schema.ts`

**New Roles to Add:**
- `customer` (existing)
- `installer`
- `distributor`
- `community_leader`
- `community_admin`
- `platform_admin`
- `super_admin`

**Database Changes:**
```sql
-- Update user role enum
CREATE TYPE user_role AS ENUM (
  'customer',
  'installer',
  'distributor',
  'community_leader',
  'community_admin',
  'platform_admin',
  'super_admin'
);

-- Add role to profiles
ALTER TABLE profiles
ADD COLUMN role user_role DEFAULT 'customer';

-- Create role permissions table
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role user_role NOT NULL,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role, resource, action)
);

-- Insert default permissions
INSERT INTO role_permissions (role, resource, action) VALUES
  ('customer', 'batteries', 'read'),
  ('customer', 'batteries', 'create'),
  ('customer', 'orders', 'read'),
  ('customer', 'orders', 'create'),
  ('installer', 'batteries', 'read'),
  ('installer', 'installations', 'manage'),
  ('distributor', 'inventory', 'manage'),
  ('platform_admin', '*', '*');
```

**Create middleware:** `lib/auth/permissions.ts`

**Estimated Time:** 4 hours

---

### 2.5 Playwright E2E Testing ⚡ LOW PRIORITY

**Install:**
```bash
npm install -D @playwright/test
npx playwright install
```

**Create:** `playwright.config.ts`
```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Create test files:**
- `e2e/auth.spec.ts` - Authentication flows
- `e2e/battery-catalog.spec.ts` - Product browsing
- `e2e/order-flow.spec.ts` - Complete purchase flow
- `e2e/dashboard.spec.ts` - User dashboard

**Estimated Time:** 8 hours (including writing tests)

---

## Phase 3: Additional Improvements

### 3.1 Rate Limiting 🔒 HIGH PRIORITY

**Install:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

**Create:** `lib/rate-limit.ts`
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});
```

**Apply to API routes:**
```typescript
// In each API route
const { success } = await ratelimit.limit(request.headers.get('x-forwarded-for') ?? 'anonymous');
if (!success) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

**Estimated Time:** 3 hours

---

### 3.2 Environment Variable Optimization 📝 MEDIUM PRIORITY

**Current:** 122 environment variables
**Target:** ~40-50 essential variables

**Strategy:**
1. Group related variables into JSON configs
2. Move development-only vars to `.env.local.example`
3. Use feature flags instead of individual boolean env vars

**Example:**
```bash
# Instead of:
FEATURE_VPP_ENABLED=true
FEATURE_AI_OPTIMIZATION_ENABLED=false
FEATURE_COMMUNITY_FORUMS_ENABLED=true

# Use:
FEATURE_FLAGS='{"vpp":true,"ai":false,"forums":true}'
```

**Estimated Time:** 2 hours

---

### 3.3 Admin Dashboard 👤 LOW PRIORITY

**Create admin interface for:**
- Manual payment verification
- User management
- Order management
- System monitoring
- Analytics

**Files to Create:**
- `app/admin/layout.tsx`
- `app/admin/payments/page.tsx`
- `app/admin/orders/page.tsx`
- `app/admin/users/page.tsx`

**Estimated Time:** 12 hours

---

## Phase 4: Testing & Validation

### 4.1 Unit Tests

**Create:**
- `lib/__tests__/payments.test.ts`
- `lib/__tests__/batteries.test.ts`
- `lib/__tests__/australian-validation.test.ts`

**Estimated Time:** 6 hours

---

### 4.2 Integration Tests

**Create:**
- `app/api/__tests__/batteries.test.ts`
- `app/api/__tests__/orders.test.ts`
- `app/api/__tests__/payments.test.ts`

**Estimated Time:** 8 hours

---

### 4.3 Manual Testing Checklist

- [ ] User registration and login
- [ ] Battery system registration
- [ ] Real-time monitoring data display
- [ ] Product browsing and filtering
- [ ] Add to cart and checkout
- [ ] Payment flow (all methods)
- [ ] Order tracking
- [ ] VPP enrollment
- [ ] Rebate claim submission
- [ ] Energy savings calculations
- [ ] Admin panel functions

**Estimated Time:** 4 hours

---

## Time Estimates Summary

| Phase | Task | Priority | Time |
|-------|------|----------|------|
| **Phase 1** | **Critical Fixes** | **IMMEDIATE** | **~7 hours** |
| 1.1 | Database schema fixes | CRITICAL | 1 hour |
| 1.2 | Missing UI components | CRITICAL | 2 hours |
| 1.3 | Webhook security | CRITICAL | 1 hour |
| 1.4 | Payment verification (interim) | HIGH | 3 hours |
| 1.5 | Icon fix | MEDIUM | 5 min |
| **Phase 2** | **Feature Migration** | **HIGH** | **~20 hours** |
| 2.1 | Next.js 16 upgrade | HIGH | 2 hours |
| 2.2 | Stripe integration | MEDIUM | 4 hours |
| 2.3 | Validation utilities | LOW | 2 hours |
| 2.4 | Multi-role system | MEDIUM | 4 hours |
| 2.5 | Playwright testing | LOW | 8 hours |
| **Phase 3** | **Improvements** | **MEDIUM** | **~17 hours** |
| 3.1 | Rate limiting | HIGH | 3 hours |
| 3.2 | Env var optimization | MEDIUM | 2 hours |
| 3.3 | Admin dashboard | LOW | 12 hours |
| **Phase 4** | **Testing** | **MEDIUM** | **~18 hours** |
| 4.1 | Unit tests | MEDIUM | 6 hours |
| 4.2 | Integration tests | MEDIUM | 8 hours |
| 4.3 | Manual testing | HIGH | 4 hours |
| | **TOTAL** | | **~62 hours** |

---

## Recommended Execution Order

### Week 1: Critical Fixes (Get to Production)
1. ✅ Database schema fixes (1.1)
2. ✅ Missing UI components (1.2)
3. ✅ Icon fix (1.5)
4. ✅ Webhook security (1.3)
5. ✅ Payment verification interim solution (1.4)
6. ✅ Next.js 16 upgrade (2.1)
7. ✅ Rate limiting (3.1)
8. ✅ Manual testing (4.3)

**Deliverable:** Production-ready platform with critical issues fixed

### Week 2: Feature Enhancement
1. ✅ Stripe integration (2.2)
2. ✅ Advanced validation (2.3)
3. ✅ Multi-role system (2.4)
4. ✅ Env var optimization (3.2)
5. ✅ Unit tests (4.1)

**Deliverable:** Enhanced payment options and better code quality

### Week 3: Testing & Polish
1. ✅ Playwright E2E tests (2.5)
2. ✅ Integration tests (4.2)
3. ✅ Admin dashboard (3.3)
4. ✅ Documentation updates
5. ✅ Performance optimization

**Deliverable:** Fully tested, production-ready platform

---

## Success Criteria

### Phase 1 Complete:
- ✅ All database schema errors resolved
- ✅ Homepage renders without missing component errors
- ✅ Webhook signatures verified
- ✅ Payment verification has interim solution
- ✅ All API routes return valid responses

### Phase 2 Complete:
- ✅ Next.js 16 running without errors
- ✅ Stripe payments working end-to-end
- ✅ Multi-role system functional
- ✅ Advanced validation in use

### Phase 3 Complete:
- ✅ Rate limiting protecting all API routes
- ✅ Environment variables reduced to <50
- ✅ Admin can verify payments manually

### Phase 4 Complete:
- ✅ 80%+ code coverage with tests
- ✅ All E2E flows passing
- ✅ No critical bugs in manual testing

---

## Rollback Plan

If issues arise during migration:

1. **Database changes:** All ALTER TABLE commands use `IF NOT EXISTS` - safe to re-run
2. **Next.js upgrade:** Revert package.json and run `npm install`
3. **Feature additions:** Use feature flags to disable without removing code
4. **Emergency:** Git repository allows rollback to any previous state

---

## Post-Migration Monitoring

**Week 1-2 after deployment:**
- Monitor error logs daily
- Track API response times
- Monitor payment success rates
- Check database performance
- Review user feedback

**Alerts to set up:**
- Database connection errors
- Payment failures
- API route 500 errors
- Webhook verification failures
- High latency (>2s response time)

---

## Next Steps After Migration

1. **Real Payment API Integration** (2-4 weeks)
   - Partner with BPAY Biller Direct
   - Integrate NPP PayID API
   - Bank API partnerships

2. **Mobile App** (3-6 months)
   - React Native app
   - Real-time monitoring on mobile
   - Push notifications for alerts

3. **Advanced Features** (ongoing)
   - AI-powered energy optimization
   - Predictive battery maintenance
   - Community forums
   - Bulk buying groups
   - Installer marketplace

---

## Resources Needed

- **Developer Time:** 62 hours (1.5 weeks full-time)
- **Testing Environment:** Staging database + Vercel preview
- **Payment Sandbox Accounts:** Stripe test mode, GoCardless sandbox
- **Admin Access:** Supabase dashboard, Vercel dashboard
- **Budget:** Minimal (existing services)

---

## Contact & Support

**Questions during migration:**
- Database issues → Check Supabase dashboard logs
- API errors → Check Vercel function logs
- Payment issues → Check provider dashboards
- Build errors → Check Next.js build output

**Emergency rollback:** `git revert` to previous working commit

---

**Document Version:** 1.0
**Created:** 2025-12-15
**Last Updated:** 2025-12-15
**Status:** Ready for execution
