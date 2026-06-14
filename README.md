# Madonna Nutrition Management System (MNMS)

Enterprise cafeteria operations platform for school nutrition services — scan station, admin portal, parent portal, analytics, and operations command center.

## Stack

- **Next.js 16** (App Router)
- **TypeScript** + **Tailwind CSS v4**
- **Prisma** + **PostgreSQL** (multi-tenant ready)
- **React Query**, **Zod**, **Chart.js**, **PapaParse**
- Stripe-ready, Clerk-ready, Vercel-ready

## Quick Start (Demo Mode)

Demo mode works **without a database** using seeded in-memory data. Parent submissions, admin approvals, and scan station alerts share a single demo state.

### Demo Workflow (Food Safety)

1. Log in to **Parent Portal** (`/parent`) as Sarah Anderson
2. Open **Food Safety Center** → select Emma Anderson
3. Submit allergy/dietary changes (or review pending submission on dashboard)
4. Go to **Admin → Allergy Review Queue** (`/admin/allergy-review`) and **Approve**
5. Scan James (ID `10457`) at `/scan` to see severe allergy banner and meal compatibility

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- **Landing:** `/`
- **Scan Station:** `/scan` (primary demo entry — no login required)
- **Admin Portal:** `/admin`
- **Transactions:** `/transactions`
- **Inventory:** `/inventory`
- **Analytics:** `/analytics`
- **Parent Portal:** `/parent`
- **Food Safety Center:** `/parent/student-profile` (per-student: `/parent/student-profile/[studentId]`)
- **Allergy Review Queue:** `/admin/allergy-review`
- **Ops Center:** `/ops`

## Database Setup (Production)

1. Create a PostgreSQL database
2. Copy environment variables:

```bash
cp .env.example .env
```

3. Set `DATABASE_URL` in `.env`:

```
DATABASE_URL="postgresql://user:password@localhost:5432/mnms?schema=public"
```

4. Run migrations and seed:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Open Prisma Studio |

## Design System

| Token | Value |
|-------|-------|
| Background | `#FFFFFF` |
| Primary Navy | `#001E62` |
| Secondary Silver | `#C8CDD7` |
| Success Green | `#00A651` |
| Warning Amber | `#F59E0B` |
| Danger Red | `#DC2626` |
| Font | Inter |
| Border Radius | 16–20px |

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   └── (platform)/           # Operational routes (shared sidebar)
│       ├── scan/             # Hero scan station
│       ├── admin/            # Student manager + CSV import
│       ├── transactions/
│       ├── inventory/
│       ├── analytics/
│       ├── parent/
│       └── ops/
├── components/
│   ├── ui/                   # Design system components
│   ├── layout/               # AppSidebar
│   ├── admin/                # CSV import wizard
│   └── providers/            # Demo + React Query providers
├── data/demo/                # Seeded demo data
└── lib/
    ├── types.ts              # Shared TypeScript types
    ├── prisma.ts             # Prisma client singleton
    └── utils.ts              # Utilities

prisma/
├── schema.prisma             # Multi-tenant schema
└── seed.ts                   # Database seed script
```

## Multi-Tenant & White-Label

The Prisma schema includes `School` with branding fields (`logoUrl`, `primaryColor`, `secondaryColor`) for future multi-school tenant isolation. All operational tables reference `schoolId`.

## Logo Assets

Place brand assets in `public/`:
- `logo.svg` / `logo.png` — header logo
- `icon.svg` / `icon.png` — favicon / app icon

## Environment Variables

Copy the example file and adjust for your environment:

```bash
cp .env.example .env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Production | Public site URL (e.g. `https://fuelthebluedons.com`) — used for metadata and OG tags |
| `DATABASE_URL` | For DB mode | PostgreSQL connection string — **not required for demo launch** |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Future | Clerk auth |
| `CLERK_SECRET_KEY` | Future | Clerk auth |
| `STRIPE_SECRET_KEY` | Future | Payment processing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Future | Payment processing |

### Demo mode on production

The app runs fully in **demo mode** without a database. All portals, scan station, food safety workflow, and admin review queue use in-memory demo data via `DemoProvider`. You can deploy to Vercel immediately and add `DATABASE_URL` later when moving off demo data.

## Deployment

**Target domain:** [https://fuelthebluedons.com](https://fuelthebluedons.com)

**Live preview (if deployed):** [https://madonna-nutrition-system.vercel.app](https://madonna-nutrition-system.vercel.app)

See **[DEPLOY.md](./DEPLOY.md)** for the full step-by-step checklist: GitHub push, Vercel import, custom domain DNS, SSL, and demo-mode launch without `DATABASE_URL`.

Quick summary:

1. Commit all project files locally (repo has no GitHub remote yet — see DEPLOY.md)
2. Push to GitHub, then import at [vercel.com/new](https://vercel.com/new) — framework auto-detects as **Next.js**
3. Deploy with **no env vars** for demo (defaults to `https://fuelthebluedons.com` in metadata)
4. Add domains `fuelthebluedons.com` and `www.fuelthebluedons.com` in Vercel → **Settings → Domains**
5. At your registrar, set apex **A** `@` → `76.76.21.21` and **CNAME** `www` → `cname.vercel-dns.com`

## License

Proprietary — Madonna Nutrition Management System
