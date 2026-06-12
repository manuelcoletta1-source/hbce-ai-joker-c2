HBCE/JOKER-C2 — SaaS B2G Admin Dashboard Roadmap

Product: HBCE/JOKER-C2 SaaS B2G
Runtime: AI JOKER-C2 SaaS Core v0.1
Foundation: HBCE IPR Runtime API v1
Document type: SaaS B2G admin dashboard roadmap
Dashboard scope: admin, tenant, reviewer, operator, security/compliance
Roadmap status: "ready for UP-MESE planning"
Baseline date: "2026-06-12"
Target checkpoint: "2026-06-19 UP-MESE"
Boundary: "legalCertification=false"
OPC boundary: technical proof receipt only
Raw text boundary: "rawTextPersistence=false" by default
Auth boundary: "MISSING_API_KEY / FAIL_CLOSED"
Security posture: "DEFENSIVE_ONLY_CYBER"
Dashboard posture: operational visibility, not legal certification

---

1. Purpose

This document defines the admin dashboard roadmap for HBCE/JOKER-C2 SaaS B2G.

The purpose is to convert the current pilot-ready API v1 package, SaaS B2G Product Blueprint, Pilot Offer and Security & Compliance Pack into a visible operational console for administrators, reviewers and controlled B2G pilot operators.

The dashboard must show the technical state of the runtime without confusing technical proof receipts with legal certification.

The dashboard must separate:

runtime health
SaaS context
tenant/workspace state
API key lifecycle
IPR session state
Source Intelligence state
files workflow state
EVT/OPC/audit state
usage/model-usage state
rate limit and quota state
security/compliance state
pilot readiness
UP-MESE readiness

The dashboard must not present HBCE/JOKER-C2 as a public authority, legal certifier or unrestricted autonomous cyber system.

Mandatory boundary:

legalCertification=false

---

2. Current baseline

Current repository baseline:

repo = hbce-ai-joker-c2
branch = main
API v1 package closure = PASS
Source Intelligence package = CLOSED PASS
SaaS B2G Product Blueprint = CREATED + INDEXED + PUSHED
SaaS B2G Pilot Offer = CREATED + INDEXED + PUSHED
SaaS B2G Security & Compliance Pack = CREATED + INDEXED + PUSHED
product index = updated
GitHub main = aligned

Confirmed upstream documents:

docs/product/hbce-ipr-runtime-api-v1-package-closure-release-note.md
docs/product/hbce-joker-c2-saas-b2g-product-blueprint.md
docs/product/hbce-joker-c2-saas-b2g-pilot-offer.md
docs/product/hbce-joker-c2-saas-b2g-security-compliance-pack.md
docs/product/hbce-ipr-runtime-api-v1-product-index.md

Confirmed markers:

HBCE_IPR_RUNTIME_API_V1_PACKAGE_CLOSED_PASS
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
SAAS_B2G_PRODUCT_BLUEPRINT_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
SAAS_B2G_PILOT_OFFER_READY
HBCE_JOKER_C2_SAAS_B2G_PILOT_PACKAGE_READY
SAAS_B2G_SECURITY_COMPLIANCE_PACK_READY
HBCE_JOKER_C2_SAAS_B2G_SECURITY_COMPLIANCE_READY
legalCertification=false
rawTextPersistence=false
MISSING_API_KEY
FAIL_CLOSED
DEFENSIVE_ONLY_CYBER
SECURITY_COMPLIANCE_FAIL_CLOSED

---

3. Dashboard roadmap definition

The HBCE/JOKER-C2 SaaS B2G Admin Dashboard is the operational interface for controlled pilot and SaaS administration.

It must allow authorized users to inspect, review and govern the runtime state without exposing secrets, raw sensitive content or uncontrolled memory.

Short definition:

Admin Dashboard = controlled operational visibility layer for tenant, workspace, API, runtime, source, file, proof, audit, usage and security state.

The dashboard is not:

legal certificate generator
public authority console
forensic court evidence console by default
raw text archive
unrestricted memory browser
unrestricted cyber operations panel

Correct boundary:

technical governance dashboard

---

4. Dashboard user roles

The dashboard must support distinct user roles.

Minimum roles:

Role| Purpose
HBCE Admin| Platform owner/operator view
Tenant Admin| Client tenant management view
Workspace Admin| Workspace-level configuration view
Operator| Controlled runtime usage view
Reviewer| EVT/OPC/audit review view
Security Officer| Security, rate-limit, anti-abuse and boundary view
Technical Integrator| API route, key and integration view
B2G Evaluator| Pilot-readiness and closure review view

Role principle:

Different roles must not see the same control surface by default.

Minimum access rule:

least privilege by role

---

5. Dashboard navigation model

Recommended dashboard sections:

Overview
Runtime Health
Tenant & Workspace
API Keys
IPR Sessions
Chat Runtime
Source Intelligence
Files Workflow
Events EVT
OPC Receipts
Audit
Model Usage
Rate Limits & Quotas
Security & Compliance
Pilot Readiness
UP-MESE Readiness
Settings

The dashboard must separate:

technical runtime state
document/package readiness
pilot readiness
production readiness

Reason:

A document can be READY while the active runtime context is WAITING.
A runtime can be healthy while a package is not indexed.
A pilot can be ready while production is not approved.

---

6. Overview panel

The overview panel must show the current SaaS B2G state.

Minimum fields:

productName
runtimeName
runtimeVersion
apiVersion
tenantId
workspaceId
environment
runtimeStatus
saasRuntimeContext
documentationPackageStatus
pilotReadiness
securityComplianceStatus
lastEventId
lastOpcId
lastAuditId
lastUsageId
legalCertification=false
rawTextPersistence=false
DEFENSIVE_ONLY_CYBER

Recommended overview statuses:

SAAS_CORE_HEALTHY
ACTIVE_RESPONSE_READY
WAITING_FOR_ACTIVE_RESPONSE
DOCUMENTATION_PACKAGE_READY
PILOT_READY
SECURITY_COMPLIANCE_READY
UP_MESE_READY
PARTIAL_READY
FAIL_CLOSED

---

7. Runtime health panel

The runtime health panel must show technical service status.

Minimum health fields:

apiRootStatus
healthEndpointStatus
capabilitiesStatus
selfTestStatus
openapiStatus
chatBridgeStatus
databaseStatus
sourceIntelligenceStatus
filesWorkflowStatus
auditStatus
usageStatus
modelRoutingStatus

Health panel must not show:

raw API keys
raw user secrets
raw prompt content by default
raw source text by default
raw uploaded file content by default

PASS condition:

Runtime health can be inspected without exposing sensitive raw content.

---

8. Tenant and workspace panel

The tenant/workspace panel must show operational scope.

Minimum fields:

tenantId
tenantName
tenantStatus
workspaceId
workspaceName
workspaceStatus
environment
createdAt
updatedAt
operatorCount
reviewerCount
apiKeyCount
sourceSetCount
fileWorkflowCount
auditRecordCount
usageRecordCount

Status model:

ACTIVE
WAITING
SUSPENDED
REVOKED
ARCHIVED
FAIL_CLOSED

Boundary rule:

No cross-tenant data leakage.

---

9. API key panel

The API key panel must support secure lifecycle visibility.

Minimum fields:

apiKeyId
tenantId
workspaceId
status
createdAt
rotatedAt
revokedAt
lastUsedAt
rateLimitProfile
quotaProfile
allowedRoutes
failureCount

Allowed lifecycle states:

CREATED
ACTIVE
ROTATED
SUSPENDED
REVOKED
EXPIRED

Never display:

full raw API key
secret token
private credential

Required failure markers:

MISSING_API_KEY
INVALID_API_KEY
REVOKED_API_KEY
RATE_LIMIT_EXCEEDED
FAIL_CLOSED

PASS condition:

The dashboard supports API key governance without exposing raw secrets.

---

10. IPR session panel

The IPR session panel must show authenticated runtime session state.

Minimum fields:

sessionId
tenantId
workspaceId
operatorRef
sessionStatus
createdAt
expiresAt
lastUsedAt
runtimeBinding
identityBindingStatus
failReason

Allowed session statuses:

ACTIVE
EXPIRED
REVOKED
WAITING
FAIL_CLOSED

Boundary:

IPR is an operational identity/proof layer, not legal identity certification by default.

Mandatory marker:

legalCertification=false

---

11. Chat runtime panel

The chat runtime panel must show governed runtime operation state.

Minimum fields:

operationId
tenantId
workspaceId
sessionId
route
status
modelClass
providerState
eventId
opcId
auditId
usageId
failReason
createdAt
completedAt

Allowed statuses:

QUEUED
RUNNING
COMPLETED
FAILED
AUTH_FAILED
RATE_LIMITED
FAIL_CLOSED

Must not show by default:

raw prompt
raw response containing sensitive content
raw secret
raw API key

PASS condition:

Runtime operation can be reviewed through identifiers without uncontrolled raw text exposure.

---

12. Source Intelligence panel

The Source Intelligence panel must show controlled source workflow state.

Minimum fields:

sourceSet
sourceId
sourceStatus
verificationStatus
fetchStatus
sourceHash
receiptId
promptInjectionRisk
rawTextPersistence=false
sourceProfileSaveMode
eventId
opcId
auditId

Required boundaries:

rawTextPersistence=false
sourceProfileSaveMode=EXPLICIT_OPERATOR_SAVE_ONLY
technical source receipt only

Not allowed:

unbounded source scraping
silent source memory creation
automatic raw source persistence

PASS condition:

Source Intelligence is visible, controlled and fail-closed on invalid source-set conditions.

---

13. Files workflow panel

The files workflow panel must show controlled file-processing state.

Minimum fields:

fileId
fileName
fileType
fileSize
fileHash
workflowStatus
operationId
eventId
opcId
auditId
rawTextPersistence=false
createdAt

Not allowed:

uncontrolled raw file display
cross-tenant file reuse
silent memory creation from uploaded files
legal certification from upload alone

PASS condition:

File workflow can be reviewed through metadata, hash and proof references without uncontrolled raw text persistence.

---

14. EVT panel

The EVT panel must show technical event traces.

Minimum fields:

eventId
eventType
tenantId
workspaceId
operationId
status
timestamp
linkedOpcId
linkedAuditId
linkedUsageId
failReason

Correct boundary:

EVT = technical event trace

Not:

legal certification
public authority act
court proof by default

---

15. OPC panel

The OPC panel must show technical proof receipts.

Minimum fields:

opcId
operationId
eventId
tenantId
workspaceId
receiptStatus
chainHash
timestamp
proofMode
legalCertification=false

Correct boundary:

OPC = technical proof receipt only

The dashboard must never label OPC as legal certification by default.

---

16. Audit panel

The audit panel must support reconstruction.

Minimum fields:

auditId
operationId
eventId
opcId
usageId
tenantId
workspaceId
route
status
timestamp
reviewStatus
failReason

Audit views:

operation audit
auth audit
source audit
file audit
usage audit
security audit
pilot closure audit

PASS condition:

Reviewer can reconstruct the technical execution path from dashboard identifiers.

---

17. Model usage panel

The model usage panel must expose controlled usage information.

Minimum fields:

usageId
operationId
tenantId
workspaceId
model
modelClass
provider
status
inputTokenEstimate
outputTokenEstimate
costEstimateWhereAvailable
createdAt

Must not expose:

raw API key
provider secret
uncontrolled raw content

Purpose:

cost visibility
quota review
usage review
pilot reporting

---

18. Rate limit and quota panel

The rate limit panel must show usage caps and violations.

Minimum fields:

tenantId
workspaceId
apiKeyId
quotaProfile
requestsUsed
requestsRemaining
sourceRunsUsed
fileRunsUsed
auditExportsUsed
resetAt
lastRateLimitEvent

Required marker:

RATE_LIMIT_EXCEEDED

Boundary:

No unlimited pilot usage.

---

19. Security and compliance panel

The security/compliance panel must show current boundary state.

Minimum fields:

legalCertification=false
rawTextPersistence=false
DEFENSIVE_ONLY_CYBER
MISSING_API_KEY policy
FAIL_CLOSED policy
SECURITY_COMPLIANCE_FAIL_CLOSED policy
sourceProfileSaveMode
antiAbuseStatus
rateLimitStatus
auditStatus

Panel verdicts:

SECURITY_COMPLIANCE_READY
SECURITY_COMPLIANCE_PARTIAL
SECURITY_COMPLIANCE_FAIL_CLOSED

This panel must link to:

docs/product/hbce-joker-c2-saas-b2g-security-compliance-pack.md

---

20. Pilot readiness panel

The pilot readiness panel must show whether the pilot package is ready.

Minimum checklist:

product blueprint indexed
pilot offer indexed
security compliance pack indexed
API v1 package closure indexed
Source Intelligence package closed
auth fail-closed verified
rawTextPersistence=false verified
EVT/OPC/audit visible
usage visible
rate limit policy visible

Pilot readiness statuses:

PILOT_READY
PILOT_PARTIAL_READY
PILOT_BLOCKED
PILOT_FAIL_CLOSED

---

21. UP-MESE readiness panel

The UP-MESE readiness panel must track the roadmap to 2026-06-19.

Roadmap checklist:

2026-06-12 API v1 package closure
2026-06-13 SaaS B2G product blueprint
2026-06-14 SaaS B2G pilot offer
2026-06-15 security/compliance pack
2026-06-16 admin dashboard roadmap
2026-06-17 runtime enforcement roadmap
2026-06-18 UP-MESE package
2026-06-19 UP-MESE checkpoint

UP-MESE states:

UP_MESE_WAITING
UP_MESE_PARTIAL_READY
UP_MESE_READY
UP_MESE_BLOCKED

---

22. Dashboard implementation phases

Recommended implementation phases:

Phase 1 — Read-only admin visibility

overview panel
runtime health
tenant/workspace
API key metadata
IPR session metadata
chat operation metadata
EVT/OPC/audit lookup
usage lookup

Phase 2 — Pilot governance dashboard

Source Intelligence panel
files workflow panel
rate limit panel
security/compliance panel
pilot readiness panel
UP-MESE readiness panel

Phase 3 — Controlled admin actions

create workspace
rotate API key
revoke API key
suspend tenant
export audit summary
close pilot report

Phase 4 — Production hardening

role-based access control
multi-tenant isolation review
dashboard audit trail
alerting
admin action receipts
security review exports

---

23. Dashboard failure conditions

The dashboard fails if:

raw API keys are exposed
raw sensitive content is exposed by default
tenant boundaries are mixed
OPC is labeled as legal certification
EVT is labeled as public authority proof
Source Intelligence bypasses source-set control
files workflow exposes raw text by default
audit reconstruction is impossible
rate limits are invisible
security boundary is missing
fail-closed state is hidden

Canonical failure marker:

ADMIN_DASHBOARD_FAIL_CLOSED

---

24. Roadmap connection

This file is part of the UP-MESE SaaS B2G roadmap.

Roadmap position:

2026-06-12 API v1 package closure
2026-06-13 SaaS B2G product blueprint
2026-06-14 SaaS B2G pilot offer
2026-06-15 security/compliance pack
2026-06-16 admin dashboard roadmap
2026-06-17 runtime enforcement roadmap
2026-06-18 UP-MESE package
2026-06-19 UP-MESE checkpoint

This dashboard roadmap depends on:

HBCE IPR Runtime API v1 package
SaaS B2G Product Blueprint
SaaS B2G Pilot Offer
SaaS B2G Security & Compliance Pack
Source Intelligence package closure
API v1 package closure release note
product documentation index

Next document:

docs/product/hbce-joker-c2-saas-b2g-runtime-enforcement-roadmap.md

---

25. Final markers

SAAS_B2G_ADMIN_DASHBOARD_ROADMAP_READY
HBCE_JOKER_C2_SAAS_B2G_ADMIN_DASHBOARD_READY
HBCE_JOKER_C2_SAAS_B2G_SECURITY_COMPLIANCE_READY
HBCE_JOKER_C2_SAAS_B2G_PILOT_PACKAGE_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
HBCE_IPR_RUNTIME_API_V1_FOUNDATION_CONFIRMED
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
legalCertification=false
rawTextPersistence=false
technical proof receipt only
MISSING_API_KEY
FAIL_CLOSED
DEFENSIVE_ONLY_CYBER
ADMIN_DASHBOARD_FAIL_CLOSED

Final verdict:

HBCE/JOKER-C2 SaaS B2G admin dashboard roadmap = READY
