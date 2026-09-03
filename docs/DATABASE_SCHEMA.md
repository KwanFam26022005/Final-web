# Database Architecture and Schema Specification

This document defines the authoritative database runtime standards, environment isolation boundaries, physical migration baseline, and planned conceptual entity relationships for the Collaborative Intelligent Note Management Web Application.

> **Status Notice:** This document records the **Foundation Baseline** established in **Phase 1 Step 4 / 4R**. At this stage, only Laravel's migration repository infrastructure (`migrations` table) exists physically in the database. Domain entities documented below represent conceptual architectural intent; concrete physical columns, indexes, and constraints will be authored and frozen in their respective implementation phases.

---

## 1. Database Runtime Standards

All persistence environments must strictly adhere to the following database standards:

- **RDBMS Engine:** MySQL 8.x (Host verified: MySQL Community Server `8.4.3`)
- **Default Storage Engine:** `InnoDB` (ACID compliance, row-level locking, foreign key enforcement)
- **Character Set:** `utf8mb4` (Full 4-byte UTF-8 support including emojis and multilingual text)
- **Collation:** `utf8mb4_unicode_ci` (Unicode Collation Algorithm standard)
- **Timezone:** `UTC` (All timestamps stored in UTC)

---

## 2. Environment Isolation

The application enforces strict database separation between runtime environments:

| Environment | Database Name | Purpose | Access Policy |
| :--- | :--- | :--- | :--- |
| **Development** | `final_web` | Local developer runtime | Bound via `.env`; migrations executed deliberately per phase |
| **Testing** | `final_web_test` | Automated test suite & CI | Bound via `.env.testing`; protected by automatic test safety guards |
| **Production** | Defined at deploy | Future production environment | Isolated credentials; managed container / hosted RDS |

### Test Database Safety Guard
To prevent accidental test mutation under the governed test hierarchy:
- All database-backed tests **MUST** extend `Tests\DatabaseTestCase`.
- `Tests\DatabaseTestCase` automatically verifies during `setUpTraits()` before database-mutating testing traits operate that:
  1. `APP_ENV` is strictly `testing`.
  2. The active database connection is `mysql`.
  3. The active database name equals exactly `final_web_test`.
- If any condition is violated, a `RuntimeException` is immediately thrown before any database-mutating trait (such as `RefreshDatabase`) or test query can execute.
- Generic non-database tests (such as `HealthEndpointTest`) extend `Tests\TestCase` and remain completely database-independent.

---

## 3. Current Physical Schema Baseline (Phase 1 Step 4 / 4R)

In accordance with Phase 1 boundary rules, generic Laravel scaffold migrations (`users`, `cache`, `jobs`) were audited and removed before initialization. The physical database contains only the framework migration repository table:

### Table: `migrations`
Established via `php artisan migrate:install`.

| Column | Type | Attributes | Description |
| :--- | :--- | :--- | :--- |
| `id` | `INT UNSIGNED` | Primary Key, Auto Increment | Unique migration ID |
| `migration` | `VARCHAR(255)` | Not Null | Migration file name identifier |
| `batch` | `INT` | Not Null | Execution batch grouping number |

**Current Physical Table Inventory:**
- `final_web`: `migrations` (1 table)
- `final_web_test`: `migrations` (1 table)
- **Domain Tables Present:** None

---

## 4. Planned Conceptual Domain Entities

The application domain schema will be introduced in strict phase sequence. The following definitions specify conceptual relationships and rubric constraints without prematurely freezing physical column names or types.

```mermaid
erDiagram
    USERS ||--o{ NOTES : owns
    USERS ||--o| USER_PREFERENCES : configures
    USERS ||--o{ NOTE_SHARES : grants
    NOTES ||--o{ NOTE_SHARES : shared_via
    NOTES ||--o{ ATTACHMENTS : contains
    NOTES }o--o{ LABELS : categorizes
```

### Conceptual Entity Overview

1. **`users` (Phase 2: Authentication & Account Management)**
   - **Entity Purpose:** Central identity record for registered application users.
   - **Relationship Intent:** 1-to-many with notes; 1-to-1 with user preferences; 1-to-many with sharing records.
   - **Phase Ownership:** Phase 2.
   - **Rubric & Frozen Constraints:** Unique email address, display name, bcrypt password representation (`ACC-03`), email verification state (`ACC-04`). Registration password confirmation is strictly request-level validation and is not modeled as a database column. Concrete column naming (`password` vs `password_hash`) and authentication state belong to Phase 2; authentication architecture uses Sanctum first-party cookie/session (personal access tokens are not required).

2. **`user_preferences` (Phase 2 / Phase 9: UX Preferences)**
   - **Entity Purpose:** Stores user-configurable UI settings (e.g., theme preference).
   - **Relationship Intent:** 1-to-1 with `users`.
   - **Phase Ownership:** Phase 2 / Phase 9.

3. **`notes` (Phase 3: Core Notes Management)**
   - **Entity Purpose:** Primary note content and metadata.
   - **Relationship Intent:** Many-to-1 with `users`.
   - **Phase Ownership:** Phase 3 (Core CRUD), Phase 4 (Pinning), Phase 5 (Protection).
   - **Rubric & Frozen Constraints:** Requires storage for owner relationship, title, content, pin state (`NOTE-06`, Phase 4), password protection representation (`SHARE-01`, Phase 5), and timestamps. Speculative fields (e.g., archive state) are excluded.

4. **`labels` (Phase 4: Organization)**
   - **Entity Purpose:** User-defined organization tags.
   - **Relationship Intent:** Many-to-1 with `users`; many-to-many with `notes`.
   - **Phase Ownership:** Phase 4.
   - **Rubric Constraints:** User-scoped label identity. Uniqueness constraints and junction table design are finalized in Phase 4. Non-rubric attributes (e.g., color codes) are omitted.

5. **`note_label` (Phase 4: Organization Junction)**
   - **Entity Purpose:** Many-to-many association linking notes with labels.
   - **Relationship Intent:** Junction between `notes` and `labels`.
   - **Phase Ownership:** Phase 4.

6. **`attachments` (Phase 4: Attachments)**
   - **Entity Purpose:** File attachment records linked to individual notes.
   - **Relationship Intent:** Many-to-1 with `notes`.
   - **Phase Ownership:** Phase 4.
   - **Rubric Constraints:** Requires file metadata sufficient for secure storage and MIME validation. Exact column definitions are finalized in Phase 4.

7. **`note_shares` (Phase 5: Collaborative Sharing)**
   - **Entity Purpose:** Granular note access delegations between users.
   - **Relationship Intent:** Many-to-1 with `notes`; references sharer and recipient users.
   - **Phase Ownership:** Phase 5.
   - **Rubric Constraints:** Exposes note identity, sharer identity, recipient identity, permission level (`read` | `edit`), and sharing timestamp (`SHARE-05`).

8. **AI Persistence (Phase 7: AI Integration — Deferred)**
   - **Status:** **DEFERRED TO PHASE 7 IF REQUIRED**.
   - No speculative schema (such as embeddings, vector tables, summary caches, or audit tables) is mandated. Phase 7 will determine whether persistent AI state is necessary.

---

## 5. Phase Schema Delivery Roadmap

| Phase | Milestone | Scope / Tables Introduced |
| :--- | :--- | :--- |
| **Phase 1 (Step 4 / 4R)** | **Foundation** | Physical `migrations` repository table only. |
| **Phase 2** | **Auth & Accounts** | `users`, password reset representation (Sanctum SPA cookie/session; no personal access tokens required). |
| **Phase 3** | **Core Notes** | `notes`. |
| **Phase 4** | **Labels & Files** | `labels`, `note_label`, `attachments`. |
| **Phase 5** | **Sharing & Protection** | `note_shares`, note password protection representation. |
| **Phase 6** | **Realtime Collab** | WebSocket broadcast events (ephemeral; no persistent tables required). |
| **Phase 7** | **AI Features** | Deferred to Phase 7 if persistence is required. |
| **Phase 8** | **Offline & PWA** | Client-side IndexedDB mirror schema (browser-side). |
