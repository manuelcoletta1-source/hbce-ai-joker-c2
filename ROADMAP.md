# AI JOKER-C2 Roadmap

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This roadmap defines the development path of AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The roadmap is designed to evolve the project from a working prototype into a governed, traceable and verifiable AI runtime for civil, institutional, strategic, B2B and B2G use cases.

The project must remain:

- identity-bound;
- non-offensive;
- policy-aware;
- risk-classified;
- event-driven;
- auditable;
- fail-closed;
- human-accountable;
- suitable for defensive and governance-oriented environments.

---

## 2. Strategic Direction

AI JOKER-C2 follows this strategic direction:

```txt
MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = trace layer
Ledger = continuity layer
Fail-closed = safety boundary

The long-term objective is to transform AI-assisted operations into verifiable operational sequences.

The core runtime sequence is:

Identity -> Policy -> Risk -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity

The roadmap must not convert the system into an offensive platform.

Development must strengthen governance, traceability and safe operational control.


---

3. Roadmap Overview

Phase	Objective	Status

v0.1	Working AI runtime with interface, chat and basic diagnostics	Active prototype
v0.2	Governance documentation and strategic dual-use boundary	In progress
v0.3	Runtime policy engine and risk classifier	Planned
v0.4	Append-only EVT ledger and verification endpoint	Planned
v0.5	Signed EVT records and evidence packs	Planned
v0.6	Runtime dashboard for events, audit and system state	Planned
v0.7	B2B and B2G documentation package	Planned
v0.8	Federation model and node registry	Planned
v0.9	Compliance-oriented operational package	Planned
v1.0	Governed operational release candidate	Planned



---

4. v0.1 — Runtime Prototype

Objective

Create a working AI JOKER-C2 runtime with a public interface, operational chat, file context and basic runtime diagnostics.

Core Features

Next.js application;

public landing page;

operational interface;

/api/chat endpoint;

/api/files endpoint;

OpenAI model integration;

local fallback behavior;

runtime identity display;

basic EVT chain visualization;

file-based context ingestion;

GitHub-ready output generation.


Governance Requirements

preserve identity context;

avoid unsafe outputs;

avoid exposing secrets;

support controlled degraded mode;

preserve public usability.


Deliverables

README.md
ARCHITECTURE.md
GOVERNANCE.md
EVT_PROTOCOL.md
DUAL_USE_STRATEGIC_POSITIONING.md
SECURITY.md

Completion Criteria

v0.1 is complete when the application can:

receive a user request;

process a model response;

handle basic file context;

return a structured answer;

expose runtime status when needed;

preserve a clear identity-bound project frame.



---

5. v0.2 — Governance and Strategic Positioning

Objective

Formalize AI JOKER-C2 as a governed, non-offensive, civil and strategic dual-use runtime.

Core Features

strategic dual-use positioning;

governance model;

fail-closed principle;

EVT protocol;

security policy;

repository README refactor;

architecture formalization;

clear distinction between defensive and prohibited use.


Governance Requirements

define ALLOW, BLOCK, ESCALATE, DEGRADE and AUDIT;

define risk classes;

define context classes;

define non-offensive boundary;

define fail-closed triggers;

define event trace requirements.


Deliverables

DUAL_USE_STRATEGIC_POSITIONING.md
GOVERNANCE.md
EVT_PROTOCOL.md
ARCHITECTURE.md
README.md
SECURITY.md
ROADMAP.md

Completion Criteria

v0.2 is complete when the repository clearly explains:

what AI JOKER-C2 is;

what AI JOKER-C2 is not;

how governance works;

how EVT works;

how fail-closed works;

how the project is positioned for civil, institutional and strategic use.



---

6. v0.3 — Policy Engine and Risk Classifier

Objective

Implement a runtime policy engine and risk classifier that operate before sensitive output generation.

Core Features

context classification;

risk classification;

policy evaluation;

decision generation;

prohibited request detection;

safe degraded response;

structured diagnostic object.


Suggested Runtime Decisions

Decision	Meaning

ALLOW	Operation may proceed
BLOCK	Operation is unsafe or prohibited
ESCALATE	Human review or authority required
DEGRADE	Limited safe response only
AUDIT	Record or review before continuation


Suggested Risk Classes

Risk	Meaning

LOW	Ordinary safe request
MEDIUM	Operationally relevant request
HIGH	Sensitive or strategic request
CRITICAL	Requires strict review
PROHIBITED	Must be blocked
UNKNOWN	Cannot be safely classified


Suggested Files

lib/policy-engine.ts
lib/risk-engine.ts
lib/context-classifier.ts
lib/runtime-decision.ts

Completion Criteria

v0.3 is complete when the runtime can:

classify context;

assign risk;

generate decision;

block prohibited requests;

degrade uncertain sensitive outputs;

expose safe diagnostics.



---

7. v0.4 — Append-Only EVT Ledger and Verifier

Objective

Create an append-only event ledger and verification endpoint.

Core Features

local EVT generation;

previous event reference;

deterministic event object;

SHA-256 hash;

append-only JSONL ledger;

basic verifier endpoint;

public-safe event view;

internal event structure.


Suggested Files

lib/evt.ts
lib/evt-ledger.ts
lib/evt-hash.ts
lib/evt-verify.ts
app/api/verify/route.ts
ledger/events.jsonl

Ledger Rule

Historical events must not be silently rewritten.

Corrections must be represented as new events.

Completion Criteria

v0.4 is complete when the runtime can:

create an EVT;

link it to the previous event;

hash the canonical event object;

append it to a ledger;

verify event consistency;

expose public-safe verification output.



---

8. v0.5 — Signed EVT Records and Evidence Packs

Objective

Strengthen EVT integrity with digital signatures and evidence packages.

Core Features

signed EVT records;

ED25519 signing support;

verification key handling;

evidence pack generation;

manifest file;

hash manifest;

exportable audit bundle.


Suggested Files

lib/signing.ts
lib/evidence-pack.ts
lib/manifest.ts
app/api/evidence/route.ts
evidence/PACK_MANIFEST.json

Evidence Pack Contents

An evidence pack may include:

event records;

hashes;

signatures;

manifest;

runtime metadata;

verification result;

audit note;

timestamp;

repository commit reference.


Completion Criteria

v0.5 is complete when the runtime can:

sign event records;

verify signatures;

create evidence packs;

export audit-ready bundles;

preserve integrity without exposing secrets.



---

9. v0.6 — Runtime Dashboard

Objective

Create a dashboard for runtime state, EVT chain, governance decisions and audit status.

Core Features

runtime status view;

event list;

event detail page;

decision summary;

risk summary;

verification status;

degraded mode status;

audit-ready display;

public and internal display modes.


Suggested Routes

/dashboard
/events
/events/[id]
/verify

Suggested Files

app/dashboard/page.tsx
app/events/page.tsx
app/events/[id]/page.tsx
components/EventCard.tsx
components/RuntimeStatus.tsx
components/GovernancePanel.tsx

Completion Criteria

v0.6 is complete when a reviewer can inspect:

runtime status;

recent events;

event chain;

risk classes;

decisions;

verification state;

fail-closed events.



---

10. v0.7 — B2B and B2G Documentation Package

Objective

Create a professional documentation package for enterprises, public administrations and institutional stakeholders.

Core Documents

docs/B2B_OVERVIEW.md
docs/B2G_OVERVIEW.md
docs/INSTITUTIONAL_USE_CASES.md
docs/CRITICAL_INFRASTRUCTURE_USE_CASES.md
docs/AI_GOVERNANCE_USE_CASES.md
docs/DEFENSIVE_SECURITY_USE_CASES.md
docs/COMPLIANCE_MAPPING.md

Target Audiences

enterprises;

public administrations;

cybersecurity teams;

critical infrastructure operators;

cloud providers;

research centers;

institutional technology programs;

European strategic infrastructure initiatives.


Completion Criteria

v0.7 is complete when the repository can be presented to external stakeholders with:

technical clarity;

governance clarity;

safe dual-use positioning;

concrete use cases;

clear non-offensive boundary.



---

11. v0.8 — Federation and Node Registry

Objective

Define a federated architecture for multiple AI JOKER-C2 nodes.

Core Features

node registry;

node identity;

node role;

node status;

origin node;

institutional node;

enterprise node;

audit node;

research node;

critical systems node.


Suggested Files

registry/nodes.json
registry/schema.json
docs/FEDERATION_MODEL.md
docs/NODE_REGISTRY.md
lib/node-registry.ts

Node Types

Node	Function

Origin node	Primary canonical runtime
Institutional node	Public-sector or regulated deployment
Enterprise node	B2B deployment
Audit node	Verification and evidence review
Research node	Academic or experimental environment
Critical systems node	Controlled resilience and continuity context


Completion Criteria

v0.8 is complete when the project can describe and validate:

node identity;

node role;

node governance boundary;

node status;

node relation to EVT continuity.



---

12. v0.9 — Compliance-Oriented Operational Package

Objective

Prepare the project for structured compliance-oriented use without claiming legal certification.

Core Features

AI governance mapping;

cybersecurity governance mapping;

data governance notes;

human oversight model;

risk register template;

audit checklist;

incident report template;

compliance disclaimer.


Suggested Files

docs/AI_GOVERNANCE_MAPPING.md
docs/CYBERSECURITY_GOVERNANCE_MAPPING.md
docs/HUMAN_OVERSIGHT_MODEL.md
docs/RISK_REGISTER_TEMPLATE.md
docs/AUDIT_CHECKLIST.md
docs/INCIDENT_REPORT_TEMPLATE.md
docs/COMPLIANCE_DISCLAIMER.md

Completion Criteria

v0.9 is complete when the repository supports:

compliance-oriented discussion;

audit preparation;

risk documentation;

human oversight documentation;

institutional review;

lawful deployment planning.



---

13. v1.0 — Governed Operational Release Candidate

Objective

Release AI JOKER-C2 as a stable governed operational runtime candidate.

Required Capabilities

stable interface;

working chat runtime;

controlled file handling;

policy engine;

risk engine;

decision layer;

EVT generation;

append-only ledger;

verification endpoint;

basic dashboard;

security policy;

dual-use boundary;

architecture documentation;

governance documentation;

B2B and B2G documentation package.


Release Criteria

v1.0 may be declared only when:

the project builds successfully;

core routes work;

runtime identity is stable;

governance decisions are implemented;

EVT chain is operational;

fail-closed behavior exists;

security boundaries are documented;

prohibited use cases are blocked or clearly out of scope;

public documentation is coherent;

secrets are not present in repository;

deployment configuration is clean.


v1.0 Statement

AI JOKER-C2 v1.0 is a governed operational AI runtime for identity-bound, policy-aware, risk-classified, event-traceable and fail-closed AI-assisted operations.


---

14. Implementation Priority

Recommended immediate priority order:

Priority	Work Item

1	Complete repository documentation layer
2	Refactor runtime identity and diagnostic structure
3	Implement context classifier
4	Implement policy engine
5	Implement risk engine
6	Implement decision object
7	Implement EVT generator
8	Implement append-only ledger
9	Implement verifier endpoint
10	Build runtime dashboard


This order avoids building advanced features before governance exists.


---

15. Engineering Principles

Development should follow these principles:

1. Build small stable modules.


2. Preserve identity context.


3. Avoid hidden execution.


4. Classify risk before sensitive output.


5. Preserve fail-closed behavior.


6. Generate EVT records for relevant operations.


7. Avoid silent mutation of historical events.


8. Keep public communication readable.


9. Keep secrets out of source control.


10. Preserve defensive and non-offensive boundaries.


11. Prefer clear code over clever code.


12. Prefer deterministic records over vague logs.


13. Preserve human accountability.


14. Make verification possible.


15. Make future audit possible.




---

16. Documentation Principles

Documentation must remain:

clear;

technical;

institutional;

non-offensive;

implementation-oriented;

consistent with MATRIX;

consistent with HBCE;

consistent with IPR;

consistent with EVT;

consistent with fail-closed governance.


Documentation must not exaggerate production readiness.

Documentation must distinguish:

prototype;

research architecture;

governance model;

operational runtime;

future deployment scenario.



---

17. Security Principles

Security development must preserve:

secret hygiene;

safe file handling;

controlled API behavior;

defensive security boundary;

dependency hygiene;

safe logging;

non-exposure of private data;

no offensive capability;

no unauthorized target behavior;

fail-closed sensitive execution.


Security is part of the architecture.

It is not an external patch.


---

18. Governance Invariants

The following invariants must remain stable across roadmap phases:

AI JOKER-C2 is not a generic chatbot.
AI JOKER-C2 is identity-bound.
MATRIX provides the strategic framework.
HBCE provides the governance infrastructure.
IPR provides identity.
EVT provides trace.
Ledger provides continuity.
Policy provides boundary.
Risk provides classification.
Decision provides control.
Verification provides accountability.
Fail-closed provides safety.
Human accountability is preserved.
Offensive use is outside scope.


---

19. Out-of-Scope Development

The following development directions are out of scope:

offensive cyber tooling;

autonomous weaponization;

exploit deployment;

malware creation;

credential theft;

evasion tooling;

unauthorized surveillance;

targeting systems;

coercive manipulation;

disinformation operations;

sabotage functions;

uncontrolled autonomous execution;

secret extraction;

bypass of governance or safety boundaries.


Any contribution that moves the repository in these directions should be rejected or redesigned.


---

20. Success Metrics

The project should be evaluated through operational and governance metrics.

Metric	Meaning

Build success	The project builds without errors
Runtime availability	Interface and API routes operate correctly
Governance coverage	Sensitive paths pass through policy and risk logic
EVT coverage	Relevant operations generate traceable events
Verification coverage	Events can be inspected and validated
Security hygiene	No secrets or unsafe patterns in repository
Documentation clarity	External readers understand scope and boundary
Non-offensive integrity	Project remains defensive and governance-oriented
B2B/B2G readiness	Documentation supports institutional review
Human accountability	The runtime does not replace responsible operators



---

21. Suggested Milestone Labels

Recommended GitHub milestone labels:

v0.1-runtime-prototype
v0.2-governance-docs
v0.3-policy-risk-engine
v0.4-evt-ledger-verifier
v0.5-signed-evidence-pack
v0.6-runtime-dashboard
v0.7-b2b-b2g-package
v0.8-federated-nodes
v0.9-compliance-package
v1.0-governed-release-candidate

Recommended issue labels:

architecture
governance
security
runtime
evt
ledger
verification
documentation
b2b
b2g
matrix
hbce
fail-closed
risk-engine
policy-engine


---

22. Current Priority

Current priority:

Complete the documentation and governance layer.
Then implement the runtime policy, risk, EVT and verifier layers.

Immediate next files after this roadmap:

COMPLIANCE.md
PROTOCOL.md
CONTRIBUTING.md
docs/AI_GOVERNANCE_MAPPING.md
docs/B2B_OVERVIEW.md
docs/B2G_OVERVIEW.md

Immediate next code modules after documentation:

lib/context-classifier.ts
lib/policy-engine.ts
lib/risk-engine.ts
lib/runtime-decision.ts
lib/evt.ts
lib/evt-ledger.ts
lib/evt-hash.ts


---

23. Final Roadmap Formula

v0.1 = runtime exists
v0.2 = governance is defined
v0.3 = policy and risk are computed
v0.4 = EVT is recorded
v0.5 = evidence is signed
v0.6 = runtime is visible
v0.7 = stakeholders can understand it
v0.8 = nodes can federate
v0.9 = compliance can be discussed
v1.0 = governed operational release candidate

Condensed:

Runtime -> Governance -> Policy -> Risk -> EVT -> Ledger -> Evidence -> Dashboard -> Federation -> Compliance -> Release


---

24. Status

Document status: active roadmap
Project: AI JOKER-C2
Framework: MATRIX
Infrastructure: HBCE
Identity layer: IPR
Trace layer: EVT
Governance principle: fail-closed
Security boundary: defensive and non-offensive
Repository: hbce-ai-joker-c2
Maintainer: HBCE Research
Organization: HERMETICUM B.C.E. S.r.l.
Territorial anchor: Torino, Italy, Europe
Year: 2026

