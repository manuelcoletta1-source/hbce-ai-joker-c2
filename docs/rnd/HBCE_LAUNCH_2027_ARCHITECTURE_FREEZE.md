# HBCE LAUNCH 2027 — ARCHITECTURE FREEZE

## AI JOKER-C2 × IPR Operational Identity & Proof Layer

**Organization:** HERMETICUM B.C.E. S.r.l.  
**Program:** IPR-HBCE-LAUNCH-2027-0001  
**Freeze preparation date:** 2026-08-13  
**Architecture Freeze target:** 2026-08-19  
**Release Gate Ω:** 2027-01-19  
**Human authority / reviewer:** IPR-3  
**Operational runtime:** AI JOKER-C2  
**Status:** R&D / INTEGRATION / PRE-COMMERCIAL  
**Legal certification:** false

---

## 1. Purpose

This document freezes the canonical technical architecture to be used for the
HBCE Launch 2027 Alpha path.

It distinguishes:

- AS-DOCUMENTED
- AS-IMPLEMENTED
- AS-VERIFIED
- FROZEN-FOR-ALPHA

Presence of source code or an API route does not by itself constitute
operational verification.

All critical claims require technical evidence.

The system remains fail-closed.

---

## 2. Version namespaces

The following version identifiers belong to different scopes and MUST NOT be
collapsed into one version number.

### Repository software

`package.json`

Version:

`2.0.0`

### Mission Runtime

Name:

`AI JOKER-C2 Mission Runtime`

Version:

`1.0.0`

Framework:

`SRSC-V17.1`

Runtime status declaration:

`ACTIVE`

For this Freeze, `ACTIVE` means that the internal Mission Runtime core is
available for governed execution.

It MUST NOT be interpreted as:

- full SaaS production readiness;
- Release Gate Ω PASS;
- autonomous operation;
- legal certification;
- real external delivery readiness.

### Public Product Layer

Product:

`HBCE IPR Operational Identity & Proof Layer`

API:

`v1`

Runtime identifier:

`AI_JOKER_C2_SAAS_CORE_v0_1`

### Public OpenAPI Contract

OpenAPI:

`3.1.0`

Contract version:

`1.0.0`

---

## 3. Canonical architectural layers

The frozen Alpha architecture is:

IPR
→ HBCE Governance
→ Public Product API v1
→ AI JOKER-C2 Mission Runtime
→ Runtime Operations
→ EVT
→ Memory
→ OPC
→ Audit / Ledger
→ Verification
→ Continuity

The broader canonical operational sequence remains:

IPR Identity
→ Input
→ Intent
→ Project Collection
→ HBCE Module
→ Context
→ Policy
→ Risk
→ Human Oversight
→ Decision
→ Execution
→ Output
→ EVT
→ Memory
→ OPC
→ Ledger
→ Verification
→ Continuity

---

## 4. Canonical Public Product API

Base:

`/api/v1`

The OpenAPI v1 contract declares the following public paths:

- `GET /api/v1/health`
- `GET /api/v1/capabilities`
- `POST /api/v1/ipr/session`
- `GET /api/v1/ipr/session/{sessionId}`
- `POST /api/v1/chat`
- `POST /api/v1/files`
- `POST /api/v1/operations`
- `GET /api/v1/operations/{operationId}`
- `GET /api/v1/events`
- `GET /api/v1/opc/{opcId}`
- `GET /api/v1/audit/{auditId}`
- `GET /api/v1/model-usage/{usageId}`
- `GET /api/v1/openapi`

This is the canonical product contract for Alpha.

---

## 5. Mission Runtime Control Surface

Canonical Mission Runtime routes:

- `GET /api/v1/runtime/health`
- `GET /api/v1/runtime/info`
- `GET /api/v1/runtime/capabilities`
- `GET /api/v1/runtime/self-test`
- `GET /api/v1/runtime/manifest`
- `POST /api/v1/runtime/execute`

These routes form the governed Mission Runtime control surface.

Other `/api/v1/runtime/*/self-test` routes are technical validation surfaces
unless explicitly promoted by a later Freeze revision.

They MUST NOT be represented as public product capabilities merely because they
exist in the repository.

---

## 6. Internal validation surface

The repository contains validation routes for areas including:

- EVT
- OPC
- Memory
- Audit
- End-to-End execution
- Execution Persistence
- Crash Recovery
- Atomic Failure
- Cross-Ledger consistency
- Model Transaction
- Model Usage
- Concurrent Execution
- Serialization Retry
- Operations Idempotency
- External Effect Idempotency
- Delivery Persistence

These routes are classified:

`INTERNAL / R&D VALIDATION`

unless explicitly promoted into the public v1 contract.

---

## 7. Legacy and duplicate surfaces

The repository also contains runtime routes below:

- `app/api/runtime/*`
- `src/app/api/runtime/*`
- `src/app/api/v1/runtime/*`

Their presence does not make them canonical.

For Alpha:

`/api/v1/*`

is the canonical public product namespace.

`/api/v1/runtime/*`

is the canonical Mission Runtime control and validation namespace.

Legacy or duplicate namespaces MUST NOT be expanded during Architecture Freeze
without explicit review.

No deletion is authorized by this document.

---

## 8. Capability state

### READY according to current runtime capability declaration

- IPR Operational Identity
- EVT Ledger
- OPC Technical Proof Receipt
- Audit Log
- Model Usage Log
- IPR-Bound Memory
- Source Intelligence v0.3
- Dashboard Runtime Visibility

### PARTIAL / BRIDGE REQUIRED

Governed AI Chat:

`RUNTIME_READY_INTERNAL_BRIDGE_PLANNED_FOR_V1`

Document and File Governance:

`RUNTIME_READY_INTERNAL_BRIDGE_PLANNED_FOR_V1`

### CONTRACT / EXECUTION GAP

Async Governed Operations:

`CONTRACT_PLANNED`

The Level 10 D001 work changes the technical persistence status of this area but
does not by itself activate real asynchronous delivery execution.

---

## 9. Level 8 / Level 9 / Level 10 runtime state

### Level 8

Runtime Operations persistence:

`VERIFIED`

Primary relation:

`runtime_operations`

### Level 9

Persistent operational execution support includes:

- `runtime_operation_effects`
- `runtime_operation_outbox`
- `runtime_operation_opc_receipts`

Status:

`VERIFIED IN EXISTING RUNTIME SCOPE`

### Level 10 — D001

Capability:

Persistent Delivery and DeliveryAttempt repository.

Relations:

- `runtime_deliveries`
- `runtime_delivery_attempts`

Canonical Production database resolution:

`POSTGRES_URL`

Verified Neon endpoint identity:

`ep-damp-base-abx0fv07`

D001 revision:

`HBCE-RUNTIME-LEVEL-10-D001-DELIVERY-PERSISTENCE-SELF-TEST-v1_4`

Repository commit:

`c55565a0b4a9ec9f3e068ca236eeedbfab536029`

Production result:

- totalChecks: 19
- passedChecks: 19
- failedChecks: 0
- persistentSchemaApplicationVerified: true
- physicalDurabilityVerified: true
- zeroSyntheticResidue: true

Cross-connection sequence verified:

POOL_A_WRITE
→ POOL_A_CLOSE
→ POOL_B_FRESH_REREAD
→ POOL_B_CLEANUP
→ POOL_B_CLOSE
→ POOL_C_ZERO_RESIDUE_VERIFY
→ POOL_C_CLOSE

D001 status:

`TECHNICALLY CLOSED`

---

## 10. Level 10 boundaries after D001

The following capabilities remain explicitly NOT IMPLEMENTED or NOT ACTIVATED:

- real external delivery;
- delivery workers;
- automatic retry engine;
- webhook execution;
- scheduler-driven delivery execution;
- dead-letter queue;
- autonomous authorization;
- full runtime activation of external delivery;
- legal certification.

These boundaries MUST remain false until independently implemented and verified.

---

## 11. Database canonicalization

Production runtime database precedence frozen for Alpha:

POSTGRES_URL
→ DATABASE_URL
→ NEON_DATABASE_URL

The verified Production target for D001 is:

`POSTGRES_URL`

Neon endpoint:

`ep-damp-base-abx0fv07`

The fallback variables remain compatibility mechanisms.

Their presence MUST NOT be interpreted as equivalent Production authority.

---

## 12. Product readiness matrix

### PRD-001 — IPR creation

Status:

`VERIFICATION PENDING FOR ALPHA E2E`

### PRD-002 — Identity / onboarding

Status:

`VERIFICATION PENDING FOR ALPHA E2E`

### PRD-003 — JOKER-C2 access

Status:

`PARTIAL / PUBLIC V1 BRIDGE VERIFICATION REQUIRED`

### PRD-004 — EVT chain

Status:

`TECHNICAL CAPABILITY READY / ALPHA E2E VERIFICATION REQUIRED`

### PRD-005 — OPC verification

Status:

`TECHNICAL CAPABILITY READY / ALPHA E2E VERIFICATION REQUIRED`

### PRD-006 — Persistence

Status:

`VERIFIED IN D001 SCOPE`

### PRD-007 — Recovery

Status:

`TECHNICAL TEST SURFACE PRESENT / RELEASE EVIDENCE REVIEW REQUIRED`

### PRD-008 — Security

Status:

`R&D / RELEASE GATE NOT CLOSED`

### PRD-009 — Privacy

Status:

`R&D / RELEASE GATE NOT CLOSED`

### PRD-010 — Deployment

Status:

`PARTIAL VERIFIED`

Production deployment has been demonstrated.

Full release-grade monitoring, rollback and deployment evidence remain outside
the D001 verification scope.

### PRD-011 — SaaS / funnel

Status:

`PRE-COMMERCIAL`

### PRD-012 — Client delivery

Status:

`PILOT / EXTERNAL USER EVIDENCE REQUIRED`

---

## 13. Alpha Vertical Slice

The Alpha target is one complete governed sequence:

Human
→ IPR
→ authenticated / governed access
→ request
→ Public API v1
→ JOKER-C2
→ policy / risk / human oversight
→ runtime execution
→ EVT
→ OPC
→ persistence
→ audit evidence
→ result
→ client-visible verification

The Alpha does NOT require every future Level 10 execution subsystem.

The Alpha requires one end-to-end sequence with no critical unverified link.

---

## 14. Freeze blockers

Before Alpha PASS the following must be resolved or independently verified:

1. IPR creation and onboarding E2E.
2. Public v1 JOKER-C2 chat bridge.
3. File/document bridge if included in Alpha scope.
4. Public EVT retrieval.
5. Public OPC retrieval.
6. Audit evidence retrieval.
7. Recovery evidence review.
8. Security gate.
9. Privacy gate.
10. External-user execution.
11. Deployment monitoring / rollback evidence required by Release Gate.
12. Client-visible verification output.

---

## 15. Fail-closed conditions

The Alpha MUST fail closed when a required critical component is missing,
unverified or unauthorized.

Canonical boundaries:

- NO_IDENTITY_NO_ACTION
- NO_MISSION_NO_ACTION
- NO_AUTHORIZATION_NO_ACTION
- NO_TRACE_NO_ACTION
- FAIL_CLOSED

No technical receipt constitutes legal certification.

`legalCertification=false`

No autonomous legal personhood is asserted.

No consciousness proof is asserted.

---

## 16. Freeze decision

Architecture state on 2026-08-13:

`FREEZE PREPARATION`

D001:

`TECHNICALLY CLOSED`

Public v1 contract:

`IDENTIFIED`

Mission Runtime control surface:

`IDENTIFIED`

Alpha vertical slice:

`NOT YET VERIFIED END-TO-END`

Release Gate Ω:

`NOT PASSED`

The next implementation priority MUST be derived from the Alpha Vertical Slice
and Release Gate matrix rather than from generic feature expansion.

---

## 17. Next operational objective

Priority:

`ALPHA VERTICAL SLICE`

Target checkpoint:

`2026-09-30`

Immediate sequence:

Architecture Freeze
→ E2E capability verification
→ close missing public bridges
→ execute governed Alpha path
→ collect EVT / OPC / persistence / audit evidence
→ external-user verification
→ Alpha PASS or FAIL-CLOSED

---

## 18. Authority boundary

Final operational and release authority remains human.

Reviewer / authority:

`IPR-3`

AI JOKER-C2 may analyze, execute technical tests and generate evidence inside
its authorized scope.

It MUST NOT autonomously authorize release, certification or legal status.

---

**END — HBCE LAUNCH 2027 ARCHITECTURE FREEZE**
