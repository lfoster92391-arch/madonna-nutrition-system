# Deploy to Vercel — fuelthedons.com

Deploy the Madonna Nutrition Management System (MNMS) demo to **https://fuelthedons.com** using the Vercel CLI (primary) or Git + Dashboard.

## Pre-flight (local)

| Check | Status |
|-------|--------|
| `npm run build` | Must pass before deploying |
| Demo mode | Works without `DATABASE_URL` (in-memory demo data) |
| `vercel.json` | Next.js framework preset; www → apex redirect via Vercel Domains (not in `vercel.json`) |
| Vercel project | **madonna-nutrition-system** (team: lfoster92391-archs-projects) |

If a local build fails with a missing file under `.next/`, delete `.next` and run `npm run build` again.

Do **not** commit `.env` files. Demo mode needs no secrets on Vercel beyond optional public URL.

---

## Option B — Vercel CLI (recommended)

Use this when deploying from your machine without relying on Git push.

### Prerequisites

- Node.js and npm installed
- Access to team **lfoster92391-archs-projects** and project **madonna-nutrition-system**

### Step 1 — Authenticate (once per machine)

```bash
npx vercel login
```

Complete browser sign-in when prompted. Verify:

```bash
npx vercel whoami
```

### Step 2 — Link the repo (once per clone)

From the project root:

```bash
npx vercel link
```

When prompted:

- **Set up and deploy?** No (link only) — or Yes if you want an immediate preview
- **Scope:** lfoster92391-archs-projects
- **Link to existing project?** Yes
- **Project name:** `madonna-nutrition-system`

This creates `.vercel/` locally (already in `.gitignore` — do not commit).

### Step 3 — Production environment variable

Set the public app URL for production (skip if already set):

```bash
npx vercel env ls production
npx vercel env add NEXT_PUBLIC_APP_URL production --value "https://fuelthedons.com" --yes --no-sensitive
```

Redeploy after changing env vars so the build picks them up.

### Step 4 — Deploy to production

```bash
npm run build          # optional but recommended locally first
npx vercel --prod --yes
```

Preview (non-production) deploy:

```bash
npx vercel
```

### Step 5 — Custom domains & DNS

In [Vercel Dashboard](https://vercel.com/dashboard) → **madonna-nutrition-system** → **Settings** → **Domains**, ensure:

- `fuelthedons.com`
- `www.fuelthedons.com` (set to redirect to apex in Vercel Domains)

**DNS at your registrar** (if not using Vercel nameservers):

| Type | Name / Host | Value | TTL |
|------|-------------|-------|-----|
| **A** | `@` (or blank) | `76.76.21.21` | 3600 (or Auto) |
| **CNAME** | `www` | `cname.vercel-dns.com` | 3600 (or Auto) |

**Vercel DNS (alternative):** point the domain nameservers to **ns1.vercel-dns.com** and **ns2.vercel-dns.com**, then manage records in Vercel.

### Step 6 — Verify

1. Latest production deployment shows **Ready** in Vercel.
2. Visit **https://fuelthedons.com** and **https://madonna-nutrition-system.vercel.app**.
3. Confirm **https://www.fuelthedons.com** redirects to apex.
4. Smoke-test: `/scan`, `/parent`, `/admin/allergy-review`.

---

## Option A — Vercel Dashboard + Git

Use when you prefer continuous deploy from GitHub.

### Step 1 — Push to GitHub

If you do not have a GitHub remote yet:

1. Create a new repo at [github.com/new](https://github.com/new) (empty, no README).
2. Link and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/madonna-nutrition-management-system.git
git branch -M main
git push -u origin main
```

### Step 2 — Import in Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard).
2. **Add New…** → **Project** → import your repo.
3. Framework: **Next.js** (defaults: `npm run build`, `.next`, `npm install`).
4. Environment variables: none required for demo; add `NEXT_PUBLIC_APP_URL=https://fuelthedons.com` in Production if needed.
5. **Deploy**.

### Step 3 — Domains & DNS

Same as **Option B, Step 5**.

---

## Demo vs production database

| Mode | Env vars | Notes |
|------|----------|-------|
| **Demo (dev only)** | None (optional `NEXT_PUBLIC_APP_URL`) | In-memory data when `DATABASE_URL` is unset |
| **Production DB** | `DATABASE_URL` (+ optional `SCHOOL_ID` or `SCHOOL_SLUG`) | Neon, Supabase, or Vercel Postgres — see below |
| **Live payments** | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Parent prepay via Stripe Checkout — see below |

Optional future vars: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.

---

## Stripe setup (parent prepay)

Parents add cafeteria funds at **`/parent/add-funds`** via Stripe Checkout. Without Stripe keys, the app shows a clearly labeled **demo deposit** for local development.

### Environment variables (Vercel Production)

| Variable | Where to get it |
|----------|-----------------|
| `STRIPE_SECRET_KEY` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → Secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Webhooks (see below) |
| `SCHOOL_SLUG` | `madonna-high-school` (single school at launch) |

Add all four in [Vercel](https://vercel.com/dashboard) → **madonna-nutrition-system** → **Settings** → **Environment Variables** → **Production**, then redeploy.

Or via CLI:

```bash
npx vercel env add STRIPE_SECRET_KEY production
npx vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production --no-sensitive
npx vercel env add STRIPE_WEBHOOK_SECRET production
npx vercel env add SCHOOL_SLUG production --value "madonna-high-school" --yes --no-sensitive
```

### Stripe Dashboard — webhook

1. Open [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks) → **Add endpoint**.
2. **Endpoint URL:** `https://www.fuelthedons.com/api/stripe/webhook`
3. **Events:** `checkout.session.completed`
4. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in Vercel.
5. Redeploy production after saving env vars.

For local webhook testing, use the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Use the CLI signing secret as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

### Test flow

1. Log in to the parent portal (`parent` / any password in demo auth).
2. Go to **Add Funds** → select an Anderson student → choose $10 / $25 / $50 or custom ($5–$500).
3. Click **Pay with Card** → complete Stripe Checkout (test card `4242 4242 4242 4242`).
4. Return URL shows success; webhook credits `students.balance`, creates a `deposit` transaction, and writes an audit log entry.
5. Confirm on **Transactions** and the parent dashboard balance.

Stripe test mode keys work end-to-end before switching to live keys.

---

## Neon Postgres (recommended — free tier)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the **pooled** connection string (append `?sslmode=require` if missing).
3. Vercel → **madonna-nutrition-system** → **Settings** → **Environment Variables** → add `DATABASE_URL` for Production.
4. From your machine (with `DATABASE_URL` in `.env`):

```bash
npm run db:push
npm run db:seed
```

5. Redeploy: `npx vercel --prod --yes`

Seed prints `SCHOOL_ID` — optionally add to Vercel. Seeded portal password: `FuelTheDons2026!`

---

## Supabase + Vercel Setup

Use Supabase for PostgreSQL and Vercel for hosting. Prisma connects through Supabase's connection pooler on Vercel (serverless) and uses a direct/session connection for migrations.

### Connection strings (what to copy from Supabase)

In [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings** → **Database** → **Connection string**:

| Variable | Supabase mode | Port | Used for |
|----------|---------------|------|----------|
| `DATABASE_URL` | **Transaction** pooler | **6543** | App runtime on Vercel (add `?pgbouncer=true` if not present) |
| `DIRECT_URL` | **Session** pooler (or Direct) | **5432** | `prisma migrate deploy`, `prisma db push`, `npm run db:seed` |

Example values (replace `[ref]`, `[password]`, `[region]` with your project values):

```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

Copy `.env.example` to `.env.local` for local development and fill in both URLs.

### Step 1 — Supabase connection strings

1. Open **Project Settings** → **Database** → **Connection string**.
2. Choose **URI** format.
3. Copy the **Transaction** pooler URI → this becomes `DATABASE_URL` (port **6543**, include `?pgbouncer=true`).
4. Copy the **Session** pooler URI (or Direct connection) → this becomes `DIRECT_URL` (port **5432**).
5. Replace `[YOUR-PASSWORD]` with your database password (reset under **Database password** if needed).

### Step 2 — Vercel environment variables

1. [Vercel Dashboard](https://vercel.com/dashboard) → **madonna-nutrition-system** → **Settings** → **Environment Variables**.
2. Add **`DATABASE_URL`** — paste the Transaction pooler URI (6543, `?pgbouncer=true`).
3. Add **`DIRECT_URL`** — paste the Session/Direct URI (5432).
4. Scope both to **Production** (and **Preview** / **Development** if you use preview DBs).

Or via CLI:

```bash
npx vercel env add DATABASE_URL production
npx vercel env add DIRECT_URL production
```

### Step 3 — Apply schema and seed (run locally or in CI)

From the project root with `.env.local` (or exported env vars) pointing at Supabase:

```bash
npm install
npx prisma generate
npx prisma migrate deploy   # preferred when migrations exist
# — or, for initial schema without migration history —
npx prisma db push
npm run db:seed
```

`migrate deploy` uses `DIRECT_URL` from `schema.prisma` for DDL; the app at runtime uses `DATABASE_URL` through the transaction pooler.

### Step 4 — Redeploy Vercel

After env vars and schema are in place:

```bash
npx vercel --prod --yes
```

Or push to `main` if Git integration is enabled. Vercel runs `postinstall` → `prisma generate` on each build.

### Verify

- [ ] `DATABASE_URL` and `DIRECT_URL` set in Vercel Production
- [ ] `npx prisma migrate deploy` or `db push` succeeded against Supabase
- [ ] `npm run db:seed` completed
- [ ] Production redeploy shows **Ready**
- [ ] App routes that use Prisma return data (not demo fallback)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **404 NOT_FOUND** on `*.vercel.app` (Vercel error page, `Code: NOT_FOUND`) | Project had **Framework Preset = Other** (`framework: null`). Vercel deployed only static `public/` files — all app routes 404. Fix: ensure `vercel.json` includes `"framework": "nextjs"`, redeploy with `npx vercel --prod`, confirm build logs say **Detected Next.js**. If the short domain shows `DEPLOYMENT_NOT_FOUND`, run `npx vercel alias set <deployment-url> madonna-nutrition-system.vercel.app`. |
| Build fails locally | Remove `.next`, run `npm run build`; fix TypeScript/errors |
| Build fails on Vercel | Reproduce with `npm run build`; redeploy with `npx vercel --prod` |
| `vercel link` wrong project | Delete `.vercel/` and run `npx vercel link` again with `madonna-nutrition-system` |
| Domain "Invalid Configuration" | Recheck A/CNAME or nameservers; wait for DNS propagation |
| Prisma errors at build | `postinstall` runs `prisma generate` — ensure `prisma/schema.prisma` is in the deploy |
| www not redirecting | In Vercel Domains, set `www` to redirect to apex; re-add domain if needed |

---

## Quick checklist

- [ ] `npm run build` passes locally
- [ ] `npx vercel login` and `npx vercel link` (CLI path)
- [ ] `NEXT_PUBLIC_APP_URL` set for production (if using custom domain)
- [ ] `npx vercel --prod` succeeded
- [ ] `fuelthedons.com` + `www.fuelthedons.com` in Vercel Domains
- [ ] DNS A + CNAME **or** Vercel nameservers (ns1/ns2.vercel-dns.com)
- [ ] Site loads at https://fuelthedons.com
