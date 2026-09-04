# Phase 2 Authentication & Account Management UX Specification

> **Phase:** Phase 2 — Authentication and Account Management<br>
> **Status:** Implemented Candidate — Pending User Visual Acceptance (Academic Light V2 Visual Acceptance Hold)<br>
> **Functional Status:** Phase 2 functional acceptance complete & verified. Visual integration is candidate pending user acceptance.<br>
> **Approved Visual Direction:** Concept A — Academic Light V2 (`Editorial Academic + Living Illustration + Modern Productivity`)<br>
> **Mascot Integration:** Original Wise Cat (`<WiseCat />`) with 6 active academic states and hero desktop companion scale (256px)

This document defines the authoritative UX, interaction contracts, and security behaviors for all screens, dialogs, and workflows implemented in Phase 2.

---

## 1. Global Authentication UX Standards

1. **Academic Split Layout (Desktop `lg`+):**
   - Left Pane (56%): KnowledgeMark product mark, editorial serif headline, hero Wise Cat mascot companion (256px), concept chips, atmospheric campus line art, and student project attribution.
   - Right Pane (44%): Refined hairline-bordered form surface with top gradient signature highlight, clean whitespace, and accessible form controls.
   - Reusable container: `<AcademicAuthShell />`.
2. **Mobile Adaptation (`< 1024px`):**
   - Single-column, form-first layout.
   - Compact header containing the mini brand mark and mascot.
   - Minimum 44px touch targets; zero horizontal overflow (`max-w-full overflow-x-hidden`).
3. **Focus & Error Management:**
   - Programmatic focus is directed to the first relevant input on mount.
   - On submission failure, focus immediately shifts to the top-level error summary (`role="alert"`).
   - Input errors are linked via `aria-describedby` and feature a subtle one-time shake (`animate-subtle-shake`).
4. **Accessible Form Controls:**
   - Every input field includes an explicit `<label htmlFor="id">`.
   - Credential inputs support clipboard pasting and standard autofill (`autocomplete="email"`, `autocomplete="current-password"`, `autocomplete="new-password"`).
   - Password inputs feature an accessible toggle button with fixed dimensions (`w-9 h-9 flex items-center justify-center`), `aria-pressed`, and zero layout shift (`CLS = 0`).
5. **Motion System & Reduced Motion:**
   - 4-layer motion architecture (`MOTION_INTENSITY = 6 / 10`).
   - Staged entrance sequence on navigation: `Background -> Brand & Headline -> Mascot -> Form Card`.
   - Strict `@media (prefers-reduced-motion: reduce)` support: ambient loops and translation jumps are stopped, preserving static readability and state clarity.

---

## 2. Screen & Dialog Specifications

### Screen 1: User Login (`/login`)
- **Purpose:** Authenticate existing users via first-party Sanctum SPA session cookies.
- **Mascot State:** `welcome` (attentive, friendly posture).
- **Primary Action:** "Sign in" (Primary solid button).
- **Secondary Actions:** "Create an account" (Link to `/register`), "Forgot your password?" (Link to `/forgot-password`).
- **Rate Limit Policy:** Dedicated named limiter `throttle:login` enforcing 5 attempts/minute per normalized identity (email + IP) with HTTP 429 response on boundary violation.
- **Validation Behavior:**
  - Client-side pre-validation verifies non-empty inputs and valid email format.
  - Server-side 401/422 responses display an alert banner: *"Invalid email or password."* without disclosing account existence.

---

### Screen 2: User Registration (`/register`)
- **Purpose:** Onboard new users into the platform.
- **Mascot State:** `reading` (academic focus, reading open notebook).
- **Strict Scope Rule:** Preserves the exact course assignment requirements: **Display Name, Email address, Password, Confirm Password**. No extraneous mandatory fields.
- **Primary Action:** "Create account" (Primary solid button).
- **Secondary Action:** "Already have an account? Sign in" (Link to `/login`).
- **Rate Limit Policy:** Dedicated named limiter `throttle:registration` enforcing 5 attempts/minute per IP with HTTP 429 on boundary violation.
- **Automatic Login Contract:** Successful registration automatically logs the user in via Sanctum SPA session authentication and navigates immediately to the authenticated workspace (`/`).

---

### Screen 3: Forgot Password (`/forgot-password`)
- **Purpose:** Allow users to request a cryptographically signed password reset link.
- **Mascot State:** `verification` (holding academic envelope) transition to `success` on delivery.
- **Primary Action:** "Send reset link" (Primary solid button).
- **Secondary Action:** "Return to login" / "Back to sign in".
- **Rate Limit Policy:** Dedicated named limiter `throttle:forgot-password` enforcing 5 attempts/minute per normalized identity (email + IP).
- **Security Confirmation State:**
  - Displays generic confirmation banner: *"If an account exists for this email, a password reset link has been sent."*
  - Does not leak whether the email address is registered.

---

### Screen 4: Reset Password (`/reset-password`)
- **Purpose:** Accept signed token and set a new account password.
- **Mascot State:** `verification` transition to `success` upon update.
- **Primary Action:** "Reset password" (Primary solid button).
- **Rate Limit Policy:** Dedicated named limiter `throttle:reset-password` enforcing 5 attempts/minute per IP.
- **Session Semantics & Manual Login:**
  - Resets password hash, rotates `remember_token`, logs out the current web session, and invalidates the active request session.
  - Does **NOT** auto-login the user. Displays an explicit success alert and requires manual authentication with the new password.

---

### Screen 5: Email Verification Warning Banner
- **Purpose:** Notify authenticated users when their email address is unverified, without locking them out of reading features.
- **Semantic Tier:** Amber warning semantics (`bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800`), `role="status"`.
- **Content:**
  - Warning icon + message: *"Your email address has not been verified. Please check your inbox or request a new verification email."*
  - Action Button: *"Resend verification email"*.
- **Rate Limit Policy:** Dedicated named limiter `throttle:verification-resend` enforcing 5 attempts/minute per authenticated user.
- **Feedback:** Transitions to emerald success badge: *"A new verification email has been sent to your inbox."*

---

### Screen 6: Authenticated Workspace Shell (`/`)
- **Top Navigation:** Brand badge with lotus-pink accent dot, user initials avatar (`w-8 h-8 rounded-full`), user display name, email, settings shortcut (`/settings/profile`), and "Sign out" button.
- **Hero Card:** Warm student welcome greeting: *"Welcome, {user.display_name}!"* with Wise Cat in `welcome` state and Academic Light badge.
- **Account Info Card:** Displays display name, email, Sanctum authentication type, and email verification status pill.
- **Runtime Diagnostics:** Displays backend API and database connection status with green pulse dots.
- **Phase Boundary Disclaimer:** Clearly labeled note affirming notes and AI modules are scheduled for subsequent milestones.

---

### Screen 7: Account Settings (`/settings/*`)
- **Navigation Tabs:** Profile (`/settings/profile`), Security (`/settings/security`), Preferences (`/settings/preferences`).
- **Mascot State:** `settings` (holding engineering drafting compass/gear badge).
- **Profile:**
  - Avatar management: Circular preview, file picker (JPEG, PNG, WebP ≤ 2MB), upload button, and remove avatar button.
  - Display name input and email input (with re-verification notification if email changes).
- **Security:**
  - Current password, new password (min 8 chars), confirm new password.
  - Session semantics: Updates password hash and regenerates current session ID preventing session fixation.
- **Preferences:**
  - Theme selection (System, Light, Dark) with immediate local state toggle and persistence to backend database.
  - Default note view mode (Grid, List).
