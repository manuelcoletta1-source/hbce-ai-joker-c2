HBCE IPR Runtime API v1

Commercial Pilot Offer

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Offer type: B2G / regulated enterprise / technical pilot
Commercial status: Pilot proposal template
Boundary: "legalCertification=false"

---

1. Offer purpose

This document defines the commercial pilot offer for HBCE IPR Runtime API v1.

The offer is designed for public-sector, B2G, regulated enterprise, cyber-governance and institutional innovation contexts where an organization wants to evaluate governed AI execution before integration or procurement.

The offer does not sell a generic chatbot.

It offers a controlled pilot of an AI runtime that connects AI interactions to:

operational identity
runtime policy
technical event trace
technical proof receipt
audit reconstruction
model usage accounting
dashboard visibility
Source Intelligence descriptors
explicit legal boundary

Core runtime chain:

IPR → JOKER-C2 → POLICY → RESPONSE → EVT → OPC → AUDIT → MODEL USAGE → DASHBOARD

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Offer positioning

HBCE IPR Runtime API v1 should be positioned commercially as:

A governed AI runtime pilot for operational identity, technical proof, audit and usage accountability.

Alternative positioning labels:

B2G Governed AI Runtime Pilot
AI Operational Identity & Proof Layer Pilot
AI Audit Trail Pilot
Source Intelligence Governance Pilot
JOKER-C2 SaaS Core B2G Pilot

Do not position it as:

legal certification service
official identity service
qualified timestamping service
public authority validation
notarial AI proof system
production compliance certification

---

3. Target clients

The offer is suitable for:

public-sector innovation units
municipal or regional digital transformation offices
cybersecurity teams
AI governance offices
regulated enterprise innovation departments
compliance and audit teams
software integrators
B2G technology partners
research labs
institutional advisors

Best-fit clients are organizations that need to answer:

Can we use AI while keeping identity, audit, proof, traceability and usage visibility?

---

4. Client problem

Most AI integrations expose:

prompt → answer

This is insufficient for B2G and regulated contexts.

The missing layers are:

who initiated the request
which runtime processed it
which policy was applied
which technical event was generated
which proof receipt exists
which audit record exists
which model usage record exists
which data boundary applies
which legal boundary applies

HBCE IPR Runtime API v1 provides a pilot path for this missing governance layer.

---

5. Pilot value proposition

The pilot demonstrates that AI execution can be:

identity-bound
policy-governed
technically traceable
proof-receipt linked
audit-visible
usage-accounted
source-aware
dashboard-visible
boundary-explicit

The value is not the AI answer alone.

The value is the governed runtime chain around the answer.

---

6. Current validated baseline

Current validated technical baseline:

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

Reference technical proof chain:

Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7

These identifiers are demonstration references from the current self-pilot runtime.

---

7. Offer packages

Package A — Guided Runtime Demo

Purpose: introduce HBCE IPR Runtime API v1 and demonstrate the governed AI runtime.

Recommended duration:

1 session
60–90 minutes

Includes:

product overview
dashboard walkthrough
API v1 public surface explanation
IPR runtime identity explanation
Source Intelligence explanation
live governed AI diagnostic demo
EVT/OPC/audit/model usage review
security and legal boundary explanation

Deliverables:

demo summary
dashboard screenshot
sample EVT/OPC/audit/usage chain
security boundary note
recommended next step

Best for:

first institutional meeting
innovation scouting
partner evaluation
pre-pilot discovery

---

Package B — B2G Technical Pilot

Purpose: run a controlled technical pilot using the existing HBCE/JOKER-C2 self-pilot runtime and public API v1 surface.

Recommended duration:

2–4 weeks

Includes:

pilot kickoff
use-case definition
guided API walkthrough
governed AI runtime demo
Source Intelligence descriptor review
technical evidence package
dashboard proof review
security and boundary review
pilot closure report

Deliverables:

pilot scope note
technical demo evidence
EVT/OPC/audit/usage sample chain
API v1 endpoint map
Source Intelligence scope note
security boundary pack
integration gap list
pilot final report

Best for:

public-sector technical validation
regulated enterprise evaluation
cyber-governance assessment
B2G partner onboarding

---

Package C — Controlled API Integration Pilot

Purpose: prepare a client or partner for controlled API integration.

Recommended duration:

4–8 weeks

Includes:

tenant/workspace planning
API access model design
pilot endpoint mapping
integration architecture review
client use-case mapping
Source Intelligence permission model
document handling boundary
audit/usage review path
SDK requirement analysis
OpenAPI review
technical pilot report

Deliverables:

client integration roadmap
tenant/workspace design
API access design
endpoint integration checklist
security boundary confirmation
data handling note
SDK requirement note
production-readiness gap list
commercial next-step proposal

Best for:

software integrators
institutional innovation labs
regulated enterprise technical teams
public-sector digital service pilots

---

8. Indicative commercial model

This document is a commercial pilot template, not a binding quotation.

Final pricing depends on:

scope
duration
client type
integration depth
support level
number of operators
number of use cases
API access requirements
data/security requirements
custom reporting requirements

Indicative pilot models:

Guided Runtime Demo
Fixed-fee discovery session

B2G Technical Pilot
Fixed-scope technical pilot

Controlled API Integration Pilot
Monthly pilot or milestone-based integration pilot

Optional pricing structure:

setup fee
monthly pilot fee
technical support fee
integration support fee
custom reporting fee
Source Intelligence extension fee
document profile testing fee

Commercial note:

All prices, taxes, procurement requirements, invoicing terms and payment terms must be defined in a separate commercial proposal or contract.

---

9. Recommended pilot durations

Recommended durations:

Guided Runtime Demo: 1 day / 1 session
B2G Technical Pilot: 2–4 weeks
Controlled API Integration Pilot: 4–8 weeks
Extended R&D Partnership: 3–6 months

Duration should depend on:

client readiness
technical contacts availability
data boundary requirements
number of workflows tested
API integration depth
security review depth
procurement process

---

10. Included technical components

The pilot may include the following components:

JOKER-C2 dashboard
HBCE IPR Runtime API v1
IPR session flow
governed chat flow
EVT/OPC proof chain
audit lookup
model usage lookup
Source Intelligence descriptor
document registry visibility
security boundary pack
demo evidence package
pilot report

Current public API v1 surface:

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

11. Source Intelligence commercial scope

Source Intelligence may be included in the pilot as a governed source-bound intelligence layer.

Available sourceSets:

ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK
EU_AI_GOVERNANCE_REGULATORY_STACK
ENISA_CYBER_THREAT_LANDSCAPE
ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK
OPENAI_AGENTIC_SYSTEMS_SECURITY

Current validated state:

SOURCESET_REGISTRY_READY
SourceSets active = 5/5
Catalog sources = 19
Endpoint chain = 7/7 PASS
PDF boundary = PDF_BINARY_HASH_ONLY
Raw text persistence = false
Memory profile policy = EXPLICIT_OPERATOR_SAVE_ONLY

Source Intelligence pilot boundaries:

sourceSet must be registered
unknown sourceSet fails closed
source mismatch fails closed
local/private URLs rejected
raw text persistence false by default
source profile save only by explicit operator action
technical source receipt only
legalCertification=false

---

12. Document registry commercial scope

Document registry visibility may be included in the pilot.

Current validated state:

Document registry = AVAILABLE
Document profiles = 20
Linked document memory = 16
Reusable profiles = 20

Document features may include:

document profile visibility
controlled file descriptor review
document hash explanation
explicit recall explanation
document memory boundary explanation

Document features do not include, unless separately scoped:

bulk production document processing
sensitive document processing
legal document certification
regulated archival service
unrestricted raw text persistence
classified document handling

---

13. Exclusions

The pilot does not include by default:

legal certification
qualified timestamping
official identity issuance
public authority validation
production compliance certification
SOC2/ISO certification
unlimited API usage
unlimited document ingestion
unlimited Source Intelligence execution
sensitive data processing
classified data processing
custom legal opinions
production SLA
24/7 support

These items require separate scope, contract and review.

---

14. Client responsibilities

The client or partner must provide:

pilot owner
technical contact
pilot use case
data sensitivity classification
operator list
integration preference
security requirements
review schedule
feedback channel
decision owner

The client must avoid initial use of:

classified data
health data
biometric data
criminal data
production citizen data
confidential legal files
high-risk autonomous decision workflows

Unless a separate written agreement and security review are completed.

---

15. HBCE responsibilities

HBCE provides:

runtime demonstration
API v1 explanation
dashboard walkthrough
technical proof chain explanation
security and boundary documentation
pilot evidence package
integration roadmap
pilot closure note
technical support within agreed scope

HBCE does not provide under this pilot:

legal certification
public authority validation
qualified trust service
official identity issuance
legal advice
regulated compliance certification

---

16. Pilot evidence package

A successful pilot should produce:

dashboard screenshot
runtime status snapshot
IPR session descriptor
sample AI governed response
Response EVT
OPC receipt
audit reference
model usage reference
Source Intelligence descriptor
API endpoint validation note
legalCertification=false note
integration recommendations

Example evidence fields:

Runtime timestamp
Human IPR reference
Runtime IPR reference
Tenant
Workspace
Response EVT
OPC ID
Audit ID
Usage ID
Policy decision
Model
Source Intelligence status
API v1 status
Boundary

---

17. Acceptance criteria

Minimum technical acceptance criteria:

runtime reachable
dashboard reachable
IPR access confirmed
MATRIX_ACTIVE visible
IPR_BOUND memory visible
EVT generated
OPC generated
audit persisted
model usage persisted
API v1 public surface visible
Source Intelligence registry visible
legalCertification=false visible

Pilot acceptance does not mean production certification.

Pilot acceptance means:

The client has observed and reviewed the technical runtime governance chain.

---

18. Commercial next steps after pilot

After the pilot, possible next steps are:

extend technical pilot
start controlled API integration
create client tenant/workspace
define API key/token model
define rate limits
define SDK integration
define Source Intelligence permissions
define document handling policy
prepare production-readiness assessment
prepare commercial SaaS subscription proposal

Recommended next technical increment:

API key / client token model
tenant provisioning
rate limit and quota model
OpenAPI schema stabilization
TypeScript SDK
audit export
usage export

---

19. Procurement note

For public-sector or regulated clients, procurement may require:

formal offer
supplier registration
security questionnaire
data processing agreement
technical annex
pilot scope document
legal boundary annex
pricing annex
support terms
payment terms

This document can support the technical-commercial framing but does not replace procurement documentation.

---

20. Commercial proposal structure

A formal commercial proposal should include:

client name
pilot package selected
scope
duration
deliverables
excluded items
client responsibilities
HBCE responsibilities
data boundary
security boundary
legal boundary
price
taxes
payment terms
timeline
support channel
acceptance criteria
next-step options

Recommended annexes:

Product Brief
Technical API Contract Sheet
B2G Pilot Package
B2G Demo Flow
Security & Boundary Pack
Client Integration Roadmap
API v1 Public Surface Regression v76

---

21. Suggested offer names

Recommended commercial names:

HBCE IPR Runtime API v1 — Guided Runtime Demo
HBCE IPR Runtime API v1 — B2G Technical Pilot
HBCE IPR Runtime API v1 — Controlled API Integration Pilot
JOKER-C2 SaaS Core — AI Audit Trail Pilot
HBCE Source Intelligence — Governance Pilot

Short commercial line:

A governed AI runtime pilot for identity-bound, audit-ready and proof-linked AI execution.

---

22. Final commercial statement

HBCE IPR Runtime API v1 is ready for a controlled B2G pilot offer.

The current runtime baseline demonstrates:

identity-bound AI execution
database-persistent runtime memory
EVT technical event tracing
OPC technical proof receipts
audit persistence
model usage persistence
Source Intelligence readiness
API v1 public surface validation
dashboard operational visibility

The commercial pilot should be sold as a controlled evaluation of governed AI runtime infrastructure.

It must not be sold as final legal certification infrastructure.

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
