# AI Coding Agent Governance and Execution Policy

This document defines the authoritative operating rules and constraints for all AI coding agents working on this repository. Every automated or assisted interaction must adhere strictly to the policies stated below.

---

## 1. Source of Truth Order

When resolving questions of scope, behavior, architecture, or priority, agents must evaluate specifications in the following strict hierarchy:

1. [`docs/MASTER_REQUIREMENTS.md`](docs/MASTER_REQUIREMENTS.md) — Definitive product and technical requirements
2. [`docs/SCOPE_AND_CONSTRAINTS.md`](docs/SCOPE_AND_CONSTRAINTS.md) — Boundary lines, inclusions, exclusions, and technology guardrails
3. [`docs/ARCHITECTURE_DECISIONS.md`](docs/ARCHITECTURE_DECISIONS.md) — Binding architectural decisions (ADRs)
4. [`docs/RUBRIC_TRACEABILITY.md`](docs/RUBRIC_TRACEABILITY.md) — Verification criteria and evaluation mappings
5. **Phase-specific execution instructions** — Active task prompt provided by the project orchestrator
6. **Implementation code and tests** — Existing source artifacts in the repository

Lower-tier sources may never contradict or override higher-tier sources without explicit written directive.

---

## 2. Universal Agent Rules

- **Never invent requirements:** Implement only what is explicitly specified in the active phase and requirement catalog.
- **Never silently expand scope:** Do not pull in optional features, additional dependencies, or external tools unless mandated.
- **Never promote planned work to implemented work:** Status reports must accurately state what is verified by evidence. A file's existence does not mean functionality is complete.
- **Preserve phase boundaries:** Never execute tasks assigned to future phases. If a phase instruction requires scaffolding or dependencies, install only what is scheduled for that phase.
- **Server-side authorization is authoritative:** Never trust client-side state or rely solely on UI controls to enforce security, ownership, or permission checks.
- **Never commit secrets:** No `.env` files with credentials, API tokens, passwords, private keys, or certificates may ever be staged or committed.
- **Never modify Git identity:** Do not run commands that alter `user.name` or `user.email`. Academic contribution attribution requires integrity of individual history.
- **Never rewrite Git history:** `git rebase -i`, `git commit --amend` on published commits, and history resets are strictly prohibited unless authorized.
- **No force pushes:** Commands matching `git push --force` or `git push -f` are forbidden.
- **No destructive database commands:** Do not execute `migrate:fresh`, `db:wipe`, or drop tables unless the active phase specifically calls for environment re-seeding.
- **No global machine configuration changes:** Do not modify system-wide PATH, install Windows services, or adjust global system settings.
- **Do not modify local server configs:** Do not edit Laragon, XAMPP, or Windows service configuration files without explicit instruction.

---

## 3. Shell Execution Policy

To preserve Antigravity tool permission matching and maintain unambiguous execution audit trails:

- **Execute commands directly:** Call CLI tools by their standard command name (e.g., `git`, `npm`, `composer`, `php`).
- **Prefer one command per shell invocation:** Do not batch unrelated tasks together.
- **Do not prepend shell decorators:** Never prepend `Write-Output`, `echo`, `printf`, or similar logging statements to commands.
- **Do not chain unrelated commands:** Avoid chaining commands using `;`, `&&`, `||`, or pipeline tricks where separate tool calls are appropriate.
- **Avoid shell wrappers:** Do not wrap simple commands inside `powershell -Command "..."`, `cmd /c "..."`, or `bash -c "..."` when the executable can be run directly.
- **Never bypass permission rules:** Do not attempt prefix or obfuscation patterns to bypass shell policy filters.

### Examples

**Correct (DO):**
```powershell
git status
```
```powershell
node --version
```
```powershell
npm --version
```

**Incorrect (DO NOT):**
```powershell
Write-Output "git"; git status; node --version
```
```powershell
cmd /c "git status && npm test"
```

---

## 4. The Evidence / Pass Rule

A requirement or phase step may only be certified as **PASS** through the rigorous verification chain:

$$\text{Claim} \longrightarrow \text{Implementation} \longrightarrow \text{Executable Validation / Test} \longrightarrow \text{Evidence} \longrightarrow \textbf{PASS}$$

- **Claim:** The specific requirement or capability being addressed.
- **Implementation:** The actual, reviewed code conforming to architectural guidelines.
- **Executable Validation:** An automated test, script execution, or CLI verification command run directly on the working environment.
- **Evidence:** Concrete terminal output, test results, logs, or command exit codes demonstrating success.
- **PASS:** Granted only after tangible evidence is produced and verified.

> **Crucial Rule:** The existence of a file, component, or endpoint does not constitute proof that functionality works. Only reproducible test evidence constitutes proof.
