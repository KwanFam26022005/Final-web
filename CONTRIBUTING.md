# Contributing Guidelines

Welcome to the **Collaborative Intelligent Note Management Web Application** repository. All contributors (including team members, peer reviewers, and assisting AI agents) must follow the standards and academic compliance policies documented here.

---

## 1. Academic Course Contribution Requirements

This project is submitted for the **Web Programming & Applications** course. Grading criteria require transparent, equitable, and sustained individual participation:

- **Attribution to actual team members:** Commits must be authored by verified individual team members using their assigned personal Git credentials.
- **No shared identities:** Team members must never commit using a shared account, a generic handle, or another member's credentials.
- **Regular cadence:** Each team member must author **at least 2 meaningful commits per calendar week**.
- **Sustained participation:** Active contribution must be preserved across **at least 4 consecutive calendar weeks**.
- **No week-end batching:** Deficits in earlier weeks cannot be retroactively compensated by flooding the repository with bulk commits in later weeks.
- **Authentic logical units:** Do not artificially split a single cohesive change into multiple trivial commits (e.g., separating single-line changes or reformatting) to inflate commit volume.
- **Preservation of history:** Authorship, timestamps, and commit history must remain authentic. Rebase flattening, amending published commits, or rewriting history is prohibited.

---

## 2. Commit Message Conventions

We adhere to a standard Conventional Commits prefix scheme. Commit messages must be clear, imperative, and describe the *why* and *what* of the change.

### Approved Prefixes

- `feat:` Introduces a new user-facing capability or API feature.
- `fix:` Patches a bug, defect, or broken test.
- `docs:` Documentation-only modifications, specifications, or architectural updates.
- `chore:` Maintenance tasks, dependency bumps, configuration changes, or repository hygiene.
- `test:` Adding, refactoring, or correcting automated tests without modifying product code.
- `refactor:` Code restructuring that neither adds functionality nor fixes a bug.

### Format

```text
<prefix>: <concise description in imperative mood>

[optional body explaining motivation, context, and decisions]

[optional footer referencing requirement IDs or issues]
```

### Initial Bootstrap Rule
The initial repository governance and specification setup must be committed as a single, coherent bootstrap commit:
`docs: establish project governance and specification baseline`.

---

## 3. Workflow and Branching

- **Authoritative Branch:** `main` reflects the stable, verified state of the project.
- **Feature / Phase Branches:** Work on discrete phases, requirements, or subsystems must be developed on focused branches (e.g., `phase-1/tooling-scaffold`, `phase-2/sanctum-auth`).
- **Clean Working Tree:** Always ensure your working tree is clean before checking out branches or pulling remote updates.
- **Atomic Changes:** Keep commits focused on a single logical task or requirement.

---

## 4. Testing and Verification Standards

- Every pull request or merge to `main` must maintain passing test suites.
- No code will be accepted without matching test coverage (see [`docs/TESTING_GUIDELINES.md`](docs/TESTING_GUIDELINES.md)).
- Follow the **Claim → Implementation → Executable Validation → Evidence → PASS** principle before claiming task completion.
- Never bypass linting, type checks, or unit test runners.
