# HBCE IPR Runtime API v1
## Product Documentation Index

**Product:** HBCE IPR Runtime API v1  
**Runtime:** JOKER-C2 SaaS Core v0.1  
**Target increment:** SaaS Core v0.2 — B2G Pilot Readiness  
**Layer:** HBCE IPR Operational Identity & Proof Layer  
**Status:** Runtime validated / API v1 public surface PASS / Auth + Tenant + Quota control plane aligned  
**Current regression target:** API v1 public surface regression v77  
**Boundary:** `legalCertification=false`

---

## 1. Product definition

HBCE IPR Runtime API v1 is the public technical surface of the HBCE/JOKER-C2 governed AI runtime.

It exposes a controlled runtime layer for:

```txt
operational identity
governed AI execution
technical event trace
technical proof receipt
audit reconstruction
model usage accounting
Source Intelligence descriptor
document profile governance
tenant/workspace pilot readiness
API authentication
tenant/workspace isolation
rate-limit and quota control
```

The runtime model is:

```txt
IPR identifies the operational subject.
JOKER-C2 executes the governed AI interaction.
EVT traces the technical event.
OPC produces the technical proof receipt.
Audit reconstructs the runtime decision.
Model Usage records execution/accounting metadata.
MATRIX organizes the operational process.
HBCE governs the runtime boundary.
```

Mandatory boundary:

```txt
legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
IPR Card is an internal operational identity certificate, not an official public identity document.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
```

---

## 2. Current validated baseline

Current internal validated state:

```txt
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
API Auth = READY
Tenant Scope = READY
Rate Limit / Quota = READY
legalCertification=false
```

Reference proof chain:

```txt
Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7
```

Validated API v1 endpoint matrix:

```txt
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
```

---

## 3. Current API v1 control plane

The current controlled pilot surface introduces the following chain for protected runtime execution:

```txt
API Auth
→ Tenant / Workspace Scope
→ Rate Limit / Quota
→ Runtime JOKER-C2
→ EVT
→ OPC
→ Audit
→ Model Usage
```

Current protected endpoint:

```txt
POST /api/v1/chat
```

Supported authentication modes:

```txt
x-hbce-api-key
Authorization: Bearer <token>
```

Required pilot headers:

```txt
x-hbce-api-key
x-hbce-tenant-id
x-hbce-workspace-id
```

Optional pilot headers:

```txt
Authorization: Bearer <token>
x-hbce-source-set
x-hbce-idempotency-key
```

Expected response headers:

```txt
X-HBCE-API-Auth
X-HBCE-Tenant-Scope
X-HBCE-Rate-Limit-Quota
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
X-HBCE-Quota-Profile
X-HBCE-Quota-Remaining
```

Current control-plane files:

```txt
lib/api-auth.ts
lib/tenant-scope.ts
lib/rate-limit-quota.ts
database/migrations/20260609_create_hbce_api_credentials.sql
database/migrations/20260610_create_hbce_tenant_scope.sql
database/migrations/20260610_create_hbce_rate_limit_quota.sql
scripts/create-hbce-api-credential.ts
```

---

## 4. Documentation package

This directory contains the HBCE IPR Runtime API v1 product, technical, pilot and SaaS readiness documentation.

The documentation package is organized as a progressive B2G productization path:

```txt
01–04 = Product identity, API contract, demo, regression proof
05–09 = B2G pilot package, demo flow, security boundary, integration, commercial offer
10–14 = API access, tenant model, quota model, OpenAPI, SDK
15–18 = Export, webhooks, admin console, security review
19–20 = Production gap report and controlled B2G pilot execution
v77 = Auth + tenant/workspace + quota public surface regression
```

---

## 5. Document index

### 00 — Product documentation index

```txt
README.md
```

Purpose:

```txt
Main index for the HBCE IPR Runtime API v1 documentation package.
```

---

### 01 — One-page product brief

```txt
01-one-page-product-brief.md
```

Purpose:

```txt
Defines the product in one page for B2B/B2G readers.
```

Covers:

```txt
product positioning
problem
solution
runtime proof chain
target users
pilot value
boundary
```

---

### 02 — Technical API contract sheet

```txt
02-technical-api-contract-sheet.md
```

Purpose:

```txt
Defines the technical API v1 contract and endpoint surface.
```

Covers:

```txt
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
```

---

### 03 — IPR AI Audit Trail demo script

```txt
03-ipr-ai-audit-trail-demo-script.md
```

Purpose:

```txt
Defines the 12-minute demo script for presenting HBCE/JOKER-C2.
```

Covers:

```txt
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
```

---

### 04 — API v1 public surface regression v76

```txt
04-api-v1-public-surface-regression-v76.md
```

Purpose:

```txt
Records the validated API v1 public surface regression before the auth/tenant/quota control-plane extension.
```

Covers:

```txt
16/16 endpoint PASS
contract-only safety
no semantic memory
no document ingestion
no document recall
no Source Intelligence live fetch
dashboard API v1 card
legalCertification=false
```

---

### 04b — API v1 public surface regression v77

```txt
04-api-v1-public-surface-regression-v77.md
```

Purpose:

```txt
Records the API v1 public surface regression target after API Auth,
Tenant/Workspace Scope and Rate Limit/Quota alignment.
```

Covers:

```txt
16/16 endpoint matrix
POST /api/v1/chat protected
API Auth regression target
Tenant/workspace scope regression target
Rate-limit/quota regression target
Root discovery v1.2
Health v1.1
Capabilities v1.1
Self-test v1.1
OpenAPI v1.2
positive chat test
negative/fail-closed chat tests
migration order
legalCertification=false
```

---

### 05 — B2G pilot package

```txt
05-b2g-pilot-package.md
```

Purpose:

```txt
Packages HBCE IPR Runtime API v1 for a B2G technical pilot.
```

Covers:

```txt
pilot scope
client value
technical baseline
pilot phases
deliverables
acceptance criteria
boundary
```

---

### 06 — B2G demo flow

```txt
06-b2g-demo-flow.md
```

Purpose:

```txt
Defines the operational demo flow for B2G presentation.
```

Covers:

```txt
opening sequence
runtime dashboard
API v1 card
governed AI request
proof chain
audit and usage
Source Intelligence
closing narrative
```

---

### 07 — Security boundary pack

```txt
07-security-boundary-pack.md
```

Purpose:

```txt
Defines the product security and legal boundary.
```

Covers:

```txt
legalCertification=false
OPC boundary
EVT boundary
IPR boundary
data boundary
Source Intelligence boundary
document boundary
export boundary
operator boundary
```

---

### 08 — Client integration roadmap

```txt
08-client-integration-roadmap.md
```

Purpose:

```txt
Defines how a client or partner integrates with API v1.
```

Covers:

```txt
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
```

---

### 09 — Commercial pilot offer

```txt
09-commercial-pilot-offer.md
```

Purpose:

```txt
Defines the commercial offer structure for B2G/B2B pilots.
```

Covers:

```txt
guided demo
technical pilot
controlled API integration pilot
commercial model
deliverables
exclusions
client responsibilities
HBCE responsibilities
boundary
```

---

### 10 — API key / token model

```txt
10-api-key-token-model.md
```

Purpose:

```txt
Defines external client API credentialing.
```

Covers:

```txt
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
```

---

### 11 — Tenant onboarding model

```txt
11-tenant-onboarding-model.md
```

Purpose:

```txt
Defines how external client tenants and workspaces are created.
```

Covers:

```txt
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
```

---

### 12 — Rate limit & quota model

```txt
12-rate-limit-quota-model.md
```

Purpose:

```txt
Defines request limits, quota enforcement and usage caps.
```

Covers:

```txt
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
```

---

### 13 — OpenAPI stabilization plan

```txt
13-openapi-stabilization-plan.md
```

Purpose:

```txt
Defines how API v1 becomes a stable OpenAPI contract.
```

Covers:

```txt
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
```

---

### 14 — TypeScript SDK plan

```txt
14-typescript-sdk-plan.md
```

Purpose:

```txt
Defines the TypeScript SDK for API v1.
```

Covers:

```txt
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
```

---

### 15 — Audit & usage export plan

```txt
15-audit-usage-export-plan.md
```

Purpose:

```txt
Defines tenant-scoped export of audit and model usage evidence.
```

Covers:

```txt
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
```

---

### 16 — Webhook events plan

```txt
16-webhook-events-plan.md
```

Purpose:

```txt
Defines webhook event delivery for client systems.
```

Covers:

```txt
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
```

---

### 17 — Admin & operator console plan

```txt
17-admin-operator-console-plan.md
```

Purpose:

```txt
Defines the internal admin/operator console for SaaS operation.
```

Covers:

```txt
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
```

---

### 18 — Security review checklist

```txt
18-security-review-checklist.md
```

Purpose:

```txt
Defines the technical security review checklist before external pilot.
```

Covers:

```txt
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
```

---

### 19 — Production readiness gap report

```txt
19-production-readiness-gap-report.md
```

Purpose:

```txt
Separates current validated state from full production readiness.
```

Covers:

```txt
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
```

---

### 20 — Controlled B2G pilot execution plan

```txt
20-controlled-b2g-pilot-execution-plan.md
```

Purpose:

```txt
Defines the operational execution plan for a controlled B2G pilot.
```

Covers:

```txt
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
```

---

## 6. Current implementation status

Current implemented/produced code surface:

```txt
lib/api-auth.ts
lib/tenant-scope.ts
lib/rate-limit-quota.ts
scripts/create-hbce-api-credential.ts
database/migrations/20260609_create_hbce_api_credentials.sql
database/migrations/20260610_create_hbce_tenant_scope.sql
database/migrations/20260610_create_hbce_rate_limit_quota.sql
app/api/v1/chat/route.ts
app/api/v1/health/route.ts
app/api/v1/capabilities/route.ts
app/api/v1/self-test/route.ts
app/api/v1/openapi/route.ts
app/api/v1/route.ts
```

Current route alignment:

```txt
GET  /api/v1                      = root discovery v1.2
GET  /api/v1/health               = auth/tenant/quota status v1.1
GET  /api/v1/capabilities         = auth/tenant/quota capabilities v1.1
GET  /api/v1/self-test            = auth/tenant/quota contract v1.1
GET  /api/v1/openapi              = auth/tenant/quota OpenAPI v1.2
POST /api/v1/chat                 = auth/tenant/quota protected pilot endpoint v0.3
```

---

## 7. Current product claim

Allowed claim:

```txt
HBCE IPR Runtime API v1 is a validated governed AI runtime API surface
with 16/16 contract-only endpoint coverage, EVT/OPC/audit/usage persistence,
Source Intelligence registry readiness, B2G pilot-readiness documentation,
and an implementation path for API Auth, Tenant/Workspace Scope and Rate Limit/Quota controls.
```

Allowed pilot claim:

```txt
HBCE/JOKER-C2 is ready for controlled B2G pilot preparation,
guided demo and technical integration planning.
```

Allowed v77 claim after live test PASS:

```txt
HBCE IPR Runtime API v1 public surface v77 exposes a controlled pilot chain:
API Auth, Tenant/Workspace Scope, Rate Limit/Quota, governed chat execution,
EVT/OPC proof continuity, audit and model usage accounting.
```

Not allowed yet:

```txt
fully production-ready SaaS
unrestricted external API access
legal certification platform
official identity authority
qualified timestamping service
SOC2/ISO-certified service
multi-tenant production platform
```

---

## 8. Recommended next implementation path

After the v77 control-plane alignment, the recommended code path is:

```txt
1. Deploy migrations:
   - hbce_api_credentials
   - hbce_tenants / hbce_workspaces / hbce_accounts / hbce_subscriptions
   - hbce_quota_profiles / hbce_rate_limit_events / hbce_quota_ledger

2. Seed a pilot credential with scripts/create-hbce-api-credential.ts.

3. Run contract-only checks:
   - GET /api/v1
   - GET /api/v1/health
   - GET /api/v1/capabilities
   - GET /api/v1/self-test
   - GET /api/v1/openapi

4. Run protected chat positive test:
   - POST /api/v1/chat with valid key, tenant, workspace.

5. Run fail-closed tests:
   - missing credential
   - invalid credential
   - tenant mismatch
   - workspace mismatch
   - quota exceeded or simulated quota deny

6. Record API v1 public surface regression v77 PASS.
```

First live validation target:

```txt
GET /api/v1/health
```

Second live validation target:

```txt
GET /api/v1/self-test
```

Third live validation target:

```txt
POST /api/v1/chat
```

---

## 9. Pilot gate

Minimum controlled B2G API pilot gate:

```txt
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
```

Minimum v77 public surface PASS:

```txt
HBCE_API_V1_PUBLIC_SURFACE_REGRESSION_V77_READY
endpointMatrix=16/16_PASS
rootDiscovery=PASS
health=PASS
capabilities=PASS
selfTest=PASS
openApi=PASS
chatAuthGate=PASS
tenantScopeGate=PASS
rateLimitQuotaGate=PASS
negativeTests=PASS
contractOnlySafety=PASS
legalCertification=false
```

Minimum production candidate gate:

```txt
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
```

---

## 10. Repository status note

This package is documentation-first with a growing implementation layer.

Current status:

```txt
Runtime validated = YES
API v1 public surface validated = YES
Dashboard product card validated = YES
B2G pilot package documented = YES
API Auth gate implemented = YES
Tenant/workspace scope helper implemented = YES
Rate-limit/quota helper implemented = YES
Migrations produced = YES
Protected chat route produced = YES
Public contract routes aligned = YES
External SaaS control plane fully deployed/tested = PENDING
Production SaaS readiness = NO
Controlled B2G pilot readiness = NEXT TARGET AFTER v77 LIVE PASS
```

---

## 11. Final boundary

All documents in this package inherit the same mandatory boundary:

```txt
legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
IPR Card is an internal operational identity certificate, not an official public identity document.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
