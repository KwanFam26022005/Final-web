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
| **End-to-End (E2E) Tests** | Full browser user journeys, authentication flows, cross-client realtime sync | Playwright | `tests/e2e/` |

---

## 3. Mandatory Testing Rules

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

### 3. Database Isolation
- Backend tests interacting with the database must run against the dedicated testing MySQL database (`final_web_test`).
- Database-backed Laravel Feature/Integration tests must extend `DatabaseTestCase` and must never point to `final_web`.
- Use Laravel's `RefreshDatabase` trait to ensure each test executes in a clean state.
- Seeders or factories must be used to generate clean fixtures.

### 4. Regression Testing for Defects
- Any reported bug or defect must first be captured in a reproducing, failing automated test before any code changes are introduced.
- The bug fix is certified complete only when the reproducing test passes without breaking existing suites.
