# AI JOKER-C2 Incident Report Template

## Incident Reporting for MATRIX, CORPUS and APOKALYPSIS

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document provides an incident report template for AI JOKER-C2.

AI JOKER-C2 is the identity-bound cognitive command runtime of the HERMETICUM B.C.E. ecosystem.

It connects three primary domains:

1. MATRIX
2. CORPUS ESOTEROLOGIA ERMETICA
3. APOKALYPSIS

The purpose of this template is to record, classify, investigate and resolve incidents affecting:

- runtime behavior;
- AI governance;
- project-domain classification;
- policy evaluation;
- risk classification;
- human oversight;
- EVT generation;
- ledger continuity;
- verification;
- security posture;
- compliance-oriented documentation;
- B2B and B2G readiness;
- fail-closed behavior.

This template does not replace legal, cybersecurity, data protection or institutional incident response procedures.

It provides a structured operational record for AI JOKER-C2 incidents.

---

## 2. Incident Formula

```txt
Incident -> Classification -> Project Domain -> Risk -> Impact -> Decision -> Containment -> EVT -> Review -> Mitigation -> Closure

Expanded:

No incident without classification.
No classification without project domain.
No risk without impact assessment.
No containment without decision.
No incident record without EVT.
No closure without mitigation and review.

Project formula:

MATRIX = operational infrastructure incident domain
CORPUS ESOTEROLOGIA ERMETICA = conceptual and editorial incident domain
APOKALYPSIS = historical-threshold analysis incident domain
AI JOKER-C2 = governed cognitive runtime


---

3. Incident Report Table

Use the following table as the primary incident register.

| Incident ID | Date | Project Domain | Context Class | Incident Type | Severity | Runtime Decision | Human Oversight | EVT | Status | Owner | Notes | |---|---|---|---|---|---|---|---|---|---|---| | INC-0001 | YYYY-MM-DD | MULTI_DOMAIN | GOVERNANCE | Example project-domain classification error | MEDIUM | AUDIT | RECOMMENDED | EVT-ID | OPEN | HBCE Research | Review classifier logic | | INC-0002 | YYYY-MM-DD | MATRIX | SECURITY | Example unsafe request blocked | HIGH | BLOCK | REJECTED | EVT-ID | MITIGATED | HBCE Research | Fail-closed worked correctly | | INC-0003 | YYYY-MM-DD | CORPUS_ESOTEROLOGIA_ERMETICA | EDITORIAL | Example canonical terminology drift | LOW | ALLOW | NOT_REQUIRED | EVT-ID | OPEN | HBCE Research | Align glossary | | INC-0004 | YYYY-MM-DD | APOKALYPSIS | EDITORIAL | Example current factual claim without verification | MEDIUM | AUDIT | RECOMMENDED | EVT-ID | OPEN | HBCE Research | Verify before publication |


---

4. Incident ID Format

Recommended format:

INC-0001
INC-0002
INC-0003

Domain-specific format:

MATRIX-INC-0001
CORPUS-INC-0001
APOKALYPSIS-INC-0001
MULTI-INC-0001

Incident IDs should remain stable.

Do not reuse incident IDs.

Do not silently delete incident records.

If an incident is corrected, record the correction as a new event or as an update to the incident status.


---

5. Project Domain Values

Use only the following project-domain values.

Domain	Meaning

MATRIX	Operational infrastructure, AI governance, B2B, B2G, cloud, data, energy, security
CORPUS_ESOTEROLOGIA_ERMETICA	Disciplinary grammar, DCTT, canonical glossary, theoretical and editorial continuity
APOKALYPSIS	Historical threshold, decay, exposure, cultural-political-social analysis
GENERAL	Ordinary safe request with no specific project domain
MULTI_DOMAIN	More than one domain applies


Project-domain classification is required for incident reconstruction.


---

6. Incident Types

Suggested incident types:

Incident Type	Meaning

CLASSIFICATION_ERROR	Incorrect project-domain, context, intent or risk classification
POLICY_ERROR	Policy applied incorrectly or missing
RISK_ERROR	Risk class missing, wrong or inconsistent
OVERSIGHT_ERROR	Human oversight missing, wrong or bypassed
DECISION_ERROR	ALLOW, BLOCK, ESCALATE, DEGRADE, AUDIT or NOOP applied incorrectly
EVT_ERROR	EVT missing, incomplete, invalid or not generated
LEDGER_ERROR	Event not appended, chain broken or correction mishandled
VERIFICATION_ERROR	Event cannot be verified or verification result inconsistent
SECURITY_EVENT	Unsafe request, secret exposure, abusive request or boundary issue
FILE_PROCESSING_ERROR	File parsing, visibility, unsafe file or unsupported content problem
DATA_HANDLING_ERROR	Sensitive data mishandled, exposed or stored unnecessarily
DOCUMENTATION_ERROR	Documentation inconsistent with runtime behavior
BUILD_ERROR	Build, deployment or dependency issue
RUNTIME_ERROR	Runtime degraded, blocked, invalid or unavailable
COMPLIANCE_ERROR	Compliance-oriented claim overstated or missing disclaimer
PUBLIC_COMMUNICATION_ERROR	Public-facing wording misleading, excessive or unsafe



---

7. Severity Values

Use the following severity values.

Severity	Meaning

LOW	Minor issue or documentation correction
MEDIUM	Relevant governance, traceability or operational issue
HIGH	Sensitive issue requiring rapid review or mitigation
CRITICAL	Major issue blocking safe use
PROHIBITED	Incident involves unsafe, abusive or outside-scope capability


Severity should reflect actual and potential impact.

A blocked prohibited request can still be recorded as an incident if it is operationally relevant.


---

8. Runtime Decision Values

Use the following runtime decision values.

Decision	Meaning

ALLOW	Operation was allowed
BLOCK	Operation was blocked
ESCALATE	Human review or authority required
DEGRADE	Limited safe response only
AUDIT	Operation requires record or review
NOOP	No operational action taken


The incident report should record the decision actually produced by the runtime.

If the decision was wrong, describe the expected decision in the analysis section.


---

9. Incident Status Values

Suggested incident statuses:

Status	Meaning

OPEN	Incident identified and still active
TRIAGED	Incident reviewed and classified
CONTAINED	Immediate harm or exposure limited
MITIGATED	Mitigation applied
ESCALATED	Sent to higher authority or specialist review
BLOCKED	Unsafe operation stopped
RESOLVED	Issue corrected and reviewed
CLOSED	Incident closed with final note
SUPERSEDED	Replaced by a newer incident record


Do not close an incident without a resolution note.


---

10. Human Oversight Values

Use the following oversight states.

State	Meaning

NOT_REQUIRED	Ordinary low-risk incident
RECOMMENDED	Review useful but not mandatory
REQUIRED	Review required before continuation
COMPLETED	Review completed
REJECTED	Review rejected continuation
ESCALATED	Further authority or specialist review required


Human oversight is required for high-impact, public-sector, security-sensitive, data-sensitive or critical infrastructure incidents.


---

11. Incident Report Template

Use the following detailed template.

{
  "incident_id": "INC-0001",
  "created_at": "2026-05-03T15:30:00+02:00",
  "updated_at": "2026-05-03T15:30:00+02:00",
  "reported_by": "HBCE Research",
  "project": "AI JOKER-C2",
  "ecosystem": "HERMETICUM B.C.E.",
  "project_domain": "MULTI_DOMAIN",
  "context_class": "GOVERNANCE",
  "intent_class": "GITHUB",
  "incident_type": "CLASSIFICATION_ERROR",
  "severity": "MEDIUM",
  "summary": "Project-domain classification was incomplete for a repository-level governance operation.",
  "description": "The operation affected MATRIX, CORPUS and APOKALYPSIS but was classified only as MATRIX.",
  "actual_decision": "ALLOW",
  "expected_decision": "AUDIT",
  "risk_class": "MEDIUM",
  "human_oversight": "RECOMMENDED",
  "evt": "EVT-EXAMPLE",
  "ledger_status": "PARTIAL",
  "verification_status": "PARTIAL",
  "impact": {
    "security": "LOW",
    "governance": "MEDIUM",
    "compliance": "MEDIUM",
    "public_communication": "LOW"
  },
  "containment": [
    "Update governance documentation.",
    "Add project-domain classification map.",
    "Record correction event if required."
  ],
  "mitigation": [
    "Implement project-domain classifier.",
    "Add MULTI_DOMAIN handling.",
    "Update EVT project-domain field."
  ],
  "owner": "HBCE Research",
  "status": "OPEN",
  "closure_note": null
}


---

12. MATRIX Incident Categories

MATRIX incidents usually affect operational infrastructure, AI governance, B2B, B2G, cybersecurity, data, cloud, energy or institutional positioning.

Common MATRIX incidents:

Category	Example

AI governance incident	Risk not classified before sensitive output
B2B incident	Enterprise capability overstated
B2G incident	Public-sector document implies official adoption
Cybersecurity incident	Defensive answer includes offensive detail
Critical infrastructure incident	Output resembles operational instruction without authority
Data governance incident	Sensitive data stored or exposed unnecessarily
Cloud governance incident	Responsibility boundary unclear
Compliance incident	Compliance orientation presented as certification
Runtime incident	Fail-closed not triggered when required


Default MATRIX incident handling:

Severity	Handling

LOW	Review and correct
MEDIUM	Audit and mitigate
HIGH	Escalate and contain
CRITICAL	Block, escalate and review
PROHIBITED	Block and reject



---

13. CORPUS Incident Categories

CORPUS incidents usually affect conceptual coherence, glossary consistency, theoretical framing or editorial continuity.

Common Corpus incidents:

Category	Example

Terminology drift	Canonical term altered inconsistently
Formula drift	DCTT sequence weakened or omitted
Editorial continuity incident	Volume structure loses canonical relation
External claim incident	Internal framework presented as external certification
Legal authority incident	Corpus language implies legal authority
Scientific authority incident	Internal theory presented as validated science without review
Harmful framing incident	Conceptual material used to justify coercion


Default Corpus incident handling:

Severity	Handling

LOW	Correct terminology or structure
MEDIUM	Audit and align
HIGH	Escalate for review
CRITICAL	Escalate or block
PROHIBITED	Block and reject



---

14. APOKALYPSIS Incident Categories

APOKALYPSIS incidents usually affect historical, cultural, political or social analysis.

Common APOKALYPSIS incidents:

Category	Example

Verification incident	Current factual claim lacks verification
Political targeting incident	Analysis becomes targeted against a person or group
Incitement incident	Text encourages unlawful action
Dehumanization incident	Group is described in degrading or extremist terms
Destabilization incident	Analysis becomes operational planning for disruption
Public communication incident	Threshold language misunderstood as instruction
Editorial continuity incident	Volume loses its historical-threshold structure


Default APOKALYPSIS incident handling:

Severity	Handling

LOW	Correct wording
MEDIUM	Audit and verify
HIGH	Escalate or degrade
CRITICAL	Block or escalate
PROHIBITED	Block and reject



---

15. Multi-Domain Incident Categories

MULTI_DOMAIN incidents affect the whole ecosystem.

Common multi-domain incidents:

Category	Example

System coherence incident	README, architecture, governance and manifest diverge
Domain collapse incident	MATRIX, CORPUS and APOKALYPSIS are merged without distinction
Runtime governance incident	Policy, risk or decision layer bypassed
EVT continuity incident	EVT record missing project-domain metadata
Security boundary incident	Defensive/non-offensive scope becomes ambiguous
Compliance claim incident	Prototype presented as certified product
Public positioning incident	Strategic claim exceeds evidence
Human accountability incident	AI output presented as final authority


Default MULTI_DOMAIN incident handling:

Severity	Handling

LOW	Correct documentation
MEDIUM	Audit and align files
HIGH	Escalate and mitigate
CRITICAL	Block release or deployment
PROHIBITED	Reject capability and record incident



---

16. Incident Triage Workflow

Recommended triage workflow:

Identify incident
-> assign incident ID
-> classify project domain
-> classify context
-> classify intent
-> classify incident type
-> assign severity
-> identify actual decision
-> identify expected decision
-> assess impact
-> determine containment
-> determine mitigation
-> determine human oversight
-> link EVT
-> assign owner
-> update status
-> review closure

Triage should happen before closure.

Sensitive incidents should not be closed without review.


---

17. Containment Actions

Containment actions may include:

block unsafe operation;

degrade runtime response;

remove misleading public wording;

rotate exposed secrets;

disable affected route;

stop deployment;

restrict file processing;

add missing disclaimer;

add human review requirement;

record correction event;

update documentation;

add project-domain metadata;

require audit before continuation;

escalate to security, legal or data protection reviewer.


Containment is immediate control.

Mitigation is durable correction.


---

18. Mitigation Actions

Mitigation actions may include:

update classifier logic;

update policy engine;

update risk engine;

update human oversight model;

update EVT schema;

update ledger logic;

update verifier;

add tests;

improve documentation;

revise public communication;

strengthen file handling;

strengthen secret handling;

improve error handling;

add audit checklist item;

add risk register entry;

add incident response rule.


Mitigation should reduce recurrence.


---

19. EVT Linkage

Every significant incident should link to an EVT.

Recommended incident-related EVT fields:

{
  "incident": {
    "incident_id": "INC-0001",
    "incident_type": "CLASSIFICATION_ERROR",
    "severity": "MEDIUM",
    "status": "OPEN"
  }
}

The EVT should also include:

project domain;

context class;

risk class;

governance decision;

operation status;

verification status;

audit status.


A blocked unsafe operation may still generate an EVT.

Blocking is part of governance.


---

20. Ledger and Correction Rule

Incident corrections must not silently erase the original event.

If an incident requires correction, create a correction event or update the incident record with a clear history.

Correction rule:

Corrections are new events, not silent mutations.

A correction should include:

incident ID;

corrected event ID;

correction reason;

correction timestamp;

responsible owner;

verification status;

audit status.



---

21. Verification Requirements

Incident verification should check:

incident ID exists;

project domain is assigned;

context class is assigned;

incident type is assigned;

severity is assigned;

actual decision is recorded;

expected decision is recorded when relevant;

EVT is linked when required;

containment is defined;

mitigation is defined;

owner is assigned;

status is current;

closure note exists if closed.


Verification status values:

Status	Meaning

VERIFIABLE	Sufficient data for verification
PARTIAL	Useful but incomplete
INVALID	Failed structural validation
UNVERIFIED	Not yet checked
SUPERSEDED	Replaced by newer incident record



---

22. Security Incident Handling

A security incident may include:

secret exposure;

unsafe API response;

stack trace exposure;

file processing risk;

prohibited request not blocked;

offensive content generated;

harmful security detail generated;

sensitive data logged;

private event metadata exposed;

frontend secret exposure;

dependency vulnerability;

runtime error exposing internals.


Security incident response:

Contain -> Preserve evidence -> Rotate secrets if needed -> Patch -> Verify -> Record EVT -> Review -> Close

Security incidents rated HIGH or above require human review.


---

23. Data Incident Handling

A data incident may include:

sensitive file content exposed;

secret logged;

personal data included unnecessarily;

unsupported file processed unsafely;

public/internal separation failed;

full payload stored where hash/reference would suffice.


Data incident response:

Contain exposure
-> identify affected data
-> minimize or remove unnecessary retention
-> rotate exposed secrets if relevant
-> review logs
-> update handling rules
-> record incident
-> verify mitigation

Data incidents may require legal or data protection review.


---

24. Governance Incident Handling

A governance incident may include:

policy bypass;

risk missing;

wrong decision;

human oversight missing;

fail-closed not triggered;

project-domain classification missing;

prohibited request allowed;

compliance claim overstated;

AI output treated as final authority.


Governance incident response:

Classify -> Audit -> Correct governance rule -> Update documentation or code -> Record EVT -> Review recurrence

Governance incidents affect trust directly.

They should not be minimized.


---

25. Documentation Incident Handling

A documentation incident may include:

inconsistent project definition;

MATRIX, CORPUS and APOKALYPSIS not aligned;

misleading B2B or B2G claim;

missing non-certification disclaimer;

missing security boundary;

unclear compliance orientation;

outdated architecture reference;

documentation not matching runtime behavior.


Documentation incident response:

Identify file -> correct file -> align related files -> commit correction -> record incident if significant

Documentation is part of governance.

It is not secondary.


---

26. Build and Deployment Incident Handling

A build or deployment incident may include:

npm run build fails;

deployment fails;

runtime route unavailable;

environment variable missing;

secret misconfiguration;

model API unavailable;

Vercel deployment error;

frontend displays incorrect state;

API route returns unsafe error.


Build incident response:

Identify failure -> isolate affected file -> fix -> run build -> verify route -> commit correction -> document if significant

Recommended checks:

npm install
npm run build
git status
git diff --staged


---

27. Incident Closure Criteria

An incident may be closed when:

root cause is identified or explicitly marked unknown;

project domain is assigned;

severity is assigned;

containment is complete;

mitigation is complete or accepted;

owner is assigned;

EVT is linked if required;

audit status is clear;

verification status is clear;

closure note is written;

future prevention is considered.


Closed incidents should not be deleted.

They remain part of the operational record.


---

28. Incident Closure Template

{
  "incident_id": "INC-0001",
  "status": "CLOSED",
  "closed_at": "2026-05-03T16:30:00+02:00",
  "closed_by": "HBCE Research",
  "closure_reason": "Documentation corrected and project-domain classification added.",
  "root_cause": "Repository-level governance file was previously aligned only to MATRIX.",
  "mitigation_completed": [
    "Updated documentation to include MATRIX, CORPUS and APOKALYPSIS.",
    "Added project-domain governance map.",
    "Added risk and audit templates."
  ],
  "evt": "EVT-EXAMPLE",
  "verification_status": "VERIFIABLE",
  "audit_status": "REVIEWED"
}


---

29. Incident Review Checklist

Before closing an incident, check:

Is the incident ID stable?

Is the project domain assigned?

Is the context class assigned?

Is the incident type assigned?

Is severity assigned?

Is the runtime decision recorded?

Is human oversight assigned?

Is containment complete?

Is mitigation complete or accepted?

Is EVT linked if required?

Is ledger status known?

Is verification status known?

Is audit status known?

Is owner assigned?

Is closure note written?

Is recurrence risk considered?

Is fail-closed behavior preserved?



---

30. Incident Invariants

The following invariants must remain stable:

1. Incidents must not be silently erased.


2. Significant incidents should link to EVT records.


3. Project-domain classification is required.


4. Severity must be explicit.


5. Human oversight must match severity.


6. Prohibited incidents must be blocked.


7. Secret exposure requires rotation when applicable.


8. Documentation incidents are governance incidents.


9. Build incidents affect operational trust.


10. Fail-closed failures are high-priority incidents.


11. Public-sector incidents require stronger review.


12. Critical infrastructure incidents require escalation.


13. Corrections are new events, not silent mutations.


14. Closed incidents remain part of the audit record.


15. Compliance support is not compliance certification.




---

31. Final Incident Formula

An incident is not only an error.
An incident is an event that tests governance.

Expanded:

Incident -> Project Domain -> Risk -> Oversight -> Decision -> Containment -> Mitigation -> EVT -> Verification -> Closure

Project formula:

MATRIX = infrastructure incidents.
CORPUS ESOTEROLOGIA ERMETICA = conceptual and editorial incidents.
APOKALYPSIS = historical-threshold analysis incidents.
AI JOKER-C2 = governed runtime incident control.

Operational rule:

No incident closure without classification, mitigation and review.


---

32. Status

Field	Value

Document	docs/INCIDENT_REPORT_TEMPLATE.md
Status	Active incident report template
Project	AI JOKER-C2
Ecosystem	HERMETICUM B.C.E.
Connected domains	MATRIX, CORPUS ESOTEROLOGIA ERMETICA, APOKALYPSIS
Incident statuses	OPEN, TRIAGED, CONTAINED, MITIGATED, ESCALATED, BLOCKED, RESOLVED, CLOSED, SUPERSEDED
Severity values	LOW, MEDIUM, HIGH, CRITICAL, PROHIBITED
Infrastructure	HBCE
Identity layer	IPR
Trace layer	EVT
Governance principle	Fail-closed
Security boundary	Defensive and non-offensive
Compliance status	Orientation only, not certification
Repository	hbce-ai-joker-c2
Maintainer	HBCE Research
Organization	HERMETICUM B.C.E. S.r.l.
Territorial anchor	Torino, Italy, Europe
Year	2026




