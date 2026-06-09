HBCE IPR Runtime API v1

Security & Boundary Pack

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: security posture, data boundary, memory boundary, proof boundary, legal boundary
Target: B2G / regulated enterprise / cyber-governance pilot
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the technical security and operational boundaries for HBCE IPR Runtime API v1 during B2G pilot evaluation.

The purpose is to make clear:

what the runtime does,
what the runtime does not do,
what data can be handled,
what memory can persist,
what proof means,
what proof does not mean,
what security posture applies,
and where human/legal review remains required.

HBCE/JOKER-C2 is designed as a governed AI runtime with operational identity, technical event tracing, proof receipts, audit logs and model usage records.

It is not a legal certification system.

Mandatory baseline:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Runtime security posture

HBCE IPR Runtime API v1 follows this pilot security posture:

UE-first
GDPR-min
hash-first
audit-ready
identity-bound runtime
operator-controlled memory save
server-side source governance
explicit boundary exposure
technical proof continuity
fail-closed on unknown sourceSets
no raw text persistence by default

The runtime is designed for controlled AI execution, not uncontrolled autonomous decision-making.

The pilot posture is:

defensive / governance use
technical traceability
audit visibility
source-bound intelligence
controlled document handling
operator-supervised persistence

---

3. Legal boundary

HBCE/JOKER-C2 does not provide legal certification.

The runtime can generate technical evidence, but that evidence does not replace:

legal review
human oversight
public authority validation
qualified timestamping
regulated certification
identity document issuance
notarial validation
court-admissibility assessment

Core legal boundary:

legalCertification=false

Meaning:

OPC is not a legal certificate.
EVT is not a legal notarization event.
IPR is not an official public identity document.
Audit logs are technical reconstruction records.
Model usage logs are technical/accounting records.
Dashboard status is operational visibility, not legal approval.

---

4. Identity boundary

HBCE IPR Runtime API v1 uses IPR as an operational identity and proof layer.

IPR identifies the operational subject inside the governed runtime.

IPR does not replace:

passport
national ID card
CIE
SPID
public identity register
qualified electronic identity
legal personhood registry

Recommended explanation:

Official documents are verification inputs.
IPR is an operational output used inside HBCE/JOKER-C2.

For the current self-pilot runtime:

Runtime IPR = IPR-AI-0001
Human IPR = IPR-88505FE91013DCFE97C56ED1
Identity binding = IPR_VERIFIED_BIOLOGICAL_SUBJECT
Certificate status = ACTIVE
Scope = JOKER_C2_ACCESS
Access = ACCESS_GRANTED

Pilot boundary:

The IPR layer supports operational continuity, accountability and runtime traceability.
It does not issue official public identity.

---

5. Memory boundary

HBCE/JOKER-C2 separates runtime memory, semantic memory and explicit IPR memory.

Memory must never be treated as a generic storage bucket.

Memory persistence is governed by policy.

Current validated posture:

Memory = IPR_BOUND
Persistence = DATABASE_PERSISTENT
Memory authority = SERVER_RUNTIME_VALIDATED
Manual Save Chat → IPR = explicit operator action only

Memory categories:

runtime memory = technical continuity for active runtime
semantic memory = classified synthesis, policy-governed
IPR memory = operator-selected reusable memory
document memory = document profile linked to IPR memory

Memory boundary:

Prompt content must not automatically become reusable memory.
Contract-only tests must not create semantic memory.
Manual Save Chat → IPR must remain operator-controlled.
No raw text should be persisted unless explicitly allowed by policy.

---

6. Contract-only safety boundary

Public API contract-only tests must not trigger operational branches.

Current validated guard state:

Contract-only = PASS
semanticMemoryCreated=false
runtimeMemoryWriteSuppressed=true
sourceLiveFetch=false
documentIngestion=false
documentRecall=false

This means public API descriptor validation must not execute:

live Source Intelligence fetch
file ingestion
document recall
semantic memory generation
IPR memory save
runtime branch execution

Contract-only mode exists to test the API surface safely.

It must remain separated from live operational execution.

---

7. Data handling boundary

Default data posture:

GDPR-min
hash-first
rawTextPersistence=false by default
operator-controlled persistence
technical metadata persistence allowed
source profile persistence only on explicit operator action
document profile persistence only when ingestion is explicitly requested

Allowed technical metadata may include:

EVT ID
OPC ID
audit ID
model usage ID
runtime IPR
human IPR reference
tenant/workspace references
input/output hashes
policy hash
document hash
source hash
timestamps
model identifier
usage accounting fields

Sensitive/raw content handling must be minimized.

B2G pilot rule:

Do not use sensitive, classified, health, legal, biometric, criminal, military or production personal data in pilot tests unless a separate written data-processing and security agreement exists.

---

8. File and document boundary

The runtime supports file ingestion and document profiles, but file handling must be explicit.

Current validated document registry state:

Document registry = AVAILABLE
Document profiles = 20
Linked document memory = 16
Reusable profiles = 20

File boundary:

No file ingestion during contract-only API tests.
No document recall unless explicitly requested.
No raw document persistence unless explicitly permitted.
Document profile existence does not imply legal certification.
PDF binary hash-only boundary applies unless text extraction is explicitly enabled.

Document profile means:

The runtime has created a technical profile for document handling and recall.

Document profile does not mean:

the document is legally certified,
the content is legally validated,
the file is approved by a public authority,
or the document is safe for unrestricted reuse.

---

9. Source Intelligence boundary

Source Intelligence is a governed source-bound intelligence layer.

Current sourceSets:

ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK
EU_AI_GOVERNANCE_REGULATORY_STACK
ENISA_CYBER_THREAT_LANDSCAPE
ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK
OPENAI_AGENTIC_SYSTEMS_SECURITY

Current validated status:

SOURCESET_REGISTRY_READY
SourceSets active = 5/5
Catalog sources = 19
Endpoint chain = 7/7 PASS
PDF boundary = PDF_BINARY_HASH_ONLY
Raw text persistence = false
Memory profile policy = EXPLICIT_OPERATOR_SAVE_ONLY

Source Intelligence boundary:

sourceSets must be registered
unknown sourceSets must fail closed
source mismatch must fail closed
local/private URLs must be rejected
raw source text persistence must be false by default
source profile save requires explicit operator action
PDF binary hash-only applies unless explicit text extraction is implemented

Source Intelligence does not certify that external sources are legally authoritative.

It provides governed technical source handling and runtime context.

---

10. EVT boundary

EVT is the technical event trace.

EVT can be used to identify that a runtime event occurred inside the system.

EVT may include:

event ID
event hash
timestamp
runtime context
linked OPC
linked audit
linked usage
technical state

EVT does not provide:

legal notarization
qualified timestamping
public authority validation
legal evidence guarantee
court admissibility guarantee

Boundary:

EVT is a technical event trace only.
legalCertification=false

---

11. OPC boundary

OPC is the technical proof receipt.

OPC can connect:

event hash
chain hash
runtime timestamp
policy context
audit reference
technical proof state

OPC does not provide:

legal certification
official notarization
qualified trust service
public timestamp authority
regulated certificate

Boundary:

OPC is a technical proof receipt only.
legalCertification=false

Recommended pilot wording:

OPC provides technical proof continuity inside HBCE/JOKER-C2.
It does not replace legal certification or qualified timestamping.

---

12. Audit boundary

The audit layer stores technical runtime reconstruction.

Audit may include:

policy decision
risk level
runtime IPR
human IPR reference
EVT reference
OPC reference
model reference
usage reference
memory mode
tenant/workspace context
boundary state

Audit does not provide:

legal approval
compliance certification
human review replacement
official investigation record
regulatory attestation

Audit is a technical accountability layer.

---

13. Model usage boundary

Model usage stores technical and accounting metadata.

Model usage may include:

usage ID
provider
model
model level
token fields if available
cost/accounting fields
audit linkage
EVT/OPC linkage
tenant/workspace context

Model usage does not certify:

accuracy of output
legal validity of output
ethical approval
compliance approval

It supports SaaS accounting, quota governance and operational monitoring.

---

14. Tenant and workspace boundary

Current self-pilot context:

Tenant = HBCE-TENANT-SELF-PILOT
Workspace = HBCE-WORKSPACE-RND
Subscription = HBCE-SUBSCRIPTION-SELF-PILOT
Account = HBCE-ACCOUNT-SELF-PILOT
Tier = IPR

B2G pilot requirement:

Each client pilot must have explicit tenant/workspace boundaries.
Cross-tenant contamination must be prevented.
Document profiles must be scoped.
Memory records must be scoped.
Audit and usage records must be scoped.
Source Intelligence profile saves must be scoped.

Future SaaS increment:

client tenant provisioning
workspace-level access control
API key/token model
rate limits per tenant
audit export per tenant
usage accounting per tenant

---

15. Access control boundary

Current runtime supports controlled self-pilot access.

Validated access state:

Access = ACCESS_GRANTED
Certificate status = ACTIVE
Scope = JOKER_C2_ACCESS
Binding = IPR_VERIFIED_BIOLOGICAL_SUBJECT
Authority = SERVER_RUNTIME_VALIDATED

B2G pilot access boundary:

pilot access must be limited to named operators
operator action must be traceable
manual save actions must be explicit
admin/operator role separation should be introduced before broader deployment
API access should require keys/tokens before external pilot integration

Current limitation:

Full customer-grade API key/token management is a required next increment.

---

16. Policy and risk boundary

Current validated policy posture:

Policy decision = ALLOW
Operation decision = ALLOW
Security outcome = NORMAL_ALLOWED_OPERATION
Data class = PUBLIC_OR_SYNTHETIC
Risk level = LOW
Human oversight = NOT_REQUIRED
Fail-closed = false

B2G pilot policy boundary:

Only low-risk public/synthetic test content should be used by default.
High-risk, sensitive, regulated or classified content requires separate review.
Autonomous high-impact decisions are out of scope.
Policy escalation must remain available.
Fail-closed must apply to unknown or mismatched operational contexts.

---

17. Human oversight boundary

HBCE/JOKER-C2 does not replace human oversight.

For B2G pilots, human review remains required for:

legal interpretation
policy adoption
institutional decision-making
risk acceptance
external communication
procurement decisions
security accreditation
production deployment approval

The runtime supports review.

It does not replace review.

---

18. Compliance boundary

This pilot package supports compliance-oriented technical evaluation.

It does not claim full regulatory compliance certification.

Before production use, the client should assess:

DPIA / data protection impact assessment
GDPR role allocation
data processing agreement
security risk assessment
access control model
log retention policy
incident response process
vendor risk review
AI governance policy alignment
regulatory classification
procurement/legal review

Current statement:

HBCE/JOKER-C2 is pilot-ready for technical governance evaluation.
It is not yet a certified regulated infrastructure.

---

19. Retention and deletion boundary

Retention rules must be defined before external production deployment.

Pilot recommendation:

minimize stored content
persist technical metadata only where needed
avoid raw text persistence by default
use hashes where possible
document manual save events
document deletion/removal process
scope all records to tenant/workspace

Required next increment:

retention policy document
operator deletion procedure
audit export policy
memory removal policy
tenant data deletion workflow

---

20. Security controls currently demonstrated

Current demonstrated controls:

IPR-bound runtime identity
server-side identity validation
MATRIX_ACTIVE runtime state
database-persistent memory
EVT generation
OPC proof receipt generation
audit persistence
model usage persistence
Source Intelligence sourceSet registry
unknown sourceSet fail-closed behavior
contract-only API self-test
document recall explicitness
manual Save Chat → IPR control
dashboard boundary exposure
legalCertification=false exposure

These controls are sufficient for technical pilot presentation.

They are not sufficient alone for full production certification.

---

21. Required controls before broader SaaS deployment

Before wider B2G SaaS deployment, implement:

API key / client token management
tenant provisioning
workspace access control
role-based access control
rate limiting
request quotas
audit export
usage billing model
retention/deletion workflows
operator action logs
webhook delivery for operations
SDK client
OpenAPI downloadable contract
security incident process
client data-processing agreement

Recommended label:

SaaS Core v0.2 = B2G Pilot Readiness
SaaS Core v0.3 = External Pilot Integration
SaaS Core v1.0 = Production Candidate

---

22. Client responsibilities

The pilot client is responsible for:

selecting non-sensitive pilot data
defining pilot use case
naming pilot operators
reviewing legal boundary
reviewing data-processing terms
validating internal security requirements
deciding whether generated evidence is useful
confirming whether integration should proceed

HBCE/JOKER-C2 provides the runtime and technical evidence chain.

The client remains responsible for organizational decisions.

---

23. Standard pilot boundary statement

Use this statement in B2G materials:

HBCE IPR Runtime API v1 is a governed AI runtime pilot layer that connects AI interactions to operational identity, technical event traces, technical proof receipts, audit records and model usage metadata.

It does not provide legal certification, official identity issuance, qualified timestamping or public authority validation.

All proof artifacts are technical runtime receipts.

legalCertification=false.

---

24. B2G risk disclosure

Pilot risk disclosure:

This pilot is intended for technical evaluation of governed AI runtime controls.
It should not be used for autonomous high-risk decisions.
It should not process sensitive, classified or regulated production data without a separate written agreement and security assessment.
Generated outputs require human review.
Technical proof receipts do not replace legal evidence review.

---

25. Final boundary matrix

Layer| Provides| Does not provide
IPR| Operational identity/proof layer| Official public identity
EVT| Technical event trace| Legal notarization
OPC| Technical proof receipt| Legal certification
Audit| Runtime reconstruction| Compliance certification
Model usage| Usage/accounting metadata| Output validation
Dashboard| Operational visibility| Public authority approval
Source Intelligence| Governed source handling| Legal authority of sources
Document registry| Technical document profiles| Legal validation of documents
Memory| Runtime continuity| Automatic truth or legal proof
MATRIX| Operational organization| Legal governance authority

---

26. Closing statement

HBCE IPR Runtime API v1 is suitable for B2G pilot evaluation when presented as:

governed AI runtime,
operational identity/proof layer,
technical traceability system,
audit-ready execution environment,
Source Intelligence descriptor layer,
and SaaS Core pilot architecture.

It must not be presented as:

legal certifier,
public identity authority,
qualified timestamping service,
official notary,
or autonomous decision authority.

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
