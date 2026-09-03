# Security Baseline and Governance Rules

This document establishes the binding security standards and vulnerability defense principles for the Collaborative Intelligent Note Management Web Application.

> **Status Notice:** This policy governs all current and future implementation phases. No application code currently exists.

---

## 1. Authentication and Credential Protection

- **Secure Native Hashing:** Passwords must always be hashed using Laravel's native hashing facilities (`Hash::make()`) backed by `bcrypt` (minimum work factor 12) or `argon2id`.
- **Zero Plaintext Storage:** Plaintext passwords, temporary tokens, or plaintext per-note passwords must never be stored in the database, caches, or logs.
- **Password Complexity:** User registration and password change forms must enforce strong password criteria (minimum 8 characters, mixed case, numbers, symbols).
- **Session Security:** First-party SPA authentication relies on Laravel Sanctum using `HttpOnly`, `SameSite=Lax` (or `Strict`), and `Secure` session cookies. Bearer tokens must not be stored in browser `localStorage` or `sessionStorage`.

---

## 2. Server-Side Authorization & Access Control

- **Mandatory Server Authorization:** Every API endpoint handling private resources must evaluate authorization policies (`Gate` / `Policy`).
- **Client Hiding is NOT Security:** Hiding buttons, links, or navigation options in the React UI is strictly a UX affordance. The backend must independently reject unauthorized requests with HTTP `403 Forbidden`.
- **IDOR (Insecure Direct Object Reference) Defense:** When accessing resources by ID (e.g., `GET /api/notes/{id}`), the backend must explicitly verify that the authenticated user is either the resource owner or an authorized collaborator.
- **Sharing Permissions Enforcement:** The backend must differentiate and strictly enforce read (`view`) versus read-write (`edit`) permissions for shared notes. Read-only collaborators attempting `PUT`, `PATCH`, or `DELETE` mutations must be rejected.
- **Protected Notes Enforcement:** For password-protected notes, the backend must verify the note-specific password before decrypting or returning the note content. The client must never receive locked note bodies until authenticated against that note.

---

## 3. Input Validation and Sanitization

- **Strict Request Validation:** Every incoming API request payload must be validated via dedicated Laravel `FormRequest` classes with exhaustive rule definitions.
- **XSS (Cross-Site Scripting) Defense:** Note titles and content containing Markdown or HTML must be sanitized using standard sanitization libraries (e.g., HTMLPurifier on backend or DOMPurify on frontend) before rendering.
- **File Upload Safeguards:**
  - File attachments must undergo strict MIME-type and extension validation (allowlist only).
  - Maximum upload size strictly limited (10 MB).
  - Uploaded files must be renamed to cryptographically random filenames (UUIDs) upon ingestion.
  - Stored files must reside outside the public web root (`storage/app/attachments`) and be served only via authenticated streaming controllers.

---

## 4. Secret Hygiene and Environment Isolation

- **Zero Secrets in Version Control:** Never commit `.env` files, production database credentials, encryption keys (`APP_KEY`), SMTP passwords, or AI API tokens to Git.
- **Environment Templates Only:** `.env.example` must contain placeholder keys with empty or safe dummy defaults.
- **Production Debug Prohibition:** `APP_DEBUG` must be set to `false` in any non-local or public demonstration environment.
- **Error Obfuscation:** API error responses in production environments must return sanitized error messages; stack traces, SQL queries, and internal system paths must never be exposed to clients.

---

## 5. Network, CORS & CSRF Hardening

- **Explicit CORS Configuration:** `config/cors.php` must strictly restrict `allowed_origins` to known frontend application hosts (e.g., `http://localhost:5173`). Wildcard `*` origins with credentials enabled are forbidden.
- **CSRF Token Verification:** All state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) routed through Sanctum session cookies must validate the `X-XSRF-TOKEN` header.
- **Rate Limiting:** Authentication endpoints (login, registration, password reset, note unlock attempts) must be throttled via Laravel rate limiters to defend against credential stuffing and brute-force attacks.
