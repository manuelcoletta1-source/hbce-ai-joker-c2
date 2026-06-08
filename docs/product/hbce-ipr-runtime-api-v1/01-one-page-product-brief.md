HBCE IPR Runtime API v1

Operational Identity & Proof Layer for governed AI execution

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Layer: HBCE IPR Operational Identity & Proof Layer
Target: B2B / B2G
Boundary: "legalCertification=false"

---

Product definition

HBCE IPR Runtime API v1 is the public API layer of JOKER-C2 SaaS Core v0.1.

It enables governed AI interactions where each request can be linked to:

IPR = operational identity / proof layer
EVT = technical event trace
OPC = technical proof receipt
AUDIT = runtime audit record
USAGE = model usage / accounting record
POLICY = runtime governance decision
MATRIX = process organization layer

It is not a generic workflow SDK.
It is an Operational Identity & Proof Layer for governed AI execution.

---

The problem

Most AI systems can generate answers, but they do not natively bind those answers to an operational chain.

For B2B and B2G environments, the relevant question is not only:

What did the AI answer?

The relevant questions are:

Who initiated the request?
Which runtime processed it?
Which policy applied?
Which model was used?
Which event was generated?
Which proof receipt was created?
Which audit trail exists?
What is the legal boundary?

A chatbot response is not enough for institutional, enterprise or compliance-sensitive use.

Organizations need identity-bound, auditable and policy-governed AI execution.

---

The HBCE/JOKER-C2 solution

HBCE IPR Runtime API v1 introduces a governed runtime chain:

IPR identifies the operational subject.
JOKER-C2 executes the governed AI interaction.
EVT traces the technical event.
OPC produces the technical proof receipt.
AUDIT stores the runtime decision trail.
USAGE records model and accounting metadata.
MATRIX organizes the process.
HBCE governs the runtime.

The result is an API surface designed for controlled AI interaction, audit-ready execution and technical proof continuity.

---

Public API surface

Recommended production/API-gateway form:

/v1

Current JOKER-C2 SaaS route form validated in runtime tests:

/api/v1

Public endpoint surface:

GET  /v1/health
GET  /v1/capabilities
POST /v1/ipr/session
GET  /v1/ipr/session/{sessionId}
POST /v1/chat
POST /v1/files
POST /v1/operations
GET  /v1/operations/{operationId}
GET  /v1/events
GET  /v1/opc/{opcId}
GET  /v1/audit/{auditId}
GET  /v1/model-usage/{usageId}
GET  /v1/openapi
GET  /v1/self-test
GET  /v1/source-intelligence

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
controlled B2B/B2G interaction
audit-ready AI response generation

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

The SDK is the developer integration layer for the HBCE IPR Runtime API.

It is not the product itself.

The product is the governed runtime API connecting identity, event, proof, audit, usage and policy.

---

Demo

Primary demo:

IPR AI Audit Trail Demo

Demo chain:

1. Open verified IPR session.
2. Send request through /v1/chat.
3. Apply governance checks.
4. Route model and generate governed response.
5. Generate EVT.
6. Generate OPC technical proof receipt.
7. Persist audit log.
8. Persist model usage log.
9. Display dashboard with Dual-Time Seal.

---

Validation status

Current API v1 public surface validation:

API v1 public surface = PASS
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

Target users

HBCE IPR Runtime API v1 is designed for:

companies integrating governed AI into internal processes
compliance and audit teams
public-sector pilots
institutional innovation units
software houses requiring traceable AI execution
B2B/B2G systems requiring identity, event, proof and policy linkage

---

Legal and operational boundary

legalCertification=false
OPC is a technical proof receipt only.
IPR is an operational identity/proof layer only.
EVT is a technical event trace only.
IPR Card is an internal operational identity certificate, not an official public identity document.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure, not a public authority and not a legal certifier.

---

Positioning statement

HBCE IPR Runtime API v1 turns AI interaction into an operationally identifiable, technically traceable and audit-ready runtime event.

It does not replace legal certification.

It provides the infrastructure layer needed before responsible AI execution can be governed, inspected and integrated.
