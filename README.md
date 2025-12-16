# Energi Hive 🔋⚡

**Australian Battery Energy Storage Platform**

A comprehensive marketplace and management platform for residential battery energy storage systems, built specifically for the Australian energy market.

**Now powered by Drizzle ORM + NextAuth v5** for modern, type-safe, vendor-agnostic infrastructure.

---

## 🧩 Backend Infrastructure Overview
Energi Hive runs on modern serverless primitives:

| Layer | Service | Notes |
|-------|---------|-------|
| Edge API | **Next.js 14 App Router** (`/app/api/*`) | Deployed as Vercel Edge Functions |
| Database | **PostgreSQL (Neon)** | Serverless Postgres with Drizzle ORM |
| ORM | **Drizzle ORM 0.45.1** | Type-safe queries, zero runtime overhead |
| Authentication | **NextAuth v5** | Industry-standard auth with Drizzle adapter |
| Payments | **Australian Payment Systems** | BPAY, PayID, GoCardless, Bank Transfer |
| Battery APIs | **AlphaESS, LG ESS** | Real-time monitoring integration |
| Email | **Nodemailer (SMTP / SES)** | Transactional emails |

Everything is type-safe and defined as code – database schema in `lib/db/schema.ts`, migrations via Drizzle Kit.

---

## 📚 API End-Points

| Route | Method(s) | Auth | Description |
|-------|-----------|------|-------------|
| `/api/auth/*` | POST, GET | Public | NextAuth v5 handles email/credentials auth |
| `/api/batteries` | GET | Public | List battery **products** with filters & pagination |
| `/api/batteries` | POST | User | Register a new **battery system** to your account |
| `/api/batteries/:systemId` | GET, PUT, DELETE | Owner/Admin | Fetch, update or delete a user’s system |
| `/api/batteries/:systemId/monitoring` | GET | Owner/Admin | Latest telemetry (AlphaESS / LG RESU) |
| `/api/orders` | GET, POST | User | List or create orders (inventory-aware) |
| `/api/orders/:orderId` | GET, PUT, DELETE | Owner/Admin | Manage a specific order life-cycle |
| `/api/payments` | POST | User | Create a payment (BPAY, PayID, GoCardless, Bank) |
| `/api/payments` | GET | User/Admin | List payments with rich filters |
| `/api/payments/:paymentId` | GET, PUT, DELETE | Owner/Admin | Retrieve, update status, or cancel payment |
| `/api/payments/webhook` | POST | Provider | Provider → Energi Hive status updates |
| `/api/email/send` | POST | Admin | One-off transactional email (SMTP/SES) |

All routes return JSON and use standard HTTP status codes. Input validation is handled via **Zod**; see route source for detailed schemas.

---

## 🗄 Database Schema

**17 Tables** with full type safety via Drizzle ORM:

### Authentication (NextAuth v5)
- `user` - User accounts with roles
- `account` - OAuth provider accounts
- `session` - Active user sessions
- `verificationToken` - Email verification tokens
- `password_reset_token` - Password reset tokens

### Business Domain
- `profiles` - Extended user profile information
- `brands` - Battery brands (Tesla, AlphaESS, LG, etc.)
- `manufacturers` - Battery manufacturers
- `battery_models` - Product catalog with specs and pricing
- `price_tiers` - Volume-based pricing tiers
- `orders` - Customer orders with Australian address support
- `payments` - Payment records (BPAY, PayID, GoCardless, Bank Transfer)
- `battery_systems` - Registered customer battery systems
- `battery_monitoring` - Real-time telemetry data
- `rebates` - Australian state-specific rebate programs
- `reviews` - Customer product reviews
- `newsletters` - Newsletter subscriptions

**7 Enums** for type safety:
- `user_role`, `battery_chemistry`, `australian_state`, `order_status`, `payment_status`, `payment_method`, `battery_system_status`

Schema lives in `lib/db/schema.ts` and is deployed via `npm run db:push`.

---

## 💳 Australian Payment System Integration

Supported methods & flow:

1. **Client** submits payment details to `/api/payments`  
2. API validates via `lib/payments/validation.ts`  
3. Provider SDK invoked:  
   • BPAY — creates CRN & biller reference  
   • PayID — generates PayID alias + metadata  
   • GoCardless — creates mandate & payment  
   • Bank Transfer — returns BSB / account details  
4. Payment record stored in `payments` (status `pending`)  
5. Provider → webhook → `/api/payments/webhook` updates status → order status cascade  

Edge functions encapsulate any long-running SDK calls (`supabase/functions/payments-*`).

---

## 🔋 Battery Monitoring Capabilities

* **AlphaESS**: Official REST v2; fallback scraper for legacy fleets.
* **LG RESU**: Local gateway polling + cloud fallback.
* Unified interface exposes:
  * Real-time SOC, voltage, current, temperature
  * 15-minute aggregates for graphs
  * Forecast block: next optimal charge / discharge window (Australian TOU tariffs)
* Cron job (`supabase/schedule/battery_poll.sql`) polls every minute, pushing rows into `battery_monitoring`.
* Simulation mode (`process.env.SIMULATE_BATTERY=true`) generates deterministic yet realistic data for staging.

---

## ⚙️ Local Setup & Environment

1. **Clone & install**

   ```bash
   git clone https://github.com/Bobby2067/energihivegroup.git
   cd energihivegroup
   npm install
   ```

2. **Environment variables**

   Copy template and fill values:

   ```bash
   cp .env.example .env.local
   ```

   Mandatory vars:

   | Key | Description |
   |-----|-------------|
   | `DATABASE_URL` | PostgreSQL connection string (Neon recommended) |
   | `NEXTAUTH_URL` | Your app URL (e.g., http://localhost:3000) |
   | `NEXTAUTH_SECRET` | Random secret for NextAuth (min 32 chars) |
   | `BPAY_BILLER_CODE` | Issued by bank |
   | `GOCARDLESS_ACCESS_TOKEN` | Live / sandbox token |
   | `EMAIL_SERVER_HOST` / `EMAIL_SERVER_USER` / `EMAIL_SERVER_PASSWORD` | SMTP config |
   | `ALPHAESS_API_KEY` / `LG_API_KEY` | Battery vendor APIs |

3. **Database setup**

   ```bash
   npm run db:push    # Push schema to database
   npm run db:studio  # (Optional) Open Drizzle Studio GUI
   ```

4. **Run development server**

   ```bash
   npm run dev        # http://localhost:3000
   ```

Vitest & ESLint run via `npm test` / `npm run lint`.

---

## 🏗 Architecture Overview
```
              ┌───────────────────────────┐
              │     Front-end (UI)        │   Next.js 14 + React 18 + shadcn/ui
              │   (Server Components)     │
              └─────────────┬─────────────┘
                            │ HTTP / RSC
              ┌─────────────▼─────────────┐
              │  Next.js 14 API Routes    │  Batteries • Orders • Payments
              │     + NextAuth v5         │
              └─────────────┬─────────────┘
                            │ Drizzle ORM
              ┌─────────────▼─────────────┐
              │  PostgreSQL (Neon)        │  Type-safe queries, no vendor lock-in
              └───────────────────────────┘
```

---

## 🚀 Deployment (Vercel)

1. **Import repo** → Vercel dashboard (Framework = Next.js).
2. Add environment variables for **Production** & **Preview**:
   - `DATABASE_URL` (Neon PostgreSQL connection string)
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
   - All payment provider credentials
3. Build command: `npm run build` (default).
4. Database migrations: Run `npm run db:push` before deployment or use Neon's automatic migrations.
5. Optional: Configure Neon connection pooling for serverless optimization.  

---

## 🛣 Migration & Development Status

### ✅ Completed:
* ✅ Drizzle ORM setup with Neon PostgreSQL
* ✅ NextAuth v5 configuration with Drizzle adapter
* ✅ Complete database schema (17 tables, 7 enums)
* ✅ Payment client infrastructure (BPAY, PayID, GoCardless, Bank Transfer)
* ✅ **API route migrations complete** (batteries, orders, payments)
* ✅ **All TypeScript errors resolved** - full type safety
* ✅ **Supabase completely removed** from codebase
* ✅ Rate limiting implemented on all API routes
* ✅ Security vulnerabilities fixed (5 critical issues resolved)
* ✅ Energy flow monitoring components (placeholder)

### 📋 TODO:
* Implement React Query hooks for Drizzle-based endpoints
* Finish Battery Dashboard charts with Recharts
* Payment Wizard using shadcn/ui dialogs
* Create missing dashboard components
* Create missing homepage components
* Lighthouse & accessibility pass
* End-to-end tests with Playwright

Contributions welcome – see below!

---

## 🗄 Project Structure

```
.
├─ app/                 # Next.js 14 App Router
│  ├─ (auth)/           # Authentication pages
│  ├─ dashboard/        # User dashboards
│  ├─ products/         # Battery catalogue
│  └─ api/              # API routes (orders, payments, batteries)
├─ components/          # React components
│  ├─ ui/               # shadcn/ui components
│  └─ dashboard/        # Dashboard-specific components
├─ lib/                 # Shared libraries
│  ├─ db/               # Drizzle ORM
│  │  ├─ schema.ts      # Database schema (17 tables)
│  │  ├─ client.ts      # Database connection
│  │  └─ migrations/    # Generated migrations
│  ├─ auth.ts           # NextAuth v5 configuration
│  ├─ payments/         # Australian payment client
│  ├─ batteries/        # AlphaESS & LG API clients
│  └─ email/            # Email service
├─ drizzle.config.ts    # Drizzle Kit configuration
└─ public/              # Static assets
```

---

## 🤝 Contributing

1. Fork → feature branch (`feat/xyz`)  
2. Conventional commits (`git cz`)  
3. `npm run lint && npm test` must pass.  
4. Open PR – CI will run Vitest & Type-check.

---

## 📄 License

© 2025 Energi Hive Pty Ltd. Released under the **MIT License**.
