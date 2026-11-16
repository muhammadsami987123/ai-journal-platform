# Bug Reports

> Part of [`../`](../) — defects and their resolution.

---

## Purpose

Answers: **what broke, how to reproduce it, why, and what fixed it?**

One file per defect. Created on discovery, updated with the fix, closed with evidence.

## Contents

- Reproduction steps (minimal, deterministic)
- Expected vs. actual behaviour
- Impact: which requirement and which users are affected
- Severity
- Root cause
- Fix reference (commit / migration / task id)
- Verification that it cannot recur

## Naming

```text
YYYY-MM-DD-<short-slug>.md
```

## Template

```markdown
# <Short title>

- **Date found:** YYYY-MM-DD
- **Severity:** Critical | High | Medium | Low
- **Status:** Open | Fixed | Won't fix | Duplicate of <file>
- **Requirement:** FR-###
- **Affected area:** frontend/calendar | backend/journals | ...

## Reproduction
1. ...
2. ...
Expected:
Actual:

## Impact
Who is affected and how badly.

## Root Cause
The actual defect, not the symptom.

## Fix
Commit <sha>, migration <file>. What changed and why this is the correct level to fix it.

## Regression Test
Test name in tests/... that now covers it.

## Notes
Anything learned; related reports.
```

## Severity Guide

| Level | Meaning |
|---|---|
| Critical | Data loss, privacy breach, or auth bypass |
| High | A P0 feature is unusable |
| Medium | Feature works with a significant workaround |
| Low | Cosmetic or minor friction |

## Rules

- **Privacy defects are always Critical**, even if cosmetic — a cross-account leak or a journal excerpt in a log is a Critical.
- Root cause, not symptom. "Fixed the button" is not a root cause.
- Never delete a bug report; mark it duplicate or won't-fix with a reason.
