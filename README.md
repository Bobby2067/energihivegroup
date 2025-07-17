# Energi Hive Main

Integrated platform that fuses the **rich React UI** from `energi-hive-connect` with the **robust Next.js 14 API layer** of `energi-hive-platform`, packaged as a single repository ready for production in the Australian energy market.

---

## 🧩 Backend Infrastructure Overview
Energi Hive Main runs entirely on serverless primitives:

| Layer | Service | Notes |
|-------|---------|-------|
| Edge API | **Next.js 14 App Router** (`/app/api/*`) | Deployed as Vercel Edge Functions |
| Data & Auth | **Supabase Postgres** | RLS-secured tables, generated Types DB |
| Realtime | Supabase Realtime | WebSocket streams for battery telemetry |
| File Storage | Supabase Storage | Datasheets & marketing assets |
| Business Logic | Supabase Edge Functions | Long-running payment interactions |
| Queue / Cron | Supabase Schedules | Battery polling, email digests |
| E-mail | Nodemailer (SMTP / SES) | Outbound transactional messages |

Everything is defined as code – SQL migrations in `supabase/migrations`, TypeScript clients in `lib/`.

---

## 📚 API End-Points

| Route | Method(s) | Auth | Description |
|-------|-----------|------|-------------|
| `/api/auth/*` | POST, GET | Public | Supabase handles email/OAuth (handled by middleware) |
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

## 🗄 Database Schema Requirements

Core tables (abridged):

| Table | Key Columns | RLS Policy |
|-------|-------------|-----------|
| `users` | `id`, `email`, `role` | Self-select, admin read/write |
| `battery_products` | Specs … | Public read |
| `battery_systems` | `id`, `userId`, `serialNumber`, `manufacturer` … | Owner read/write |
| `battery_monitoring` | `systemId`, `timestamp`, telemetry JSON | Owner read |
| `orders` | `id`, `userId`, `items` (JSONB) … | Owner read/write |
| `payments` | `id`, `userId`, `status`, `paymentMethod`, `metadata` | Owner read/write |
| `payment_webhooks` | raw payload | Admin read |
| `inventory` | `productId`, `quantity` | Admin read/write |

Functions / RPC:
* `filter_orders_by_product(product_id uuid, product_type text)`
* Realtime channel: `realtime:battery_systems`

Migrations live in `supabase/migrations/*` and are applied via `supabase db push`.

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
   git clone https://github.com/your-org/energi-hive-main.git
   cd energi-hive-main
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
   | `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Back-end connectivity |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Front-end public key |
   | `BPAY_BILLER_CODE` | Issued by bank |
   | `GOCARDLESS_ACCESS_TOKEN` | Live / sandbox token |
   | `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Email |
   | `ALPHAESS_API_KEY` / `LG_API_KEY` | Battery vendors |

3. **Database & edge**

   ```bash
   supabase db push
   supabase functions deploy
   ```

4. **Run**

   ```bash
   npm run dev      # http://localhost:3000
   ```

Vitest & ESLint run via `npm test` / `npm run lint`.

---

## 🏗 Architecture Overview
```
              ┌───────────────────────────┐
              │     Front-end (UI)        │   Vite + React 18 + shadcn/ui
              │ (ported from connect)     │
              └─────────────┬─────────────┘
                            │ HTTP / RSC
              ┌─────────────▼─────────────┐
              │  Next.js 14 API Routes    │  Batteries • Orders • Payments
              └─────────────┬─────────────┘
                            │ supabase-js
              ┌─────────────▼─────────────┐
              │    Supabase Postgres      │  RLS, cron, storage
              └───────────────────────────┘
```

---

## 🚀 Deployment (Vercel)

1. **Import repo** → Vercel dashboard (Framework = Next.js).  
2. Add environment variables for **Production** & **Preview**.  
3. Build command `npm run build` (default).  
4. Supabase stays separate – just supply keys.  
5. Optional: add `vercel.json` routing for edge cache.  

---

## 🛣 Next Steps for UI Development

* ☑️ **Backend 100 % complete** – API & schema stable.  
* ☐ **Port remaining UI pages** from `energi-hive-connect` (marketing, community, settings).  
* ☐ Implement **React Query hooks** for new endpoints.  
* ☐ Finish **Payment Wizard** (multi-step) using shadcn/ui dialogs.  
* ☐ Add **Battery Dashboard** charts with Recharts + realtime websockets.  
* ☐ Lighthouse & a11y pass.  
* ☐ End-to-end tests with Playwright.

Contributions welcome – see below!

---

## 🗄 Project Structure (abridged)

```
.
├─ app/                 # Next.js App Router
│  ├─ (auth)/           # login / signup
│  ├─ dashboard/        # user dashboards
│  ├─ products/         # battery catalogue
│  └─ api/              # serverless routes (payments, batteries…)
├─ components/          # UI modules (imported from connect)
├─ lib/                 # shared libraries
│  ├─ supabase/         # typed client helpers
│  ├─ payments/         # AU payment client
│  ├─ batteries/        # AlphaESS & LG clients
│  └─ email/            # email service
├─ supabase/            # SQL migrations + edge functions
└─ public/              # static assets
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
