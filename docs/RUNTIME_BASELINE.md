# Local Runtime Baseline Audit

This document records the exact results of the read-only, non-destructive baseline audit conducted during **Phase 1 Step 1** on the host environment (`D:\Projects\Web-final`).

> **Important Distinction:** The values in this document reflect the **Observed Host Environment** at project inception. They are preserved for reproducibility and risk awareness, distinct from the project's **Formal Compatibility Requirements**.

---

## 1. Toolchain Audit Findings

| Component | Observed Version | Observed Executable Path | Project Requirement | Notes / Precedence |
| :--- | :--- | :--- | :--- | :--- |
| **Git** | `2.51.0.windows.1` | `D:\Program Files\Git\cmd\git.exe` | $\ge 2.40.0$ | Primary. Secondary Laragon Git detected in `C:\laragon\bin\git`. |
| **Node.js** | `v24.18.0` | `C:\Program Files\nodejs\node.exe` | $\ge 20.0.0$ (LTS) | Primary. Secondary Node v22 detected in `C:\laragon\bin\nodejs\node-v22`. |
| **npm** | `11.16.0` | `C:\Program Files\nodejs\npm.cmd` | $\ge 10.0.0$ | Primary. Secondary npm v10 detected in Laragon. |
| **PHP** | `8.3.30` | `C:\laragon\bin\php\php-8.3.30-Win32-vs16-x64\php.exe` | $\ge 8.2.0$ | Single PHP installation in Laragon. ZTS x64 build. |
| **Composer** | `2.9.4` | `C:\laragon\bin\composer\composer.bat` | $\ge 2.7.0$ | Single Composer installation in Laragon. |
| **MySQL Client** | `8.4.3` | `C:\laragon\bin\mysql\mysql-8.4.3-winx64\bin\mysql.exe` | $\ge 8.0.0$ | Community Server GPL x64 client. |
| **Laravel Framework** | `13.30.1` | `backend/artisan` | Current Stable ($\ge 11.0.0$) | Resolved in Phase 1 Step 3 (`laravel/framework: v13.30.1`). |
| **React** | `19.2.8` | `frontend/node_modules/react` | Current Stable ($\ge 18.0.0$) | Resolved in Phase 1 Step 5 (`react`, `react-dom: 19.2.8`). |
| **Vite** | `8.2.2` | `frontend/node_modules/vite` | Current Stable ($\ge 5.0.0$) | Resolved in Phase 1 Step 5 (`vite: 8.2.2`). |
| **Tailwind CSS** | `4.3.3` | `frontend/node_modules/tailwindcss` | Current Stable ($\ge 3.4.0$) | Resolved in Phase 1 Step 5 (`@tailwindcss/vite: 4.3.3`). |
| **TypeScript** | `6.0.3` | `frontend/node_modules/typescript` | Current Stable ($\ge 5.0.0$) | Resolved in Phase 1 Step 5 (`typescript: 6.0.3`). |
| **Docker CLI** | `28.4.0` | `D:\Docker\resources\bin\docker.exe` | $\ge 26.0.0$ | Host Docker binary. |
| **Docker Compose**| `v2.39.4-desktop.1` | `D:\Docker\resources\bin\docker-compose.exe` | $\ge 2.20.0$ | Standalone binary works; `docker compose` plugin syntax unlinked. |

---

## 2. Background Services and Ports

### Service States
- **Docker Daemon (Docker Desktop):** Inactive / stopped during baseline (`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`). Must be launched when container operations begin.
- **MySQL Server:** Active under Laragon (mysqld Community Server 8.4.3, port 3306).
- **Apache (httpd):** Active (PIDs 4116, 7160) under Laragon. Does not occupy frontend or backend target ports.

### Port Verification
The target development ports were inspected via `Get-NetTCPConnection` and `netstat -ano`:
- **Port 5173 (Vite Frontend):** **Available** (Unoccupied)
- **Port 8000 (Laravel Backend API):** **Available** (Unoccupied; validated via temporary HTTP probe in Step 3)
- **Port 3306 (MySQL Database):** **Active** (Occupied by MySQL 8.4.3; validated in Step 4)

---

## 3. Environment Caveats & Operational Rules

1. **Docker Compose Invocation:**
   On this Windows host, invoking `docker compose` produces an `unknown command: docker compose` error because the Docker CLI plugin directory is not linked. Always invoke the standalone executable `docker-compose` or `docker-compose.exe`.

2. **Node.js Precedence:**
   Node v24.18.0 in `C:\Program Files\nodejs` precedes Laragon's Node v22 in system `PATH`. All frontend build scripts, Vite configurations, and test runners must remain compatible with Node v24.

3. **MySQL Server Launch:**
   Before running database migrations or integration tests in subsequent phases, the MySQL service must be started via Laragon or standard service controls without modifying root credentials or existing database configurations.

4. **Git Identity:**
   Git identity is authoritatively bound to the global Git configuration (`KwanFam26022005` / `phdk2602@gmail.com`). AI agents must never modify local or global Git identities.

5. **Laravel Framework Version Resolution (Resolved Phase 1 Step 3):**
   - **Resolution Date:** 2026-09-03 (Phase 1 Step 3 / 3R)
   - **Installed Application Skeleton:** `laravel/laravel`
   - **Installed Framework Version:** `Laravel Framework 13.30.1` (`laravel/framework: v13.30.1`)
   - **Composer Framework Constraint:** `^13.17`
   - **Host Runtime Compatibility Evidence:** Successfully resolved and installed on host PHP `8.3.30` (cli) ZTS Visual C++ 2019 x64 and Composer `2.9.4`. Full test suite and HTTP health probe validated without regressions.

6. **Backend Boundary & Migration Audit (Resolved Phase 1 Step 3R):**
   - **API-Only Backend:** Backend is strictly a headless REST API (`backend/routes/api.php`); generic Laravel frontend assets (`package.json`, `vite.config.js`, `.npmrc`, `resources/css`, `resources/js`, `resources/views/welcome.blade.php`, and `routes/web.php`) were removed. Project frontend belongs exclusively to root `/frontend` (Phase 1 Step 5).
   - **Scaffold SQLite & Migration Audit:** During `composer create-project`, Laravel's default post-create script generated a local `database/database.sqlite` and ran default skeleton migrations (`users`, `cache`, `jobs`). This file remains local, untracked, and gitignored. No MySQL server was started, no MySQL database was created, and no MySQL migrations were executed. Authoritative MySQL schema foundation is deferred to Phase 1 Step 4.
   - **Agent Governance & Boost Policy:** Scaffold-generated `backend/AGENTS.md` and `backend/CLAUDE.md` (which instructed agents to install Laravel Boost and alter host PHP) were removed. Authoritative agent governance remains root `/AGENTS.md`. Laravel Boost is NOT installed.

7. **MySQL Foundation & Database Isolation (Resolved Phase 1 Step 4):**
   - **RDBMS Engine:** MySQL Community Server `8.4.3` (`InnoDB`, `utf8mb4`, `utf8mb4_unicode_ci`)
   - **Development Database:** `final_web` (configured via `.env`)
   - **Testing Database:** `final_web_test` (configured via `.env.testing`, protected by test safety guards)
   - **Migration Repository:** Initialized via `php artisan migrate:install` in both databases; zero domain tables present.
   - **Driver Verification:** `PDO` and `pdo_mysql` confirmed active; automated feature tests pass.

8. **React Frontend Foundation (Resolved Phase 1 Step 5):**
   - **Resolution Date:** 2026-09-03 (Phase 1 Step 5)
   - **Installed Scaffold:** Vite React TypeScript (`react-ts` template)
   - **Installed Versions:**
     - `react`: `19.2.8`
     - `react-dom`: `19.2.8`
     - `typescript`: `6.0.3`
     - `vite`: `8.2.2`
     - `@vitejs/plugin-react`: `6.1.1`
     - `tailwindcss`: `4.3.3`
     - `@tailwindcss/vite`: `4.3.3`
   - **Host Compatibility:** Validated under Node `v24.18.0` and npm `11.16.0`.
   - **Validation Evidence:** `npm run build` (`tsc -b && vite build`) and `npm run lint` (`oxlint`) pass cleanly with 0 errors/warnings; local Vite dev server and preview server verified responding with HTTP 200 OK.
