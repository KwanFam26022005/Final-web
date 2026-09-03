# Project Execution Plan

This document establishes the multi-phase engineering delivery plan for the Collaborative Intelligent Note Management Web Application. Each phase defines discrete objectives, assigned requirement IDs, technical deliverables, and strict exit criteria.

> **Current Phase:** Phase 1 — Repository and Runtime Foundation<br>
> **Current Step:** Phase 1 Step 5R — Frontend Starter Artifact Cleanup (Remediation completed, pending orchestrator review)<br>
> **Next Authorized Step:** Phase 1 Step 6 — Frontend ↔ Backend ↔ Database Integration (Do NOT begin yet)<br>
> **Rule:** No feature may be promoted or implemented ahead of its designated phase without explicit authorization.

---

## Phase Overview

```mermaid
flowchart LR
    P0[Phase 0: Spec Freeze] --> P1[Phase 1: Foundation]
    P1 --> P2[Phase 2: Auth & Accounts]
    P2 --> P3[Phase 3: Core Notes]
    P3 --> P4[Phase 4: Labels & Attachments]
    P4 --> P5[Phase 5: Sharing & Protection]
    P5 --> P6[Phase 6: Realtime Reverb]
    P6 --> P7[Phase 7: AI Capabilities]
    P7 --> P8[Phase 8: PWA & Offline]
    P8 --> P9[Phase 9: UX & Security]
    P9 --> P10[Phase 10: Deploy & Demo]
```

---

## Phase Details

### Phase 0: Specification Freeze & Project Decisions
- **Objective:** Establish authoritative tech stack, requirements catalog, rubric mappings, and baseline architecture.
- **Deliverables:** Architectural decisions approved; out-of-scope technologies frozen.
- **Exit Criteria:** Specification approved without ambiguities.
- **Status:** **COMPLETED**

---

### Phase 1: Repository and Runtime Foundation
- **Target Requirements:** `GIT-01`, `GIT-02`, `DEPLOY-01`, `DEPLOY-02`, `SEC-05`
- **Objective:** Establish the development environment, version control governance, decoupled scaffolding, containerized baseline, and automated CI foundation.
- **Detailed Step Sequence:**
  - **Step 1 — Baseline Audit:** Read-only audit of local host environment, toolchains, ports, and empty Git repository. (*Status: COMPLETED*)
  - **Step 2 — Governance & Specification Bootstrap:** Initial commit establishing governance policies, ADRs, requirement catalogs, and repository hygiene. (*Status: COMPLETED in commit 881078d*)
  - **Step 2R — Governance Specification Alignment:** Remediation aligning requirements with rubric (bcrypt, registration/reset contracts, deletion confirmation, metadata exposure, step plan). (*Status: COMPLETED in commit d08048f*)
  - **Step 3 — Laravel Backend Foundation:** Scaffolding the decoupled Laravel REST API backend, resolving exact stable Laravel version against host PHP 8.3/Composer. (*Status: COMPLETED in commit bafe6e6*)
  - **Step 3R — Laravel Backend Boundary Cleanup:** Enforcing API-only boundary, removing conflicting nested agent instructions, removing backend frontend toolchains, and updating migration evidence. (*Status: COMPLETED in commit 66d7ef5*)
  - **Step 4 — MySQL Foundation:** Establishing local database connection, schema migration baseline, and database health verification. (*Status: COMPLETED in commit 57a77a0*)
  - **Step 4R — Database Contract & Test-Safety Cleanup:** Tightening database documentation boundaries and implementing automatic DatabaseTestCase test safety enforcement. (*Status: COMPLETED in commit 9bb1dea*)
  - **Step 4R2 — Database Test Lifecycle Safety Hardening:** Hardening DatabaseTestCase to enforce safety guards during setUpTraits() prior to database-mutating trait execution. (*Status: COMPLETED in commit 1500a59*)
  - **Step 4R3 — Database Safety Test Evidence Cleanup:** Eliminating placeholder assertions and validating controlled RefreshDatabase trait lifecycle order. (*Status: COMPLETED in commit 9841823*)
  - **Step 5 — React Frontend Foundation:** Scaffolding the React SPA with TypeScript, Vite, and Tailwind CSS. (*Status: COMPLETED in commit e1f748a*)
  - **Step 5R — Frontend Starter Artifact Cleanup:** Removing unused Vite starter SVGs (icons, favicon) and references. (*Status: CURRENT / starter artifact cleanup completed pending review*)
  - **Step 6 — Frontend ↔ Backend ↔ Database Integration:** Establishing clean cross-origin communication between React and Laravel. (*Status: PENDING AUTHORIZATION*)
  - **Step 7 — Testing Foundation:** Establishing backend PHPUnit and frontend Vitest execution pipelines. (*Status: PENDING AUTHORIZATION*)
  - **Step 8 — Docker Foundation:** Creating reproducible `docker-compose.yml` baseline for frontend, backend, and MySQL services. (*Status: PENDING AUTHORIZATION*)
  - **Step 9 — GitHub Actions CI Foundation:** Initializing CI workflow to run linters, typechecks, and baseline tests on pull requests. (*Status: PENDING AUTHORIZATION*)
  - **Step 10 — Clean-Clone Reproducibility Verification:** Validating that a fresh checkout builds and passes tests out-of-the-box. (*Status: PENDING AUTHORIZATION*)
  - **Step 11 — Phase 1 Freeze:** Freezing foundation baseline before proceeding to Phase 2. (*Status: PENDING AUTHORIZATION*)
- **Exit Criteria:** `frontend` and `backend` build cleanly; Docker Compose boots core services; CI pipeline passes; test runners execute green baseline tests.

---

### Phase 2: Authentication and Account Management
- **Target Requirements:** `ACC-01` through `ACC-09`, `SEC-01`, `SEC-02`, `SEC-06`
- **Objective:** Implement secure user registration (name, email, password, confirmation), auto-login, bcrypt hashing, session persistence via Laravel Sanctum, email activation, and profile management.
- **Deliverables:** Registration with auto-login; bcrypt password hashing; activation email with grace period UI banner; profile/avatar update; password change/recovery (requiring manual login post-reset); Sanctum cookie auth.
- **Exit Criteria:** Automated Feature tests verify authentication flows; CSRF protection active; unauthenticated API access properly rejected.

---

### Phase 3: Core Note CRUD, Views, and Autosave
- **Target Requirements:** `NOTE-01` through `NOTE-05`
- **Objective:** Build foundational note management capabilities on frontend and backend.
- **Deliverables:** Grid and List views with toggle; unified note creation/editing interaction model; debounced autosave with visual status; safe delete requiring explicit confirmation dialog; backend REST endpoints with FormRequest validation.
- **Exit Criteria:** Autosave smoothly updates database; delete confirmation prevents accidental loss; zero data corruption on rapid edits.

---

### Phase 4: Labels, Attachments, Search, and Pinning
- **Target Requirements:** `LABEL-01` to `LABEL-03`, `NOTE-06` to `NOTE-08`, `SEC-04`
- **Objective:** Extend notes with rich metadata, categorization, instant search, and file attachments.
- **Deliverables:** Many-to-many labels with CRUD and filter pills; pinned notes section rendered at top with visual indicator; live debounced client search (~300 ms); validated secure file attachment uploads.
- **Exit Criteria:** Filtering by label instant; attachments restricted by MIME/size; search queries return matching cards without full-page reloads.

---

### Phase 5: Protected Notes and Sharing Authorization
- **Target Requirements:** `SHARE-01` through `SHARE-05`, `SEC-01`, `SEC-02` (`SHARE-06` Optional)
- **Objective:** Implement per-note password locking and collaborative sharing with fine-grained access control.
- **Deliverables:** Individual note password protection with backend verification; collaborator invitation by email; read-only (`read`) vs. read-write (`edit`) permissions; recipient-facing shared-note metadata (sharer identity, permission, timestamp); visual locked and shared indicators.
- **Exit Criteria:** Locked notes obscured until validated server-side; read-only collaborators cannot mutate notes; IDOR tests pass.

---

### Phase 6: Realtime Collaboration
- **Target Requirements:** `RT-01`, `RT-03` (`RT-02` Optional)
- **Objective:** Enable multi-user live editing through WebSockets and ensure concurrent data integrity.
- **Deliverables:** Laravel Reverb WebSocket server integration; Laravel Echo client event listeners; real-time edit synchronization; backend data integrity during concurrent edits. (Presence indicators/cursors optional).
- **Exit Criteria:** Concurrent edits across two browser sessions reflect instantly without manual refresh.

---

### Phase 7: AI Summarization and Note-Grounded Q&A
- **Target Requirements:** `AI-01` through `AI-05`
- **Objective:** Integrate provider-neutral AI capabilities grounded strictly in user note content.
- **Deliverables:** `AIServiceInterface` with swappable LLM adapter; on-demand note summarization; multi-note Q&A; explicit source note citation; strict user authorization scoping.
- **Exit Criteria:** AI queries cannot access unauthorized notes; responses provide clickable links to originating source notes.

---

### Phase 8: PWA, IndexedDB, Offline and Synchronization
- **Target Requirements:** `PWA-01` through `PWA-04`
- **Objective:** Provide robust offline capabilities and Progressive Web App installation.
- **Deliverables:** Web App Manifest; Service Worker asset caching; browser JavaScript database (IndexedDB; Dexie candidate library); offline creation/edit mutation queue; automatic sync on reconnect.
- **Exit Criteria:** Application functions offline; queued edits successfully push to backend upon network restoration.

---

### Phase 9: UI/UX, Responsive Hardening, Accessibility, Security Hardening
- **Target Requirements:** `UX-01` through `UX-03`, `SEC-01` through `SEC-06`
- **Objective:** Polish user experience across device viewports, conduct accessibility audits, and execute comprehensive security hardening.
- **Deliverables:** Tailwind responsive optimization (mobile, tablet, desktop); WCAG AA compliance and axe-core audit; clear visual state indicators (pinned, shared, locked); comprehensive rate limiting; sanitized error responses.
- **Exit Criteria:** Zero high-severity accessibility flaws; flawless mobile rendering; security audit clean.

---

### Phase 10: Deployment, Final Verification, Demo/Submission Preparation
- **Target Requirements:** `DEPLOY-01` through `DEPLOY-03`, `GIT-03`
- **Objective:** Orchestrate containerized production deployment, verify automated CI, and prepare demo submission artifacts.
- **Deliverables:** Production Docker Compose deployment; green GitHub Actions CI pipeline; public demo URL; final academic contribution audit report.
- **Exit Criteria:** Public demo instance fully operational; all test suites passing; submission documentation finalized.
