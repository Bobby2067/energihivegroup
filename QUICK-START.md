# Quick Start Guide 🚀

Spin up the **Energi Hive** platform locally in **~5 minutes**.

---

## 1. Prerequisites

| Tool | Min Version |
|------|-------------|
| Node.js | 18 LTS |
| npm / pnpm | latest |
| Git | 2.34+ |
| Supabase account | free |

---

## 2. Clone & Install

```bash
git clone https://github.com/your-org/energi-hive-main.git
cd energi-hive-main
npm install          # or pnpm install
```

---

## 3. Environment Variables

1. Copy template  
   `cp .env.example .env.local`
2. Open `.env.local` and **fill in**:
   * `NEXT_PUBLIC_SUPABASE_URL`
   * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   * `SUPABASE_SERVICE_ROLE_KEY`
3. (Optional) adjust payment / battery API keys later.

---

## 4. Create a Supabase Project (⚡ super-fast)

1. Sign in at https://app.supabase.com → **New project**  
   Region: *ap-southeast-2* (Sydney)
2. Grab the **Project URL**, **anon key** and **service role key** from **Settings → API**  
   Paste them into `.env.local`.

---

## 5. Load the Schema

In the Supabase dashboard:

1. **SQL Editor → New query**
2. Paste contents of `supabase/schema.sql`
3. Click **Run** → tables + RLS are created.

> Tip: if any storage buckets fail, add them in **Storage**:  
> `battery_images (public)`, `product_images (public)`, `user_documents (private)`.

---

## 6. Run the App

```bash
npm run dev
```

Open http://localhost:3000 and sign-up.  
Supabase Auth works out-of-the-box.

---

## 7. (Optional) Seed Demo Data

```bash
npm run seed      # needs service-role key in .env.local
```

Adds demo manufacturers, products, tariffs & a simulated battery with 24 h of data.

---

## 8. Next Steps

• Build pages, components, API routes – everything hot-reloads.  
• When ready, push to GitHub & **Deploy to Vercel** (copy `.env.local` vars).

Happy hacking! ⚡
