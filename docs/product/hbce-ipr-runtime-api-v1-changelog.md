# HBCE IPR Runtime API v1 — Product Changelog

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Repository:** `hbce-ai-joker-c2`  
**Document type:** product changelog  
**Changelog status:** `API v1 product changelog ready`  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Purpose

This changelog records the product-documentation and pilot-readiness evolution of **HBCE IPR Runtime API v1**.

It exists so that an internal operator, partner, evaluator or future reviewer can understand what changed, why it changed, and which part of the API v1 product package was advanced.

The changelog is not a legal certification log and does not replace EVT, OPC, audit records or repository commit history. It is a product documentation layer for the API v1 package.

Core boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
```

---

## 2. Current package verdict

Current API v1 product package state:

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

Operational baseline:

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
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS
RATE_LIMIT_EXCEEDED
```

---

## 3. Changelog entries

### 2026-06-11 — Product index updated with Anti-Abuso API

**Commit:** `8981537`  
**File:** `docs/product/hbce-ipr-runtime-api-v1-product-index.md`

Summary:

```txt
Updated the API v1 product documentation index to include Anti-Abuso API as an official product package component.
```

Details:

```txt
Added Anti-Abuso API references to:
- current package state
- documentation map
- security / quota / controls section
- reading order
- document-by-document index
- status matrix
- partner package subset
- B2G evaluator subset
- developer subset
- security reviewer subset
- public positioning
- non-claims
- boundary consistency table
- smoke test anchor
- product maturity interpretation
- final index verdict
```

Verification:

```txt
PRODUCT INDEX ANTI-ABUSO API PASS
```

Observed markers:

```txt
Anti-Abuso API
hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md
ANTI_ABUSO_API_DOCUMENTATION_READY
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_DOCUMENTED
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS
RATE_LIMIT_EXCEEDED
legalCertification=false
technical proof receipt only
```

Boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
```

Status:

```txt
PASS
```

---

### 2026-06-11 — Anti-Abuso API documentation added

**Commit:** `054be6c`  
**File:** `docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota-smoke-test.md`

Summary:

```txt
Added the Anti-Abuso API product documentation file for the HBCE IPR Runtime API v1 rate limit / quota smoke test.
```

Definition:

```txt
Anti-Abuso API is the first operational protection layer of HBCE IPR Runtime API v1 against automatic abuse, excessive traffic and uncontrolled resource consumption.
```

Purpose:

```txt
Document how rate limit, quota and fail-closed behavior support SaaS control, runtime protection, cost governance and abuse reduction.
```

Verified markers:

```txt
HBCE IPR Runtime API v1 — Anti-Abuso API
ANTI_ABUSO_API_DOCUMENTATION_READY
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_DOCUMENTED
RATE_LIMIT_EXCEEDED
legalCertification=false
OPC=technical proof receipt only
```

Linked script:

```txt
scripts/test-api-v1-rate-limit-quota.mjs
```

Verification:

```txt
node --check scripts/test-api-v1-rate-limit-quota.mjs
```

Status:

```txt
PASS
```

---

### 2026-06-11 — Rate limit / quota smoke test script added

**Commit:** `fd1af9b`  
**File:** `scripts/test-api-v1-rate-limit-quota.mjs`

Summary:

```txt
Added the API v1 rate limit / quota smoke test script.
```

Purpose:

```txt
Provide a bounded smoke test for the API v1 rate limit / quota posture and fail-closed behavior.
```

Verified markers:

```txt
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS
API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_FAIL
RATE_LIMIT_EXCEEDED
legalCertification=false
technical proof receipt only
chat without key fail-closed
bounded rate-limit probe
HBCE_API_V1_RATE_LIMIT_PROBE
/api/v1/chat
/api/v1/ipr/session
```

Syntax check:

```txt
node --check scripts/test-api-v1-rate-limit-quota.mjs
```

Status:

```txt
PASS
```

---

### 2026-06-11 — Source Intelligence workflow documentation added

**Commit:** `33e2e22`  
**File:** `docs/product/hbce-ipr-runtime-api-v1-source-intelligence-workflow.md`

Summary:

```txt
Added controlled Source Intelligence workflow documentation for API v1.
```

Purpose:

```txt
Document source sets, source catalog, controlled fetch, source hashing, source summary, prompt-injection screening and runtime linkage through chat, EVT, OPC and audit.
```

Verified markers:

```txt
HBCE IPR Runtime API v1 — Source Intelligence Workflow
API_V1_CLIENT_SMOKE_TEST_PASS
pilot source intelligence workflow ready
legalCertification=false
technical source receipt only
rawTextPersistence=false
GET /api/v1/source-intelligence
POST /api/v1/source-intelligence
POST /api/v1/chat
GET /api/v1/events?eventId
RATE_LIMIT_EXCEEDED
```

Formula:

```txt
Source Intelligence workflow = pilot-ready
```

Status:

```txt
PASS
```

---

### 2026-06-11 — Files workflow documentation added

**Commit:** `985d5ad`  
**File:** `docs/product/hbce-ipr-runtime-api-v1-files-workflow.md`

Summary:

```txt
Added controlled Files workflow documentation for API v1.
```

Purpose:

```txt
Document upload, file descriptors, hash handling, raw text boundaries, prompt-injection risk and runtime linkage through chat, EVT, OPC and audit.
```

Verified markers:

```txt
HBCE IPR Runtime API v1 — Files Workflow
API_V1_CLIENT_SMOKE_TEST_PASS
pilot files workflow ready
legalCertification=false
technical proof receipt only
rawTextPersistence=false
POST /api/v1/files
POST /api/v1/chat
GET /api/v1/events?eventId
RATE_LIMIT_EXCEEDED
```

Formula:

```txt
files workflow = pilot-ready
```

Status:

```txt
PASS
```

---

## 4. Product interpretation

The API v1 package has moved from isolated documentation files into a coordinated product documentation set.

Current product posture:

```txt
controlled B2B / B2G pilot-ready governed runtime API
```

The package now includes:

```txt
client product note
client smoke test report
integration guide
quickstart
pilot package
product index
security checklist
rate limit / quota policy
Anti-Abuso API documentation
partner onboarding
B2B / B2G partner pitch
cURL examples
files workflow
source intelligence workflow
rate limit / quota smoke script
```

This matters because a SaaS API is not only an endpoint. A SaaS API must be:

```txt
documented
bounded
testable
partner-readable
operator-readable
security-reviewable
quota-aware
workflow-aware
fail-closed
commercially explainable
```

An undocumented API is just a public surface waiting to become someone else's incident report. Humanity calls this innovation, for reasons still unclear.

---

## 5. Boundaries and non-claims

This changelog does not claim that HBCE IPR Runtime API v1 is:

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

Boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
rawTextPersistence=false by default
```

---

## 6. Recommended next work

After this changelog is added and verified, the next work should proceed one step at a time:

```txt
1. Verify changelog on Linux after pull.
2. Add changelog reference to the product index if needed.
3. Create Source Intelligence route smoke test script.
4. Create Files workflow smoke test script.
5. Create OpenAPI examples update.
6. Create Postman collection.
7. Create partner email package.
8. Create public one-page PDF.
9. Move from documentation package to runtime enforcement improvements where needed.
```

Recommended immediate next step:

```txt
Verify this changelog file on Linux after commit and push.
```

---

## 7. Final changelog verdict

```txt
HBCE IPR Runtime API v1 product changelog = ready
```

Package state:

```txt
API v1 product package = pilot-ready
Anti-Abuso API = documented
Product index = updated
Rate limit / quota smoke script = checked
Files workflow = documented
Source Intelligence workflow = documented
```

Final boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
rawTextPersistence=false by default
