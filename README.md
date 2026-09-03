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
> **Current Step:** Step 4R — Database Contract and Test-Safety Cleanup (Remediation completed, pending review)<br>
> **Next Authorized Step:** Step 5 — React Frontend Foundation (Do NOT begin yet)

### Implemented:
- Governance and specification foundation
- Rubric alignment, requirement classification, and 11-step execution plan
- Master requirements catalog and rubric traceability
- Architectural decisions and security rules
- Testing guidelines and Git contribution rules
- Runtime environment baseline documentation
- Repository hygiene configuration (`.gitignore`, `.gitattributes`, `.editorconfig`)
- Decoupled API-only Laravel REST API backend foundation (`backend/`, Laravel Framework v13.30.1)
- Minimal infrastructure health endpoint (`GET /api/health`) and automated Feature test
- Clean API-only backend boundary (removal of redundant backend frontend toolchains and conflicting agent instructions)
- MySQL database foundation (MySQL 8.4.3, InnoDB, utf8mb4, dev DB `final_web`, isolated test DB `final_web_test`)
- Migration repository initialized in both databases with zero domain tables
- Automated MySQL foundation feature test (`MySqlFoundationTest`) and automatic `DatabaseTestCase` safety guard

### Not Yet Implemented:
- Frontend application scaffold (`frontend/`)
- Application-domain database schema and migrations (Phase 2+)
- Authentication and account management
- Core and advanced note features (CRUD, labels, attachments, search, pinning)
- Password-protected notes and sharing authorization
- Real-time collaboration (Reverb/Echo)
- AI summarization and note-grounded Q&A
- PWA, Service Worker, and IndexedDB offline synchronization
- Docker Compose services

> [!WARNING]
> **No application source code exists yet.** Do not attempt to run frontend dev servers or backend services until scaffolding is authorized in subsequent Phase 1 steps.

---

## 4. Phase Roadmap

| Phase | Description | Status |
| :--- | :--- | :--- |
| **Phase 0** | Specification Freeze & Project Decisions | **COMPLETED** |
| **Phase 1** | Repository & Runtime Foundation | **IN PROGRESS** (Step 2R Active; Step 3 Next) |
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

## 5. Repository Layout

### Current Structure:
```text
.
├── .editorconfig
├── .gitattributes
├── .gitignore
├── AGENTS.md
├── CONTRIBUTING.md
├── README.md
└── docs/
    ├── ARCHITECTURE_DECISIONS.md
    ├── GIT_CONTRIBUTION_RULES.md
    ├── MASTER_REQUIREMENTS.md
    ├── PROJECT_EXECUTION_PLAN.md
    ├── RUBRIC_TRACEABILITY.md
    ├── RUNTIME_BASELINE.md
    ├── SCOPE_AND_CONSTRAINTS.md
    ├── SECURITY_RULES.md
    └── TESTING_GUIDELINES.md
```

### Planned Target Structure:
```text
.
├── frontend/             # React + TypeScript + Vite SPA
├── backend/              # Laravel REST API
├── docker/               # Custom Docker configuration
├── docs/                 # Authoritative project specifications
├── docker-compose.yml    # Development & deployment orchestration
└── ...
```

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
