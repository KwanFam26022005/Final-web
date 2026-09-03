# Architectural Decision Records (ADR)

This document records the binding technical architecture decisions governing the Collaborative Intelligent Note Management Web Application. Each record documents the context, options considered, chosen solution, rationale, consequences, and deferred alternatives.

> **Status Notice:** These records document authoritative architecture design. They **do not claim** that code implementation currently exists.

---

## ADR-001: Monorepo Repository Structure

- **Status:** APPROVED
- **Context:** The project comprises a React frontend, a Laravel backend, Docker configurations, and unified documentation. We need an organizational structure that facilitates seamless versioning, CI/CD, and cross-tier specification tracking.
- **Choice:** Maintain all subsystems within a single Git repository (`frontend/`, `backend/`, `docker/`, `docs/`).
- **Rationale:** Minimizes overhead from multi-repo synchronization, allows atomic documentation and specification updates, and simplifies Docker Compose and CI orchestration.
- **Consequences:** Requires clean root-level `.gitignore` and `.gitattributes` to avoid tooling conflicts between Node.js and PHP.
- **Deferred Alternatives:** Multi-repository architecture (rejected due to excessive coordination friction).

---

## ADR-002: Decoupled React SPA Frontend and Laravel REST API Backend

- **Status:** APPROVED
- **Context:** The application demands rich client-side responsiveness, autosave, offline capabilities (PWA), and real-time collaboration.
- **Choice:** Complete architectural separation between a standalone React (Vite) Single Page Application and a Laravel REST API.
- **Rationale:** Enables independent testing of UI components, clean separation of concerns, native integration with client-side offline storage (IndexedDB), and standard REST/JSON APIs.
- **Consequences:** Requires explicit CORS configuration, Sanctum SPA cookie session handling, and separate build tooling.
- **Deferred Alternatives:** Laravel Blade / Livewire (lacks flexible offline client state), Inertia.js (tighter server coupling makes standalone PWA/offline caching complex).

---

## ADR-003: Laravel Backend Framework

- **Status:** APPROVED
- **Context:** A robust backend is needed to provide RESTful endpoints, database migrations, authorization policies, background jobs, and WebSocket integration.
- **Choice:** Laravel (exact major/minor version resolved and frozen during Phase 1 Step 3).
- **Policy:**
  - Backend framework: Laravel.
  - Exact Laravel version is resolved and frozen during Phase 1 Step 3 after checking the current compatible stable release against the verified host PHP/Composer runtime.
  - Do not silently pin an older major version.
  - Once Step 3 installs Laravel, record the exact installed version in `RUNTIME_BASELINE.md` and implementation evidence.
  - Observed PHP 8.3.30 is a host baseline, not permission to invent or assume a Laravel version in advance.
- **Rationale:** Rich ecosystem providing battle-tested ORM (Eloquent), FormRequest validation, Gate/Policy authorization, Sanctum authentication, and first-party WebSocket support via Reverb.
- **Consequences:** PHP runtime dependencies and Composer package management required on host and in containers.
- **Deferred Alternatives:** Express/NestJS (less comprehensive built-in ORM and auth policies out of the box), Django (team environment standardized on PHP/Laravel).

---

## ADR-004: MySQL 8.x with InnoDB and utf8mb4

- **Status:** APPROVED
- **Context:** Relational data persistence is required for user accounts, notes, labels, attachments, sharing relationships, and audit logs.
- **Choice:** MySQL 8.x using the InnoDB storage engine and `utf8mb4` character set (`utf8mb4_unicode_ci`).
- **Rationale:** InnoDB guarantees ACID transactions, row-level locking, and foreign key referential integrity. `utf8mb4` provides complete Unicode support, including emojis in note content.
- **Consequences:** Requires running a local MySQL server (or containerized instance) during development.
- **Deferred Alternatives:** PostgreSQL (compatible, but MySQL 8.x is standard for this course curriculum and Laragon environment), SQLite (insufficient for concurrent multi-user load testing).

---

## ADR-005: Laravel Sanctum for First-Party SPA Authentication

- **Status:** APPROVED (Scheduled for Phase 2)
- **Context:** Secure session authentication is required between the React SPA and the Laravel REST API.
- **Choice:** Laravel Sanctum using cookie-based session authentication with CSRF token exchange.
- **Rationale:** Avoids storing bearer tokens in browser `localStorage` or `sessionStorage` (mitigating XSS token theft), relies on HTTP-only, secure cookies, and integrates natively with Laravel's session guards.
- **Consequences:** Requires matching domain/port configuration in `config/cors.php` and `config/sanctum.php` (`stateful` domains).
- **Deferred Alternatives:** Custom JWT in localStorage (vulnerable to XSS), Laravel Passport (OAuth2 server overhead is unnecessary for first-party SPA).

---

## ADR-006: Laravel Reverb and Laravel Echo for Realtime Collaboration

- **Status:** APPROVED (Scheduled for Phase 6)
- **Context:** Notes require real-time collaborative editing indicators and concurrent update broadcasts.
- **Choice:** Laravel Reverb as the WebSocket server, paired with Laravel Echo on the React frontend.
- **Rationale:** Native first-party Laravel WebSocket engine offering high performance, zero external SaaS dependencies (e.g., Pusher), and deep integration with Laravel event broadcasting.
- **Consequences:** Requires running the Reverb daemon process and exposing a WebSocket port during Phase 6.
- **Deferred Alternatives:** Pusher SaaS (incurs vendor limits/costs), Socket.io with Node microservice (introduces architectural split).

---

## ADR-007: Custom Docker Compose for Orchestration

- **Status:** APPROVED (Baseline in Phase 1, Finalized in Phase 10)
- **Context:** Development and production environments require reproducible runtime environments across the project lifecycle.
- **Choice:** Phased Docker Compose architecture:
  - **Phase 1 Baseline:** Multi-container `docker-compose.yml` defining core services: `frontend`, `backend`, and `database` (MySQL 8). Does not permanently lock PHP-FPM/Nginx topology before the Docker foundation step validates the simplest reproducible architecture.
  - **Phase 6:** Add/revise the WebSocket service (`reverb`) when real-time collaboration is implemented. Reverb is explicitly NOT required during Phase 1.
  - **Phase 10:** Final production hardening and deployment topology.
- **Rationale:** Ensures clean developer onboarding, platform independence, and automated CI test execution while preserving strict phase boundaries.
- **Consequences:** Requires host Docker Desktop daemon when running containerized workflows. Standalone `docker-compose.exe` syntax must be accommodated on Windows host during Phase 1.
- **Deferred Alternatives:** Kubernetes / Helm (excessive operational overhead for project scope).

---

## ADR-008: Testing Stack Across Tiers

- **Status:** APPROVED
- **Context:** High code quality, regression defense, and requirement verification necessitate automated tests at each layer.
- **Choice:**
  - Backend: PHPUnit / Laravel Test Suite (Feature & Unit tests)
  - Frontend: Vitest + React Testing Library (Component & State tests)
  - End-to-End: Playwright (User journeys and browser flows)
- **Rationale:** Vitest integrates natively with Vite for high-speed testing; PHPUnit is standard for Laravel; Playwright handles cross-browser headless E2E verification.
- **Consequences:** CI pipeline must execute each test runner and report coverage.
- **Deferred Alternatives:** Jest (slower integration with Vite), Cypress (heavier resource footprint than Playwright).

---

## ADR-009: Provider-Neutral AI Service Abstraction

- **Status:** APPROVED (Scheduled for Phase 7)
- **Context:** The application requires note summarization and contextual Q&A without binding to a single proprietary LLM provider.
- **Choice:** A backend Service interface (`AIServiceInterface`) with interchangeable provider adapters (e.g., OpenAI, Anthropic, Gemini, or local Ollama).
- **Rationale:** Allows swapping LLM backends via environment configuration (`AI_PROVIDER`) without modifying business logic. Ensures strict authorization filtering before prompt construction.
- **Consequences:** Prompts and context-window truncation must be managed within the adapter layer.
- **Deferred Alternatives:** LangChain / LlamaIndex Python microservice (unnecessary complexity; pure PHP/Laravel service layer is sufficient).

---

## ADR-010: Offline-First Client Data Abstraction

- **Status:** APPROVED (Scheduled for Phase 8)
- **Context:** Users must be able to view, create, and modify notes without an active network connection.
- **Choice:** Service Worker caching combined with browser IndexedDB persistence, coupled with a synchronization queue. Dexie is recognized as a candidate implementation library for Phase 8 until the Phase 8 technology decision formally confirms it, rather than a permanent binding product requirement.
- **Rationale:** IndexedDB provides structured, high-capacity client storage and reliable transaction handling. An abstracted repository pattern on the frontend allows switching transparently between IndexedDB offline cache and REST API.
- **Consequences:** Synchronization conflict resolution strategies (e.g., timestamp-based last-write-wins) must be implemented.
- **Deferred Alternatives:** LocalStorage (5MB cap, synchronous blocking I/O, lacks indexing).
