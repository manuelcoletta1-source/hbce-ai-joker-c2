# AI JOKER-C2 EVT Protocol

## Event Trace Protocol for MATRIX, CORPUS and APOKALYPSIS

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
- project domain;
- input context;
- intent classification;
- policy evaluation;
- risk classification;
- governance decision;
- execution result;
- timestamp;
- previous event reference;
- hash;
- ledger continuity;
- verification status;
- audit status;
- continuity state.

The purpose of the EVT Protocol is to transform AI-assisted operations into reconstructable, auditable and continuity-preserving sequences.

AI JOKER-C2 connects three primary domains:

1. MATRIX
2. CORPUS ESOTEROLOGIA ERMETICA
3. APOKALYPSIS

The EVT Protocol must therefore record not only what happened, but also inside which project domain the operation happened.

---

## 2. Protocol Definition

The EVT Protocol is the event trace layer of AI JOKER-C2.

It defines how the runtime records relevant operations and links them into a chain.

The conceptual sequence is:

```txt
operation -> project domain -> governance decision -> EVT generation -> hash -> ledger -> verification -> continuity
```

A valid EVT should answer the following questions:

1. What happened?
2. When did it happen?
3. Which identity was bound to the operation?
4. Which project domain was active?
5. Which context was involved?
6. Which risk class was assigned?
7. Which governance decision was produced?
8. Was the operation allowed, blocked, escalated, degraded or audited?
9. Which previous event does this operation follow?
10. Can the event be verified?
11. Does the event preserve continuity?

The protocol ensures that every relevant operation can be examined after execution.

---

## 3. Role of EVT in AI JOKER-C2

AI JOKER-C2 is not designed as a generic AI interface.

It is an identity-bound cognitive command runtime.

The EVT Protocol gives the system a memory of action.

This memory is not psychological.

It is operational.

It allows the runtime to preserve a structured relation between:

- identity;
- project domain;
- request;
- response;
- risk;
- decision;
- evidence;
- time;
- continuity.

Without EVT, AI JOKER-C2 would only produce outputs.

With EVT, AI JOKER-C2 produces outputs inside a verifiable operational sequence.

---

## 4. Canonical Project Formula

```txt
MATRIX = operational infrastructure
CORPUS ESOTEROLOGIA ERMETICA = disciplinary grammar
APOKALYPSIS = historical threshold analysis
AI JOKER-C2 = cognitive command runtime
```

Expanded:

```txt
MATRIX builds the operational system.
CORPUS defines the grammar of operational reality.
APOKALYPSIS reads the historical threshold.
AI JOKER-C2 executes the cognitive runtime.
EVT records the operation inside time, identity, risk and continuity.
```

---

## 5. Canonical Runtime Sequence

The canonical runtime sequence is:

```txt
identity -> input -> context -> project_domain -> intent -> policy -> risk -> decision -> execution -> EVT -> ledger -> verification -> continuity
```

Each EVT is generated after governance evaluation and records the operational state of the request.

| Stage | EVT Relevance |
|---|---|
| identity | Defines who or what is bound to the operation |
| input | Records the existence of a request without necessarily storing full payload |
| context | Classifies the operational context |
| project_domain | Records MATRIX, CORPUS, APOKALYPSIS, GENERAL or MULTI_DOMAIN |
| intent | Classifies the operational purpose |
| policy | Records the governance boundary applied |
| risk | Assigns a risk class |
| decision | Stores ALLOW, BLOCK, ESCALATE, DEGRADE or AUDIT |
| execution | Records whether an action was performed |
| EVT | Creates the event object |
| ledger | Stores or links the event |
| verification | Allows later inspection |
| continuity | Links the event to the previous operational state |

The runtime must not treat relevant operations as isolated responses.

Relevant operations must be treated as event-linked actions.

---

## 6. EVT Object Structure

A minimal EVT object should follow this structure:

```json
{
  "evt": "EVT-20260503-153000-AI-JOKER-C2-0001",
  "prev": "EVT-0014-AI",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-05-03T15:30:00+02:00",
  "runtime": {
    "name": "AI JOKER-C2",
    "core": "HBCE-CORE-v3",
    "state": "OPERATIONAL"
  },
  "project": {
    "ecosystem": "HERMETICUM B.C.E.",
    "domain": "MATRIX",
    "domain_type": "OPERATIONAL_INFRASTRUCTURE_DOMAIN"
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
    "type": "UPDATE_EVT_PROTOCOL",
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
```

This structure may be extended, but the core fields must remain stable.

---

## 7. Required Fields

The following fields are required for a valid EVT.

| Field | Description |
|---|---|
| evt | Unique event identifier |
| prev | Previous event reference |
| entity | Runtime entity responsible for the event |
| ipr | Identity Primary Record reference |
| timestamp | Time of event generation |
| runtime | Runtime metadata |
| project | Ecosystem and project-domain metadata |
| context | Operational context classification |
| governance | Risk, policy and decision metadata |
| operation | Type and result of the operation |
| trace | Hash and canonicalization information |
| verification | Verification and audit status |

A missing required field should downgrade the event to `INVALID` or `INCOMPLETE`.

A sensitive operation with an invalid EVT should not proceed as fully authorized.

---

## 8. EVT Identifier

The EVT identifier should be unique, stable and machine-readable.

Recommended format:

```txt
EVT-YYYYMMDD-HHMMSS-AI-JOKER-C2-NNNN
```

Example:

```txt
EVT-20260503-153000-AI-JOKER-C2-0001
```

Alternative runtime-generated format:

```txt
EVT-1777046038573
```

Both formats are acceptable during prototype development if they remain unique and traceable.

The repository may use timestamp-based identifiers during prototype development and stricter canonical identifiers in later versions.

---

## 9. Previous Event Reference

The `prev` field preserves continuity.

For the first event in a chain, the value may be:

```txt
GENESIS
```

For all subsequent events, `prev` should reference the previous EVT identifier or previous event hash.

Example:

```json
{
  "evt": "EVT-20260503-153001-AI-JOKER-C2-0002",
  "prev": "EVT-20260503-153000-AI-JOKER-C2-0001"
}
```

The purpose of `prev` is to prevent isolated, unbound and non-reconstructable operations.

AI JOKER-C2 should operate as a continuity chain, not as disconnected output generation.

---

## 10. Identity Binding

Each EVT must be bound to an identity context.

Canonical identity fields:

| Field | Value |
|---|---|
| entity | AI_JOKER |
| ipr | IPR-AI-0001 |
| runtime | AI JOKER-C2 |
| core | HBCE-CORE-v3 |
| organization | HERMETICUM B.C.E. S.r.l. |
| research_signature | HBCE Research |
| territorial_anchor | Torino, Italy, Europe |

Identity binding does not mean that every public answer must expose internal metadata.

It means that relevant runtime operations must preserve an internal relation between action and identity.

No relevant operation should exist without an identity reference.

Identity does not authorize unsafe execution.

Identity creates traceable position inside a governed runtime.

---

## 11. Project Domain Binding

Each EVT should include a project-domain binding.

Allowed project-domain values:

| Domain | Meaning |
|---|---|
| MATRIX | Operational infrastructure, European governance, B2B/B2G, AI governance, technical systems |
| CORPUS_ESOTEROLOGIA_ERMETICA | Disciplinary grammar, DCTT, canonical glossary, theoretical volumes |
| APOKALYPSIS | Historical threshold, decay, exposure, cultural-political-social system analysis |
| GENERAL | No specific project domain applies |
| MULTI_DOMAIN | More than one project domain applies |

Project-domain binding allows the runtime to reconstruct not only what happened, but also why that operation belonged to a specific layer of the ecosystem.

Example:

```json
{
  "project": {
    "ecosystem": "HERMETICUM B.C.E.",
    "domain": "CORPUS_ESOTEROLOGIA_ERMETICA",
    "domain_type": "DISCIPLINARY_GRAMMAR_DOMAIN",
    "canonical_formula": "Decisione · Costo · Traccia · Tempo"
  }
}
```

Multi-domain example:

```json
{
  "project": {
    "ecosystem": "HERMETICUM B.C.E.",
    "domain": "MULTI_DOMAIN",
    "active_domains": [
      "MATRIX",
      "CORPUS_ESOTEROLOGIA_ERMETICA",
      "APOKALYPSIS"
    ],
    "runtime_role": "COGNITIVE_COMMAND_RUNTIME"
  }
}
```

---

## 12. Runtime State

The EVT should record runtime state.

Allowed runtime states:

| State | Meaning |
|---|---|
| OPERATIONAL | Runtime is functioning normally |
| DEGRADED | Runtime is partially limited |
| BLOCKED | Runtime cannot proceed |
| INVALID | Runtime state is invalid or unverifiable |
| AUDIT_ONLY | Runtime can record but not execute |
| MAINTENANCE | Runtime is under controlled modification |

Runtime state affects governance decisions.

A `DEGRADED` runtime may still produce safe outputs.

A `BLOCKED` or `INVALID` runtime must not execute sensitive operations.

---

## 13. Context Classes

AI JOKER-C2 may classify events into operational contexts.

Suggested context classes:

| Context | Description |
|---|---|
| IDENTITY | IPR, EVT, lineage, identity binding |
| MATRIX | MATRIX framework, infrastructure and strategic systems |
| CORPUS | CORPUS ESOTEROLOGIA ERMETICA, DCTT, glossary and volumes |
| APOKALYPSIS | Decay, exposure, threshold and civilizational analysis |
| DOCUMENTAL | File analysis, document processing, structured output |
| TECHNICAL | Code, architecture, APIs, implementation |
| GITHUB | Repository files, commits, documentation |
| EDITORIAL | Books, corpus, publication work |
| STRATEGIC | B2B, B2G, institutional positioning |
| SECURITY | Defensive security, risk and resilience |
| COMPLIANCE | Governance, audit, legal-technical alignment |
| GOVERNANCE | Policy, risk, decision and fail-closed logic |
| GENERAL | Ordinary non-sensitive operations |

Context classification supports policy and risk evaluation.

It should not be used as a substitute for human accountability.

---

## 14. Risk Classes

EVT records should include a risk class.

Allowed risk classes:

| Risk | Meaning |
|---|---|
| LOW | Safe ordinary operation |
| MEDIUM | Requires attention or auditability |
| HIGH | Sensitive, strategic or potentially impactful |
| CRITICAL | Requires strict human review or institutional authorization |
| PROHIBITED | Must be blocked |
| UNKNOWN | Cannot be classified safely |

Default decision by risk class:

| Risk | Default Decision |
|---|---|
| LOW | ALLOW |
| MEDIUM | ALLOW or AUDIT |
| HIGH | ESCALATE or DEGRADE |
| CRITICAL | ESCALATE or BLOCK |
| PROHIBITED | BLOCK |
| UNKNOWN | ESCALATE or BLOCK |

The protocol must not convert unknown risk into automatic permission.

---

## 15. Governance Decisions

The EVT must record the governance decision.

Allowed decisions:

| Decision | Meaning |
|---|---|
| ALLOW | Operation is permitted |
| BLOCK | Operation is prohibited or unsafe |
| ESCALATE | Operation requires review |
| DEGRADE | Only limited safe output is permitted |
| AUDIT | Operation must be recorded or reviewed |
| NOOP | No operational action was taken |

The decision must be generated before or during execution, not invented after the fact.

The EVT should represent the actual governance state of the runtime.

---

## 16. Fail-Closed Flag

Each EVT should include a fail-closed indicator.

Example:

```json
{
  "fail_closed": true,
  "fail_closed_reason": "Risk class could not be safely determined"
}
```

The fail-closed flag should be `true` when:

- identity is missing;
- project domain cannot be classified in a sensitive context;
- policy cannot be applied;
- risk cannot be classified;
- the request is prohibited;
- the operation may enable abuse;
- the trace cannot be generated;
- continuity cannot be preserved;
- authorization is unclear;
- the runtime state is invalid.

Fail-closed is not failure.

Fail-closed is controlled refusal, controlled limitation or controlled escalation.

---

## 17. Hashing

Each EVT should support hashing.

Recommended hash algorithm:

```txt
sha256
```

The hash should be computed from a deterministic representation of the EVT object.

Recommended canonicalization method:

```txt
deterministic-json
```

Hashing should exclude fields that cannot remain stable across verification environments unless explicitly defined.

Example trace object:

```json
{
  "hash_algorithm": "sha256",
  "canonicalization": "deterministic-json",
  "hash": "sha256:example"
}
```

The hash creates a compact verification reference for the event.

It does not replace the need for correct governance.

---

## 18. Canonicalization

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
9. Keep project-domain values stable.
10. Keep context-class values stable.

The goal is reproducibility.

A verifier should be able to recompute the hash from the canonical event object.

---

## 19. Ledger Layer

The ledger layer stores EVT records or EVT references.

The ledger may be implemented as:

- append-only JSONL;
- database table;
- signed event registry;
- file-based evidence store;
- external verification layer;
- hybrid local and remote evidence structure.

The ledger should preserve:

- event order;
- event identity;
- previous event reference;
- project domain;
- context class;
- risk class;
- governance decision;
- hash;
- verification status;
- audit metadata.

The ledger should not silently rewrite historical events.

Corrections should be represented as new events.

---

## 20. Event Correction

If an EVT contains an error, the correction must not silently mutate the original event.

Instead, the system should generate a correction event.

Example:

```json
{
  "evt": "EVT-20260503-160000-AI-JOKER-C2-0003",
  "prev": "EVT-20260503-153001-AI-JOKER-C2-0002",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-05-03T16:00:00+02:00",
  "project": {
    "ecosystem": "HERMETICUM B.C.E.",
    "domain": "MULTI_DOMAIN"
  },
  "operation": {
    "type": "EVENT_CORRECTION",
    "corrects": "EVT-20260503-153001-AI-JOKER-C2-0002",
    "reason": "Incorrect project domain"
  }
}
```

This preserves continuity and auditability.

The protocol treats correction as a new trace, not as erasure.

---

## 21. Payload Handling

EVT records should avoid storing unnecessary sensitive payloads.

Recommended payload strategy:

| Payload Type | Recommended Handling |
|---|---|
| Ordinary text | Store summary or reference |
| Sensitive text | Store hash or controlled reference |
| User files | Store file reference, metadata and hash |
| Large files | Store external reference and checksum |
| Private data | Minimize, redact or avoid storage |
| Security-sensitive content | Store governance decision, not harmful details |
| Editorial files | Store document reference, section and operation type |
| Repository files | Store file path, operation type and commit reference when available |

The EVT should prove that an operation occurred without unnecessarily exposing protected content.

---

## 22. Verification Status

Allowed verification statuses:

| Status | Meaning |
|---|---|
| VERIFIABLE | EVT has sufficient data for verification |
| PARTIAL | EVT is incomplete but still useful |
| INVALID | EVT failed structural validation |
| UNVERIFIED | EVT has not yet been checked |
| ANCHORED | EVT or batch has external anchor |
| SUPERSEDED | EVT was corrected by a later event |

Verification status should be explicit.

An event without verification metadata should not be treated as fully verified.

---

## 23. Audit Status

Allowed audit statuses:

| Status | Meaning |
|---|---|
| READY | Available for audit |
| REQUIRED | Audit required before continuation |
| REVIEWED | Reviewed by authorized human or process |
| DISPUTED | Event or operation is contested |
| LOCKED | Event is closed against mutation |
| REJECTED | Event is not accepted as valid evidence |

Audit status is separate from verification status.

Verification concerns technical consistency.

Audit concerns review, accountability and institutional usability.

---

## 24. Minimal EVT Schema

A minimal schema for implementation:

```json
{
  "type": "object",
  "required": [
    "evt",
    "prev",
    "entity",
    "ipr",
    "timestamp",
    "runtime",
    "project",
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
    "project": {
      "type": "object",
      "required": [
        "ecosystem",
        "domain"
      ],
      "properties": {
        "ecosystem": {
          "type": "string"
        },
        "domain": {
          "type": "string",
          "enum": [
            "MATRIX",
            "CORPUS_ESOTEROLOGIA_ERMETICA",
            "APOKALYPSIS",
            "GENERAL",
            "MULTI_DOMAIN"
          ]
        },
        "active_domains": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      }
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
```

This schema is intentionally minimal.

Future versions may define stricter validation.

---

## 25. Example: MATRIX Allowed Operation

```json
{
  "evt": "EVT-20260503-153000-AI-JOKER-C2-0001",
  "prev": "EVT-0014-AI",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-05-03T15:30:00+02:00",
  "runtime": {
    "name": "AI JOKER-C2",
    "core": "HBCE-CORE-v3",
    "state": "OPERATIONAL"
  },
  "project": {
    "ecosystem": "HERMETICUM B.C.E.",
    "domain": "MATRIX",
    "domain_type": "OPERATIONAL_INFRASTRUCTURE_DOMAIN"
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
    "type": "UPDATE_DOCUMENTATION_FILE",
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
```

---

## 26. Example: CORPUS Editorial Operation

```json
{
  "evt": "EVT-20260503-153500-AI-JOKER-C2-0002",
  "prev": "EVT-20260503-153000-AI-JOKER-C2-0001",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-05-03T15:35:00+02:00",
  "runtime": {
    "name": "AI JOKER-C2",
    "core": "HBCE-CORE-v3",
    "state": "OPERATIONAL"
  },
  "project": {
    "ecosystem": "HERMETICUM B.C.E.",
    "domain": "CORPUS_ESOTEROLOGIA_ERMETICA",
    "domain_type": "DISCIPLINARY_GRAMMAR_DOMAIN",
    "canonical_formula": "Decisione · Costo · Traccia · Tempo"
  },
  "context": {
    "class": "EDITORIAL",
    "domain": "CORPUS",
    "sensitivity": "LOW"
  },
  "governance": {
    "risk": "LOW",
    "decision": "ALLOW",
    "policy": "EDITORIAL_CONTINUITY",
    "fail_closed": false
  },
  "operation": {
    "type": "CHAPTER_RESTRUCTURING",
    "target": "CORPUS_VOLUME_SECTION",
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
```

---

## 27. Example: APOKALYPSIS Historical Analysis Operation

```json
{
  "evt": "EVT-20260503-154000-AI-JOKER-C2-0003",
  "prev": "EVT-20260503-153500-AI-JOKER-C2-0002",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-05-03T15:40:00+02:00",
  "runtime": {
    "name": "AI JOKER-C2",
    "core": "HBCE-CORE-v3",
    "state": "OPERATIONAL"
  },
  "project": {
    "ecosystem": "HERMETICUM B.C.E.",
    "domain": "APOKALYPSIS",
    "domain_type": "HISTORICAL_THRESHOLD_DOMAIN"
  },
  "context": {
    "class": "EDITORIAL",
    "domain": "HISTORICAL_THRESHOLD_ANALYSIS",
    "sensitivity": "LOW"
  },
  "governance": {
    "risk": "LOW",
    "decision": "ALLOW",
    "policy": "THEORETICAL_AND_EDITORIAL_ANALYSIS",
    "fail_closed": false
  },
  "operation": {
    "type": "HISTORICAL_THRESHOLD_ANALYSIS",
    "target": "APOKALYPSIS_VOLUME_SECTION",
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
```

---

## 28. Example: Blocked Operation

```json
{
  "evt": "EVT-20260503-154100-AI-JOKER-C2-0004",
  "prev": "EVT-20260503-154000-AI-JOKER-C2-0003",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-05-03T15:41:00+02:00",
  "runtime": {
    "name": "AI JOKER-C2",
    "core": "HBCE-CORE-v3",
    "state": "OPERATIONAL"
  },
  "project": {
    "ecosystem": "HERMETICUM B.C.E.",
    "domain": "MATRIX",
    "domain_type": "OPERATIONAL_INFRASTRUCTURE_DOMAIN"
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
```

---

## 29. Event Chain Example

A simple event chain:

```txt
GENESIS
-> EVT-0014-AI
-> EVT-20260503-153000-AI-JOKER-C2-0001
-> EVT-20260503-153500-AI-JOKER-C2-0002
-> EVT-20260503-154000-AI-JOKER-C2-0003
-> EVT-20260503-154100-AI-JOKER-C2-0004
```

Each event points backward.

This creates operational continuity.

The chain does not need to expose every internal detail publicly.

It must preserve enough structure for reconstruction and verification.

---

## 30. Public and Internal EVT Modes

AI JOKER-C2 may support two EVT visibility modes.

| Mode | Description |
|---|---|
| Public EVT | Minimal safe event metadata suitable for public demonstration |
| Internal EVT | Full governance and audit metadata for controlled environments |

Public EVT should avoid exposing:

- private user data;
- sensitive payloads;
- operational secrets;
- security-sensitive instructions;
- personal data without lawful basis;
- internal credentials;
- protected infrastructure details.

Internal EVT may contain richer metadata under controlled access.

---

## 31. EVT and MATRIX

Within the MATRIX framework, EVT is the trace unit for operational infrastructure.

The relation is:

```txt
MATRIX = strategic and operational infrastructure framework
AI JOKER-C2 = cognitive command runtime
IPR = identity
EVT = event trace
Ledger = continuity layer
Hash = verification reference
Fail-closed = safety boundary
```

MATRIX defines why governance is necessary.

AI JOKER-C2 executes the governed operation.

EVT proves that the operation entered the sequence of time, identity, risk and decision.

---

## 32. EVT and CORPUS ESOTEROLOGIA ERMETICA

Within the CORPUS ESOTEROLOGIA ERMETICA, EVT is the trace unit for conceptual and editorial continuity.

The relation is:

```txt
CORPUS = disciplinary grammar
Decisione · Costo · Traccia · Tempo = foundational sequence
AI JOKER-C2 = cognitive runtime
EVT = trace of the operation
Time = verification of continuity
```

The Corpus defines the grammar of operational reality.

AI JOKER-C2 applies that grammar to writing, restructuring, glossary alignment and conceptual continuity.

EVT preserves the event of transformation.

---

## 33. EVT and APOKALYPSIS

Within APOKALYPSIS, EVT is the trace unit for historical-threshold analysis.

The relation is:

```txt
APOKALYPSIS = historical threshold analysis
Decay = exposure of system foundation loss
AI JOKER-C2 = analytical runtime
EVT = recorded transition inside the chain
Verification = reconstruction of the operation
```

APOKALYPSIS studies the point where the cultural, political and social system continues to function while losing its foundation.

AI JOKER-C2 maps this analysis into structured outputs.

EVT records the operation that produced or modified that analysis.

---

## 34. EVT and Fail-Closed Governance

The EVT Protocol must support fail-closed governance.

The runtime must not hide blocked operations.

A blocked operation is still an important event.

It shows that the system refused to execute outside its boundary.

Therefore, `BLOCK`, `ESCALATE`, `DEGRADE` and `AUDIT` events should be recorded when appropriate.

A system that only records successful operations is not a governance system.

A governance system must also record refusal, degradation and escalation.

---

## 35. Implementation Notes

Prototype implementation may start with:

- in-memory event generation;
- local JSON event array;
- append-only JSONL file;
- deterministic hash function;
- simple previous event pointer;
- verification endpoint;
- dashboard event view;
- project-domain field;
- context-class field.

Recommended future implementation:

- signed event records;
- ED25519 signatures;
- batch anchoring;
- evidence packs;
- role-based access;
- external verifier;
- schema validation;
- audit export;
- integrity checks;
- project-domain filters;
- public-safe verification mode.

The protocol should evolve without breaking the canonical fields.

---

## 36. Non-Offensive Boundary

The EVT Protocol must never be used to legitimize prohibited activity.

Recording an unsafe operation does not make that operation acceptable.

The protocol records governance.

It does not authorize abuse.

The system must continue to block, degrade or escalate operations that involve:

- unauthorized access;
- offensive cyber behavior;
- malware;
- exploit deployment;
- credential theft;
- unlawful surveillance;
- autonomous targeting;
- sabotage;
- manipulation;
- rights violations.

The EVT chain must prove restraint as much as execution.

---

## 37. Canonical EVT Formula

```txt
No operation without identity.
No domain without classification.
No decision without risk.
No execution without policy.
No continuity without EVT.
No legitimacy without verification.
```

Expanded formula:

```txt
Identity -> Project Domain -> Risk -> Decision -> Event -> Hash -> Ledger -> Verification -> Continuity
```

Project formula:

```txt
MATRIX = infrastructure.
CORPUS = grammar.
APOKALYPSIS = threshold.
AI JOKER-C2 = runtime.
EVT = trace.
```

---

## 38. Status

| Field | Value |
|---|---|
| Document | EVT_PROTOCOL.md |
| Status | Active protocol file |
| Project | AI JOKER-C2 |
| Ecosystem | HERMETICUM B.C.E. |
| Connected domains | MATRIX, CORPUS ESOTEROLOGIA ERMETICA, APOKALYPSIS |
| Infrastructure | HBCE |
| Identity layer | IPR |
| Trace layer | EVT |
| Ledger layer | Append-only continuity |
| Verification layer | Hash and audit reconstruction |
| Governance principle | Fail-closed |
| Maintainer | HBCE Research |
| Organization | HERMETICUM B.C.E. S.r.l. |
| Territorial anchor | Torino, Italy, Europe |
| Year | 2026 |
