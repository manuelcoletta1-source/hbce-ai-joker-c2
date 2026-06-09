HBCE IPR Runtime API v1

B2G Demo Flow

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Demo type: governed AI runtime demonstration
Target: B2G / regulated enterprise / cyber-governance pilot
Boundary: "legalCertification=false"

---

1. Demo objective

This demo shows how HBCE IPR Runtime API v1 transforms a standard AI interaction into a governed, traceable and audit-ready runtime event.

The demo is designed for B2G and regulated environments where an AI answer is not enough.

The relevant value is the operational chain around the answer:

IPR → JOKER-C2 → POLICY → RESPONSE → EVT → OPC → AUDIT → MODEL USAGE → DASHBOARD

The demo proves that the runtime can expose:

operational identity
policy decision
technical event trace
technical proof receipt
audit record
model usage record
dashboard state
Source Intelligence descriptor
explicit legal boundary

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.

---

2. Demo audience

This demo is intended for:

public-sector innovation teams
B2G technology evaluators
AI governance officers
cybersecurity teams
compliance teams
audit teams
regulated enterprise innovation units
software integrators
institutional partners

The demo should be presented as a technical governance flow, not as a generic AI showcase.

---

3. Demo duration

Recommended duration:

15 minutes standard demo
30 minutes extended technical walkthrough
60 minutes pilot workshop

Suggested format:

5 minutes: product framing
5 minutes: live runtime/API demonstration
5 minutes: dashboard and proof chain review

Extended workshop adds:

API contract review
Source Intelligence review
security boundary review
integration discussion
pilot scope definition

---

4. Demo prerequisites

Before running the demo, verify:

JOKER-C2 dashboard reachable
Runtime status = JOKER_C2_SAAS_CORE_HEALTHY
Human IPR available
Runtime IPR = IPR-AI-0001
MATRIX = MATRIX_ACTIVE
Memory = IPR_BOUND
Audit = PERSISTED
Usage = PERSISTED
API v1 public surface = 16/16 PASS
Source Intelligence = SOURCESET_REGISTRY_READY
legalCertification=false visible

Recommended baseline proof:

Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7

These values are R&D/self-pilot proof references and should be treated as technical demonstration identifiers.

---

5. Demo storyline

The story is simple:

A normal AI system answers.
HBCE/JOKER-C2 answers inside a governed runtime.

The demo should make the difference visible.

A generic AI interaction produces:

prompt → answer

HBCE/JOKER-C2 produces:

identity → request → policy → answer → event → proof → audit → usage → dashboard

This is the B2G value.

---

6. Demo flow overview

The live demo follows this sequence:

1. Open dashboard.
2. Show runtime identity and SaaS status.
3. Show API v1 public surface 16/16 PASS.
4. Show Source Intelligence registry 5/5.
5. Create or verify IPR session.
6. Send governed AI request.
7. Show generated response.
8. Show EVT.
9. Show OPC.
10. Show audit.
11. Show model usage.
12. Show dashboard state after refresh.
13. Explain legal boundary.
14. Close with pilot value.

---

7. Step 1 — Open dashboard

Action

Open JOKER-C2 dashboard.

Expected visible state

JOKER_C2_SAAS_CORE_HEALTHY
Model = gpt-5.4-nano
Runtime IPR = IPR-AI-0001
Human IPR = IPR-88505FE91013DCFE97C56ED1
MATRIX = MATRIX_ACTIVE
Memory = IPR_BOUND
Docs = AVAILABLE
Source Intel = SOURCESET_REGISTRY_READY
Audit = PERSISTED
Usage = PERSISTED
SaaS ctx = ACTIVE_RESPONSE_READY

Speaker note

The dashboard is the operational visibility layer.

It shows that the AI interaction is not isolated text. It is connected to runtime identity, memory, proof, audit and usage accounting.

---

8. Step 2 — Show API v1 public surface

Action

Scroll to the card:

HBCE IPR Runtime API v1
Public API surface · contract-only regression

Expected visible state

Status = 16/16 PASS
Endpoints = 16/16 PASS
Contract-only = PASS
No semantic memory = PASS
No branch execution = PASS
Docs = docs/product/hbce-ipr-runtime-api-v1
legalCertification=false

Speaker note

This card proves that the public API v1 surface is stable and validated in contract-only mode.

The contract-only mode is important because it confirms that endpoint validation does not trigger unintended memory creation, document ingestion or Source Intelligence live execution.

---

9. Step 3 — Show Source Intelligence

Action

Scroll to Source Intelligence v0.3.

Expected visible state

SOURCE_INTELLIGENCE_HEALTHY
SOURCESET_REGISTRY_READY
SourceSets = 5/5
Catalog = 19
Endpoint chain = 7/7 PASS
PDF boundary = PDF_BINARY_HASH_ONLY
Raw text persistence = false
Memory profile policy = EXPLICIT_OPERATOR_SAVE_ONLY

Active sourceSets

EU_AI_GOVERNANCE_REGULATORY_STACK
ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK
ENISA_CYBER_THREAT_LANDSCAPE
OPENAI_AGENTIC_SYSTEMS_SECURITY
ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK

Speaker note

Source Intelligence is the governed source-bound intelligence layer.

It is designed for B2G risk, AI governance and cyber intelligence use cases where source provenance, allowlisting and controlled persistence matter.

---

10. Step 4 — Verify IPR session

Action

Show the IPR identity block.

Expected visible state

Subject = Manuel Coletta
Runtime IPR = IPR-AI-0001
Human IPR = IPR-88505FE91013DCFE97C56ED1
Certificate status = ACTIVE
Scope = JOKER_C2_ACCESS
Access = ACCESS_GRANTED
Binding = IPR_VERIFIED_BIOLOGICAL_SUBJECT

Speaker note

The runtime is not identifying a generic user only through a prompt.

It operates with an IPR-bound identity frame.

This is an internal operational identity/proof layer, not a public identity document.

---

11. Step 5 — Send governed runtime request

Action

Use the dashboard chat or API request.

Recommended demo prompt:

mostrami la diagnostica runtime: IPR, MATRIX, memoria, database, EVT, OPC, audit, model usage e SaaS context

Expected behavior

The runtime should generate a post-event diagnostic after EVT, OPC, audit and model usage creation.

Speaker note

This request is useful because it forces the runtime to expose the complete governance chain.

It is not only a model answer. It is a runtime-constructed diagnostic after the technical event chain is generated.

---

12. Step 6 — Show runtime response

Expected response status

COMPLETED
ACCESS_GRANTED
MATRIX_ACTIVE
IPR_BOUND
DATABASE_PERSISTENT_ACTIVE
ACTIVE_RESPONSE_READY
B2G active response readiness = READY

Expected trace fields

Response EVT = EVT-...
OPC = OPC-...
Audit = AUDIT-...
Usage = USAGE-...

Speaker note

This is the core B2G proof.

The response is linked to event, proof receipt, audit and model usage.

---

13. Step 7 — Show EVT

Action

Point to the response EVT.

Expected example

EVT-20260609071458-BA2C2C57

Speaker note

EVT is the technical event trace.

It shows that the runtime created a traceable event for the AI interaction.

Boundary:

EVT is not a legal notarization event.
EVT is a technical event trace.

---

14. Step 8 — Show OPC

Action

Point to the OPC field.

Expected example

OPC-20260609071458-BBDF38EC

Speaker note

OPC is the technical proof receipt.

It links to the event hash and chain hash.

Boundary:

OPC is not a legal certificate.
OPC is a technical proof receipt only.
legalCertification=false

---

15. Step 9 — Show audit

Action

Point to the audit block.

Expected example

AUDIT-20260609071550-2D1BE17D
Audit status = PERSISTED
Audit persistence = PERSISTED

Speaker note

The audit layer reconstructs the runtime decision context.

It can support internal review, technical accountability and governance analysis.

It does not replace legal review.

---

16. Step 10 — Show model usage

Action

Point to the model usage block.

Expected example

USAGE-20260609071551-B3D56BC7
Usage status = PERSISTED
Model = gpt-5.4-nano
Model level = STANDARD
Usage persistence = PERSISTED

Speaker note

The model usage layer connects the interaction to accounting and operational monitoring.

For SaaS deployment, this becomes the basis for usage control, billing and quota governance.

---

17. Step 11 — Refresh dashboard

Action

Refresh the dashboard or refresh runtime/session state.

Expected visible state

JOKER_C2_SAAS_CORE_HEALTHY
MATRIX_ACTIVE
IPR_BOUND
Docs AVAILABLE
Audit PERSISTED
Usage PERSISTED
SaaS ctx ACTIVE_RESPONSE_READY
B2G active response readiness READY

Speaker note

This confirms the runtime state after the post-event diagnostic.

The dashboard is no longer cold. It shows the active runtime proof chain.

---

18. Step 12 — Explain document registry

Action

Show document registry block.

Expected visible state

Document registry = AVAILABLE
Document profiles = 20
Linked document memory = 16
Reusable = 20

Speaker note

The document registry is available, but document recall is explicit.

During this demo, document recall is not necessary unless the pilot includes a specific document analysis scenario.

Boundary:

No document recall unless explicitly requested.
No file ingestion during contract-only API tests.
No legal certification from document profile existence.

---

19. Step 13 — Explain why some fields may be WAITING

During a demo, some subsections may show "WAITING" or "NOT_READY".

This is normal if that specific sub-chain has not been selected.

Examples:

MATRIX I–V = WAITING
IPR memory console chain = NOT_READY

Interpretation:

MATRIX I–V WAITING is not an error if another active recall branch is selected.
IPR memory console chain NOT_READY is not an error if no chat was manually selected/saved into that sub-chain.

Do not over-explain this unless asked. Humans see a warning label and immediately invent a collapse scenario. Adorable, in a systems-failure kind of way.

---

20. Step 14 — Close the demo

Closing statement

HBCE IPR Runtime API v1 demonstrates that an AI interaction can be executed inside a governed runtime where the answer is connected to:

operational identity
runtime policy
technical event trace
technical proof receipt
audit reconstruction
model usage accounting
dashboard visibility
Source Intelligence descriptors
legal boundary

The value is not the answer alone.

The value is the governed chain around the answer.

---

21. Standard demo checklist

Before demo:

[ ] Dashboard reachable
[ ] Runtime status healthy
[ ] API v1 card visible
[ ] API v1 = 16/16 PASS
[ ] Source Intelligence = 5/5
[ ] IPR block visible
[ ] legalCertification=false visible

During demo:

[ ] Show dashboard header
[ ] Show API v1 card
[ ] Show Source Intelligence
[ ] Show IPR identity
[ ] Send runtime diagnostic prompt
[ ] Show EVT
[ ] Show OPC
[ ] Show audit
[ ] Show model usage
[ ] Refresh dashboard
[ ] Show ACTIVE_RESPONSE_READY

After demo:

[ ] Capture screenshot
[ ] Record EVT/OPC/AUDIT/USAGE references
[ ] Save pilot notes outside runtime memory
[ ] Do not manually Save Chat → IPR unless the pilot explicitly requires it

---

22. Recommended demo script

Opening

This is not a generic chatbot demo.
This is a governed AI runtime demo.

The purpose is to show how an AI interaction can be connected to operational identity, technical proof, audit and model usage.

Runtime identity

The runtime is AI JOKER-C2.
The AI runtime IPR is IPR-AI-0001.
The human operational subject is linked through an IPR-bound session.

API v1

The public API surface is HBCE IPR Runtime API v1.
It currently exposes 16 validated endpoints in contract-only mode.

Source Intelligence

The Source Intelligence layer exposes governed sourceSets for AI governance, cyber risk and institutional intelligence workflows.

Runtime proof

After the AI response, the runtime generates EVT, OPC, audit and model usage records.
This creates a technical proof chain around the interaction.

Boundary

This is not legal certification.
OPC is a technical proof receipt only.
EVT is a technical event trace only.
legalCertification=false.

Close

The pilot question is simple:
can the organization operate AI requests with identity, proof, audit, usage and controlled runtime boundaries?

This demo shows the technical path to answer yes.

---

23. Demo evidence package

For every successful demo, collect:

runtime timestamp
dashboard screenshot
Human IPR reference
Runtime IPR reference
Response EVT
OPC ID
Audit ID
Usage ID
API v1 status
Source Intelligence status
legalCertification=false boundary

Example evidence package:

Runtime timestamp: 2026-06-09T07:14:58.770Z
Human IPR: IPR-88505FE91013DCFE97C56ED1
Runtime IPR: IPR-AI-0001
Response EVT: EVT-20260609071458-BA2C2C57
OPC: OPC-20260609071458-BBDF38EC
Audit: AUDIT-20260609071550-2D1BE17D
Usage: USAGE-20260609071551-B3D56BC7
API v1: 16/16 PASS
Source Intelligence: 5/5 READY
legalCertification=false

---

24. Demo non-goals

Do not present the demo as:

legal certification
official identity verification
public authority service
qualified timestamping
autonomous high-risk decision-making
final cybersecurity certification
production-grade compliance certification

Present it as:

B2G governed AI runtime pilot
AI operational identity and proof layer
technical traceability and auditability demonstration

---

25. Final boundary

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
