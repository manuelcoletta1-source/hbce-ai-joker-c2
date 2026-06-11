# HBCE IPR Runtime API v1 — Product Documentation Index

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Repository:** `hbce-ai-joker-c2`  
**Index status:** `API v1 product documentation map`  
**Audience:** internal operators, technical partners, B2B / B2G pilot evaluators, integration developers  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Purpose

This document is the product documentation index for the HBCE IPR Runtime API v1 package.

It collects the current technical, integration and pilot-facing documents into one navigable map.

The goal is simple: prevent the API v1 documentation from becoming a pile of scattered Markdown files quietly rotting in a folder, which is apparently how many software projects choose to express themselves.

---

## 2. Current product state

The API v1 package is currently validated as a controlled pilot-ready surface.

Current status:

```txt
API v1 public surface = PASS
/api/v1/files route = PASS
TypeScript client = PASS
client product note = PASS
client smoke test live = PASS
client smoke test report = PASS
integration guide = PASS
pilot package = PASS
quickstart = PASS
```

Canonical live smoke result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Boundary preserved:

```txt
legalCertification=false
OPC=technical proof receipt only
```

---

## 3. Documentation map

### 3.1 Client product note

```txt
docs/product/hbce-ipr-runtime-api-v1-client.md
```

Purpose:

```txt
Describes the API v1 client asset, its role, supported runtime surface and product positioning.
```

Audience:

```txt
internal technical team
partner-facing technical review
client library maintainers
```

Use this when someone asks:

```txt
What is the client asset and why does it exist?
```

---

### 3.2 Client smoke test report

```txt
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
```

Purpose:

```txt
Documents the live client smoke test, the final PASS result, checked routes, failure history and boundaries.
```

Key result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Use this when someone asks:

```txt
Was the API v1 client flow tested live?
What exactly passed?
What does the smoke test prove?
```

---

### 3.3 Integration guide

```txt
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
```

Purpose:

```txt
Provides the full technical integration guide for external API v1 usage.
```

Covers:

```txt
base URL
authentication
public discovery
IPR session creation
authenticated chat
EVT lookup
OPC lookup
audit lookup
files route
source intelligence extension
error handling
pilot integration sequence
```

Use this when someone asks:

```txt
How does a partner integrate with the API?
```

---

### 3.4 Pilot package

```txt
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
```

Purpose:

```txt
Presents the API v1 as a controlled B2B / B2G pilot package.
```

Covers:

```txt
product positioning
target users
pilot value proposition
validated components
pilot phases
success criteria
B2B use cases
B2G use cases
partner onboarding checklist
security requirements
pilot verdict
```

Use this when someone asks:

```txt
Can this be presented to a partner or institution?
```

---

### 3.5 Quickstart

```txt
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
```

Purpose:

```txt
Provides the shortest practical path for a technical partner to run an API v1 test.
```

Covers:

```txt
base URL
safe API key handling
health check
fail-closed chat check
IPR session creation
authenticated chat
EVT / OPC / audit extraction
lookup calls
smoke test command
common failures
```

Use this when someone asks:

```txt
How do I run the first test quickly?
```

---

## 4. Executable and code assets

### 4.1 TypeScript client

```txt
lib/api-v1-client.ts
```

Purpose:

```txt
Internal TypeScript client foundation for API v1 calls.
```

Use this for:

```txt
programmatic client integration
future npm/client package extraction
typed request and response handling
runtime-safe external client logic
```

---

### 4.2 Client smoke test

```txt
scripts/test-api-v1-client-smoke.mjs
```

Purpose:

```txt
Executable live client smoke test for API v1.
```

Runtime:

```txt
Node.js 18+
native fetch
no external dependencies
```

Final validated result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Use this for:

```txt
post-deploy validation
partner sandbox validation
technical access verification
regression check after API v1 changes
```

---

## 5. Public API v1 surface

The documented API v1 surface includes:

```txt
GET  /api/v1
GET  /api/v1/health
GET  /api/v1/capabilities
GET  /api/v1/self-test
GET  /api/v1/openapi
POST /api/v1/ipr/session
POST /api/v1/chat
POST /api/v1/files
GET  /api/v1/operations/{operationId}
GET  /api/v1/events?eventId={eventId}
GET  /api/v1/opc/{opcId}
GET  /api/v1/audit/{auditId}
GET  /api/v1/model-usage/{usageId}
```

Important event lookup distinction:

```txt
Correct:   GET /api/v1/events?eventId=EVT-...
Incorrect: GET /api/v1/events/EVT-...
```

The implemented route is:

```txt
app/api/v1/events/route.ts
```

not:

```txt
app/api/v1/events/[eventId]/route.ts
```

---

## 6. Product narrative

The API v1 package should be described as:

```txt
HBCE IPR Runtime API v1 exposes a controlled interface for identity-bound AI execution through JOKER-C2. A partner can create an IPR-bound session, execute an authenticated AI interaction, receive technical runtime identifiers such as EVT, OPC and audit IDs, and inspect public proof and audit envelopes without accessing raw internal runtime data.
```

Short pitch:

```txt
HBCE IPR Runtime API v1 turns AI execution into a governed runtime event: identity-bound, traceable, auditable and supported by technical proof receipts.
```

Do not describe it as:

```txt
legal certification system
official identity provider
qualified signature service
public certification authority
unrestricted AI agent platform
raw database access API
```

Because it is not those things, and pretending otherwise is how documentation becomes a legal bonfire.

---

## 7. Canonical architecture sentence

Use this sentence when explaining the runtime model:

```txt
IPR identifies the operational subject. JOKER-C2 executes the governed AI interaction. EVT traces the event. OPC produces the technical proof receipt. Audit records the control envelope. MATRIX organizes the process. HBCE governs the runtime.
```

---

## 8. Validation history

The package has passed the following major validations:

```txt
API v1 public surface live test = PASS
API v1 client smoke test = PASS
API v1 events lookup path fix = PASS
API v1 client smoke test report = PASS
API v1 integration guide = PASS
API v1 pilot package = PASS
API v1 quickstart = PASS
```

Final smoke state:

```txt
node runtime = PASS
root discovery = PASS
health = PASS
capabilities = PASS
self-test = PASS
openapi = PASS
chat without key fail-closed = PASS
ipr session create = PASS
chat with key = PASS
operations lookup = PASS
events lookup = PASS
opc lookup = PASS
audit lookup = PASS
model usage lookup = SKIPPED when usageId=NONE
```

---

## 9. Recommended reading order

For internal operators:

```txt
1. hbce-ipr-runtime-api-v1-product-index.md
2. hbce-ipr-runtime-api-v1-client-smoke-test.md
3. hbce-ipr-runtime-api-v1-integration-guide.md
4. hbce-ipr-runtime-api-v1-pilot-package.md
5. hbce-ipr-runtime-api-v1-quickstart.md
```

For technical partners:

```txt
1. hbce-ipr-runtime-api-v1-quickstart.md
2. hbce-ipr-runtime-api-v1-integration-guide.md
3. hbce-ipr-runtime-api-v1-client-smoke-test.md
```

For B2B / B2G pilot discussion:

```txt
1. hbce-ipr-runtime-api-v1-pilot-package.md
2. hbce-ipr-runtime-api-v1-quickstart.md
3. hbce-ipr-runtime-api-v1-integration-guide.md
```

For developers:

```txt
1. scripts/test-api-v1-client-smoke.mjs
2. lib/api-v1-client.ts
3. hbce-ipr-runtime-api-v1-integration-guide.md
4. hbce-ipr-runtime-api-v1-client-smoke-test.md
```

---

## 10. Quick live validation command

The executable smoke command is documented in full in:

```txt
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
```

Canonical result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

If a future deploy changes the API v1 behavior, run:

```txt
scripts/test-api-v1-client-smoke.mjs
```

before presenting the package externally.

---

## 11. API key and secret handling

Never place API keys in:

```txt
documentation examples
commit messages
issues
chat transcripts
screenshots
public logs
source files
Markdown reports
```

Safe terminal pattern:

```bash
read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo
```

Then clear:

```bash
unset HBCE_API_V1_KEY
```

The smoke test prints only:

```txt
apiKey=SET
```

or:

```txt
apiKey=MISSING
```

It must not print the key value.

---

## 12. Boundary statement

This boundary must remain visible across all product documentation:

```txt
legalCertification=false
OPC=technical proof receipt only
IPR Card is an internal operational identity certificate, not an official public identity document
```

The API can provide technical runtime receipts.

It does not provide legal certification.

It does not turn an AI runtime into a public legal authority, despite humanity’s long-running habit of confusing labels with legitimacy.

---

## 13. Partner pilot positioning

The current package is ready for controlled pilot discussion with partners who need:

```txt
governed AI interaction
identity-bound execution
event traceability
technical proof receipts
audit envelopes
fail-closed access
tenant/workspace scope
clear legal boundary
```

Recommended pilot domains:

```txt
compliance
cybersecurity
AI governance
legal-tech
B2B software integration
B2G technical evaluation
institutional AI audit workflows
controlled source intelligence
document governance
```

---

## 14. Next documentation candidates

Possible next documents:

```txt
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
docs/product/hbce-ipr-runtime-api-v1-partner-onboarding.md
docs/product/hbce-ipr-runtime-api-v1-postman-collection.md
docs/product/hbce-ipr-runtime-api-v1-curl-examples.md
docs/product/hbce-ipr-runtime-api-v1-source-intelligence-pilot.md
docs/product/hbce-ipr-runtime-api-v1-files-workflow.md
```

These are optional next steps. The current product package already has enough structure for a controlled pilot presentation.

---

## 15. Final index verdict

```txt
HBCE IPR Runtime API v1 product documentation = indexed and pilot-ready
```

Current state:

```txt
public surface = PASS
client = PASS
smoke test = PASS
smoke report = PASS
integration guide = PASS
pilot package = PASS
quickstart = PASS
product index = ready
legalCertification=false = preserved
OPC technical proof receipt boundary = preserved
```

This index is the entry point for navigating the API v1 product documentation package.
