# AI JOKER-C2 Architecture

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the architecture of AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

It is not a generic chatbot.

It is a governed operational system designed to transform user requests, documents, code, strategic analysis and technical workflows into structured, traceable and usable outputs.

The architecture is based on the following principle:

```txt
identity -> input -> intent -> policy -> risk -> decision -> execution -> EVT -> ledger -> verification -> continuity

The system must remain:

identity-bound;

policy-aware;

risk-classified;

traceable;

auditable;

fail-closed;

useful in ordinary communication;

controlled in sensitive contexts.



---

2. Architectural Definition

AI JOKER-C2 is the operational runtime of the MATRIX and HBCE framework.

The conceptual hierarchy is:

MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = event trace layer
Ledger = continuity layer
Fail-closed = safety boundary

The system operates as a controlled interface between:

user input;

AI model execution;

project identity;

governance rules;

event generation;

evidence preservation;

operational continuity.


AI JOKER-C2 must always preserve the difference between ordinary output generation and governed operational execution.


---

3. Core Architectural Formula

The canonical architecture is:

MATRIX -> HBCE -> AI JOKER-C2 -> IPR -> Policy -> Risk -> Decision -> EVT -> Verification

Expanded:

Layer	Function

MATRIX	Strategic framework for European-oriented AI governance and critical systems continuity
HBCE	Governance infrastructure for identity, traceability and operational control
AI JOKER-C2	Operational runtime and user-facing interface
IPR	Identity Primary Record binding the runtime to a canonical identity
Policy	Rules defining what is permitted, restricted or prohibited
Risk	Classification of operational, technical, legal and strategic sensitivity
Decision	ALLOW, BLOCK, ESCALATE, DEGRADE or AUDIT
EVT	Event record generated for relevant operations
Verification	Auditability, reconstruction and evidence review



---

4. System Identity

AI JOKER-C2 operates with the following canonical identity context.

Field	Value

Public name	AI JOKER-C2
Entity	AI_JOKER
IPR	IPR-AI-0001
Active checkpoint	EVT-0014-AI
Core	HBCE-CORE-v3
Organization	HERMETICUM B.C.E. S.r.l.
Territorial anchor	Torino, Italy, Europe
Framework	MATRIX
Infrastructure	HBCE


Identity is not decorative.

Identity is the first architectural layer.

Every relevant operation must remain conceptually bound to a responsible runtime identity and to a traceable operational sequence.


---

5. Runtime Stack

The current runtime stack is based on:

Component	Role

Next.js	Application framework
TypeScript	Runtime and API type structure
React	Interface layer
OpenAI API	Remote model execution
Vercel	Deployment target
GitHub	Source repository and version control
HBCE runtime logic	Governance, identity and operational framing
EVT chain	Event trace and continuity layer


The runtime may evolve, but the architecture must preserve the identity-bound and fail-closed governance model.


---

6. Repository Structure

Recommended repository structure:

hbce-ai-joker-c2/
├── app/
│   ├── page.tsx
│   ├── interface/
│   │   └── page.tsx
│   └── api/
│       ├── chat/
│       │   └── route.ts
│       └── files/
│           └── route.ts
├── docs/
├── lib/
├── system/
│   └── manifest.json
├── README.md
├── ARCHITECTURE.md
├── GOVERNANCE.md
├── EVT_PROTOCOL.md
├── DUAL_USE_STRATEGIC_POSITIONING.md
├── corpus-core.js
├── corpus-alien-code.js
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.mjs
├── vercel.json
├── next-env.d.ts
└── .gitignore

The architecture separates:

application surfaces;

API routes;

identity and corpus logic;

governance documentation;

system manifest;

deployment configuration.



---

7. Application Layer

The app/ directory contains the user-facing and API-facing application surfaces.

Primary responsibilities:

public landing interface;

operational chat interface;

API route execution;

file ingestion;

runtime diagnostics;

response generation.


Expected routes:

/
 /interface
 /api/chat
 /api/files

The application layer must remain readable and operational.

It must not expose sensitive internal governance metadata unless technically required or explicitly requested.


---

8. Interface Layer

The interface layer is the visible operational surface of AI JOKER-C2.

It should provide:

user input;

response display;

file context support;

runtime status display when needed;

EVT or diagnostic display when requested;

clean separation between ordinary use and technical mode.


The ordinary interface must prioritize usability.

The technical interface may expose:

runtime status;

decision state;

EVT chain;

model state;

file ingestion status;

degraded mode;

diagnostic messages.



---

9. API Layer

The API layer executes controlled runtime operations.

Primary API routes:

Route	Function

/api/chat	Handles user requests, model calls, fallback, EVT generation and response
/api/files	Handles uploaded textual files and session-level file context


The API layer should apply the following sequence:

receive request
normalize input
classify context
evaluate policy
classify risk
produce decision
execute allowed operation
generate response
generate EVT
return output

Sensitive operations must not bypass governance evaluation.


---

10. Chat Runtime

The chat runtime receives user requests and produces structured responses.

Responsibilities:

process user message;

read available file context;

classify request type;

choose model or fallback behavior;

produce answer;

generate EVT metadata;

return diagnostics when required.


The chat runtime must support both ordinary and technical conversations.

Ordinary mode:

clear;

useful;

direct;

not overloaded with internal metadata.


Technical mode:

exposes runtime details;

supports debugging;

shows identity, EVT, governance or architecture when requested.



---

11. File Runtime

The file runtime handles user-provided textual context.

Supported file-oriented functions:

upload;

temporary session context;

summarization;

extraction;

restructuring;

table generation;

editorial transformation;

technical review;

GitHub-ready output generation.


Recommended file types:

.txt
.md
.json
.csv

The system should avoid claiming complete visibility over unsupported, unreadable or partially processed files.

If file reading is partial, the system must state that limitation clearly.


---

12. Identity Layer

The identity layer binds AI JOKER-C2 to its canonical operational identity.

Canonical identity:

AI_JOKER / IPR-AI-0001 / EVT-0014-AI

The identity layer supports:

runtime attribution;

continuity;

governance context;

public project identity;

internal audit logic;

controlled communication.


Identity must not be confused with unrestricted authority.

Identity gives the runtime a traceable position.

It does not authorize unsafe execution.


---

13. MATRIX Layer

MATRIX is the strategic framework.

It defines the macro-level function of AI JOKER-C2:

verifiable AI governance;

operational continuity;

critical systems oversight;

institutional traceability;

B2B and B2G positioning;

European-oriented digital sovereignty;

fail-closed governance.


Within the architecture, MATRIX gives strategic direction.

AI JOKER-C2 performs operational execution.


---

14. HBCE Layer

HBCE is the governance infrastructure.

It provides the architectural grammar for:

identity;

operational trace;

continuity;

evidence;

verification;

runtime discipline;

fail-closed behavior.


HBCE is the internal control skeleton.

AI JOKER-C2 is the active runtime built on that skeleton.


---

15. IPR Layer

IPR means Identity Primary Record.

In this architecture, IPR functions as the identity anchor of the runtime.

The IPR layer should preserve:

entity name;

canonical identifier;

lineage reference;

checkpoint reference;

organizational context;

territorial anchor;

governance relation.


The IPR layer should be referenced by EVT records when relevant.

No relevant operational event should exist without identity context.


---

16. EVT Layer

EVT means Event.

The EVT layer records relevant operations as verifiable event objects.

Every significant operation may generate an EVT containing:

event identifier;

previous event reference;

timestamp;

entity;

IPR;

runtime state;

context class;

risk class;

governance decision;

operation result;

hash;

verification status.


EVT gives the runtime operational memory.

This memory is not conversational memory.

It is event continuity.


---

17. Ledger Layer

The ledger layer stores or references EVT records.

Possible implementations:

append-only JSONL;

file-based evidence log;

database table;

signed event registry;

external audit export;

hybrid evidence store.


The ledger must preserve:

event sequence;

previous event reference;

hash;

status;

correction events;

audit metadata.


Historical events should not be silently rewritten.

Corrections should become new events.


---

18. Governance Layer

The governance layer applies project rules before execution.

Primary governance decisions:

Decision	Meaning

ALLOW	Operation is permitted
BLOCK	Operation is prohibited or unsafe
ESCALATE	Human review or additional authority required
DEGRADE	Limited safe response only
AUDIT	Record or review required


Governance is mandatory for sensitive operations.

The system must not treat model output as automatically legitimate.


---

19. Risk Layer

The risk layer classifies requests.

Risk classes:

Risk	Meaning

LOW	Ordinary safe request
MEDIUM	Relevant but manageable operational request
HIGH	Sensitive, strategic or high-impact request
CRITICAL	Requires strict review or authority
PROHIBITED	Must be blocked
UNKNOWN	Cannot be safely classified


The runtime must never convert unknown risk into automatic execution.

Unknown sensitive risk should produce ESCALATE, DEGRADE or BLOCK.


---

20. Fail-Closed Layer

Fail-closed is a safety boundary.

The system must not proceed when core governance conditions are missing.

Fail-closed triggers include:

missing identity;

invalid runtime state;

unclear authority;

prohibited request;

unclassified risk;

missing policy;

unsafe technical output;

offensive cyber interpretation;

unlawful surveillance risk;

inability to generate EVT;

inability to preserve continuity;

legal or compliance uncertainty in sensitive contexts.


Fail-closed does not mean system failure.

It means controlled refusal or controlled limitation.


---

21. Model Layer

The model layer provides AI reasoning and generation.

The model may support:

writing;

analysis;

code review;

summarization;

classification;

architectural planning;

strategic drafting;

document transformation.


The model must not be treated as the governance authority.

Governance belongs to the runtime architecture.

The model produces output inside the governance frame.


---

22. Fallback Layer

The runtime should support degraded operation when the remote model is unavailable.

Degraded mode may provide:

local document summary;

basic diagnostic response;

static identity response;

controlled error explanation;

limited operational assistance.


Degraded mode must not expose unnecessary internal metadata.

Degraded mode must preserve:

clarity;

identity;

safety;

traceability where possible;

user-facing usefulness.



---

23. Security Boundary

AI JOKER-C2 must preserve a non-offensive security boundary.

Allowed technical support:

defensive analysis;

architecture review;

secure configuration;

code refactoring;

documentation;

incident report structuring;

risk mapping;

safe debugging;

compliance-oriented security guidance.


Prohibited technical support:

malware;

exploit deployment;

unauthorized access;

credential theft;

persistence mechanisms;

evasion techniques;

sabotage;

offensive automation;

instructions against real targets.


The architecture must support defensive and governance-oriented security only.


---

24. Dual-Use Boundary

AI JOKER-C2 is dual-use in a civil and strategic sense.

Authorized positioning:

AI governance;

public administration;

defensive cybersecurity;

cloud governance;

data governance;

critical infrastructure resilience;

institutional reporting;

operational continuity;

audit and evidence generation.


Prohibited positioning:

autonomous weapons;

offensive cyber operations;

unlawful surveillance;

targeting systems;

disinformation operations;

coercive manipulation;

repression of rights;

sabotage of infrastructure.


Dual-use means controlled, accountable and lawful strategic application.

It does not mean unrestricted capability.


---

25. Data Handling Architecture

The runtime should minimize unnecessary data exposure.

Principles:

use only necessary context;

avoid storing sensitive payloads unless required;

prefer references and hashes for large or sensitive content;

avoid exposing private metadata;

distinguish public and internal event records;

preserve file boundaries;

state uncertainty when visibility is incomplete.


Data handling must support the user without turning the system into an uncontrolled data sink.


---

26. Public Communication Architecture

AI JOKER-C2 must communicate naturally in ordinary use.

The runtime should not automatically expose:

complete lineage;

internal audit data;

hidden diagnostic structures;

raw governance objects;

excessive protocol language.


The system may expose those elements when the user asks for:

runtime;

debug;

IPR;

EVT;

ledger;

architecture;

governance;

verification;

fail-closed;

evidence;

protocol.


The interface must keep the internal machine-room available but not noisy.


---

27. Deployment Architecture

Primary deployment target:

Vercel

Required environment variable:

OPENAI_API_KEY

Optional environment variable:

JOKER_MODEL

Recommended operational environments:

Production;

Preview;

Development.


The build pipeline should preserve:

type safety;

environment separation;

secure secret handling;

deterministic deployment;

public repository hygiene.


Secrets must never be committed to the repository.


---

28. Build and Runtime Commands

Recommended commands:

npm install
npm run build
npm run start

Development command:

npm run dev

The project should remain buildable from the repository without undocumented local assumptions.

Any required environment variable must be documented.


---

29. Evidence Architecture

The evidence architecture should evolve in stages.

Stage 1:

local EVT generation;

previous event reference;

runtime hash;

visible diagnostic chain.


Stage 2:

append-only JSONL ledger;

schema validation;

audit export;

verification endpoint.


Stage 3:

signed EVT records;

ED25519 signatures;

evidence packs;

batch anchoring;

public/private verification modes.


Stage 4:

federated node registry;

B2B/B2G audit packages;

institutional reporting;

compliance mapping.


The evidence layer is the bridge between prototype and strategic infrastructure.


---

30. Verification Architecture

Verification should allow a reviewer to reconstruct:

what happened;

when it happened;

which identity was involved;

which policy was applied;

which risk class was assigned;

which decision was produced;

whether execution occurred;

which event came before;

whether the event hash is valid.


A verification endpoint may expose public-safe data only.

Internal verification may contain richer audit metadata.


---

31. Federation Architecture

Future versions may support a federated architecture.

Potential node types:

Node	Function

Origin node	Primary canonical runtime
Institutional node	Public-sector or regulated environment
Enterprise node	B2B deployment
Audit node	Verification and evidence review
Research node	Academic or prototype environment
Critical systems node	Controlled resilience and continuity context


Federation must not remove identity.

Every node must preserve:

local identity;

policy boundary;

risk classification;

EVT continuity;

verification capability;

fail-closed behavior.



---

32. Roadmap Architecture

Recommended roadmap:

Phase	Objective

v0.1	Stable runtime, chat, file ingestion, basic EVT chain
v0.2	Governance documents, dual-use boundary, architecture formalization
v0.3	Runtime policy engine and risk classifier
v0.4	Append-only ledger and verifier endpoint
v0.5	Signed EVT records and evidence packs
v0.6	Dashboard for events, audit and runtime state
v0.7	B2B/B2G documentation package
v1.0	Governed operational release candidate


The roadmap must remain aligned with safe, non-offensive and verifiable use.


---

33. Architectural Invariants

The following invariants must remain stable:

1. AI JOKER-C2 is not a generic chatbot.


2. AI JOKER-C2 is identity-bound.


3. MATRIX provides strategic framework.


4. HBCE provides governance infrastructure.


5. IPR provides identity anchor.


6. EVT provides event trace.


7. Ledger provides continuity.


8. Risk classification precedes sensitive execution.


9. Policy checks are mandatory for sensitive contexts.


10. Fail-closed is a safety boundary.


11. Human accountability must be preserved.


12. Public communication must remain useful and readable.


13. Offensive, abusive or unlawful use is outside scope.


14. Evidence generation must support reconstruction.


15. Corrections must be new events, not silent rewrites.




---

34. Final Architecture Formula

MATRIX gives the strategic frame.
HBCE gives the governance infrastructure.
AI JOKER-C2 gives the operational runtime.
IPR gives identity.
Policy gives boundary.
Risk gives classification.
Decision gives control.
EVT gives trace.
Ledger gives continuity.
Verification gives accountability.
Fail-closed gives safety.

Condensed formula:

Identity -> Policy -> Risk -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity


---

35. Status

Document status: active architecture file
Project: AI JOKER-C2
Framework: MATRIX
Infrastructure: HBCE
Identity layer: IPR
Trace layer: EVT
Governance principle: fail-closed
Deployment target: Vercel
Repository: hbce-ai-joker-c2
Maintainer: HBCE Research
Organization: HERMETICUM B.C.E. S.r.l.
Territorial anchor: Torino, Italy, Europe
Year: 2026
