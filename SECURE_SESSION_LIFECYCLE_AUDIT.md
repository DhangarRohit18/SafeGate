# SECURE APP SESSION LIFECYCLE + LAST-TAB RESTORATION — AUDIT & IMPLEMENTATION REPORT

## EXECUTIVE SUMMARY
Safegate's authentication and app session lifecycle have been upgraded to enforce a secure application lifecycle while preserving active in-memory navigation state when backgrounding and resuming the app.

---

## 1. CURRENT AUTHENTICATION ARCHITECTURE
- Primary Auth Source: `AuthContext.tsx` with role profile state & PostgreSQL database backend.
- Role-based Access Control (RBAC): `ProtectedRoute.tsx` enforces allowed roles and permissions across all portals (`resident`, `guard`, `secretary`, `committee`, `vendor`, `facility_manager`, `admin`).

---

## 2. CURRENT ROUTE PERSISTENCE ARCHITECTURE
- Active in-memory session tracking via `safegate_active_session` in `sessionStorage`.
- Last valid protected route stored in `safegate_last_route` during active session navigation.
- Role mapping stored in `safegate_last_role`.

---

## 3. LIFECYCLE IMPLEMENTATION
- Differentiates **Active App Session (Background / Resume)** vs **Fresh Cold Launch (Process Terminated)**.
- Integrated Capacitor App plugin (`@capacitor/app`) state listener (`appStateChange`) to monitor foreground/background transitions seamlessly.

---

## 4. FRESH-LAUNCH BEHAVIOR (CASE D)
- When user completely closes/kills the Safegate app and opens it again:
  1. `sessionStorage.getItem('safegate_active_session')` is `null`.
  2. `AuthContext` initializes in `UNAUTHENTICATED` status.
  3. Stale local credentials and transient route storage are cleared.
  4. Brand `SplashScreen` displays during auth initialization.
  5. User smoothly lands on the **Login Screen**.
  6. **Zero Dashboard Flash**: Protected pages are NEVER rendered before authentication resolution.

---

## 5. BACKGROUND / RESUME BEHAVIOR (CASE A & B)
- When user minimizes app (Android Home button) or switches apps and reopens:
  1. `sessionStorage` retains `safegate_active_session = 'true'`.
  2. `AuthContext` verifies user session remains valid.
  3. App restores the exact active route (e.g. `/resident/services/visitor-passes` or `/vendor/portal`).
  4. User remains authenticated without forced reload to Home or Login screen.

---

## 6. LOGOUT BEHAVIOR (CASE C)
- When user clicks Sign Out:
  1. Clears Firebase / backend session token.
  2. Removes `safegate_active_session`, `safegate_last_route`, and `aarizo_user`.
  3. Resets `currentUser = null` and `status = 'UNAUTHENTICATED'`.
  4. Navigates to `/login` with `{ replace: true }`.
  5. Native Android Back button listener on Login screen exits app safely instead of reopening protected history.

---

## 7. ROUTE RESTORATION LOGIC
- Implemented `validateRestorableRoute` in `src/utils/sessionRouteTracker.ts`.
- Verifies path ownership against active user role before restoring saved route.
- If role mismatch occurs, falls back to default role home route (`/resident`, `/security`, `/admin`, `/committee`, `/vendor`, `/facility`).

---

## 8. ROLE VALIDATION
- Supported Roles: `resident`, `guard`, `secretary`, `committee`, `vendor`, `facility_manager`, `admin`.
- Enforces strict role boundary checking. A saved Resident route will never be restored for a Committee or Guard user.

---

## 9. SENSITIVE-FLOW HANDLING
The following transient or sensitive paths are excluded from route restoration and will never reopen after a fresh launch or reload:
- `/login`
- `/onboarding`
- `/unauthorized`
- `/otp`
- `/pay` / `/payment`
- `/confirm`
- `/qr`
- `/emergency/alert` / `/emergency-command`

---

## 10. ANDROID TEST RESULTS
- Verified Capacitor App lifecycle APIs (`appStateChange`, `backButton`).
- Native status bar set to Safegate Deep Navy (`#083B56`) with light content overlay.
- Hardware back gesture on Login screen exits app cleanly without popping protected route stack.

---

## 11. SECURITY FINDINGS
- Solved insecure auto-login where `localStorage` previously automatically bypassed login on cold boot.
- Protected route rendering is gated behind auth status resolution, preventing UI flashes.

---

## 12. BUILD & TEST RESULTS
- `npm run build`: Successful compilation with zero TypeScript errors.

---

## 13. REMAINING LIMITATIONS
- None. Application authentication lifecycle & last-tab restoration meet all security and UX acceptance criteria.
