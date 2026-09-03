# Master Requirements Catalog

This catalog serves as the authoritative, stable reference for all functional, non-functional, security, and operational requirements. Requirements are grouped into distinct families with persistent alphanumeric identifiers.

Initial status of all application features is **PLANNED**. Only repository governance items established in Phase 1 Step 2 may be marked with their verified baseline state.

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
| **ACC-01** | Mandatory Authentication | Application access to private data requires authenticated session; unauthenticated requests redirect to login. | Phase 2 | PLANNED |
| **ACC-02** | User Registration | Guest can register with valid email, name, and strong password; automatic login occurs upon successful registration. | Phase 2 | PLANNED |
| **ACC-03** | Secure Password Hashing | Passwords are automatically hashed via Laravel's native bcrypt or argon2id; plaintext is never stored or logged. | Phase 2 | PLANNED |
| **ACC-04** | Activation Email & Grace Period | System dispatches an account activation email; unverified users can use the app but display a persistent verification warning banner. | Phase 2 | PLANNED |
| **ACC-05** | Profile Management | Authenticated user can view and edit profile details, including display name and custom avatar image upload. | Phase 2 | PLANNED |
| **ACC-06** | Change Password | Authenticated user can change password after providing and validating their current password. | Phase 2 | PLANNED |
| **ACC-07** | User Preferences | User can select and persist UI preferences (e.g., default view mode, dark/light theme) across sessions. | Phase 2 | PLANNED |
| **ACC-08** | Password Recovery | User can request password reset via email magic link or secure OTP token. | Phase 2 | PLANNED |
| **ACC-09** | SPA Session Auth (Sanctum) | Secure first-party cookie/session authentication with CSRF protection, avoiding unencrypted token storage in localStorage. | Phase 2 | PLANNED |

---

## 3. Core Notes Management (NOTE)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NOTE-01** | Dual View Layouts | Notes dashboard renders in a responsive Grid view by default, with an instant toggle to List view. | Phase 3 | PLANNED |
| **NOTE-02** | Shared Interaction Model | Note creation and note editing share an intuitive, unified modal or inline workspace interface. | Phase 3 | PLANNED |
| **NOTE-03** | Title & Content Fields | Every note requires a title and body content as initial user-facing fields; changes validate correctly on save. | Phase 3 | PLANNED |
| **NOTE-04** | Debounced Autosave | Active edits to title and content are automatically persisted to backend with debounce, showing visual sync status. | Phase 3 | PLANNED |
| **NOTE-05** | Safe Deletion | Deleting a note requires explicit user confirmation and moves note to trash or performs soft delete. | Phase 3 | PLANNED |
| **NOTE-06** | Note Pinning | User can toggle pin status on notes; pinned notes always appear in a dedicated top section above unpinned notes. | Phase 4 | PLANNED |
| **NOTE-07** | Live Search | Instant client-debounced search filtering by note title and text content without full-page reloads. | Phase 4 | PLANNED |
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
| **SHARE-01** | Per-Note Password Protection | Owner can lock specific sensitive notes with an individual password; content is obfuscated until unlocked. | Phase 5 | PLANNED |
| **SHARE-02** | Server-Side Unlock Verification | Unlocking a protected note validates password on backend before returning note body; client never holds encrypted secrets. | Phase 5 | PLANNED |
| **SHARE-03** | User-to-User Sharing | Note owner can grant explicit access to other registered users identified by their email address. | Phase 5 | PLANNED |
| **SHARE-04** | Granular Permissions | Sharing supports read-only (`view`) and read-write (`edit`) permissions enforced server-side. | Phase 5 | PLANNED |
| **SHARE-05** | Shared-Note Metadata | Notes list and editor display clear visual indicators for ownership, collaborator badges, and permission levels. | Phase 5 | PLANNED |
| **SHARE-06** | Access Revocation | Owner can view collaborator list and instantly revoke or alter permissions for any collaborator. | Phase 5 | PLANNED |

---

## 6. Real-Time Collaboration (RT)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **RT-01** | Real-Time Sync (Reverb) | Note updates by one collaborator broadcast via Laravel Reverb WebSockets and update clients via Laravel Echo. | Phase 6 | PLANNED |
| **RT-02** | Presence & Active Collaborators | Users viewing or editing a shared note see real-time presence indicators (avatars/cursors) of other active users. | Phase 6 | PLANNED |
| **RT-03** | Conflict Resolution Strategy | Concurrent edits maintain data integrity with deterministic last-write-wins or structured merge mechanics. | Phase 6 | PLANNED |

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
| **PWA-02** | Client-Side Storage (IndexedDB) | Cached notes and metadata are stored in browser IndexedDB (via Dexie abstraction) for rapid offline access. | Phase 8 | PLANNED |
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
| **SEC-06** | CORS & CSRF Hardening | Explicit CORS domain restrictions and Sanctum CSRF protection enabled across all state-changing endpoints. | Phase 2 | PLANNED |

---

## 10. User Experience & Responsive Design (UX)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UX-01** | Cross-Device Responsive Layout | UI adapts seamlessly across smartphone (mobile), tablet, and desktop viewports using Tailwind CSS. | Phase 9 | PLANNED |
| **UX-02** | Accessibility (a11y) Standards | Keyboard navigability, semantic HTML, ARIA attributes, and WCAG AA contrast compliance across all major components. | Phase 9 | PLANNED |
| **UX-03** | State & Feedback Indicators | Clear visual loading skeletons, autosave indicators, error toast alerts, and modal confirmation states. | Phase 9 | PLANNED |

---

## 11. Deployment, DevOps & Git Governance (DEPLOY / GIT)

| ID | Requirement | Acceptance Intent | Target Phase | Status |
| :--- | :--- | :--- | :--- | :--- |
| **DEPLOY-01** | Custom Docker Compose | Reproducible multi-container Docker Compose setup for backend, frontend, database, and websocket services. | Phase 1 / 10 | PLANNED |
| **DEPLOY-02** | Automated CI Pipeline | GitHub Actions workflow executing linter, frontend typecheck/test, and backend PHPUnit suite on pull requests. | Phase 10 | PLANNED |
| **DEPLOY-03** | Public Demonstration Target | Fully deployed, publicly accessible demo instance matching submission specifications. | Phase 10 | PLANNED |
| **GIT-01** | Baseline Repository Audit | Non-destructive audit of local environment, toolchains, ports, and remote Git status. | Phase 1 Step 1 | **VERIFIED** |
| **GIT-02** | Governance & Spec Bootstrap | Repository governance, specification documentation, and baseline configurations established in clean initial commit. | Phase 1 Step 2 | **IN PROGRESS** |
| **GIT-03** | Academic Cadence Compliance | Verified history of $\ge 2$ meaningful commits per member per week across 4 consecutive calendar weeks. | Phase 1–10 | PLANNED |
