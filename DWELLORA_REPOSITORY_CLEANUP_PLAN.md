# DWELLORA — REPOSITORY CLEANUP & SUBMISSION POLISH PLAN
**Date:** October 20, 2026
**Auditor:** Antigravity AI Engineering Assistant
**Objective:** Clean, professional, client-ready source repository without breaking any runtime functionality, build pipelines, or test suites.

---

## 1. Classification of Repository Items

### Category 1: Required for Production (DO NOT TOUCH)
* `src/` — Complete React 19 application frontend (all components, pages, hooks, contexts, domain hubs, types, utils, styles).
* `public/` — Active Dwellora branding assets, icons, manifest, favicons (`dwellora-logo*.png`, `dwellora-symbol*.png`, `favicon.*`, `manifest.json`, `icon-192.png`, `icon-512.png`).
* `src/assets/dwellora-*` — Internal asset imports for Dwellora logos and symbols.
* `server/src/` — Express backend entry point (`index.ts`), Prisma client (`prisma.ts`), cryptographic utilities (`crypto.ts`).
* `server/prisma/schema.prisma` — Active production PostgreSQL schema (26 models, 8 enums).
* `server/prisma/migrations/` — Version-controlled migration history (`20261020000000_init_dwellora`, `migration_lock.toml`).
* `server/package.json` & `server/package-lock.json` — Backend dependencies and deterministic lockfile.
* `package.json` & `package-lock.json` — Root dependencies and deterministic lockfile.
* `capacitor.config.ts`, `capacitor.config.json`, `android/` — Native mobile container, Android Studio project, and Android manifest/resources.
* `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` — Core build configuration.
* `firestore.rules`, `storage.rules`, `firebase.json` — Cloud security rules and infrastructure definitions.
* `vercel.json` — Deployment routing for static frontend and server entry.

### Category 2: Required for Development & Testing (PRESERVE)
* `tests/` — Automated test suites (`security.test.ts`, `razorpay.test.ts`).
* `jest.config.cjs`, `tsconfig.test.json` — Test runner configuration.
* `scripts/postgres/` — PostgreSQL DDL, RLS policies, and non-destructive seed templates (`01_schema.sql`, `02_rls_policies.sql`, `03_seed.sql`, `migrate.ts`).
* `docker-compose.yml`, `Dockerfile` — Local containerized development stack.
* `functions/` — Firebase Cloud Functions fallback module (`package.json`, `tsconfig.json`, `src/index.ts`).
* `server/src/seed.ts`, `scripts/seed/seed.ts` — Local development database seeders.

### Category 3: Required for Client Handover & Deployment Documentation (PRESERVE & ENHANCE)
* `README.md` — Primary client guide, architecture overview, setup, and run instructions.
* `DWELLORA_CLIENT_HANDOVER.md` — Complete master handover document with credentials checklist, deployment roadmap, and operating runbooks.
* `DWELLORA_DEPLOYMENT_READINESS.md` — Comprehensive pre-deployment readiness report.
* `DWELLORA_DATABASE_DEPLOYMENT_PREPARATION.md` — Database preparation, migration analysis, and safe baseline procedure report.
* `RAZORPAY_INTEGRATION_PLAN.md` & `RAZORPAY_INTEGRATION_AUDIT.md` — Detailed payment gateway architecture and verification documentation.
* `.env.example`, `server/.env.example` — Sanitized environment variable templates.

### Category 4: Obsolete or Duplicated Candidates (VERIFY FOR CLEANUP)
* `docs/done/` — Complete duplicate directory containing 55 identical files already present in `docs/`.
* `src/assets/react.svg`, `src/assets/vite.svg` — Default Vite template boilerplate assets (unreferenced).
* `src/assets/hero.png` — Unreferenced stock image.
* `build_output.txt` — Leftover build log from terminal debugging.
* `aarizo-debug.apk` — Superseded 9.3MB debug APK with outdated pre-rebrand name (`dwellora-debug.apk` is the active build).
* Root clutter (23 historical task reports from intermediate development checkpoints).

### Category 5: Safe to Remove (CONFIRMED AFTER DEPENDENCY AUDIT)
1. `build_output.txt` (local temporary log).
2. `aarizo-debug.apk` (superseded binary; `dwellora-debug.apk` retained).
3. `src/assets/react.svg` (zero imports in codebase).
4. `src/assets/vite.svg` (zero imports in codebase).
5. `src/assets/hero.png` (zero imports in codebase).
6. `docs/done/` (100% duplicate directory of `docs/`).
7. Consolidate/archive root intermediate sprint reports into `docs/archive/` to give the repository root an uncluttered, enterprise-grade appearance.

---

## 2. Execution Strategy

1. **Step 1:** Safely remove confirmed temporary, boilerplate, and duplicate artifacts.
2. **Step 2:** Relocate historical sprint audit reports from repository root to `docs/archive/`, keeping only master handover and deployment reports at the top level.
3. **Step 3:** Verify Git status and `.gitignore` integrity.
4. **Step 4:** Polish `README.md` and create master `DWELLORA_CLIENT_HANDOVER.md`.
5. **Step 5:** Run full validation test battery (`npm run build`, `npm --prefix server run build`, `npm test`, `npx cap sync android`).
6. **Step 6:** Generate `DWELLORA_REPOSITORY_CLEANUP_REPORT.md`.
