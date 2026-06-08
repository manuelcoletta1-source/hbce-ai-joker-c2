HBCE IPR Runtime API v1

Technical API Contract Sheet

Product: HBCE IPR Operational Identity & Proof Layer
Runtime: JOKER-C2 SaaS Core v0.1
Target: B2B / B2G
Mode: Governed AI runtime · IPR-bound · EVT/OPC/audit-ready
Boundary: "legalCertification=false"

---

1. API purpose

HBCE IPR Runtime API v1 exposes a governed AI execution surface where each interaction can be connected to:

IPR    = operational identity / proof layer
EVT    = technical event trace
OPC    = technical proof receipt
AUDIT  = runtime audit record
USAGE  = model usage / accounting record
MATRIX = process organization layer
HBCE   = runtime governance layer

The API is designed for environments where AI execution must be identifiable, traceable, inspectable and policy-governed.

It does not provide legal certification.
It provides technical runtime evidence.

---

2. Base path

Recommended public/API-gateway form:

/v1

Current JOKER-C2 SaaS route form validated in runtime tests:

/api/v1

Example mapping:

Commercial/API gateway: POST /v1/chat
Runtime route tested:     POST /api/v1/chat

---

3. Public endpoint surface

Method| Endpoint| Purpose
"GET"| "/v1"| API root discovery
"GET"| "/v1/health"| Runtime health descriptor
"GET"| "/v1/capabilities"| Capability discovery
"POST"| "/v1/ipr/session"| Create IPR-bound session
"GET"| "/v1/ipr/session/{sessionId}"| Lookup IPR session descriptor
"POST"| "/v1/chat"| Synchronous governed AI interaction
"POST"| "/v1/files"| File ingestion descriptor / controlled file entry
"POST"| "/v1/operations"| Create asynchronous operation
"GET"| "/v1/operations/{operationId}"| Lookup operation status
"GET"| "/v1/events"| Event ledger descriptor
"GET"| "/v1/opc/{opcId}"| OPC technical proof receipt lookup
"GET"| "/v1/audit/{auditId}"| Runtime audit lookup
"GET"| "/v1/model-usage/{usageId}"| Model usage / accounting lookup
"GET"| "/v1/openapi"| OpenAPI contract
"GET"| "/v1/self-test"| Public API self-test
"GET"| "/v1/source-intelligence"| Source Intelligence descriptor

---

4. Runtime identity model

Every governed interaction should be connected to a runtime identity context.

Minimum identity fields:

{
  "humanIpr": "IPR-...",
  "runtimeIpr": "IPR-AI-0001",
  "identityBinding": "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
  "tenantId": "HBCE-TENANT-...",
  "workspaceId": "HBCE-WORKSPACE-..."
}

Reference runtime context:

Human IPR: IPR-88505FE91013DCFE97C56ED1
Runtime IPR: IPR-AI-0001
Tenant: HBCE-TENANT-SELF-PILOT
Workspace: HBCE-WORKSPACE-RND
Memory: DATABASE_PERSISTENT / IPR_BOUND
legalCertification=false

---

5. Primary synchronous endpoint

"POST /v1/chat"

Purpose: execute a governed AI interaction and return an immediate answer with technical traceability.

Minimum request

{
  "sessionId": "SESSION-...",
  "humanIpr": "IPR-...",
  "message": "User request",
  "files": [],
  "constraints": {
    "policyScope": "B2B_B2G",
    "memoryMode": "IPR_BOUND",
    "riskMode": "GOVERNED"
  },
  "idempotencyKey": "uuid-or-client-key"
}

Minimum response

{
  "answer": "Governed AI response",
  "responseEvt": "EVT-...",
  "opcId": "OPC-...",
  "auditId": "AUDIT-...",
  "usageId": "USAGE-...",
  "temporalSeal": {
    "local": "Torino / Italia / Europa · UTC+2",
    "utc": "ISO-8601"
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
    "level": "CONTROLLED",
    "escalation": false
  },
  "legalCertification": false
}

Use cases

direct governed AI chat
institutional AI request handling
IPR AI Audit Trail Demo
controlled B2B/B2G interaction
audit-ready answer generation

---

6. Primary asynchronous endpoint

"POST /v1/operations"

Purpose: open a longer-running governed operation with traceable status and optional proof receipt.

Minimum request

{
  "operationType": "DOCUMENT_AUDIT",
  "subjectIpr": "IPR-...",
  "payload": {
    "inputRef": "file-or-operation-reference"
  },
  "constraints": {
    "policyScope": "B2B_B2G",
    "proofMode": "TECHNICAL_RECEIPT_ONLY"
  },
  "idempotencyKey": "uuid-or-client-key"
}

Minimum response

{
  "operationId": "OPERATION-...",
  "status": "QUEUED",
  "responseEvt": "EVT-...",
  "opcId": "OPC-...",
  "createdAt": "ISO-8601",
  "legalCertification": false
}

Use cases

document audit
long-running analysis
proof pipeline
compliance-oriented workflow
polling or webhook-based execution

---

7. Lookup endpoints

Lookup endpoints expose descriptor-level access to traceability objects.

Operation lookup

GET /v1/operations/{operationId}

Returns operation status, related EVT/OPC references, policy state and audit linkage.

OPC lookup

GET /v1/opc/{opcId}

Returns the OPC technical proof receipt descriptor.

Boundary:

OPC is a technical proof receipt only.
OPC is not a legal certification.
legalCertification=false

Audit lookup

GET /v1/audit/{auditId}

Returns audit descriptor, policy decision, runtime context and linked EVT/OPC references.

Model usage lookup

GET /v1/model-usage/{usageId}

Returns usage descriptor, model field, token usage field, cost/accounting field and audit reference.

---

8. Files endpoint

"POST /v1/files"

Purpose: expose controlled file ingestion descriptors and document profile linkage.

Minimum descriptor fields:

{
  "fileId": "FILE-...",
  "fileHash": "sha256:...",
  "textStatus": "TEXT_READY | TEXT_NOT_READY | PDF_BINARY_HASH_ONLY",
  "documentProfileId": "DOC-PROFILE-...",
  "rawTextPersistence": false,
  "legalCertification": false
}

Boundary:

Raw text persistence must be explicit.
Default posture: rawTextPersistence=false.
Document profile creation does not imply legal certification.

---

9. Source Intelligence descriptor

"GET /v1/source-intelligence"

Purpose: expose available Source Intelligence capabilities and registered source sets.

Recommended descriptor fields:

{
  "sourceIntelligenceStatus": "READY",
  "sourceSets": [
    "ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK",
    "EU_AI_GOVERNANCE_REGULATORY_STACK",
    "ENISA_CYBER_THREAT_LANDSCAPE",
    "ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK",
    "OPENAI_AGENTIC_SYSTEMS_SECURITY"
  ],
  "rawTextPersistence": false,
  "fetchMode": "SERVER_SIDE_CONTROLLED",
  "legalCertification": false
}

---

10. Common response envelope

All operational responses should converge toward a common envelope.

{
  "status": "READY | PASS | FAIL | REJECTED",
  "apiVersion": "v1",
  "publicContract": true,
  "target": "B2B/B2G",
  "runtime": {
    "humanIpr": "IPR-...",
    "runtimeIpr": "IPR-AI-0001",
    "tenantId": "HBCE-TENANT-...",
    "workspaceId": "HBCE-WORKSPACE-..."
  },
  "trace": {
    "evtId": "EVT-...",
    "opcId": "OPC-...",
    "auditId": "AUDIT-...",
    "usageId": "USAGE-..."
  },
  "policy": {
    "decision": "ALLOW | ESCALATE | DENY",
    "saveRaw": false,
    "saveSynthesis": false,
    "reusableInPrompt": false
  },
  "boundary": {
    "legalCertification": false,
    "opcBoundary": "technical proof receipt only",
    "iprBoundary": "operational identity/proof layer only",
    "evtBoundary": "technical event trace only"
  }
}

---

11. Error model

Recommended error envelope:

{
  "status": "FAIL",
  "error": {
    "code": "IPR_SESSION_REQUIRED",
    "message": "A valid IPR session is required.",
    "retryable": false
  },
  "trace": {
    "evtId": "EVT-...",
    "opcId": "OPC-..."
  },
  "legalCertification": false
}

Suggested error codes:

IPR_SESSION_REQUIRED
IPR_SESSION_EXPIRED
IPR_SCOPE_MISMATCH
POLICY_DENIED
POLICY_ESCALATION_REQUIRED
INVALID_IDEMPOTENCY_KEY
INVALID_OPERATION_TYPE
SOURCESET_MISMATCH
FILE_TEXT_NOT_READY
DOCUMENT_PROFILE_NOT_READY
OPC_NOT_FOUND
AUDIT_NOT_FOUND
USAGE_NOT_FOUND
RATE_LIMITED
INTERNAL_RUNTIME_ERROR

---

12. Idempotency

Mutating endpoints should support idempotency.

Recommended endpoints:

POST /v1/ipr/session
POST /v1/chat
POST /v1/files
POST /v1/operations

Recommended header:

Idempotency-Key: <client-generated-key>

Expected behavior:

Same key + same payload = same operation result or safe replay.
Same key + different payload = rejection.

---

13. Security and governance posture

Default posture:

UE-first
GDPR-min
IPR-bound
audit-ready
hash-first
rawTextPersistence=false by default
legalCertification=false
OPC technical proof receipt only

Operational branch execution must be explicit.

Contract descriptors must not create semantic memory, trigger ingestion, trigger Source Intelligence live fetch or write IPR memory.

---

14. Contract-only validation status

Current validation status after v76 regression:

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

15. Mandatory legal boundary

legalCertification=false
OPC is a technical proof receipt only.
IPR is an operational identity/proof layer only.
EVT is a technical event trace only.
IPR Card is an internal operational identity certificate, not an official public identity document.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure, not a public authority and not a legal certifier.
