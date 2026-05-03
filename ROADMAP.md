# AI JOKER-C2 Roadmap

## Development Roadmap for MATRIX, CORPUS and APOKALYPSIS

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This roadmap defines the development path of AI JOKER-C2.

AI JOKER-C2 is the identity-bound cognitive command runtime of the HERMETICUM B.C.E. ecosystem.

It connects three primary domains:

1. MATRIX
2. CORPUS ESOTEROLOGIA ERMETICA
3. APOKALYPSIS

The roadmap is designed to evolve the project from a working prototype into a governed, traceable and verifiable AI runtime for civil, institutional, strategic, B2B and B2G use cases.

The project must remain:

- identity-bound;
- project-domain aware;
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
MATRIX = operational infrastructure
CORPUS ESOTEROLOGIA ERMETICA = disciplinary grammar
APOKALYPSIS = historical threshold analysis
AI JOKER-C2 = cognitive command runtime
HBCE = governance infrastructure
IPR = identity layer
EVT = trace layer
Ledger = continuity layer
Verification = audit and reconstruction layer
Fail-closed = safety boundary

The long-term objective is to transform AI-assisted operations into verifiable operational sequences.

The core runtime sequence is:

Identity -> Input -> Intent -> Context -> Project Domain -> Policy -> Risk -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity

The roadmap must not convert the system into an offensive platform.

Development must strengthen governance, traceability, project-domain classification, safe operational control and human accountability.


---

3. Roadmap Overview

Phase	Objective	Status

v0.1	Working AI runtime with interface, chat and basic diagnostics	Active prototype
v0.2	Governance documentation and strategic dual-use boundary	In progress
v0.3	Project-domain classifier, policy engine and risk classifier	Planned
v0.4	Append-only EVT ledger and verification endpoint	Planned
v0.5	Signed EVT records and evidence packs	Planned
v0.6	Runtime dashboard for project domains, events, audit and system state	Planned
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

preserve public usability;

preserve non-offensive positioning.


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

Formalize AI JOKER-C2 as a governed, non-offensive, civil and strategic dual-use runtime connected to MATRIX, CORPUS ESOTEROLOGIA ERMETICA and APOKALYPSIS.

Core Features

strategic dual-use positioning;

governance model;

fail-closed principle;

EVT protocol;

security policy;

compliance orientation;

repository README refactor;

architecture formalization;

operational protocol;

system manifest;

clear distinction between defensive and prohibited use;

canonical project-domain definition.


Governance Requirements

define ALLOW, BLOCK, ESCALATE, DEGRADE, AUDIT and NOOP;

define risk classes;

define context classes;

define project-domain classes;

define non-offensive boundary;

define fail-closed triggers;

define event trace requirements;

define compliance-oriented limitations;

define human accountability requirements.


Deliverables

README.md

ARCHITECTURE.md

GOVERNANCE.md

EVT_PROTOCOL.md

PROTOCOL.md

DUAL_USE_STRATEGIC_POSITIONING.md

SECURITY.md

COMPLIANCE.md

ROADMAP.md

system/system-manifest.json


Completion Criteria

v0.2 is complete when the repository clearly explains:

what AI JOKER-C2 is;

what AI JOKER-C2 is not;

how MATRIX, CORPUS and APOKALYPSIS are connected;

how governance works;

how project-domain classification works;

how EVT works;

how fail-closed works;

how the project is positioned for civil, institutional and strategic use;

why the repository remains defensive and non-offensive.



---

6. v0.3 — Project-Domain Classifier, Policy Engine and Risk Classifier

Objective

Implement a runtime classifier that detects the active project domain and applies policy and risk logic before sensitive output generation.

Core Features

context classification;

project-domain classification;

intent classification;

risk classification;

policy evaluation;

governance decision generation;

prohibited request detection;

safe degraded response;

structured diagnostic object;

project-domain metadata in runtime response;

safe public diagnostics.


Project Domains

Domain	Meaning

MATRIX	Operational infrastructure, AI governance, Europe, B2B, B2G, cloud, data, energy, security
CORPUS_ESOTEROLOGIA_ERMETICA	Disciplinary grammar, DCTT, canonical glossary, theoretical volumes
APOKALYPSIS	Historical threshold, decay, exposure, cultural-political-social system analysis
GENERAL	No specific project domain applies
MULTI_DOMAIN	More than one project domain applies


Suggested Runtime Decisions

Decision	Meaning

ALLOW	Operation may proceed
BLOCK	Operation is unsafe or prohibited
ESCALATE	Human review or authority required
DEGRADE	Limited safe response only
AUDIT	Record or review before continuation
NOOP	No operational action taken


Suggested Risk Classes

Risk	Meaning

LOW	Ordinary safe request
MEDIUM	Operationally relevant request
HIGH	Sensitive or strategic request
CRITICAL	Requires strict review
PROHIBITED	Must be blocked
UNKNOWN	Cannot be safely classified


Suggested Files

lib/context-classifier.ts

lib/project-domain-classifier.ts

lib/intent-classifier.ts

lib/policy-engine.ts

lib/risk-engine.ts

lib/runtime-decision.ts

lib/runtime-types.ts


Completion Criteria

v0.3 is complete when the runtime can:

classify context;

classify project domain;

classify intent;

assign risk;

generate a governance decision;

block prohibited requests;

degrade uncertain sensitive outputs;

expose safe diagnostics;

preserve project-domain metadata in EVT-ready format.



---

7. v0.4 — Append-Only EVT Ledger and Verifier

Objective

Create an append-only event ledger and verification endpoint.

Core Features

local EVT generation;

project-domain field in EVT;

previous event reference;

deterministic event object;

SHA-256 hash;

append-only JSONL ledger;

basic verifier endpoint;

public-safe event view;

internal event structure;

correction events instead of silent rewrites.


Suggested Files

lib/evt.ts

lib/evt-ledger.ts

lib/evt-hash.ts

lib/evt-verify.ts

lib/evt-types.ts

app/api/evt/route.ts

app/api/verify/route.ts

ledger/events.jsonl


Ledger Rule

Historical events must not be silently rewritten.

Corrections must be represented as new events.

Completion Criteria

v0.4 is complete when the runtime can:

create an EVT;

assign project domain to the EVT;

link it to the previous event;

hash the canonical event object;

append it to a ledger;

verify event consistency;

expose public-safe verification output;

record blocked, degraded and escalated operations when appropriate.



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

exportable audit bundle;

repository commit reference;

project-domain evidence metadata.


Suggested Files

lib/signing.ts

lib/evidence-pack.ts

lib/manifest.ts

lib/evidence-types.ts

app/api/evidence/route.ts

evidence/PACK_MANIFEST.json

evidence/README.md


Evidence Pack Contents

An evidence pack may include:

event records;

hashes;

signatures;

manifest;

runtime metadata;

project-domain metadata;

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

preserve integrity without exposing secrets;

distinguish public evidence from internal evidence.



---

9. v0.6 — Runtime Dashboard

Objective

Create a dashboard for runtime state, project domains, EVT chain, governance decisions and audit status.

Core Features

runtime status view;

project-domain status view;

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

/domains


Suggested Files

app/dashboard/page.tsx

app/events/page.tsx

app/events/[id]/page.tsx

app/domains/page.tsx

components/EventCard.tsx

components/RuntimeStatus.tsx

components/GovernancePanel.tsx

components/ProjectDomainPanel.tsx


Completion Criteria

v0.6 is complete when a reviewer can inspect:

runtime status;

active project domain;

recent events;

event chain;

risk classes;

decisions;

verification state;

fail-closed events;

audit status.



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

docs/MATRIX_OVERVIEW.md

docs/CORPUS_OVERVIEW.md

docs/APOKALYPSIS_OVERVIEW.md


Target Audiences

enterprises;

public administrations;

cybersecurity teams;

critical infrastructure operators;

cloud providers;

research centers;

institutional technology programs;

European strategic infrastructure initiatives;

editorial and research organizations;

AI governance teams.


Completion Criteria

v0.7 is complete when the repository can be presented to external stakeholders with:

technical clarity;

governance clarity;

safe dual-use positioning;

concrete use cases;

clear non-offensive boundary;

clear B2B value proposition;

clear B2G value proposition;

clear distinction between MATRIX, CORPUS and APOKALYPSIS.



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

critical systems node;

project-domain permissions per node;

node-level fail-closed boundary.


Suggested Files

registry/nodes.json

registry/schema.json

docs/FEDERATION_MODEL.md

docs/NODE_REGISTRY.md

lib/node-registry.ts

lib/node-types.ts


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

node relation to EVT continuity;

node relation to MATRIX, CORPUS and APOKALYPSIS.



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

compliance disclaimer;

dual-use risk register;

project-domain governance map.


Suggested Files

docs/AI_GOVERNANCE_MAPPING.md

docs/CYBERSECURITY_GOVERNANCE_MAPPING.md

docs/HUMAN_OVERSIGHT_MODEL.md

docs/RISK_REGISTER_TEMPLATE.md

docs/AUDIT_CHECKLIST.md

docs/INCIDENT_REPORT_TEMPLATE.md

docs/COMPLIANCE_DISCLAIMER.md

docs/DUAL_USE_RISK_REGISTER.md

docs/PROJECT_DOMAIN_GOVERNANCE_MAP.md


Completion Criteria

v0.9 is complete when the repository supports:

compliance-oriented discussion;

audit preparation;

risk documentation;

human oversight documentation;

institutional review;

lawful deployment planning;

project-domain review;

clear non-certification statement.



---

13. v1.0 — Governed Operational Release Candidate

Objective

Release AI JOKER-C2 as a stable governed operational runtime candidate.

Required Capabilities

stable interface;

working chat runtime;

controlled file handling;

project-domain classifier;

context classifier;

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

B2B and B2G documentation package;

compliance-oriented operational package.


Release Criteria

v1.0 may be declared only when:

the project builds successfully;

core routes work;

runtime identity is stable;

project-domain classification is implemented;

governance decisions are implemented;

EVT chain is operational;

fail-closed behavior exists;

security boundaries are documented;

prohibited use cases are blocked or clearly out of scope;

public documentation is coherent;

secrets are not present in repository;

deployment configuration is clean;

human accountability is preserved.


v1.0 Statement

AI JOKER-C2 v1.0 is a governed operational AI runtime for identity-bound, project-aware, policy-aware, risk-classified, event-traceable and fail-closed AI-assisted operations across MATRIX, CORPUS ESOTEROLOGIA ERMETICA and APOKALYPSIS.


---

14. Immediate Implementation Priority

Recommended immediate priority order:

Priority	Work Item

1	Complete repository documentation layer
2	Refactor runtime identity and diagnostic structure
3	Implement project-domain classifier
4	Implement context classifier
5	Implement intent classifier
6	Implement policy engine
7	Implement risk engine
8	Implement decision object
9	Implement EVT generator
10	Implement append-only ledger
11	Implement verifier endpoint
12	Build runtime dashboard
13	Build B2B and B2G documentation package
14	Prepare compliance-oriented operational package


This order avoids building advanced features before governance exists.

The immediate next step after documentation is the project-domain classifier.


---

15. Engineering Principles

Development should follow these principles:

1. Build small stable modules.


2. Preserve identity context.


3. Preserve project-domain context.


4. Avoid hidden execution.


5. Classify domain before sensitive output.


6. Classify risk before sensitive output.


7. Preserve fail-closed behavior.


8. Generate EVT records for relevant operations.


9. Avoid silent mutation of historical events.


10. Keep public communication readable.


11. Keep secrets out of source control.


12. Preserve defensive and non-offensive boundaries.


13. Prefer clear code over clever code.


14. Prefer deterministic records over vague logs.


15. Preserve human accountability.


16. Make verification possible.


17. Make future audit possible.


18. Keep MATRIX, CORPUS and APOKALYPSIS distinct but integrated.




---

16. Documentation Principles

Documentation must remain:

clear;

technical;

institutional;

non-offensive;

implementation-oriented;

consistent with MATRIX;

consistent with CORPUS ESOTEROLOGIA ERMETICA;

consistent with APOKALYPSIS;

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

future deployment scenario;

internal conceptual framework;

external compliance claim.



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

fail-closed sensitive execution;

project-domain classification in sensitive contexts.


Security is part of the architecture.

It is not an external patch.


---

18. Governance Invariants

The following invariants must remain stable across roadmap phases:

1. AI JOKER-C2 is not a generic chatbot.


2. AI JOKER-C2 is identity-bound.


3. MATRIX provides the operational infrastructure domain.


4. CORPUS ESOTEROLOGIA ERMETICA provides the disciplinary grammar domain.


5. APOKALYPSIS provides the historical threshold domain.


6. HBCE provides the governance infrastructure.


7. IPR provides identity.


8. EVT provides trace.


9. Ledger provides continuity.


10. Policy provides boundary.


11. Risk provides classification.


12. Decision provides control.


13. Verification provides accountability.


14. Fail-closed provides safety.


15. Human accountability is preserved.


16. Offensive use is outside scope.


17. Project-domain metadata must be preserved.


18. Internal conceptual coherence must not be presented as external certification.


19. The model layer must not become the authority layer.


20. Corrections must be recorded as new events.




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

bypass of governance or safety boundaries;

bypass of project-domain classification;

bypass of human accountability;

use of CORPUS or APOKALYPSIS framing for coercion, abuse or destabilization.


Any contribution that moves the repository in these directions should be rejected or redesigned.


---

20. Success Metrics

The project should be evaluated through operational and governance metrics.

Metric	Meaning

Build success	The project builds without errors
Runtime availability	Interface and API routes operate correctly
Domain coverage	MATRIX, CORPUS and APOKALYPSIS are classified correctly
Governance coverage	Sensitive paths pass through policy and risk logic
EVT coverage	Relevant operations generate traceable events
Verification coverage	Events can be inspected and validated
Security hygiene	No secrets or unsafe patterns in repository
Documentation clarity	External readers understand scope and boundary
Non-offensive integrity	Project remains defensive and governance-oriented
B2B readiness	Documentation supports enterprise review
B2G readiness	Documentation supports institutional review
Compliance orientation	Repository supports audit discussion without certification claims
Human accountability	The runtime does not replace responsible operators



---

21. Suggested Milestone Labels

Recommended GitHub milestone labels:

v0.1-runtime-prototype
v0.2-governance-docs
v0.3-domain-policy-risk-engine
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
corpus
apokalypsis
hbce
fail-closed
risk-engine
policy-engine
project-domain-classifier
compliance
human-oversight


---

22. Current Priority

Current priority:

Complete the documentation and governance layer.
Then implement the project-domain classifier, runtime policy, risk, EVT and verifier layers.

Immediate next documentation files:

CONTRIBUTING.md

docs/B2B_OVERVIEW.md

docs/B2G_OVERVIEW.md

docs/AI_GOVERNANCE_MAPPING.md

docs/PROJECT_DOMAIN_GOVERNANCE_MAP.md


Immediate next code modules after documentation:

lib/project-domain-classifier.ts

lib/context-classifier.ts

lib/intent-classifier.ts

lib/policy-engine.ts

lib/risk-engine.ts

lib/runtime-decision.ts

lib/evt.ts

lib/evt-ledger.ts

lib/evt-hash.ts

lib/evt-verify.ts


Immediate next interface improvements:

show active project domain;

show active context class;

show governance decision;

show risk class;

show EVT identifier;

show verification status;

show degraded/fail-closed state when relevant.



---

23. Code Implementation Sequence

The recommended code implementation sequence is:

1. runtime types
2. project-domain classifier
3. context classifier
4. intent classifier
5. policy engine
6. risk engine
7. runtime decision object
8. EVT generator
9. EVT hash
10. append-only ledger
11. EVT verifier
12. API integration
13. interface display
14. dashboard
15. evidence packs

Suggested first implementation target:

lib/project-domain-classifier.ts

Reason:

AI JOKER-C2 must know whether it is operating inside MATRIX, CORPUS, APOKALYPSIS, GENERAL or MULTI_DOMAIN before governance decisions can be fully meaningful.


---

24. Documentation Completion Sequence

The recommended documentation completion sequence is:

1. README.md
2. ARCHITECTURE.md
3. system/system-manifest.json
4. GOVERNANCE.md
5. EVT_PROTOCOL.md
6. PROTOCOL.md
7. DUAL_USE_STRATEGIC_POSITIONING.md
8. SECURITY.md
9. COMPLIANCE.md
10. ROADMAP.md
11. CONTRIBUTING.md
12. docs/PROJECT_DOMAIN_GOVERNANCE_MAP.md
13. docs/B2B_OVERVIEW.md
14. docs/B2G_OVERVIEW.md
15. docs/AI_GOVERNANCE_MAPPING.md

The documentation layer is not decorative.

It defines the operational frame that the code must implement.


---

25. Final Roadmap Formula

v0.1 = runtime exists
v0.2 = governance is defined
v0.3 = domain, policy and risk are computed
v0.4 = EVT is recorded
v0.5 = evidence is signed
v0.6 = runtime is visible
v0.7 = stakeholders can understand it
v0.8 = nodes can federate
v0.9 = compliance can be discussed
v1.0 = governed operational release candidate

Condensed:

Runtime -> Governance -> Project Domain -> Policy -> Risk -> EVT -> Ledger -> Evidence -> Dashboard -> Federation -> Compliance -> Release

Project formula:

MATRIX = infrastructure.
CORPUS ESOTEROLOGIA ERMETICA = grammar.
APOKALYPSIS = threshold.
AI JOKER-C2 = runtime.


---

26. Status

Field	Value

Document	ROADMAP.md
Status	Active roadmap
Project	AI JOKER-C2
Ecosystem	HERMETICUM B.C.E.
Connected domains	MATRIX, CORPUS ESOTEROLOGIA ERMETICA, APOKALYPSIS
Infrastructure	HBCE
Identity layer	IPR
Trace layer	EVT
Ledger layer	Append-only continuity
Verification layer	Hash and audit reconstruction
Governance principle	Fail-closed
Security boundary	Defensive and non-offensive
Compliance status	Orientation only, not certification
Repository	hbce-ai-joker-c2
Maintainer	HBCE Research
Organization	HERMETICUM B.C.E. S.r.l.
Territorial anchor	Torino, Italy, Europe
Year	2026




