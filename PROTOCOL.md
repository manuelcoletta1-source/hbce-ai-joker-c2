# AI JOKER-C2 Operational Protocol

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the operational protocol of AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The purpose of this protocol is to define how the runtime receives a request, classifies it, evaluates it, decides whether it may proceed, generates output, records an EVT event and preserves operational continuity.

AI JOKER-C2 is not a generic chatbot.

It is a governed runtime for traceable, verifiable and fail-closed AI-assisted operations.

---

## 2. Canonical Protocol Formula

The canonical protocol sequence is:

```txt
Identity -> Input -> Intent -> Context -> Policy -> Risk -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity

Condensed:

Identity -> Policy -> Risk -> Decision -> EVT -> Verification -> Continuity

The protocol exists to prevent AI-assisted operations from becoming anonymous, unbounded or unverifiable.


---

3. Strategic Architecture

AI JOKER-C2 operates inside the following architecture:

MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = event trace layer
Ledger = continuity layer
Fail-closed = safety boundary

Expanded:

MATRIX -> HBCE -> AI JOKER-C2 -> IPR -> Policy -> Risk -> Decision -> EVT -> Ledger -> Verification

The protocol must remain consistent with:

README.md;

ARCHITECTURE.md;

GOVERNANCE.md;

EVT_PROTOCOL.md;

DUAL_USE_STRATEGIC_POSITIONING.md;

SECURITY.md;

COMPLIANCE.md;

ROADMAP.md;

CONTRIBUTING.md.



---

4. Runtime Identity

AI JOKER-C2 operates with a canonical identity context.

Field	Value

Public name	AI JOKER-C2
Canonical entity	AI_JOKER
Canonical IPR	IPR-AI-0001
Active checkpoint	EVT-0014-AI
Core	HBCE-CORE-v3
Framework	MATRIX
Infrastructure	HBCE
Organization	HERMETICUM B.C.E. S.r.l.
Territorial anchor	Torino, Italy, Europe


Identity is the first layer of the protocol.

No relevant operational event should exist without identity context.

Identity does not authorize unsafe execution.

Identity creates attribution, continuity and auditability.


---

5. Protocol States

The runtime may operate in one of the following states.

State	Meaning

OPERATIONAL	Runtime is functioning normally
DEGRADED	Runtime is partially limited
BLOCKED	Runtime cannot proceed
INVALID	Runtime state is invalid or unverifiable
AUDIT_ONLY	Runtime may record but should not execute sensitive actions
MAINTENANCE	Runtime is under controlled modification


Runtime state affects the decision layer.

A DEGRADED runtime may provide limited safe support.

A BLOCKED or INVALID runtime must not execute sensitive operations.


---

6. Input Handling

The input stage receives the user request or system event.

Input may include:

user message;

file content;

file metadata;

session context;

runtime diagnostic request;

GitHub operation request;

documentation request;

technical analysis request;

strategic analysis request.


Input handling principles:

1. Normalize the request.


2. Preserve user intent.


3. Avoid exposing secrets.


4. Avoid trusting client-provided metadata blindly.


5. Avoid executing uploaded content.


6. Avoid storing unnecessary sensitive payloads.


7. Preserve enough structure for audit and reconstruction.



The input stage does not authorize execution.

It only prepares the request for classification.


---

7. Intent Classification

The intent stage determines what the user is trying to do.

Suggested intent classes:

Intent	Meaning

ASK	Ordinary question or explanation
WRITE	Generate or rewrite text
ANALYZE	Analyze content, code or documents
SUMMARIZE	Produce a summary
TRANSFORM	Convert content into another structure
CODE	Generate, review or refactor code
GITHUB	Prepare repository files, commits or documentation
GOVERNANCE	Work on policy, risk, compliance or audit
SECURITY	Defensive security analysis or hardening
STRATEGIC	B2B, B2G or institutional positioning
VERIFY	Inspect status, evidence, EVT or runtime output
PROHIBITED	Unsafe, abusive or outside project boundary
UNKNOWN	Intent cannot be safely classified


Unknown intent in sensitive contexts should not be treated as permission.


---

8. Context Classification

The context stage assigns the request to an operational domain.

Suggested context classes:

Context	Description

IDENTITY	IPR, EVT, lineage, runtime identity
MATRIX	MATRIX framework and strategic infrastructure
DOCUMENTAL	File analysis, document processing, summaries
TECHNICAL	Code, architecture, APIs, implementation
GITHUB	Repository files, commits, documentation
EDITORIAL	Books, corpus, publication work
STRATEGIC	B2B, B2G, institutions, roadmap
SECURITY	Defensive security, resilience and risk
COMPLIANCE	Governance, audit, legal-technical alignment
GENERAL	Ordinary safe requests


Context classification supports policy and risk evaluation.

It should not overload ordinary user communication.


---

9. Policy Evaluation

The policy stage applies project boundaries.

Policy evaluation should check:

whether the request is within project scope;

whether the request is lawful and defensive;

whether the request may enable abuse;

whether human review is required;

whether file handling is safe;

whether secrets may be exposed;

whether the operation is dual-use sensitive;

whether an EVT should be generated;

whether the request should be blocked, degraded or escalated.


Policy evaluation must happen before sensitive execution.

No sensitive operation should bypass policy.


---

10. Risk Classification

The risk stage assigns a risk class.

Risk	Meaning	Default Handling

LOW	Ordinary safe request	ALLOW
MEDIUM	Operationally relevant request	ALLOW or AUDIT
HIGH	Sensitive, strategic or high-impact request	ESCALATE or DEGRADE
CRITICAL	Strict review required	ESCALATE or BLOCK
PROHIBITED	Unsafe, abusive or outside scope	BLOCK
UNKNOWN	Cannot be safely classified	ESCALATE or BLOCK


Risk classification must consider both:

the explicit request;

the possible operational effect of the output.


A request may look harmless but become sensitive when applied to real systems, real organizations, critical infrastructure or unauthorized activity.


---

11. Decision Layer

The decision layer determines what the runtime may do.

Allowed decisions:

Decision	Meaning

ALLOW	Operation may proceed
BLOCK	Operation is prohibited, unsafe or outside scope
ESCALATE	Human review or additional authority required
DEGRADE	Limited safe support only
AUDIT	Operation may proceed but must be recorded or reviewed
NOOP	No operational action taken


The decision must be produced before or during execution.

A decision should never be invented after execution to justify what happened.


---

12. Execution Layer

Execution happens only after identity, context, policy, risk and decision have been evaluated.

Execution may include:

answering a question;

generating documentation;

refactoring code;

summarizing a file;

producing a GitHub-ready file;

producing a governance document;

generating an EVT record;

appending to a ledger;

verifying a record;

producing a safe refusal.


Execution must follow the decision result.

Decision	Execution Rule

ALLOW	Execute normally
BLOCK	Do not execute unsafe content
ESCALATE	Request review or provide safe framing
DEGRADE	Provide limited safe support
AUDIT	Execute only with event or review record
NOOP	Take no operational action



---

13. Fail-Closed Rule

Fail-closed is the safety boundary of the protocol.

The runtime must block, degrade or escalate when:

identity context is missing;

runtime state is invalid;

authority is unclear;

intent is unsafe;

policy cannot be applied;

risk cannot be classified;

operation may enable abuse;

operation may expose secrets;

operation may affect real systems without authorization;

event trace cannot be generated;

continuity cannot be preserved;

human review is required but absent;

legal or compliance basis is uncertain in a sensitive context.


Protocol rule:

Uncertainty in sensitive operations does not authorize execution.

Fail-closed is controlled behavior.

It is not system failure.


---

14. EVT Generation

EVT means Event.

An EVT is generated for relevant operations.

A minimal EVT should include:

event identifier;

previous event reference;

entity;

IPR;

timestamp;

runtime state;

context class;

intent class;

risk class;

governance decision;

operation type;

operation status;

hash;

verification status;

audit status.


Example:

{
  "evt": "EVT-20260429-153000-0001",
  "prev": "GENESIS",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T15:30:00+02:00",
  "runtime": {
    "name": "AI JOKER-C2",
    "core": "HBCE-CORE-v3",
    "state": "OPERATIONAL"
  },
  "context": {
    "class": "GITHUB",
    "domain": "DOCUMENTATION",
    "sensitivity": "LOW"
  },
  "governance": {
    "risk": "LOW",
    "decision": "ALLOW",
    "policy": "REPOSITORY_DOCUMENTATION",
    "fail_closed": false
  },
  "operation": {
    "type": "CREATE_PROTOCOL_FILE",
    "status": "COMPLETED"
  },
  "trace": {
    "hash_algorithm": "sha256",
    "canonicalization": "deterministic-json",
    "hash": "sha256:example"
  },
  "verification": {
    "status": "VERIFIABLE",
    "audit_status": "READY"
  }
}

EVT transforms an output into an operational trace.


---

15. Ledger Protocol

The ledger preserves EVT continuity.

Possible ledger implementations:

append-only JSONL file;

database table;

signed event registry;

evidence pack;

audit export;

external verification layer.


Ledger rules:

1. Events should be append-only.


2. Historical events should not be silently rewritten.


3. Corrections should be new events.


4. Each event should reference the previous event.


5. Hashes should be reproducible where possible.


6. Sensitive payloads should be minimized.


7. Public and internal views should be separated.



Correction example:

{
  "evt": "EVT-20260429-160000-0003",
  "prev": "EVT-20260429-153000-0002",
  "operation": {
    "type": "EVENT_CORRECTION",
    "corrects": "EVT-20260429-153000-0002",
    "reason": "Incorrect context classification"
  }
}

Correction is not erasure.

Correction is a new trace.


---

16. Verification Protocol

Verification should allow reconstruction of the operational sequence.

A verification process should check:

event existence;

required fields;

previous event reference;

timestamp;

identity reference;

runtime state;

context class;

risk class;

governance decision;

operation status;

hash consistency;

verification status;

audit status;

correction or supersession state.


Suggested verification statuses:

Status	Meaning

VERIFIABLE	Sufficient data for verification
PARTIAL	Useful but incomplete
INVALID	Failed structural validation
UNVERIFIED	Not yet checked
ANCHORED	Externally anchored
SUPERSEDED	Corrected by later event


Verification is technical reconstruction.

Audit is institutional review.

Both should remain distinct.


---

17. Hashing Protocol

The recommended hash algorithm is:

sha256

The recommended canonicalization method is:

deterministic-json

Hashing principles:

1. Use deterministic serialization.


2. Sort object keys where possible.


3. Preserve exact string values.


4. Use ISO 8601 timestamps.


5. Avoid unstable environment-specific fields.


6. Hash file references when payloads are large or sensitive.


7. Avoid hashing secrets into public records.


8. Document what is included in the hash.



A hash supports integrity.

A hash does not prove lawful authorization.

Policy, risk and decision remain required.


---

18. Human Oversight Protocol

Human oversight must be preserved for high-impact operations.

Suggested oversight states:

State	Meaning

NOT_REQUIRED	Ordinary safe operation
RECOMMENDED	Human review useful but not mandatory
REQUIRED	Human review required before continuation
COMPLETED	Human review completed
REJECTED	Human review rejected the operation
ESCALATED	Further authority required


Human oversight is required or recommended when operations involve:

legal effects;

security-sensitive systems;

critical infrastructure;

public authority;

financial impact;

medical impact;

law enforcement;

coercive action;

irreversible execution;

high-impact AI governance.


AI JOKER-C2 may assist.

It must not replace responsible human operators.


---

19. File Processing Protocol

File processing must be controlled.

Allowed file operations:

summarize;

restructure;

analyze;

transform;

extract safe text;

generate documentation;

review code;

prepare GitHub-ready output.


File processing rules:

1. Do not execute uploaded files.


2. Do not trust file names blindly.


3. Do not store unnecessary sensitive payloads.


4. Do not expose private file content in logs.


5. Reject unsupported or unsafe file types.


6. State when file visibility is incomplete.


7. Preserve user control over uploaded content.


8. Use references or hashes for large or sensitive files where possible.



Recommended safe file types:

.txt
.md
.json
.csv

Unknown or binary files should be handled conservatively.


---

20. API Protocol

API routes must preserve controlled execution.

Primary API routes may include:

/api/chat
/api/files
/api/verify
/api/evidence

API rules:

1. Validate input.


2. Validate request size.


3. Avoid exposing secrets.


4. Avoid exposing stack traces.


5. Avoid logging sensitive payloads.


6. Apply policy and risk logic where relevant.


7. Support EVT generation for relevant operations.


8. Preserve fail-closed behavior.


9. Return clear safe errors.


10. Avoid unrestricted execution endpoints.



API routes are operational surfaces.

They must not bypass governance.


---

21. Model Interaction Protocol

The model layer supports reasoning and generation.

The model may produce:

analysis;

summaries;

code;

documentation;

strategic drafts;

governance drafts;

technical explanations;

structured outputs.


The model must not be treated as the final governance authority.

Model output should remain subject to:

project scope;

policy checks;

risk classification;

safety boundaries;

human accountability;

fail-closed behavior.


The runtime governs the model.

The model does not govern the runtime.


---

22. Security Protocol

AI JOKER-C2 supports defensive and governance-oriented security only.

Allowed security use:

secure architecture review;

safe debugging;

dependency review;

defensive risk analysis;

incident report structuring;

secure configuration;

repository hardening;

audit trail design;

resilience planning.


Prohibited security use:

malware;

exploit deployment;

unauthorized access;

credential theft;

persistence mechanisms;

evasion;

stealth;

sabotage;

offensive automation;

real-target attack instructions.


Security protocol formula:

Defensive security is allowed.
Offensive or abusive capability is prohibited.


---

23. Dual-Use Protocol

AI JOKER-C2 is dual-use only in a controlled civil and strategic sense.

Allowed dual-use domains:

AI governance;

public administration;

defensive cybersecurity;

cloud governance;

data governance;

critical infrastructure resilience;

institutional reporting;

operational continuity;

compliance documentation;

audit and evidence generation.


Prohibited dual-use domains:

autonomous weapons;

offensive cyber operations;

unlawful surveillance;

targeting systems;

disinformation operations;

coercive manipulation;

repression of rights;

sabotage.


Dual-use does not mean unrestricted use.

Dual-use means lawful, defensive, accountable and traceable strategic application.


---

24. Public Communication Protocol

AI JOKER-C2 should communicate clearly.

Public answers should be:

useful;

direct;

readable;

professional;

operational;

not overloaded with internal metadata.


Internal runtime details may be exposed when the user asks for:

architecture;

governance;

EVT;

protocol;

audit;

verification;

identity;

runtime diagnostics;

GitHub implementation.


The runtime should keep the machine room available but not noisy.


---

25. Error Handling Protocol

Errors should be safe and useful.

Error responses should:

explain what failed;

avoid exposing secrets;

avoid exposing stack traces;

avoid leaking internal tokens;

preserve user trust;

provide a safe next step;

generate or support an EVT when relevant.


Suggested error classes:

Error	Meaning

INPUT_ERROR	Invalid or incomplete user input
POLICY_ERROR	Policy could not authorize operation
RISK_ERROR	Risk could not be safely classified
MODEL_ERROR	Model execution failed
FILE_ERROR	File could not be processed safely
EVT_ERROR	Event could not be generated or verified
LEDGER_ERROR	Event could not be appended or read
SECURITY_ERROR	Request triggered security boundary
RUNTIME_ERROR	Runtime state is degraded or invalid


Errors should not become uncontrolled execution paths.


---

26. Degraded Mode Protocol

The runtime may enter degraded mode when:

model API is unavailable;

environment variables are missing;

file processing fails;

ledger is unavailable;

verifier is unavailable;

runtime state is partial;

external dependency fails.


In degraded mode, AI JOKER-C2 may provide:

limited safe output;

diagnostic information;

static documentation;

controlled fallback response;

safe refusal;

explanation of unavailable capability.


Degraded mode must preserve:

non-offensive boundary;

fail-closed behavior;

no secret exposure;

user-facing clarity.



---

27. Contribution Protocol

Future contributions must preserve this protocol.

A contribution must not:

bypass policy;

bypass risk classification;

remove traceability;

weaken EVT continuity;

weaken fail-closed behavior;

expose secrets;

add offensive functionality;

execute uploaded files unsafely;

remove human accountability;

create unrestricted API execution.


A contribution should improve:

clarity;

security;

governance;

verification;

auditability;

runtime stability;

documentation;

defensive utility.


See:

CONTRIBUTING.md


---

28. Implementation Targets

Suggested implementation modules:

lib/context-classifier.ts
lib/policy-engine.ts
lib/risk-engine.ts
lib/runtime-decision.ts
lib/evt.ts
lib/evt-ledger.ts
lib/evt-hash.ts
lib/evt-verify.ts

Suggested API routes:

app/api/chat/route.ts
app/api/files/route.ts
app/api/verify/route.ts
app/api/evidence/route.ts

Suggested future directories:

ledger/
evidence/
registry/
docs/

Implementation should follow the protocol rather than inventing parallel logic.


---

29. Protocol Invariants

The following invariants must remain stable:

AI JOKER-C2 is not a generic chatbot.
AI JOKER-C2 is identity-bound.
MATRIX provides the strategic framework.
HBCE provides the governance infrastructure.
IPR provides identity.
Policy provides boundary.
Risk provides classification.
Decision provides control.
EVT provides trace.
Ledger provides continuity.
Verification provides accountability.
Fail-closed provides safety.
Human accountability is preserved.
Offensive use is outside scope.


---

30. Protocol Checklist

Before accepting a runtime operation, check:

Is identity defined?
Is the input understood?
Is intent classified?
Is context classified?
Is policy applicable?
Is risk classified?
Is the decision clear?
Is execution allowed?
Is an EVT required?
Can the EVT be generated?
Can continuity be preserved?
Is verification possible?
Is human oversight required?
Is fail-closed triggered?

Before deploying a runtime change, check:

Does the project build?
Are secrets protected?
Are API routes safe?
Is file handling controlled?
Is model output governed?
Is EVT compatibility preserved?
Is ledger continuity preserved?
Is verification possible?
Is fail-closed behavior preserved?
Is non-offensive boundary preserved?


---

31. Final Protocol Formula

No identity, no attribution.
No policy, no boundary.
No risk classification, no sensitive execution.
No decision, no control.
No EVT, no trace.
No ledger, no continuity.
No verification, no auditability.
No fail-closed, no trustworthy runtime.

Operational formula:

Identity -> Input -> Intent -> Context -> Policy -> Risk -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity


---

32. Status

Document status: active operational protocol
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

