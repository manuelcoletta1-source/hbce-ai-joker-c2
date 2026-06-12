HBCE/JOKER-C2 — SaaS B2G Pilot Offer

Product: HBCE/JOKER-C2 SaaS B2G
Runtime: AI JOKER-C2 SaaS Core v0.1
Foundation: HBCE IPR Runtime API v1
Repository: "hbce-ai-joker-c2"
Document type: SaaS B2G pilot offer
Offer status: "ready for UP-MESE planning"
Baseline date: "2026-06-12"
Target checkpoint: "2026-06-19 UP-MESE"
Boundary: "legalCertification=false"
OPC boundary: technical proof receipt only
Raw text boundary: "rawTextPersistence=false" by default
Auth boundary: "MISSING_API_KEY / FAIL_CLOSED"

---

1. Purpose

This document defines the pilot offer for HBCE/JOKER-C2 SaaS B2G.

The purpose is to convert the current API v1 pilot-ready package and the SaaS B2G product blueprint into a concrete pilot proposal for institutional, regulated, B2B, B2G and strategic evaluation contexts.

This pilot offer does not claim full production maturity.

It defines a controlled evaluation perimeter where HBCE/JOKER-C2 can be tested as a governed AI runtime with identity-bound execution, controlled Source Intelligence, controlled file workflow, EVT event traceability, OPC technical proof receipts, audit review and fail-closed authentication boundaries.

Canonical pilot transition:

API v1 package closure
→ SaaS B2G product blueprint
→ SaaS B2G pilot offer
→ controlled pilot execution
→ pilot closure report
→ production readiness decision

---

2. Current baseline

Current repository baseline:

repo = hbce-ai-joker-c2
branch = main
API v1 package closure = PASS
Source Intelligence package = CLOSED PASS
SaaS B2G Product Blueprint = CREATED + INDEXED + PUSHED
product index = CLEAN
GitHub main = aligned

Current final commits before this file:

1d83be9 Update API v1 product index with package closure release note
d35567c Add SaaS B2G product blueprint
4749a75 Update API v1 product index with SaaS B2G product blueprint

Current confirmed markers:

HBCE_IPR_RUNTIME_API_V1_PACKAGE_CLOSED_PASS
SAAS_B2G_PRODUCT_BLUEPRINT_READY
HBCE_JOKER_C2_SAAS_B2G_PRODUCT_ARCHITECTURE_READY
SOURCE_INTELLIGENCE_PACKAGE_CLOSED_PASS
legalCertification=false
rawTextPersistence=false
MISSING_API_KEY
FAIL_CLOSED

---

3. Pilot offer definition

HBCE/JOKER-C2 SaaS B2G Pilot is a controlled evaluation package for organizations that need to test governed AI execution before adopting or integrating a full SaaS deployment.

The pilot is designed to validate the following question:

Can AI execution be made identity-bound, source-controlled, file-controlled, traceable, technically receipted, auditable and fail-closed inside a controlled B2B/B2G operating perimeter?

Short offer definition:

A controlled pilot for governed AI execution with IPR session, EVT trace, OPC receipt, audit review, Source Intelligence and file workflow boundaries.

The pilot is not a generic chatbot trial.

The pilot is a structured governance evaluation.

---

4. Target pilot users

The pilot is suitable for:

public institutions
EU-facing policy and governance teams
regulated companies
cybersecurity and compliance teams
software integrators
legal-tech and reg-tech operators
innovation labs
incubators
B2B/B2G technical partners
strategic R&D evaluators

The pilot is not intended for:

consumer chatbot use
unrestricted public access
unbounded web scraping
uncontrolled file ingestion
legal certification services
public identity registry custody
automatic raw text persistence
automatic legal evidence generation

---

5. Pilot scope

The pilot scope includes:

HBCE IPR Runtime API v1 access
controlled IPR session validation
authenticated chat runtime validation
Source Intelligence workflow validation
files workflow validation
EVT event trace validation
OPC technical proof receipt validation
audit lookup validation
usage/model-usage visibility validation
fail-closed authentication validation
rate limit / quota policy review
Anti-Abuso API policy review
pilot closure report

The pilot scope does not include:

full production SLA
full legal certification
full public authority role
public identity custody
unrestricted document storage
unrestricted web browsing
unrestricted cyber automation
custom procurement integration by default
full enterprise dashboard by default
full multi-tenant production rollout by default

Canonical boundary:

pilot = controlled evaluation
not production certification
not legal certification
not public authority service

---

6. Pilot duration

Recommended pilot duration:

30 days minimum
60 days recommended
90 days for institutional or regulated evaluation

Pilot phase model:

Phase| Duration| Purpose
Setup| 3-5 days| tenant/workspace preparation, API key setup, operator onboarding
Technical validation| 7-15 days| API v1, chat, files, Source Intelligence, EVT/OPC/audit checks
Operational evaluation| 15-45 days| controlled use cases, review cycles, usage tracking
Closure| 3-5 days| pilot report, gaps, roadmap, production readiness decision

Recommended default:

60-day controlled B2G pilot

---

7. Pilot environment

The pilot should operate in a controlled tenant/workspace model.

Minimum pilot environment:

pilot tenant
pilot workspace
pilot API key
pilot operator account
pilot reviewer account
pilot technical integrator account
pilot usage boundary
pilot source-set boundary
pilot file workflow boundary

Example pilot naming:

CLIENT-TENANT-PILOT-001
CLIENT-WORKSPACE-PILOT-001
CLIENT-WORKSPACE-SOURCE-INTELLIGENCE
CLIENT-WORKSPACE-FILES
CLIENT-WORKSPACE-AUDIT

Self-pilot baseline:

HBCE-TENANT-SELF-PILOT
HBCE-WORKSPACE-RND

SaaS target:

self-pilot → client pilot tenant → controlled SaaS B2G rollout

---

8. Pilot roles

Minimum pilot roles:

Role| Description| Pilot function
HBCE Admin| Internal platform operator| setup, validation, support
Tenant Admin| Client-side coordinator| users, access, pilot scope
Operator| Authorized runtime user| executes controlled tests
Reviewer| Client reviewer| checks EVT, OPC, audit and reports
Technical Integrator| API integrator| validates API and workflow integration
Security Officer| Security/compliance reviewer| validates boundary and risk posture
B2G Evaluator| Institutional evaluator| evaluates suitability for broader adoption

Minimum pilot requirement:

at least one operator and one reviewer must be defined

Reason:

AI runtime without review is just automation with better marketing.

---

9. Included technical modules

Pilot included modules:

API v1 root discovery
API v1 health
API v1 capabilities
API v1 self-test
API v1 OpenAPI descriptor
IPR session creation
authenticated chat runtime
files workflow
Source Intelligence workflow
operations lookup
events lookup
OPC lookup
audit lookup
model usage lookup
rate limit / quota policy review
Anti-Abuso API policy review

Pilot validated route surface:

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

---

10. Pilot use cases

Recommended pilot use cases:

Use case 1 — Authenticated governed chat

Validate that an operator can execute a governed AI request through authenticated API access.

PASS criteria:

valid API key accepted
IPR session active
runtime response generated
EVT generated
OPC generated
audit record available
usage record available

Use case 2 — Fail-closed authentication

Validate that unauthenticated access fails closed.

PASS criteria:

missing API key rejected
HTTP 401 or equivalent auth failure
MISSING_API_KEY
FAIL_CLOSED
no unsafe runtime execution

Use case 3 — Source Intelligence controlled workflow

Validate governed source workflow under controlled source-set boundary.

PASS criteria:

source set selected
source run executed
source metadata available
rawTextPersistence=false
sourceProfileSaveMode=EXPLICIT_OPERATOR_SAVE_ONLY
technical source receipt only

Use case 4 — Files workflow controlled handling

Validate controlled file workflow without uncontrolled raw persistence.

PASS criteria:

file workflow executed
file hash or descriptor available
rawTextPersistence=false
linked runtime operation available
EVT/OPC/audit boundary preserved

Use case 5 — Audit and proof-chain review

Validate that reviewer can reconstruct execution through identifiers.

PASS criteria:

operationId available
eventId available
opcId available
auditId available
usageId available
review path documented

---

11. Pilot quotas

Pilot quotas should be defined before activation.

Recommended default pilot quotas:

Resource| Suggested pilot quota
Pilot duration| 60 days
Tenant count| 1
Workspace count| 1-3
Operator users| 1-5
Reviewer users| 1-3
Technical integrators| 1-2
API keys| 1-3
Authenticated chat calls| capped per pilot agreement
File workflow runs| capped per pilot agreement
Source Intelligence runs| capped per pilot agreement
Audit exports| capped per pilot agreement
Support sessions| scheduled / limited

Quota principle:

no unlimited pilot usage

Reason:

unlimited pilot usage is how products become unpaid production environments, because humans saw a boundary and treated it as a suggestion.

---

12. Pilot deliverables

Minimum pilot deliverables:

pilot setup note
API key and access validation note
IPR session validation note
chat runtime validation note
Source Intelligence validation note
files workflow validation note
EVT/OPC/audit validation note
usage/model-usage validation note
security boundary review
pilot closure report
production readiness recommendation

Optional deliverables:

technical integration memo
source-set evaluation memo
file workflow evaluation memo
risk register
gap analysis
dashboard requirements report
runtime enforcement roadmap update
commercial rollout proposal

---

13. Pilot success criteria

The pilot is successful if the following criteria are met:

authenticated runtime works
missing API key fails closed
IPR session is available
chat runtime produces governed response
Source Intelligence works within controlled boundary
files workflow works within controlled boundary
EVT event trace is generated or available
OPC technical proof receipt is generated or available
audit lookup is available
usage/model-usage visibility is available
rawTextPersistence=false boundary is preserved
legalCertification=false boundary is preserved
technical proof receipt only boundary is preserved

Minimum final pilot verdict:

PILOT_PASS
PILOT_PARTIAL_PASS
PILOT_FAIL

---

14. Pilot failure conditions

The pilot should fail or be suspended if:

unauthenticated runtime execution occurs
missing API key does not fail closed
raw text is persisted outside agreed boundary
source workflow bypasses source-set control
file workflow bypasses agreed retention boundary
EVT/OPC/audit review path is unavailable
operator identity cannot be linked to execution
usage cannot be reconstructed
security boundary is unclear
client requires legal certification by default

Canonical suspension marker:

PILOT_SUSPEND_FAIL_CLOSED

---

15. Commercial framing

The pilot should be framed as a controlled evaluation package.

Recommended commercial language:

HBCE/JOKER-C2 SaaS B2G Pilot validates governed AI runtime execution for institutional and regulated environments through identity-bound access, controlled source/file workflows, EVT/OPC traceability, audit review and fail-closed security boundaries.

The offer should avoid claiming:

legal certification by default
public authority role
full compliance certification
production SLA before contract
unrestricted cyber automation
unrestricted AI autonomy

Correct commercial position:

R&D-to-pilot governed AI runtime

Not:

finished public infrastructure

---

16. Pricing model

Pricing must be defined separately in a commercial proposal.

This document defines the offer structure, not a binding commercial quote.

Possible pilot pricing models:

fixed pilot fee
monthly pilot fee
technical evaluation fee
integration support fee
source intelligence evaluation fee
custom B2G pilot proposal

Pricing variables:

pilot duration
operator count
API key count
request quota
file workflow quota
Source Intelligence quota
support level
integration complexity
reporting requirements
security review depth

Pricing boundary:

no binding price is established by this blueprint

Commercial marker:

pricing = proposal-dependent

---

17. Support model

Pilot support should be defined before activation.

Support modes:

email support
scheduled technical call
asynchronous GitHub/documentation support
pilot review session
closure report session

Support exclusions by default:

24/7 emergency support
production incident response
custom legal certification
custom procurement integration
unlimited development work
client-specific feature development without scope

Support principle:

support must be scoped, logged and connected to pilot deliverables

---

18. Risk and boundary statement

The pilot must preserve the following boundaries:

legalCertification=false
OPC=technical proof receipt only
rawTextPersistence=false by default
automaticIprMemoryWrite=false
sourceProfileSaveMode=EXPLICIT_OPERATOR_SAVE_ONLY
MISSING_API_KEY
FAIL_CLOSED
RATE_LIMIT_EXCEEDED

The pilot must not be represented as:

legal certification service
public authority service
eIDAS trust service by default
forensic evidence service by default
unrestricted autonomous cyber system
uncontrolled source collection system

Correct boundary:

technical governance, traceability and proof-receipt pilot

---

19. Pilot closure report

At the end of the pilot, HBCE/JOKER-C2 should produce a closure report.

Pilot closure report sections:

pilot scope
pilot duration
tenant/workspace used
operators and reviewers
API routes validated
use cases executed
EVT/OPC/audit results
Source Intelligence results
files workflow results
auth/fail-closed results
usage summary
security boundary summary
open gaps
production readiness level
recommended next step

Possible closure verdicts:

PILOT_PASS_READY_FOR_CONTROLLED_EXTENSION
PILOT_PARTIAL_PASS_REQUIRES_HARDENING
PILOT_FAIL_NOT_READY_FOR_EXTENSION

---

20. Roadmap connection

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

This pilot offer depends on:

HBCE IPR Runtime API v1 package
SaaS B2G Product Blueprint
Source Intelligence package closure
API v1 package closure release note
product documentation index

Next document:

docs/product/hbce-joker-c2-saas-b2g-security-compliance-pack.md

---

21. Final markers

SAAS_B2G_PILOT_OFFER_READY
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

Final verdict:

HBCE/JOKER-C2 SaaS B2G pilot offer = READY
