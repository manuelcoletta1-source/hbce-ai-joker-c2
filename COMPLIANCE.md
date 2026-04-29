# AI JOKER-C2 Compliance Orientation

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the compliance-oriented structure of AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

This document does not claim legal certification.

This document does not replace legal advice.

This document defines how the repository is structured to support compliance-oriented, audit-ready and governance-aware AI operations.

The compliance objective is to make AI-assisted operations:

- attributable;
- traceable;
- policy-aware;
- risk-classified;
- human-accountable;
- auditable;
- verifiable;
- fail-closed by design.

---

## 2. Compliance Position

AI JOKER-C2 is not presented as a certified compliance product.

It is presented as a technical and governance architecture that can support compliance-oriented workflows.

The system is designed to help organizations structure:

- AI governance;
- cybersecurity governance;
- risk classification;
- human oversight;
- operational traceability;
- event logging;
- audit preparation;
- incident documentation;
- evidence generation;
- critical systems continuity.

The repository should be read as:

```txt
research architecture + operational prototype + governance model

It should not be read as:

legal certification + production compliance guarantee


---

3. Compliance-Oriented Design Principle

The central compliance-oriented principle is:

No sensitive AI operation without identity, policy, risk classification, trace and reviewability.

Expanded:

Identity -> Policy -> Risk -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity

This sequence supports compliance-oriented work because it makes operations reconstructable.

A reviewer should be able to understand:

who or what acted;

what request was processed;

which context was involved;

which policy was applied;

which risk class was assigned;

which decision was produced;

whether execution occurred;

which event record was generated;

whether continuity was preserved;

whether the operation can be audited.



---

4. Regulatory Alignment Domains

AI JOKER-C2 is designed to support alignment discussions in the following domains.

Domain	Repository Support

AI governance	Risk classification, policy checks, human oversight and traceability
Cybersecurity resilience	Defensive security, incident structuring, secure runtime design
Data governance	Controlled file handling, minimization and safe references
Digital identity	Identity-bound runtime model through IPR
Auditability	EVT records, ledger continuity and verification logic
Operational accountability	Decisions, risk classes, audit status and human review
Critical infrastructure continuity	Fail-closed behavior, event chains and controlled escalation
Dual-use governance	Civil and strategic use boundary with prohibited-use controls


The repository does not claim automatic legal compliance with any specific regulation.

It provides an architecture that can support regulated discussions and implementation planning.


---

5. AI Governance Orientation

AI JOKER-C2 supports AI governance through:

identity-bound operation;

context classification;

risk classification;

policy evaluation;

governance decisions;

human accountability;

event traceability;

audit-ready evidence;

fail-closed behavior;

prohibited-use boundaries.


The runtime should distinguish between:

ordinary safe requests;

operationally relevant requests;

high-impact requests;

sensitive requests;

prohibited requests;

unclear or unknown-risk requests.


Suggested risk classes:

Risk	Meaning	Default Handling

LOW	Ordinary safe request	ALLOW
MEDIUM	Operationally relevant request	ALLOW or AUDIT
HIGH	Sensitive or strategic request	ESCALATE or DEGRADE
CRITICAL	Strict review required	ESCALATE or BLOCK
PROHIBITED	Unsafe or outside scope	BLOCK
UNKNOWN	Cannot be safely classified	ESCALATE or BLOCK


The system must not treat unknown risk as permission.


---

6. Human Oversight

AI JOKER-C2 preserves human accountability.

The system may assist with:

analysis;

classification;

documentation;

drafting;

risk mapping;

technical review;

governance structuring;

audit preparation;

evidence generation.


The system must not claim final authority over:

legal decisions;

medical decisions;

financial decisions;

military decisions;

law enforcement action;

coercive public authority;

critical infrastructure intervention;

irreversible operational execution.


For sensitive or high-impact domains, the runtime should support human review before operational action.

Suggested oversight states:

State	Meaning

NOT_REQUIRED	Ordinary safe operation
RECOMMENDED	Human review useful but not mandatory
REQUIRED	Human review required before continuation
COMPLETED	Human review completed
REJECTED	Human review rejected the operation
ESCALATED	Further authority required



---

7. Cybersecurity Governance Orientation

AI JOKER-C2 supports defensive cybersecurity governance.

Allowed cybersecurity support includes:

defensive architecture review;

incident report structuring;

risk mapping;

secure configuration guidance;

repository security review;

dependency hygiene;

safe debugging;

resilience planning;

audit trail design;

security documentation.


Prohibited cybersecurity support includes:

unauthorized intrusion;

exploit deployment;

malware development;

credential theft;

evasion of security tools;

persistence mechanisms;

stealth techniques;

sabotage;

offensive automation;

real-target attack instructions.


Cybersecurity support must remain defensive, lawful and accountable.


---

8. Data Governance Orientation

AI JOKER-C2 should handle user data and files according to minimization and controlled processing principles.

Recommended data handling rules:

process only necessary content;

avoid storing unnecessary sensitive data;

avoid logging secrets;

avoid exposing private data in public outputs;

prefer references and hashes for sensitive or large files;

reject unsupported or unsafe file types;

clearly state when file visibility is incomplete;

preserve user control over uploaded content;

avoid claiming verification beyond available evidence.


Suggested file handling classes:

Class	Handling

PUBLIC	May be summarized or referenced
INTERNAL	May be processed with care
SENSITIVE	Minimize, redact or reference only
SECRET	Do not store or expose
UNSUPPORTED	Reject or process as inert metadata only
UNKNOWN	Treat conservatively



---

9. Digital Identity Orientation

AI JOKER-C2 is identity-bound.

Canonical identity context:

Field	Value

Public name	AI JOKER-C2
Entity	AI_JOKER
IPR	IPR-AI-0001
Active checkpoint	EVT-0014-AI
Core	HBCE-CORE-v3
Framework	MATRIX
Infrastructure	HBCE
Organization	HERMETICUM B.C.E. S.r.l.
Territorial anchor	Torino, Italy, Europe


The IPR layer supports:

runtime attribution;

project continuity;

operational identity;

event binding;

audit reconstruction.


Identity-bound operation does not grant unrestricted authority.

Identity creates traceability.

Authority still requires policy, risk classification and lawful context.


---

10. EVT and Auditability

EVT means Event.

An EVT is a structured operational record.

The EVT layer supports compliance-oriented auditability because it records:

event identifier;

previous event reference;

entity;

IPR;

timestamp;

runtime state;

context class;

risk class;

governance decision;

operation type;

operation status;

hash;

verification status;

audit status.


A minimal EVT object may look like this:

{
  "evt": "EVT-20260429-153000-0001",
  "prev": "GENESIS",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T15:30:00+02:00",
  "context": {
    "class": "COMPLIANCE",
    "domain": "AI_GOVERNANCE",
    "sensitivity": "MEDIUM"
  },
  "governance": {
    "risk": "MEDIUM",
    "decision": "AUDIT",
    "policy": "COMPLIANCE_ORIENTED_OPERATION",
    "fail_closed": false
  },
  "operation": {
    "type": "COMPLIANCE_MAPPING",
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

The purpose of EVT is not decorative logging.

The purpose is operational reconstruction.


---

11. Ledger Continuity

The ledger layer should preserve event continuity.

Possible ledger implementations:

append-only JSONL file;

database table;

signed event registry;

evidence pack;

audit export;

external verification layer.


Ledger principles:

1. Historical events should not be silently rewritten.


2. Corrections should be represented as new events.


3. Each event should reference the previous event.


4. Verification metadata should be explicit.


5. Sensitive payloads should be minimized.


6. Public and internal event views should be separated.


7. Ledger export should support audit review.



Suggested correction pattern:

{
  "evt": "EVT-20260429-160000-0003",
  "prev": "EVT-20260429-153000-0002",
  "operation": {
    "type": "EVENT_CORRECTION",
    "corrects": "EVT-20260429-153000-0002",
    "reason": "Incorrect risk classification"
  }
}


---

12. Verification Orientation

Verification should allow a reviewer to reconstruct the event sequence.

A verification workflow should answer:

does the EVT exist?

does it include required fields?

does the previous event reference exist?

does the timestamp exist?

does the hash match the canonical payload?

does the governance decision match the risk class?

was the event allowed, blocked, escalated, degraded or audited?

is the verification status clear?

is the audit status clear?

was the operation corrected or superseded?


Suggested verification statuses:

Status	Meaning

VERIFIABLE	Sufficient data for verification
PARTIAL	Useful but incomplete
INVALID	Failed structural validation
UNVERIFIED	Not yet checked
ANCHORED	Externally anchored
SUPERSEDED	Corrected by later event



---

13. Fail-Closed Compliance Principle

Fail-closed is a compliance-oriented safety boundary.

The system should block, degrade or escalate when:

identity is missing;

authority is unclear;

policy is missing;

risk cannot be classified;

request is prohibited;

operation may enable abuse;

trace cannot be generated;

continuity cannot be preserved;

human review is required but absent;

legal or compliance basis is uncertain in a sensitive context.


The compliance rule is:

Uncertainty in sensitive operations does not authorize execution.

Fail-closed supports:

safety;

auditability;

accountability;

reviewability;

institutional trust.



---

14. Decision Layer

The decision layer should produce one of the following outcomes.

Decision	Meaning

ALLOW	Operation is permitted and traceable
BLOCK	Operation is prohibited or unsafe
ESCALATE	Human review or additional authority required
DEGRADE	Limited safe response only
AUDIT	Record or review required
NOOP	No operational action taken


The decision must be produced before or during execution.

A decision should not be invented after the fact to justify an operation.


---

15. Compliance Record

A compliance-oriented operation should produce or support a record containing:

operation identifier;

entity;

identity reference;

timestamp;

context class;

risk class;

policy reference;

governance decision;

human oversight state;

data handling class;

operation status;

verification status;

audit status;

hash or evidence reference;

correction reference, when applicable.


Example:

{
  "operation_id": "OP-20260429-0001",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T15:30:00+02:00",
  "context_class": "COMPLIANCE",
  "risk_class": "MEDIUM",
  "policy_reference": "COMPLIANCE_ORIENTED_OPERATION",
  "decision": "AUDIT",
  "human_oversight": "RECOMMENDED",
  "data_handling": "INTERNAL",
  "operation_status": "COMPLETED",
  "verification_status": "VERIFIABLE",
  "audit_status": "READY",
  "evidence_reference": "sha256:example"
}


---

16. AI Governance Checklist

Before deploying AI JOKER-C2 in a sensitive environment, review:

Is the runtime identity defined?
Is the operational scope defined?
Is the user authority defined?
Are prohibited uses documented?
Are risk classes implemented?
Are policy checks implemented?
Are governance decisions implemented?
Is human oversight defined?
Is file handling controlled?
Is sensitive data minimized?
Are EVT records generated?
Is ledger continuity preserved?
Is verification possible?
Is fail-closed behavior implemented?
Are logs safe?
Are secrets protected?
Is the system non-offensive by design?


---

17. Cybersecurity Checklist

Before production or institutional use, review:

Are secrets outside the repository?
Are environment variables protected?
Are API routes validated?
Are errors handled safely?
Are stack traces hidden in production?
Are file uploads controlled?
Are dependencies reviewed?
Has npm audit been run?
Does the build succeed?
Are logs free from secrets?
Is offensive functionality absent?
Are security reports handled responsibly?
Is fail-closed behavior preserved?

Recommended commands:

npm audit
npm outdated
npm run build


---

18. Data Handling Checklist

For file and data processing, review:

Is the data necessary for the operation?
Is sensitive data minimized?
Can a reference or hash replace full storage?
Are private contents excluded from logs?
Is the output safe to expose?
Is file visibility complete or partial?
Is unsupported content rejected safely?
Is user control preserved?
Is data handling reflected in EVT or audit metadata?


---

19. Human Oversight Checklist

For high-impact use cases, review:

Is human review required?
Who is the responsible human operator?
Is the decision advisory or operational?
Can the operation affect third parties?
Can the operation affect rights, access or services?
Can the operation affect critical systems?
Is escalation required?
Is the review result recorded?
Is the final responsibility preserved outside the model?


---

20. Dual-Use Governance Checklist

For dual-use contexts, review:

Is the use civil, defensive or strategic?
Is the user authorized?
Is the target system owned or authorized?
Is the request defensive?
Can the output enable abuse?
Can the output support offensive cyber operations?
Can the output support unlawful surveillance?
Can the output support coercive manipulation?
Is the operation traceable?
Is the operation auditable?
Should the system block, degrade or escalate?


---

21. Documentation Compliance

Repository documentation should remain aligned with:

README.md;

ARCHITECTURE.md;

GOVERNANCE.md;

EVT_PROTOCOL.md;

DUAL_USE_STRATEGIC_POSITIONING.md;

SECURITY.md;

ROADMAP.md;

COMPLIANCE.md.


Documentation must preserve the following:

1. non-offensive positioning;


2. identity-bound operation;


3. fail-closed principle;


4. event traceability;


5. human accountability;


6. compliance-oriented language;


7. no legal certification claim;


8. no unrestricted dual-use framing;


9. no unsafe operational instructions.




---

22. Compliance Mapping Table

Compliance Need	AI JOKER-C2 Architectural Support

Accountability	IPR identity, human oversight, decision records
Traceability	EVT records, previous event reference, ledger continuity
Risk management	risk classes, policy engine, governance decisions
Human oversight	oversight states, escalation, review requirement
Security	fail-closed, defensive boundary, secret hygiene
Auditability	verification status, audit status, event reconstruction
Data minimization	file handling rules, references, hashes, payload reduction
Incident review	event records, correction events, evidence packs
Critical continuity	ledger, runtime state, continuity chain
Dual-use control	authorized domains, prohibited uses, blocked operations



---

23. Compliance Artifacts

Future compliance-oriented artifacts may include:

docs/AI_GOVERNANCE_MAPPING.md
docs/CYBERSECURITY_GOVERNANCE_MAPPING.md
docs/HUMAN_OVERSIGHT_MODEL.md
docs/RISK_REGISTER_TEMPLATE.md
docs/AUDIT_CHECKLIST.md
docs/INCIDENT_REPORT_TEMPLATE.md
docs/DATA_HANDLING_MODEL.md
docs/DUAL_USE_RISK_REGISTER.md
docs/COMPLIANCE_DISCLAIMER.md

These artifacts should support review and implementation.

They should not claim certification.


---

24. Non-Certification Statement

AI JOKER-C2 is a compliance-oriented architecture and operational prototype.

It is not certified under any legal, regulatory, cybersecurity or AI governance scheme.

Any real-world deployment in a regulated environment requires:

legal review;

cybersecurity review;

data protection review;

organizational authorization;

human oversight;

documented risk assessment;

deployment-specific controls;

ongoing monitoring.


The repository provides a governance and technical foundation.

It does not replace institutional responsibility.


---

25. Compliance Roadmap

Suggested compliance roadmap:

Phase	Objective

C0	Documentation baseline
C1	Policy and risk classification implemented
C2	EVT and ledger operational
C3	Verification endpoint available
C4	Human oversight records implemented
C5	Risk register and audit checklist added
C6	Incident report template added
C7	Evidence packs added
C8	B2B and B2G compliance package prepared
C9	External legal and security review
C10	Regulated deployment assessment


Compliance must evolve with implementation.

Documentation alone is not enough.


---

26. Required Future Controls

Before any regulated deployment, AI JOKER-C2 should implement:

authentication;

authorization;

role-based access control;

environment separation;

secure logging;

secret management;

file size limits;

file type validation;

rate limiting;

event schema validation;

ledger integrity checks;

backup and retention policy;

human review workflow;

incident response process;

data protection review;

external security review.


These controls are not optional in serious environments.

They are deployment conditions.


---

27. Compliance Invariants

The following invariants must remain stable:

AI JOKER-C2 does not claim automatic legal compliance.
AI JOKER-C2 supports compliance-oriented workflows.
AI JOKER-C2 is identity-bound.
AI JOKER-C2 is non-offensive.
AI JOKER-C2 uses policy and risk classification.
AI JOKER-C2 preserves human accountability.
AI JOKER-C2 uses EVT for traceability.
AI JOKER-C2 supports verification.
AI JOKER-C2 follows fail-closed behavior.
AI JOKER-C2 treats sensitive uncertainty conservatively.


---

28. Final Compliance Formula

Compliance is not a label.
Compliance is a reconstructable sequence.

Expanded:

Identity -> Authority -> Policy -> Risk -> Human Oversight -> Decision -> EVT -> Ledger -> Verification -> Audit

Operational formula:

No identity, no accountability.
No policy, no controlled execution.
No risk classification, no sensitive output.
No human oversight, no high-impact authority.
No EVT, no traceability.
No verification, no auditability.
No fail-closed, no trustworthy governance.


---

29. Status

Document status: active compliance orientation file
Project: AI JOKER-C2
Framework: MATRIX
Infrastructure: HBCE
Identity layer: IPR
Trace layer: EVT
Governance principle: fail-closed
Security boundary: defensive and non-offensive
Compliance status: orientation only, not certification
Repository: hbce-ai-joker-c2
Maintainer: HBCE Research
Organization: HERMETICUM B.C.E. S.r.l.
Territorial anchor: Torino, Italy, Europe
Year: 2026

