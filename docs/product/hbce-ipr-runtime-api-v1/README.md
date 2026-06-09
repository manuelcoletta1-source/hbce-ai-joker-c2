HBCE IPR Runtime API v1

Product Documentation Index

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Target increment: SaaS Core v0.2 — B2G Pilot Readiness
Layer: HBCE IPR Operational Identity & Proof Layer
Status: Runtime validated / API v1 public surface PASS / B2G pilot-readiness package complete
Boundary: "legalCertification=false"

---

1. Product definition

HBCE IPR Runtime API v1 is the public technical surface of the HBCE/JOKER-C2 governed AI runtime.

It exposes a controlled runtime layer for:

operational identity
governed AI execution
technical event trace
technical proof receipt
audit reconstruction
model usage accounting
Source Intelligence descriptor
document profile governance
tenant/workspace pilot readiness

The runtime model is:

IPR identifies the operational subject.
JOKER-C2 executes the governed AI interaction.
EVT traces the technical event.
OPC produces the technical proof receipt.
Audit reconstructs the runtime decision.
Model Usage records execution/accounting metadata.
MATRIX organizes the operational process.
HBCE governs the runtime boundary.

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
IPR Card is an internal operational identity certificate, not an official public identity document.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Current validated baseline

Current internal validated state:

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
Document registry = AVAILABLE
API v1 public surface = 16/16 PASS
Dashboard = PASS
legalCertification=false

Reference proof chain:

Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7

Validated API v1 endpoint matrix:

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

3. Documentation package

This directory contains the HBCE IPR Runtime API v1 product, technical, pilot and SaaS readiness documentation.

The documentation package is organized as a progressive B2G productization path:

01–04 = Product identity, API contract, demo, regression proof
05–09 = B2G pilot package, demo flow, security boundary, integration, commercial offer
10–14 = API access, tenant model, quota model, OpenAPI, SDK
15–18 = Export, webhooks, admin console, security review
19–20 = Production gap report and controlled B2G pilot execution

---

4. Document index

00 — Product documentation index

README.md

Purpose:

Main index for the HBCE IPR Runtime API v1 documentation package.

---

01 — One-page product brief

01-one-page-product-brief.md

Purpose:

Defines the product in one page for B2B/B2G readers.

Covers:

product positioning
problem
solution
runtime proof chain
target users
pilot value
boundary

---

02 — Technical API contract sheet

02-technical-api-contract-sheet.md

Purpose:

Defines the technical API v1 contract and endpoint surface.

Covers:

endpoint matrix
request/response model
IPR session
chat
files
operations
events
OPC
audit
model usage
OpenAPI
self-test
Source Intelligence
boundary

---

03 — IPR AI Audit Trail demo script

03-ipr-ai-audit-trail-demo-script.md

Purpose:

Defines the 12-minute demo script for presenting HBCE/JOKER-C2.

Covers:

demo opening
problem
runtime execution
IPR
EVT
OPC
audit
usage
dashboard
boundary
pilot next step

---

04 — API v1 public surface regression v76

04-api-v1-public-surface-regression-v76.md

Purpose:

Records the validated API v1 public surface regression.

Covers:

16/16 endpoint PASS
contract-only safety
no semantic memory
no document ingestion
no document recall
no Source Intelligence live fetch
dashboard API v1 card
legalCertification=false

---

05 — B2G pilot package

05-b2g-pilot-package.md

Purpose:

Packages HBCE IPR Runtime API v1 for a B2G technical pilot.

Covers:

pilot scope
client value
technical baseline
pilot phases
deliverables
acceptance criteria
boundary

---

06 — B2G demo flow

06-b2g-demo-flow.md

Purpose:

Defines the operational demo flow for B2G presentation.

Covers:

opening sequence
runtime dashboard
API v1 card
governed AI request
proof chain
audit and usage
Source Intelligence
closing narrative

---

07 — Security boundary pack

07-security-boundary-pack.md

Purpose:

Defines the product security and legal boundary.

Covers:

legalCertification=false
OPC boundary
EVT boundary
IPR boundary
data boundary
Source Intelligence boundary
document boundary
export boundary
operator boundary

---

08 — Client integration roadmap

08-client-integration-roadmap.md

Purpose:

Defines how a client or partner integrates with API v1.

Covers:

integration phases
API access
IPR session
chat
operations
proof lookup
audit lookup
usage lookup
OpenAPI
SDK
pilot to production path

---

09 — Commercial pilot offer

09-commercial-pilot-offer.md

Purpose:

Defines the commercial offer structure for B2G/B2B pilots.

Covers:

guided demo
technical pilot
controlled API integration pilot
commercial model
deliverables
exclusions
client responsibilities
HBCE responsibilities
boundary

---

10 — API key / token model

10-api-key-token-model.md

Purpose:

Defines external client API credentialing.

Covers:

API key
bearer token
secret hashing
scopes
tenant/workspace binding
credential status
revocation
rotation
expiration
auth errors
first implementation path

---

11 — Tenant onboarding model

11-tenant-onboarding-model.md

Purpose:

Defines how external client tenants and workspaces are created.

Covers:

tenant
workspace
account
subscription
operator
API credential binding
Source Intelligence permissions
document permissions
memory permissions
audit/usage visibility
retention profile

---

12 — Rate limit & quota model

12-rate-limit-quota-model.md

Purpose:

Defines request limits, quota enforcement and usage caps.

Covers:

rate-limit profiles
quota dimensions
cost units
Source Intelligence quotas
document quotas
memory quotas
quota ledger
429 response
quota exceeded response
dashboard quota visibility

---

13 — OpenAPI stabilization plan

13-openapi-stabilization-plan.md

Purpose:

Defines how API v1 becomes a stable OpenAPI contract.

Covers:

OpenAPI 3.1
operation IDs
shared schemas
Boundary schema
ProofReferences schema
ErrorEnvelope schema
auth schemes
idempotency
rate-limit headers
SDK readiness

---

14 — TypeScript SDK plan

14-typescript-sdk-plan.md

Purpose:

Defines the TypeScript SDK for API v1.

Covers:

@hbce/ipr-runtime-sdk
client config
auth
types
errors
boundary propagation
proof references
chat method
OPC/audit/usage lookup
Source Intelligence descriptor
examples

---

15 — Audit & usage export plan

15-audit-usage-export-plan.md

Purpose:

Defines tenant-scoped export of audit and model usage evidence.

Covers:

audit export
usage export
EVT export
OPC export
evidence packages
pilot reports
JSON/CSV formats
redaction
export audit
legal boundary

---

16 — Webhook events plan

16-webhook-events-plan.md

Purpose:

Defines webhook event delivery for client systems.

Covers:

webhook endpoint registration
event types
signed payloads
HMAC verification
retry policy
delivery status
security restrictions
quota
OpenAPI additions
SDK additions

---

17 — Admin & operator console plan

17-admin-operator-console-plan.md

Purpose:

Defines the internal admin/operator console for SaaS operation.

Covers:

runtime overview
tenant management
workspace management
API credentials
quota
audit records
usage records
EVT/OPC proof chain
webhooks
exports
operator roles
console audit

---

18 — Security review checklist

18-security-review-checklist.md

Purpose:

Defines the technical security review checklist before external pilot.

Covers:

runtime identity
tenant isolation
API credentials
scopes
quota
memory
documents
Source Intelligence
EVT/OPC
audit
usage
export
webhooks
admin console
OpenAPI
SDK
fail-closed behavior

---

19 — Production readiness gap report

19-production-readiness-gap-report.md

Purpose:

Separates current validated state from full production readiness.

Covers:

PASS areas
PLAN_READY areas
P0 blockers
P1 requirements
P2 production candidate requirements
P3 future enhancements
risk register
pilot gate
production candidate gate
allowed product claims

---

20 — Controlled B2G pilot execution plan

20-controlled-b2g-pilot-execution-plan.md

Purpose:

Defines the operational execution plan for a controlled B2G pilot.

Covers:

pilot roles
pilot phases
tenant setup
credential setup
security gate
guided demo
controlled API execution
negative tests
evidence review
export/reporting review
pilot closure
PASS/FAIL criteria

---

5. Current product claim

Allowed claim:

HBCE IPR Runtime API v1 is a validated governed AI runtime API surface
with 16/16 contract-only endpoint PASS, EVT/OPC/audit/usage persistence,
Source Intelligence registry readiness and a complete B2G pilot-readiness documentation package.

Allowed pilot claim:

HBCE/JOKER-C2 is ready for controlled B2G pilot preparation,
guided demo and technical integration planning.

Not allowed yet:

fully production-ready SaaS
unrestricted external API access
legal certification platform
official identity authority
qualified timestamping service
SOC2/ISO-certified service
multi-tenant production platform

---

6. Recommended next implementation path

After documentation package 01–20, the recommended code path is:

1. Implement API key/token validation for POST /api/v1/chat.
2. Implement tenant/workspace validation helper.
3. Implement rate-limit/quota helper.
4. Stabilize /api/v1/openapi.
5. Build minimal TypeScript SDK.
6. Add audit/usage list export endpoints.
7. Build admin/operator console MVP.
8. Add webhook test delivery.
9. Execute controlled B2G pilot security review.
10. Run controlled B2G pilot.

First code target:

lib/api-auth.ts

Second code target:

database table: hbce_api_credentials

Third code target:

protect POST /api/v1/chat in pilot mode

---

7. Pilot gate

Minimum controlled B2G API pilot gate:

CONTROLLED_B2G_API_PILOT_READY
apiCredential=PASS
tenantIsolation=PASS
workspaceIsolation=PASS
rateLimitQuota=PASS
openApiContract=PASS
securityReview=PASS
auditPersistence=PASS
usagePersistence=PASS
evtOpcProofChain=PASS
legalCertification=false

Minimum production candidate gate:

PRODUCTION_CANDIDATE_READY
controlledPilotGate=PASS
exportLayer=PASS
adminConsole=PASS
openApi=PASS
sdk=PASS
monitoring=PASS
incidentResponse=PASS
backupRecovery=PASS
retentionDeletion=PASS
legalCertification=false

---

8. Repository status note

This package is documentation-first.

The documentation defines the implementation plan for SaaS Core v0.2.

Not every planned module is already implemented.

Current status:

Runtime validated = YES
API v1 public surface validated = YES
Dashboard product card validated = YES
B2G pilot package documented = YES
External SaaS control plane fully implemented = NO
Production SaaS readiness = NO
Controlled B2G pilot readiness = NEXT TARGET

---

9. Final boundary

All documents in this package inherit the same mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
IPR Card is an internal operational identity certificate, not an official public identity document.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
