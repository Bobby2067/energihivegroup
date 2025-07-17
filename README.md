# Energi Hive Main

Integrated platform that fuses the **rich React UI** from `energi-hive-connect` with the **robust Next.js 14 API layer** of `energi-hive-platform`, packaged as a single repository ready for production in the Australian energy market.

---

## ✨ Feature Highlights

| Category | Highlights |
|----------|------------|
| Payments (AU) | BPAY • PayID • Direct Bank Transfer • GoCardless Direct-Debit |
| Batteries | Real-time & historical telemetry for AlphaESS & LG RESU (API + simulation) |
| Communities | Create / join local groups, bulk-buy discounts, invitations |
| Commerce | Deposit / balance workflow, order & fulfillment tracking |
| Dashboards | Smart-energy, AI optimisation, ROI calculators, newsletter suite |
| Auth & RBAC | Supabase email / OAuth, role-based access, secure RLS policies |
| Notifications | Email (SMTP / SES), optional SMS, realtime toast feedback |
| Dev-Ops | Next.js 14 App Router, Vercel zero-config deploy, typed Supabase SDK |

---

## 🏗 Architecture Overview

```
              ┌───────────────────────────┐
              │     Front-end (UI)        │   Vite + React 18 + shadcn/ui
              │  (from energi-hive-connect)│
              └─────────────┬─────────────┘
                            │ HTTP / RSC
              ┌─────────────▼─────────────┐
              │  Next.js 14 API Routes    │  Batteries ▪ Orders ▪ Payments ▪ Email
              │   (from energi-hive-platform) │
              └─────────────┬─────────────┘
                            │ supabase-js
              ┌─────────────▼─────────────┐
              │    Supabase Postgres      │  RLS, edge-funcs, storage
              └───────────────────────────┘
```

Key integration points  
1. **Payments** – Stripe removed.  `/lib/payments` implements Australian gateways and Supabase Edge Functions `create-payment` & `verify-payment`.  
2. **Batteries** – Unified AlphaESS & LG clients under `/lib/batteries` with AU-specific simulation & TOU optimisations.  
3. **UI Components** – Payment flows, dashboards and 30+ pages copied from `connect`, now rendered via Next.js.  

---

## 💳 Australian Payment System

| Method | Fees | Settlement | Notes |
|--------|------|-----------|-------|
| **BPAY** | $0 | Same-day | Most cost-effective for \> $2 k |
| **PayID** | $0 | Instant | Great for deposits & small payments |
| **Bank Transfer** | $0 | 1-2 days | Traditional BSB / account |
| **GoCardless** | 1 % + $0.40 (max $4) | 2 days | Direct-debit, ideal for payment plans |

Implementation details  
* `lib/payments/client.ts` creates, verifies and refunds payments.  
* Edge functions live in `supabase/functions/*`.  
* Webhook endpoint handles GoCardless events (`/api/payments/gocardless/webhook`).  

---

## 🔋 Battery Monitoring

* Real-time polling every 60 s (configurable) with graceful fallback to simulation.
* Historical queries (`day / hour / 15 min`) cached for performance.
* Australian TOU analytics added: peak / shoulder / off-peak cost, feed-in income, arbitrage signals.

---

## 🛠 Tech Stack

| Layer | Tech / Service |
|-------|----------------|
| Front-end | **Next.js 14** (App Router) · React 18 · Tailwind CSS 3 · shadcn/ui |
| State | TanStack Query · React-Hook-Form · Zod |
| Data / Auth | **Supabase** (`@supabase/ssr`, edge functions) |
| Payments | BPAY · PayID · GoCardless SDK |
| Batteries | AlphaESS, LG RESU (REST) |
| Email | Nodemailer (SMTP) or AWS SES |
| Dev-Ops | **Vercel** CI/CD · Vitest · ESLint · Prettier |

---

## ⚙️ Local Setup

1. **Clone & install**

   ```bash
   git clone https://github.com/your-org/energi-hive-main.git
   cd energi-hive-main
   npm install
   ```

2. **Environment variables**

   ```bash
   cp .env.example .env.local
   # fill in Supabase keys, BPAY biller code, GoCardless token, etc.
   ```

3. **Supabase**

   ```bash
   supabase db push          # run SQL migrations
   supabase functions deploy # edge functions for payments
   ```

4. **Run dev server**

   ```bash
   npm run dev               # http://localhost:3000
   ```

---

## 🚀 Deployment ( Vercel )

1. Import the repo in Vercel → set **Framework = Next.js**.  
2. Add all env-vars for **Production** & **Preview** environments.  
3. Build command `npm run build` (default) – output automatically detected.  
4. Supabase Edge Functions deploy separately; they run at `https://<project>.functions.supabase.co`.  
5. Add custom domains, DSM records; SSL auto-provisioned.

---

## 🇦🇺 Australian Market Optimisations

* **TOU Cost Modelling** – peak / shoulder / off-peak tariff mapping for NEM east-coast states.  
* **Feed-in Tariff Simulation** – 5 c / kWh default, configurable per community.  
* **Weather & Season Adjust** – solar simulation scales by month (summer +30 %, winter -30 %).  
* **Grid Alerts** – voltage fluctuation & low-SOC notifications tuned for Australian standards.  
* **AUD Currency Defaults** – all money utilities default to AUD formatting.

---

## 🗄 Project Structure (abridged)

```
.
├─ app/                 # Next.js App Router
│  ├─ (auth)/           # login / signup
│  ├─ dashboard/        # user dashboards
│  ├─ products/         # battery catalogue
│  └─ api/              # serverless routes (payments, batteries…)
├─ components/          # UI & feature modules (imported from connect)
├─ lib/                 # shared libraries
│  ├─ supabase/         # typed clients & helpers
│  ├─ payments/         # AU payment client
│  ├─ batteries/        # AlphaESS & LG clients
│  └─ email/            # email service
├─ supabase/            # SQL migrations + edge functions
├─ public/              # static assets
└─ vercel.json          # deploy config
```

---

## 🤝 Contributing

PRs and issues welcome!  
Please follow conventional commits and run `npm run lint && npm test` before pushing.

---

## 📄 License

© 2025 Energi Hive Pty Ltd. Released under the **MIT License**.
