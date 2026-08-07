<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single Next.js 16 app (App Router) using **npm** (see `README.md` for the full script list: `dev`, `build`, `lint`, `db:*`). Dependencies are refreshed automatically by the startup update script (`npm install`, which runs `prisma generate` via `postinstall`).

### Running the app / database

- Start the dev server with `npm run dev` (webpack, http://localhost:3000). `npm run build` builds; `npm run lint` lints (the repo currently has pre-existing ESLint errors/warnings — not an environment problem).
- The app has two runtime modes, toggled purely by whether `DATABASE_URL` is set:
  - **DB mode** (recommended for real end-to-end testing): a local PostgreSQL 16 cluster is already installed and seeded in this environment, with credentials in the gitignored `.env` (`postgresql://postgres:postgres@localhost:5432/mnms`). Postgres does **not** auto-start on boot — start it each session with `sudo pg_ctlcluster 16 main start`. If the `mnms` database is ever missing, recreate with `sudo -u postgres psql -c "CREATE DATABASE mnms;"` then `npm run db:push && npm run db:seed`.
  - **Demo mode** (no `DATABASE_URL`): NON-OBVIOUS GOTCHA — despite what `README.md` says about "demo mode without a database", `DemoProvider` returns empty student/transaction/user lists when the DB is disabled, so the kiosk/scan and portal pages show no data. Use DB mode for anything data-driven. Do not "fix" this by editing app code during environment setup.
- Restart the dev server after creating/editing `.env` — Next.js only reads env files at startup.

### Test data / logins (seeded)

- Portal logins use `/login/{admin,cashier,parent,staff,teacher}`. Seeded accounts share password `FuelTheDons2026!` (e.g. admin `d.garcia`, cashier `j.wilson`, parent `sarah.anderson`).
- All seeded students (e.g. `10457`) are intentionally `disabled` by the seed, so the kiosk rejects them ("Student account is disabled"). To exercise the kiosk/scan flow, create an active student via Admin → Student Manager (found under `/admin/imports`, not `/admin/students`), or enable one in the DB.

### Testing

There is no automated test framework in this repo (no Jest/Vitest/Playwright); "testing" means exercising the running app via the browser plus `npm run build`/`npm run lint`.
