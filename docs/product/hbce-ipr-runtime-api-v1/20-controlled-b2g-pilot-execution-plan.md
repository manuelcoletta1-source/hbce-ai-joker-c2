HBCE IPR Runtime API v1

Controlled B2G Pilot Execution Plan

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Target increment: SaaS Core v0.2 — B2G Pilot Readiness
Scope: controlled B2G pilot execution, operational gates, client onboarding, technical validation, pilot closure
Target: HBCE operators / B2G pilot reviewers / regulated enterprise technical teams
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the controlled B2G pilot execution plan for HBCE IPR Runtime API v1.

The purpose is to provide a concrete operational sequence for running a controlled pilot with a public-sector, regulated enterprise, institutional or technical partner.

The plan defines:

pilot scope
pilot roles
pilot phases
technical gates
security gates
tenant/workspace onboarding
API credentialing
runtime execution
audit and usage review
EVT/OPC proof review
Source Intelligence review
export review
pilot closure
final PASS/FAIL criteria

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Executive summary

HBCE IPR Runtime API v1 can be presented for controlled B2G pilot execution only under a scoped and documented environment.

Current position:

Runtime validated = YES
API v1 public surface = 16/16 PASS
Dashboard = PASS
EVT/OPC/audit/usage persistence = PASS
Source Intelligence registry = PASS
Product documentation package = READY
Production SaaS = NOT YET
Controlled B2G pilot = NEXT EXECUTION TARGET

The pilot must not be presented as:

production SaaS
legal certification service
official identity authority
qualified timestamping service
unrestricted external API platform

The correct framing is:

controlled technical pilot for governed AI runtime,
operational identity/proof layer,
technical event trace,
technical proof receipt,
audit reconstruction,
model usage accountability,
and Source Intelligence governance.

---

3. Current validated baseline

The pilot execution starts from the following validated baseline:

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
API v1 public surface = 16/16 PASS
Document registry = AVAILABLE
Dashboard = PASS
legalCertification=false

Reference technical chain:

Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7

Validated public API v1 surface:

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

---

4. Pilot objective

The controlled B2G pilot must prove that HBCE/JOKER-C2 can support a governed AI runtime interaction where every relevant execution is linked to:

runtime identity
tenant/workspace scope
policy decision
EVT technical event trace
OPC technical proof receipt
audit record
model usage record
Source Intelligence boundary if used
legal boundary

The pilot should demonstrate:

governed AI execution
operational identity/proof layer
technical proof continuity
audit reconstruction
usage accountability
tenant/workspace scoping
controlled client integration path

The pilot should not attempt to prove everything at once.

No “let’s test all modules, all endpoints, all clients, all exports, all documents and maybe rebuild the EU while we are here.” That is how pilots become archaeological sites.

---

5. Pilot type

Recommended pilot type:

CONTROLLED_B2G_API_PILOT

Alternative pilot types:

GUIDED_RUNTIME_DEMO
DASHBOARD_ONLY_REVIEW
SOURCE_INTELLIGENCE_REVIEW
API_CONTRACT_REVIEW
FULL_CONTROLLED_INTEGRATION_PILOT

This execution plan targets:

CONTROLLED_B2G_API_PILOT

---

6. Pilot roles

HBCE Pilot Owner

Responsible for:

pilot scope
client communication
boundary statement
pilot acceptance criteria
pilot closure

HBCE Technical Operator

Responsible for:

runtime setup
tenant/workspace setup
API credential issuance
test execution
technical evidence collection

HBCE Security Reviewer

Responsible for:

security checklist
credential review
scope review
tenant isolation review
export/webhook review if enabled

Client Pilot Owner

Responsible for:

client-side use case
participant approval
pilot review
acceptance feedback

Client Technical Contact

Responsible for:

API connection
test request execution
integration feedback
error reporting

Client Audit/Security Reviewer

Responsible for:

reviewing EVT/OPC/audit/usage evidence
reviewing boundary statements
reviewing export package if enabled

---

7. Pilot duration

Recommended duration:

2 to 4 weeks

Minimum pilot:

5 working days

Extended pilot:

4 to 8 weeks

Recommended phases:

Phase 0 — Pre-pilot review
Phase 1 — Tenant/workspace setup
Phase 2 — Security gate
Phase 3 — Guided technical execution
Phase 4 — Client-side API test
Phase 5 — Evidence review
Phase 6 — Pilot closure

---

8. Pilot data boundary

Default data boundary:

PUBLIC_OR_SYNTHETIC_ONLY

Allowed data for first pilot:

public prompts
synthetic operational scenarios
non-sensitive technical test cases
public Source Intelligence questions
non-production files only if document handling is enabled

Not allowed by default:

client production data
classified data
sensitive personal data
confidential legal documents
raw regulated datasets
secret credentials inside prompts
private cyber incident data

Sensitive data requires:

separate written policy
data-processing review
security review
explicit approval
retention rule
export rule

---

9. Pilot phases overview

Phase 0 — Pre-pilot readiness review
Phase 1 — Pilot scope definition
Phase 2 — Tenant/workspace onboarding
Phase 3 — Credential and access setup
Phase 4 — Security review gate
Phase 5 — Guided runtime demonstration
Phase 6 — Controlled API execution
Phase 7 — Evidence review
Phase 8 — Export/reporting review
Phase 9 — Client feedback
Phase 10 — Pilot closure and next-step decision

---

10. Phase 0 — Pre-pilot readiness review

Goal:

Verify that HBCE baseline is still PASS before involving client systems.

Checklist:

[ ] Dashboard shows HEALTHY
[ ] API v1 public surface is 16/16 PASS
[ ] Runtime identity is active
[ ] Memory is IPR_BOUND
[ ] EVT persistence is active
[ ] OPC persistence is active
[ ] Audit persistence is active
[ ] Model usage persistence is active
[ ] Source Intelligence registry is ready
[ ] legalCertification=false is visible

Expected output:

PRE_PILOT_READINESS_PASS

---

11. Phase 1 — Pilot scope definition

Goal:

Define what will be tested and what will not be tested.

Pilot scope must include:

client name
client type
pilot objective
pilot use case
data boundary
integration mode
duration
allowed endpoints
allowed sourceSets
operator roles
acceptance criteria
legal boundary

Recommended pilot scope statement:

This pilot evaluates HBCE IPR Runtime API v1 as a governed AI runtime
for operational identity, technical event tracing, technical proof receipt,
audit reconstruction and model usage accountability.
The pilot does not provide legal certification.
legalCertification=false.

Expected output:

PILOT_SCOPE_DEFINED

---

12. Phase 2 — Tenant/workspace onboarding

Goal:

Create an isolated pilot scope for the client.

Required objects:

tenant
workspace
account
subscription
operator records
rate-limit profile
sourceSet permissions
retention profile

Recommended identifiers:

tenantId=HBCE-TENANT-CLIENT-CODE-PILOT
workspaceId=HBCE-WORKSPACE-AI-AUDIT-TRAIL
accountId=HBCE-ACCOUNT-CLIENT-CODE
subscriptionId=HBCE-SUBSCRIPTION-CLIENT-CODE-PILOT
tier=B2G_PILOT

Validation:

[ ] tenantStatus=ACTIVE
[ ] workspaceStatus=ACTIVE
[ ] subscriptionStatus=ACTIVE
[ ] tenant is not HBCE-TENANT-SELF-PILOT
[ ] workspace is not HBCE-WORKSPACE-RND

Expected output:

TENANT_ONBOARDING_READY
tenantStatus=ACTIVE
workspaceStatus=ACTIVE
subscriptionStatus=ACTIVE
legalCertification=false

---

13. Phase 3 — Credential and access setup

Goal:

Issue scoped API access for the pilot.

Required:

API credential created
secret shown only once
secret hash stored
credential bound to tenant
credential bound to workspace
credential bound to subscription
scopes assigned
expiration assigned
rate-limit profile assigned

Default scopes:

v1:health:read
v1:capabilities:read
v1:ipr-session:create
v1:ipr-session:read
v1:chat:create
v1:operations:create
v1:operations:read
v1:opc:read
v1:audit:read
v1:model-usage:read
v1:source-intelligence:read

Do not enable by default:

admin scopes
credential management
file ingestion
export creation
webhook management
tenant management

Expected output:

API_CREDENTIAL_READY
credentialStatus=ACTIVE
tenantScope=PASS
workspaceScope=PASS
legalCertification=false

---

14. Phase 4 — Security review gate

Goal:

Run the controlled API pilot security checklist before client execution.

Required checklist areas:

runtime identity
tenant/workspace isolation
API key/token
endpoint scopes
rate-limit/quota
memory security
document registry boundary
Source Intelligence security
EVT/OPC proof chain
audit security
model usage security
export security if enabled
webhook security if enabled
admin console security if enabled
OpenAPI security
SDK security if used
data protection
secret handling
fail-closed behavior

Expected output:

CONTROLLED_API_PILOT_SECURITY_READY
legalCertification=false

If this phase fails, pilot execution must stop.

Yes, even if everyone is excited. Especially then.

---

15. Phase 5 — Guided runtime demonstration

Goal:

Show the client the governed runtime before giving them API execution responsibility.

Demo sequence:

1. Show dashboard runtime health.
2. Show API v1 public surface 16/16 PASS.
3. Show runtime identity.
4. Show tenant/workspace scope.
5. Run governed runtime diagnostic.
6. Show EVT generated.
7. Show OPC generated.
8. Show audit record.
9. Show model usage record.
10. Show legal boundary.

Expected output:

GUIDED_RUNTIME_DEMO_PASS
EVT=PERSISTED
OPC=PERSISTED
audit=PERSISTED
usage=PERSISTED
legalCertification=false

---

16. Phase 6 — Controlled API execution

Goal:

Allow the client or HBCE operator to execute a controlled API request.

Recommended first request:

POST /api/v1/chat

Recommended test prompt:

Run a governed AI runtime diagnostic for this tenant and show runtime identity,
tenant, workspace, policy decision, EVT, OPC, audit, model usage and legal boundary.

Required validations:

[ ] API credential accepted
[ ] tenant scope PASS
[ ] workspace scope PASS
[ ] policy decision explicit
[ ] EVT generated
[ ] OPC generated
[ ] audit generated
[ ] usage generated
[ ] legalCertification=false returned

Expected output:

CONTROLLED_API_EXECUTION_PASS
apiCredential=PASS
tenantScope=PASS
workspaceScope=PASS
EVT=PERSISTED
OPC=PERSISTED
audit=PERSISTED
usage=PERSISTED
legalCertification=false

---

17. Phase 7 — Negative tests

Goal:

Prove fail-closed behavior.

Required negative tests:

invalid API key
revoked API key
expired API key
missing scope
tenant mismatch
workspace mismatch
unknown sourceSet
sourceSet not allowed
quota exceeded if quota layer is active
document profile out of scope if document layer is active

Expected result:

FAIL_CLOSED_PASS

Each rejected request must return:

stable error code
no secret leakage
legalCertification=false

---

18. Phase 8 — Evidence review

Goal:

Review the technical proof chain generated during pilot execution.

Evidence items:

EVT ID
OPC ID
audit ID
usage ID
runtime identity
tenant ID
workspace ID
policy decision
risk level
model
model level
cost units if available
legal boundary

Review endpoints:

GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
GET /api/v1/model-usage/{usageId}
GET /api/v1/events

Expected output:

PILOT_EVIDENCE_REVIEW_PASS
evtOpcLinkage=PASS
auditLinkage=PASS
usageLinkage=PASS
legalCertification=false

---

19. Phase 9 — Export/reporting review

Goal:

Produce or simulate a tenant-scoped technical evidence package.

If export endpoints are implemented:

generate JSON audit export
generate JSON usage export
generate evidence package
generate pilot report

If export endpoints are not implemented yet:

provide manual pilot evidence package from dashboard/API records
mark export automation as FUTURE/P1

Expected output when implemented:

AUDIT_USAGE_EXPORT_READY

Expected output when not implemented:

EXPORT_AUTOMATION_NOT_IMPLEMENTED
manualEvidencePackage=READY
legalCertification=false

---

20. Phase 10 — Client feedback

Goal:

Collect structured feedback from the client.

Feedback areas:

runtime clarity
API clarity
proof chain usefulness
audit usefulness
usage reporting usefulness
Source Intelligence usefulness
integration difficulty
security concerns
data boundary concerns
commercial interest
next-step recommendation

Recommended feedback scale:

PASS
PASS_WITH_LIMITATIONS
FAIL
NOT_TESTED

---

21. Phase 11 — Pilot closure

Goal:

Close the pilot with a technical verdict and next-step decision.

Closure package:

pilot summary
scope statement
execution log
test matrix
negative test results
EVT/OPC/audit/usage references
known limitations
client feedback
next-step recommendation
legal boundary statement

Closure verdict options:

PILOT_PASS
PILOT_PASS_WITH_LIMITATIONS
PILOT_FAIL
PILOT_EXTEND
PILOT_CONVERT_TO_IMPLEMENTATION

Expected final output:

CONTROLLED_B2G_PILOT_CLOSED
finalVerdict=PILOT_PASS | PILOT_PASS_WITH_LIMITATIONS | PILOT_FAIL
legalCertification=false

---

22. Pilot test matrix

Test| Required| Expected
Runtime health| YES| PASS
API v1 self-test| YES| 16/16 PASS
Tenant active| YES| PASS
Workspace active| YES| PASS
API credential active| YES| PASS
Chat execution| YES| PASS
EVT persistence| YES| PASS
OPC persistence| YES| PASS
Audit persistence| YES| PASS
Usage persistence| YES| PASS
Invalid credential rejection| YES| PASS
Tenant mismatch rejection| YES| PASS
Workspace mismatch rejection| YES| PASS
Source Intelligence descriptor| OPTIONAL| PASS
File descriptor| OPTIONAL| PASS
Export package| OPTIONAL/P1| PASS or NOT_IMPLEMENTED
Webhook delivery| OPTIONAL/P2| PASS or NOT_IMPLEMENTED
Admin console| OPTIONAL/P1| PASS or NOT_IMPLEMENTED

---

23. Pilot PASS criteria

The pilot may be marked PASS if:

runtime health PASS
API v1 status PASS
tenant/workspace scope PASS
API credential test PASS
governed chat execution PASS
EVT persisted
OPC persisted
audit persisted
usage persisted
negative tests fail closed
legalCertification=false visible
client confirms technical value

Minimum PASS output:

CONTROLLED_B2G_PILOT_PASS
runtime=PASS
apiV1=16/16_PASS
tenantScope=PASS
workspaceScope=PASS
apiCredential=PASS
evtOpcProofChain=PASS
auditUsage=PASS
failClosed=PASS
legalCertification=false

---

24. Pilot PASS_WITH_LIMITATIONS criteria

The pilot may be marked PASS_WITH_LIMITATIONS if core runtime passes but some SaaS maturity layers are not implemented.

Acceptable limitations:

audit/usage export manual only
webhook delivery not implemented
admin console not implemented
SDK not implemented
OpenAPI not fully stabilized
rate-limit/quota simulated or manual

Not acceptable limitations:

tenant isolation missing
workspace isolation missing
API credential missing for external API access
EVT/OPC not persisted
audit not persisted
usage not persisted
legalCertification=false missing
negative tests not executed

---

25. Pilot FAIL criteria

The pilot must fail if:

runtime unhealthy
API v1 public surface not PASS
tenant/workspace mismatch allowed
invalid credential accepted
revoked credential accepted
EVT not generated
OPC not generated
audit not persisted
usage not persisted
cross-tenant access possible
legalCertification=false missing
system claims legal certification

Expected FAIL output:

CONTROLLED_B2G_PILOT_FAIL
failReason=...
legalCertification=false

---

26. Pilot evidence package

The pilot evidence package should include:

pilot ID
client name
tenant ID
workspace ID
runtime baseline
API v1 baseline
test matrix
positive test results
negative test results
EVT IDs
OPC IDs
audit IDs
usage IDs
quota status
Source Intelligence status
export status
known limitations
boundary statement

Recommended file:

docs/product/hbce-ipr-runtime-api-v1/pilot-reports/<client-code>-pilot-report.md

---

27. Pilot acceptance output

Recommended final machine-readable block:

CONTROLLED_B2G_PILOT_REPORT_READY
pilotId=PILOT-...
client=...
tenantId=...
workspaceId=...
duration=...
runtimeBaseline=PASS
apiV1Surface=16/16_PASS
apiCredential=PASS
tenantIsolation=PASS
workspaceIsolation=PASS
evtOpcProofChain=PASS
auditUsage=PASS
negativeTests=PASS
exportLayer=PASS | MANUAL | NOT_IMPLEMENTED
webhooks=PASS | NOT_IMPLEMENTED
adminConsole=PASS | NOT_IMPLEMENTED
finalVerdict=PILOT_PASS | PILOT_PASS_WITH_LIMITATIONS | PILOT_FAIL
legalCertification=false

---

28. Commercial conversion trigger

A pilot can move toward commercial conversion if:

client confirms use case relevance
client accepts technical boundary
client accepts legalCertification=false
client sees value in audit/proof/usage chain
client identifies integration path
client requests extended pilot or implementation proposal

Commercial next step options:

extended technical pilot
controlled API integration
Source Intelligence pilot
admin/operator console pilot
custom B2G implementation proposal
R&D partnership

---

29. Implementation dependency map

Pilot capability| Required implementation
External API access| API key/token layer
Client isolation| Tenant/workspace model
Usage control| Rate limit/quota layer
Client integration| OpenAPI stabilization
Developer adoption| TypeScript SDK
Evidence package| Audit/usage export
Event delivery| Webhook events
SaaS operation| Admin/operator console
Security approval| Security review checklist

---

30. Immediate next engineering step after this document

Recommended first code step after documentation package:

Implement API key/token validation for POST /api/v1/chat in pilot mode.

First code target:

lib/api-auth.ts

Second code target:

database table: hbce_api_credentials

Third code target:

protect POST /api/v1/chat

Do not start from webhook, PDF, customer portal or SDK. Start with the gate. Doors before chandeliers, shocking as it may be.

---

31. Final pilot execution statement

The controlled B2G pilot is the correct next operational stage for HBCE IPR Runtime API v1.

It proves:

governed AI runtime execution
tenant/workspace scoped access
technical proof chain
audit reconstruction
model usage accountability
Source Intelligence boundary
security boundary
client integration path

It does not claim:

production SaaS readiness
legal certification
public authority validation
qualified timestamping
official identity issuance
unrestricted external access

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
