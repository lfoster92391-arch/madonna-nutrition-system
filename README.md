# Madonna Nutrition Management System (MNMS)

Enterprise cafeteria operations platform for school nutrition services — scan station, admin portal, parent portal, analytics, and operations command center.

## Stack

- **Next.js 16** (App Router)
- **TypeScript** + **Tailwind CSS v4**
- **Prisma** + **PostgreSQL** (multi-tenant ready)
- **React Query**, **Zod**, **Chart.js**, **PapaParse**
- Stripe-ready, Clerk-ready, Vercel-ready

## Quick Start

Requires a PostgreSQL database. Without `DATABASE_URL`, lists and portals start empty (no invented students, menus, or staff).

```bash
npm install
cp .env.example .env
# Set DATABASE_URL, then:
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

- **Landing:** `/`
- **Scan Station:** `/scan` (kiosk)
- **Admin Portal:** `/admin` — import students via Family Import / SIS CSV
- **Parent Portal:** `/parent`
- **Ops Center:** `/ops`

**Bootstrap admin after seed:** username `itlisa` or email `lisamorris@weirtonmadonna.org` — password from `ADMIN_SEED_PASSWORD` or default `FuelTheDons2026!` (change after first login).

## Database Setup (Production)

When `DATABASE_URL` is set, the app persists students, scan transactions, users, audit logs, calendar data, and allergy workflows to PostgreSQL. Without it, the UI shows empty states — real data comes from imports and live use.

### Production Database Setup (Neon — free tier)

1. Create a project at [neon.tech](https://neon.tech) (PostgreSQL 16+).
2. Copy the **pooled** connection string (add `?sslmode=require` if not present).
3. Local `.env`:

```bash
cp .env.example .env
```

```
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
NEXT_PUBLIC_APP_URL=https://fuelthedons.com
```

4. Push schema and bootstrap school + admin (no demo roster):

```bash
npm run db:push
npm run db:seed
```

5. **Vercel:** Project → Settings → Environment Variables → add `DATABASE_URL` for Production (and Preview if desired). Redeploy.

6. Optional: copy `SCHOOL_ID` from seed output if you run multiple schools.

7. Import real students via **Admin → Family Import** (SIS export).

### Legacy local Postgres

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/mnms?schema=public"
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
| `npm run db:seed` | Bootstrap school + primary admin (no demo people) |
| `npm run db:seed-lisa` | Upsert itlisa admin (`lisamorris@weirtonmadonna.org`) on an existing school |
| `npm run db:disable-demo-students` | Disable legacy demo MD IDs if present |
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
│   └── providers/            # App data + React Query providers
└── lib/
    ├── types.ts              # Shared TypeScript types
    ├── prisma.ts             # Prisma client singleton
    └── utils.ts              # Utilities

prisma/
├── schema.prisma             # Multi-tenant schema
└── seed.ts                   # Bootstrap school + admin (no demo roster)
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
| `NEXT_PUBLIC_APP_URL` | Production | Public site URL (e.g. `https://fuelthedons.com`) — used for metadata and OG tags |
| `DATABASE_URL` | Production | PostgreSQL connection string — enables DB persistence |
| `SCHOOL_ID` | Optional | Tenant school ID when multiple schools exist |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Future | Clerk auth |
| `CLERK_SECRET_KEY` | Future | Clerk auth |
| `STRIPE_SECRET_KEY` | Future | Payment processing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Future | Payment processing |

Without a database the UI stays empty. Add `DATABASE_URL`, run `db:seed`, then import real students — the app does not invent roster or menu data.

## Deployment

**Target domain:** [https://fuelthedons.com](https://fuelthedons.com)

**Live preview (if deployed):** [https://madonna-nutrition-system.vercel.app](https://madonna-nutrition-system.vercel.app)

See **[DEPLOY.md](./DEPLOY.md)** for the full step-by-step checklist: GitHub push, Vercel import, custom domain DNS, SSL, and demo-mode launch without `DATABASE_URL`.

Quick summary:

1. Commit all project files locally (repo has no GitHub remote yet — see DEPLOY.md)
2. Push to GitHub, then import at [vercel.com/new](https://vercel.com/new) — framework auto-detects as **Next.js**
3. Deploy with **no env vars** for demo (defaults to `https://fuelthedons.com` in metadata)
4. Add domains `fuelthedons.com` and `www.fuelthedons.com` in Vercel → **Settings → Domains**
5. At your registrar, set apex **A** `@` → `76.76.21.21` and **CNAME** `www` → `cname.vercel-dns.com`

## License

Proprietary — Madonna Nutrition Management System
