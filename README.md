# Collaborative Intelligent Note Management Web Application

> Final Project — Web Programming & Applications  
> **Repository:** [KwanFam26022005/Final-web](https://github.com/KwanFam26022005/Final-web)  
> **Authoritative Branch:** `main`

---

## 1. Project Overview

The **Collaborative Intelligent Note Management Web Application** is a full-stack web platform enabling users to create, organize, secure, collaborate on, and intelligently interact with their notes in real time. It features responsive cross-device usability, robust server-side authorization, real-time multi-user editing, offline synchronization capabilities, and AI-powered summarization and question answering grounded in note content.

---

## 2. Approved Architecture Summary

The platform follows a decoupled **Monorepo** architecture:

- **Frontend:** React (SPA), TypeScript, Vite, Tailwind CSS
- **Backend:** Laravel REST API (PHP 8.3+ host baseline; exact Laravel version resolved in Phase 1 Step 3)
- **Database:** MySQL 8.x (InnoDB engine, `utf8mb4` character set)
- **Authentication:** Laravel Sanctum (First-party SPA cookie/session-based authentication, Phase 2)
- **Realtime Collaboration:** Laravel Reverb + Laravel Echo (WebSockets, Phase 6)
- **Testing:**
  - Backend: PHPUnit / Laravel Test Suite
  - Frontend: Vitest + React Testing Library
  - End-to-End: Playwright
- **Offline / PWA:** Service Worker + IndexedDB browser database (candidate library Dexie deferred to Phase 8)
- **AI Layer:** Provider-neutral LLM service abstraction (Phase 7)
- **DevOps:** Custom Docker Compose (core baseline Phase 1, Reverb Phase 6, prod Phase 10) + GitHub Actions CI (Phase 1 & 10)

> **Notice:** Deferred technologies (Redis, RabbitMQ, Kubernetes, external vector DB, agent framework, microservices, JWT, Inertia) are explicitly out-of-scope for the initial baseline.

---

## 3. Current Implementation Status

> **Current Phase:** Phase 1 — Repository and Runtime Foundation<br>
> **Current Milestone:** M7 — Docker & Reproducibility (Implementation completed, pending review)<br>
> **Next Authorized Milestone:** M8 — Phase 1 Acceptance / Freeze (Do NOT begin yet)

### Phase 1 Milestone Progress:
- **M1 — Specification & Governance:** ACCEPTED (commit `d08048f`)
- **M2 — Backend Foundation:** ACCEPTED (commit `66d7ef5`)
- **M3 — Database Foundation:** ACCEPTED (commit `9841823`)
- **M4 — Frontend Foundation:** ACCEPTED (commit `21087e2`)
- **M5 — Full-stack Integration:** ACCEPTED (commit `5adc47b`)
- **M6 — Testing & CI:** ACCEPTED (commit `5ab62a0`)
- **M7 — Docker & Reproducibility:** CURRENT (Implementation completed, pending review)
- **M8 — Phase 1 Acceptance / Freeze:** PENDING

### Implemented Capabilities:
- Governance, specification foundation, rubric alignment, security rules, and testing guidelines
- Repository hygiene (`.gitignore`, `.gitattributes`, `.editorconfig`)
- Decoupled API-only Laravel REST API backend (`backend/`, Laravel Framework v13.30.1)
- Minimal infrastructure health endpoint (`GET /api/health`) and database health probe (`GET /api/health/database`)
- Strict database isolation (`final_web` / `final_web_test`) and `DatabaseTestCase` pre-trait lifecycle safety guard
- Standalone React SPA frontend (`frontend/`, React 19.2.8, Vite 8.2.2, TypeScript 6.0.3, Tailwind CSS 4.3.3)
- Centralized native `fetch` API client abstraction (`frontend/src/lib/api/`)
- Narrow development CORS policy allowing `http://127.0.0.1:5173` and `http://localhost:5173`
- Full-stack foundation communication chain (React SPA → Laravel REST API → MySQL) verified end-to-end
- Automated backend PHPUnit test suite with negative-path failure and error-leakage assertions
- Frontend Vitest + React Testing Library + jsdom unit and component test suite
- Playwright Chromium E2E smoke tests with automatic lifecycle server management
- Multi-job GitHub Actions CI workflow (`.github/workflows/ci.yml`) for backend, frontend, and E2E
- Docker Compose (`compose.yaml`) runtime for frontend → backend → MySQL with health-ordered startup, multi-stage frontend build, and named volume persistence

### Not Yet Implemented:
- Application-domain database schema and migrations (Phase 2+)
- Authentication and account management (Phase 2)
- Core and advanced note features (CRUD, labels, attachments, search, pinning) (Phase 3-4)
- Password-protected notes and sharing authorization (Phase 5)
- Real-time collaboration (Reverb/Echo) (Phase 6)
- AI summarization and note-grounded Q&A (Phase 7)
- PWA, Service Worker, and IndexedDB offline synchronization (Phase 8)

---

## 4. Phase Roadmap

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 0** | Specification Freeze & Project Decisions | **COMPLETED** |
| **Phase 1** | Repository & Runtime Foundation | **IN PROGRESS** (M5 Active; M6 Next) |
| **Phase 2** | Authentication & Account Management | PLANNED |
| **Phase 3** | Core Note CRUD, Views & Autosave | PLANNED |
| **Phase 4** | Labels, Attachments, Search & Pinning | PLANNED |
| **Phase 5** | Protected Notes & Sharing Authorization | PLANNED |
| **Phase 6** | Realtime Collaboration (Reverb/Echo) | PLANNED |
| **Phase 7** | AI Summarization & Note-Grounded Q&A | PLANNED |
| **Phase 8** | PWA, IndexedDB, Offline & Synchronization | PLANNED |
| **Phase 9** | UI/UX, Responsive Hardening, Accessibility & Security Hardening | PLANNED |
| **Phase 10** | Deployment, Final Verification & Submission Preparation | PLANNED |

---

## 5. Repository Layout & Development Commands

### Current Structure:
```text
.
├── .editorconfig
├── .gitattributes
├── .gitignore
├── .env.docker.example        # Docker Compose environment template (commit-safe)
├── AGENTS.md
├── CONTRIBUTING.md
├── README.md
├── compose.yaml               # Docker Compose stack (mysql + backend + frontend)
├── backend/                   # Decoupled Laravel 13 REST API
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   ├── routes/
│   └── tests/
├── frontend/                  # Decoupled React 19 + Vite SPA
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── nginx.conf
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── docs/                      # Authoritative project specifications
```

### Independent Development Commands:

#### Backend (`cd backend`)
- **Start server:** `php artisan serve --port=8000`
- **Run tests:** `php artisan test`
- **Format code:** `php vendor/bin/pint`
- **Validate Composer:** `composer validate`

#### Frontend (`cd frontend`)
- **Start dev server:** `npm run dev` (http://127.0.0.1:5173)
- **Build production bundle:** `npm run build`
- **Run linter:** `npm run lint`
- **Run unit & component tests:** `npm run test:run`
- **Run Playwright E2E smoke tests:** `npm run test:e2e`
- **Preview production build:** `npm run preview`

#### Docker Compose (from repository root)
> **Prerequisites:** Docker Desktop running. Copy `.env.docker.example` to `.env.docker` and fill in your local values.

```sh
# Verify configuration
docker-compose --env-file .env.docker config

# Clean build all images
docker-compose --env-file .env.docker build --no-cache

# Start the full stack
docker-compose --env-file .env.docker up -d

# View logs
docker-compose --env-file .env.docker logs -f

# Stop and clean volumes
docker-compose --env-file .env.docker down -v
```

> **Note for environments using Docker Desktop or newer CLI:** Both `docker compose` and `docker-compose` are supported. The local Windows validation uses the standalone `docker-compose` v2.39.4.

---

## 6. Local Environment Baseline

A non-destructive baseline audit was performed during Phase 1 Step 1:
- **Operating System:** Windows (x64)
- **Git:** v2.51.0 (`D:\Program Files\Git\cmd\git.exe`)
- **Node.js (Primary):** v24.18.0 (`C:\Program Files\nodejs\node.exe`)
- **npm:** v11.16.0 (`C:\Program Files\nodejs\npm.cmd`)
- **PHP:** v8.3.30 (`C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe`)
- **Composer:** v2.9.4 (`C:\laragon\bin\composer\composer.bat`)
- **MySQL Client:** v8.4.3 (`C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe`)
- **MySQL Server:** Stopped (Laragon MySQL 8.4.3 service installed)
- **Docker CLI:** v28.4.0 (Docker Desktop daemon inactive during baseline)
- **Docker Compose:** Standalone `docker-compose.exe` v2.39.4 available
- **Ports (5173, 8000, 3306):** Verified unoccupied and available

See [`docs/RUNTIME_BASELINE.md`](docs/RUNTIME_BASELINE.md) for detailed observations and compatibility contracts.

---

## 7. Authoritative Documentation Index

All contributors and AI agents must consult the following authoritative documents before modifying this repository:

1. [AGENTS.md](AGENTS.md) — Mandatory governance and execution rules for AI coding agents
2. [CONTRIBUTING.md](CONTRIBUTING.md) — Team contribution policies, commit conventions, and branch workflow
3. [docs/MASTER_REQUIREMENTS.md](docs/MASTER_REQUIREMENTS.md) — Testable functional and non-functional requirements catalog
4. [docs/SCOPE_AND_CONSTRAINTS.md](docs/SCOPE_AND_CONSTRAINTS.md) — Boundary definitions, included capabilities, and excluded tech
5. [docs/ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md) — Architectural Decision Records (ADRs)
6. [docs/RUBRIC_TRACEABILITY.md](docs/RUBRIC_TRACEABILITY.md) — Traceability matrix linking requirements to tests and demos
7. [docs/SECURITY_RULES.md](docs/SECURITY_RULES.md) — Security baseline, server-side authorization, and vulnerability controls
8. [docs/TESTING_GUIDELINES.md](docs/TESTING_GUIDELINES.md) — Testing tiers, isolation rules, and validation policies
9. [docs/GIT_CONTRIBUTION_RULES.md](docs/GIT_CONTRIBUTION_RULES.md) — Course contribution compliance (commit counts, cadences)
10. [docs/PROJECT_EXECUTION_PLAN.md](docs/PROJECT_EXECUTION_PLAN.md) — Comprehensive 11-phase delivery roadmap
