# Implementation Reports

> Part of [`../`](../) — what was built, where it lives, and how it was verified.

---

## Purpose

Answers: **what actually landed in the codebase, and where?**

Written when a feature or a structural change is completed. It is the bridge between a task in `docs/TASKS.md` and the code a reviewer will read.

## Contents

- Task ids closed
- Files and folders created or modified
- Deviations from the written specification, with justification
- Database migrations included
- Environment variables introduced
- How it was verified (link to `../testing/`)
- Known limitations

## Naming

```text
YYYY-MM-DD-<feature-or-change>-report.md
```

## Template

```markdown
# Implementation — <feature or change>

- **Date:** YYYY-MM-DD
- **Tasks closed:** T#.#, T#.#
- **Status:** Complete | Partial (see limitations)

## Scope
What was implemented, in one paragraph.

## Files
| Path | Change |
|---|---|
| backend/src/modules/journals/... | new |

## Database Changes
| Migration | Purpose | Reversible |
|---|---|---|

## Environment
| Variable | Purpose |
|---|---|

## Deviations
| Specification says | Implemented as | Reason |
|---|---|---|

## Verification
Link to ../testing/… ; summary of result.

## Known Limitations
## Follow-ups
```

## Rules

- **Deviations are declared, never hidden.** A silent deviation is the most expensive kind of defect.
- Every migration listed must exist in `database/migrations/` with the stated name.
- Every new environment variable must already be documented in `.env.example`.
- If the implementation is partial, say so plainly and list what remains.
