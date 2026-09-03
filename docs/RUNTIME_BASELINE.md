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
| **Docker CLI** | `28.4.0` | `D:\Docker\resources\bin\docker.exe` | $\ge 26.0.0$ | Host Docker binary. |
| **Docker Compose**| `v2.39.4-desktop.1` | `D:\Docker\resources\bin\docker-compose.exe` | $\ge 2.20.0$ | Standalone binary works; `docker compose` plugin syntax unlinked. |

---

## 2. Background Services and Ports

### Service States
- **Docker Daemon (Docker Desktop):** Inactive / stopped during baseline (`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`). Must be launched when container operations begin.
- **MySQL Server:** Stopped during baseline. Windows Service `mysql` exists in `Stopped` state. No `mysqld` process listening.
- **Apache (httpd):** Active (PIDs 4116, 7160) under Laragon. Does not occupy frontend or backend target ports.

### Port Verification
The target development ports were inspected via `Get-NetTCPConnection` and `netstat -ano`:
- **Port 5173 (Vite Frontend):** **Available** (Unoccupied)
- **Port 8000 (Laravel Backend API):** **Available** (Unoccupied)
- **Port 3306 (MySQL Database):** **Available** (Unoccupied)

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

5. **Laravel Framework Version Resolution:**
   The exact major/minor Laravel version is not pre-selected. It will be resolved, frozen, and recorded here during Phase 1 Step 3 after verifying the latest compatible stable release against the host PHP 8.3.30 and Composer 2.9.4 runtime.
