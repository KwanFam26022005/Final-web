# Frontend Application — Collaborative Intelligent Note Management

This package contains the standalone, decoupled React single-page application (SPA) for the Collaborative Intelligent Note Management Web Application.

---

## 1. Architectural Role

- **Architecture:** Decoupled client-side React SPA.
- **Toolchain:** React 19, TypeScript, Vite, Tailwind CSS v4.
- **Boundary:** Completely decoupled from the Laravel backend (`/backend`). Communicates solely via REST API over HTTP/JSON (deferred to Phase 1 Step 6).

---

## 2. Development Setup

From the `frontend/` directory:

```bash
# Install dependencies
npm install

# Start local development server (default http://127.0.0.1:5173)
npm run dev

# Run TypeScript compilation and production bundle build
npm run build

# Run code linter
npm run lint

# Run unit & component tests (Vitest)
npm run test:run

# Run E2E smoke tests (Playwright Chromium)
npm run test:e2e

# Preview production build locally
npm run preview
```

---

## 3. Environment Configuration

The frontend template is defined in `.env.example`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Laravel backend REST API URL | `http://127.0.0.1:8000` |

> **Security Note:** All `VITE_*` variables are embedded directly into public browser bundles. Never place server credentials, database passwords, or private API keys in frontend environment files.

---

## 4. Current Status

- **Foundation Established (Phase 1 M4):** React 19, TypeScript, Vite, and Tailwind CSS v4 active.
- **Backend API Integration (Phase 1 M5):** Native fetch abstraction, infrastructure health checks, and narrow CORS verified.
- **Automated Testing Foundation (Phase 1 M6):** Vitest + Testing Library unit/component tests and Playwright E2E smoke tests active.
