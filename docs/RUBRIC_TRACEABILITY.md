# Project Rubric and Requirement Traceability Matrix

This matrix establishes end-to-end traceability between project requirements, target phases, verification tests, demonstration evidence, requirement classifications, and current realization status.

### Requirement Classifications:
- **MANDATORY COURSE REQUIREMENT:** Core rubric item required for academic course grading and project completion.
- **TECHNICAL SUPPORTING REQUIREMENT:** Architectural, operational, or infrastructure foundation required to support mandatory features.
- **OPTIONAL / FUTURE ENHANCEMENT:** Value-add capability that is not required for phase pass or course grading criteria.

### Status Definitions:
- **PLANNED:** Requirement is formally specified; no implementation code or verified test yet exists.
- **IN_PROGRESS:** Active implementation or verification is underway.
- **VERIFIED:** Implementation is complete and validated with executable test evidence.

---

## Traceability Matrix

| Req ID | Target Phase | Requirement Type | Implementation Scope | Expected Automated Test | Expected Demo Evidence | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **GIT-01** | Phase 1 (Step 1) | MANDATORY COURSE REQUIREMENT | Baseline Environment Audit | CLI audit tool calls | Baseline audit output report matching host specs | **VERIFIED** |
| **GIT-02** | Phase 1 (Step 2/2R) | MANDATORY COURSE REQUIREMENT | Repository Governance & Alignment | Git status & tree inspection | Clean initial & remediation commits pushed to `main` | **VERIFIED** |
| **GIT-03** | Phase 1–10 | MANDATORY COURSE REQUIREMENT | Git Contribution Cadence | Git log cadence audit | Commit graph with $\ge 2$ commits/week/member over 4 weeks | PLANNED |
| **DEPLOY-01** | Phase 1 / 6 / 10 | TECHNICAL SUPPORTING REQUIREMENT | Docker Compose Orchestration | `docker-compose config` / validation | Core containerized stack (frontend, backend, MySQL) in Phase 1; Reverb in Phase 6 | PLANNED |
| **DEPLOY-02** | Phase 1 & 10 | TECHNICAL SUPPORTING REQUIREMENT | Automated CI Pipeline | GitHub Actions workflow execution | Phase 1 CI baseline (lint/tests); Phase 10 production verification | PLANNED |
| **DEPLOY-03** | Phase 10 | MANDATORY COURSE REQUIREMENT | Public Demonstration Target | Deployment health check probe | Public URL returns 200 OK with fully operational features | PLANNED |
| **ACC-01** | Phase 2 | MANDATORY COURSE REQUIREMENT | Mandatory Session Auth | `AuthTest` (401 on unauth) & Playwright Test 1 | Unauthenticated navigation redirects immediately to `/login` | **VERIFIED** |
| **ACC-02** | Phase 2 | MANDATORY COURSE REQUIREMENT | User Registration & Auto-Login | `AuthTest` & Playwright Test 2 | Registration form (email, name, password, confirmation) auto-logs in | **VERIFIED** |
| **ACC-03** | Phase 2 | MANDATORY COURSE REQUIREMENT | Secure Password Hashing | `AuthTest` & `PasswordChangeTest` | Database inspection proves bcrypt (`$2y$`); plaintext never stored | **VERIFIED** |
| **ACC-04** | Phase 2 | MANDATORY COURSE REQUIREMENT | Email Activation & Warning Banner | `EmailVerificationTest` & Playwright Test 2 | Activation email sent; unverified users see persistent warning banner | **VERIFIED** |
| **ACC-05** | Phase 2 | MANDATORY COURSE REQUIREMENT | Profile & Avatar Upload | `ProfileTest` & `AvatarTest` & Playwright Test 3 | User edits display name and uploads avatar image with initials fallback | **VERIFIED** |
| **ACC-06** | Phase 2 | MANDATORY COURSE REQUIREMENT | Change Password | `PasswordChangeTest` & Playwright Test 4 | Password changed successfully requiring current password check; session regenerated | **VERIFIED** |
| **ACC-07** | Phase 2 | MANDATORY COURSE REQUIREMENT | User Preferences Persistence | `PreferenceTest` & Playwright Test 5 | User toggles theme/view mode; preference persists across reload | **VERIFIED** |
| **ACC-08** | Phase 2 | MANDATORY COURSE REQUIREMENT | Password Recovery Flow | `PasswordRecoveryTest` & Playwright Test 6 | Reset via link; user is NOT auto-logged in and logs in manually | **VERIFIED** |
| **ACC-09** | Phase 2 | TECHNICAL SUPPORTING REQUIREMENT | Sanctum SPA Cookie Auth | `AuthTest` & Playwright hermetic runs | Network inspection verifies HTTP-only cookie session and CSRF token | **VERIFIED** |
| **NOTE-01** | Phase 3 | MANDATORY COURSE REQUIREMENT | Grid / List View Toggle | Vitest `NotesViewToggle.test.tsx` & Playwright Test 11 | Dashboard renders Grid by default; toggle switches cleanly to List; preference persists | **VERIFIED** |
| **NOTE-02** | Phase 3 | MANDATORY COURSE REQUIREMENT | Shared Interaction Model | Vitest `NoteEditor.test.tsx` & Playwright Test 11 | Identical unified editor interaction model for creating and editing without primary save button | **VERIFIED** |
| **NOTE-03** | Phase 3 | MANDATORY COURSE REQUIREMENT | Required Title & Content | PHPUnit `NoteTest.php` & Vitest `NoteEditor.test.tsx` | Validation errors displayed; empty fields rejected; title and content fields persisted | **VERIFIED** |
| **NOTE-04** | Phase 3 | MANDATORY COURSE REQUIREMENT | Debounced Autosave | Vitest `useAutosave.test.ts` & Playwright Test 11 | Edits save automatically on pause with clear visual status indicator; serialized in-flight requests | **VERIFIED** |
| **NOTE-05** | Phase 3 | MANDATORY COURSE REQUIREMENT | Safe Deletion Confirmation | PHPUnit `NoteTest.php`, Vitest `NoteDeletion.test.tsx`, Playwright Test 13 | Explicit confirmation dialog; deletion executes only upon confirmation; 204 returned; note permanently removed | **VERIFIED** |
| **NOTE-06** | Phase 4 | MANDATORY COURSE REQUIREMENT | Note Pinning & Priority Section | PHPUnit `NoteTest.php`, Vitest `NotePinning.test.tsx`, Playwright Test 14 | User toggles pin; pinned notes render in top section with pin badge; persists across reload | **VERIFIED** |
| **NOTE-07** | Phase 4 | MANDATORY COURSE REQUIREMENT | Live Instant Search | PHPUnit `NoteTest.php`, Vitest `NoteSearch.test.tsx`, Playwright Test 14 | Live debounced search on title and content without full-page reloads; escapes LIKE chars | **VERIFIED** |
| **NOTE-08** | Phase 4 | MANDATORY COURSE REQUIREMENT | File Attachments | `AttachmentUploadTest` | Permitted files upload, validate MIME/size, and attach to note | PLANNED |
| **LABEL-01** | Phase 4 | MANDATORY COURSE REQUIREMENT | Label CRUD | `LabelControllerTest` | Create, view, edit, and delete custom labels | PLANNED |
| **LABEL-02** | Phase 4 | MANDATORY COURSE REQUIREMENT | Many-to-Many Association | `NoteLabelRelationshipTest` | Assign multiple labels per note and multiple notes per label | PLANNED |
| **LABEL-03** | Phase 4 | MANDATORY COURSE REQUIREMENT | Label Filtering | Vitest `LabelFilter.test.tsx` | Selecting label filters dashboard notes list immediately | PLANNED |
| **SHARE-01** | Phase 5 | MANDATORY COURSE REQUIREMENT | Per-Note Password Protection | `ProtectedNoteTest` | Locked note displays lock icon; content hidden until unlocked | PLANNED |
| **SHARE-02** | Phase 5 | MANDATORY COURSE REQUIREMENT | Server-Side Unlock Verification | `UnlockNoteControllerTest` | Submitting password validates on backend before returning note body | PLANNED |
| **SHARE-03** | Phase 5 | MANDATORY COURSE REQUIREMENT | User-to-User Note Sharing | `ShareNoteTest` | Owner shares note with registered user by email address | PLANNED |
| **SHARE-04** | Phase 5 | MANDATORY COURSE REQUIREMENT | Read / Edit Permissions | `NoteAuthorizationPolicyTest` | Server enforces `read` vs. `edit` permissions on shared notes | PLANNED |
| **SHARE-05** | Phase 5 | MANDATORY COURSE REQUIREMENT | Shared-Note Metadata Exposure | Vitest `SharedNoteMetadata.test.tsx` | Recipient views permission level, sharing user email, and share date | PLANNED |
| **SHARE-06** | Phase 5 | OPTIONAL / FUTURE ENHANCEMENT | Access Revocation | `RevokeShareTest` | Optional owner interface to modify or revoke collaborator permissions | OPTIONAL |
| **RT-01** | Phase 6 | MANDATORY COURSE REQUIREMENT | Realtime Collaborative Editing | Playwright dual-browser test | Changes made in Browser A appear in Browser B in real time via Reverb | PLANNED |
| **RT-02** | Phase 6 | OPTIONAL / FUTURE ENHANCEMENT | Active User Presence / Cursors | Reverb presence channel test | Optional presence indicators; not required for Phase 6 PASS | OPTIONAL |
| **RT-03** | Phase 6 | TECHNICAL SUPPORTING REQUIREMENT | Concurrent Edit Data Integrity | Concurrent edit test suite | Backend maintains data integrity during simultaneous updates | PLANNED |
| **AI-01** | Phase 7 | TECHNICAL SUPPORTING REQUIREMENT | Provider-Neutral AI Abstraction | Mocked AIService unit test | Swapping backend provider adapter leaves application logic unchanged | PLANNED |
| **AI-02** | Phase 7 | MANDATORY COURSE REQUIREMENT | Note Summarization | `SummarizeNoteTest` | User requests summary; note text is concisely summarized | PLANNED |
| **AI-03** | Phase 7 | MANDATORY COURSE REQUIREMENT | Note Grounded Q&A | `NoteQATest` | User query answered accurately using relevant note content | PLANNED |
| **AI-04** | Phase 7 | MANDATORY COURSE REQUIREMENT | Source Note Attribution | `AttributionTest` | AI answers explicitly identify and link to source notes | PLANNED |
| **AI-05** | Phase 7 | MANDATORY COURSE REQUIREMENT | AI Authorization Scoping | `AIScopeIsolationTest` | AI never inspects or returns notes outside user's access perimeter | PLANNED |
| **PWA-01** | Phase 8 | MANDATORY COURSE REQUIREMENT | PWA Manifest & Service Worker | Lighthouse PWA audit | Application is installable as desktop/mobile PWA; assets cached | PLANNED |
| **PWA-02** | Phase 8 | MANDATORY COURSE REQUIREMENT | IndexedDB Client Storage | Vitest IndexedDB storage test | Notes persist in browser JavaScript database (IndexedDB) for offline | PLANNED |
| **PWA-03** | Phase 8 | MANDATORY COURSE REQUIREMENT | Offline Create & Edit | Playwright offline mode test | Notes created/edited while offline are queued in browser storage | PLANNED |
| **PWA-04** | Phase 8 | MANDATORY COURSE REQUIREMENT | Automatic Offline Synchronization | Sync worker integration test | Reconnection automatically syncs staged offline edits to MySQL | PLANNED |
| **UX-01** | Phase 9 | MANDATORY COURSE REQUIREMENT | Responsive Cross-Device UI | Playwright viewport tests | Smooth responsive rendering across 375px, 768px, and 1440px | PLANNED |
| **UX-02** | Phase 9 | MANDATORY COURSE REQUIREMENT | Accessibility Standards | axe-core automated audit | Zero critical a11y violations; full keyboard navigability | PLANNED |
| **UX-03** | Phase 9 | MANDATORY COURSE REQUIREMENT | UI State Indicators | Visual interaction tests | Distinct visual indicators for pinned, shared, and locked notes | PLANNED |
| **SEC-01** | Phases 2–9 | MANDATORY COURSE REQUIREMENT | Server-Side Authorization | Comprehensive Policy test suite | Backend returns 403 Forbidden on unauthorized resource access | PLANNED |
| **SEC-02** | Phases 2–9 | MANDATORY COURSE REQUIREMENT | IDOR Defense | IDOR penetration tests | Tampered resource IDs rejected with 403/404 | PLANNED |
| **SEC-03** | Phases 2–9 | MANDATORY COURSE REQUIREMENT | Input Validation & XSS Defense | FormRequest & sanitize tests | Malicious script payloads sanitized; invalid inputs rejected | PLANNED |
| **SEC-04** | Phase 4 | MANDATORY COURSE REQUIREMENT | File Upload Security Validation | File upload security tests | Dangerous extensions/MIMEs blocked; storage outside public web root | PLANNED |
| **SEC-05** | Phase 1 | MANDATORY COURSE REQUIREMENT | Secret Hygiene | Git repository secret scan | No `.env` secrets, credentials, or API keys in version control | **VERIFIED** |
| **SEC-06** | Phase 2 | MANDATORY COURSE REQUIREMENT | CORS & CSRF Hardening | Security header integration tests & named rate limiters | Unauthorized origins blocked; CSRF validation on mutating calls; 5 req/min rate limiters active | **VERIFIED** |
