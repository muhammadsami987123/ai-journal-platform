# Testing Reports

> Part of [`../`](../) — verification evidence.

---

## Purpose

Answers: **does it actually work, and which requirements are proven?**

Every verification pass produces one report. A requirement is only "done" when a report names it and shows the evidence.

## Contents

- Environment tested against (real Neon branch, browser versions, commit)
- Requirement ids exercised (`FR-###`, `NFR-###`) and result
- Two-account isolation checks
- Failure-mode checks (DB down, AI down, mic denied, session expired)
- Responsive and accessibility results
- Anything that failed, with a link to the bug report

## Naming

```text
YYYY-MM-DD-<area>-verification.md
```

## Template

```markdown
# Verification — <area>

- **Date:** YYYY-MM-DD
- **Commit:** <sha>
- **Environment:** Neon branch <name>, Chrome <ver>, 390px / 1024px

## Results
| Requirement | Check performed | Result | Evidence |
|---|---|---|---|
| FR-203 | Completing an empty entry is rejected | PASS | 422 ENTRY_EMPTY |
| NFR-002 | User B requests user A's entry id | PASS | 404 |

## Failures
| Requirement | Observed | Bug report |
|---|---|---|
| FR-505 | Calendar issued 31 requests | ../bugs/... |

## Not Covered
- <what was skipped and why>
```

## Rules

- **PASS requires evidence** — a status code, a test name, a screenshot reference, a query result.
- "Looks fine" is not a result.
- Never edit a previous verification report; write a new pass.
- Test data is synthetic; no real journal content is captured in screenshots.
