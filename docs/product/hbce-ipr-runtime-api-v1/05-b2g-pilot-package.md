HBCE IPR Runtime API v1

B2G Pilot Package

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Target: B2G / public-sector innovation / regulated enterprise / cyber-governance pilot
Product layer: HBCE IPR Operational Identity & Proof Layer
Boundary: "legalCertification=false"

---

1. Pilot purpose

The HBCE IPR Runtime API v1 B2G Pilot is designed to validate a governed AI runtime in environments where AI output must be connected to operational identity, technical event tracing, proof receipts, audit records and model usage accounting.

This pilot does not test a generic chatbot.

It tests an operational AI governance layer.

The pilot demonstrates the following execution chain:

IPR → JOKER-C2 → POLICY → AI RESPONSE → EVT → OPC → AUDIT → MODEL USAGE → DASHBOARD

Where:

IPR = operational identity / proof layer
JOKER-C2 = governed AI runtime
POLICY = runtime decision layer
EVT = technical event trace
OPC = technical proof receipt
AUDIT = runtime decision reconstruction
MODEL USAGE = model/accounting metadata
DASHBOARD = operational visibility layer

The goal is to show whether a B2G or regulated organization can operate AI requests under a controlled technical governance frame.

---

2. Pilot positioning

HBCE IPR Runtime API v1 is positioned as:

An Operational Identity & Proof Layer for governed AI execution.

It is not positioned as:

a public identity system
a legal certification authority
a qualified timestamp authority
a public notarization service
a replacement for legal review
a replacement for human oversight

The product provides runtime evidence, not legal certification.

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.

---

3. Pilot target users

The pilot is suitable for organizations that need to evaluate controlled AI execution in contexts such as:

public-sector innovation
B2G AI governance
cybersecurity operations
AI risk monitoring
regulated workflow automation
internal audit support
institutional document analysis
source-bound intelligence workflows
model usage accountability
technical proof continuity

Primary stakeholder profiles:

public-sector digital transformation units
cybersecurity teams
compliance and audit teams
AI governance officers
legal/compliance advisors
regulated enterprise innovation teams
software integrators
B2G technology partners
R&D labs

---

4. What the pilot tests

The pilot tests whether HBCE/JOKER-C2 can provide a controlled runtime frame for AI execution.

The pilot verifies:

IPR-bound session handling
runtime identity frame
policy decision output
MATRIX runtime state
database-persistent memory
EVT generation
OPC proof receipt generation
audit persistence
model usage persistence
Source Intelligence descriptor availability
API v1 public surface stability
dashboard visibility
legal boundary exposure

The pilot does not require production-scale deployment.

It validates whether the product architecture is suitable for a controlled B2G or regulated enterprise trial.

---

5. Current validated baseline

The current validated baseline is:

JOKER-C2 SaaS Core v0.1 = HEALTHY
Runtime = ACTIVE_RESPONSE_READY
IPR = ACCESS_GRANTED
Certificate status = ACTIVE
Scope = JOKER_C2_ACCESS
Identity binding = IPR_VERIFIED_BIOLOGICAL_SUBJECT
MATRIX = MATRIX_ACTIVE
Memory = IPR_BOUND
Memory persistence = DATABASE_PERSISTENT
EVT = PERSISTED
OPC = PERSISTED
Audit = PERSISTED
Model usage = PERSISTED
Source Intelligence = SOURCESET_REGISTRY_READY
SourceSets = 5/5
Source Intelligence endpoints = 7/7 PASS
API v1 public surface = 16/16 PASS
Dashboard card = PASS
Document registry = AVAILABLE
Document profiles = 20
Linked document memory = 16
legalCertification=false

Reference runtime chain:

Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7

These identifiers are technical proof references from the R&D/self-pilot environment.

---

6. Public API surface used in the pilot

The pilot uses the HBCE IPR Runtime API v1 public surface.

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

Gateway/public notation:

/v1

Current runtime route notation:

/api/v1

Example:

Product gateway: POST /v1/chat
Runtime route:   POST /api/v1/chat

---

7. Pilot workflow

The standard pilot workflow is:

1. Create or verify IPR session.
2. Send governed AI request through /v1/chat.
3. Runtime applies policy/security evaluation.
4. JOKER-C2 generates AI response.
5. Runtime produces EVT technical trace.
6. Runtime produces OPC technical proof receipt.
7. Runtime persists audit record.
8. Runtime persists model usage record.
9. Dashboard displays runtime state.
10. Client reviews technical evidence package.

The core pilot question is:

Can an AI interaction be technically identified, traced, audited and reviewed inside a governed runtime?

---

8. Pilot demonstration flow

A standard B2G demo should show:

API health
capabilities
IPR session
governed chat request
EVT creation
OPC proof receipt
audit lookup
model usage lookup
dashboard state
Source Intelligence descriptor
legal boundary

Expected visible outputs:

ACCESS_GRANTED
MATRIX_ACTIVE
IPR_BOUND
DATABASE_PERSISTENT
EVT-...
OPC-...
AUDIT-...
USAGE-...
ACTIVE_RESPONSE_READY
B2G active response readiness = READY
legalCertification=false

---

9. Source Intelligence pilot scope

Source Intelligence is included as a governed B2G source-bound intelligence layer.

Current sourceSets:

ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK
EU_AI_GOVERNANCE_REGULATORY_STACK
ENISA_CYBER_THREAT_LANDSCAPE
ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK
OPENAI_AGENTIC_SYSTEMS_SECURITY

Current status:

SOURCESET_REGISTRY_READY
SourceSets active = 5/5
Catalog sources = 19
Endpoint chain = 7/7 PASS
PDF boundary = PDF_BINARY_HASH_ONLY
Raw text persistence = false
Memory profile policy = EXPLICIT_OPERATOR_SAVE_ONLY

Source Intelligence pilot boundaries:

server-side controlled source handling
allowlisted sourceSets
source profile persistence only on explicit operator action
no raw text persistence by default
PDF binary hash-only unless explicit extraction is implemented
technical source receipt only
legalCertification=false

---

10. Document registry pilot scope

The runtime includes a cybernetic document registry and recall-ready document profile layer.

Current validated state:

Document registry = AVAILABLE
Document profiles = 20
Linked document memory = 16
Reusable profiles = 20

The pilot may demonstrate document profile visibility, but document recall should be tested only when explicitly requested.

Document recall boundary:

Document recall must be explicit.
No document recall should execute during contract-only API tests.
No file ingestion should execute during contract-only API tests.
Document profile existence does not imply legal certification.

---

11. Pilot deliverables

The pilot should deliver the following outputs:

1. Pilot kickoff note
2. API v1 technical contract sheet
3. IPR AI Audit Trail demo
4. Dashboard screenshot / runtime proof
5. EVT / OPC / audit / usage sample chain
6. Source Intelligence descriptor report
7. Security and boundary note
8. Final pilot assessment

Recommended repository documentation set:

docs/product/hbce-ipr-runtime-api-v1/README.md
docs/product/hbce-ipr-runtime-api-v1/01-one-page-product-brief.md
docs/product/hbce-ipr-runtime-api-v1/02-technical-api-contract-sheet.md
docs/product/hbce-ipr-runtime-api-v1/03-ipr-ai-audit-trail-demo-script.md
docs/product/hbce-ipr-runtime-api-v1/04-api-v1-public-surface-regression-v76.md
docs/product/hbce-ipr-runtime-api-v1/05-b2g-pilot-package.md

---

12. Pilot phases

Phase 1 — Technical discovery

Goal:

Confirm that the client understands the runtime boundary and pilot scope.

Activities:

product walkthrough
API surface review
security boundary review
Source Intelligence explanation
dashboard demonstration

Output:

pilot scope confirmation

---

Phase 2 — Controlled runtime demo

Goal:

Demonstrate a complete governed AI request.

Activities:

create IPR session
send governed AI request
generate EVT/OPC
persist audit
persist model usage
show dashboard

Output:

technical proof chain sample

---

Phase 3 — Evidence review

Goal:

Verify whether the generated runtime evidence is useful for client governance.

Activities:

review EVT
review OPC
review audit
review model usage
review dashboard state
review legal boundary

Output:

pilot evidence review note

---

Phase 4 — Integration assessment

Goal:

Assess whether the client can integrate the API into its environment.

Activities:

API endpoint review
authentication/access model discussion
tenant/workspace mapping
data handling review
SDK requirement analysis
rate-limit requirement analysis
audit export requirement analysis

Output:

integration gap list

---

Phase 5 — Pilot closure

Goal:

Decide whether to proceed to SaaS integration or extended R&D pilot.

Activities:

final technical summary
risk/boundary confirmation
integration effort estimate
commercial/pilot scope discussion

Output:

B2G pilot readiness report

---

13. Success criteria

The pilot is successful if the runtime can demonstrate:

IPR-bound request handling
MATRIX_ACTIVE state
database-persistent memory
EVT generation
OPC generation
audit persistence
model usage persistence
dashboard visibility
API v1 public surface stability
Source Intelligence registry visibility
explicit legal boundary

Minimum PASS criteria:

IPR access = ACCESS_GRANTED
Memory = IPR_BOUND
Database persistence = ACTIVE
EVT = PERSISTED
OPC = PERSISTED
Audit = PERSISTED
Usage = PERSISTED
API v1 = 16/16 PASS
Source Intelligence = READY
Dashboard = ACTIVE_RESPONSE_READY
legalCertification=false

---

14. Non-goals

The pilot does not aim to provide:

legal certification
qualified electronic timestamping
official public identity issuance
public authority validation
production security accreditation
full SOC2/ISO certification
unlimited model execution
uncontrolled document ingestion
uncontrolled memory persistence
autonomous high-risk decision-making

The pilot is a controlled technical validation.

---

15. Data and memory policy

Default data posture:

GDPR-min
UE-first
hash-first
audit-ready
rawTextPersistence=false by default
explicit operator save only
no automatic IPR memory for contract-only tests
no automatic Source Intelligence profile save
no document recall unless requested

Memory policy:

Runtime memory may persist technical continuity.
Semantic memory must be governed.
Reusable memory requires explicit policy conditions.
Manual Save Chat → IPR must remain operator-controlled.

Contract-only safety requirements:

semanticMemoryCreated=false
runtimeMemoryWriteSuppressed=true
sourceLiveFetch=false
documentIngestion=false
documentRecall=false

---

16. Security posture

The pilot should be presented under the following posture:

defensive / governance use
audit-ready execution
technical proof continuity
operator-controlled save
server-side source allowlisting
fail-closed on unknown sourceSet
no raw source persistence by default
no public identity claim
no legal certification claim

Operational policy language:

The runtime provides controlled AI execution with technical traceability and audit visibility.
The runtime does not replace human, legal or institutional review.

---

17. Required client-side inputs

For a client or partner pilot, the minimum inputs are:

pilot contact owner
technical contact
pilot use case
risk domain
expected AI interaction type
data sensitivity level
integration preference: dashboard / API / both
desired output report format

Optional inputs:

sourceSet domain preference
document profile test corpus
internal audit requirements
tenant/workspace naming
API key/gateway requirement
SDK language preference

---

18. Pilot output package

At the end of the pilot, the client should receive:

pilot summary
runtime screenshot
API endpoint list
sample EVT reference
sample OPC reference
sample audit reference
sample usage reference
Source Intelligence scope note
data boundary note
legalCertification=false note
integration recommendations
next-step proposal

---

19. Commercial pilot frame

Commercial terms should be defined outside this technical document.

Recommended commercial pilot models:

fixed-scope technical pilot
monthly R&D pilot
B2G innovation assessment
cyber/AI governance workshop + runtime demo
API integration proof-of-concept

The pilot should not be sold as final certified infrastructure.

It should be sold as:

B2G governed AI runtime pilot

or:

AI Operational Identity & Proof Layer pilot

---

20. Next required product increments

After this pilot package, the next SaaS B2G increments are:

API key / client token model
tenant onboarding flow
rate limiting
webhook event delivery
SDK TypeScript minimum client
OpenAPI downloadable contract
pilot report template
security boundary pack
admin/operator console
audit export
usage billing model

Recommended next documentation files:

06-b2g-demo-flow.md
07-security-boundary-pack.md
08-client-integration-roadmap.md
09-commercial-pilot-offer.md

---

21. Final pilot statement

HBCE IPR Runtime API v1 enables a controlled B2G pilot for governed AI execution.

The pilot demonstrates that an AI interaction can be connected to:

operational identity,
runtime policy,
technical event trace,
technical proof receipt,
audit reconstruction,
model usage accounting,
dashboard visibility,
Source Intelligence descriptors,
and explicit legal boundary.

The value is not the answer alone.

The value is the governed chain around the answer.

Mandatory closing boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
