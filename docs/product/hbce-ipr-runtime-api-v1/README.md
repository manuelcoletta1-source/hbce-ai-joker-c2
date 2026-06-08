HBCE IPR Runtime API v1

Product: HBCE IPR Operational Identity & Proof Layer
Runtime: JOKER-C2 SaaS Core v0.1
Target: B2B / B2G
Status: API v1 public surface contract-only regression PASS
Boundary: "legalCertification=false"

---

Product definition

HBCE IPR Runtime API v1 is the public B2B/B2G API layer of JOKER-C2 SaaS Core v0.1.

It exposes an operational identity and proof layer for governed AI execution.

It is not a generic workflow SDK.

It is designed to connect AI interaction with:

IPR  = operational identity / proof layer
EVT  = technical event trace
OPC  = technical proof receipt
AUDIT = runtime audit record
USAGE = model usage / accounting record
MATRIX = process organization layer
HBCE = runtime governance layer

---

Operational formula

IPR identifies the operational subject.
JOKER-C2 executes the governed AI interaction.
EVT traces the technical event.
OPC produces the technical proof receipt.
MATRIX organizes the process.
HBCE governs the runtime.

---

Public API surface

Recommended production/API-gateway form:

/v1

Current JOKER-C2 SaaS route form validated in runtime tests:

/api/v1

Validated endpoint matrix:

GET  /api/v1 = PASS
GET  /api/v1/health = PASS
GET  /api/v1/capabilities = PASS
POST /api/v1/ipr/session = PASS
GET  /api/v1/ipr/session/{sessionId} = PASS
POST /api/v1/chat = PASS
POST /api/v1/files = PASS
POST /api/v1/operations = PASS
GET  /api/v1/operations/{operationId} = PASS
GET  /api/v1/events = PASS
GET  /api/v1/opc/{opcId} = PASS
GET  /api/v1/audit/{auditId} = PASS
GET  /api/v1/model-usage/{usageId} = PASS
GET  /api/v1/openapi = PASS
GET  /api/v1/self-test = PASS
GET  /api/v1/source-intelligence = PASS

---

Documentation files

01-one-page-product-brief.md
02-technical-api-contract-sheet.md
03-ipr-ai-audit-trail-demo-script.md
04-api-v1-public-surface-regression-v76.md

---

Primary synchronous contract

"POST /v1/chat"

Minimum input:

{
  "sessionId": "string",
  "humanIpr": "string",
  "message": "string",
  "files": [],
  "constraints": {},
  "idempotencyKey": "string"
}

Minimum output:

{
  "answer": "string",
  "responseEvt": "string",
  "opcId": "string",
  "auditId": "string",
  "usageId": "string",
  "temporalSeal": "string",
  "memory": {},
  "policy": {},
  "risk": {},
  "legalCertification": false
}

Use cases:

direct governed AI chat
institutional request handling
IPR AI Audit Trail Demo
controlled B2B/B2G AI interaction
audit-ready answer generation

---

Primary asynchronous contract

"POST /v1/operations"

Minimum input:

{
  "operationType": "string",
  "subjectIpr": "string",
  "payload": {},
  "constraints": {},
  "idempotencyKey": "string"
}

Minimum output:

{
  "operationId": "string",
  "status": "string",
  "responseEvt": "string",
  "opcId": "string",
  "createdAt": "string",
  "legalCertification": false
}

Use cases:

document audit
long-running workflow
proof pipeline
heavy analysis
polling or webhook-based operation tracking

---

SDK

Primary SDK:

@hbce/ipr-runtime-sdk

Proposed TypeScript structure:

src/client.ts
src/types.ts
src/errors.ts
src/endpoints/health.ts
src/endpoints/ipr-session.ts
src/endpoints/chat.ts
src/endpoints/operations.ts
src/endpoints/events.ts
src/endpoints/opc.ts
examples/ipr-ai-audit-trail-demo.ts

---

Validation status

Current validation after v76 regression:

API v1 public surface = PASS
Endpoint count = 16
Endpoint coverage = 16/16 PASS
Contract-only execution = PASS
Semantic memory creation blocked = PASS
IPR memory creation blocked = PASS
Runtime memory write suppressed = PASS
Source Intelligence live execution blocked = PASS
Document ingestion blocked = PASS
Document recall blocked = PASS
legalCertification=false = PASS

---

Mandatory boundary

legalCertification=false
OPC is a technical proof receipt only.
IPR is an operational identity/proof layer only.
EVT is a technical event trace only.
IPR Card is an internal operational identity certificate, not an official public identity document.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure, not a public authority and not a legal certifier.
