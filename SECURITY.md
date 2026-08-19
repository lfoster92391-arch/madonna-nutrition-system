# Fuel The Dons — Security

This document is honest about what we protect, what Stripe handles, and what no app can promise.

## What we never store

- **Raw credit card numbers, CVV/CVC, or full PAN** are never collected into or saved in the Fuel The Dons database.
- Online card deposits use **Stripe Checkout** (hosted by Stripe). Card data is entered on Stripe’s pages and stays in Stripe’s PCI environment.
- We intentionally **do not save payment methods** for reuse. Parents and staff enter card details **each time** they pay. That is a safety choice over convenience (PCI SAQ A style).

Office “card” deposits only record that cash/check/card was taken in person — they do **not** store card digits.

## What Stripe handles vs this app

| Concern | Stripe | Fuel The Dons |
| --- | --- | --- |
| Card number / CVV | Yes | Never |
| Payment authorization & receipt | Yes | Receives paid session id + amount |
| Student lunch balances | No | Yes (school ledger) |
| Saved cards for reuse | Disabled by design | Not offered |
| Disputes / chargebacks | Yes (events) | Emails Mrs. Morris when webhook fires |

## Defense in depth (what we implement)

1. **Transit** — Production is HTTPS. Responses send HSTS, CSP, `X-Frame-Options: DENY`, `X-Content-Type-Options`, Referrer-Policy, and Permissions-Policy.
2. **Secrets** — Stripe secret key, webhook secret, Resend API key, and DB URLs live in server env only. Only the Stripe *publishable* key is public.
3. **Auth** — Login rate limiting with temporary lockout / backoff after repeated failures. Failed attempts are audit-logged.
4. **Encryption at rest** — Postgres/Supabase disk encryption for the database we control. Passwords are stored as bcrypt hashes. We do not store SSN or card PAN fields.
5. **Audit log** — Admin password resets, balance/fund changes, and user create/update/disable actions are recorded.
6. **Intrusion / suspicious-activity email** — Alerts go to Mrs. Morris (`lisamorris@weirtonmadonna.org`, overridable via `SECURITY_ALERT_EMAIL`) for:
   - Burst failed logins
   - Admin password resets
   - Admin login from a new device fingerprint (best-effort)
   - Stripe dispute events (when the webhook is configured)

## Honest limits

- **No system can guarantee “no penetrations ever.”** We reduce risk and detect suspicious activity; we do not claim invulnerability.
- Login lockout is **defense in depth**. On serverless hosts it is strongest when combined with platform/WAF rate limits.
- “New device” alerts use IP + User-Agent fingerprinting — useful signal, not perfect identity.
- Email alerts require `RESEND_API_KEY` (and email enabled). Without it, alerts still land in the in-app notification outbox when the database is configured.
- Keep Stripe Dashboard dispute notifications enabled as a second channel.

## Operator checklist

- Set `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`.
- Subscribe the webhook to `checkout.session.completed` and `charge.dispute.*`.
- Set `RESEND_API_KEY` and optionally `SECURITY_ALERT_EMAIL`.
- Prefer HTTPS-only production hosting (e.g. Vercel) with `NEXT_PUBLIC_APP_URL` set to `https://…`.