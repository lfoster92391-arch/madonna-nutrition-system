# Badge & Barcode Format - Fuel The Dons

This guide is for Madonna cafeteria badge enrollment and scan-station setup.

## Two identifiers per student

| Field | Purpose | Example |
|-------|---------|---------|
| **MD ID** | Canonical SIS student number; used in imports, parent linking, and manual kiosk entry | `10457` |
| **Barcode** | Value encoded on the physical badge; scanned at the kiosk | Usually same as MD ID |

If the physical badge number differs from the MD ID, set both in Admin -> Badge Setup -> **Assign**, or include a `barcode` column in the badge CSV import.

## Barcode format expectations

- **Characters:** digits only (`0-9`)
- **Length:** 4-6 digits (matches staff badge rules)
- **No prefixes:** do not include school codes or check digits unless they are printed on the badge
- **Uniqueness:** one barcode per student within the school; duplicates are rejected on import/assign

### Typical Madonna flow

1. SIS export provides **MD ID** (student number).
2. Badges are printed with a Code 128 or Code 39 barcode encoding the numeric ID.
3. Import the badge enrollment CSV with `mdId`, names, grade, and `badgeStatus`.
4. Set status to **active** when the badge is issued.

## Scan station behavior

The kiosk (`/scan` or `/kiosk`) resolves a student when the scan value matches either:

- the student **MD ID** (`externalId`), or
- the assigned **barcode**

| Badge status | Kiosk behavior |
|--------------|----------------|
| **active** | Student loads; meals can be recorded |
| **pending** | "Badge not yet activated" - enrollment incomplete |
| **inactive** | "Badge deactivated" - do not serve |

## CSV import columns

Download the template from **Admin -> Badge Setup -> Import / Export -> Download Template**.

| Column | Required | Notes |
|--------|----------|-------|
| MD ID | Yes | SIS student number |
| First Name | Yes | |
| Last Name | Yes | |
| Grade | Yes | |
| Photo URL | No | HTTPS URL or path after photo sync |
| Badge Status | No | `active`, `pending`, or `inactive` (default: pending) |

Optional extended column (not in template header): `barcode` - use when physical badge differs from MD ID.

## Admin workflows

1. **Bulk enroll:** Import CSV, then review validation summary (matched / created / updated / errors).
2. **Single assign:** Badge roster -> **Assign** -> enter barcode + status.
3. **Mass print student badges:** Admin -> Badge Setup -> **Student badges** -> select students (or **Print filtered**) -> **Print student badges** -> preview -> **Print now**.
4. **Mass print staff / teacher badges:** Admin -> Badge Setup -> **Staff & teacher badges**, or Admin -> Imports -> Staff directory -> select people -> **Print staff badges**. Cards show photo, name, email, role, department, Code 128 barcode, and Badge ID.
5. **Staff / teacher photos:** Staff directory or User Management -> **Open profile** -> **Take photo** (phone camera) or **Upload photo** -> **Save photo**. Photos persist on `User.photo` and print on badges.
6. **Export CSV:** **Export CSV** downloads the current student roster for reconciliation or Campus Badge Studio.
7. **Parent accounts:** Badge import does not create logins; use **Admin -> Imports -> Parents & Family Accounts** to link parents by email.

### Campus Badge Studio note

For production plastic-card printers and FACTS photo sync, **Campus Badge Studio** (`D:\FACTS\FACTSBadgeStudio`) remains the better long-term hardware path. Fuel The Dons mass print is the operator-ready sheet preview for paper/PDF badges today.

## Staff badge scan behavior

The lunch kiosk resolves a scan in this order:

1. Student MD ID / barcode (existing flow)
2. Staff / teacher / cashier / admin **Badge ID** (`User.badgeId`)

When a staff badge matches an active workplace account, the station shows their lunch balance and can charge a staff meal (debits `User.accountBalance`). Offline mode still supports students only.

## Troubleshooting

- **"Badge not recognized" at kiosk:** Confirm student status is **active** (or staff account is active with a Badge ID) and the barcode matches what the scanner sends.
- **Import duplicate barcode:** Another student already has that barcode; resolve in the roster or SIS export.
- **Offline kiosk:** Active students are cached locally by MD ID; re-sync when back online. Staff meals require an online connection.
- **Missing staff photo on print:** Open the staff/teacher profile, Take or Upload a photo, then Save photo before printing.