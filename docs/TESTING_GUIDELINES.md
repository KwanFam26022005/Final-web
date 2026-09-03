# Testing Strategy and Verification Guidelines

This document outlines the testing methodology, verification tiers, execution policies, and acceptance criteria for the Collaborative Intelligent Note Management Web Application.

---

## 1. Core Testing Principle

All feature implementations, fixes, and refactors must strictly satisfy the verification chain:

$$\text{Claim} \longrightarrow \text{Implementation} \longrightarrow \text{Executable Validation} \longrightarrow \text{Evidence} \longrightarrow \textbf{PASS}$$

- **No fake or placeholder passing tests:** Writing empty assertions (`assertTrue(true)`) or stub tests to manufacture false coverage is strictly prohibited.
- **Evidence-based reporting:** A task cannot be marked completed without terminal output or test execution logs confirming green test runs.

---

## 2. Testing Tiers & Framework Allocation

| Tier | Scope | Primary Tooling | Target Directory |
| :--- | :--- | :--- | :--- |
| **Unit Tests** | Pure algorithmic logic, utility functions, data mappers, isolated services | PHPUnit / Vitest | `backend/tests/Unit/`, `frontend/src/**/*.test.ts` |
| **Feature / API Tests** | HTTP endpoints, FormRequest validation, middleware, Policies, Eloquent relationships | PHPUnit / Laravel Test Suite | `backend/tests/Feature/` |
| **Frontend Component Tests** | React component rendering, user events, UI state transitions, mock API interactions | Vitest + React Testing Library | `frontend/src/**/*.test.tsx` |
| **Integration Tests** | Multi-service interactions (e.g., Reverb broadcasts, IndexedDB offline sync, AI adapter mocks) | PHPUnit / Vitest | `backend/tests/Integration/`, `frontend/src/tests/` |
| **End-to-End (E2E) Smoke Tests** | Browser user journeys, infrastructure verification, smoke checks | Playwright (Chromium) | `frontend/e2e/` |

---

## 3. Automated Testing Hierarchy & Tooling

The repository enforces a clear three-tier testing hierarchy executed locally and in CI:

1. **Backend Testing (PHPUnit 11 / Laravel Test Suite):**
   - **Database-Backed Tests:** MUST extend `Tests\DatabaseTestCase`, which enforces that `APP_ENV === 'testing'`, driver is `mysql`, and database is strictly `final_web_test` before trait lifecycle execution.
   - **Database-Independent Tests:** Extend generic `Tests\TestCase` for pure HTTP or mock tests (e.g., `HealthEndpointTest`, `CorsTest`).
   - **Code Quality:** Formatted via `php vendor/bin/pint --test` and validated via `composer validate --strict`.

2. **Frontend Testing (Vitest + React Testing Library + jsdom):**
   - **Runner:** Vitest (`vitest run` via `npm run test:run`) integrated through `frontend/vitest.config.ts`.
   - **Environment:** DOM emulation via `jsdom` with matchers from `@testing-library/jest-dom/vitest`.
   - **Component & Unit:** Tests in `frontend/src/**/*.test.ts` and `frontend/src/**/*.test.tsx`.
   - **Code Quality:** Typechecked via `tsc -b` and linted via `oxlint` (`npm run lint`).

3. **End-to-End Smoke Testing (Playwright):**
   - **Browser:** Managed Chromium headless runner (`npx playwright test`).
   - **Scope (Phase 1):** Infrastructure smoke test verifying page rendering, API health probing, and connectivity state updates.
   - **Disposability:** Test servers are managed by Playwright's `webServer` configuration and automatically terminated upon test completion.

4. **Continuous Integration (GitHub Actions):**
   - Managed by `.github/workflows/ci.yml`.
   - Runs on push to `main` and `phase-1/**` branches, as well as pull requests targeting `main`.
   - Dedicated matrix jobs for `backend`, `frontend`, and `e2e` with containerized MySQL 8.4 service.

## 4. Mandatory Testing Rules

### 1. Happy Path is Insufficient
Testing only successful workflows (e.g., valid registration, successful note creation) is unacceptable. Every test suite must cover:
- **Validation failures:** Empty required fields, oversized payloads, invalid email formats, malformed JSON.
- **Edge cases:** Boundary string lengths, Unicode and emoji character handling, concurrent edits.

### 2. Authorization Boundaries Must Be Exhaustively Tested
For every protected endpoint or resource:
- Test access as an **unauthenticated guest** (must return 401 Unauthorized).
- Test access as an **unauthorized user** attempting to inspect, edit, or delete another user's note (must return 403 Forbidden).
- Test access as a **read-only collaborator** attempting to edit or delete (must return 403 Forbidden).
- Test access as an **authorized user / owner** (must return 200/201/204).

### 3. Database Isolation & Lifecycle Safety
- **Base Class Mandate:** All database-backed Laravel tests **MUST** extend `Tests\DatabaseTestCase` and must never point to `final_web`.
- **Pre-Trait Safety Guard:** `DatabaseTestCase` automatically enforces that `APP_ENV === 'testing'`, active connection is `mysql`, and active database is exactly `final_web_test` before any database-mutating trait setup can execute.
- **Controlled Refresh Strategy:** Where tests modify database state, Laravel's `RefreshDatabase` trait may be used under this protected test base to ensure clean execution. Read-only infrastructure tests (e.g., connection/metadata verification) do not require state wiping.
- **Decoupled Tests:** Tests not requiring persistence (e.g., health probes, isolated unit tests) must extend generic `Tests\TestCase` and remain completely database-independent.
- **Clean Fixtures:** Seeders or model factories must be used to generate isolated test fixtures.

### 4. Regression Testing for Defects
- Any reported bug or defect must first be captured in a reproducing, failing automated test before any code changes are introduced.
- The bug fix is certified complete only when the reproducing test passes without breaking existing suites.
