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
partner onboarding = PASS
B2B / B2G partner pitch = PASS
curl examples = PASS
files workflow = PASS
source intelligence workflow = PASS
```

Operational summary:

```txt
HBCE IPR Runtime API v1 is now documented as a controlled B2B / B2G pilot-ready product package with runtime API surface, smoke validation, integration guide, pilot package, quickstart, product index, security checklist, rate limit/quota policy, partner onboarding, partner pitch, cURL examples, files workflow and source intelligence workflow.
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
```

### 3.4 Practical examples and workflows

```txt
docs/product/hbce-ipr-runtime-api-v1-curl-examples.md
docs/product/hbce-ipr-runtime-api-v1-files-workflow.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
```

### 3.5 Executable smoke test

```txt
scripts/test-api-v1-client-smoke.mjs
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
6. hbce-ipr-runtime-api-v1-partner-onboarding.md
7. hbce-ipr-runtime-api-v1-curl-examples.md
8. hbce-ipr-runtime-api-v1-integration-guide.md
9. hbce-ipr-runtime-api-v1-client-smoke-test.md
10. hbce-ipr-runtime-api-v1-files-workflow.md
11. hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
```

Recommended reading order for internal operators:

```txt
1. hbce-ipr-runtime-api-v1-product-index.md
2. hbce-ipr-runtime-api-v1-client-smoke-test.md
3. hbce-ipr-runtime-api-v1-security-checklist.md
4. hbce-ipr-runtime-api-v1-rate-limit-quota.md
5. hbce-ipr-runtime-api-v1-partner-onboarding.md
6. hbce-ipr-runtime-api-v1-curl-examples.md
7. hbce-ipr-runtime-api-v1-files-workflow.md
8. hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
9. hbce-ipr-runtime-api-v1-pilot-package.md
10. hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
```

Recommended reading order for B2G / institutional evaluators:

```txt
1. hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
2. hbce-ipr-runtime-api-v1-pilot-package.md
3. hbce-ipr-runtime-api-v1-security-checklist.md
4. hbce-ipr-runtime-api-v1-integration-guide.md
5. hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
6. hbce-ipr-runtime-api-v1-files-workflow.md
7. hbce-ipr-runtime-api-v1-client-smoke-test.md
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

### 6.9 Partner onboarding

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

### 6.10 B2B / B2G partner pitch

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

### 6.11 cURL examples

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

### 6.12 Files workflow

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

### 6.13 Source Intelligence workflow

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
| Partner onboarding | `hbce-ipr-runtime-api-v1-partner-onboarding.md` | PASS |
| B2B / B2G pitch | `hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md` | PASS |
| cURL examples | `hbce-ipr-runtime-api-v1-curl-examples.md` | PASS |
| Files workflow | `hbce-ipr-runtime-api-v1-files-workflow.md` | PASS |
| Source Intelligence workflow | `hbce-ipr-runtime-api-v1-source-intelligence-workflow.md` | PASS |

---

## 8. Partner package subset

For a first partner package, send:

```txt
docs/product/hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
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
docs/product/hbce-ipr-runtime-api-v1-files-workflow.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
```

Executable script:

```txt
scripts/test-api-v1-client-smoke.mjs
```

Expected result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
```

---

## 11. Security reviewer subset

For security review, send:

```txt
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
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
```

Message:

```txt
HBCE IPR Runtime API v1 is available as a controlled partner pilot package for identity-bound AI execution, event traceability, OPC technical proof receipts and audit-oriented API lookup.
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
HBCE IPR Runtime API v1 provides a governed API layer for identity-bound AI runtime execution, connecting IPR session, JOKER-C2 chat execution, EVT event tracing, OPC technical proof receipts and audit-oriented lookup routes within a controlled B2B / B2G pilot package.
```

Shorter:

```txt
HBCE IPR Runtime API v1 turns AI execution into a governed, traceable and technically receipted runtime event.
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
| Source fetch | catalog-first, source-set scoped |
| File input | controlled, classified, hash-bound |
| Secrets | never upload, never print |
| API key | environment only, never logged |
| Event lookup | `GET /api/v1/events?eventId={eventId}` |

---

## 16. Smoke test anchor

The smoke test remains the operational validation anchor.

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

---

## 17. Product maturity interpretation

Current maturity:

```txt
pilot-ready
partner-ready
documentation-ready
security-baseline-ready
quota-policy-ready
workflow-documented
source-intelligence-documented
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
```

This distinction matters. Overclaiming is how decent systems get turned into procurement confetti.

---

## 18. Recommended next work after documentation index

After this updated index, next technical steps may include:

```txt
implement runtime rate limit enforcement if not already enforced
create rate limit smoke test script
create source intelligence route smoke test script
create files workflow smoke test script
create OpenAPI examples update
create Postman collection
create partner email package
create public one-page PDF
create API v1 changelog
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
smoke validation = PASS
```

Final boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
rawTextPersistence=false by default
