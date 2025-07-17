# Energi Hive Platform – Setup Guide 🇦🇺⚡️

A step-by-step manual for getting the **Energi Hive** monorepo running locally and deploying to production with Supabase and Vercel.  
Total time: **≈ 20 minutes**.

---

## 1. Prerequisites

| Tool | Minimum version |
|------|-----------------|
| Node.js | 18 LTS |
| pnpm or npm | Latest |
| Git | 2.34 |
| Supabase account | Free tier OK |
| Vercel account | Free tier OK |

Ensure `node --version` outputs ≥ 18.

---

## 2. Fork & Clone

```bash
git clone https://github.com/your-org/energi-hive-main.git
cd energi-hive-main
```

> 💡 **Windows:** use WSL2 for the smoothest experience.

---

## 3. Install dependencies

```bash
npm install
# or
pnpm install
```

---

## 4. Create Supabase project

1. Sign in to [app.supabase.com](https://app.supabase.com).
2. **New project** → choose **Free**, select a region close to Australia (e.g. `ap-southeast-2`).
3. Copy:
   * **Project URL**
   * **anon public key**
   * **service_role key**  
     (Settings → API)

---

## 5. Configure environment variables

Create `.env.local` in the repo root:

```env
#############################
# — Runtime config
#############################
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

#############################
# — Supabase
#############################
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

#############################
# — Battery APIs (optional)
#############################
ALPHAESS_API_URL=https://api.alphaess.com/api
ALPHAESS_API_KEY=xxxx
ALPHAESS_API_SECRET=xxxx

LG_API_URL=https://api.lgesscloud.com/api
LG_API_KEY=xxxx
LG_API_SECRET=xxxx

#############################
# — Australian Payments
#############################
BPAY_BILLER_CODE=123456
PAYID_IDENTIFIER=pay@energihive.com.au
BANK_ACCOUNT_NAME=Energi Hive Pty Ltd
BANK_BSB=123-456
BANK_ACCOUNT_NUMBER=12345678
GOCARDLESS_ACCESS_TOKEN=xxxx
GOCARDLESS_ENVIRONMENT=sandbox

#############################
# — Email (SMTP)
#############################
EMAIL_SERVER_HOST=smtp.mailprovider.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=notifications@energihive.com.au
EMAIL_SERVER_PASSWORD=super-secret
EMAIL_FROM="Energi Hive Support <notifications@energihive.com.au>"

#############################
# — Misc
#############################
ENABLE_BATTERY_SIMULATION=true
```

Commit `.env.example` (without secrets) to version control; **never commit `.env.local`**.

---

## 6. Import database schema

### 6.1 Supabase SQL editor

1. Open Supabase → **SQL Editor** → **New query**.
2. Paste the contents of `supabase/schema.sql` (found in `/supabase` folder).
3. **Run**.  
   • Creates tables, RLS, functions, storage buckets.

### 6.2 Storage buckets manual steps

If the script fails to add buckets (rare):

Settings → **Storage** → **New bucket**

| ID                | Public |
|-------------------|--------|
| `battery_images`  | ✔ |
| `product_images`  | ✔ |
| `user_documents`  | ✘ |

---

## 7. Verify Row Level Security

Each table is created with RLS **enabled**.  
In Supabase UI:

* Table → **Auth** should show policies created by the script (e.g. “Users can view their own profile”).

---

## 8. Running locally

```bash
npm run dev
# Server starts on http://localhost:3000
```

Log in / sign up → data should appear in Supabase tables.

---

## 9. Seeding dummy data (optional)

```bash
npm run seed
```

The seed script (located in `/scripts/seed.ts`) inserts demo products, tariffs, and a simulated AlphaESS battery.

---

## 10. Deployment to Vercel

1. Push your repo to GitHub.
2. Vercel dashboard → **New Project** → import repo.
3. **Environment variables**: copy the same keys from `.env.local` (leave `NEXT_PUBLIC_APP_URL` blank; Vercel sets it).
4. Build command: `npm run build`  
   Output dir: `.` (Next 14 standalone output is handled automatically).
5. Deploy.  
   On first run Vercel will create a production URL (e.g. `https://energi-hive.vercel.app`).

**Update Supabase Auth URLs**

Supabase → Settings → Authentication → URL Configuration:

* Allowed Redirect URLs  
  `https://energi-hive.vercel.app/*`
* Allowed Web Origins  
  same URL
* Allowed Logout URLs  
  same URL

---

## 11. Production checklist ✅

- [ ] Supabase **service_role** key **NOT** exposed to client (only server runtime).
- [ ] SMTP credentials working (test via “forgot password”).
- [ ] GoCardless environment switched to `live`.
- [ ] CORS configured in Supabase (`auth` → **URL Configuration**).
- [ ] Custom domain added in Vercel and `NEXT_PUBLIC_APP_URL` updated.
- [ ] Backups enabled in Supabase.

---

## 12. Common issues & fixes

| Symptom | Fix |
|---------|-----|
| `401 invalid token` | Check `NEXT_PUBLIC_SUPABASE_URL` & `ANON_KEY`. |
| `Failed to fetch /api/batteries` | Supabase RLS blocking → ensure battery_systems rows contain correct `user_id`. |
| Vercel build fails at `critters` | Already fixed by removing `optimizeCss` in `next.config.js`. |

---

## 13. Where to go next

- **Add additional battery integrations**: create new client in `lib/batteries/`.
- **Enable VPP participation**: update `vpp_programs` and cron job calling `calculate_energy_savings`.
- **Mobile app**: Expo + Supabase + Queries share the same API.

Happy hacking! ⚡️
