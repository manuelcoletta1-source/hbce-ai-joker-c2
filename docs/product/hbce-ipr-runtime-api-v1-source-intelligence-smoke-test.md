HBCE IPR Runtime API v1 — Source Intelligence Smoke Test Report

Product: HBCE IPR Operational Identity & Proof Layer
Runtime: AI JOKER-C2 SaaS Core v0.1
API version: "v1"
Repository: "hbce-ai-joker-c2"
Document type: Source Intelligence smoke test report
Report status: "source intelligence smoke test report = ready"
Script: "scripts/test-api-v1-source-intelligence.mjs"
Production base URL: "https://hbce-ai-joker-c2.vercel.app"
Boundary: "legalCertification=false"
Raw text boundary: "rawTextPersistence=false"
OPC boundary: technical source receipt only

---

1. Purpose

This document records the API v1 Source Intelligence smoke test posture for HBCE / JOKER-C2.

It documents the tested script, the expected markers, the production boundary checks and the runtime Source Intelligence readiness signals.

The goal is to make the Source Intelligence workflow auditable as part of the API v1 product package.

The smoke test validates that Source Intelligence can be treated as a governed B2B / B2G source-bound intelligence workflow, not as unrestricted browsing, uncontrolled scraping or raw text persistence.

---

2. Tested script

Canonical script path:

scripts/test-api-v1-source-intelligence.mjs

Expected executable markers:

API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_PASS
API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_FAIL
SOURCE_INTELLIGENCE_WORKFLOW_READY
RATE_LIMIT_EXCEEDED

Expected route markers:

GET /api/v1/source-intelligence
POST /api/v1/source-intelligence
POST /api/v1/chat
GET /api/v1/events?eventId
POST /api/v1/ipr/session

Expected environment toggles:

HBCE_API_V1_SOURCE_FETCH_LIVE
HBCE_API_V1_SOURCE_CHAT_LINK

Expected boundary markers:

legalCertification=false
rawTextPersistence=false
technical source receipt only

---

3. Script validation result

Local Linux validation confirmed:

scripts/test-api-v1-source-intelligence.mjs
841 lines
node --check = PASS

Required markers found:

API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_PASS
API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_FAIL
SOURCE_INTELLIGENCE_WORKFLOW_READY
RATE_LIMIT_EXCEEDED
legalCertification=false
rawTextPersistence=false
technical source receipt only
GET /api/v1/source-intelligence
POST /api/v1/source-intelligence
POST /api/v1/chat
HBCE_API_V1_SOURCE_FETCH_LIVE
HBCE_API_V1_SOURCE_CHAT_LINK

Script cleanliness check:

no terminal noise detected
no pasted shell prompt detected
no Git output embedded in script

Status:

API v1 source intelligence smoke test script = PASS

---

4. Production verification result

Production verification was executed against:

https://hbce-ai-joker-c2.vercel.app

Production check status:

CHECK VERCEL PRODUCTION PASS

Git state at verification:

Already up to date.
## main...origin/main
HEAD = da3bc8c

Active commit:

da3bc8c Resolve API v1 product index and source intelligence script divergence

---

5. Production endpoints checked

The following production endpoints were checked:

GET /api/v1/health
GET /api/v1/capabilities
GET /api/v1
POST /api/v1/chat without API key

Observed results:

GET /api/v1/health = PASS
GET /api/v1/capabilities = PASS
GET /api/v1 = PASS
POST /api/v1/chat without API key = 401 FAIL_CLOSED = PASS

The no-key chat check confirmed that "/api/v1/chat" does not execute without an accepted API key.

This is a required API v1 pilot boundary.

---

6. Health endpoint result

Production endpoint:

GET /api/v1/health

Observed status:

HBCE_IPR_RUNTIME_API_READY

Source Intelligence block:

SOURCE_INTELLIGENCE_READY
HBCE_SOURCE_INTELLIGENCE_LAYER-v0.3-SOURCESET_REGISTRY
SOURCESET_REGISTRY_READY
sourceSets=5
catalogSources=19
ALLOWLIST_ONLY
rawTextPersistence=false
PDF_BINARY_HASH_ONLY_UNTIL_EXPLICIT_TEXT_EXTRACTION
EXPLICIT_OPERATOR_SAVE_ONLY

Boundary markers:

legalCertification=false
technical proof receipt only
sourceRawTextPersistence=false
sourceProfilePersistence=explicit operator save only

Health verdict:

GET /api/v1/health = PASS

---

7. Capabilities endpoint result

Production endpoint:

GET /api/v1/capabilities

Observed status:

HBCE_IPR_RUNTIME_API_CAPABILITIES_READY

Source Intelligence capability:

SOURCE_INTELLIGENCE_V0_3
READY

Source Intelligence production posture:

SOURCE_INTELLIGENCE_V0_3_READY
SOURCESET_REGISTRY_READY
sourceSetsAvailable=5
catalogSources=19

Endpoint coverage:

health=PASS
search=PASS
fetch=PASS
verify=PASS
register=PASS
summarize=PASS
chatMultiSourceSet=PASS

Capabilities verdict:

GET /api/v1/capabilities = PASS

---

8. Available source sets

Production capabilities exposed the following Source Intelligence source sets:

ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK
EU_AI_GOVERNANCE_REGULATORY_STACK
ENISA_CYBER_THREAT_LANDSCAPE
ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK
OPENAI_AGENTIC_SYSTEMS_SECURITY

Interpretation:

Source Intelligence registry is multi-domain.
Source sets are explicit.
Catalog sources are counted.
Source-set execution is not unrestricted browsing.

---

9. Root discovery result

Production endpoint:

GET /api/v1

Observed status:

HBCE_IPR_RUNTIME_CHAT_ENDPOINT_READY

Route revision:

HBCE-IPR-RUNTIME-API-v1-CHAT_BRIDGE_AUTH_GATE_PRIORITY-v77_3

Auth gate:

required=true
checkedBeforeJsonBody=true
acceptedHeaders=x-hbce-api-key or Authorization: Bearer <token>

Boundary:

legalCertification=false
opc=technical proof receipt only
rawTextPersistence=false
sourceProfileSaveMode=EXPLICIT_OPERATOR_SAVE_ONLY
automaticIprMemoryWrite=false

Root discovery verdict:

GET /api/v1 = PASS

---

10. No-key chat boundary

Production endpoint:

POST /api/v1/chat

Test condition:

request sent without API key

Observed HTTP status:

401

Observed fail reason:

MISSING_API_KEY

Observed policy:

FAIL_CLOSED

Observed boundary:

legalCertification=false
rawTextPersistence=false
sourceIntelligenceRawTextPersistence=false
automaticIprMemoryWrite=false

Verdict:

POST /api/v1/chat without key = FAIL_CLOSED PASS

This confirms that the API v1 chat surface rejects unauthenticated execution before allowing governed runtime processing.

---

11. Source Intelligence security posture

The Source Intelligence workflow is validated under the following constraints:

allowlistOnly=true
rawTextPersistence=false
sourceProfilePersistence=EXPLICIT_OPERATOR_SAVE_ONLY
promptInjectionScreening=READY
failClosedOnUnverifiedSource=true
pdfBoundary=PDF_BINARY_HASH_ONLY_UNTIL_EXPLICIT_TEXT_EXTRACTION

Operational interpretation:

The Source Intelligence layer is source-set bound.
It does not behave as unrestricted browsing.
It does not persist raw source text by default.
It requires explicit operator save for source profile persistence.
It preserves technical proof boundaries.

---

12. Script default behavior

The smoke test script defaults to safe mode.

Default fetch behavior:

HBCE_API_V1_SOURCE_FETCH_LIVE not set
fetchLive=false

Default chat linkage behavior:

HBCE_API_V1_SOURCE_CHAT_LINK not set
chatLink=false

Default persistence posture:

rawTextPersistence=false
legalCertification=false
opcBoundary=technical source receipt only

This default behavior is intentional.

The script can validate contract readiness without triggering uncontrolled live source fetch or automatic chat linkage.

---

13. Optional live source fetch

Live source fetch is controlled by:

HBCE_API_V1_SOURCE_FETCH_LIVE=1

When enabled, the workflow must still preserve:

sourceSet boundary
allowlist boundary
rawTextPersistence=false
legalCertification=false
technical source receipt only
promptInjectionRisk=CHECK_REQUIRED

Live source fetch must not be treated as unrestricted browsing.

---

14. Optional chat linkage

Source context linkage into chat is controlled by:

HBCE_API_V1_SOURCE_CHAT_LINK=1

When enabled, the script may call:

POST /api/v1/chat
GET /api/v1/events?eventId
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
GET /api/v1/model-usage/{usageId}

The expected chat boundary remains:

legalCertification=false
rawTextPersistence=false
technical source receipt only

---

15. Expected PASS output

A full successful smoke test should include:

API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_PASS
SOURCE_INTELLIGENCE_WORKFLOW_READY

A controlled rate-limit response is recognized through:

RATE_LIMIT_EXCEEDED

A failed smoke test should include:

API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_FAIL

---

16. Expected failure boundaries

Valid fail-closed conditions include:

MISSING_API_KEY
INVALID_API_KEY
RATE_LIMIT_EXCEEDED
UNKNOWN_SOURCE_SET
UNVERIFIED_SOURCE
URL_NOT_HTTPS_OR_DOMAIN_NOT_ALLOWLISTED

These are not necessarily product failures.

They may be correct boundary enforcement when the request violates the API v1 pilot rules.

---

17. Product package integration

This report belongs to the API v1 product package together with:

docs/product/hbce-ipr-runtime-api-v1-product-index.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-workflow.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
scripts/test-api-v1-source-intelligence.mjs

The product index must reference this report after creation.

Index integration target:

docs/product/hbce-ipr-runtime-api-v1-product-index.md

Expected index marker:

hbce-ipr-runtime-api-v1-source-intelligence-smoke-test.md

---

18. Non-claims

This report does not claim that Source Intelligence is:

unrestricted browsing
unrestricted scraping
legal certification
public evidence certification
a public source authority
a permanent raw-text archive
a general-purpose crawler
a public regulatory database

Correct claim:

Source Intelligence is a governed, source-set bound, allowlisted, audit-oriented API v1 workflow with rawTextPersistence=false and technical source receipt boundaries.

---

19. Final verdict

source intelligence smoke test report = ready

Operational status:

script = PASS
production health = PASS
production capabilities = PASS
root discovery = PASS
chat without key fail-closed = PASS
Source Intelligence v0.3 = READY
SourceSet registry = READY
rawTextPersistence=false = confirmed
legalCertification=false = confirmed
technical source receipt only = confirmed

Final marker:

SOURCE_INTELLIGENCE_WORKFLOW_READY
