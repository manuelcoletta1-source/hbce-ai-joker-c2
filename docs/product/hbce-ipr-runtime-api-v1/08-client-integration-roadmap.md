HBCE IPR Runtime API v1

Client Integration Roadmap

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: client integration roadmap, tenant onboarding, API access, pilot-to-SaaS transition
Target: B2G / regulated enterprise / software integrator / institutional pilot
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the roadmap for integrating HBCE IPR Runtime API v1 into a client, partner or institutional pilot environment.

The goal is to move from:

internal R&D runtime

to:

controlled B2G pilot integration

and then toward:

external SaaS deployment candidate

The integration roadmap focuses on:

tenant onboarding
workspace separation
API access
operator identity
request tracing
EVT/OPC proof chain
audit lookup
model usage lookup
Source Intelligence usage
document registry usage
security boundaries
commercial pilot readiness

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Current validated baseline

The current self-pilot baseline is:

JOKER-C2 SaaS Core v0.1 = HEALTHY
Runtime = ACTIVE_RESPONSE_READY
B2G active response readiness = READY
IPR = ACCESS_GRANTED
Certificate status = ACTIVE
Scope = JOKER_C2_ACCESS
Identity binding = IPR_VERIFIED_BIOLOGICAL_SUBJECT
MATRIX = MATRIX_ACTIVE
Memory = IPR_BOUND
Persistence = DATABASE_PERSISTENT
EVT = PERSISTED
OPC = PERSISTED
Audit = PERSISTED
Model usage = PERSISTED
Source Intelligence = SOURCESET_REGISTRY_READY
SourceSets = 5/5
Source Intelligence endpoints = 7/7 PASS
API v1 public surface = 16/16 PASS
Document registry = AVAILABLE
Document profiles = 20
Linked document memory = 16
legalCertification=false

Reference technical chain:

Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7

This baseline proves the internal runtime and public API v1 contract layer.

The next step is external client integration hardening.

---

3. Integration target

The target integration model is:

Client / Partner System
        ↓
HBCE IPR Runtime API v1
        ↓
JOKER-C2 governed runtime
        ↓
EVT / OPC / Audit / Usage
        ↓
Dashboard / API lookup / Pilot report

The client should be able to:

open an IPR-bound session
send governed AI requests
receive response plus technical trace references
query operation status
query EVT/OPC/audit/model usage records
verify Source Intelligence descriptor availability
review legal and data boundaries
export pilot evidence

---

4. Integration maturity levels

Level 0 — Internal self-pilot

Status:

CURRENT BASELINE

Description:

JOKER-C2 runs inside HBCE self-pilot context.
Tenant, workspace, account and subscription are self-pilot values.
Dashboard and API v1 are validated internally.

Current identifiers:

Tenant = HBCE-TENANT-SELF-PILOT
Workspace = HBCE-WORKSPACE-RND
Subscription = HBCE-SUBSCRIPTION-SELF-PILOT
Account = HBCE-ACCOUNT-SELF-PILOT
Tier = IPR

---

Level 1 — Guided demo pilot

Status:

NEXT PRACTICAL STEP

Description:

HBCE operates the runtime.
Client observes the demo.
No client data is processed.
No external API keys are issued.
Runtime evidence is shown through dashboard and controlled sample calls.

Required deliverables:

B2G Pilot Package
B2G Demo Flow
Security & Boundary Pack
Dashboard screenshot
EVT/OPC/audit/usage sample chain

---

Level 2 — Controlled API pilot

Status:

NEXT TECHNICAL INCREMENT

Description:

Client or partner sends controlled API requests using assigned pilot credentials.
Tenant/workspace boundaries are created.
API access is limited and monitored.
Only public/synthetic pilot data is allowed unless a separate agreement exists.

Required features:

API key / client token
tenant provisioning
workspace provisioning
basic rate limit
request logging
operation lookup
audit lookup
usage lookup
pilot data boundary

---

Level 3 — Partner integration pilot

Status:

POST-v0.2 TARGET

Description:

Client integrates HBCE IPR Runtime API v1 into a test system, internal tool or partner dashboard.
SDK or direct REST integration is used.
Webhook or polling pattern is defined.

Required features:

SDK TypeScript client
OpenAPI downloadable contract
webhook or polling operation model
tenant-scoped audit export
tenant-scoped usage export
operator role model
client-specific Source Intelligence sourceSet permissions

---

Level 4 — Production candidate

Status:

FUTURE TARGET

Description:

Runtime is hardened for broader SaaS operation.
Security, retention, access, logging, incident response and commercial model are formalized.

Required features:

role-based access control
multi-tenant isolation review
billing/quota system
data retention workflow
deletion workflow
incident response process
client DPA
security review package
production monitoring
SLA draft

---

5. Client onboarding model

Each client pilot should receive a scoped identity frame.

Minimum onboarding fields:

clientName
clientType
pilotOwner
technicalContact
riskDomain
pilotUseCase
tenantId
workspaceId
subscriptionTier
allowedOperators
allowedSourceSets
allowedEndpoints
dataSensitivityLevel
retentionProfile

Recommended tenant format:

HBCE-TENANT-CLIENT-<CODE>

Recommended workspace format:

HBCE-WORKSPACE-<PROJECT-CODE>

Recommended account format:

HBCE-ACCOUNT-<CLIENT-CODE>

Recommended subscription format:

HBCE-SUBSCRIPTION-<CLIENT-CODE>-PILOT

Pilot rule:

No client should share the self-pilot tenant/workspace in external evaluation.

---

6. Access model roadmap

Current state

self-pilot account/session bridge
server-side IPR validation
JOKER_C2_ACCESS scope
ACCESS_GRANTED

Required next increment

API key / client token model

Minimum API key/token requirements:

client key ID
hashed secret
tenant binding
workspace binding
scope list
rate limit profile
createdAt
expiresAt
revokedAt
lastUsedAt
audit reference

Recommended request header:

Authorization: Bearer <client-token>

or:

x-hbce-api-key: <client-api-key>

Security note:

Secrets must never be stored in plaintext.
Only hashed API secrets should be persisted.

---

7. Tenant and workspace isolation

Every external pilot must enforce tenant/workspace boundaries.

Required isolation scope:

IPR sessions
chat requests
operation records
EVT records
OPC records
audit records
model usage records
document profiles
memory records
Source Intelligence profile saves
dashboard views

Expected behavior:

client A cannot read client B memory
client A cannot query client B audit records
client A cannot reuse client B document profiles
client A cannot access client B Source Intelligence saved profiles

Fail-closed requirement:

If tenant/workspace mismatch is detected, the request must fail closed.

---

8. API integration endpoints

The current public API v1 surface includes:

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

Recommended public gateway notation:

/v1

Current runtime notation:

/api/v1

Integration clients should target the gateway notation when an API gateway is introduced.

---

9. Synchronous integration flow

Use case:

Client sends governed AI request and receives immediate response.

Flow:

1. Client authenticates with API key/token.
2. Client creates or verifies IPR session.
3. Client sends request to POST /v1/chat.
4. Runtime validates tenant/workspace/scope.
5. Runtime evaluates policy.
6. Runtime generates response.
7. Runtime creates EVT.
8. Runtime creates OPC.
9. Runtime persists audit.
10. Runtime persists model usage.
11. Client receives response envelope.

Minimum response envelope:

{
  "answer": "Governed AI response",
  "responseEvt": "EVT-...",
  "opcId": "OPC-...",
  "auditId": "AUDIT-...",
  "usageId": "USAGE-...",
  "policy": {
    "decision": "ALLOW"
  },
  "boundary": {
    "legalCertification": false,
    "opcBoundary": "technical proof receipt only"
  }
}

---

10. Asynchronous integration flow

Use case:

Client starts a longer operation and polls for status.

Flow:

1. Client authenticates.
2. Client submits operation to POST /v1/operations.
3. Runtime returns operationId.
4. Client polls GET /v1/operations/{operationId}.
5. Runtime exposes status and trace links.
6. Client retrieves OPC, audit and usage references if available.

Recommended for:

document review
source-bound intelligence runs
batch analysis
governance reports
audit preparation

Future option:

webhook event delivery

---

11. Source Intelligence integration

Source Intelligence should be integrated as a controlled descriptor and sourceSet-based layer.

Current sourceSets:

ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK
EU_AI_GOVERNANCE_REGULATORY_STACK
ENISA_CYBER_THREAT_LANDSCAPE
ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK
OPENAI_AGENTIC_SYSTEMS_SECURITY

Integration rules:

sourceSet must be registered
unknown sourceSet must fail closed
mismatched sourceSet/sourceId must fail closed
local/private URLs must be rejected
raw text persistence must remain false by default
source profile save must require explicit operator action

Client configuration should define:

allowed sourceSets
allowed source operations
profile save policy
PDF handling policy
retention policy

---

12. Document integration

Document integration must be explicit and scoped.

Current registry baseline:

Document registry = AVAILABLE
Document profiles = 20
Linked document memory = 16
Reusable profiles = 20

Integration rules:

file ingestion must be explicit
document profile creation must be explicit
document recall must be explicit
document profiles must be tenant/workspace scoped
raw text persistence must be policy-controlled
PDF binary hash-only boundary must be preserved unless extraction is enabled

Recommended document flow:

1. Upload controlled document.
2. Generate document hash.
3. Extract text only if allowed.
4. Create document profile.
5. Link profile to IPR memory only if explicitly requested.
6. Recall profile only through explicit requested IDs.
7. Fail closed if requested profile is missing or out of scope.

---

13. Audit and reporting integration

Client systems should be able to query:

EVT references
OPC receipts
audit records
model usage records
operation status
dashboard state

Recommended report fields:

request timestamp
tenant
workspace
operator reference
runtime IPR
human IPR reference
policy decision
EVT ID
OPC ID
audit ID
usage ID
model
risk level
legalCertification=false

Future export formats:

JSON
CSV
PDF report
signed technical bundle
dashboard screenshot bundle

Boundary:

Exported reports are technical runtime reports, not legal certificates.

---

14. SDK roadmap

A TypeScript SDK should be introduced after the public API contract remains stable.

Recommended package name:

@hbce/ipr-runtime-sdk

Minimum SDK modules:

client.ts
types.ts
errors.ts
endpoints/health.ts
endpoints/capabilities.ts
endpoints/ipr-session.ts
endpoints/chat.ts
endpoints/operations.ts
endpoints/events.ts
endpoints/opc.ts
endpoints/audit.ts
endpoints/model-usage.ts
endpoints/source-intelligence.ts
examples/ipr-ai-audit-trail-demo.ts

Minimum SDK capabilities:

create client
set API key/token
create IPR session
send chat request
create operation
get operation
get OPC
get audit
get model usage
get Source Intelligence descriptor
handle HBCE errors

---

15. OpenAPI roadmap

Current API surface includes OpenAPI endpoint:

GET /api/v1/openapi

Next increment:

downloadable OpenAPI 3.1 contract
stable schema examples
public docs rendering
SDK generation compatibility
contract versioning

OpenAPI requirements:

clear request schemas
clear response schemas
error schema
boundary fields
trace fields
legalCertification=false fields
idempotency header
authentication header

---

16. Idempotency and retry roadmap

Mutating endpoints should support idempotency.

Recommended endpoints:

POST /v1/ipr/session
POST /v1/chat
POST /v1/files
POST /v1/operations

Recommended header:

Idempotency-Key: <client-generated-key>

Expected behavior:

same key + same payload = safe replay
same key + different payload = reject

Client integration should implement retry logic only for retryable errors.

---

17. Rate limit and quota roadmap

External pilots need rate limits.

Minimum rate-limit model:

requests per minute
requests per day
max tokens or cost units
max file size
max operation count
max Source Intelligence runs
max document profiles

Rate limit should be scoped by:

tenant
workspace
API key
operator
subscription tier

Response behavior:

429 RATE_LIMITED
retryAfter field
quota descriptor
usage reference if available

---

18. Error model roadmap

Client-facing errors should use stable codes.

Recommended error codes:

IPR_SESSION_REQUIRED
IPR_SESSION_EXPIRED
IPR_SCOPE_MISMATCH
INVALID_API_KEY
API_KEY_REVOKED
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
INTERNAL_RUNTIME_ERROR

Error envelope:

{
  "status": "FAIL",
  "error": {
    "code": "TENANT_SCOPE_MISMATCH",
    "message": "Request tenant does not match API credential scope.",
    "retryable": false
  },
  "boundary": {
    "legalCertification": false
  }
}

---

19. Pilot data policy

External pilots should start with:

public data
synthetic data
non-sensitive test prompts
controlled public documents
allowlisted sourceSets

Avoid during initial pilot unless separately agreed:

classified data
health data
criminal data
biometric data
confidential legal files
production credentials
live citizen data
military or intelligence operational data
high-risk autonomous decisions

Yes, boring. Also how you avoid turning a promising pilot into a compliance bonfire.

---

20. Client integration phases

Phase 1 — Read-only discovery

Client receives:

product docs
API contract sheet
security boundary pack
demo flow
dashboard screenshots
sample EVT/OPC/audit/usage chain

No client system integration.

---

Phase 2 — Guided API walkthrough

Client observes or executes controlled calls:

GET /v1/health
GET /v1/capabilities
POST /v1/ipr/session
POST /v1/chat
GET /v1/opc/{opcId}
GET /v1/audit/{auditId}
GET /v1/model-usage/{usageId}

---

Phase 3 — Tenant pilot setup

Create:

client tenant
client workspace
pilot operator
API credential
rate limit profile
Source Intelligence permissions
retention profile

---

Phase 4 — Controlled integration

Client integrates:

IPR session creation
chat request
operation request
OPC lookup
audit lookup
usage lookup
error handling

---

Phase 5 — Pilot report

Deliver:

technical evidence package
integration gap list
security boundary confirmation
commercial next-step proposal
production-readiness gap report

---

21. Required next implementation tasks

To move from SaaS Core v0.2 pilot readiness to external integration, implement:

client API key/token storage
hashed secret verification
tenant/workspace credential binding
request rate limiting
idempotency persistence
client-facing error envelope
audit export endpoint
usage export endpoint
OpenAPI schema hardening
SDK TypeScript client
tenant provisioning route
operator management model

Suggested implementation order:

1. API key/token model
2. Tenant/workspace onboarding model
3. Rate limit + quota
4. OpenAPI schema stabilization
5. SDK TypeScript
6. Audit/usage export
7. Webhook operation events

---

22. Commercial integration readiness

Before offering an external paid pilot, define:

pilot duration
included endpoints
included request volume
included Source Intelligence sourceSets
included document profiles
support channel
data boundary
retention period
deliverables
price
renewal/extension terms

Recommended pilot packaging:

B2G Guided Runtime Pilot
B2G API Integration Pilot
AI Audit Trail Pilot
Source Intelligence Governance Pilot

---

23. Integration readiness checklist

Minimum readiness before client API access:

[ ] Client tenant created
[ ] Client workspace created
[ ] API key/token issued
[ ] API key secret hashed
[ ] Scope assigned
[ ] Rate limit assigned
[ ] Allowed endpoints assigned
[ ] Allowed sourceSets assigned
[ ] Data policy accepted
[ ] legalCertification=false boundary accepted
[ ] Audit and usage visibility confirmed
[ ] Pilot owner assigned
[ ] Technical contact assigned

Minimum readiness before production candidate:

[ ] RBAC implemented
[ ] Tenant isolation tested
[ ] Audit export tested
[ ] Usage export tested
[ ] Retention workflow defined
[ ] Deletion workflow defined
[ ] Incident process defined
[ ] DPA reviewed
[ ] Security review completed
[ ] Monitoring implemented
[ ] SLA draft created

---

24. Final integration statement

HBCE IPR Runtime API v1 can move from internal self-pilot to external B2G pilot through a staged integration path:

self-pilot runtime
→ guided demo
→ controlled API pilot
→ partner integration pilot
→ production candidate

The next technical priority is not another dashboard card.

The next technical priority is:

tenant-scoped API access with key/token authentication,
rate limits,
OpenAPI stabilization,
and a minimal TypeScript SDK.

Mandatory closing boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
