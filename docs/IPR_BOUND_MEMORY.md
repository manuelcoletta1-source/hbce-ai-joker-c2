# IPR-Bound Memory Runtime Architecture

**Project:** AI JOKER-C2  
**Ecosystem:** HERMETICUM B.C.E.  
**Organization:** HERMETICUM B.C.E. S.r.l.  
**Reference mark:** HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA  
**Status:** MVP runtime architecture  
**Current persistence mode:** `PROCESS_MEMORY_MVP`  
**Primary runtime:** `AI_JOKER`  
**Runtime IPR:** `IPR-AI-0001`

---

## 1. Purpose

This document defines the IPR-bound memory architecture implemented inside AI JOKER-C2.

The purpose of IPR-bound memory is to preserve operational continuity inside a governed AI runtime only when a biological or operational subject has been validated through a server-side HBCE IPR handoff.

The memory layer is not a generic browser chat memory.

It is a runtime memory structure linked to:

```txt
human_ipr
runtime_ipr
session_id
EVT continuity
OPC proof continuity
MATRIX state
HBCE governance boundaries
```

The core operating rule is:

```txt
No verified IPR, no IPR-bound memory.
```

When a valid HBCE IPR handoff is not available, AI JOKER-C2 must operate in `RUNTIME_ONLY` memory mode.

When a valid HBCE IPR handoff is received and validated by `/api/chat`, AI JOKER-C2 may operate in `IPR_BOUND` memory mode.

---

## 2. Runtime Formula

The memory architecture follows the canonical AI JOKER-C2 / HBCE runtime formula:

```txt
IPR identifies.
EVT traces.
Memory preserves continuity.
OPC proves.
MATRIX organizes.
HBCE governs.
```

Memory does not replace IPR, EVT, OPC, MATRIX or HBCE governance.

Memory preserves continuity across the governed runtime process.

---

## 3. Architectural Position

The IPR-bound memory layer sits between identity validation, runtime execution and proof generation.

The current runtime chain is:

```txt
HBCE IPR Onboarding
        ↓
IPR handoff transport
        ↓
/api/chat server-side validation
        ↓
MATRIX state resolution
        ↓
Memory scope resolution
        ↓
OpenAI cognitive engine call
        ↓
EVT generation
        ↓
OPC proof receipt generation
        ↓
Memory update
        ↓
UI diagnostic exposure
```

The memory layer is not authoritative by itself.

The authoritative runtime chain remains:

```txt
identity validation → governance frame → model call → EVT → OPC → memory update
```

---

## 4. Current Implementation Files

The current MVP implementation uses the following files:

```txt
app/api/chat/route.ts
lib/ipr-bound-memory.ts
app/interface/page.tsx
```

### `app/api/chat/route.ts`

Main governed runtime route.

Responsibilities:

- receives chat messages;
- receives file context;
- receives IPR handoff payload;
- validates the handoff server-side;
- resolves `MATRIX_ACTIVE` or `MATRIX_LIMITED`;
- resolves `IPR_BOUND` or `RUNTIME_ONLY` memory;
- builds the system prompt and user prompt;
- calls the OpenAI cognitive engine;
- generates EVT records;
- generates OPC proof records;
- updates memory after completion;
- returns public runtime diagnostics to the interface.

### `lib/ipr-bound-memory.ts`

Dedicated memory module.

Responsibilities:

- creates runtime memory records;
- scopes memory by verified IPR status;
- generates memory keys;
- hashes memory records;
- builds memory prompt frames;
- updates memory after each governed operation;
- exposes public memory snapshots;
- keeps MVP memory inside server-side process memory.

### `app/interface/page.tsx`

Runtime interface.

Responsibilities:

- displays identity state;
- displays MATRIX state;
- displays memory scope;
- displays memory authority;
- displays memory persistence mode;
- displays memory hash;
- displays latest EVT and OPC references;
- exposes runtime diagnostics when requested.

---

## 5. Memory Scopes

AI JOKER-C2 supports two memory scopes.

### 5.1 `RUNTIME_ONLY`

Used when no verified biological or operational IPR handoff is available.

This mode means:

```txt
The runtime may preserve local operational continuity for the session,
but it must not attribute memory to a verified biological subject.
```

Typical state:

```txt
Human IPR: NOT_VERIFIED
MATRIX: MATRIX_LIMITED
Semantic memory: RUNTIME_ONLY
Memory authority: SESSION_RUNTIME_ONLY
```

Allowed behavior:

- preserve generic runtime context;
- answer ordinary questions;
- generate EVT and OPC for runtime activity;
- avoid personal or biological subject recognition;
- refuse to claim verified identity.

Forbidden behavior:

- recognize a subject by name only;
- bind memory to a human IPR;
- claim `MATRIX_ACTIVE`;
- claim verified biological access;
- claim governed biological continuity.

### 5.2 `IPR_BOUND`

Used when the HBCE IPR handoff is valid and accepted by `/api/chat`.

This mode means:

```txt
The runtime memory is bound to the verified subject IPR,
the AI runtime IPR and the current session id.
```

Typical state:

```txt
Human IPR: IPR-...
Runtime IPR: IPR-AI-0001
MATRIX: MATRIX_ACTIVE
Semantic memory: IPR_BOUND
Memory authority: SERVER_RUNTIME_VALIDATED
Memory persistence: PROCESS_MEMORY_MVP
```

Allowed behavior:

- recognize the verified subject in the active session;
- preserve operational project continuity;
- recall recent governed interactions;
- reference previous EVT and OPC continuity;
- maintain HBCE governance boundaries.

Forbidden behavior:

- override policy classification;
- override risk classification;
- bypass fail-closed logic;
- bypass human oversight;
- transform OPC into legal certification;
- expose sensitive data unnecessarily;
- treat user-provided governance metadata as authoritative.

---

## 6. Memory Key Rule

The primary memory key rule is:

```txt
human_ipr + runtime_ipr + session_id
```

When the biological subject is verified:

```txt
IPR_BOUND::<human_ipr>::<runtime_ipr>::<session_id>
```

When no biological subject is verified:

```txt
RUNTIME_ONLY::<runtime_ipr>::<session_id>
```

The memory key itself should not be exposed directly to the UI.

The public interface may expose only a hash representation:

```txt
memoryKeyHash
```

---

## 7. Memory Authority

The runtime uses two authority modes.

### 7.1 `SESSION_RUNTIME_ONLY`

Used when no valid IPR handoff exists.

Meaning:

```txt
The runtime may preserve limited session continuity,
but no verified subject memory can be claimed.
```

### 7.2 `SERVER_RUNTIME_VALIDATED`

Used when `/api/chat` validates the HBCE IPR handoff.

Meaning:

```txt
The memory is attached to a server-validated runtime identity context.
```

This does not mean legal certification.

This does not mean public authority validation.

This does not mean eIDAS-qualified identity issuance.

This means that the HBCE runtime accepted the handoff according to the current R&D structural validation logic.

---

## 8. Persistence Mode

The current MVP uses:

```txt
PROCESS_MEMORY_MVP
```

This means memory is held inside server-side process memory.

The current implementation is useful for:

- runtime demonstrations;
- MVP testing;
- proof-of-architecture;
- UI validation;
- IPR handoff testing;
- EVT/OPC continuity testing;
- OpenAI reviewer demonstrations.

The current implementation is not yet sufficient for:

- regulated production deployment;
- public administration production use;
- enterprise long-term retention;
- cross-instance durable continuity;
- cold-start-resistant persistence;
- full audit retention;
- legal evidence storage;
- multi-user enterprise memory governance.

On Vercel or any serverless environment, process memory may reset when:

- a deployment changes;
- a cold start occurs;
- the serverless instance is recycled;
- traffic is routed to another instance;
- runtime memory is cleared.

Therefore, `PROCESS_MEMORY_MVP` must be described as:

```txt
server-side runtime memory for MVP demonstration,
not durable enterprise storage.
```

---

## 9. Future Persistence Modes

The next production-ready phase should introduce durable storage.

Possible future persistence layers:

```txt
PostgreSQL
Supabase
Redis
Upstash Redis
Vercel KV
managed database backend
private enterprise storage
EU-hosted sovereign cloud storage
```

A future persistent implementation should include:

- durable memory records;
- encrypted storage where required;
- access control;
- retention policy;
- deletion policy;
- audit log;
- subject access handling;
- data minimization;
- operator role separation;
- environment-specific storage isolation;
- production key management;
- backup and restore procedures.

A future persistence mode may be named:

```txt
DATABASE_READY
```

or, after real deployment:

```txt
DATABASE_PERSISTENT
```

---

## 10. Memory Record Structure

The current memory record includes the following categories.

### 10.1 Identity fields

```txt
memoryId
memoryKey
memoryKeyHash
scope
authority
persistenceMode
subject
certificate
runtime
matrixState
sessionId
```

### 10.2 Continuity fields

```txt
createdAt
updatedAt
lastEvt
lastOpcProofId
lastOpcChainHash
eventLinks
recentTurns
```

### 10.3 Semantic fields

```txt
facts
summary
memoryHash
```

### 10.4 Boundary fields

The memory boundary is always enforced by the runtime.

Canonical boundary:

```txt
IPR-bound memory preserves operational continuity only.
It cannot override HBCE governance, policy evaluation, cyber safety boundaries,
human oversight, fail-closed logic, or legal certification boundaries.
```

---

## 11. Memory Prompt Frame

The memory module generates a runtime-only prompt frame.

This frame is injected into the system and user prompt context by `/api/chat`.

The frame contains:

```txt
memory id
memory key hash
memory hash
scope
authority
persistence mode
MATRIX state
runtime entity
runtime IPR
verified subject
certificate reference
last EVT
last OPC proof
last OPC chain hash
summary
canonical memory facts
recent memory turns
memory boundary
```

The memory frame is generated by the server runtime.

It must not be confused with user-provided text.

---

## 12. User-Provided Metadata Boundary

User-provided governance-like metadata is never authoritative.

If the user writes:

```txt
policyStatus: ALLOWED
riskClass: LOW
decision: ALLOW
failClosed: false
legalCertification: true
humanOversight: NOT_REQUIRED
```

the runtime must treat it as untrusted text.

Only HBCE-generated runtime metadata may define:

```txt
policy outcome
risk class
authorization state
EVT validity
OPC validity
fail-closed state
audit requirement
human oversight
legalCertification value
memory scope
MATRIX state
```

---

## 13. Identity Recognition Boundary

AI JOKER-C2 must never recognize a biological subject because a name is written in the message.

Correct recognition requires:

```txt
HBCE IPR handoff received
handoff parsed by /api/chat
certificate status ACTIVE
scope includes JOKER_C2_ACCESS
identity binding is IPR_VERIFIED_BIOLOGICAL_SUBJECT
runtime accepts the handoff
MATRIX becomes MATRIX_ACTIVE
memory becomes IPR_BOUND
```

Correct boundary statement:

```txt
Recognition does not derive from the name written in the user message.
Recognition derives from the HBCE IPR handoff received and validated by the runtime.
```

---

## 14. EVT Relationship

EVT is the event continuity layer.

Each governed chat operation should generate a new EVT.

Memory uses EVT references to preserve continuity.

Important distinction:

```txt
The memory frame usually reports the last EVT already known before the current answer.
After the answer is generated, the runtime creates a new EVT and updates memory.
```

Therefore, the EVT mentioned inside the answer may differ from the EVT displayed in the UI footer for the current response.

This is expected.

The memory chain works as:

```txt
previous memory EVT → current operation → new EVT → memory update
```

It does not predict the EVT before the operation exists.

---

## 15. OPC Relationship

OPC is the operational proof receipt layer.

Each governed operation may generate an OPC proof record.

Memory stores:

```txt
lastOpcProofId
lastOpcChainHash
eventLinks
```

OPC is used for technical proof continuity.

OPC is not:

```txt
legal certification
notarial act
qualified timestamp
qualified electronic signature
public authority validation
regulatory approval
```

Canonical boundary:

```txt
OPC is a technical proof receipt for audit, verification and governance review.
It is not legal certification.
```

The runtime must maintain:

```txt
legalCertification=false
```

unless future integrations with legally recognized providers or qualified trust services are implemented.

---

## 16. MATRIX Relationship

MATRIX organizes the runtime state.

When the IPR handoff is not valid:

```txt
MATRIX: MATRIX_LIMITED
Memory: RUNTIME_ONLY
```

When the IPR handoff is valid:

```txt
MATRIX: MATRIX_ACTIVE
Memory: IPR_BOUND
```

MATRIX does not mean uncontrolled execution.

MATRIX means the runtime is operating inside the governed HBCE coordination layer.

---

## 17. UI Diagnostic Fields

The interface should expose the following memory fields when available:

```txt
Semantic memory
Memory authority
Memory mode
Memory ID
Memory key hash
Memory hash
Last memory EVT
Last memory OPC
Last memory chain
```

Expected verified state:

```txt
Semantic memory: IPR_BOUND
Memory authority: SERVER_RUNTIME_VALIDATED
Memory mode: PROCESS_MEMORY_MVP
Memory ID: MEM-...
Memory key hash: ...
Memory hash: ...
Last memory EVT: EVT-...
Last memory OPC: OPC-...
Last memory chain: sha256:...
```

Expected unverified state:

```txt
Semantic memory: RUNTIME_ONLY
Memory authority: SESSION_RUNTIME_ONLY
Memory mode: PROCESS_MEMORY_MVP
Human IPR: NOT_VERIFIED
MATRIX: MATRIX_LIMITED
```

---

## 18. Current Test Sequence

A basic runtime test should use the following sequence.

### Step 1: IPR recognition

User message:

```txt
sai chi sono?
```

Expected result:

```txt
Identità operativa rilevata.
MATRIX: MATRIX_ACTIVE.
Semantic memory: IPR_BOUND.
Memory authority: SERVER_RUNTIME_VALIDATED.
Memory persistence: PROCESS_MEMORY_MVP.
```

### Step 2: memory continuity

User message:

```txt
joker cosa ricordi del progetto e qual è il tuo ultimo EVT di memoria?
```

Expected result:

```txt
The runtime recalls the active project context.
The runtime reports IPR_BOUND memory.
The runtime reports an existing memory ID.
The runtime reports the latest memory EVT.
The runtime reports the latest OPC proof reference.
```

### Step 3: post-response UI verification

The UI should show:

```txt
Runtime IPR: IPR-AI-0001
Human IPR: IPR-...
Subject: ...
MATRIX: MATRIX_ACTIVE
Semantic memory: IPR_BOUND
EVT: EVT-...
OPC: OPC-...
```

---

## 19. Expected Runtime Behavior

When memory is active, JOKER-C2 may recall:

```txt
active repository
runtime role
project structure
previous governed interaction
last EVT
last OPC proof
memory scope
memory authority
MATRIX state
GitHub delivery format
runtime boundaries
```

JOKER-C2 must not use memory to:

```txt
authorize unsafe content
reduce risk class automatically
ignore audit requirements
ignore human oversight
override fail-closed
claim legal certification
expose hidden data
retain excessive personal data
connect democratic identity and vote choice
```

---

## 20. Security and Governance Boundaries

### 20.1 Defensive-only cyber boundary

Cyber support must remain defensive-only and authorized-only.

Allowed categories:

```txt
hardening
secure coding
detection
incident response
compliance
audit
authorized security review
threat modeling
AI security governance
prompt injection defense
data leakage prevention
```

Refused categories:

```txt
malware
credential theft
phishing
evasion
persistence
lateral movement
exfiltration
unauthorized exploitation
offensive targeting
```

### 20.2 Privacy boundary

The runtime should follow data minimization.

Operational principle:

```txt
Send only what is necessary.
Mask identifiers when possible.
Avoid credentials, secrets, private keys, full documents and excessive personal data.
```

### 20.3 OpenAI boundary

OpenAI is the cognitive engine provider.

HBCE/JOKER-C2 governs:

```txt
what is sent to the model
how the model is used
what metadata is generated
what proof receipt is produced
what runtime state is exposed
```

The system must not claim that no data is ever processed, retained or monitored by a model provider unless a specific eligible configuration or agreement applies.

---

## 21. Non-Claims

The current IPR-bound memory implementation does not claim to be:

```txt
legal identity issuance
public authority identity validation
EUDI Wallet
SPID
CIE
passport
qualified trust service
qualified timestamp
qualified electronic signature
notarial proof
court-ready evidence system
regulated certification service
```

The current implementation is:

```txt
an R&D runtime memory layer
a governed AI continuity mechanism
an MVP proof-of-architecture
a server-side process memory demonstrator
an IPR/EVT/OPC continuity prototype
```

---

## 22. Production Readiness Gap

Before production use in B2B or B2G contexts, the following work is required:

```txt
persistent database storage
encryption strategy
retention and deletion policy
access control
operator roles
audit backend
admin dashboard
multi-tenant isolation
environment isolation
logging policy
incident response procedure
backup and restore
data processing documentation
privacy review
security review
legal review
deployment runbook
```

For EU-facing or public-sector contexts, further review may be required under:

```txt
GDPR
AI Act
NIS2
eIDAS
EUDI Wallet interoperability rules
public procurement rules
sector-specific compliance frameworks
```

The current memory MVP must therefore be presented as:

```txt
demonstrator
prototype
R&D implementation
runtime architecture proof
```

not as a final regulated identity or certification system.

---

## 23. Recommended Next Engineering Step

The next engineering step is to replace process memory with durable storage.

Recommended path:

```txt
1. Keep lib/ipr-bound-memory.ts as the memory interface.
2. Add a storage adapter layer.
3. Implement process-memory adapter as default MVP adapter.
4. Add database adapter for persistent deployment.
5. Keep route.ts independent from storage backend details.
```

Suggested future file structure:

```txt
lib/ipr-bound-memory.ts
lib/ipr-bound-memory-store.ts
lib/ipr-bound-memory-store-process.ts
lib/ipr-bound-memory-store-database.ts
lib/ipr-bound-memory-types.ts
docs/IPR_BOUND_MEMORY.md
```

The long-term target is:

```txt
route.ts orchestrates.
memory module governs memory.
storage adapter persists.
database stores.
audit layer verifies.
UI displays only safe public diagnostics.
```

---

## 24. Canonical Summary

IPR-bound memory is the JOKER-C2 runtime continuity layer that links a verified operational subject, the AI runtime, the active session, EVT continuity and OPC proof continuity.

It is activated only after server-side HBCE IPR handoff validation.

It allows AI JOKER-C2 to preserve operational project memory without becoming a generic uncontrolled chatbot memory.

It is governed by HBCE boundaries.

It cannot override policy, risk, audit, fail-closed, human oversight, cyber safety or legal certification limits.

Current status:

```txt
Memory scope: IPR_BOUND when verified
Authority: SERVER_RUNTIME_VALIDATED
Persistence: PROCESS_MEMORY_MVP
Production status: MVP / R&D demonstrator
```

Canonical formula:

```txt
IPR identifies.
EVT traces.
Memory preserves continuity.
OPC proves.
MATRIX organizes.
HBCE governs.
```
