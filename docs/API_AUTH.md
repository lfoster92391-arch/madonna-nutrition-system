# API authentication (Vercel environment)

Set these in **Project -> Settings -> Environment Variables**:

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection (required for production data) |
| `MNMS_API_KEY` | Shared secret for kiosk/offline sync. Send as `x-api-key` header on `POST /api/transactions/meal` and `POST /api/transactions/sync-batch`. |
| `RESEND_API_KEY` | Optional. When set, outbound emails send via Resend. When unset, messages are logged and stored in the Notification table. |
| `EMAIL_FROM` | Optional sender address for Resend (default: `Fuel The Dons <noreply@fuel-thedons.org>`) |
| `STRIPE_SECRET_KEY` | Stripe payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verification |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client-side Stripe |
| `ADMIN_SEED_PASSWORD` | Optional override for seeded admin passwords (default: `FuelTheDons2026!`) |

## Session headers (browser clients)

Authenticated portal sessions send the logged-in user id as:

```
x-session-user-id: <user.id from AuthProvider session>
```

Required for mutating routes such as student CRUD, inventory/receiving updates, and admin announcements.

## Demo preview

Demo walkthrough data (Sarah Anderson family, etc.) loads only when admin activates **Demo walkthrough** (`demoPreviewActive` in session storage). Production portals without demo preview show real database data only.

## Lisa Morris admin login (production)

After seeding the database, Lisa Morris signs in at **Admin portal** (`/login/admin`):

| Field | Value |
|-------|-------|
| **Username** | `itlisa` |
| **Password** | `FuelTheDons2026!` |

Use the username **`itlisa`** — not a display name like "IT Lisa". The login form strips spaces and ignores case, but the canonical username is `itlisa`.

### Seeding production

**Option A — full seed** (local or CI with production `DATABASE_URL`):

```bash
npm run db:seed
```

**Option B — Lisa admin only** (one-time, safer for production):

```bash
# Set DATABASE_URL to production, then:
npm run db:seed-lisa
```

Override the default password with `ADMIN_SEED_PASSWORD` if needed. The account is created with `mustChangePassword: false`.
