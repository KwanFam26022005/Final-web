# Local Configuration Guide

This document describes local environment configuration for running the project locally and via Docker Compose.

---

## 1. Host-level Development (Without Docker)

### Backend (`backend/`)

Copy `.env.example` to `.env` and configure:

```sh
cp backend/.env.example backend/.env
php artisan key:generate
```

Key variables:

| Variable | Local Value |
|---|---|
| `DB_CONNECTION` | `mysql` |
| `DB_HOST` | `127.0.0.1` |
| `DB_PORT` | `3306` |
| `DB_DATABASE` | `final_web` |
| `DB_USERNAME` | *(your MySQL username)* |
| `DB_PASSWORD` | *(your MySQL password)* |

For local testing, a separate `backend/.env.testing` isolates the `final_web_test` database.

### Frontend (`frontend/`)

No environment file is required for host-level development. The Vite dev server uses the default API base of `http://127.0.0.1:8000`.

---

## 2. Docker Compose Runtime

### Prerequisites

- Docker Desktop running (verify with `docker info`)
- Both `docker compose` (V2 plugin) and `docker-compose` (standalone) are supported

### Setup Steps

1. **Copy the template:**

   ```sh
   cp .env.docker.example .env.docker
   ```

2. **Edit `.env.docker`** and set real values for:

   | Variable | Description |
   |---|---|
   | `APP_KEY` | Laravel encryption key — generate with `php artisan key:generate --show` |
   | `MYSQL_ROOT_PASSWORD` | MySQL root account password inside container |
   | `DB_USERNAME` | Application database user |
   | `DB_PASSWORD` | Application database user password |
   | `VITE_API_BASE_URL` | Backend URL embedded in the frontend build (default: `http://127.0.0.1:8000`) |

   > **Security:** Never commit `.env.docker` to version control. It is listed in `.gitignore`.

3. **Verify configuration:**

   ```sh
   docker-compose --env-file .env.docker config
   ```

4. **Build images:**

   ```sh
   docker-compose --env-file .env.docker build --no-cache
   ```

5. **Start the stack:**

   ```sh
   docker-compose --env-file .env.docker up -d
   ```

6. **Verify health:**

   ```sh
   docker-compose --env-file .env.docker ps
   ```

   All three containers (`final-web-mysql`, `final-web-backend`, `final-web-frontend`) should reach `healthy` status.

7. **Verify endpoints:**

   - Frontend: `http://127.0.0.1:5173/`
   - Backend health: `http://127.0.0.1:8000/api/health`
   - Database health: `http://127.0.0.1:8000/api/health/database`

8. **Shutdown and clean:**

   ```sh
   docker-compose --env-file .env.docker down -v
   ```

   This stops all containers, removes the Compose network, and deletes the `mysql_data` named volume.

---

## 3. Docker Architecture Notes

### Service Dependency Order

```
MySQL (healthy)
  → Backend (starts, runs migrations, starts artisan serve)
    → Frontend (static nginx serving SPA)
```

Health-based `depends_on` ensures each layer is ready before the next starts.

### Backend–MySQL Communication

The backend container connects to MySQL via the internal Compose network:

```
DB_HOST=mysql
DB_PORT=3306
```

The host's Laragon MySQL at port 3306 is **not used** by the Docker stack. There is no host port binding for MySQL in the Compose file to avoid collision.

### Frontend Build Arguments

`VITE_API_BASE_URL` is a **build-time** argument injected during `npm run build`. It becomes embedded in the static JavaScript bundle. This variable is non-secret (public client-side URL).

---

## 4. Database Baseline

Docker MySQL is configured to match the repository database contract:

- **Image:** `mysql:8.4`
- **Database:** `final_web`
- **Charset:** `utf8mb4`
- **Collation:** `utf8mb4_unicode_ci`

These are set via MySQL server flags:

```yaml
command:
  - --character-set-server=utf8mb4
  - --collation-server=utf8mb4_unicode_ci
```

---

## 5. Secret Policy

| File | Tracked? | Contains Secrets? |
|---|---|---|
| `.env.docker.example` | ✅ Yes | ❌ No (placeholder values only) |
| `.env.docker` | ❌ No (gitignored) | ✅ Yes (local values) |
| `backend/.env` | ❌ No (gitignored) | ✅ Yes |
| `backend/.env.testing` | ❌ No (gitignored) | ✅ Yes |

No real passwords, APP_KEY values, or MYSQL_ROOT_PASSWORD may ever be committed to the repository.
