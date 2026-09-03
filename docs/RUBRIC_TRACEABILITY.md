# Project Rubric and Requirement Traceability Matrix

This matrix establishes end-to-end traceability between project requirements, target phases, verification tests, demonstration evidence, and current realization status.

Status Definitions:
- **PLANNED:** Requirement is formally specified; no implementation code or verified test yet exists.
- **IN_PROGRESS:** Active implementation or verification is underway.
- **VERIFIED:** Implementation is complete and validated with executable test evidence.

---

## Traceability Matrix

| Req ID | Target Phase | Implementation Scope | Expected Automated Test | Expected Demo Evidence | Current Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GIT-01** | Phase 1 (Step 1) | Baseline Environment Audit | CLI audit tool calls | Audit output report matching baseline specs | **VERIFIED** |
| **GIT-02** | Phase 1 (Step 2) | Repository Governance Bootstrap | Git status & tree inspection | Clean initial commit pushed to `main` with 15 files | **IN PROGRESS** |
| **GIT-03** | Phase 1–10 | Git Contribution Compliance | Git log cadence audit | Commit graph with $\ge 2$ commits/week/member over 4 weeks | PLANNED |
| **DEPLOY-01** | Phase 1 / 10 | Docker Compose Orchestration | `docker-compose config` / validation | Containerized stack booting cleanly | PLANNED |
| **ACC-01** | Phase 2 | Mandatory Session Auth | `AuthMiddlewareTest` (401 on unauth) | Redirect to `/login` when browsing unauthenticated | PLANNED |
| **ACC-02** | Phase 2 | User Registration & Auto-Login | `RegisterControllerTest` | Registration form submission logging user in immediately | PLANNED |
| **ACC-03** | Phase 2 | Secure Password Hashing | `PasswordHashingTest` (Bcrypt check) | DB inspection showing `bcrypt` hash strings | PLANNED |
| **ACC-04** | Phase 2 | Email Activation & Warning | `EmailVerificationTest` | Verification email dispatched; banner appears on UI | PLANNED |
| **ACC-05** | Phase 2 | Profile & Avatar Upload | `ProfileUpdateTest` | Profile form update with avatar preview | PLANNED |
| **ACC-06** | Phase 2 | Change Password | `ChangePasswordTest` | Password changed successfully with old password check | PLANNED |
| **ACC-07** | Phase 2 | User Preferences | `UserPreferencesTest` | Toggle theme / view and verify persistence across reload | PLANNED |
| **ACC-08** | Phase 2 | Password Recovery | `PasswordResetTest` | Reset link / OTP generated and redeemed | PLANNED |
| **ACC-09** | Phase 2 | Sanctum SPA Cookie Auth | `SanctumCsrfTest` | Browser network tab displaying HTTP-only session cookies | PLANNED |
| **NOTE-01** | Phase 3 | Grid / List View Toggle | Vitest `NotesViewToggle.test.tsx` | UI toggle switching between CSS grid and vertical list | PLANNED |
| **NOTE-02** | Phase 3 | Shared Interaction Model | Vitest `NoteEditorModal.test.tsx` | Same editor interface used for new and existing notes | PLANNED |
| **NOTE-03** | Phase 3 | Required Title & Content | `NoteValidationTest` (422 response) | Error prompt when submitting note with blank fields | PLANNED |
| **NOTE-04** | Phase 3 | Debounced Autosave | Vitest `useAutosave.test.ts` | "Saving..." indicator transitioning to "Saved" on pause | PLANNED |
| **NOTE-05** | Phase 3 | Safe Deletion Confirmation | Vitest `DeleteConfirmModal.test.tsx` | Confirmation dialog before note is deleted | PLANNED |
| **NOTE-06** | Phase 4 | Note Pinning | `PinNoteTest` & UI rendering test | Pinned notes displayed in dedicated top section | PLANNED |
| **NOTE-07** | Phase 4 | Live Instant Search | Vitest `SearchNotes.test.tsx` | Typing in search bar instantly filters visible note cards | PLANNED |
| **NOTE-08** | Phase 4 | File Attachments | `AttachmentUploadTest` | File preview thumbnail on note card; download link | PLANNED |
| **LABEL-01** | Phase 4 | Label CRUD | `LabelControllerTest` | Sidebar showing created, edited, and deleted labels | PLANNED |
| **LABEL-02** | Phase 4 | Many-to-Many Association | `NoteLabelRelationshipTest` | Assigning multiple labels to a note via tag selector | PLANNED |
| **LABEL-03** | Phase 4 | Label Filtering | Vitest `LabelFilter.test.tsx` | Clicking a label displays only associated notes | PLANNED |
| **SHARE-01** | Phase 5 | Per-Note Password Protection | `ProtectedNoteTest` | Locked note card displaying lock icon with hidden text | PLANNED |
| **SHARE-02** | Phase 5 | Server-Side Unlock | `UnlockNoteControllerTest` | Password prompt unlocking note content on correct submission | PLANNED |
| **SHARE-03** | Phase 5 | User-to-User Sharing | `ShareNoteTest` | Note owner adding collaborator by email | PLANNED |
| **SHARE-04** | Phase 5 | Read/Edit Permissions | `NoteAuthorizationPolicyTest` | Viewer cannot edit note; editor can update content | PLANNED |
| **SHARE-05** | Phase 5 | Collaborator Metadata | Vitest `CollaboratorBadges.test.tsx` | Badges displaying shared user avatars and permissions | PLANNED |
| **SHARE-06** | Phase 5 | Access Revocation | `RevokeShareTest` | Removing collaborator immediately revokes their access | PLANNED |
| **RT-01** | Phase 6 | Reverb Real-Time Broadcast | Playwright dual-browser test | Changes in Browser A appear in Browser B in real time | PLANNED |
| **RT-02** | Phase 6 | Presence & Active Users | Reverb presence channel test | Avatar pill showing who is currently viewing the note | PLANNED |
| **RT-03** | Phase 6 | Conflict Resolution | Concurrent update test | Clean resolution without data loss or corruption | PLANNED |
| **AI-01** | Phase 7 | Provider-Neutral Abstraction | Mocked AIService unit test | Swapping mock provider changes responses seamlessly | PLANNED |
| **AI-02** | Phase 7 | Note Summarization | `SummarizeNoteTest` | Clicking "Summarize" outputs bulleted summary | PLANNED |
| **AI-03** | Phase 7 | Note Grounded Q&A | `NoteQATest` | User query answers question accurately using note text | PLANNED |
| **AI-04** | Phase 7 | Source Note Attribution | `AttributionTest` | Response footer contains clickable links to source notes | PLANNED |
| **AI-05** | Phase 7 | Authorization Scoping | `AIScopeIsolationTest` | AI cannot reference notes owned by unauthorized users | PLANNED |
| **PWA-01** | Phase 8 | PWA Manifest & Installability | Lighthouse PWA audit | Browser install prompt; manifest validated | PLANNED |
| **PWA-02** | Phase 8 | IndexedDB Client Storage | Vitest Dexie storage test | Notes persist in IndexedDB when offline | PLANNED |
| **PWA-03** | Phase 8 | Offline Create & Edit | Playwright offline mode test | New notes created while offline queue in IndexedDB | PLANNED |
| **PWA-04** | Phase 8 | Auto Synchronization | Sync worker integration test | Network reconnection automatically flushes queued edits | PLANNED |
| **UX-01** | Phase 9 | Responsive Layout | Playwright mobile/tablet/desktop | Clean layout rendering across 375px, 768px, 1440px | PLANNED |
| **UX-02** | Phase 9 | Accessibility Standards | axe-core automated audit | Zero critical a11y violations; full keyboard navigation | PLANNED |
| **UX-03** | Phase 9 | Feedback Indicators | Visual interaction tests | Toast notifications on error, save indicators, skeletons | PLANNED |
| **SEC-01** | Phases 2–9 | Server-Side Authorization | Comprehensive Policy test suite | 403 Forbidden returned on unauthorized API calls | PLANNED |
| **SEC-02** | Phases 2–9 | IDOR Defense | IDOR security penetration tests | Tampered IDs rejected with 403/404 | PLANNED |
| **SEC-03** | Phases 2–9 | Input Validation & XSS | FormRequest test suite | Malicious script payloads sanitized; invalid data rejected | PLANNED |
| **SEC-04** | Phase 4 | File Upload Validation | File upload security tests | Executable/script uploads blocked; MIME strictly checked | PLANNED |
| **SEC-05** | Phase 1 | Secret Hygiene | Git repo secret scan | Repository tree clean of `.env` files and credentials | **VERIFIED** |
| **SEC-06** | Phase 2 | CORS & CSRF Hardening | Security header integration tests | Cross-origin unauthorized calls blocked; CSRF active | PLANNED |
| **DEPLOY-02**| Phase 10 | CI Pipeline Automation | GitHub Actions execution | Green build badge on pull requests | PLANNED |
| **DEPLOY-03**| Phase 10 | Public Demonstration | Deployment health check probe | Public URL returns 200 OK with full feature set | PLANNED |
