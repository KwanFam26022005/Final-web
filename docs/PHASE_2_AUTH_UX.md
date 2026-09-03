# Phase 2 Authentication & Account Management UX Specification

> **Phase:** Phase 2 — Authentication and Account Management<br>
> **Status:** Specification Freeze (Design Gate)<br>
> **Implementation State:** NOT STARTED (Design contract only)

This document defines the authoritative UX and interaction contracts for all screens, dialogs, and workflows scheduled for implementation in Phase 2.

---

## 1. Global Authentication UX Standards

1. **Focus Management:**
   - On initial page render, programmatic focus is automatically transferred to the first relevant input field.
   - On form submission failure, focus immediately shifts to the top-level error summary (`role="alert"`), allowing screen readers and keyboard users to perceive validation errors instantly.
2. **Accessible Form Layout:**
   - Every input field includes a visible, programmatically linked `<label htmlFor="id">`.
   - Error messages are placed directly beneath their respective inputs, rendered with distinct red text and an alert icon, and linked via `aria-describedby`.
   - Credential inputs explicitly support password manager autofill and clipboard pasting (`autocomplete="email"`, `autocomplete="current-password"`, `autocomplete="new-password"`).
3. **Async State Representation:**
   - During API transmission, submit buttons display an inline SVG spinner, render `aria-busy="true"`, and transition to disabled.
   - All form inputs are disabled during submission to prevent mid-flight race conditions.
   - Button dimensions remain locked during loading to prevent Cumulative Layout Shift (CLS = 0).

---

## 2. Screen & Dialog Specifications

### Screen 1: User Login (`/login`)
- **Purpose:** Authenticate existing users into their private note workspace.
- **Primary Action:** "Log in" (Primary solid button).
- **Secondary Actions:** "Create an account" (Link to `/register`), "Forgot password?" (Link to `/forgot-password`).
- **Fields:**
  1. `email` (Type: `email`, `autocomplete="email"`, required, valid email syntax).
  2. `password` (Type: `password`, with visibility toggle button, `autocomplete="current-password"`, required).
- **Validation Behavior:**
  - Client-side pre-validation verifies non-empty inputs and valid email format on submit.
  - Server-side 401/422 responses display an alert banner: *"Invalid email or password."* without revealing whether the email exists.
- **Mobile Behavior (375px):** Full-viewport card, 100% width inputs, minimum 44px touch targets for buttons and visibility toggles.
- **Desktop Behavior (1024px+):** Centered card (`max-w-md`), subtle border and shadow, generous padding (`p-8`).

---

### Screen 2: User Registration (`/register`)
- **Purpose:** Onboard new users into the platform.
- **Strict Scope Rule:** Preserves the exact course assignment requirements: **Email, Display Name, Password, Password Confirmation**. No extraneous mandatory fields (e.g., phone, address, company) may be introduced.
- **Primary Action:** "Create account" (Primary solid button).
- **Secondary Action:** "Already have an account? Log in" (Link to `/login`).
- **Fields:**
  1. `name` (Display Name, text, required, min 2 chars, max 255 chars, `autocomplete="name"`).
  2. `email` (Email Address, type: `email`, required, RFC-compliant format, `autocomplete="email"`).
  3. `password` (Password, type: `password`, with visibility toggle, min 8 chars, `autocomplete="new-password"`).
  4. `password_confirmation` (Confirm Password, type: `password`, must match `password`).
- **Validation Behavior:**
  - Client-side validation catches empty fields, short passwords, and confirmation mismatches on blur or submit.
  - Server-side 422 responses render specific field error messages (e.g., *"The email has already been taken."*) adjacent to the offending input.
- **Success State:** Transitions to the authenticated workspace or shows the unverified email warning banner.

---

### Screen 3: Forgot Password (`/forgot-password`)
- **Purpose:** Allow users to request a password reset link when credentials are lost.
- **Primary Action:** "Send reset link" (Primary solid button).
- **Secondary Action:** "Back to log in" (Link back to `/login`).
- **Fields:**
  1. `email` (Type: `email`, required, `autocomplete="email"`).
- **Success State:**
  - Displays an informative, positive confirmation panel: *"If an account exists for this email, a password reset link has been sent."*
  - Preserves security by not disclosing whether the account was registered.
- **Failure State:** Handles network timeouts or rate-limiting (HTTP 429) gracefully with a clear banner message.

---

### Screen 4: Reset Password (`/reset-password`)
- **Purpose:** Accept a cryptographically secure token from an email link and update the account password.
- **Primary Action:** "Reset password" (Primary solid button).
- **Secondary Action:** "Return to log in".
- **Fields:**
  1. `email` (Read-only or prefilled from URL token query parameter).
  2. `password` (New Password, min 8 chars, visibility toggle, `autocomplete="new-password"`).
  3. `password_confirmation` (Confirm New Password, must match new password).
- **Failure State:** If token is expired or invalid, displays an error alert with an action button: *"This reset link has expired. Request a new link"*.
- **Success State:** Displays success confirmation and auto-redirects to `/login` after 3 seconds, or provides an immediate "Proceed to Log in" button.

---

### Screen 5: Email Verification Warning Banner
- **Purpose:** Notify authenticated users when their registered email address has not yet been verified, without completely locking them out of essential features.
- **Location:** Prominent non-modal sticky banner pinned directly beneath the main navigation header across the application.
- **Content:**
  - Icon: Amber warning triangle (`Lucide AlertTriangle`).
  - Message: *"Your email address has not been verified. Please check your inbox or request a new verification email."*
  - Action Button: *"Resend verification email"* (Compact secondary button).
- **States:**
  - Default: Warning banner visible.
  - Resending: Spinner inside the resend button with `aria-busy="true"`.
  - Resent: Success alert replaces the action: *"A new verification email has been sent to your inbox."*

---

### Screen 6: Account Profile Settings (`/settings/profile`)
- **Purpose:** View and update personal account information.
- **Primary Action:** "Save changes" (Primary button).
- **Fields:**
  1. `email` (Account email address; indicates verification badge next to the input).
  2. `name` (Display Name; editable text input).
- **Validation Behavior:** Immediate inline feedback if name is cleared or exceeds maximum length.
- **Success State:** Toast notification: *"Profile updated successfully."* with subtle green border highlight on the form container.

---

### Screen 7: Avatar Management (`/settings/profile#avatar`)
- **Purpose:** Manage user profile picture and fallback avatar representation.
- **Primary Action:** "Upload avatar" (File picker accepting `image/jpeg`, `image/png`, `image/webp`, max 2MB).
- **Secondary Action:** "Remove avatar" (Danger text button, reverts to generated initials fallback).
- **UI Presentation:**
  - Circular avatar preview (64px mobile, 80px desktop).
  - Shows current uploaded photo or 2-letter uppercase initials on a slate background.
  - Drag-and-drop target zone or direct file upload button.
- **Validation & Error Handling:**
  - Rejects oversized files (> 2MB) before upload with an inline error: *"Image size must be under 2MB."*
  - Rejects unsupported MIME types (e.g., SVG or executable files).

---

### Screen 8: Change Password (`/settings/security`)
- **Purpose:** Securely update user credentials while authenticated.
- **Primary Action:** "Update password" (Primary button).
- **Fields:**
  1. `current_password` (Type: `password`, required for authorization, visibility toggle).
  2. `new_password` (Type: `password`, min 8 chars, visibility toggle).
  3. `new_password_confirmation` (Type: `password`, must match `new_password`).
- **Validation Behavior:**
  - Client validates that `new_password` matches `new_password_confirmation` and differs from `current_password`.
  - Server 422 errors (e.g., incorrect current password) render an inline error under `current_password`.
- **Success State:** Form fields reset to empty, and a persistent success banner or toast confirms: *"Password updated successfully."*
