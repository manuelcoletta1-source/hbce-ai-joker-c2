HBCE/JOKER-C2 — SaaS B2G Product Blueprint

Product: HBCE/JOKER-C2 SaaS B2G
Runtime: AI JOKER-C2 SaaS Core v0.1
Foundation: HBCE IPR Runtime API v1
Repository: "hbce-ai-joker-c2"
Document type: SaaS B2G product blueprint
Blueprint status: "ready for UP-MESE planning"
Baseline date: "2026-06-12"
Target checkpoint: "2026-06-19 UP-MESE"
Boundary: "legalCertification=false"
OPC boundary: technical proof receipt only
Raw text boundary: "rawTextPersistence=false" by default
Auth boundary: "MISSING_API_KEY / FAIL_CLOSED"

---

1. Purpose

This document defines the product blueprint for HBCE/JOKER-C2 as a controlled SaaS B2G product.

It starts from the current API v1 package closure and maps the transition from a pilot-ready governed runtime API to a structured SaaS product for institutional, governmental, regulated and security-sensitive environments.

The purpose is not to claim that the SaaS product is already complete.

The purpose is to define:

what exists now
what the product is becoming
which modules are required
which B2G problems it solves
which boundaries remain active
which components are missing
which roadmap leads from API v1 pilot-ready to SaaS B2G product-ready

Canonical transition:

HBCE IPR Runtime API v1 pilot package
→ HBCE/JOKER-C2 SaaS B2G product architecture
→ controlled B2B/B2G pilot deployment
→ production-ready governed AI runtime

---

2. Current baseline

Current repository baseline:

repo = hbce-ai-joker-c2
branch = main
API v1 package closure = PASS
Source Intelligence package = CLOSED PASS
product index = CLEAN
package closure release note = CREATED + INDEXED
GitHub main = aligned

Current final commits:

f14ec13 Add API v1 package closure release note
1d83be9 Update API v1 product index with package closure release note

Current API v1 status:

HBCE IPR Runtime API v1 = pilot-ready
product documentation = indexed
Source Intelligence = closed pass
Files workflow = documented
Anti-Abuso API = documented
security checklist = documented
rate limit / quota policy = documented
package closure release note = ready

Current operational baseline:

API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
HBCE_IPR_RUNTIME_API_V1_PACKAGE_CLOSED_PASS
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PRODUCT_DOCUMENTATION_INDEXED
VERCEL_PRODUCTION_VERIFIED
AUTH_FAIL_CLOSED_VERIFIED
MISSING_API_KEY
FAIL_CLOSED
legalCertification=false
rawTextPersistence=false
technical proof receipt only

---

3. Product definition

HBCE/JOKER-C2 SaaS B2G is a governed AI runtime platform designed for controlled institutional and regulated environments.

It provides a SaaS layer where AI execution is not treated as an isolated answer, but as a governed operational event connected to identity, context, traceability, proof receipt, audit and policy boundaries.

Core product definition:

HBCE/JOKER-C2 SaaS B2G turns AI execution into an identity-bound, governed, traceable and technically receipted runtime event.

Short definition:

AI governata, tracciata, confinata e auditabile.

The product is built around the following chain:

tenant
→ workspace
→ API key / operator access
→ IPR session
→ JOKER-C2 runtime execution
→ source/file boundary
→ EVT event trace
→ OPC technical proof receipt
→ audit / usage / review

---

4. B2G problem solved

Public institutions, regulated operators and strategic organizations cannot safely use AI systems as uncontrolled black-box answer engines.

They need to know:

who used the system
under which operational identity
with which source or file context
under which access policy
with which output
at what time
with which cost
with which audit trail
with which proof receipt
with which persistence boundary

HBCE/JOKER-C2 addresses this by replacing uncontrolled AI execution with governed runtime execution.

B2G problem:

AI systems produce outputs faster than institutions can govern, audit, attribute, control and prove them.

HBCE/JOKER-C2 answer:

Every significant AI execution must be bound to identity, policy, event, proof receipt, audit and boundary.

Operational doctrine:

Decisione · Costo · Traccia · Tempo

---

5. Current API v1 foundation

HBCE/JOKER-C2 SaaS B2G is built on the current HBCE IPR Runtime API v1 package.

Current documented route surface:

GET  /api/v1
GET  /api/v1/health
GET  /api/v1/capabilities
GET  /api/v1/self-test
GET  /api/v1/openapi
POST /api/v1/ipr/session
POST /api/v1/chat
POST /api/v1/files
GET  /api/v1/source-intelligence
POST /api/v1/source-intelligence
GET  /api/v1/operations/{operationId}
GET  /api/v1/events?eventId={eventId}
GET  /api/v1/opc/{opcId}
GET  /api/v1/audit/{auditId}
GET  /api/v1/model-usage/{usageId}

Validated API v1 pillars:

IPR session
authenticated chat
fail-closed no-key boundary
EVT event trace
OPC technical proof receipt
audit lookup
files workflow
Source Intelligence workflow
rate limit / quota documentation
Anti-Abuso API documentation
product documentation index
package closure release note

Current status:

API v1 = pilot-ready foundation
SaaS B2G = product architecture in progress

---

6. Core SaaS B2G modules

The SaaS B2G product requires the following modules.

Module| Function| Current status
API v1 Runtime| Governed runtime route surface| pilot-ready
IPR Session| Operational identity/session binding| active foundation
JOKER-C2 Chat Runtime| Governed AI execution| active foundation
EVT Trace| Runtime event recording| active foundation
OPC Receipt| Technical proof receipt| active foundation
Audit Lookup| Reviewable execution trace| active foundation
Files Workflow| Controlled file handling| documented
Source Intelligence| Controlled source-set workflow| closed pass
Anti-Abuso API| Abuse and quota control layer| documented
Tenant Management| Client isolation and governance| missing / roadmap
API Key Lifecycle| Issue, rotate, revoke, scope keys| missing / roadmap
Admin Dashboard| B2G operator control surface| missing / roadmap
Usage Metering| Runtime cost and usage trace| partial / roadmap
Export Reports| EVT/OPC/audit package export| missing / roadmap
Compliance Pack| Institutional review documentation| next document
Pilot Offer| Commercial pilot package| next document

---

7. User roles

The SaaS B2G product must support clear operational roles.

Role| Description| Required capabilities
HBCE Admin| Internal platform administrator| tenant creation, system control, audit review
Tenant Admin| Client-side administrator| users, API keys, quotas, workspace settings
Operator| Authorized runtime user| create sessions, run chat, upload files, use source intelligence
Reviewer| Audit/security/legal reviewer| inspect EVT, OPC, audit, reports
Technical Integrator| Partner developer| use API keys, integrate endpoints, validate flows
Security Officer| Risk and compliance evaluator| review boundaries, logs, rate limits, source/file controls
B2G Evaluator| Institutional pilot reviewer| evaluate governance, proof chain, security posture

Minimum role model for pilot:

HBCE Admin
Tenant Admin
Operator
Reviewer
Technical Integrator

---

8. Tenant and workspace model

The SaaS B2G product must move beyond self-pilot scope.

Current baseline:

HBCE-TENANT-SELF-PILOT
HBCE-WORKSPACE-RND

Target SaaS model:

CLIENT-TENANT-001
CLIENT-WORKSPACE-001
CLIENT-WORKSPACE-SECURITY
CLIENT-WORKSPACE-SOURCE-INTELLIGENCE
CLIENT-WORKSPACE-FILES

Tenant responsibilities:

client boundary
API key scope
quota scope
audit scope
file/source visibility
operator control
billing/usage control
reporting boundary

Workspace responsibilities:

project separation
runtime context separation
source set authorization
file workflow authorization
EVT/OPC grouping
audit review grouping

Minimum SaaS requirement:

tenant isolation must become enforceable, visible and auditable.

---

9. API key lifecycle

API key handling is currently validated at fail-closed boundary level.

Current validated behavior:

POST /api/v1/chat without key = HTTP 401
MISSING_API_KEY
FAIL_CLOSED

Target SaaS API key lifecycle:

create API key
assign API key to tenant
assign API key to workspace
define scopes
define quota
define expiration
rotate key
revoke key
log key usage
alert abnormal usage
block abuse

Required key scopes:

chat:write
files:write
source-intelligence:read
source-intelligence:write
events:read
opc:read
audit:read
usage:read
admin:tenant
admin:keys

Minimum SaaS requirement:

API keys must be governed assets, not static secrets thrown into the void like offerings to the infrastructure gods.

---

10. Source Intelligence module

Source Intelligence is one of the strongest B2G differentiators.

Current status:

Source Intelligence package = CLOSED PASS
source sets = registered
catalog sources = registered
rawTextPersistence=false
sourceProfileSaveMode=EXPLICIT_OPERATOR_SAVE_ONLY
technical source receipt only

Source Intelligence is not:

unrestricted browsing
unrestricted scraping
unbounded source ingestion
automatic raw text persistence
automatic IPR profile persistence

SaaS B2G target features:

source set catalog view
source set authorization by tenant
source run history
source hash visibility
summary hash visibility
prompt-injection risk status
technical source receipt
operator-triggered source profile save
source report export

B2G value:

controlled intelligence from governed sources, not uncontrolled web automation.

---

11. Files workflow module

The files workflow enables controlled file interaction within the governed runtime.

Current status:

files workflow = documented
POST /api/v1/files = available as controlled API v1 surface
rawTextPersistence=false
file hash boundary
technical proof receipt only

SaaS B2G target features:

file upload descriptor
file hash
file classification
file risk status
prompt-injection screening
linked chat execution
linked EVT
linked OPC
linked audit
file run history
file report export
retention policy
delete/archive policy

The file workflow must not become:

unrestricted document memory
public document registry
unbounded raw text persistence
legal evidence platform by default

Correct framing:

controlled file handling for governed AI runtime evaluation.

---

12. EVT / OPC / audit proof chain

The core proof chain is:

IPR → EVT → OPC → audit

Operational meaning:

IPR identifies the operational subject and intention boundary.
EVT records the runtime event in time.
OPC produces the technical proof receipt.
Audit preserves reviewability.

SaaS B2G target:

every relevant runtime execution must be reconstructable through event, proof receipt and audit lookup.

Target dashboard view:

execution ID
tenant
workspace
operator
IPR session
input class
source/file context
model/runtime
EVT ID
OPC ID
audit ID
usage ID
timestamp
policy decision
boundary state

Non-claim:

OPC is not legal certification by default.

Canonical boundary:

legalCertification=false
OPC=technical proof receipt only

---

13. Admin dashboard requirements

A real SaaS B2G product requires an admin dashboard.

Minimum dashboard modules:

tenant overview
workspace overview
API key management
operator list
runtime sessions
chat executions
files workflow history
Source Intelligence run history
EVT registry
OPC registry
audit registry
usage/cost dashboard
quota/rate limit dashboard
security boundary dashboard
export reports

Dashboard must answer:

who did what
when
under which tenant
with which source/file
with which runtime output
with which event
with which proof receipt
with which audit trail
with which cost
with which boundary

Without dashboard, the product remains API-first and pilot-valid, but not yet fully SaaS-operable.

---

14. Security and compliance boundaries

Canonical boundaries:

legalCertification=false
OPC=technical proof receipt only
rawTextPersistence=false by default
automaticIprMemoryWrite=false
sourceProfileSaveMode=EXPLICIT_OPERATOR_SAVE_ONLY
MISSING_API_KEY
FAIL_CLOSED
RATE_LIMIT_EXCEEDED

Required SaaS compliance pack topics:

GDPR-min posture
data minimization
raw text policy
file retention
source retention
audit retention
tenant isolation
API key governance
operator access control
incident response
backup/restore
export policy
non-legal-certification statement
technical proof receipt boundary

Security principle:

fail closed before unsafe execution.

---

15. Runtime enforcement roadmap

The current API v1 package documents multiple controls.

The SaaS B2G product must enforce them operationally.

Required enforcement roadmap:

tenant enforcement
workspace enforcement
API key lifecycle
API key scopes
rate limit enforcement
quota enforcement
usage metering
source set authorization
file size/type limits
prompt-injection risk screening
audit immutability / append-only posture
export report generation
operator activity logs
admin alerting

Priority order:

1. Tenant/workspace enforcement
2. API key lifecycle
3. Quota/rate limit enforcement
4. Usage metering
5. Dashboard visibility
6. Export reports
7. Security/compliance review

---

16. Pilot package

The SaaS B2G pilot package must be concrete.

Pilot package should define:

pilot duration
pilot tenant
pilot workspace
operator count
reviewer count
API key count
monthly request quota
file workflow quota
Source Intelligence quota
included reports
support level
out-of-scope claims
success criteria
upgrade path

Minimum pilot deliverables:

tenant setup
API key setup
quickstart validation
Source Intelligence validation
files workflow validation
EVT/OPC/audit validation
usage report
security boundary review
pilot closure report

Pilot success criteria:

authenticated runtime works
no-key access fails closed
source intelligence operates within source-set boundary
files workflow operates within rawTextPersistence=false boundary
EVT/OPC/audit lookup works
usage and quota are reviewable

---

17. Product maturity levels

Current level:

LEVEL 1 — API v1 pilot package ready

Target by 2026-06-19:

LEVEL 2 — SaaS B2G product architecture ready

Next level after UP-MESE:

LEVEL 3 — SaaS B2G pilot offer and dashboard roadmap ready

Production target:

LEVEL 4 — SaaS B2G controlled pilot executable

Not yet achieved:

LEVEL 5 — SaaS B2G production-ready with SLA, full tenant lifecycle, full dashboard and formal security review

---

18. Missing components

Missing for full SaaS B2G product:

multi-tenant admin layer
workspace management UI
API key lifecycle UI/API
role-based access control
quota enforcement connected to tenant/key
usage metering dashboard
Source Intelligence run history
files workflow run history
EVT/OPC/audit export
security/compliance pack
pilot offer package
contractual onboarding flow
monitoring/alerting
incident response flow
backup/restore policy

These are not defects in the API v1 closure.

They are the next product layer.

---

19. Roadmap to UP-MESE 2026-06-19

Operational roadmap:

Date| Work package| Output| PASS marker
2026-06-12| API v1 package closure| release note + index| "HBCE_IPR_RUNTIME_API_V1_PACKAGE_CLOSED_PASS"
2026-06-13| SaaS B2G product blueprint| this file| "SAAS_B2G_PRODUCT_BLUEPRINT_READY"
2026-06-14| SaaS B2G pilot offer| pilot offer document| "SAAS_B2G_PILOT_OFFER_READY"
2026-06-15| Security/compliance pack| security compliance document| "SAAS_B2G_SECURITY_COMPLIANCE_PACK_READY"
2026-06-16| Admin dashboard roadmap| dashboard roadmap document| "SAAS_B2G_ADMIN_DASHBOARD_ROADMAP_READY"
2026-06-17| Runtime enforcement roadmap| enforcement roadmap document| "SAAS_B2G_RUNTIME_ENFORCEMENT_ROADMAP_READY"
2026-06-18| UP-MESE package| checkpoint package| "SAAS_B2G_UPMESE_PACKAGE_READY"
2026-06-19| UP-MESE checkpoint| canonical checkpoint| "UP_MESE_CHECKPOINT_READY"

---

20. Final positioning

HBCE/JOKER-C2 SaaS B2G should not be positioned as another chatbot, assistant or generic automation platform.

Correct positioning:

governed AI runtime for controlled B2B/B2G execution

Expanded positioning:

HBCE/JOKER-C2 SaaS B2G provides a governed runtime layer for identity-bound AI execution, controlled Source Intelligence, controlled file workflow, EVT event traceability, OPC technical proof receipts, audit-oriented review, fail-closed authentication and Anti-Abuso API controls.

Strategic formula:

JOKER-C2 does not replicate cyber models.
It governs their operational use through identity, perimeter, event, proof and responsibility.

Final product sentence:

HBCE/JOKER-C2 transforms AI execution from an unbounded answer into a governed operational event.

---

21. Final markers

SAAS_B2G_PRODUCT_BLUEPRINT_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
HBCE_IPR_RUNTIME_API_V1_FOUNDATION_CONFIRMED
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
API_V1_PACKAGE_CLOSURE_RELEASE_NOTE_READY
legalCertification=false
rawTextPersistence=false
technical proof receipt only
MISSING_API_KEY
FAIL_CLOSED

Final verdict:

HBCE/JOKER-C2 SaaS B2G product blueprint = READY
