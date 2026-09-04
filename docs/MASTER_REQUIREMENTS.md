# Master Requirements Catalog

This catalog serves as the authoritative, stable reference for all functional, non-functional, security, and operational requirements. Requirements are grouped into distinct families with persistent alphanumeric identifiers.

Initial status of all application features is **PLANNED**. Repository governance baselines established in Phase 1 are **VERIFIED** and frozen. Phase 2 Authentication and Account Management (`ACC-01` through `ACC-09`, `SEC-06`) is **VERIFIED** and frozen. Phase 3 Core Notes Management (`NOTE-01` through `NOTE-05`) is **VERIFIED** and frozen. Phase 4 Organization, Discovery & Media (`NOTE-06`, `NOTE-07`, `NOTE-08`, `LABEL-01` through `LABEL-03`) is **IN PROGRESS**.

---

## 1. Requirement Families Summary

| Family | Domain | Target Phase |
| :--- | :--- | :--- |
| **ACC-*** | Authentication, Account Management & Profiles | Phase 2 |
| **NOTE-*** | Note Lifecycle, Views, Autosave & Core Operations | Phase 3 |
| **LABEL-*** | Categorization, Tagging & Filtering | Phase 4 |
| **SHARE-*** | Password Protection, Permissions & Sharing | Phase 5 |
| **RT-*** | Real-Time Collaboration & WebSockets | Phase 6 |
| **AI-*** | Summarization, Grounded Q&A & Source Attribution | Phase 7 |
| **PWA-*** | Offline Storage, Service Worker & Synchronization | Phase 8 |
| **UX-*** | Responsive Design, Accessibility & Theming | Phase 9 |
| **SEC-*** | Cryptography, Authorization, Validation & Security Hardening | Phases 2–9 |
| **DEPLOY-*** | Docker Orchestration, CI/CD & Deployment | Phase 1 & 10 |
| **GIT-*** | Academic Contribution Cadence & Repository Governance | Phase 1–10 |

---

## 2. Account & Identity Management (ACC)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ACC-01** | Mandatory Authentication | Application access to private data requires authenticated session; unauthenticated requests redirect to login. | Phase 2 | **VERIFIED** |
| **ACC-02** | User Registration | Registration UI accepts strictly email, display name, password, and password confirmation; user is automatically logged in upon successful registration. | Phase 2 | **VERIFIED** |
| **ACC-03** | Secure Password Hashing | Passwords MUST be hashed with bcrypt through Laravel's secure hashing facility; plaintext is never stored or logged, bcrypt verification succeeds, and hashes are never exposed. | Phase 2 | **VERIFIED** |
| **ACC-04** | Activation Email & Grace Period | System dispatches an account activation email; unverified users can use the app but display a persistent verification warning banner. | Phase 2 | **VERIFIED** |
| **ACC-05** | Profile Management | Authenticated user can view and edit profile details, including display name and custom avatar image upload. | Phase 2 | **VERIFIED** |
| **ACC-06** | Change Password | Authenticated user can change password after providing and validating their current password. | Phase 2 | **VERIFIED** |
| **ACC-07** | User Preferences | User can select and persist UI preferences (e.g., default view mode, dark/light theme) across sessions. | Phase 2 | **VERIFIED** |
| **ACC-08** | Password Recovery | User can request password reset via email reset link OR secure OTP flow. After successful reset, user MUST NOT be automatically authenticated and must log in manually. | Phase 2 | **VERIFIED** |
| **ACC-09** | SPA Session Auth (Sanctum) | Secure first-party cookie/session authentication with CSRF protection, avoiding unencrypted token storage in localStorage. | Phase 2 | **VERIFIED** |

---

## 3. Core Notes Management (NOTE)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NOTE-01** | Dual View Layouts | Notes dashboard renders in a responsive Grid view by default, with an instant toggle to List view. | Phase 3 | **VERIFIED** |
| **NOTE-02** | Shared Interaction Model | Note creation and note editing share an intuitive, unified modal or inline workspace interface. | Phase 3 | **VERIFIED** |
| **NOTE-03** | Title & Content Fields | Every note requires a title and body content as initial user-facing fields; changes validate correctly on save. | Phase 3 | **VERIFIED** |
| **NOTE-04** | Debounced Autosave | Active edits to title and content are automatically persisted to backend with debounce, showing visual sync status. | Phase 3 | **VERIFIED** |
| **NOTE-05** | Safe Deletion | Deleting a note requires explicit user confirmation before the deletion action is executed. (Trash / soft delete is not a mandatory product requirement). | Phase 3 | **VERIFIED** |
| **NOTE-06** | Note Pinning | User can toggle pin status on notes; pinned notes always appear in a dedicated top section with a visual pin indicator. | Phase 4 | PLANNED |
| **NOTE-07** | Live Search | Live debounced search (~300 ms guidance) filtering by note title and note content without full-page reloads. | Phase 4 | PLANNED |
| **NOTE-08** | File Attachments | User can attach permitted file types (images, PDFs) to notes with backend size and MIME-type validation. | Phase 4 | PLANNED |

---

## 4. Labels & Categorization (LABEL)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **LABEL-01** | Label CRUD | User can create, view, rename, and delete custom organizational labels. | Phase 4 | PLANNED |
| **LABEL-02** | Many-to-Many Association | A note can possess multiple labels, and a label can belong to multiple notes via a pivot table. | Phase 4 | PLANNED |
| **LABEL-03** | Label Filtering | Clicking a label or selecting multiple labels filters the note list to matching notes immediately. | Phase 4 | PLANNED |

---

## 5. Sharing & Protected Notes (SHARE)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SHARE-01** | Per-Note Password Protection | Owner can lock specific sensitive notes with an individual password; note card visually indicates locked state and content is obscured until unlocked. | Phase 5 | PLANNED |
| **SHARE-02** | Server-Side Unlock Verification | Unlocking a protected note validates password on backend before returning note body; client never holds unverified secrets. | Phase 5 | PLANNED |
| **SHARE-03** | User-to-User Sharing | Note owner can grant explicit access to other registered users identified by their email address. | Phase 5 | PLANNED |
| **SHARE-04** | Granular Permissions | Sharing supports read-only (`read`) and read-write (`edit`) permissions strictly enforced server-side. | Phase 5 | PLANNED |
| **SHARE-05** | Shared-Note Metadata | Recipient-facing shared-note section exposes permission level, identity of the user who shared the note, sharing timestamp, and visual shared indicator. | Phase 5 | PLANNED |
| **SHARE-06** | Access Revocation (Optional) | OPTIONAL / FUTURE ENHANCEMENT: Owner can view collaborator list and alter or revoke sharing permissions. Not required for Phase 5 PASS. | Phase 5 | OPTIONAL |

---

## 6. Real-Time Collaboration (RT)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **RT-01** | Real-Time Sync (Reverb) | Authorized collaborators editing the same shared note receive updates through Laravel Reverb WebSockets and Laravel Echo in real time. | Phase 6 | PLANNED |
| **RT-02** | Active Collaborators (Optional) | OPTIONAL / FUTURE ENHANCEMENT: Visual collaborator presence pills or live cursors. (The rubric requires realtime editing updates, not presence indicators). | Phase 6 | OPTIONAL |
| **RT-03** | Concurrent Edit Integrity | Implementation concern: Backend maintains data integrity during concurrent edits. | Phase 6 | PLANNED |

---

## 7. AI Capabilities (AI)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AI-01** | Provider-Neutral Abstraction | Backend communicates with AI capabilities through an abstracted interface, decoupling app logic from LLM vendors. | Phase 7 | PLANNED |
| **AI-02** | Note Summarization | User can request concise automated summary of a note's text content on demand. | Phase 7 | PLANNED |
| **AI-03** | Grounded Q&A Over Notes | User can pose natural-language queries across their accessible notes repository. | Phase 7 | PLANNED |
| **AI-04** | Source Note Attribution | AI Q&A responses explicitly cite and link back to the specific source notes used to construct the answer. | Phase 7 | PLANNED |
| **AI-05** | Authorization Scoping | AI service queries are strictly scoped to notes owned by or shared with the requesting user; no data leakage across accounts. | Phase 7 | PLANNED |

---

## 8. Progressive Web App & Offline Support (PWA)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **PWA-01** | Web App Manifest & Installability | Application registers a valid PWA manifest and service worker, allowing installation as a standalone desktop/mobile app. | Phase 8 | PLANNED |
| **PWA-02** | Client-Side Storage (IndexedDB) | Cached notes and metadata persist in browser JavaScript database (IndexedDB) for offline access. (Dexie is a candidate library for Phase 8, not a permanent requirement). | Phase 8 | PLANNED |
| **PWA-03** | Offline Create & Edit | User can create and edit notes while offline; changes are staged locally in an offline queue. | Phase 8 | PLANNED |
| **PWA-04** | Automatic Synchronization | When connectivity resumes, staged offline changes sync to backend API with server verification. | Phase 8 | PLANNED |

---

## 9. Security & Governance (SEC)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Server-Side Authorization | Every API endpoint strictly validates user authorization via Laravel Policies/Gates; UI hiding is never deemed security. | Phase 2–9 | PLANNED |
| **SEC-02** | IDOR Protection | Insecure Direct Object Reference vulnerabilities are prevented by validating ownership/membership on every resource ID. | Phase 2–9 | PLANNED |
| **SEC-03** | Input Validation & Sanitization | All request inputs are validated via Laravel FormRequests; HTML/Markdown content is sanitized to prevent XSS. | Phase 2–9 | PLANNED |
| **SEC-04** | Secure File Uploads | Uploaded attachments are strictly validated for MIME type, extension, and size, and stored outside public web roots. | Phase 4 | PLANNED |
| **SEC-05** | Secret Hygiene | No API keys, passwords, or production secrets exist in Git; `.env.example` provides documentation templates only. | Phase 1 | **VERIFIED** |
| **SEC-06** | CORS & CSRF Hardening | Explicit CORS domain restrictions and Sanctum CSRF protection enabled across all state-changing endpoints. | Phase 2 | **VERIFIED** |

---

## 10. User Experience & Responsive Design (UX)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UX-01** | Cross-Device Responsive Layout | UI adapts seamlessly across smartphone (mobile), tablet, and desktop viewports using Tailwind CSS. | Phase 9 | PLANNED |
| **UX-02** | Accessibility (a11y) Standards | Keyboard navigability, semantic HTML, ARIA attributes, and WCAG AA contrast compliance across all major components. | Phase 9 | PLANNED |
| **UX-03** | State & Feedback Indicators | Clear visual indicators for note states (pinned, shared, password-protected/locked), autosave status, and error toast alerts. | Phase 3–9 | PLANNED |

---

## 11. Deployment, DevOps & Git Governance (DEPLOY / GIT)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DEPLOY-01** | Custom Docker Compose | Reproducible multi-container Docker Compose setup for backend, frontend, and database (MySQL 8) in Phase 1; Reverb added in Phase 6; production hardening in Phase 10. | Phase 1 / 6 / 10 | PLANNED |
| **DEPLOY-02** | Automated CI Pipeline | Initial GitHub Actions CI foundation established in Phase 1 (lint, typecheck, baseline tests); production/deployment verification finalized in Phase 10. | Phase 1 & 10 | PLANNED |
| **DEPLOY-03** | Public Demonstration Target | Fully deployed, publicly accessible demo instance matching submission specifications. | Phase 10 | PLANNED |
| **GIT-01** | Baseline Repository Audit | Non-destructive audit of local environment, toolchains, ports, and remote Git status. | Phase 1 Step 1 | **VERIFIED** |
| **GIT-02** | Governance & Spec Bootstrap | Repository governance, specification documentation, and baseline configurations established in clean initial commit. | Phase 1 Step 2 | **VERIFIED** |
| **GIT-03** | Academic Cadence Compliance | Verified history of $\ge 2$ meaningful commits per member per week across 4 consecutive calendar weeks. | Phase 1–10 | PLANNED |
