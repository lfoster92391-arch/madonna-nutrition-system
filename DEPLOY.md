# Deploy to Vercel — fuelthedons.com

Deploy the Madonna Nutrition Management System (MNMS) demo to **https://fuelthedons.com** using the Vercel CLI (primary) or Git + Dashboard.

## Pre-flight (local)

| Check | Status |
|-------|--------|
| `npm run build` | Must pass before deploying |
| Demo mode | Works without `DATABASE_URL` (in-memory demo data) |
| `vercel.json` | Included — redirects `www` → apex domain |
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
- `www.fuelthedons.com` (redirect to apex; also see `vercel.json`)

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
| **Demo (default)** | None (optional `NEXT_PUBLIC_APP_URL`) | In-memory data via `DemoProvider` |
| **Production DB** | `DATABASE_URL` | Vercel → Settings → Environment Variables |

Optional future vars (not needed now): `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails locally | Remove `.next`, run `npm run build`; fix TypeScript/errors |
| Build fails on Vercel | Reproduce with `npm run build`; redeploy with `npx vercel --prod` |
| `vercel link` wrong project | Delete `.vercel/` and run `npx vercel link` again with `madonna-nutrition-system` |
| Domain "Invalid Configuration" | Recheck A/CNAME or nameservers; wait for DNS propagation |
| Prisma errors at build | `postinstall` runs `prisma generate` — ensure `prisma/schema.prisma` is in the deploy |
| www not redirecting | Confirm `vercel.json`; re-add domain in Vercel Domains |

---

## Quick checklist

- [ ] `npm run build` passes locally
- [ ] `npx vercel login` and `npx vercel link` (CLI path)
- [ ] `NEXT_PUBLIC_APP_URL` set for production (if using custom domain)
- [ ] `npx vercel --prod` succeeded
- [ ] `fuelthedons.com` + `www.fuelthedons.com` in Vercel Domains
- [ ] DNS A + CNAME **or** Vercel nameservers (ns1/ns2.vercel-dns.com)
- [ ] Site loads at https://fuelthedons.com
