# Dwellora — Smart Residential Society Operating System

**Dwellora** is a comprehensive, enterprise-grade residential society management, security, and operations platform. Designed for modern gated communities, it seamlessly connects residents, security guards, society administrators, committee members, facility managers, vendors, and service personnel through role-tailored portals and real-time operations.

---

## 🚀 Key Features & Capabilities

- **Visitor & Gate Access Control**:
  - Digital visitor pre-approvals & instant pass generation.
  - High-speed QR code scanning for gate security.
  - Multi-tier entry verification (Passcode, QR, Gatekeeper Approval).
  - Complete check-in/check-out audit trails.

- **Child & Family Safety Management**:
  - Integrated family member registry with pre-linked child profiles.
  - Escort verification and gate exit approvals for minors.
  - Instant SOS & Emergency Broadcast Command Center.

- **Financials & Billing Management**:
  - Automated maintenance invoice generation.
  - Digital payment gateway integration with instant receipt generation.
  - Financial dashboards for society treasurers and committee members.

- **Facility & Asset Maintenance**:
  - Amenity booking system with real-time capacity control.
  - AMC contract tracking and equipment maintenance schedules.
  - Housekeeping and staff shift management.

- **Role-Based Portals**:
  - **Resident Portal**: Gate passes, amenity bookings, bills, SOS, community marketplace, and service requests.
  - **Security Guard Terminal**: High-visibility, touch-first gate verification, delivery logging, and visitor control with strict data minimization for privacy.
  - **Society Secretary / Admin**: Complete society management, resident rosters, staff directory, financial audits, and compliance.
  - **Committee Dashboard**: Governance, financial health overviews, approval workflows, and audit logs.
  - **Facility Manager Portal**: AMC tracking, utility monitoring, maintenance tasks, and shift logs.
  - **Vendor Portal**: Service listings, job management, and onboarding vault.

- **Real-Time Synchronization**:
  - Instant push/socket event dispatch across security gates, resident mobile devices, and admin dashboards without manual refreshes.

---

## 🛠 Technology Stack

### Frontend & Mobile
- **Core Framework**: React 19 + TypeScript + Vite
- **Styling**: TailwindCSS & Custom Design System (Dwellora Palette)
- **Icons & UI**: Lucide React, Custom Mobile Shell
- **Mobile Runtime**: Capacitor 7 (Android Native Container)

### Backend & Database
- **API Server**: Node.js + Express + TypeScript
- **ORM**: Prisma ORM
- **Database**: PostgreSQL
- **Real-time Engine**: WebSocket / SSE Event Pipeline

## 💳 Razorpay Payment Integration

Dwellora includes a production-grade, end-to-end Razorpay payment module:
- **Server-Authoritative Order Creation**: Client payable amounts are never trusted; the backend resolves amounts directly from authorized database invoices in PostgreSQL.
- **Cryptographic Signature Verification**: HMAC-SHA256 signature verification executed with constant-time comparison (`timingSafeCompare`) preventing timing attacks.
- **Atomic Database Settlement**: PostgreSQL transactions (`prisma.$transaction`) ensure invoice status, payment ledger, and audit log entries are updated atomically.
- **Idempotent Webhook Engine**: Preserves raw request bytes for `X-Razorpay-Signature` validation, deduplicating deliveries via `WebhookEvent` table to prevent duplicate accounting entries.
- **Capacitor Android Native Support**: Supports web checkout and Android WebView without exposing API secrets or private keys in client code or native assets.

### Endpoints
- `POST /api/payments/razorpay/create-order` — Create order from server-resolved invoice.
- `POST /api/payments/razorpay/verify` — Verify checkout payment cryptographically and settle invoice.
- `GET /api/payments/status/:orderId` — Query trusted server-side payment status.
- `POST /api/payments/razorpay/webhook` — Public webhook receiver with raw body validation and deduplication.
- `POST /api/payments/razorpay/refund` — Admin-authorized refund endpoint.
- `GET /api/payments` — Role-scoped payment history query.

---

## 🔒 Security & Privacy Engineering

- **Strict Role-Based Access Control (RBAC)**: All endpoints and UI routes enforce server-validated role permissions.
- **Guard Data Minimization**: Security guards receive only necessary operational data at the gate (no access to private resident emails, phone numbers, or full profiles).
- **Secure Authentication Lifecycle**: Session token validation with automatic background resume handling and protected-route isolation.

---

## 💻 Getting Started Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **PostgreSQL**: Local instance or cloud database

### 1. Repository Installation
```bash
git clone https://github.com/Sarveshk-2006/SafeGate.git
cd SafeGate
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` in the root and `/server` directories:
```bash
cp .env.example .env
```
Provide the required environment variables:
- `DATABASE_URL`: PostgreSQL connection string (e.g. `postgresql://user:password@localhost:5432/dwellora`)
- `PORT`: Express server port (Default: `5000`)
- `JWT_SECRET`: Secret key for JWT token signing

### 3. Run Database Migrations
```bash
# Generate the Prisma Client
npm run prisma:generate

# Apply production migrations
npx prisma migrate deploy --schema server/prisma/schema.prisma
```

### 4. Start Development Servers
Start backend API server (Express + Prisma on port 5000):
```bash
npm run server:dev
```
In a separate terminal, start frontend Vite dev server:
```bash
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 📖 Deployment & Client Handover Documentation

Comprehensive deployment, database migration, and operations guides are available in the repository:
- **[DWELLORA_CLIENT_HANDOVER.md](file:///d:/AAZIRA/AARIZO/DWELLORA_CLIENT_HANDOVER.md)** — Master Client Operations & Production Handover Manual.
- **[DWELLORA_DEPLOYMENT_READINESS.md](file:///d:/AAZIRA/AARIZO/DWELLORA_DEPLOYMENT_READINESS.md)** — Pre-Deployment Technical Readiness Audit.
- **[DWELLORA_DATABASE_DEPLOYMENT_PREPARATION.md](file:///d:/AAZIRA/AARIZO/DWELLORA_DATABASE_DEPLOYMENT_PREPARATION.md)** — Database Architecture, Schema Migration & Safety Plan.
- **[RAZORPAY_INTEGRATION_PLAN.md](file:///d:/AAZIRA/AARIZO/RAZORPAY_INTEGRATION_PLAN.md)** — Payment Gateway Architectural Blueprint.

---

## 📱 Building the Native Android APK

Dwellora is fully configured for native Android compilation using Capacitor.

```bash
# 1. Build Web Assets
npm run build

# 2. Sync Assets to Android Native Project
npx cap sync android

# 3. Build Debug Android APK via Gradle
cd android
./gradlew.bat assembleDebug
```
The compiled APK will be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 🧪 Testing & Code Quality

```bash
# Run Linter
npm run lint

# Run Unit & Security Test Suite
npm test

# Production Build Verification
npm run build
```

---

## 📄 License

Internal Proprietary Codebase — All Rights Reserved.
