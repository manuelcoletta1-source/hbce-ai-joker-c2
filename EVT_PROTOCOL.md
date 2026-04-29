# AI JOKER-C2 EVT Protocol

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the EVT Protocol for AI JOKER-C2.

EVT means Event.

Within AI JOKER-C2, an EVT is not a decorative log entry.

An EVT is a verifiable operational record that binds a runtime action to:

- identity;
- input context;
- intent classification;
- policy evaluation;
- risk classification;
- decision;
- execution result;
- timestamp;
- previous event reference;
- hash;
- verification status;
- continuity state.

The purpose of the EVT Protocol is to transform AI-assisted operations into reconstructable, auditable and continuity-preserving sequences.

---

## 2. Protocol Definition

The EVT Protocol is the event trace layer of AI JOKER-C2.

It defines how the runtime records relevant operations and links them into a chain.

The conceptual sequence is:

```txt
operation -> governance decision -> EVT generation -> hash -> ledger -> verification -> continuity

The protocol ensures that every relevant operation can be examined after execution.

A valid EVT should answer the following questions:

1. What happened?


2. When did it happen?


3. Which identity was bound to the operation?


4. Which context was involved?


5. Which risk class was assigned?


6. Which governance decision was produced?


7. Was the operation allowed, blocked, escalated, degraded or audited?


8. Which previous event does this operation follow?


9. Can the event be verified?


10. Does the event preserve continuity?




---

3. Role of EVT in AI JOKER-C2

AI JOKER-C2 is not designed as a generic AI interface.

It is an identity-bound operational runtime.

The EVT Protocol gives the system a memory of action.

This memory is not psychological.

It is operational.

It allows the runtime to preserve a structured relation between:

identity;

request;

response;

risk;

decision;

evidence;

time;

continuity.


Without EVT, AI JOKER-C2 would only produce outputs.

With EVT, AI JOKER-C2 produces outputs inside a verifiable operational sequence.


---

4. Canonical Runtime Sequence

The canonical runtime sequence is:

identity -> input -> intent -> policy -> risk -> decision -> execution -> EVT -> ledger -> verification -> continuity

Each EVT is generated after governance evaluation and records the operational state of the request.

Stage	EVT Relevance

identity	Defines who or what is bound to the operation
input	Records the existence of a request without necessarily storing full payload
intent	Classifies the operational purpose
policy	Records the governance boundary applied
risk	Assigns a risk class
decision	Stores ALLOW, BLOCK, ESCALATE, DEGRADE or AUDIT
execution	Records whether an action was performed
EVT	Creates the event object
ledger	Stores or links the event
verification	Allows later inspection
continuity	Links the event to the previous operational state



---

5. EVT Object Structure

A minimal EVT object should follow this structure:

{
  "evt": "EVT-0000000001",
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
    "class": "TECHNICAL",
    "domain": "GITHUB",
    "sensitivity": "LOW"
  },
  "governance": {
    "risk": "LOW",
    "decision": "ALLOW",
    "policy": "STANDARD_OPERATIONAL_POLICY",
    "fail_closed": false
  },
  "operation": {
    "type": "DOCUMENT_GENERATION",
    "status": "COMPLETED"
  },
  "trace": {
    "hash_algorithm": "sha256",
    "hash": "sha256:example",
    "canonicalization": "deterministic-json"
  },
  "verification": {
    "status": "VERIFIABLE",
    "audit_status": "READY"
  }
}

This structure may be extended, but the core fields must remain stable.


---

6. Required Fields

The following fields are required for a valid EVT.

Field	Description

evt	Unique event identifier
prev	Previous event reference
entity	Runtime entity responsible for the event
ipr	Identity Primary Record reference
timestamp	Time of event generation
runtime	Runtime metadata
context	Operational context classification
governance	Risk, policy and decision metadata
operation	Type and result of the operation
trace	Hash and canonicalization information
verification	Verification and audit status


A missing required field should downgrade the event to INVALID or INCOMPLETE.

A sensitive operation with an invalid EVT should not proceed as fully authorized.


---

7. EVT Identifier

The EVT identifier should be unique, stable and machine-readable.

Recommended format:

EVT-YYYYMMDD-HHMMSS-XXXX

Example:

EVT-20260429-153000-0001

Alternative runtime-generated format:

EVT-1777046038573

Both formats are acceptable if they remain unique and traceable.

The repository may use timestamp-based identifiers during prototype development and stricter canonical identifiers in later versions.


---

8. Previous Event Reference

The prev field preserves continuity.

For the first event in a chain, the value may be:

GENESIS

For all subsequent events, prev should reference the previous EVT identifier or previous event hash.

Example:

{
  "evt": "EVT-20260429-153001-0002",
  "prev": "EVT-20260429-153000-0001"
}

The purpose of prev is to prevent isolated, unbound and non-reconstructable operations.

AI JOKER-C2 should operate as a continuity chain, not as disconnected output generation.


---

9. Identity Binding

Each EVT must be bound to an identity context.

Canonical identity fields:

Field	Value

entity	AI_JOKER
ipr	IPR-AI-0001
runtime	AI JOKER-C2
core	HBCE-CORE-v3
organization	HERMETICUM B.C.E. S.r.l.
territorial_anchor	Torino, Italy, Europe


Identity binding does not mean that every public answer must expose internal metadata.

It means that relevant runtime operations must preserve an internal relation between action and identity.

No relevant operation should exist without an identity reference.


---

10. Runtime State

The EVT should record runtime state.

Allowed runtime states:

State	Meaning

OPERATIONAL	Runtime is functioning normally
DEGRADED	Runtime is partially limited
BLOCKED	Runtime cannot proceed
INVALID	Runtime state is invalid or unverifiable
AUDIT_ONLY	Runtime can record but not execute
MAINTENANCE	Runtime is under controlled modification


Runtime state affects governance decisions.

A DEGRADED runtime may still produce safe outputs.

A BLOCKED or INVALID runtime must not execute sensitive operations.


---

11. Context Classes

AI JOKER-C2 may classify events into operational contexts.

Suggested context classes:

Context	Description

IDENTITY	IPR, EVT, lineage, identity binding
MATRIX	MATRIX framework and strategic infrastructure
DOCUMENTAL	File analysis, document processing, structured output
TECHNICAL	Code, architecture, APIs, implementation
GITHUB	Repository files, commits, documentation
EDITORIAL	Books, corpus, publication work
STRATEGIC	B2B, B2G, institutional positioning
SECURITY	Defensive security, risk and resilience
COMPLIANCE	Governance, audit, legal-technical alignment
GENERAL	Ordinary non-sensitive operations


Context classification supports policy and risk evaluation.

It should not be used as a substitute for human accountability.


---

12. Risk Classes

EVT records should include a risk class.

Allowed risk classes:

Risk	Meaning

LOW	Safe ordinary operation
MEDIUM	Requires attention or auditability
HIGH	Sensitive, strategic or potentially impactful
CRITICAL	Requires strict human review or institutional authorization
PROHIBITED	Must be blocked
UNKNOWN	Cannot be classified safely


Default decision by risk class:

Risk	Default Decision

LOW	ALLOW
MEDIUM	ALLOW or AUDIT
HIGH	ESCALATE or DEGRADE
CRITICAL	ESCALATE or BLOCK
PROHIBITED	BLOCK
UNKNOWN	ESCALATE or BLOCK


The protocol must not convert unknown risk into automatic permission.


---

13. Governance Decisions

The EVT must record the governance decision.

Allowed decisions:

Decision	Meaning

ALLOW	Operation is permitted
BLOCK	Operation is prohibited or unsafe
ESCALATE	Operation requires review
DEGRADE	Only limited safe output is permitted
AUDIT	Operation must be recorded or reviewed
NOOP	No operational action was taken


The decision must be generated before or during execution, not invented after the fact.

The EVT should represent the actual governance state of the runtime.


---

14. Fail-Closed Flag

Each EVT should include a fail-closed indicator.

Example:

{
  "fail_closed": true,
  "fail_closed_reason": "Risk class could not be safely determined"
}

The fail-closed flag should be true when:

identity is missing;

policy cannot be applied;

risk cannot be classified;

the request is prohibited;

the operation may enable abuse;

the trace cannot be generated;

continuity cannot be preserved;

authorization is unclear;

the runtime state is invalid.


Fail-closed is not failure.

Fail-closed is controlled refusal.


---

15. Hashing

Each EVT should support hashing.

Recommended hash algorithm:

sha256

The hash should be computed from a deterministic representation of the EVT object.

Recommended canonicalization method:

deterministic-json

Hashing should exclude fields that cannot remain stable across verification environments unless explicitly defined.

Example trace object:

{
  "hash_algorithm": "sha256",
  "canonicalization": "deterministic-json",
  "hash": "sha256:example"
}

The hash creates a compact verification reference for the event.

It does not replace the need for correct governance.


---

16. Canonicalization

Canonicalization ensures that the same EVT object produces the same hash.

Recommended rules:

1. Use deterministic JSON serialization.


2. Sort object keys.


3. Preserve exact string values.


4. Use ISO 8601 timestamps.


5. Avoid non-deterministic fields inside the hashed payload.


6. Avoid environment-dependent formatting.


7. Store binary payloads as external references, not inline content.


8. Hash references to large files rather than embedding them directly.



The goal is reproducibility.

A verifier should be able to recompute the hash from the canonical event object.


---

17. Ledger Layer

The ledger layer stores EVT records or EVT references.

The ledger may be implemented as:

append-only JSONL;

database table;

signed event registry;

file-based evidence store;

external verification layer;

hybrid local and remote evidence structure.


The ledger should preserve:

event order;

event identity;

previous event reference;

hash;

verification status;

audit metadata.


The ledger should not silently rewrite historical events.

Corrections should be represented as new events.


---

18. Event Correction

If an EVT contains an error, the correction must not silently mutate the original event.

Instead, the system should generate a correction event.

Example:

{
  "evt": "EVT-20260429-160000-0003",
  "prev": "EVT-20260429-153001-0002",
  "operation": {
    "type": "EVENT_CORRECTION",
    "corrects": "EVT-20260429-153001-0002",
    "reason": "Incorrect context class"
  }
}

This preserves continuity and auditability.

The protocol treats correction as a new trace, not as erasure.


---

19. Payload Handling

EVT records should avoid storing unnecessary sensitive payloads.

Recommended payload strategy:

Payload Type	Recommended Handling

Ordinary text	Store summary or reference
Sensitive text	Store hash or controlled reference
User files	Store file reference, metadata and hash
Large files	Store external reference and checksum
Private data	Minimize, redact or avoid storage
Security-sensitive content	Store governance decision, not harmful details


The EVT should prove that an operation occurred without unnecessarily exposing protected content.


---

20. Verification Status

Allowed verification statuses:

Status	Meaning

VERIFIABLE	EVT has sufficient data for verification
PARTIAL	EVT is incomplete but still useful
INVALID	EVT failed structural validation
UNVERIFIED	EVT has not yet been checked
ANCHORED	EVT or batch has external anchor
SUPERSEDED	EVT was corrected by a later event


Verification status should be explicit.

An event without verification metadata should not be treated as fully verified.


---

21. Audit Status

Allowed audit statuses:

Status	Meaning

READY	Available for audit
REQUIRED	Audit required before continuation
REVIEWED	Reviewed by authorized human or process
DISPUTED	Event or operation is contested
LOCKED	Event is closed against mutation
REJECTED	Event is not accepted as valid evidence


Audit status is separate from verification status.

Verification concerns technical consistency.

Audit concerns review, accountability and institutional usability.


---

22. Minimal EVT Schema

A minimal schema for implementation:

{
  "type": "object",
  "required": [
    "evt",
    "prev",
    "entity",
    "ipr",
    "timestamp",
    "runtime",
    "context",
    "governance",
    "operation",
    "trace",
    "verification"
  ],
  "properties": {
    "evt": {
      "type": "string"
    },
    "prev": {
      "type": "string"
    },
    "entity": {
      "type": "string"
    },
    "ipr": {
      "type": "string"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "runtime": {
      "type": "object"
    },
    "context": {
      "type": "object"
    },
    "governance": {
      "type": "object"
    },
    "operation": {
      "type": "object"
    },
    "trace": {
      "type": "object"
    },
    "verification": {
      "type": "object"
    }
  }
}

This schema is intentionally minimal.

Future versions may define stricter validation.


---

23. Example: Allowed Operation

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
    "type": "CREATE_DOCUMENTATION_FILE",
    "target": "EVT_PROTOCOL.md",
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


---

24. Example: Blocked Operation

{
  "evt": "EVT-20260429-153100-0002",
  "prev": "EVT-20260429-153000-0001",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T15:31:00+02:00",
  "runtime": {
    "name": "AI JOKER-C2",
    "core": "HBCE-CORE-v3",
    "state": "OPERATIONAL"
  },
  "context": {
    "class": "SECURITY",
    "domain": "CYBERSECURITY",
    "sensitivity": "HIGH"
  },
  "governance": {
    "risk": "PROHIBITED",
    "decision": "BLOCK",
    "policy": "NON_OFFENSIVE_DUAL_USE_BOUNDARY",
    "fail_closed": true,
    "fail_closed_reason": "Requested operation may enable unauthorized offensive activity"
  },
  "operation": {
    "type": "REQUEST_BLOCKED",
    "status": "NOT_EXECUTED"
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


---

25. Event Chain Example

A simple event chain:

GENESIS
  -> EVT-20260429-153000-0001
  -> EVT-20260429-153100-0002
  -> EVT-20260429-153200-0003

Each event points backward.

This creates operational continuity.

The chain does not need to expose every internal detail publicly.

It must preserve enough structure for reconstruction and verification.


---

26. Public and Internal EVT Modes

AI JOKER-C2 may support two EVT visibility modes.

Mode	Description

Public EVT	Minimal safe event metadata suitable for public demonstration
Internal EVT	Full governance and audit metadata for controlled environments


Public EVT should avoid exposing:

private user data;

sensitive payloads;

operational secrets;

security-sensitive instructions;

personal data without lawful basis;

internal credentials;

protected infrastructure details.


Internal EVT may contain richer metadata under controlled access.


---

27. EVT and MATRIX

Within the MATRIX framework, EVT is the trace unit.

The relation is:

MATRIX = strategic framework
AI JOKER-C2 = operational runtime
IPR = identity
EVT = event trace
Ledger = continuity layer
Hash = verification reference
Fail-closed = safety boundary

MATRIX defines why governance is necessary.

AI JOKER-C2 executes the governed operation.

EVT proves that the operation entered the sequence of time, identity, risk and decision.


---

28. EVT and Fail-Closed Governance

The EVT Protocol must support fail-closed governance.

The runtime must not hide blocked operations.

A blocked operation is still an important event.

It shows that the system refused to execute outside its boundary.

Therefore, BLOCK and ESCALATE events should be recorded when appropriate.

A system that only records successful operations is not a governance system.

A governance system must also record refusal, degradation and escalation.


---

29. Implementation Notes

Prototype implementation may start with:

in-memory event generation;

local JSON event array;

append-only JSONL file;

deterministic hash function;

simple previous event pointer;

verification endpoint;

dashboard event view.


Recommended future implementation:

signed event records;

ED25519 signatures;

batch anchoring;

evidence packs;

role-based access;

external verifier;

schema validation;

audit export;

integrity checks.


The protocol should evolve without breaking the canonical fields.


---

30. Non-Offensive Boundary

The EVT Protocol must never be used to legitimize prohibited activity.

Recording an unsafe operation does not make that operation acceptable.

The protocol records governance.

It does not authorize abuse.

The system must continue to block, degrade or escalate operations that involve:

unauthorized access;

offensive cyber behavior;

malware;

exploit deployment;

credential theft;

unlawful surveillance;

autonomous targeting;

sabotage;

manipulation;

rights violations.


The EVT chain must prove restraint as much as execution.


---

31. Canonical EVT Formula

No operation without identity.
No decision without risk.
No execution without policy.
No continuity without EVT.
No legitimacy without verification.

Expanded formula:

Identity -> Risk -> Decision -> Event -> Hash -> Ledger -> Verification -> Continuity


---

32. Status

Document status: active protocol file
Project: AI JOKER-C2
Framework: MATRIX
Infrastructure: HBCE
Identity layer: IPR
Trace layer: EVT
Governance principle: fail-closed
Maintainer: HBCE Research
Organization: HERMETICUM B.C.E. S.r.l.
Territorial anchor: Torino, Italy, Europe
Year: 2026

