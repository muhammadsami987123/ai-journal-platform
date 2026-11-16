# Progress Reports

> Part of [`../`](../) — dated records of how the build is progressing.

---

## Purpose

Answers: **where are we, what is done, what is next?**

A progress report is written at the end of a phase or a working week. It is the honest status of the project — including what is behind schedule.

## Contents

- Phase status against `docs/TASKS.md` (`T#.#` ids)
- What shipped since the last report
- What was planned but not completed, with the reason
- Blockers and open decisions
- What is next

## Naming

```text
YYYY-MM-DD-phase-N-<slug>.md
```

## Template

```markdown
# Progress — Phase N

- **Date:** YYYY-MM-DD
- **Phase:** N — <name>
- **Status:** On track | At risk | Blocked

## Completed
- [ ] T#.# — <task> (evidence: <test / commit>)

## In Progress
- T#.# — <task>, remaining: <what>

## Not Started / Deferred
- T#.# — reason

## Blockers
- <decision or dependency, with owner>

## Next
1. ...
```

## Rules

- Status is measured against acceptance criteria in `docs/TASKS.md`, not against hours spent.
- Never mark a task complete without a matching entry in `../testing/`.
- Do not restate the task list — reference ids.
