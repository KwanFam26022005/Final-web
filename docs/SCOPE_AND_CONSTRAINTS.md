# Project Scope and Constraints

This document defines the strict boundary lines, included product capabilities, excluded technical patterns, and system constraints for the Collaborative Intelligent Note Management Web Application.

---

## 1. Product Boundary & In-Scope Capabilities

The application is purpose-built as a full-stack, collaborative, intelligent note-management web platform. All features developed must fall directly within these functional boundaries:

### Account & Identity
- Mandatory authenticated session for private application access.
- User registration accepting strictly: email, display name, password, and password confirmation, with automatic login upon successful registration.
- Secure password hashing natively handled by Laravel (`bcrypt` mandatory; plaintext never stored).
- Account activation email flow; unverified accounts remain functional during a grace period but display a prominent warning banner.
- Profile management: display name modification, avatar upload, and password changes.
- UI preferences persistence (view modes, theme choices).
- Password recovery via secure email reset link or secure OTP flow. After successful reset, the user is NOT automatically authenticated and must log in manually.

### Core Notes
- Dual-mode visualization: responsive Grid view (default) with toggle to List view.
- Unified creation and editing interaction model (shared modal or workspace canvas).
- Primary user-facing required note fields: Title and Content.
- Continuous, debounced autosave with visual save/sync indicators.
- Safe deletion flow with explicit user confirmation before deletion is executed. (Trash / soft delete is not a mandatory product requirement).
- Categorization through Many-to-Many labels (CRUD, color/tags, filtering).
- Live debounced search (~300 ms guidance) on note title and body content without full-page reloads.
- Attachment management for allowed file types with backend validation.
- Pinned notes hierarchy maintaining priority positioning at the top of the interface with visual indicator.

### Advanced Notes & Collaboration
- Individual per-note password protection with server-side unlock verification and visual locked indicator.
- Direct note sharing with registered platform users via email address.
- Granular permissions: Read-only (`read`) and Read-write (`edit`) enforced server-side.
- Recipient-facing shared-note metadata: permission level, identity of sharing user, and sharing timestamp.
- Distinct visual state indicators distinguishing pinned, shared, and locked notes.
- Real-time multi-user editing via Laravel Reverb and Echo (authorized collaborators receive live WebSocket updates).
- (Optional / Future Enhancement: live presence indicators, avatars, cursors, and owner collaborator revocation UI; not mandatory for phase pass).

### Artificial Intelligence
- Service layer abstraction decoupled from underlying LLM vendors.
- Single-note content summarization on demand.
- Question answering across user-accessible notes.
- Mandatory source note citation in AI responses, referencing originating notes.
- Strict authorization isolation: AI queries can never inspect notes outside the user's explicit access perimeter.

### PWA & Offline Support
- Mobile, tablet, and desktop responsive layout via Tailwind CSS.
- Progressive Web App (PWA) manifest and Service Worker caching.
- Client-side persistence using browser JavaScript database (IndexedDB; Dexie is a candidate library for Phase 8, not a permanent requirement).
- Offline creation, editing, and staging queue with automatic synchronization upon reconnection.

### Deployment & Demonstration
- Self-contained multi-container Docker Compose configuration (Phase 1: frontend, backend, MySQL; Phase 6: Reverb; Phase 10: production hardening).
- GitHub Actions CI automated testing and linting workflow established in Phase 1 and finalized in Phase 10.
- Publicly demonstrable deployment endpoint for project evaluation.

---

## 2. Explicitly Excluded / Deferred Technologies

To maintain architectural focus and avoid unnecessary system complexity, the following technologies are **explicitly out-of-scope** and must **NOT** be introduced without formal ADR amendment:

| Technology | Status | Rationale |
| :--- | :--- | :--- |
| **Redis** | **DEFERRED** | Database/cache handled via MySQL and file/cookie drivers initially; Reverb handles WebSocket server directly. |
| **RabbitMQ** | **EXCLUDED** | Async tasks (mail, AI queries) managed natively via Laravel database queue driver. |
| **Kubernetes** | **EXCLUDED** | Architecture targets Docker Compose; Kubernetes introduces unnecessary orchestration overhead for this scope. |
| **External Vector DB** | **DEFERRED** | AI note Q&A will utilize lightweight relational indexing or direct prompt context grounding before considering standalone vector stores (e.g., Pinecone, Milvus, Qdrant). |
| **Autonomous Agent Frameworks** | **EXCLUDED** | Complex multi-agent frameworks (LangChain, AutoGen, CrewAI) exceed requirements; use clean provider-neutral HTTP/SDK services. |
| **Microservices** | **EXCLUDED** | The backend is a clean, modular monolith REST API in Laravel. |
| **JWT Authentication** | **EXCLUDED** | SPA uses first-party cookie/session authentication via Laravel Sanctum; raw JWTs introduce token storage and revocation vulnerabilities. |
| **Inertia.js** | **EXCLUDED** | Full decoupled architecture (Vite + React SPA separate from Laravel REST API) is mandated. |

---

## 3. System and Environmental Constraints

### Local Toolchain Constraints
- **PHP:** Version 8.3.x on Windows (Laragon toolchain).
- **Composer:** Version 2.9.x.
- **Node.js:** Primary Node v24.18.0 (system PATH) is the authoritative frontend runtime.
- **MySQL:** Version 8.4.x / 8.0.x compatible with InnoDB and `utf8mb4_unicode_ci`.
- **Docker Compose:** Must execute via `docker-compose` binary on the host Windows environment due to CLI plugin configurations.

### Performance Constraints
- **Autosave Debounce:** Client-side autosave debounce must fire between 500ms and 1500ms after user pauses typing.
- **Search Latency:** Local note filtering must execute within 100ms for collections up to 1,000 notes.
- **Payload Limits:** Note attachments strictly capped at 10 MB per file.

### Security Constraints
- **Zero Plaintext Secrets:** Passwords, database credentials, and API keys must never be committed to Git.
- **Mandatory Server-Side Enforcement:** Frontend UI visibility flags (e.g., hiding edit buttons) are UX affordances only; backend authorization policies are mandatory for every mutation.
