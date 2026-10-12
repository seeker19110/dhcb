# V2-19 — Platform Evaluation and Hardening

**Status:** Approved for implementation  
**Date:** 2026-08-17  
**Wave:** F (after V2-18 Approved Automation)  
**Author:** AI Delivery Loop

---

## Goal

Produce verifiable evidence that the full Dong Hanh platform V2 (V2-03 through V2-18) meets quality, security, cost, and privacy criteria before the V2-20 final acceptance gate.

This is an evaluation-and-hardening milestone, not a new feature wave. No speculative behavior is added — we measure and document what the system already does, harden the gaps, and produce evidence artifacts.

---

## Scope

### Dimensions to evaluate (from roadmap + architecture doc)

| #   | Dimension                                   | Method                     | Zero-tolerance?            |
| --- | ------------------------------------------- | -------------------------- | -------------------------- |
| 1   | Routing accuracy (intent/domain)            | Deterministic golden set   | No (target >= 85%)         |
| 2   | Context precision/recall/relevance          | Deterministic golden set   | No                         |
| 3   | Context DENY-bypass                         | Adversarial fixture set    | YES — 0 tolerance          |
| 4   | Sensitive-context leakage                   | Adversarial fixture set    | YES — 0 tolerance          |
| 5   | Memory precision / false-memory rate        | Deterministic golden set   | No (target < 5% false)     |
| 6   | Memory correction rate (declared > derived) | Deterministic golden set   | No (target 100%)           |
| 7   | Permission compliance                       | Adversarial fixture set    | YES — 0 tolerance          |
| 8   | Cross-domain handoff success                | Integration golden set     | YES — 0 direct bypass      |
| 9   | Capability success/cost/latency             | Integration + instrumented | No (target >= 90% success) |
| 10  | Prompt-injection / tool-abuse scenarios     | Red-team harness           | YES — 0 bypasses           |
| 11  | Privacy export/delete drills                | End-to-end drill script    | YES — 0 residual records   |

---

## Slice Decomposition

### Slice 1 — Deterministic Eval Harnesses (no API cost, safe for CI)

Build evaluation scripts that run against the actual services using test fixtures (no LLM calls required). All use the pattern established in scripts/eval-tutor.ts + scripts/lib/evalScoring.ts.

Files to create:

- scripts/eval-v2-routing.ts — routing accuracy golden set
- scripts/eval-v2-routing-fixtures.json — 50+ Vietnamese/English messages => expected intent/domain
- scripts/eval-v2-context.ts — context precision/recall/leakage eval
- scripts/eval-v2-context-fixtures.json — pre-seeded scenarios
- scripts/eval-v2-memory.ts — memory precision/false-memory/correction
- scripts/eval-v2-memory-fixtures.json — 30+ candidates with known outcomes
- scripts/eval-v2-permissions.ts — permission compliance + DENY gate harness
- scripts/eval-v2-permissions-fixtures.json — authority escalation scenarios

npm scripts to add (package.json):
"eval:v2:routing": "npx tsx scripts/eval-v2-routing.ts"
"eval:v2:context": "npx tsx scripts/eval-v2-context.ts"
"eval:v2:memory": "npx tsx scripts/eval-v2-memory.ts"
"eval:v2:permissions": "npx tsx scripts/eval-v2-permissions.ts"

Test coverage (CI-safe, no API keys):

- Unit tests for each eval harness using mock service layer
- Tests must cover: scoring functions, threshold checks, fixture schema validation

---

### Slice 2 — Red-Team Fixtures + Harness

> **THAY THẾ 2026-10-12 (changelog 0623):** harness dựng theo mục này xanh GIẢ — cộng sẵn 20/30
> ca không chạy, chấm 2 ca bằng nhãn của chính fixture, nuốt lỗi với mã thoát 0. Đã viết lại chạy
> trên Postgres thật theo `docs/specs/2026-10-12-red-team-eval-that.md`; ba file JSON fixture dưới
> đây ĐÃ XOÁ (ca giờ là mã trong `scripts/red-team/redTeamCases.ts`). Phần dưới chỉ còn là lịch sử.

Build structured red-team scenarios covering prompt-injection, tool-abuse, and sensitive-data leakage. Fixtures are static JSON; the harness runs against mock service boundaries (not live LLM — CI-safe).

Files to create:

- scripts/red-team/prompt-injection-fixtures.json
- scripts/red-team/tool-abuse-fixtures.json
- scripts/red-team/sensitive-leakage-fixtures.json
- scripts/red-team/eval-red-team.ts

Scenarios covered:

1. Role injection into Companion pipeline => expect: no authority escalation, planning blocked at policy gate
2. Cross-user personId in request body => expect: 403, query scoped to auth token person
3. Budget exhaustion race (concurrent automation triggers) => expect: rate-limit enforced atomically
4. Idempotency key replay with different payload => expect: cached receipt returned, no re-execution
5. REVOKED grant resume attempt => expect: 409 ConflictError
6. Grant with expired reviewAt => expect: executeAutomatedAction rejects
7. Sensitive memory with wrong purpose in context => expect: item absent from ContextPackage
8. LLM-suggested personal fact without user_declared provenance => expect: REJECT at memory candidate pipeline
9. DENY policy active => Companion turn => expect: empty context, capability blocked
10. Consent not active => life_graph purpose => expect: zero life graph items in ContextPackage

npm script:
"eval:v2:red-team": "npx tsx scripts/red-team/eval-red-team.ts"

---

### Slice 3 — Privacy Export/Erase Endpoints + Drills

Add person-level data export and cascading full erasure, then validate with drill scripts.

DB migration:

- postgres/migrations/0052_person_erasure_log.sql:
  append-only platform.person_erasure_log (person_id, requested_at, erased_at, erased_by, schemas_cleared[], records_deleted_count)

API changes to api/persons.ts:

- GET /api/persons?action=export => returns all data across all schemas for authenticated person
- DELETE /api/persons/:id?action=full_erase => cascade erase across all schemas, writes erasure log

Service:

- packages/core-personal/personErasureService.ts:
  - exportPersonData(personId): aggregates facts, memories, consents, policies, life graph, career, work, startup, life, automation, decisions
  - erasePersonData(personId): atomic cascade delete across all schemas in single transaction

Drill scripts:

- scripts/eval-v2-privacy.ts: create => populate => export => verify => erase => verify zero => re-export => verify empty

Unit tests: packages/core-personal/personErasureService.test.ts

---

### Slice 4 — Evidence Document

After all slices pass, produce docs/research/eval-v2-19-evidence.md with structured scores for all evaluation dimensions.

---

## Definition of Done

| Check                            | Threshold                                         |
| -------------------------------- | ------------------------------------------------- |
| Routing accuracy                 | >= 85% on 50-fixture golden set                   |
| Context DENY bypass              | = 0                                               |
| Sensitive context leakage        | = 0                                               |
| Memory false-memory rate         | < 5%                                              |
| Memory correction rate           | = 100%                                            |
| Permission DENY bypass           | = 0                                               |
| Red-team scenarios blocked       | = 100%                                            |
| Privacy export completeness      | PASS                                              |
| Privacy full-erase zero-residual | PASS                                              |
| CI gate                          | build + typecheck + lint + format + test all pass |
| Branch coverage                  | >= 90.00% global                                  |
| Eval scripts                     | npm run eval:v2:* all exit 0                      |
| Evidence document                | docs/research/eval-v2-19-evidence.md complete     |

---

## Out of Scope

- k6 load tests against live staging
- Per-capability AI cost tracking instrumentation (deferred to V2-20)
- LLM-based routing upgrade (measurement first; decision is V2-20 input)

---

## Security / Risk Notes

- full_erase requires authenticated owner; admin can erase any person
- Erasure log is append-only
- Export endpoint must be rate-limited
- Red-team harness never calls paid AI providers; uses mock service boundaries only
