# HBCE IPR Runtime API v1 — Product Documentation Index

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Repository:** `hbce-ai-joker-c2`  
**Document type:** product documentation index  
**Index status:** `product documentation indexed and pilot-ready`  
**Package status:** `API v1 product package pilot-ready`  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Purpose

This document is the canonical product documentation index for HBCE IPR Runtime API v1.

It lists the current product-facing, partner-facing, technical and pilot-facing documentation files that define the API v1 package.

The index exists so that a partner, evaluator or internal operator can understand:

```txt
what documents exist
what each document is for
which document to read first
which documents are technical
which documents are commercial / partner-facing
which documents define security boundaries
which documents define pilot workflow
which documents define source/file handling
which documents define rate limit, quota and Anti-Abuso API controls
which documents preserve legalCertification=false and OPC technical boundary
```

Core boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
```

---

## 2. Current package verdict

Current status:

```txt
HBCE IPR Runtime API v1 product documentation = indexed and pilot-ready
```

Canonical smoke baseline:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Anti-Abuso API baseline:

```txt
ANTI_ABUSO_API_DOCUMENTATION_READY
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_DOCUMENTED
RATE_LIMIT_EXCEEDED
```

Current package state:

```txt
client note = PASS
smoke test report = PASS
integration guide = PASS
pilot package = PASS
quickstart = PASS
product index = PASS
security checklist = PASS
rate limit / quota policy = PASS
Anti-Abuso API = PASS
partner onboarding = PASS
B2B / B2G partner pitch = PASS
curl examples = PASS
files workflow = PASS
source intelligence workflow = PASS
```

Operational summary:

```txt
HBCE IPR Runtime API v1 is now documented as a controlled B2B / B2G pilot-ready product package with runtime API surface, smoke validation, integration guide, pilot package, quickstart, product index, security checklist, rate limit/quota policy, Anti-Abuso API documentation, partner onboarding, partner pitch, cURL examples, files workflow and source intelligence workflow.
```

Yes, it is now an actual documentation package rather than a folder of markdown fossils. Civilization advances one grep at a time.

---

## 3. Documentation map

### 3.1 Core product and technical foundation

```txt
docs/product/hbce-ipr-runtime-api-v1-client.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-product-index.md
```

### 3.2 Pilot and partner package

```txt
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-partner-onboarding.md
docs/product/hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
```

### 3.3 Security, quota and controls

```txt
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
```

### 3.4 Practical examples and workflows

```txt
docs/product/hbce-ipr-runtime-api-v1-curl-examples.md
docs/product/hbce-ipr-runtime-api-v1-files-workflow.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-release-note-source-intelligence.md
```

### 3.5 Executable smoke tests

```txt
scripts/test-api-v1-client-smoke.mjs
scripts/test-api-v1-rate-limit-quota.mjs
```

---

## 4. Reading order

Recommended reading order for a new technical partner:

```txt
1. hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
2. hbce-ipr-runtime-api-v1-quickstart.md
3. hbce-ipr-runtime-api-v1-pilot-package.md
4. hbce-ipr-runtime-api-v1-security-checklist.md
5. hbce-ipr-runtime-api-v1-rate-limit-quota.md
6. hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
7. hbce-ipr-runtime-api-v1-partner-onboarding.md
8. hbce-ipr-runtime-api-v1-curl-examples.md
9. hbce-ipr-runtime-api-v1-integration-guide.md
10. hbce-ipr-runtime-api-v1-client-smoke-test.md
11. hbce-ipr-runtime-api-v1-files-workflow.md
12. hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
13. hbce-ipr-runtime-api-v1-source-intelligence-smoke-test.md
14. hbce-ipr-runtime-api-v1-release-note-source-intelligence.md
```

Recommended reading order for internal operators:

```txt
1. hbce-ipr-runtime-api-v1-product-index.md
2. hbce-ipr-runtime-api-v1-client-smoke-test.md
3. hbce-ipr-runtime-api-v1-security-checklist.md
4. hbce-ipr-runtime-api-v1-rate-limit-quota.md
5. hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
6. hbce-ipr-runtime-api-v1-partner-onboarding.md
7. hbce-ipr-runtime-api-v1-curl-examples.md
8. hbce-ipr-runtime-api-v1-files-workflow.md
9. hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
10. hbce-ipr-runtime-api-v1-source-intelligence-smoke-test.md
11. hbce-ipr-runtime-api-v1-release-note-source-intelligence.md
12. hbce-ipr-runtime-api-v1-pilot-package.md
13. hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
```

Recommended reading order for B2G / institutional evaluators:

```txt
1. hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
2. hbce-ipr-runtime-api-v1-pilot-package.md
3. hbce-ipr-runtime-api-v1-security-checklist.md
4. hbce-ipr-runtime-api-v1-rate-limit-quota.md
5. hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
6. hbce-ipr-runtime-api-v1-integration-guide.md
7. hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
8. hbce-ipr-runtime-api-v1-source-intelligence-smoke-test.md
9. hbce-ipr-runtime-api-v1-release-note-source-intelligence.md
10. hbce-ipr-runtime-api-v1-files-workflow.md
11. hbce-ipr-runtime-api-v1-client-smoke-test.md
```

---

## 5. Canonical API v1 route surface

Documented API v1 surface:

```txt
GET  /api/v1
GET  /api/v1/health
GET  /api/v1/capabilities
GET  /api/v1/self-test
GET  /api/v1/openapi
POST /api/v1/ipr/session
POST /api/v1/chat
POST /api/v1/files
GET  /api/v1/source-intelligence
POST /api/v1/source-intelligence
GET  /api/v1/operations/{operationId}
GET  /api/v1/events?eventId={eventId}
GET  /api/v1/opc/{opcId}
GET  /api/v1/audit/{auditId}
GET  /api/v1/model-usage/{usageId}
```

Core pilot routes:

```txt
POST /api/v1/ipr/session
POST /api/v1/chat
POST /api/v1/files
GET /api/v1/source-intelligence
POST /api/v1/source-intelligence
GET /api/v1/events?eventId={eventId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
```

Important route correction:

```txt
Correct:   GET /api/v1/events?eventId=EVT-...
Incorrect: GET /api/v1/events/EVT-...
```

This route correction is part of the validated smoke-test package.

---

## 6. Document-by-document index

### 6.1 Client product note

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-client.md
```

Purpose:

```txt
Defines the API v1 client-side product concept, technical role and partner-facing client layer.
```

Use when:

```txt
A partner or operator needs the basic product framing for the API v1 client and how it fits into HBCE IPR Runtime API v1.
```

Status:

```txt
PASS
```

---

### 6.2 Client smoke test report

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
```

Purpose:

```txt
Documents the live client smoke test result, validated API routes, critical checks and optional lookup checks.
```

Key status:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Use when:

```txt
A partner, operator or reviewer asks whether the API v1 route package has been tested live.
```

Validated checks:

```txt
node runtime
root discovery
health
capabilities
self-test
openapi
chat without key fail-closed
ipr session create
chat with key
operations lookup
events lookup
opc lookup
audit lookup
model usage skipped when usageId=NONE
```

Boundary:

```txt
legalCertification=false
technical proof receipt only
```

Status:

```txt
PASS
```

---

### 6.3 Integration guide

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
```

Purpose:

```txt
Provides the technical integration guide for API v1 usage, route sequence, session creation, authenticated chat, lookup routes and operational boundaries.
```

Use when:

```txt
A partner developer needs the technical route sequence and integration logic.
```

Core routes:

```txt
POST /api/v1/ipr/session
POST /api/v1/chat
GET /api/v1/events?eventId
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
```

Boundary:

```txt
legalCertification=false
technical proof receipt only
```

Status:

```txt
PASS
```

---

### 6.4 Quickstart

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
```

Purpose:

```txt
Provides the fastest controlled entry point for a partner to run API v1 in a safe pilot posture.
```

Use when:

```txt
A partner needs to perform the first API v1 validation quickly.
```

Core sequence:

```txt
1. Set base URL.
2. Set API key safely.
3. Check health.
4. Create IPR session.
5. Send authenticated chat.
6. Lookup EVT / OPC / audit where available.
```

Boundary:

```txt
legalCertification=false
technical proof receipt only
```

Status:

```txt
quickstart = ready
PASS
```

---

### 6.5 Pilot package

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
```

Purpose:

```txt
Defines the controlled B2B / B2G pilot package for API v1.
```

Use when:

```txt
A partner or evaluator needs to understand what the pilot includes, what is in scope, what is out of scope, and how pilot validation should proceed.
```

Core framing:

```txt
controlled B2B / B2G
pilot-ready
API_V1_CLIENT_SMOKE_TEST_PASS
```

Boundary:

```txt
legalCertification=false
technical proof receipt only
```

Status:

```txt
PASS
```

---

### 6.6 Product documentation index

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-product-index.md
```

Purpose:

```txt
This file. Canonical index of the API v1 product documentation package.
```

Use when:

```txt
A partner, operator, reviewer or future AI assistant needs the map of the API v1 documentation package without reconstructing it from memory like an archivist trapped in a server rack.
```

Status:

```txt
product documentation = indexed and pilot-ready
PASS
```

---

### 6.7 Security checklist

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
```

Purpose:

```txt
Defines the pilot security baseline for API v1.
```

Use when:

```txt
A partner, security reviewer or internal operator needs to verify API key handling, fail-closed behavior, boundary preservation, secret handling, tenant/workspace control and proof limitations.
```

Critical check:

```txt
chat without key fail-closed
```

Boundary:

```txt
legalCertification=false
technical proof receipt only
```

Status:

```txt
pilot security baseline
security checklist = pilot security baseline ready
PASS
```

---

### 6.8 Rate limit and quota policy

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
```

Purpose:

```txt
Defines pilot quota tiers, rate limit posture, blocked request behavior and controlled access boundaries.
```

Use when:

```txt
A partner needs to understand request limits, escalation logic, quota acceptance, pilot control and RATE_LIMIT_EXCEEDED behavior.
```

Canonical status:

```txt
RATE_LIMIT_EXCEEDED
```

Boundary:

```txt
legalCertification=false
technical proof receipt only
```

Status:

```txt
pilot rate limit baseline
rate limit and quota policy = pilot baseline ready
PASS
```

---

### 6.9 Anti-Abuso API smoke test

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
```

Purpose:

```txt
Documents Anti-Abuso API as the first operational protection layer of HBCE IPR Runtime API v1 against automatic abuse, excessive traffic and uncontrolled resource consumption.
```

Use when:

```txt
A partner, security reviewer, internal operator or B2B/B2G evaluator needs to understand how rate limit, quota and fail-closed behavior support SaaS control, runtime protection, cost governance and abuse reduction.
```

Canonical markers:

```txt
ANTI_ABUSO_API_DOCUMENTATION_READY
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_DOCUMENTED
RATE_LIMIT_EXCEEDED
```

Linked script:

```txt
scripts/test-api-v1-rate-limit-quota.mjs
```

Boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
```

Status:

```txt
Anti-Abuso API = documented
rate limit / quota smoke test = documented
PASS
```

---

### 6.10 Partner onboarding

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-partner-onboarding.md
```

Purpose:

```txt
Defines the controlled onboarding process for API v1 partners.
```

Use when:

```txt
A B2B or B2G partner is being prepared for API v1 pilot access.
```

Onboarding flow:

```txt
partner qualification
use case classification
data class approval
tenant/workspace assignment
API key issuance
security checklist acceptance
rate limit/quota acceptance
quickstart execution
IPR session creation
authenticated chat execution
EVT / OPC / audit lookup
pilot review
quota escalation or offboarding
```

Boundary:

```txt
legalCertification=false
technical proof receipt only
```

Status:

```txt
controlled partner pilot onboarding
partner onboarding = pilot-ready
PASS
```

---

### 6.11 B2B / B2G partner pitch

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
```

Purpose:

```txt
Provides the partner-facing commercial and institutional pitch for HBCE IPR Runtime API v1.
```

Use when:

```txt
A partner needs to understand the value proposition without reading the entire technical package first.
```

Core message:

```txt
HBCE IPR Runtime API v1 turns AI execution into a governed, traceable and technically receipted runtime event for controlled B2B / B2G pilot evaluation.
```

Boundary:

```txt
legalCertification=false
technical proof receipt only
```

Status:

```txt
partner pitch = partner pilot-ready
PASS
```

---

### 6.12 cURL examples

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-curl-examples.md
```

Purpose:

```txt
Provides practical cURL examples for testing API v1 routes safely.
```

Use when:

```txt
A partner developer needs command-line examples for health, capabilities, fail-closed auth, session creation, authenticated chat and lookup routes.
```

Includes:

```txt
safe API key handling
GET /api/v1/health
GET /api/v1/capabilities
POST /api/v1/ipr/session
POST /api/v1/chat
GET /api/v1/events?eventId
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
RATE_LIMIT_EXCEEDED
```

Boundary:

```txt
legalCertification=false
technical proof receipt only
```

Status:

```txt
curl examples = ready
PASS
```

---

### 6.13 Files workflow

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-files-workflow.md
```

Purpose:

```txt
Defines controlled file workflow for API v1.
```

Use when:

```txt
A partner wants to understand upload, file descriptors, hash handling, raw text boundaries, prompt-injection risk and runtime linkage through chat, EVT, OPC and audit.
```

Core concepts:

```txt
POST /api/v1/files
POST /api/v1/chat
GET /api/v1/events?eventId
file hash
file ID
rawTextPersistence=false
prompt-injection risk
legalCertification=false
OPC=technical proof receipt only
```

Boundary:

```txt
legalCertification=false
technical proof receipt only
rawTextPersistence=false
```

Status:

```txt
files workflow = pilot-ready
PASS
```

---

### 6.14 Source Intelligence workflow

Path:

```txt
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
```

Purpose:

```txt
Defines controlled Source Intelligence workflow for API v1.
```

Use when:

```txt
A partner wants to understand source sets, source catalog, controlled fetch, source hashing, source summary, prompt-injection screening and runtime linkage through chat, EVT, OPC and audit.
```

Core concepts:

```txt
GET /api/v1/source-intelligence
POST /api/v1/source-intelligence
POST /api/v1/chat
GET /api/v1/events?eventId
source set
source catalog
fetchLive=false by default
source hash
summary hash
rawTextPersistence=false
prompt-injection risk
technical source receipt only
```

Boundary:

```txt
legalCertification=false
technical source receipt only
rawTextPersistence=false
```

Status:

```txt
Source Intelligence workflow = pilot-ready
PASS
```

---

## 7. Status matrix

| Area | File | Status |
|---|---|---|
| Client note | `hbce-ipr-runtime-api-v1-client.md` | PASS |
| Smoke test | `hbce-ipr-runtime-api-v1-client-smoke-test.md` | PASS |
| Integration | `hbce-ipr-runtime-api-v1-integration-guide.md` | PASS |
| Quickstart | `hbce-ipr-runtime-api-v1-quickstart.md` | PASS |
| Pilot package | `hbce-ipr-runtime-api-v1-pilot-package.md` | PASS |
| Product index | `hbce-ipr-runtime-api-v1-product-index.md` | PASS |
| Security | `hbce-ipr-runtime-api-v1-security-checklist.md` | PASS |
| Rate limit / quota | `hbce-ipr-runtime-api-v1-rate-limit-quota.md` | PASS |
| Anti-Abuso API | `hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md` | PASS |
| Partner onboarding | `hbce-ipr-runtime-api-v1-partner-onboarding.md` | PASS |
| B2B / B2G pitch | `hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md` | PASS |
| cURL examples | `hbce-ipr-runtime-api-v1-curl-examples.md` | PASS |
| Files workflow | `hbce-ipr-runtime-api-v1-files-workflow.md` | PASS |
| Source Intelligence workflow | `hbce-ipr-runtime-api-v1-source-intelligence-workflow.md` | PASS |
| Source Intelligence smoke test report | `hbce-ipr-runtime-api-v1-source-intelligence-smoke-test.md` | PASS |
| Source Intelligence release note | `hbce-ipr-runtime-api-v1-release-note-source-intelligence.md` | PASS |

---

## 8. Partner package subset

For a first partner package, send:

```txt
docs/product/hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-partner-onboarding.md
docs/product/hbce-ipr-runtime-api-v1-curl-examples.md
```

Optional technical deepening:

```txt
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-files-workflow.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
```

---

## 9. B2G evaluator subset

For B2G / institutional review, send:

```txt
docs/product/hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
docs/product/hbce-ipr-runtime-api-v1-files-workflow.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
```

Purpose:

```txt
institutional AI governance evaluation
technical auditability
controlled source intelligence
controlled file workflow
API abuse control
proof boundary review
pilot-readiness review
```

---

## 10. Developer subset

For implementation/integration developers, send:

```txt
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-curl-examples.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-files-workflow.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
```

Executable scripts:

```txt
scripts/test-api-v1-client-smoke.mjs
scripts/test-api-v1-rate-limit-quota.mjs
```

Expected results:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS
```

---

## 11. Security reviewer subset

For security review, send:

```txt
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-files-workflow.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
```

Focus:

```txt
API key handling
fail-closed authentication
tenant/workspace isolation
IPR session binding
rate limits / quota
Anti-Abuso API
file input controls
source-set controls
prompt-injection posture
rawTextPersistence=false
legalCertification=false
OPC technical boundary
```

---

## 12. Commercial subset

For first commercial conversation, send:

```txt
docs/product/hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-partner-onboarding.md
```

Optional add-ons:

```txt
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
```

Message:

```txt
HBCE IPR Runtime API v1 is available as a controlled partner pilot package for identity-bound AI execution, event traceability, OPC technical proof receipts, audit-oriented API lookup and Anti-Abuso API controls.
```

Boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
```

---

## 13. Public positioning

Public-facing statement:

```txt
HBCE IPR Runtime API v1 provides a governed API layer for identity-bound AI runtime execution, connecting IPR session, JOKER-C2 chat execution, EVT event tracing, OPC technical proof receipts, audit-oriented lookup routes and Anti-Abuso API controls within a controlled B2B / B2G pilot package.
```

Shorter:

```txt
HBCE IPR Runtime API v1 turns AI execution into a governed, traceable and technically receipted runtime event with controlled API consumption.
```

Boundary statement:

```txt
The API does not provide legal certification by default. legalCertification=false. OPC remains a technical proof receipt only.
```

---

## 14. Non-claims

The product documentation must not claim that API v1 is:

```txt
a public legal certification authority
a qualified electronic signature service
a public identity authority
a public document registry
an unrestricted AI automation system
a legal evidence platform by default
a court-proof certification service by default
an unrestricted browsing or scraping API
an unrestricted document memory system
an unlimited API consumption channel
an anti-abuse certification authority
```

Correct claim:

```txt
controlled B2B / B2G pilot-ready governed runtime API
```

---

## 15. Boundary consistency table

| Boundary | Required value |
|---|---|
| Legal certification | `legalCertification=false` |
| OPC proof | `technical proof receipt only` |
| Source OPC proof | `technical source receipt only` |
| Raw text persistence | `rawTextPersistence=false` by default |
| Chat without key | fail-closed |
| Rate limit / quota | governed API consumption |
| Anti-Abuso API | documented first operational anti-abuse layer |
| Excessive traffic | `RATE_LIMIT_EXCEEDED` |
| Source fetch | catalog-first, source-set scoped |
| File input | controlled, classified, hash-bound |
| Secrets | never upload, never print |
| API key | environment only, never logged |
| Event lookup | `GET /api/v1/events?eventId={eventId}` |

---

## 16. Smoke test anchor

The client smoke test remains the operational validation anchor.

Script:

```txt
scripts/test-api-v1-client-smoke.mjs
```

Expected result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Critical checks include:

```txt
chat without key fail-closed
IPR session create
authenticated chat with key
```

Optional checks include:

```txt
operations lookup
events lookup
opc lookup
audit lookup
model usage lookup when usageId is available
```

Accepted skip:

```txt
SKIPPED model usage lookup because usageId=NONE
```

Anti-Abuso API smoke test anchor:

```txt
scripts/test-api-v1-rate-limit-quota.mjs
```

Expected markers:

```txt
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS
RATE_LIMIT_EXCEEDED
ANTI_ABUSO_API_DOCUMENTATION_READY
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_DOCUMENTED
```

---

## 17. Product maturity interpretation

Current maturity:

```txt
pilot-ready
partner-ready
documentation-ready
security-baseline-ready
quota-policy-ready
Anti-Abuso API documented
workflow-documented
source-intelligence-documented
source-intelligence-smoke-test-report-ready
source-intelligence-release-note-ready
files-workflow-documented
```

Not yet implied:

```txt
full production SLA
legal certification
public authority recognition
unrestricted enterprise deployment
unbounded data ingestion
unrestricted source fetch
unlimited API usage
anti-abuse legal certification
```

This distinction matters. Overclaiming is how decent systems get turned into procurement confetti.

---

## 18. Recommended next work after documentation index

After this updated index, next technical steps may include:

```txt
verify Anti-Abuso API index update on Linux
create source intelligence route smoke test script
create files workflow smoke test script
create OpenAPI examples update
create Postman collection
create partner email package
create public one-page PDF
create API v1 changelog
move from documentation package to runtime enforcement improvements where needed
```

Recommended order:

```txt
1. Update product index.
2. Verify index on Linux.
3. Create API v1 changelog.
4. Create Postman collection or smoke scripts for files/source intelligence.
5. Move from documentation package to runtime enforcement improvements.
```

---

## 19. Final index verdict

```txt
HBCE IPR Runtime API v1 product documentation = indexed and pilot-ready
```

Package state:

```txt
API v1 product package = pilot-ready
partner package = ready
technical docs = ready
workflow docs = ready
security baseline = ready
quota policy = ready
Anti-Abuso API documentation = ready
smoke validation = PASS
```

Final boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
rawTextPersistence=false by default

---

## 20. API v1 package closure release note

Path:

docs/product/hbce-ipr-runtime-api-v1-package-closure-release-note.md

Canonical markers:

API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
HBCE_IPR_RUNTIME_API_V1_PACKAGE_CLOSED_PASS
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PRODUCT_DOCUMENTATION_INDEXED
VERCEL_PRODUCTION_VERIFIED
MISSING_API_KEY
FAIL_CLOSED
legalCertification=false
rawTextPersistence=false
technical proof receipt only

Status:

API v1 package closure release note = ready
API v1 package = closed pass
package closure release note = PASS
API v1 package closure = PASS

---

## 21. SaaS B2G product blueprint

Path:

docs/product/hbce-joker-c2-saas-b2g-product-blueprint.md

Purpose:

Defines the transition from HBCE IPR Runtime API v1 pilot-ready package to HBCE/JOKER-C2 SaaS B2G product architecture, including product definition, B2G problem, tenant/workspace model, API key lifecycle, Source Intelligence, files workflow, EVT/OPC/audit proof chain, dashboard requirements, security boundaries, runtime enforcement roadmap and UP-MESE path.

Canonical markers:

SAAS_B2G_PRODUCT_BLUEPRINT_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
HBCE_IPR_RUNTIME_API_V1_FOUNDATION_CONFIRMED
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
legalCertification=false
rawTextPersistence=false
technical proof receipt only
MISSING_API_KEY
FAIL_CLOSED

Status:

SaaS B2G product blueprint = READY
SaaS B2G product architecture = READY FOR UP-MESE PLANNING

---

## 22. SaaS B2G pilot offer

Path:

docs/product/hbce-joker-c2-saas-b2g-pilot-offer.md

Purpose:

Defines the controlled SaaS B2G pilot offer for HBCE/JOKER-C2, including pilot scope, target users, duration, roles, included API v1 modules, use cases, quotas, deliverables, success criteria, failure conditions, commercial framing, pricing model boundary, risk statement, closure report and UP-MESE roadmap connection.

Canonical markers:

SAAS_B2G_PILOT_OFFER_READY
HBCE_JOKER_C2_SAAS_B2G_PILOT_PACKAGE_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
HBCE_IPR_RUNTIME_API_V1_FOUNDATION_CONFIRMED
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
legalCertification=false
rawTextPersistence=false
technical proof receipt only
MISSING_API_KEY
FAIL_CLOSED

Status:

SaaS B2G pilot offer = READY
SaaS B2G pilot package = READY FOR UP-MESE PLANNING

---

## 23. SaaS B2G security and compliance pack

Path:

docs/product/hbce-joker-c2-saas-b2g-security-compliance-pack.md

Purpose:

Defines the SaaS B2G security and compliance technical boundary pack for HBCE/JOKER-C2, including authentication, API key lifecycle, tenant/workspace separation, rate limits, rawTextPersistence=false policy, Source Intelligence controls, files workflow controls, EVT/OPC/audit boundaries, memory persistence policy, anti-abuse posture, DEFENSIVE_ONLY_CYBER and fail-closed criteria.

Canonical markers:

SAAS_B2G_SECURITY_COMPLIANCE_PACK_READY
HBCE_JOKER_C2_SAAS_B2G_SECURITY_COMPLIANCE_READY
HBCE_JOKER_C2_SAAS_B2G_PILOT_PACKAGE_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
HBCE_IPR_RUNTIME_API_V1_FOUNDATION_CONFIRMED
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
legalCertification=false
rawTextPersistence=false
technical proof receipt only
MISSING_API_KEY
FAIL_CLOSED
SECURITY_COMPLIANCE_FAIL_CLOSED
DEFENSIVE_ONLY_CYBER

Status:

SaaS B2G security and compliance pack = READY
SaaS B2G security boundary = READY FOR UP-MESE PLANNING

---

## 24. SaaS B2G admin dashboard roadmap

Path:

docs/product/hbce-joker-c2-saas-b2g-admin-dashboard-roadmap.md

Purpose:

Defines the SaaS B2G admin dashboard roadmap for HBCE/JOKER-C2, including overview, runtime health, tenant/workspace state, API keys, IPR sessions, chat runtime, Source Intelligence, files workflow, EVT/OPC/audit, model usage, rate limits, security/compliance, pilot readiness and UP-MESE readiness.

Canonical markers:

SAAS_B2G_ADMIN_DASHBOARD_ROADMAP_READY
HBCE_JOKER_C2_SAAS_B2G_ADMIN_DASHBOARD_READY
HBCE_JOKER_C2_SAAS_B2G_SECURITY_COMPLIANCE_READY
HBCE_JOKER_C2_SAAS_B2G_PILOT_PACKAGE_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
HBCE_IPR_RUNTIME_API_V1_FOUNDATION_CONFIRMED
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
legalCertification=false
rawTextPersistence=false
technical proof receipt only
MISSING_API_KEY
FAIL_CLOSED
DEFENSIVE_ONLY_CYBER
ADMIN_DASHBOARD_FAIL_CLOSED

Status:

SaaS B2G admin dashboard roadmap = READY
SaaS B2G admin dashboard roadmap = READY FOR UP-MESE PLANNING

---

## 25. SaaS B2G runtime enforcement roadmap

Path:

docs/product/hbce-joker-c2-saas-b2g-runtime-enforcement-roadmap.md

Purpose:

Defines the SaaS B2G runtime enforcement roadmap for HBCE/JOKER-C2, including authentication enforcement, API key lifecycle enforcement, tenant/workspace boundaries, IPR session enforcement, route permissions, rate limits, quotas, Source Intelligence enforcement, files workflow enforcement, memory persistence policy, no-save policy, EVT/OPC/audit enforcement, model usage accountability, defensive-only cyber posture, admin action controls, pilot enforcement and UP-MESE enforcement.

Canonical markers:

SAAS_B2G_RUNTIME_ENFORCEMENT_ROADMAP_READY
HBCE_JOKER_C2_SAAS_B2G_RUNTIME_ENFORCEMENT_READY
HBCE_JOKER_C2_SAAS_B2G_ADMIN_DASHBOARD_READY
HBCE_JOKER_C2_SAAS_B2G_SECURITY_COMPLIANCE_READY
HBCE_JOKER_C2_SAAS_B2G_PILOT_PACKAGE_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
HBCE_IPR_RUNTIME_API_V1_FOUNDATION_CONFIRMED
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
legalCertification=false
rawTextPersistence=false
technical proof receipt only
MISSING_API_KEY
FAIL_CLOSED
DEFENSIVE_ONLY_CYBER
RUNTIME_ENFORCEMENT_FAIL_CLOSED

Status:

SaaS B2G runtime enforcement roadmap = READY
SaaS B2G runtime enforcement roadmap = READY FOR UP-MESE PLANNING

---

## 26. SaaS B2G UPMESE package

Path:

docs/product/hbce-joker-c2-saas-b2g-upmese-package.md

Purpose:

Defines the SaaS B2G UP-MESE package for HBCE/JOKER-C2, consolidating API v1 package closure, Source Intelligence closure, product blueprint, pilot offer, security/compliance pack, admin dashboard roadmap, runtime enforcement roadmap, product index continuity, technical proof boundary, fail-closed posture and 2026-06-19 checkpoint preparation.

Canonical markers:

SAAS_B2G_UPMESE_PACKAGE_READY
HBCE_JOKER_C2_SAAS_B2G_UPMESE_READY
HBCE_JOKER_C2_SAAS_B2G_RUNTIME_ENFORCEMENT_READY
HBCE_JOKER_C2_SAAS_B2G_ADMIN_DASHBOARD_READY
HBCE_JOKER_C2_SAAS_B2G_SECURITY_COMPLIANCE_READY
HBCE_JOKER_C2_SAAS_B2G_PILOT_PACKAGE_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
HBCE_IPR_RUNTIME_API_V1_FOUNDATION_CONFIRMED
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
legalCertification=false
rawTextPersistence=false
technical proof receipt only
MISSING_API_KEY
FAIL_CLOSED
DEFENSIVE_ONLY_CYBER
UPMESE_PACKAGE_FAIL_CLOSED

Status:

SaaS B2G UPMESE package = READY
SaaS B2G UPMESE package = READY FOR 2026-06-19 CHECKPOINT

---

## 27. SaaS B2G UPMESE checkpoint

Path:

docs/product/hbce-joker-c2-saas-b2g-upmese-checkpoint.md

Purpose:

Defines the SaaS B2G UP-MESE checkpoint for HBCE/JOKER-C2, closing the 2026-06-12 / 2026-06-19 roadmap cycle by confirming API v1 package closure, Source Intelligence closure, product blueprint, pilot offer, security/compliance pack, admin dashboard roadmap, runtime enforcement roadmap, UPMESE package, product index continuity, fail-closed posture and technical proof boundaries.

Canonical markers:

SAAS_B2G_UPMESE_CHECKPOINT_READY
HBCE_JOKER_C2_SAAS_B2G_UPMESE_CHECKPOINT_READY
HBCE_JOKER_C2_SAAS_B2G_UPMESE_READY
HBCE_JOKER_C2_SAAS_B2G_RUNTIME_ENFORCEMENT_READY
HBCE_JOKER_C2_SAAS_B2G_ADMIN_DASHBOARD_READY
HBCE_JOKER_C2_SAAS_B2G_SECURITY_COMPLIANCE_READY
HBCE_JOKER_C2_SAAS_B2G_PILOT_PACKAGE_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
HBCE_IPR_RUNTIME_API_V1_FOUNDATION_CONFIRMED
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
legalCertification=false
rawTextPersistence=false
technical proof receipt only
MISSING_API_KEY
FAIL_CLOSED
DEFENSIVE_ONLY_CYBER
UPMESE_CHECKPOINT_FAIL_CLOSED

Status:

SaaS B2G UPMESE checkpoint = READY
SaaS B2G UP-MESE cycle 2026-06-12 / 2026-06-19 = CLOSED PASS
