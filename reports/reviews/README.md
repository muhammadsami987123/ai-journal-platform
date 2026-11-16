# Reviews

> Part of [`../`](../) — code, architecture and decision records.

---

## Purpose

Answers: **what was reviewed, what was decided, and why?**

Two kinds of record live here:

1. **Reviews** — an assessment of code or architecture against the project's own standards.
2. **Decision records** — an irreversible or expensive choice, with the alternatives considered.

## Contents

- Scope reviewed (paths, PR, document)
- What was checked (against `docs/DEVELOPMENT_GUIDELINES.md` quality gates and `docs/ARCHITECTURE.md` invariants)
- Findings, ordered by severity
- Decisions taken, with rationale and rejected alternatives
- Required follow-ups

## Naming

```text
YYYY-MM-DD-<subject>-review.md
YYYY-MM-DD-decision-<topic>.md
```

## Template — Review

```markdown
# Review — <subject>

- **Date:** YYYY-MM-DD
- **Scope:** <paths / PR / document>
- **Reviewer:** <name>

## Verdict
Approve | Approve with changes | Request changes

## Checked
- [ ] Authorization scoped by user_id on every query
- [ ] Immutability of original_text / transcriptions preserved
- [ ] No secrets or journal text in logs
- [ ] Loading / empty / error states present
- [ ] Keyboard and focus behaviour verified

## Findings
| # | Severity | Finding | Location | Action |
|---|---|---|---|---|

## Follow-ups
```

## Template — Decision Record

```markdown
# Decision — <topic>

- **Date:** YYYY-MM-DD
- **Decision id:** D# (see docs/TASKS.md § Open Decisions)
- **Status:** Proposed | Accepted | Superseded

## Context
## Options Considered
| Option | Pros | Cons |
## Decision
## Consequences
## Revisit If
```

## Rules

- **Invariants are checked explicitly.** A review that does not confirm user-scoped authorization and immutability is incomplete.
- Decision records close an open decision id; the id must then be marked resolved in `docs/TASKS.md`.
- Reviews are historical: do not edit after the verdict — append a follow-up review.
