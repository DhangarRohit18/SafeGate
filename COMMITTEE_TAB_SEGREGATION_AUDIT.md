# Committee Portal Tab Segregation & Contextual IA Audit Report

## Executive Overview
The Committee Portal (`/committee/*`) has been architecturally segregated into 4 primary, independent top-level workspaces: **Home**, **Approvals**, **Reports**, and **Profile**.

Each workspace has its own contextual page title, page subtitle, active top/bottom navigation highlighting, statistics, filters, content cards, FAB actions, and data separation.

---

## 1. Information Architecture & Workspaces Matrix

| Workspace | Route | Header Title & Subtitle | Active Nav | Sub-Nav / Filter Row | Core Content & Purpose | FAB Behavior |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Home** | `/committee` | **Management Committee**<br>*Executive approvals, finances & governance* | `Home` | `[Overview] [Financials] [Compliance] [Health] [Governance]` | Concise operational snapshot, pending request summary, financial/compliance attention cards, recent activity stream. | **Active** (Launches Committee Quick Action Hub) |
| **Approvals** | `/committee/approvals` | **Approvals**<br>*Review and process requests requiring committee decisions.* | `Approvals` | Category Filters: `[All Requests] [NOC Certificate] [Tenant Onboarding] [Renovation Permit]...` | Dedicated decision-making workspace with request cards, search, status filter, and Review/Approve/Reject actions. | **Active** (Launches Approval Quick Actions) |
| **Reports** | `/committee/reports` | **Committee Reports**<br>*Financial, compliance & governance insights.* | `Reports` | Period Preset Filters: `[This Month] [Last Quarter] [Year to Date]` | Financial collections summary, request SLA performance analytics, statutory audit compliance index, Export AGM report. | **Hidden** (Reports are for viewing/analysis) |
| **Profile** | `/committee/profile` | **Committee Profile**<br>*Manage your committee identity and account.* | `Profile` | None | Dedicated Committee Member Profile (Hero, Personal Info, Committee Role & Portfolio, RBAC capabilities, Identity Locker, Security settings). | **Hidden** (Profile contains no creation actions) |

---

## 2. Global FAB & Role-Aware Quick Action System

The circular `+` button in `MobileAppShell` is a **role-aware quick action launcher** connected to `QuickActionSheet.tsx`.

### Role & Context Matrix:
- **Resident**: `Invite Visitor`, `Vehicle Pass`, `Book Amenity`, `Raise Request / Ticket`, `Child Exit Pass`, `Emergency SOS`
- **Guard**: `Scan & Verify Pass`, `Child Exit Verification`, `Staff Gate Terminal`, `Parcel Entry`, `Emergency Command`
- **Secretary / Admin**: `Process Requests & NOCs`, `Housekeeping Ops`, `Maintenance Work Orders`, `Add Resident / Unit`, `Log Society Expense`
- **Committee**: `Review Request Approvals`, `Approve Expense Payouts`, `Upload Governance Doc`
- **Vendor**: `Manage Service Jobs`, `Upload Compliance Docs`
- **Facility Manager**: `Create Maintenance Task`, `Track AMC Contracts`
- **Super Admin**: `Register Housing Society`
- **Reports & Profile Pages**: **FAB automatically hidden.**

---

## 3. Route & Deep-Linking Verification
- Direct navigation to `/committee`, `/committee/approvals`, `/committee/reports`, `/committee/profile` loads the exact dedicated view.
- Browser refresh preserves the current route and active tab state.
- Forward and back browser navigation operates smoothly.

---

## 4. Technical & Build Results
- **`npm run lint`**: 0 Errors, 191 warnings (clean).
- **`npm test`**: 10/10 Jest Security assertions PASSED.
- **`npm run build`**: Vite production build succeeded (`dist/assets/index-CEmwuT8R.js`).
- **`npm run server:build`**: Backend TypeScript build succeeded.
- **`npx cap sync android`**: Capacitor Android assets synced cleanly.
