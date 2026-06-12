# HBCE IPR Runtime API v1 — Source Intelligence Release Note

Product: HBCE IPR Operational Identity & Proof Layer
Runtime: AI JOKER-C2 SaaS Core v0.1
Repository: "hbce-ai-joker-c2"
API version: "v1"
Release note type: internal product release note
Release status: "source intelligence package closed pass"
Final commit: "471ab95 Update API v1 product index with source intelligence smoke report"
Boundary: "legalCertification=false"
OPC boundary: technical proof receipt only
Raw text boundary: "rawTextPersistence=false"

---

1. Purpose

This release note records the closure of the HBCE IPR Runtime API v1 Source Intelligence package.

The package is now documented, indexed, smoke-tested, production-checked and aligned with the API v1 product documentation set.

The purpose of this note is to preserve a compact operational record of what has been completed, which files are involved, which boundaries were verified, and which production endpoints passed.

This is not a legal certification document. It is an internal technical release note for the HBCE / JOKER-C2 API v1 product package.

---

2. Final package status

SOURCE INTELLIGENCE SMOKE REPORT PACKAGE = CHIUSO PASS
PRODUCT INDEX = CHIUSO PASS
VERCEL PRODUCTION = CHIUSO PASS

Final Git state:

HEAD/origin/main/origin/HEAD = 471ab95
git status = ## main...origin/main

Final production status:

GET /api/v1/health = PASS
GET /api/v1 = PASS
POST /api/v1/chat without key = 401 MISSING_API_KEY / FAIL_CLOSED = PASS

---

3. Final commit chain

Relevant commits:

471ab95 Update API v1 product index with source intelligence smoke report
62e6b1e Fix API v1 source intelligence smoke test report markdown
1ca8e1a Refactor API v1 source intelligence smoke test report
bf6bc75 Add API v1 source intelligence smoke test report
da3bc8c Resolve API v1 product index and source intelligence script divergence
85cadeb Update API v1 source intelligence smoke test
82277c7 Add API v1 source intelligence smoke test

Operational interpretation:

The Source Intelligence smoke test script was created and updated.
The report was created.
The report was corrected into proper Markdown.
The product index was updated to include the report.
The final main branch was verified against Vercel production.

---

4. Files closed in this release

4.1 Source Intelligence smoke test script

scripts/test-api-v1-source-intelligence.mjs

Status:

PASS
841 lines
node --check = PASS

Core markers:

API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_PASS
API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_FAIL
SOURCE_INTELLIGENCE_WORKFLOW_READY
RATE_LIMIT_EXCEEDED
GET /api/v1/source-intelligence
POST /api/v1/source-intelligence
POST /api/v1/chat
HBCE_API_V1_SOURCE_FETCH_LIVE
HBCE_API_V1_SOURCE_CHAT_LINK
legalCertification=false
rawTextPersistence=false
technical source receipt only

---

4.2 Source Intelligence smoke test report

docs/product/hbce-ipr-runtime-api-v1-source-intelligence-smoke-test.md

Status:

PASS
526 lines
Markdown H1 = PASS
Markdown sections = PASS
terminal noise check = PASS

Confirmed sections:

# HBCE IPR Runtime API v1 — Source Intelligence Smoke Test Report
## 1. Purpose
## 2. Tested script
## 3. Script validation result
## 10. No-key chat boundary
## 17. Product package integration
## 19. Final verdict

Confirmed report markers:

source intelligence smoke test report = ready
scripts/test-api-v1-source-intelligence.mjs
SOURCE_INTELLIGENCE_WORKFLOW_READY
rawTextPersistence=false
legalCertification=false
technical source receipt only
MISSING_API_KEY
FAIL_CLOSED
hbce-ipr-runtime-api-v1-source-intelligence-smoke-test.md

---

4.3 Product documentation index

docs/product/hbce-ipr-runtime-api-v1-product-index.md

Status:

PASS
1278 lines
report indexed = PASS
terminal noise check = PASS

Confirmed index markers:

hbce-ipr-runtime-api-v1-source-intelligence-smoke-test.md
Source Intelligence smoke test report
source-intelligence-smoke-test-report-ready

Known index locations:

line 133
line 162
line 177
line 192
line 909
line 1205

---

5. Production verification

Production base URL:

https://hbce-ai-joker-c2.vercel.app

Checked endpoints:

GET /api/v1/health
GET /api/v1
POST /api/v1/chat

Observed production markers:

HBCE_IPR_RUNTIME_API_READY
HBCE_IPR_RUNTIME_CHAT_ENDPOINT_READY
SOURCE_INTELLIGENCE_READY
SOURCESET_REGISTRY_READY
rawTextPersistence=false
legalCertification=false
technical proof receipt only
MISSING_API_KEY
FAIL_CLOSED

---

6. Health endpoint status

Endpoint:

GET /api/v1/health

Observed status:

HBCE_IPR_RUNTIME_API_READY

Observed Source Intelligence status:

SOURCE_INTELLIGENCE_READY
SOURCESET_REGISTRY_READY
sourceSets=5
catalogSources=19
rawTextPersistence=false

Observed boundary:

legalCertification=false
opc=technical proof receipt only
sourceRawTextPersistence=false
sourceProfilePersistence=explicit operator save only

Verdict:

/api/v1/health = PASS

---

7. Root discovery status

Endpoint:

GET /api/v1

Observed status:

HBCE_IPR_RUNTIME_CHAT_ENDPOINT_READY

Observed auth gate:

authGate.required=true
acceptedHeaders=x-hbce-api-key or Authorization: Bearer <token>

Observed boundary:

legalCertification=false
opc=technical proof receipt only
rawTextPersistence=false
sourceProfileSaveMode=EXPLICIT_OPERATOR_SAVE_ONLY
automaticIprMemoryWrite=false

Verdict:

/api/v1 = PASS

---

8. No-key chat boundary

Endpoint:

POST /api/v1/chat

Test condition:

request sent without API key

Observed HTTP status:

401

Observed fail reason:

MISSING_API_KEY

Observed policy:

FAIL_CLOSED

Verdict:

POST /api/v1/chat without key = PASS

Interpretation:

The API v1 chat endpoint refuses unauthenticated execution.
The auth gate is active.
The fail-closed policy is enforced.
No uncontrolled runtime execution is allowed without pilot API key.

---

9. Source Intelligence package posture

The Source Intelligence API v1 package is now closed under this posture:

source-set bound
allowlist-oriented
catalog-first
rawTextPersistence=false
legalCertification=false
technical source receipt only
explicit operator save only
fail-closed on unauthorized access
production checked
product indexed

This means the Source Intelligence layer is positioned as a governed B2B / B2G workflow, not as uncontrolled browsing or generic scraping.

---

10. Non-claims

This release note does not claim:

legal certification
public evidence certification
unrestricted source crawling
unrestricted browsing
unrestricted scraping
automatic raw text persistence
public identity certification
production commercial availability without pilot/incubation/agreement

Correct claim:

The Source Intelligence workflow is a governed API v1 source-bound intelligence layer with documented smoke test, indexed product report, production boundary check and fail-closed authentication behavior.

---

11. Product package impact

The API v1 product package now contains a stronger Source Intelligence documentation chain:

source intelligence workflow document
source intelligence smoke test script
source intelligence smoke test report
product index references
production verification
fail-closed no-key test

This improves the package for:

internal operators
technical reviewers
B2B partners
B2G evaluators
security reviewers
pilot onboarding

---

12. Final verdict

HBCE IPR Runtime API v1 Source Intelligence release note = ready

Operational closure:

script = PASS
report = PASS
Markdown = PASS
product index = PASS
GitHub main = PASS
Vercel production = PASS
no-key chat fail-closed = PASS

Final marker:

SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
