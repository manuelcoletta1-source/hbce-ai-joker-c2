HBCE IPR Runtime API v1

OpenAPI Stabilization Plan

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: OpenAPI contract stabilization, schema hardening, SDK readiness, API governance
Target: B2G / regulated enterprise / software integrator / institutional pilot
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the OpenAPI stabilization plan for HBCE IPR Runtime API v1.

The goal is to move from a validated internal/public API surface to a stable external contract that can support:

B2G pilot review
technical integration
SDK generation
client onboarding
security review
endpoint validation
schema testing
contract versioning
future API gateway publication

The OpenAPI contract must describe not only endpoints, but also the HBCE/JOKER-C2 runtime boundaries:

IPR operational identity/proof layer
EVT technical event trace
OPC technical proof receipt
audit reconstruction
model usage accounting
tenant/workspace scope
Source Intelligence descriptor
legalCertification=false

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Current validated baseline

The current API v1 public surface is validated as:

API v1 public surface = 16/16 PASS
API v1 endpoints = 16/16 PASS
Contract-only = PASS
No semantic memory = PASS
No branch execution = PASS
Dashboard product card = PASS
Source Intelligence = SOURCESET_REGISTRY_READY
legalCertification=false

Validated endpoint matrix:

GET  /api/v1
GET  /api/v1/health
GET  /api/v1/capabilities
POST /api/v1/ipr/session
GET  /api/v1/ipr/session/{sessionId}
POST /api/v1/chat
POST /api/v1/files
POST /api/v1/operations
GET  /api/v1/operations/{operationId}
GET  /api/v1/events
GET  /api/v1/opc/{opcId}
GET  /api/v1/audit/{auditId}
GET  /api/v1/model-usage/{usageId}
GET  /api/v1/openapi
GET  /api/v1/self-test
GET  /api/v1/source-intelligence

Reference regression:

HBCE-IPR-RUNTIME-API-v1-PUBLIC_SURFACE_REGRESSION-v76

The current contract is operationally validated.

The next task is schema stabilization.

---

3. Stabilization objective

OpenAPI stabilization means:

every endpoint has a clear request schema
every endpoint has a clear response schema
every error has a stable error envelope
every proof-bearing response exposes EVT/OPC/audit/usage references where applicable
every response exposes legalCertification=false
every route has stable operationId
every schema has a stable name
every public field has clear meaning
every boundary is explicit

The stabilized OpenAPI contract should be safe for:

client review
SDK generation
API gateway publication
B2G pilot documentation
security review
integration testing

---

4. Public path convention

Current runtime route notation:

/api/v1

Recommended public gateway notation:

/v1

OpenAPI should expose the public gateway convention while documenting the current runtime route.

Example:

Public API path: /v1/chat
Current runtime route: /api/v1/chat

Recommended OpenAPI server objects:

servers:
  - url: https://api.hbce.example/v1
    description: Public API gateway path
  - url: https://runtime.example/api/v1
    description: Current runtime route for self-pilot and internal validation

Production publication must use the gateway path.

Self-pilot may continue using "/api/v1".

---

5. API versioning model

Current API version:

v1

Recommended versioning rules:

v1 = stable pilot contract
v1.x = backward-compatible additions
v2 = breaking contract changes

Breaking changes include:

removing fields
renaming fields
changing field types
changing endpoint path
changing required request fields
changing error envelope shape
changing authentication semantics
removing boundary fields

Backward-compatible changes include:

adding optional fields
adding new endpoints
adding enum values with documented behavior
adding response metadata
adding optional headers

Mandatory rule:

legalCertification=false must remain present in public responses.

---

6. OpenAPI document identity

Recommended OpenAPI metadata:

openapi: 3.1.0
info:
  title: HBCE IPR Runtime API
  version: 1.0.0
  summary: Governed AI runtime API for operational identity, technical proof, audit and usage accountability.
  description: >
    HBCE IPR Runtime API v1 exposes a governed AI runtime surface for IPR-bound
    requests, EVT technical event traces, OPC technical proof receipts, audit
    records, model usage metadata and Source Intelligence descriptors.
    legalCertification=false.

Recommended tags:

Root
Health
Capabilities
IPR Session
Chat
Files
Operations
Events
OPC
Audit
Model Usage
OpenAPI
Self Test
Source Intelligence
Quota
Tenant

---

7. Operation ID convention

Every endpoint must have a stable "operationId".

Recommended convention:

<resource><Action>V1

Examples:

getRootDiscoveryV1
getHealthV1
getCapabilitiesV1
createIprSessionV1
getIprSessionV1
createChatCompletionV1
createFileDescriptorV1
createOperationV1
getOperationV1
listEventsV1
getOpcReceiptV1
getAuditRecordV1
getModelUsageRecordV1
getOpenApiContractV1
runSelfTestV1
getSourceIntelligenceDescriptorV1

Operation IDs must not change without a contract version update.

Naturally, because client SDKs dislike being ambushed. Strange creatures, these SDKs.

---

8. Shared boundary schema

Every public response should include boundary metadata.

Recommended schema:

Boundary:
  type: object
  required:
    - legalCertification
    - opcBoundary
    - evtBoundary
    - iprBoundary
  properties:
    legalCertification:
      type: boolean
      const: false
    opcBoundary:
      type: string
      example: technical proof receipt only
    evtBoundary:
      type: string
      example: technical event trace only
    iprBoundary:
      type: string
      example: operational identity/proof layer only
    authorityBoundary:
      type: string
      example: HBCE/JOKER-C2 is not a public authority and not a legal certifier.

Required value:

legalCertification=false

---

9. Shared proof reference schema

Responses that create or describe runtime execution should expose proof references.

Recommended schema:

ProofReferences:
  type: object
  properties:
    responseEvt:
      type: string
      nullable: true
      example: EVT-20260609071458-BA2C2C57
    opcId:
      type: string
      nullable: true
      example: OPC-20260609071458-BBDF38EC
    auditId:
      type: string
      nullable: true
      example: AUDIT-20260609071550-2D1BE17D
    usageId:
      type: string
      nullable: true
      example: USAGE-20260609071551-B3D56BC7
    chainHash:
      type: string
      nullable: true
      example: sha256:991c8733e7687fb4f79c7e8ee93183dc3bb620416e7404ef27b5f0cc754cd816

Boundary:

Proof references are technical runtime references.
They are not legal certificates.

---

10. Shared runtime identity schema

Recommended schema:

RuntimeIdentity:
  type: object
  properties:
    runtimeIpr:
      type: string
      example: IPR-AI-0001
    humanIpr:
      type: string
      nullable: true
      example: IPR-88505FE91013DCFE97C56ED1
    tenantId:
      type: string
      nullable: true
      example: HBCE-TENANT-SELF-PILOT
    workspaceId:
      type: string
      nullable: true
      example: HBCE-WORKSPACE-RND
    accountId:
      type: string
      nullable: true
      example: HBCE-ACCOUNT-SELF-PILOT
    subscriptionId:
      type: string
      nullable: true
      example: HBCE-SUBSCRIPTION-SELF-PILOT
    tier:
      type: string
      nullable: true
      example: IPR

External B2G pilots should replace self-pilot identifiers with tenant-specific identifiers.

---

11. Shared error envelope

Every public error should use a stable envelope.

Recommended schema:

ErrorEnvelope:
  type: object
  required:
    - status
    - error
    - boundary
  properties:
    status:
      type: string
      enum: [FAIL]
    error:
      type: object
      required:
        - code
        - message
        - retryable
      properties:
        code:
          type: string
          example: TENANT_SCOPE_MISMATCH
        message:
          type: string
          example: Request tenant does not match credential scope.
        retryable:
          type: boolean
          example: false
        retryAfterSeconds:
          type: integer
          nullable: true
          example: 60
    boundary:
      $ref: '#/components/schemas/Boundary'

Recommended error codes:

IPR_SESSION_REQUIRED
IPR_SESSION_EXPIRED
IPR_SCOPE_MISMATCH
INVALID_API_KEY
API_KEY_REQUIRED
API_KEY_REVOKED
API_KEY_EXPIRED
API_KEY_SCOPE_DENIED
TENANT_SCOPE_MISMATCH
WORKSPACE_SCOPE_MISMATCH
POLICY_DENIED
POLICY_ESCALATION_REQUIRED
INVALID_IDEMPOTENCY_KEY
INVALID_OPERATION_TYPE
SOURCESET_MISMATCH
UNKNOWN_SOURCE_SET
FILE_TEXT_NOT_READY
DOCUMENT_PROFILE_NOT_READY
OPC_NOT_FOUND
AUDIT_NOT_FOUND
USAGE_NOT_FOUND
RATE_LIMITED
QUOTA_EXCEEDED
INTERNAL_RUNTIME_ERROR

---

12. Authentication schema

Current self-pilot mode may rely on internal account/session bridge.

External pilot mode requires API key or bearer client token.

OpenAPI should define both schemes:

securitySchemes:
  HbceApiKey:
    type: apiKey
    in: header
    name: x-hbce-api-key
  HbceBearerToken:
    type: http
    scheme: bearer
    bearerFormat: HBCE client token

Recommended public endpoint security:

security:
  - HbceApiKey: []
  - HbceBearerToken: []

Contract-only self-test endpoints may be exposed differently depending on deployment mode.

Deployment modes:

SELF_PILOT_INTERNAL
GUIDED_DEMO
B2G_PILOT_AUTH_REQUIRED
PRODUCTION_AUTH_REQUIRED

---

13. Idempotency schema

Mutating endpoints should support idempotency.

Recommended header:

Idempotency-Key: <client-generated-key>

OpenAPI header definition:

IdempotencyKey:
  name: Idempotency-Key
  in: header
  required: false
  schema:
    type: string
    minLength: 8
    maxLength: 128
  description: Client-generated idempotency key for safe retry of mutating requests.

Recommended mutating endpoints:

POST /v1/ipr/session
POST /v1/chat
POST /v1/files
POST /v1/operations

Expected behavior:

same key + same payload = safe replay
same key + different payload = reject

---

14. Rate-limit headers

OpenAPI should document rate-limit headers.

Recommended response headers:

Retry-After
X-HBCE-RateLimit-Limit
X-HBCE-RateLimit-Remaining
X-HBCE-RateLimit-Reset
X-HBCE-Quota-Profile

Applicable responses:

200
201
202
400
401
403
429
500

Required rate-limit error:

429 RATE_LIMITED

Required quota error:

403 or 429 QUOTA_EXCEEDED

Recommended pilot choice:

429 for temporary rate limits.
403 for exhausted commercial quota.

---

15. Endpoint stabilization checklist

Each endpoint must define:

operationId
summary
description
tags
security
request headers
path parameters
query parameters
request body
success response
error responses
boundary object
examples
rate-limit behavior
tenant/workspace behavior
legalCertification=false

For proof-bearing endpoints, also define:

EVT reference
OPC reference
audit reference
usage reference
chain hash if available

---

16. Root discovery endpoint

Endpoint:

GET /v1

Purpose:

Expose public API discovery and product descriptor.

Required response fields:

product
apiVersion
publicSurface
gatewayPath
runtimePath
endpointCount
contractMode
docsPath
boundary

Recommended "operationId":

getRootDiscoveryV1

---

17. Health endpoint

Endpoint:

GET /v1/health

Purpose:

Expose runtime health descriptor.

Required response fields:

status
runtime
apiVersion
memoryStatus
sourceIntelligenceStatus
databaseStatus if available
boundary

Recommended "operationId":

getHealthV1

---

18. Capabilities endpoint

Endpoint:

GET /v1/capabilities

Purpose:

Expose API and runtime capability descriptor.

Required response fields:

capabilities
supportedEndpoints
supportedProofLayers
supportedSourceIntelligence
supportedDocumentModes
boundary

Recommended "operationId":

getCapabilitiesV1

---

19. IPR session endpoints

Endpoints:

POST /v1/ipr/session
GET  /v1/ipr/session/{sessionId}

Purpose:

Create and lookup IPR-bound operational runtime sessions.

Required request fields for create:

tenantId
workspaceId
operatorReference if available
requestedScope

Required response fields:

sessionId
runtimeIpr
humanIpr if available
tenantId
workspaceId
scope
accessDecision
identityBinding
expiresAt
boundary

Recommended "operationId" values:

createIprSessionV1
getIprSessionV1

Boundary:

IPR is an operational identity/proof layer only.
It is not official public identity.

---

20. Chat endpoint

Endpoint:

POST /v1/chat

Purpose:

Execute a governed AI runtime request.

Required request fields:

message
sessionId or IPR context
tenantId
workspaceId

Optional request fields:

sourceSet
documentProfileIds
memoryIds
operationMode
metadata

Required response fields:

answer
runtime
policy
proofReferences
modelUsage
boundary

Recommended "operationId":

createChatCompletionV1

Contract-only safety:

Contract-only tests must not trigger live Source Intelligence fetch.
Contract-only tests must not trigger document ingestion.
Contract-only tests must not trigger document recall.
Contract-only tests must not create semantic memory.

---

21. Files endpoint

Endpoint:

POST /v1/files

Purpose:

Create controlled file descriptor or explicit ingestion request.

Required request fields:

tenantId
workspaceId
filename
contentType
fileSize
ingestionMode

Possible ingestion modes:

DESCRIPTOR_ONLY
TEXT_EXTRACTION_REQUESTED
DOCUMENT_PROFILE_REQUESTED

Required response fields:

fileId
fileHash
textStatus
documentProfileId if created
ingestionStatus
boundary

Recommended "operationId":

createFileDescriptorV1

Boundary:

No raw text persistence by default.
PDF binary hash-only unless extraction is explicitly enabled.
Document profile does not imply legal validation.

---

22. Operations endpoints

Endpoints:

POST /v1/operations
GET  /v1/operations/{operationId}

Purpose:

Create and lookup asynchronous runtime operations.

Required operation fields:

operationId
operationType
status
tenantId
workspaceId
createdAt
updatedAt
proofReferences
boundary

Recommended statuses:

QUEUED
RUNNING
COMPLETED
FAILED
CANCELLED
EXPIRED

Recommended "operationId" values:

createOperationV1
getOperationV1

---

23. Events endpoint

Endpoint:

GET /v1/events

Purpose:

Expose technical event trace descriptors.

Required fields:

eventId
eventHash
eventType
tenantId
workspaceId
createdAt
linkedOpcId
linkedAuditId
boundary

Recommended "operationId":

listEventsV1

Boundary:

EVT is a technical event trace only.

---

24. OPC endpoint

Endpoint:

GET /v1/opc/{opcId}

Purpose:

Lookup technical proof receipt descriptor.

Required fields:

opcId
eventHash
chainHash
verificationStatus
tenantId
workspaceId
createdAt
boundary

Recommended "operationId":

getOpcReceiptV1

Boundary:

OPC is a technical proof receipt only.
legalCertification=false

---

25. Audit endpoint

Endpoint:

GET /v1/audit/{auditId}

Purpose:

Lookup runtime audit reconstruction descriptor.

Required fields:

auditId
tenantId
workspaceId
runtimeIpr
humanIpr if available
policyDecision
riskLevel
evtId
opcId
usageId
createdAt
boundary

Recommended "operationId":

getAuditRecordV1

---

26. Model usage endpoint

Endpoint:

GET /v1/model-usage/{usageId}

Purpose:

Lookup model usage and SaaS accounting descriptor.

Required fields:

usageId
tenantId
workspaceId
model
modelLevel
inputTokens
outputTokens
totalTokens
costUnits
costMinor
evtId
opcId
auditId
createdAt
boundary

Recommended "operationId":

getModelUsageRecordV1

---

27. OpenAPI endpoint

Endpoint:

GET /v1/openapi

Purpose:

Expose public OpenAPI contract.

Required response:

OpenAPI 3.1 document

Recommended "operationId":

getOpenApiContractV1

Stabilization requirement:

The returned document must match repository documentation and public dashboard API v1 status.

---

28. Self-test endpoint

Endpoint:

GET /v1/self-test

Purpose:

Expose public API self-test matrix.

Required fields:

endpointCount
passedCount
failedCount
finalVerdict
contractOnly
semanticMemoryCreated
documentIngestionTriggered
documentRecallTriggered
sourceLiveFetchTriggered
boundary

Recommended "operationId":

runSelfTestV1

Required PASS baseline:

16/16 PASS
contractOnly=PASS
legalCertification=false

---

29. Source Intelligence endpoint

Endpoint:

GET /v1/source-intelligence

Purpose:

Expose Source Intelligence descriptor.

Required fields:

registryStatus
sourceSetsActive
catalogSources
endpointChainStatus
pdfBoundary
rawTextPersistence
memoryProfilePolicy
boundary

Recommended "operationId":

getSourceIntelligenceDescriptorV1

Boundary:

Source Intelligence provides governed source handling.
It does not certify external source legal authority.

---

30. Future tenant and quota endpoints

Future endpoints to add after auth/rate-limit implementation:

GET /v1/tenant
GET /v1/quota
GET /v1/quota/usage
GET /v1/quota/limits

Recommended operation IDs:

getTenantDescriptorV1
getQuotaDescriptorV1
getQuotaUsageV1
getQuotaLimitsV1

These should not be added to public PASS count until implemented and tested.

---

31. Schema naming convention

Use clear schema names.

Recommended shared schemas:

Boundary
ProofReferences
RuntimeIdentity
PolicyDecision
RateLimitDescriptor
QuotaDescriptor
ErrorEnvelope
IprSession
ChatRequest
ChatResponse
FileDescriptorRequest
FileDescriptorResponse
OperationRecord
EventRecord
OpcReceipt
AuditRecord
ModelUsageRecord
SourceIntelligenceDescriptor
TenantDescriptor
QuotaUsageDescriptor

Avoid vague names:

Data
Payload
Thing
Result
Response2
AnyObject

Yes, this has to be said. Somewhere a "Result2FinalFinal" is being deployed into production.

---

32. Example response envelope

Recommended success envelope for proof-bearing endpoints:

{
  "status": "OK",
  "data": {
    "answer": "Governed AI response"
  },
  "runtime": {
    "runtimeIpr": "IPR-AI-0001",
    "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
    "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL"
  },
  "proof": {
    "responseEvt": "EVT-...",
    "opcId": "OPC-...",
    "auditId": "AUDIT-...",
    "usageId": "USAGE-..."
  },
  "boundary": {
    "legalCertification": false,
    "opcBoundary": "technical proof receipt only",
    "evtBoundary": "technical event trace only",
    "iprBoundary": "operational identity/proof layer only"
  }
}

---

33. Contract-only self-test requirements

The OpenAPI contract must describe and preserve contract-only behavior.

Contract-only API validation must not trigger:

automatic IPR memory
automatic semantic memory
Source Intelligence live fetch
document ingestion
document recall
save chat
branch execution

Required contract-only fields:

contractOnly=true
semanticMemoryCreated=false
runtimeMemoryWriteSuppressed=true
sourceLiveFetchTriggered=false
documentIngestionTriggered=false
documentRecallTriggered=false
legalCertification=false

---

34. SDK generation readiness

OpenAPI is SDK-ready when:

operationIds are stable
schemas are named
error envelope is stable
auth scheme is defined
request/response examples exist
boundary fields are explicit
pagination rules are defined where needed
nullable fields are declared
enums are documented
rate-limit headers are documented

Target SDK:

@hbce/ipr-runtime-sdk

Primary language:

TypeScript

Do not generate SDK before schemas are stable.

There is no glory in generating a client for a contract still wearing wet cement.

---

35. Documentation sync requirements

OpenAPI must stay aligned with:

README.md
01-one-page-product-brief.md
02-technical-api-contract-sheet.md
03-ipr-ai-audit-trail-demo-script.md
04-api-v1-public-surface-regression-v76.md
05-b2g-pilot-package.md
06-b2g-demo-flow.md
07-security-boundary-pack.md
08-client-integration-roadmap.md
09-commercial-pilot-offer.md
10-api-key-token-model.md
11-tenant-onboarding-model.md
12-rate-limit-quota-model.md
13-openapi-stabilization-plan.md

Any OpenAPI change that affects public behavior must update the relevant docs.

---

36. OpenAPI validation checklist

Before marking the contract stable:

[ ] OpenAPI document returns valid JSON
[ ] OpenAPI version declared
[ ] Info title/version present
[ ] Servers present
[ ] Security schemes present
[ ] All 16 current endpoints documented
[ ] All operationIds stable
[ ] All schemas named
[ ] Error envelope documented
[ ] Boundary schema documented
[ ] legalCertification=false present
[ ] EVT boundary present
[ ] OPC boundary present
[ ] IPR boundary present
[ ] Rate-limit headers documented
[ ] Idempotency header documented
[ ] Examples present
[ ] Contract-only behavior documented
[ ] API v1 self-test references aligned
[ ] Docs path referenced

Minimum PASS output:

OPENAPI_STABILIZATION_READY
apiVersion=v1
openapiVersion=3.1.0
endpointCoverage=16/16
operationIds=STABLE
schemas=NAMED
boundary=legalCertification=false
sdkGenerationReady=true

---

37. First implementation order

Recommended implementation order:

1. Review current /api/v1/openapi route.
2. Add stable info/title/version.
3. Add public gateway server path.
4. Add all 16 endpoint paths.
5. Add stable operationIds.
6. Add shared Boundary schema.
7. Add shared ErrorEnvelope schema.
8. Add shared ProofReferences schema.
9. Add authentication schemes.
10. Add idempotency header.
11. Add rate-limit headers.
12. Add request/response examples.
13. Add contract-only self-test schema.
14. Validate JSON.
15. Run API v1 self-test.
16. Update dashboard OpenAPI card if needed.

First code target:

app/api/v1/openapi/route.ts

Second code target:

docs/product/hbce-ipr-runtime-api-v1/openapi.json

Optional helper target:

lib/api-v1-openapi-contract.ts

---

38. Acceptance criteria

OpenAPI stabilization is acceptable when:

GET /api/v1/openapi returns valid OpenAPI document
all 16 current endpoints are documented
operationIds are stable
Boundary schema is present
ErrorEnvelope schema is present
ProofReferences schema is present
security schemes are present
idempotency header is documented
rate-limit headers are documented
legalCertification=false is present
SDK generation is possible
API v1 self-test remains 16/16 PASS
contract-only safety remains PASS

Minimum PASS output:

HBCE_API_V1_OPENAPI_STABILIZATION_READY
endpointCoverage=16/16
contractOnly=PASS
schemaCoverage=PASS
securitySchemes=PASS
errorEnvelope=PASS
boundarySchema=PASS
legalCertification=false

---

39. Non-goals for first stabilization

Do not include in first stabilization:

complete public developer portal
multi-language SDK generation
OAuth/SAML/OIDC
production RBAC schemas
billing API
full customer admin API
all future endpoints
complex webhook schemas

First stabilization must make the existing API contract clear, stable and SDK-ready.

---

40. Final statement

OpenAPI stabilization is the bridge between a working API and an integrable API.

For HBCE IPR Runtime API v1, the OpenAPI contract must describe:

endpoints
schemas
security
errors
proof references
audit references
usage references
tenant/workspace scope
rate-limit headers
idempotency
Source Intelligence descriptors
legal boundary

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
