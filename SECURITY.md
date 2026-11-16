# Security Policy

AI Journal stores personal journal entries, voice transcripts and mood history. A security bug here
is not an inconvenience — it is a private diary read by someone else. Please report it responsibly.

---

## Supported Versions

**No version of AI Journal has been released.** The application is in the architecture phase and
no runnable build exists.

| Version | Supported |
|---|---|
| `main` (unreleased) | ✅ Documentation and repository issues only |
| `v0.1.0` and later | Will be listed here once tagged |

There is no deployed instance maintained by the project, so there is no production surface to
attack today. Security reports about the **design** are still valuable and welcome.

---

## Reporting a Vulnerability

**Do not open a public issue, discussion or pull request for a vulnerability.**

Use one of these private channels:

1. **GitHub private vulnerability reporting (preferred)** —
   [Report a vulnerability](https://github.com/muhammadsami987123/ai-journal-platform/security/advisories/new).
   This keeps the discussion attached to the repository.
2. **Email** — m.samiwaseem1234@gmail.com, with `SECURITY` in the subject line.

### What to include

| Field | Detail |
|---|---|
| **Summary** | One sentence describing the flaw |
| **Impact** | What an attacker gains — read another user's entries, escalate to admin, bypass auth, exfiltrate keys |
| **Affected area** | Endpoint, module, table, or document section |
| **Reproduction** | Minimal steps or a proof-of-concept; redact real user data |
| **Environment** | Commit SHA, Node version, browser, deployment shape |
| **Suggested fix** | Optional, but always read |
| **Disclosure intent** | Whether and when you plan to publish |

Redact everything that is not required: no real journal text, no session cookies, no API keys, no
database URLs. A redacted example is enough.

### What not to do

- Do not test against infrastructure you do not own.
- Do not access, modify or exfiltrate another person's data — stop at the first indication of access
  and report immediately.
- Do not run automated scanners that generate significant traffic.
- Do not publicly disclose before a fix is available, unless the maintainer has agreed otherwise.

---

## Response Process

| Stage | Target |
|---|---|
| Acknowledgement of report | 3 working days |
| Initial assessment and severity | 7 working days |
| Fix or mitigation plan shared | 14 working days |
| Coordinated disclosure | Agreed with the reporter, default 90 days |

A single maintainer handles reports, so these are good-faith targets rather than guarantees. If you
have not heard back within a week, send one follow-up — assume the report was seen.

**Credit.** Reporters are credited in the advisory and release notes unless they prefer to remain
anonymous. There is no bug bounty; this is an unfunded personal project, and we will not imply
otherwise.

---

## Threat Model Summary

The design assumes the **browser is untrusted** and that the **network can be hostile**.

| Asset | Protection |
|---|---|
| Journal entries, transcripts, answers | Server-side authorization on every read/write; queries scoped by `user_id`; foreign IDs return `404` |
| Session cookies | httpOnly, `SameSite=Lax`, `Secure` in production, first-party origin only |
| Credentials | Hashed by Better Auth; never custom, never logged |
| LLM / STT API keys | Server-only; never in the browser bundle |
| Database | Pooled connection for runtime, direct connection for migrations only |
| Secrets | `.env` git-ignored; no secret committed; `.env.example` holds placeholders |
| Logs | Journal text, transcripts, tokens and credentials are never written to logs |

**Explicit non-goals today:** end-to-end encryption, at-rest encryption managed by the project,
multi-tenant administration, and any guarantee about third-party LLM provider data handling. If you
self-host, you are responsible for your provider's terms.

**Known accepted risk:** an AI provider you configure receives the text you submit for structuring.
That is inherent to the feature and is documented in [`docs/AI_INTEGRATION.md`](docs/AI_INTEGRATION.md).

---

## Security-Relevant Design Rules

These are invariants. A pull request that breaks one will not be merged:

1. Every user-owned query is scoped by `user_id` at the repository layer, not only in a guard.
2. Resource-level authorization returns `404`, never `403`, for resources the caller does not own.
3. No secret is read outside the typed config layer.
4. No `NEXT_PUBLIC_*` variable may hold a secret.
5. User text is never interpolated into a prompt template without delimiting and escaping.
6. User-supplied content is never rendered as raw HTML.
7. Auth, AI, voice and search endpoints are rate limited.
8. Validation happens at the boundary — DTOs / schemas — not inside business logic.

---

## Scope

**In scope:** authentication and session handling, authorization and data isolation, the `/api`
proxy and cookie forwarding, injection flaws, secret leakage into the browser bundle or logs, SSRF
via provider URLs, unsafe file handling, and dependency vulnerabilities that are actually reachable.

**Out of scope:** missing hardening headers with no demonstrated impact, self-XSS, reports produced
solely by an automated scanner without a working proof of concept, social engineering of the
maintainer, and issues that require a compromised local machine or a malicious browser extension.

---

## Repository-Level Security

- `main` is protected; changes arrive through reviewed pull requests.
- The CI structure and secret-scan checks run on every pull request.
- Dependency updates are reviewed, not auto-merged, because the stack is version-pinned in
  [`docs/TECH_STACK.md`](docs/TECH_STACK.md).
- GitHub private vulnerability reporting is enabled for this repository.

---

*This policy covers security only. Behaviour is covered by [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md);
reuse rights by [`LICENSE`](LICENSE).*
