# Global FAB Functionality & Role-Aware Action System Audit

## Executive Summary
The circular `+` Floating Action Button (FAB) across Safegate has been upgraded into a **Role-Aware & Context-Aware Quick Action Hub**.

Rather than executing a single hardcoded action or navigating randomly, clicking the `+` button opens a polished, animated **Safegate Quick Action Sheet** (`src/components/mobile/QuickActionSheet.tsx`) tailored to the authenticated role and active portal context.

---

## 1. Complete Portal Action Matrix

| Portal | Role | Available FAB Quick Actions | Permission Check | Backend Source | FAB Visibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Resident** | `resident` | Invite Visitor, Vehicle Pass, Book Amenity, Raise Request, Child Exit Pass, Emergency SOS | `resident` RBAC | PostgreSQL API | **Visible** |
| **Guard / Security** | `guard` | Scan & Verify Pass, Child Exit Verification, Staff Gate Terminal, Parcel Entry, Emergency Command | `guard` RBAC | PostgreSQL API | **Visible** |
| **Secretary / Admin** | `secretary` / `admin` | Process Requests & NOCs, Housekeeping Ops, Maintenance Work Orders, Add Resident / Unit, Log Society Expense | `secretary` / `admin` RBAC | PostgreSQL API | **Visible** |
| **Committee** | `committee` | Review Request Approvals, Approve Expense Payouts, Upload Governance Doc | `committee` RBAC | PostgreSQL API | **Visible on Home & Approvals; Hidden on Reports & Profile** |
| **Vendor** | `vendor` | Manage Service Jobs, Upload Compliance Docs | `vendor` RBAC | PostgreSQL API | **Visible** |
| **Facility Manager** | `facility_manager` | Create Maintenance Task, Track AMC Contracts | `facility_manager` RBAC | PostgreSQL API | **Visible** |
| **Service Provider / Staff** | `vendor` / `resident` | View Assigned Tasks | `staff` RBAC | PostgreSQL API | **Visible** |
| **Domestic Worker** | `vendor` / `resident` | View Today's Schedule | `domestic` RBAC | PostgreSQL API | **Hidden if no create action** |
| **Super Admin** | `admin` | Register Housing Society | `admin` RBAC | PostgreSQL API | **Visible** |

---

## 2. Contextual Hiding Rules
- **Reports Pages (`*/reports`)**: FAB is automatically suppressed (reading/analytics context).
- **Profile Pages (`*/profile`)**: FAB is automatically suppressed (account management context).

---

## 3. UI/UX Design System Compliance
- **Container**: White elevated surface, 24px top border radius, soft backdrop blur (`rgba(8, 25, 36, 0.55)`).
- **Typography & Color**: `#083B56` Deep Navy headings, `#F06543` Coral primary icons, `#059669` Green badges.
- **Touch Targets**: Minimum 52px height per action row, smooth touch scaling (`scale-[0.99]`), light/medium haptic feedback.

---

## 4. Verification Results
- **`npm run lint`**: 0 Errors, 191 warnings.
- **`npm test`**: 10/10 Jest Security assertions PASSED.
- **`npm run build`**: Vite production build succeeded.
- **`npm run server:build`**: Backend build succeeded.
- **`npx cap sync android`**: Capacitor Android assets synced cleanly.
