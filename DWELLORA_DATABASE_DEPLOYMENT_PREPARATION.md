# DWELLORA — DATABASE DEPLOYMENT PREPARATION REPORT
**Date:** October 20, 2026
**Target:** Dwellora Production Database Architecture & Migration Preparation
**Scope:** PostgreSQL DDL, Prisma Schema & Migrations, Razorpay Models, Data Preservation, Security Controls

---

## 1. Executive Summary

This phase prepared the database layer of the Dwellora platform for client-owned production deployment, resolving the absence of a version-controlled Prisma migration history while protecting against accidental data loss, schema divergence, and credential exposure.

| Area | Status | Key Findings & Actions |
| :--- | :---: | :--- |
| **Initial Migration Artifact** | `READY` | Generated deterministic, version-controlled initial migration `20261020000000_init_dwellora` matching the complete active Prisma AST (26 tables, 8 enums, full foreign keys and indexes). |
| **Prisma Migration Lock** | `READY` | Created `server/prisma/migrations/migration_lock.toml` configured for `provider = "postgresql"`. |
| **Schema Discrepancy Analysis** | `IDENTIFIED` | Documented divergences between legacy `scripts/postgres/01_schema.sql` and the active Prisma schema used by Express backend. |
| **Data Preservation Audit** | `VERIFIED` | Confirmed no uncommitted database dumps or orphaned volume data exist; identified destructive table purge risks in `server/src/seed.ts`. |
| **Git & Secrets Security** | `FIXED` | Discovered `server/.env` was previously indexed in Git; untracked it (`git rm --cached`), enhanced root `.gitignore`, and created `server/.gitignore`. |
| **Verification & Builds** | `PASS` | `prisma validate`, `prisma generate`, backend build (`tsc`), frontend build (`vite`), and test suite (29/29) all passed cleanly. |

---

## 2. Migration Files Created

A non-destructive, deterministic initial migration was generated using the Prisma Migrate Diff engine (`--from-empty --to-schema-datamodel`):

* **Migration SQL:** [`server/prisma/migrations/20261020000000_init_dwellora/migration.sql`](file:///d:/AAZIRA/AARIZO/server/prisma/migrations/20261020000000_init_dwellora/migration.sql)
  - **Total Lines:** 676 lines of pure PostgreSQL DDL.
  - **Enums (8):** `UserRole`, `EntityStatus`, `PassType`, `PassStatus`, `InvoiceStatus`, `TicketPriority`, `TicketStatus`, `IncidentSeverity`.
  - **Core Tables (26):**
    - Multi-tenant foundation: `societies`, `towers`, `flats`, `users`, `residents`, `family_members`, `vehicles`.
    - Society operations: `staff`, `domestic_workers`, `vendors`, `visitor_passes`, `parcels`, `amenities`, `parking_slots`.
    - Maintenance & Incidents: `maintenance_tickets`, `emergency_incidents`.
    - Financials & Invoicing: `billing_cycles`, `billing_invoices`.
    - **Razorpay Core Tables:**
      - `payments`: Tracks `razorpay_order_id` (unique), `razorpay_payment_id` (unique), `razorpay_signature_verified` (boolean), `amount`, `currency`, `status`, `refund_id`, `refund_amount`, `metadata`.
      - `webhook_events`: Tracks `event_id` (unique), `event_type`, `payload` (jsonb), `status` (for idempotent deduplication).
    - Engagement & Auditing: `notifications`, `audit_logs`, `announcements`, `community_events`, `advertisements`, `entity_records`.
  - **Foreign Keys & Referential Actions:** Strict dependency ordering; constraints applied with `ON DELETE CASCADE` or `ON DELETE SET NULL`.
  - **Indexes:** Composite unique indexes (`flats_tower_id_flat_number_key`), foreign key lookup indexes, and timestamp indices.
* **Lock File:** [`server/prisma/migrations/migration_lock.toml`](file:///d:/AAZIRA/AARIZO/server/prisma/migrations/migration_lock.toml)
  - Configures `provider = "postgresql"` for Prisma Migrate.

---

## 3. Schema Inconsistency Analysis

A line-by-line comparison between `scripts/postgres/01_schema.sql` (legacy raw SQL draft) and `server/prisma/schema.prisma` (active backend ORM) revealed the following structural differences:

| Entity / Concept | Legacy `01_schema.sql` | Active `server/prisma/schema.prisma` | Architectural Resolution |
| :--- | :--- | :--- | :--- |
| **Payment Ledger** | `billing_transactions` table (basic reference string) | `payments` table with full Razorpay lifecycle (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature_verified`, `refund_id`, `status`) | **Prisma schema is canonical.** Express backend (`server/src/index.ts`) queries `prisma.payment`. |
| **Webhook Deduplication** | Absent | Dedicated `webhook_events` table with unique constraint on `event_id` | **Prisma schema is canonical.** Required for webhook idempotency. |
| **Dynamic Document Store** | Absent | `entity_records` table with JSONB `data` and composite index `(collection, societyId)` | **Prisma schema is canonical.** Used as a fallback repository for modular entities. |
| **Community Features** | Absent | `announcements`, `community_events`, `advertisements` tables | **Prisma schema is canonical.** Powers real-time community engagement modules. |
| **Legacy Operational Tables** | Included `attendance`, `child_safety`, `complaints`, `housekeeping_tasks`, `guest_rooms`, `move_requests`, `renovations`, `amc_contracts` | Handled through unified domain services and custom entity records | **Prisma schema is canonical.** Eliminates redundant, unindexed legacy tables. |

---

## 4. Data Preservation & Safety Audit

### 4.1 Search for Existing Uncommitted Data
* A recursive repository scan for `.sql`, `.dump`, `.bak`, `.tar`, and database volumes was performed.
* The only SQL files found are:
  - `scripts/postgres/01_schema.sql` (template DDL)
  - `scripts/postgres/02_rls_policies.sql` (template RLS)
  - `scripts/postgres/03_seed.sql` (demo data with `ON CONFLICT DO NOTHING`)
* No orphan database files or raw binary dumps exist in the repository.

### 4.2 Seed Script Destructive Action Warning
* **Warning in `server/src/seed.ts` (lines 6–30):**
  The script explicitly runs `deleteMany` in reverse dependency order across all tables before inserting demo data:
  ```ts
  await prisma.auditLog.deleteMany({});
  await prisma.payment.deleteMany({});
  ...
  await prisma.society.deleteMany({});
  ```
* **Directive:** `npm run seed` or `tsx src/seed.ts` **MUST NEVER BE RUN IN PRODUCTION**, as it purges all database tables unconditionally.

### 4.3 Safe Baseline Procedure for Pre-Populated Databases
If the client connects to an existing PostgreSQL database containing historical records, follow this procedure before applying migrations:

1. **Take an Immediate Snapshot Backup:**
   ```bash
   pg_dump -h <host> -U <user> -d <database> -Fc -f "dwellora_pre_migration_backup_$(date +%Y%m%d_%H%M%S).dump"
   ```
2. **Introspect Existing Tables (Read-Only):**
   ```bash
   npx prisma db pull --print
   ```
3. **Compare Introspected Schema with `schema.prisma`:**
   Ensure existing table names and column datatypes match `@map` attributes.
4. **Baseline the Initial Migration (Do not re-run DDL over existing tables):**
   ```bash
   npx prisma migrate resolve --applied 20261020000000_init_dwellora --schema server/prisma/schema.prisma
   ```

---

## 5. Security & Secret Exposure Audit

### 5.1 Root Cause & Remediation of `server/.env` Tracking
* **Audit Finding:** `git status` showed `server/.env` was tracked by Git (`M server/.env`) because it had been committed in an earlier development commit before ignore rules were updated.
* **Remediation Actions Executed:**
  1. Untracked `server/.env` from git index without deleting the local file:
     ```bash
     git rm --cached server/.env
     ```
  2. Created [`server/.gitignore`](file:///d:/AAZIRA/AARIZO/server/.gitignore) containing:
     ```
     node_modules/
     dist/
     uploads/
     .env
     .env.*
     *.env
     !.env.example
     ```
  3. Updated root [`.gitignore`](file:///d:/AAZIRA/AARIZO/.gitignore) to recursively cover all nested `.env` paths:
     ```gitignore
     # Environment files & secrets
     .env
     .env.*
     *.env
     **/.env
     **/.env.*
     server/.env
     server/.env.*
     !env.example
     !.env.example
     !**/.env.example
     ```
  4. Verified with `git check-ignore -v server/.env` -> Confirmed ignored by `server/.gitignore`.
  5. Verified no credentials or secret keys are printed in console logs or audit reports.

---

## 6. Verification & Automated Test Evidence

| Command | Working Directory | Result | Output Evidence |
| :--- | :--- | :---: | :--- |
| `npx prisma validate` | `server/` | **PASS** | `The schema at prisma\schema.prisma is valid 🚀` |
| `npm run prisma:generate` | Root / `server/` | **PASS** | `✔ Generated Prisma Client (v6.19.3) to .\node_modules\@prisma\client` |
| `npm --prefix server run build` | `server/` | **PASS** | TypeScript compiler (`tsc`) compiled `dist/` with 0 errors. |
| `npm run build` | Root | **PASS** | Vite v8.2.2 compiled 2,174 modules in 1.04s with 0 errors. |
| `npm test` | Root | **PASS** | 2/2 test suites passed; 29/29 unit & security tests passed. |

---

## 7. Next Steps for Client-Owned Production Deployment

When the client is ready to provision their production cloud environment, execute these steps:

### Phase A: Database Provisioning & Migration Application
1. Provision cloud PostgreSQL (e.g., Supabase, Neon, AWS RDS, Railway, DigitalOcean).
2. Note the production connection string with SSL (`postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require`).
3. Apply the verified initial migration:
   ```bash
   npx prisma migrate deploy --schema server/prisma/schema.prisma
   ```
   *(Note: `prisma migrate deploy` executes pending migrations safely without interactive prompts, resets, or generating shadow databases).*

### Phase B: Production Environment Configuration
1. In the backend hosting dashboard, provide:
   - `DATABASE_URL`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
   - `PORT=5000`
2. In the frontend root `.env`, provide:
   - `VITE_BACKEND_URL=https://<your-deployed-backend-domain>`
   - `VITE_RAZORPAY_KEY_ID=<your-razorpay-key-id>`

### Phase C: Webhook Registration & Final Builds
1. Register webhook in Razorpay Dashboard: `https://<backend-domain>/api/payments/razorpay/webhook`.
2. Build frontend: `npm run build`.
3. Sync and build Android release: `npx cap sync android`.
