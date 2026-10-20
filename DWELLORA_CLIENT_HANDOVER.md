# DWELLORA — CLIENT HANDOVER & PRODUCTION OPERATIONS MANUAL
**Document Version:** 1.0.0 (Production Release Candidate)
**Date:** October 20, 2026
**Product:** Dwellora (Smart Residential Society Operating System & CommunityOS)
**Client Organization:** Client / Society Management Body

---

## 1. Executive Product Overview

**Dwellora** is an enterprise-grade gated community management and smart society operating platform. It bridges residents, security gates, society administrators, committee executives, facility managers, vendors, and maintenance personnel into a unified, real-time ecosystem.

### Core Capabilities
* **Gate Access & Visitor Terminal**: Instant QR code visitor pre-approvals, delivery logs, cab entry passes, and gate security scanner.
* **Child & Family Safety**: Minor escort verification, child gate exit restrictions, emergency SOS broadcast command center.
* **Billing & Razorpay Financials**: Maintenance cycle generation, automated invoicing, cryptographic Razorpay checkout (UPI, Card, NetBanking), instant digital receipts, and idempotent webhook reconciliation.
* **Facility & Asset Operations**: Amenity booking with slot capacity management, maintenance ticketing, vendor onboarding, and facility audit logs.
* **Multi-Tenant Architecture**: Complete logical tenant isolation by `societyId` with role-based access control (RBAC).

---

## 2. System Architecture & Technology Stack

```
                          ┌────────────────────────┐
                          │   React 19 Frontend    │
                          │ (Web & Android Mobile) │
                          └───────────┬────────────┘
                                      │
                 REST API + Context Headers (x-society-id, x-user-id)
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │  Express 4.21 Backend  │
                          │   (server/src/index)   │
                          └───────────┬────────────┘
                                      │
                         Prisma Client 6.4 (ORM)
                                      │
                                      ▼
                          ┌────────────────────────┐
                          │  PostgreSQL 16 Database│
                          │   (26 Tables, RLS)     │
                          └────────────────────────┘
```

| Layer | Technologies | Deployment Target |
| :--- | :--- | :--- |
| **Frontend Web** | React 19.2, Vite 8.2, TailwindCSS 4.3, Lucide React | Vercel, Firebase Hosting, or Cloudflare Pages |
| **Mobile App** | Capacitor 8.5 (Android Native Container) | Google Play Store / Internal Enterprise APK |
| **Backend API** | Node.js (ESM), Express 4.21, TypeScript | Cloud Container (Render, Railway, AWS ECS, or Vercel Node) |
| **Database & ORM**| PostgreSQL 16+, Prisma ORM 6.4 | Managed PostgreSQL (Supabase, Neon, AWS RDS, Railway) |
| **Payment Gateway**| Razorpay (Standard Checkout API, Webhooks) | Razorpay Merchant Account |
| **Realtime Engine**| Server-Sent Events (SSE) + BroadcastChannel | Embedded in Express Backend |

---

## 3. Repository Directory Structure

```
d:\AAZIRA\AARIZO/
├── android/                         # Capacitor native Android Studio project
├── dist/                            # Production web build bundle (HTML/JS/CSS)
├── docs/                            # Architecture documentation & forensic audits
│   └── archive/                     # Historical sprint audit reports
├── public/                          # Public branding assets (Dwellora icons, favicon, manifest)
├── scripts/                         # Database initialization & Docker migration scripts
│   └── postgres/                    # PostgreSQL DDL, RLS policies, and seed SQL
├── server/                          # Production Express backend
│   ├── dist/                        # Compiled backend JavaScript
│   ├── prisma/                      # Database schema and migration history
│   │   ├── migrations/              # Version-controlled migrations
│   │   │   ├── 20261020000000_init_dwellora/
│   │   │   │   └── migration.sql    # Canonical initial PostgreSQL DDL
│   │   │   └── migration_lock.toml  # Prisma provider lock (postgresql)
│   │   └── schema.prisma            # Canonical Prisma Schema (26 models, 8 enums)
│   ├── src/                         # Server source (index.ts, prisma.ts, crypto.ts, seed.ts)
│   ├── .env.example                 # Sanitized backend environment template
│   └── package.json                 # Backend dependencies (express, cors, dotenv, prisma)
├── src/                             # React 19 frontend application
│   ├── assets/                      # Application logo and symbol images
│   ├── components/                  # Shared UI components, modals, and layouts
│   ├── context/                     # React Context providers (AuthContext, etc.)
│   ├── domains/                     # Domain modules (parking, payments, requests, safety, etc.)
│   ├── pages/                       # Role dashboards (resident, guard, secretary, etc.)
│   ├── services/                    # API clients (apiClient.ts, RazorpayService.ts, realtime)
│   └── styles/                      # Global styles, Tailwind CSS, and color tokens
├── tests/                           # Jest test suite (cryptography, security, settlement)
├── .env.example                     # Sanitized frontend environment template
├── .gitignore                       # Git exclusion rules (secrets, build outputs, node_modules)
├── capacitor.config.ts              # Capacitor mobile app configuration
├── docker-compose.yml               # Local container stack configuration
├── Dockerfile                       # Multi-stage production container build
├── package.json                     # Root project manifest & automation scripts
└── README.md                        # Master repository overview
```

---

## 4. Environment Variables & Secret Configuration

> [!CAUTION]
> Never commit actual `.env` files to source control. Use environment templates with placeholder keys only.

### 4.1 Backend Secrets (`server/.env` & Cloud Host Dashboard)
| Variable Name | Required Value Description | Sensitivity |
| :--- | :--- | :--- |
| `PORT` | Listening port (e.g., `5000`) | Non-Sensitive |
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require`) | **Secret** |
| `RAZORPAY_KEY_ID` | Industry Key ID from Razorpay Dashboard (`rzp_live_...` or `rzp_test_...`) | Public |
| `RAZORPAY_KEY_SECRET` | Industry Key Secret from Razorpay Dashboard | **Strict Secret** |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook secret configured in Razorpay Webhooks | **Strict Secret** |

### 4.2 Frontend Public Variables (Root `.env` for Vite Build)
| Variable Name | Required Value Description | Sensitivity |
| :--- | :--- | :--- |
| `VITE_BACKEND_URL` | Public HTTPS URL of the deployed Express backend (`https://api.dwellora.com`) | Public |
| `VITE_RAZORPAY_KEY_ID` | Matches backend `RAZORPAY_KEY_ID` (enables frontend checkout popup) | Public |
| `VITE_PUBLIC_LOGO_URL` | Optional HTTPS URL of society or Dwellora logo displayed in checkout popup | Public |

---

## 5. Step-by-Step Production Deployment Runbook

### Step 1: Provision Managed PostgreSQL
1. Create a PostgreSQL instance on a cloud provider (Supabase, Neon, AWS RDS, Railway, or DigitalOcean).
2. Ensure network access is allowed and SSL is enforced (`sslmode=require`).
3. Note the connection URI.

### Step 2: Apply Database Migrations
On your deployment workstation or CI/CD runner:
```bash
# Generate the Prisma client
npm run prisma:generate

# Apply the version-controlled initial migration safely
npx prisma migrate deploy --schema server/prisma/schema.prisma
```
*(Note: `prisma migrate deploy` executes pending migrations non-destructively without interactive prompts or data resets).*

### Step 3: Deploy the Express Backend
1. Deploy `server/` to your cloud container or Node.js hosting service (Render, Railway, AWS ECS, or Heroku).
2. Set all backend environment variables (`DATABASE_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PORT`).
3. Verify server health check endpoint:
   ```bash
   curl https://<your-backend-domain>/api/health
   # Expected response: {"status":"UP","engine":"Node.js + Express + Prisma + PostgreSQL",...}
   ```

### Step 4: Configure Razorpay Webhook
1. Log into your Razorpay Merchant Dashboard -> **Settings** -> **Webhooks**.
2. Click **Add New Webhook**.
3. **Webhook URL**: `https://<your-backend-domain>/api/payments/razorpay/webhook`
4. **Secret**: Enter the exact string used in `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events**: Check `payment.captured`, `payment.failed`, `refund.processed`.
6. Save and verify webhook status shows active.

### Step 5: Build & Deploy Frontend Web Application
1. Configure root `.env`:
   ```env
   VITE_BACKEND_URL=https://<your-backend-domain>
   VITE_RAZORPAY_KEY_ID=rzp_live_your_actual_key_id
   ```
2. Build optimized production bundle:
   ```bash
   npm run build
   ```
3. Deploy `dist/` to your static web hosting provider (Vercel, Firebase Hosting, or Cloudflare Pages).

### Step 6: Generate Android Release Build
1. Synchronize the newly compiled web bundle into the native Android container:
   ```bash
   npx cap sync android
   ```
2. Open Android Studio:
   ```bash
   npx cap open android
   ```
3. In Android Studio:
   - Select **Build** -> **Generate Signed Bundle / APK**.
   - Choose your client release keystore.
   - Build `release` APK or AAB bundle for Google Play Store upload.

---

## 6. Security & Compliance Checklist

* [x] **No Secrets in Git**: `server/.env` untracked from Git; root `.gitignore` and `server/.gitignore` enforce exclusion.
* [x] **Constant-Time Verification**: Razorpay checkout and webhook signatures verified via `crypto.timingSafeCompare`.
* [x] **Server-Authoritative Pricing**: Frontend invoice payable amounts are never trusted; amounts are calculated server-side from PostgreSQL records.
* [x] **Idempotent Webhooks**: All webhook events deduplicated via `webhook_events` table before processing.
* [x] **Android Cleartext Disabled**: Android network security enforces HTTPS traffic only (`cleartext: false` in `capacitor.config.ts`).
* [x] **Strict Tenant Isolation**: All database queries enforce society isolation via `societyId`.

---

## 7. Canonical Role Credentials & Seed Data

For staging and initial client testing, standard demo accounts with all 7 canonical roles are available in `scripts/postgres/03_seed.sql`:

| Role | Name | Phone / Login Identifier | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **Resident** | Sarvesh Kulkarni | `+919876543210` | Tower B · Flat 1204 |
| **Security Guard** | Officer R. Singh | `+919123456789` | Gate #1 North Terminal |
| **Secretary** | Mayuri Udar | `+919820012345` | Tower A · Flat 101 |
| **Committee Member**| Rajesh Mehta | `+919900112233` | Tower A · Flat 201 |
| **Facility Manager** | Suresh Patil | `+919811223344` | Facility Operations Desk |
| **Vendor** | Priya Facility Care | `+919844556677` | Authorized Service Desk |
| **Super Admin** | Platform Admin | `+919800000001` | Global Multi-Society Root |

---

## 8. Client Support & Maintenance Contacts

For technical queries, infrastructure handover assistance, or security disclosures, refer to the client handover team and repository documentation.
