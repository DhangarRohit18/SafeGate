# DWELLORA — FINAL DEPLOYMENT READINESS AUDIT REPORT
**Audit Date:** October 20, 2026
**Audited Target:** Dwellora (Smart Community Platform) & Razorpay Payment Integration
**Platform Scope:** React 19 Frontend, Express Backend, Prisma ORM, PostgreSQL, Capacitor Android

---

## 1. Executive Summary

A comprehensive repository and runtime inspection was conducted to assess deployment readiness following the implementation of the core platform and the production-grade Razorpay payment integration.

| Category | Status | Evidence Summary |
| :--- | :---: | :--- |
| **Frontend Web & Mobile App** | `PASS` (Build) / `NOT CONFIGURED` (Prod URL) | React 19 + Vite 8.2 compiles with 0 errors. Unit tests (29/29) pass. Prod API base URL pending root `.env`. |
| **Express Backend Engine** | `PASS` (Code & Types) / `NOT CONFIGURED` (Hosting) | TypeScript compiles with 0 errors (`server/dist/index.js`). Hosting and public HTTPS not yet provisioned. |
| **PostgreSQL Database** | `FAIL` (Connection) | `server/.env` points to `127.0.0.1:5432`. Local TCP port 5432 is down (`TcpTestSucceeded: False`). Managed DB required. |
| **Prisma Migrations** | `NOT CONFIGURED` | `schema.prisma` is complete (21 models), but `server/prisma/migrations` does not exist. Migrations have not run. |
| **Razorpay Payment Pipeline** | `PASS` | Server-side order creation, HMAC-SHA256 signature verification, idempotent atomic invoice settlement verified in code. |
| **Razorpay Webhook Handler** | `PASS` (Code) / `NOT CONFIGURED` (Public HTTPS) | Raw-body HMAC verification & deduplication implemented. Public HTTPS URL and Razorpay dashboard registration pending. |
| **Android Capacitor App** | `PASS` (Assets Synced) / `ACTION REQUIRED` | Cleartext disabled. Must re-build and re-sync once production `VITE_BACKEND_URL` is set. |

---

## 2. Component & Architecture Identification

### 2.1 Frontend Framework & Mobile Shell
* **Web Framework:** React 19.2.8, React Router DOM 7.18.3, Vite 8.2.2, TailwindCSS 4.3.3.
* **Mobile Runtime:** Capacitor 8.5.2 (`@capacitor/android`, `@capacitor/core`).
* **Android Application ID:** `com.aarizo.app` (App Name: `Dwellora`).
* **Web Asset Output Directory:** `dist/` (synced to `android/app/src/main/assets/public`).

### 2.2 Backend Architecture & Entry Point
* **Framework:** Node.js (ES Module) + Express 4.21.2.
* **Entry Point:** `server/src/index.ts` (compiled via `tsc` to `server/dist/index.js`).
* **Realtime Engine:** Server-Sent Events (SSE) via `/api/realtime/stream` + HTML5 BroadcastChannel fallback.
* **Security & Crypto:** Node `crypto.createHmac` + constant-time comparison (`timingSafeCompare` in `server/src/crypto.ts`).

### 2.3 PostgreSQL & Prisma Configuration
* **ORM:** Prisma Client 6.4.1.
* **Prisma Schema:** `server/prisma/schema.prisma` (Datasource: `postgresql`, `url = env("DATABASE_URL")`).
* **Schema Scope:** 21 models, including `Society`, `Tower`, `Flat`, `User`, `Resident`, `BillingCycle`, `BillingInvoice`, `Payment`, `WebhookEvent`, `AuditLog`.
* **Migration Directory:** `server/prisma/migrations` **DOES NOT EXIST**. No Prisma migrations have been created or deployed.
* **Current Connection Setting:** `DATABASE_URL` in `server/.env` configured to `127.0.0.1:5432/aarizo_community`.

---

## 3. Deployment Status Matrix

| Check Item | Status | Verification Evidence |
| :--- | :---: | :--- |
| **Frontend Deployed** | `NOT CONFIGURED` | No production web domain registered in environment files. Builds cleanly to local `dist/`. |
| **Backend Deployed** | `NOT CONFIGURED` | No live public host (e.g., Render, Railway, AWS ECS) found. Configured for `localhost:5000`. |
| **PostgreSQL Deployed** | `FAIL` | Configured to `127.0.0.1:5432`. Port check verified `TcpTestSucceeded: False`. No cloud database attached. |
| **Prisma Migrations Applied** | `NOT CONFIGURED` | `server/prisma/migrations` is absent. Database schema has not been initialized via Prisma Migrate. |
| **Public HTTPS Available** | `NOT CONFIGURED` | Local server runs HTTP only. Public SSL endpoint not yet established. |
| **Razorpay Webhook Registered** | `NOT CONFIGURED` | Cannot register webhook in Razorpay Dashboard without a live, publicly reachable HTTPS URL. |

---

## 4. Environment Variables Audit

> [!IMPORTANT]
> In accordance with security protocols, exact credential values are not printed in this report.

### 4.1 Backend Environment Variables (`server/.env` & Cloud Host Dashboard)
| Variable Name | Purpose | Current Repository State | Production Requirement |
| :--- | :--- | :---: | :--- |
| `PORT` | HTTP port for Express | Present (`5000`) | Set by cloud host or default to `5000` |
| `DATABASE_URL` | PostgreSQL connection URI | Present (Points to `127.0.0.1:5432`) | **Must be updated** to managed cloud PostgreSQL (with `?sslmode=require`) |
| `RAZORPAY_KEY_ID` | Industry Key ID (`rzp_test_...` or `rzp_live_...`) | Present | Store in server environment variables |
| `RAZORPAY_KEY_SECRET` | Industry Key Secret | Present | **Strictly Server-Only**. Never expose to client or Git |
| `RAZORPAY_WEBHOOK_SECRET` | Secret for webhook signature verification | Present | Generated secret matching Razorpay Webhook settings |

### 4.2 Frontend Client Environment Variables (Root `.env` for Vite Build)
| Variable Name | Purpose | Current Repository State | Production Requirement |
| :--- | :--- | :---: | :--- |
| `VITE_BACKEND_URL` | Public base URL of Express backend | **Missing** (Root `.env` absent) | **Must be set** to public backend HTTPS URL (e.g. `https://api.dwellora.com`) |
| `VITE_RAZORPAY_KEY_ID` | Public Key ID for browser checkout popup | Defined in `.env.example` only | **Must be set** in root `.env` matching `RAZORPAY_KEY_ID` |
| `VITE_PUBLIC_LOGO_URL` | Optional HTTPS image for checkout branding | Blank | Optional HTTPS URL or leave blank |
| `VITE_FIREBASE_*` | Firebase client SDK configs | Defaults in code | Set if using production Firebase project |

---

## 5. API Base URL & Production Client Dependency Check

* **File:** `src/services/apiClient.ts` (lines 7–12)
  ```ts
  const API_BASE =
    (import.meta as any).env?.VITE_BACKEND_URL
      ? `${(import.meta as any).env.VITE_BACKEND_URL}/api`
      : (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174')
        ? 'http://localhost:5000/api'
        : '/api');
  ```
* **Evaluation:**
  - On a web browser accessing the app on localhost ports `5173`/`5174`, it defaults to `http://localhost:5000/api`.
  - When deployed on web behind a reverse proxy where `/api` routes to the Express backend, relative `/api` functions correctly.
  - **Critical Mobile Finding:** In the Capacitor Android APK, the app runs from local device storage (`https://localhost`). A relative URL `/api` will resolve to `https://localhost/api`, resulting in a connection failure on mobile devices.
* **Verdict:** `ACTION REQUIRED`. A root `.env` containing `VITE_BACKEND_URL=https://<deployed-backend-domain>` is mandatory prior to creating the production Android build.

---

## 6. Razorpay Integration Verification

### 6.1 Order Creation (`POST /api/payments/razorpay/create-order`) — `PASS`
- **Location:** `server/src/index.ts` (lines 908–1065)
- **Amount Integrity:** Resolves invoice directly from PostgreSQL database (`prisma.billingInvoice.findUnique`). Client-supplied amounts are ignored.
- **Subunit Conversion:** Converts outstanding balance (`totalAmount - paidAmount`) to integer paise (`Math.round(outstanding * 100)`).
- **Validation:** Rejects already `PAID` or `CANCELLED` invoices. Enforces multi-tenant society isolation (`req.societyId`).
- **Gateway Dispatch:** Authenticates via HTTP Basic Auth (`RAZORPAY_KEY_ID:RAZORPAY_KEY_SECRET`) to `https://api.razorpay.com/v1/orders`.
- **Database Tracking:** Persists pending record in `Payment` table (`status: 'PENDING'`, `razorpayOrderId`).

### 6.2 Checkout Signature Verification (`POST /api/payments/razorpay/verify`) — `PASS`
- **Location:** `server/src/index.ts` (lines 1068–1229)
- **Algorithm:** Computes HMAC-SHA256 of `${razorpayOrderId}|${razorpayPaymentId}` with `RAZORPAY_KEY_SECRET`.
- **Timing Safety:** Validates signature using `timingSafeCompare` to prevent timing attacks.
- **Atomic Settlement:** Executes Prisma transaction (`prisma.$transaction`):
  1. Updates `billingInvoice` to `status: 'PAID'`, `paidAmount: totalAmount`, `paymentMode: 'RAZORPAY'`, `paidAt: new Date()`.
  2. Updates `payment` record to `status: 'SUCCESS'`, `razorpayPaymentId`, `razorpaySignatureVerified: true`.
  3. Writes audit entry into `auditLog`.
- **Real-Time Notification:** Broadcasts `PAYMENT_COMPLETED` event via SSE to connected clients.
- **Idempotency:** Checks if invoice is already marked `PAID` and returns HTTP 200 without duplicate balance adjustments.

### 6.3 Webhook Raw-Body Verification & Deduplication — `PASS`
- **Location:** `server/src/index.ts` (lines 20–27, 1404–1557)
- **Raw-Body Preservation:** Captured in Express middleware:
  ```ts
  app.use(express.json({ verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
  ```
- **Signature Verification:** Computes HMAC-SHA256 of `req.rawBody` against `RAZORPAY_WEBHOOK_SECRET` and matches header `X-Razorpay-Signature`.
- **Deduplication:** Queries `prisma.webhookEvent.findUnique({ where: { eventId } })`. If already processed, immediately responds `200 OK` (`status: 'ALREADY_PROCESSED'`).
- **Event Handling:**
  - `payment.captured`: Reconciles invoice and updates `Payment` record atomically; broadcasts SSE.
  - `payment.failed`: Marks `Payment` record as `FAILED` with failure description.
  - `refund.processed`: Marks `Payment` record as `REFUNDED` with refund ID and timestamp.

---

## 7. Webhook Reachability & Registration Check

* **Public HTTPS Reachability:** `NOT CONFIGURED`
  The Express backend is currently running in a local environment. No public DNS or TLS certificate is assigned.
* **Razorpay Dashboard Registration:** `NOT CONFIGURED`
  Razorpay cannot send webhooks to `localhost` or private IP addresses. Webhook registration must be completed in the Razorpay Dashboard after the backend is deployed:
  - **Webhook URL:** `https://<deployed-backend-domain>/api/payments/razorpay/webhook`
  - **Secret:** Must match `RAZORPAY_WEBHOOK_SECRET`
  - **Active Events:** `payment.captured`, `payment.failed`, `refund.processed`

---

## 8. Android Capacitor Mobile App Audit

* **Configuration File:** `capacitor.config.ts`
  - `cleartext: false` (Enforces HTTPS network traffic).
  - `webDir: 'dist'` (Bundles frontend static files).
* **Dependency on Build Time Variables:**
  - `VITE_BACKEND_URL` and `VITE_RAZORPAY_KEY_ID` are inlined into JavaScript bundles during `npm run build`.
  - Android APKs bundle the static build from `android/app/src/main/assets/public`.
* **Confirmation:** **YES, Android requires a new build.**
  Once the production API URL is determined and set in the root `.env`:
  1. `npm run build` must be executed.
  2. `npx cap sync android` must be run to copy assets.
  3. Android Studio / Gradle must build the release APK/AAB (`./gradlew assembleRelease` or `bundleRelease`).

---

## 9. Build & Automated Test Results

All test suites and production build commands were executed in the repository:

| Command | Target | Result | Notes |
| :--- | :--- | :---: | :--- |
| `npm run build` | Frontend Web Bundle | **PASS (0 errors)** | Vite v8.2.2 compiled 2,174 modules in 1.01s. |
| `npm test` | Unit & Security Test Suites | **PASS (29/29)** | Razorpay signature verification & timing-attack tests passed. |
| `npm --prefix server run build` | Express Backend (`tsc`) | **PASS (0 errors)** | `server/dist/` generated cleanly. |
| `npm --prefix functions run build` | Firebase Functions (`tsc`) | **PASS (0 errors)** | Cloud Functions compiled cleanly. |
| `npx cap sync android` | Capacitor Android Sync | **PASS** | Web assets synced to `android/app/src/main/assets/public`. |

---

## 10. Recommended Next Steps

Based on the existing codebase architecture, the following sequential actions are recommended to complete deployment:

### Step 1: Provision Managed PostgreSQL Database
1. Provision a cloud PostgreSQL instance (e.g., Supabase, Neon, AWS RDS, or Railway).
2. Obtain the connection string (with SSL enabled: `?sslmode=require`).
3. Update `DATABASE_URL` in `server/.env`.
4. Run Prisma migration initialization:
   ```bash
   npm --prefix server run prisma:generate
   npx prisma migrate dev --name init_dwellora_production --schema server/prisma/schema.prisma
   ```

### Step 2: Deploy Express Backend
1. Deploy `server/` to a cloud container/node host (e.g., Render, Railway, Vercel Serverless, or AWS).
2. Configure environment variables in the cloud dashboard:
   - `PORT=5000`
   - `DATABASE_URL=<managed-postgres-connection-string>`
   - `RAZORPAY_KEY_ID=<your-industry-key-id>`
   - `RAZORPAY_KEY_SECRET=<your-industry-key-secret>`
   - `RAZORPAY_WEBHOOK_SECRET=<your-generated-webhook-secret>`
3. Verify health check at `https://<your-backend-domain>/api/health`.

### Step 3: Configure Razorpay Webhook in Merchant Dashboard
1. Log into Razorpay Dashboard -> **Settings** -> **Webhooks**.
2. Add Webhook URL: `https://<your-backend-domain>/api/payments/razorpay/webhook`.
3. Enter the `RAZORPAY_WEBHOOK_SECRET`.
4. Enable events: `payment.captured`, `payment.failed`, `refund.processed`.

### Step 4: Configure Frontend Production Environment & Build
1. Create root `.env`:
   ```env
   VITE_BACKEND_URL=https://<your-backend-domain>
   VITE_RAZORPAY_KEY_ID=<your-industry-key-id>
   ```
2. Build frontend: `npm run build`.
3. Deploy web bundle `dist/` to hosting (Vercel, Firebase Hosting, or Cloudflare Pages).

### Step 5: Android Build & Release
1. Sync web assets: `npx cap sync android`.
2. Open Android project: `npx cap open android`.
3. Build signed production APK/AAB in Android Studio.
