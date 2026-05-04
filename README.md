# AI JOKER-C2

**AI JOKER-C2** is the governed runtime interface of the **B.C.E.Hermeticum** framework.

It extends standard AI interaction with operational identity, runtime governance, event continuity, memory traceability and auditable proof records.

AI JOKER-C2 is developed as part of the HBCE research and software ecosystem by:

```txt
HERMETICUM B.C.E. S.r.l.
HBCE Research
Torino, Italy, Europe


---

1. Project status

Project: AI JOKER-C2
Runtime identity: AI_JOKER
Runtime IPR: IPR-AI-0001
Core: HBCE-CORE-v3
Primary domain: MATRIX
Operational stack: HBCE Operational Stack v0.1
Status: active prototype / research runtime

AI JOKER-C2 is currently being extended from a conversational AI interface into an auditable HBCE runtime.

The current runtime can already generate:

AI response
EVT event
EVT/IPR-bound memory event
Governed runtime event
OPC proof record
Audit-oriented proof receipt


---

2. What AI JOKER-C2 is

AI JOKER-C2 is not designed as a generic chatbot.

It is a governed runtime layer that connects:

input
→ context classification
→ policy evaluation
→ risk evaluation
→ runtime decision
→ AI response
→ EVT event
→ memory update
→ OPC proof record
→ audit trail

The system is built around the following principle:

Standard AI answers.
AI JOKER-C2 produces governed operational traces.

Each relevant interaction can be:

bound to an operational identity;

classified by project domain;

evaluated by policy and risk logic;

converted into an EVT event;

connected to memory continuity;

transformed into an OPC proof record;

exposed through an audit-oriented interface.



---

3. Core architecture

AI JOKER-C2 currently uses the following runtime layers.

3.1 IPR — Identity Primary Record

IPR means Identity Primary Record.

IPR is not a simple login, credential, account or ordinary digital identity.

It is an operational identity record that connects:

subject;

origin;

responsibility;

derivation;

event;

evidence;

continuity;

time;

auditability.


In this runtime, the canonical identity is:

entity: AI_JOKER
ipr: IPR-AI-0001
core: HBCE-CORE-v3
organization: HERMETICUM B.C.E. S.r.l.

3.2 EVT — Event Record / Verifiable Event Trace

EVT is the event continuity layer.

Each relevant operation can generate an event containing:

event id;

previous event reference;

timestamp;

entity;

IPR;

runtime state;

decision;

context class;

document mode;

document family;

hash;

continuity reference.


EVT does not create legal certification by itself.

It provides a verifiable operational trace.

3.3 EVT/IPR-bound memory

AI JOKER-C2 uses memory as an operational trace, not as a vague chat memory.

Memory is bound to:

sessionId
IPR
entity
message
response
document family
runtime state
decision
memory event
governed EVT
hash

This allows the runtime to recover continuity across interactions and interpret references such as:

"this document"
"the previous answer"
"IPR"
"HBCE"
"MATRIX"
"APOKALYPSIS"
"the runtime"
"the audit trail"

3.4 OPC — Operational Proof & Compliance Layer

OPC means Operational Proof & Compliance Layer.

OPC generates proof records for runtime responses.

An OPC record links:

IPR;

entity;

session;

governed EVT;

memory event;

runtime decision;

policy reference;

risk class;

input hash;

output hash;

decision hash;

chain hash;

audit status;

verification status.


OPC does not create legal certification by default.

It creates a technical proof receipt for audit, verification and governance.

Example proof output:

OPC Proof Record
Proof: OPC-...
Chain: sha256:...
Audit: NOT_REQUIRED
Verify: VERIFIABLE
Append: APPENDED

3.5 MATRIX domain

MATRIX is the operational infrastructure domain of the system.

It covers:

AI governance;

European digital infrastructure;

B2B/B2G use cases;

public administration;

auditability;

identity governance;

strategic autonomy;

cybersecurity governance;

data governance;

institutional continuity;

operational traceability.


3.6 CORPUS ESOTEROLOGIA ERMETICA domain

The CORPUS domain preserves the theoretical and disciplinary grammar of the project.

Its core formula is:

Decisione · Costo · Traccia · Tempo

This domain is used for editorial, conceptual and theoretical work.

3.7 APOKALYPSIS domain

APOKALYPSIS is the historical-threshold analysis domain.

It handles:

decadimento;

esposizione;

dislocazione cognitiva;

rottura cognitiva;

crisi del sistema culturale, politico e sociale;

threshold analysis;

civilizational interpretation.


The runtime distinguishes APOKALYPSIS from generic apocalyptic language.


---

4. Runtime flow

The current runtime model is:

input
→ file
→ Joker state
→ ontology
→ policy/risk
→ EVT continuity
→ interpretation
→ response
→ new EVT
→ EVT/IPR memory
→ OPC proof record
→ audit trail

The target HBCE Operational Stack v0.1 flow is:

1. Receive user input and files
2. Resolve sessionId
3. Bind runtime identity through IPR
4. Retrieve EVT/IPR-bound memory
5. Classify project domain
6. Classify context and intent
7. Classify data
8. Evaluate file policy
9. Evaluate policy
10. Evaluate risk
11. Evaluate human oversight
12. Decide runtime action
13. Generate AI response
14. Create legacy EVT
15. Create governed EVT
16. Create semantic memory EVT
17. Create OPC proof record
18. Return response + EVT + memory + OPC proof receipt


---

5. Current API routes

5.1 Chat runtime

POST /api/chat

Main AI JOKER-C2 runtime endpoint.

It handles:

message input;

file context;

session continuity;

memory retrieval;

policy/risk evaluation;

OpenAI response generation;

EVT generation;

memory event generation;

OPC proof record generation.


5.2 OPC proof endpoint

GET /api/opc
POST /api/opc

The OPC endpoint reads and creates proof records.

Current prototype storage:

/tmp/hbce-ai-joker-c2-opc-proofs.jsonl

Important note:

On serverless deployments, /tmp is temporary and must not be treated as permanent production storage.

Future production storage should use:

Postgres
KV
object storage
append-only database
controlled audit storage

5.3 File context endpoint

POST /api/files
DELETE /api/files

Used by the interface to ingest and clear session files.


---

6. User interface

The main operational interface is:

/interface

The UI displays:

session id;

runtime state;

continuity reference;

last EVT;

last EVT hash;

last OPC proof;

OPC chain hash;

OPC audit status;

OPC verification status;

active files;

conversation turns.


Each assistant response may display:

EVT Chain
OPC Proof Record


---

7. Current visible proof flow

A successful response produces a visible structure like:

EVT Chain
EVT: EVT-...
Prev: ...
Hash: sha256:...

OPC Proof Record
Proof: OPC-...
Chain: sha256:...
Audit: NOT_REQUIRED
Verify: VERIFIABLE
Append: APPENDED

This means the runtime has created both:

EVT trace
OPC proof receipt


---

8. Environment variables

Required

OPENAI_API_KEY

Used to call the OpenAI model.

Optional

JOKER_MODEL

Default:

gpt-4o-mini

Optional OPC storage path

JOKER_OPC_LEDGER_FILE

If not provided, the runtime uses:

/tmp/hbce-ai-joker-c2-opc-proofs.jsonl

This is suitable only for prototype and runtime testing.


---

9. Local development

Install dependencies:

npm install

Run development server:

npm run dev

Build:

npm run build

Start production build:

npm run start


---

10. Repository structure

Main runtime files:

app/api/chat/route.ts
app/api/opc/route.ts
app/interface/page.tsx
lib/opc-proof.ts
lib/evt.ts
lib/evt-ledger.ts
lib/evt-memory.ts
lib/evt-memory-ledger.ts
lib/context-classifier.ts
lib/project-domain-classifier.ts
lib/safe-concept-classifier.ts
lib/data-classifier.ts
lib/file-policy.ts
lib/policy-engine.ts
lib/risk-engine.ts
lib/human-oversight.ts
lib/runtime-decision.ts
lib/runtime-types.ts

Documentation:

docs/HBCE_OPERATIONAL_STACK.md


---

11. OPC proof record shape

An OPC proof record follows this conceptual shape:

{
  "proofId": "OPC-...",
  "kind": "OPERATIONAL_PROOF_RECORD",
  "timestamp": "2026-...",
  "identity": {
    "entity": "AI_JOKER",
    "ipr": "IPR-AI-0001",
    "core": "HBCE-CORE-v3",
    "organization": "HERMETICUM B.C.E. S.r.l."
  },
  "sessionId": "JOKER-...",
  "event": {
    "evt": "EVT-...",
    "prev": "EVT-...",
    "hash": "sha256:..."
  },
  "memory": {
    "evt": "EVT-MEM-...",
    "source": "EVT_IPR_MEMORY",
    "hash": "sha256:..."
  },
  "runtime": {
    "state": "OPERATIONAL",
    "decision": "ALLOW",
    "contextClass": "IDENTITY",
    "intentClass": "ASK",
    "riskClass": "LOW",
    "policyReference": "..."
  },
  "proof": {
    "inputHash": "sha256:...",
    "outputHash": "sha256:...",
    "decisionHash": "sha256:...",
    "eventHash": "sha256:...",
    "memoryHash": "sha256:...",
    "previousProofHash": "sha256:...",
    "chainHash": "sha256:..."
  },
  "audit": {
    "status": "NOT_REQUIRED",
    "reviewRequired": false,
    "reasons": []
  },
  "verification": {
    "status": "VERIFIABLE",
    "hashAlgorithm": "sha256",
    "canonicalization": "deterministic-json"
  }
}


---

12. Governance boundaries

AI JOKER-C2 is a technical and research runtime.

It does not claim:

legal certification;

regulatory approval;

official public-sector adoption;

institutional recognition;

automatic compliance;

legally binding evidence status.


It provides a technical basis for:

auditability;

traceability;

runtime governance;

operational identity;

proof receipts;

evidence-oriented design;

future legal and institutional review.


Any production deployment in public-sector, regulated or high-risk environments requires:

legal review
security review
privacy review
institutional approval
human oversight
external validation
persistent storage
access control
logging policy
retention policy


---

13. Digital voting and civic interaction boundary

AI JOKER-C2 can discuss digital voting and civic interaction only with strict democratic safeguards.

Correct principle:

Identity verified first.
Choice separated after.
Vote anonymized.
Process auditable.

IPR can verify identity and participation rights.

EVT can trace process integrity.

OPC can generate proof receipts for process operations.

But the content of a democratic vote must not be linked to the personal identity of the voter.

The system must distinguish:

electoral voting;

public consultation;

civic participation;

access to public services;

document interaction with institutions.



---

14. Economic and institutional value

The HBCE / IPR / EVT / OPC stack can support a new professional and institutional layer around:

IPR registration;

EVT audit;

OPC proof receipt management;

AI governance;

compliance operations;

B2B/B2G integration;

document verification;

institutional continuity;

audit trail review;

operational accountability.


Potential professional roles include:

IPR registration operator;

EVT auditor;

OPC proof record reviewer;

HBCE integrator;

AI governance technician;

B2B/B2G compliance consultant;

operational continuity manager;

document verification specialist;

digital audit specialist.


HBCE may be positioned as an infrastructure that can be integrated into national and European governance contexts, but it must not be described as already officially adopted unless independently validated.


---

15. Strategic positioning

Professional statement:

AI JOKER-C2 extends standard AI interaction with verifiable runtime governance: each relevant interaction can be bound to an operational identity, recorded as an event, hashed into a continuity chain, converted into an OPC proof record, and exposed through an audit-oriented interface.

Italian statement:

AI JOKER-C2 estende l’interazione AI standard con governance runtime verificabile: ogni interazione rilevante può essere collegata a un’identità operativa, registrata come evento, inserita in una catena di continuità, trasformata in proof record OPC ed esposta tramite un’interfaccia orientata all’audit.


---

16. Current milestone

Current milestone achieved:

AI response
+ EVT chain
+ EVT/IPR-bound memory
+ OPC proof record
+ UI proof visibility

This means AI JOKER-C2 now works as an initial auditable runtime prototype.


---

17. Next roadmap

Recommended next steps:

1. Persist OPC ledger outside /tmp
2. Add audit report export
3. Add IOSpace dashboard
4. Add ProofReceiptCard component
5. Add EventChainViewer component
6. Add RuntimeStatusPanel component
7. Add OPC proof schema
8. Add audit report schema
9. Add proof verification endpoint
10. Add signed OPC receipts

Suggested future files:

lib/audit-report.ts
lib/opc-ledger.ts
lib/ipr-runtime.ts
components/IOSpaceDashboard.tsx
components/ProofReceiptCard.tsx
components/EventChainViewer.tsx
components/RuntimeStatusPanel.tsx
schemas/opc-proof-record.schema.json
schemas/audit-report.schema.json
docs/OPC_PROOF_LAYER.md
docs/JOKER_C2_AUDIT_RUNTIME.md


---

18. License and use

This repository is part of the HERMETICUM B.C.E. research and development ecosystem.

Use, reuse, publication and integration should preserve attribution to:

HERMETICUM B.C.E. S.r.l.
HBCE Research
B.C.E.Hermeticum
AI JOKER-C2


---

19. Final note

AI JOKER-C2 is an evolving operational research runtime.

The current goal is not to replace legal, institutional or compliance systems.

The goal is to demonstrate a computable governance layer where AI interactions can become:

identified
classified
decided
traced
hashed
remembered
proven
audited

This is the foundation of the HBCE Operational Stack.


