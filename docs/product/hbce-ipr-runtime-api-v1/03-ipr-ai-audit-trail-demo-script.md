HBCE IPR Runtime API v1

IPR AI Audit Trail Demo Script

Demo name: IPR AI Audit Trail Demo
Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Layer: HBCE IPR Operational Identity & Proof Layer
Duration: 12 minutes
Target: B2B / B2G / institutional pilot
Boundary: "legalCertification=false"

---

1. Demo objective

This demo shows how HBCE IPR Runtime API v1 turns a standard AI request into an operationally identifiable, technically traceable and audit-ready runtime event.

The purpose is not to show another chatbot.

The purpose is to show a governed AI execution chain:

IPR → JOKER-C2 → EVT → OPC → AUDIT → MODEL USAGE → DASHBOARD

Where:

IPR identifies the operational subject.
JOKER-C2 executes the governed AI interaction.
EVT traces the technical event.
OPC produces the technical proof receipt.
AUDIT stores the runtime decision trail.
MODEL USAGE records model/accounting metadata.
MATRIX organizes the process.
HBCE governs the runtime.

---

2. Core message

Traditional AI systems answer questions.

HBCE/JOKER-C2 does something more specific:

It executes AI interactions inside an identity-bound, policy-governed and audit-ready runtime.

For B2B and B2G contexts, the relevant question is not only:

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

HBCE IPR Runtime API v1 provides the operational layer for that chain.

---

3. Demo scenario

A verified operator sends a controlled request to JOKER-C2 through the API.

The runtime:

1. opens or verifies an IPR session;
2. receives the AI request through "/v1/chat";
3. applies governance checks;
4. routes the model;
5. generates the governed response;
6. creates EVT;
7. creates OPC;
8. persists audit and model usage records;
9. displays the result in the dashboard with Dual-Time Seal.

---

4. Demo timeline — 12 minutes

0:00–1:30 — Problem framing

Speaker script

Enterprise and institutional AI adoption is blocked by a structural problem.

Most AI systems can generate an answer, but they do not natively bind that answer to an operational identity, a technical event trace, a proof receipt, an audit record and a model usage record.

For internal corporate use this is already a problem.

For regulated, institutional or B2G environments, it becomes a governance gap.

A normal chatbot can say something.

But when the output matters, the organization needs to know:

who asked,
under which scope,
which runtime executed,
which policy decision applied,
which event was generated,
which proof exists,
and what the legal boundary is.

HBCE IPR Runtime API v1 addresses this gap.

It is not a generic AI wrapper.

It is an Operational Identity & Proof Layer integrated into JOKER-C2 SaaS Core v0.1.

---

1:30–3:00 — IPR session

Screen/action

Show endpoint:

POST /v1/ipr/session

or current runtime route:

POST /api/v1/ipr/session

Speaker script

The first step is identity binding.

The runtime does not treat the user as a generic prompt sender.

It opens or verifies an IPR session.

IPR means operational identity and proof layer.

In this demo, the human operator is bound to a verified IPR context, and the AI runtime is identified as "IPR-AI-0001".

Reference runtime context:

Human IPR: IPR-88505FE91013DCFE97C56ED1
Runtime IPR: IPR-AI-0001
Identity binding: IPR_VERIFIED_BIOLOGICAL_SUBJECT
Tenant: HBCE-TENANT-SELF-PILOT
Workspace: HBCE-WORKSPACE-RND
Memory scope: IPR_BOUND

This does not mean public legal identity.

This means operational identity inside the HBCE/JOKER-C2 runtime.

Mandatory boundary:

IPR Card is an internal operational identity certificate,
not an official public identity document.

---

3:00–5:00 — Governed AI request through "/v1/chat"

Screen/action

Show request:

{
  "sessionId": "SESSION-...",
  "humanIpr": "IPR-88505FE91013DCFE97C56ED1",
  "message": "Analyze this institutional AI governance request.",
  "files": [],
  "constraints": {
    "policyScope": "B2B_B2G",
    "memoryMode": "IPR_BOUND",
    "riskMode": "GOVERNED"
  },
  "idempotencyKey": "demo-001"
}

Speaker script

Now the operator sends a request to JOKER-C2 through the synchronous endpoint:

POST /v1/chat

This is the primary contract for direct governed AI interaction.

The runtime receives the message, but it does not immediately behave like a generic chatbot.

It checks:

session,
human IPR,
runtime IPR,
tenant,
workspace,
policy scope,
memory mode,
risk posture,
idempotency.

This is the key difference.

The request is not only text.

It is an operational event candidate.

---

5:00–7:00 — Governance check, model routing and response

Screen/action

Show response envelope:

{
  "answer": "Governed AI response",
  "responseEvt": "EVT-...",
  "opcId": "OPC-...",
  "auditId": "AUDIT-...",
  "usageId": "USAGE-...",
  "temporalSeal": {
    "local": "Torino / Italia / Europa · UTC+2",
    "utc": "2026-..."
  },
  "memory": {
    "scope": "IPR_BOUND",
    "semanticMemoryCreated": false
  },
  "policy": {
    "decision": "ALLOW",
    "saveRaw": false,
    "saveSynthesis": false
  },
  "risk": {
    "level": "CONTROLLED"
  },
  "legalCertification": false
}

Speaker script

The response is not just an answer.

The response carries runtime metadata.

The answer is connected to:

response EVT,
OPC receipt,
audit record,
model usage record,
temporal seal,
policy decision,
risk status,
memory behavior,
legal boundary.

For the public API v1 contract tests, the system has already validated that contract-only requests do not create semantic memory, do not execute unwanted operational branches and do not trigger document ingestion or Source Intelligence live fetch.

The relevant runtime posture is:

semanticMemoryCreated=false
noNewSemanticMemory=true
noNewIprMemory=true
runtimeMemoryWriteSuppressed=true
legalCertification=false

This matters because in governed AI, not writing memory is sometimes as important as writing memory.

---

7:00–8:30 — EVT and OPC

Screen/action

Show:

EVT-...
OPC-...

Speaker script

After the governed response, JOKER-C2 generates the technical trace.

EVT is the technical event trace.

OPC is the technical proof receipt.

The chain is:

Request → Runtime decision → Response → EVT → OPC

The OPC is not a legal certificate.

It is a technical proof receipt.

Mandatory boundary:

OPC is a technical proof receipt only.
legalCertification=false.

This boundary is essential for B2B and B2G positioning.

HBCE/JOKER-C2 does not claim to be a public authority or legal certifier.

It provides runtime governance infrastructure and technical proof continuity.

---

8:30–9:30 — Audit and model usage

Screen/action

Show lookup endpoints:

GET /v1/audit/{auditId}
GET /v1/model-usage/{usageId}

Speaker script

The next layer is accountability.

The audit record stores the runtime decision context:

who,
what,
when,
which policy,
which event,
which OPC,
which runtime boundary.

The model usage record stores model and accounting metadata:

model,
token usage,
cost/accounting field,
audit reference,
runtime context.

This creates an operational link between the AI answer and its execution cost, trace and auditability.

For enterprise systems, this is not cosmetic.

It is the basis for usage control, cost monitoring and internal accountability.

---

9:30–10:30 — Dashboard and Dual-Time Seal

Screen/action

Show JOKER-C2 dashboard card:

AI JOKER-C2
HBCE governed AI runtime
Runtime IPR: IPR-AI-0001
Human IPR: IPR-88505FE91013DCFE97C56ED1
Memory: IPR_BOUND
Docs: AVAILABLE
Audit: PERSISTED
Usage: PERSISTED
legalCertification=false

Show temporal certificate:

JOKER-C2 Temporal Runtime Certificate
Torino / Italia / Europa · UTC+2

Speaker script

The dashboard is the operational control surface.

It shows that the interaction is not floating in an unstructured chat.

It is attached to:

runtime identity,
human IPR,
memory scope,
document state,
audit state,
usage state,
temporal seal,
legal boundary.

The Dual-Time Seal gives local and UTC temporal anchoring.

This is useful for internal governance, operational review and pilot reporting.

---

10:30–11:30 — SDK and integration

Screen/action

Show SDK package:

@hbce/ipr-runtime-sdk

Show proposed structure:

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

Speaker script

The SDK is not the product.

The product is the HBCE IPR Runtime API.

The SDK is the developer integration layer.

A software house, enterprise IT team or public-sector pilot can integrate the runtime using REST directly or through the TypeScript SDK.

The core integration pattern is simple:

create IPR session,
send governed chat request,
receive answer plus EVT/OPC/audit/usage,
query proof and audit endpoints,
display result in local system.

---

11:30–12:00 — Closing and pilot boundary

Speaker script

HBCE IPR Runtime API v1 is designed for pilots where AI output must be connected to identity, event, proof, audit and usage.

The current public API v1 surface has passed contract-only regression across 16 endpoints.

Validation status:

API v1 public surface = PASS
Endpoint coverage = 16/16 PASS
Contract-only execution = PASS
Semantic memory creation blocked = PASS
Operational branch execution blocked = PASS
Document ingestion blocked = PASS
Document recall blocked = PASS
Source Intelligence live execution blocked = PASS
legalCertification=false = PASS

The next step is a controlled pilot.

Not a legal certification product.

Not a public identity system.

A governed AI runtime for B2B/B2G environments where traceability, accountability and proof continuity matter.

Final boundary:

legalCertification=false
OPC is a technical proof receipt only.
IPR is an operational identity/proof layer only.
EVT is a technical event trace only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

5. Demo checklist

Before the demo:

[ ] API v1 public surface regression PASS
[ ] IPR session endpoint available
[ ] /v1/chat or /api/v1/chat reachable
[ ] Dashboard visible
[ ] EVT visible
[ ] OPC visible
[ ] Audit lookup visible
[ ] Model usage lookup visible
[ ] legalCertification=false visible
[ ] OPC boundary visible

During the demo:

[ ] Show problem
[ ] Show IPR session
[ ] Send governed chat request
[ ] Show policy/risk/memory fields
[ ] Show EVT
[ ] Show OPC
[ ] Show audit
[ ] Show model usage
[ ] Show dashboard
[ ] State legal boundary clearly

After the demo:

[ ] Provide API contract sheet
[ ] Provide product one-page
[ ] Provide endpoint list
[ ] Provide pilot proposal
[ ] Provide SDK integration path

---

6. Minimal live demo flow

Step 1 — Health

GET /v1/health

Expected:

{
  "status": "HEALTHY",
  "apiVersion": "v1",
  "legalCertification": false
}

Step 2 — Capabilities

GET /v1/capabilities

Expected:

{
  "capabilitiesStatus": "READY",
  "chat": true,
  "operations": true,
  "events": true,
  "opc": true,
  "audit": true,
  "modelUsage": true,
  "sourceIntelligence": true,
  "legalCertification": false
}

Step 3 — IPR session

POST /v1/ipr/session

Expected:

{
  "sessionId": "SESSION-...",
  "humanIpr": "IPR-...",
  "runtimeIpr": "IPR-AI-0001",
  "identityBinding": "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
  "legalCertification": false
}

Step 4 — Governed chat

POST /v1/chat

Expected:

{
  "answer": "Governed AI response",
  "responseEvt": "EVT-...",
  "opcId": "OPC-...",
  "auditId": "AUDIT-...",
  "usageId": "USAGE-...",
  "legalCertification": false
}

Step 5 — OPC lookup

GET /v1/opc/{opcId}

Expected:

{
  "opcId": "OPC-...",
  "boundary": "technical proof receipt only",
  "legalCertification": false
}

Step 6 — Audit lookup

GET /v1/audit/{auditId}

Expected:

{
  "auditId": "AUDIT-...",
  "policyDecision": "ALLOW",
  "evtOpcReferenceFields": true,
  "legalCertification": false
}

Step 7 — Model usage lookup

GET /v1/model-usage/{usageId}

Expected:

{
  "usageId": "USAGE-...",
  "modelField": true,
  "tokenUsageField": true,
  "costOrAccountingField": true,
  "auditReferenceField": true,
  "legalCertification": false
}

---

7. Final demo statement

HBCE IPR Runtime API v1 provides the public integration layer for governed AI execution.

It connects:

identity,
runtime,
policy,
risk,
event,
proof,
audit,
usage,
time.

This is the difference between using an AI model and operating an AI runtime.
