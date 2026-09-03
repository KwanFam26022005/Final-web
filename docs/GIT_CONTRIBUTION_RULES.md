# Git Contribution and Academic Integrity Rules

This document outlines the strict version control policies, grading compliance requirements, and commit conventions mandated for the **Web Programming & Applications** course project.

---

## 1. Course Contribution Mandates

To satisfy the grading criteria and provide verifiable evidence of collaborative teamwork:

- **Individual Attribution:** Every commit must be authored by an actual, verified team member using their personal Git identity (`git config user.name` and `git config user.email`).
- **No Shared or Generic Accounts:** Using shared user accounts, generic handles (e.g., "team", "admin", "bot"), or authoring commits on behalf of another student is strictly forbidden.
- **Minimum Weekly Cadence:** Each team member must author **at least 2 meaningful commits per calendar week**.
- **Four Consecutive Weeks Requirement:** Active, meaningful contributions must be sustained across **at least 4 consecutive calendar weeks**.
- **No Retroactive Compensation:** Inactive weeks cannot be made up by creating high volumes of commits during later weeks. The requirement evaluates consistent progress over time.
- **No Artificial Commit Splitting:** Do not artificially divide a single coherent task or file change into micro-commits (e.g., separate commits for whitespace, typos, or single lines) to falsely inflate commit counts.
- **Authentic Commit History:** The commit history is an official academic record. Rewriting Git history (interactive rebases, forced pushes, altering authorship timestamps) is prohibited.

---

## 2. Commit Message Standards

Commits must follow the Conventional Commits specification to ensure semantic readability and automated changelog generation.

### Approved Prefixes

- `docs:` Documentation, specification files, architectural decisions, and diagrams.
- `chore:` Build scripts, dependency management, configuration updates, and repository housekeeping.
- `feat:` Implementation of a new user-facing capability, API endpoint, or component.
- `fix:` Bug fixes, patch corrections, or edge-case handling.
- `test:` Creating or updating test suites without modifying business logic.
- `refactor:` Restructuring existing code without modifying external behavior or APIs.

### Structure

```text
<prefix>: <summary in present imperative tense>

[Optional body detailing the rationale, changes made, and impact]

[Optional footer referencing requirement IDs (e.g., Ref: ACC-01)]
```

### Initial Bootstrap Rule

The initial repository governance and specification setup must be committed as a single, coherent bootstrap commit:
`docs: establish project governance and specification baseline`.
