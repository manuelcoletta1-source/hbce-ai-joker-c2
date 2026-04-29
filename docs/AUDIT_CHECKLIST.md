# AI JOKER-C2 Audit Checklist

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document provides an audit checklist for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The purpose of this checklist is to help reviewers evaluate whether AI-assisted operations are:

- identity-bound;
- policy-aware;
- risk-classified;
- human-supervised;
- traceable through EVT;
- auditable;
- verifiable;
- secure;
- non-offensive;
- fail-closed by design.

This checklist supports governance review.

It does not create legal certification.

It does not replace legal, cybersecurity, data protection, institutional, operational or compliance review.

---

## 2. Audit Principle

The core audit principle is:

```txt
An AI-assisted operation is not audit-ready unless it can be reconstructed.

Expanded:

Identity -> Context -> Policy -> Risk -> Human Oversight -> Decision -> EVT -> Ledger -> Verification -> Audit

An audit should be able to answer:

1. What happened?


2. When did it happen?


3. Which identity was involved?


4. Which context was involved?


5. Which policy was applied?


6. Which risk class was assigned?


7. Which decision was made?


8. Was human oversight required?


9. Was an EVT generated?


10. Can the event be verified?


11. Was the operation within scope?


12. Was fail-closed behavior preserved?




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

Audit checks must verify that this architecture is not only described, but also preserved in files, runtime behavior and deployment choices.


---

4. Audit Scope

This checklist may be used to review:

repository documentation;

runtime architecture;

governance model;

risk classification;

policy boundaries;

human oversight;

EVT records;

ledger continuity;

verification logic;

file handling;

API behavior;

security boundaries;

compliance orientation;

dual-use boundary;

B2B and B2G readiness;

critical infrastructure use cases;

deployment preparation.


The checklist is modular.

Reviewers may apply only the sections relevant to the specific audit.


---

5. Audit Status Values

Suggested audit status values:

Status	Meaning

PASS	Requirement is satisfied
PARTIAL	Requirement is partially satisfied
FAIL	Requirement is not satisfied
NOT_APPLICABLE	Requirement does not apply to the reviewed scope
NEEDS_REVIEW	More evidence or human review is required
BLOCKING	Issue blocks deployment or operational use


The audit result should not hide uncertainty.

If evidence is incomplete, use PARTIAL or NEEDS_REVIEW.


---

6. Documentation Audit

Review whether the repository contains and maintains the core governance documents.

Check	Status	Notes

README.md defines the project clearly		
ARCHITECTURE.md defines the runtime architecture		
GOVERNANCE.md defines governance decisions		
PROTOCOL.md defines the operational sequence		
EVT_PROTOCOL.md defines event trace structure		
SECURITY.md defines defensive security boundary		
COMPLIANCE.md defines compliance orientation		
DUAL_USE_STRATEGIC_POSITIONING.md defines non-offensive dual-use boundary		
ROADMAP.md defines development phases		
CONTRIBUTING.md defines contribution rules		
docs/B2B_OVERVIEW.md exists		
docs/B2G_OVERVIEW.md exists		
docs/INSTITUTIONAL_USE_CASES.md exists		
docs/CRITICAL_INFRASTRUCTURE_USE_CASES.md exists		
docs/AI_GOVERNANCE_USE_CASES.md exists		
docs/DEFENSIVE_SECURITY_USE_CASES.md exists		
docs/COMPLIANCE_MAPPING.md exists		
docs/HUMAN_OVERSIGHT_MODEL.md exists		
docs/RISK_REGISTER_TEMPLATE.md exists		
docs/AUDIT_CHECKLIST.md exists		


Documentation must be consistent across files.

Contradictions between governance files should be treated as audit issues.


---

7. Identity Audit

AI JOKER-C2 must preserve runtime identity.

Check	Status	Notes

Public name is defined as AI JOKER-C2		
Canonical entity is defined as AI_JOKER		
Canonical IPR is defined as IPR-AI-0001		
Active checkpoint is documented as EVT-0014-AI		
HBCE core reference is defined		
MATRIX framework reference is defined		
Organization is defined as HERMETICUM B.C.E. S.r.l.		
Territorial anchor is defined as Torino, Italy, Europe		
Runtime identity is not presented as unrestricted authority		
Relevant operations can be bound to identity context		


Audit question:

Can the reviewed operation be connected to a defined runtime identity?

If not, the operation is not fully audit-ready.


---

8. Policy Audit

Review whether policy boundaries are defined and applied.

Check	Status	Notes

Allowed uses are documented		
Prohibited uses are documented		
Non-offensive boundary is clear		
Defensive security boundary is clear		
Dual-use boundary is controlled		
Public-sector boundary is documented		
Critical infrastructure boundary is documented		
Human accountability is preserved		
Policy is evaluated before sensitive execution		
Policy ambiguity triggers escalation, degradation or blocking		


Audit question:

Was a policy boundary applied before the operation became operationally relevant?


---

9. Risk Classification Audit

Review whether the operation was risk-classified.

Check	Status	Notes

Risk class is assigned		
Risk class is one of LOW, MEDIUM, HIGH, CRITICAL, PROHIBITED or UNKNOWN		
Risk classification considers context		
Risk classification considers operational effect		
Unknown risk is not treated as LOW		
High-risk operations trigger review or limitation		
Critical-risk operations trigger escalation or blocking		
Prohibited operations are blocked		
Risk entry can be linked to risk register where required		
Risk classification is recorded in EVT where required		


Audit question:

Was the sensitivity of the operation classified before execution or use?


---

10. Governance Decision Audit

Review whether a governance decision was produced.

Decision	Meaning

ALLOW	Operation may proceed
BLOCK	Operation is prohibited or unsafe
ESCALATE	Human authority or higher review required
DEGRADE	Limited safe support only
AUDIT	Operation should be recorded or reviewed
NOOP	No operational action taken


Check	Status	Notes

Decision is present		
Decision matches risk class		
Decision matches policy boundary		
BLOCK is used for prohibited requests		
ESCALATE is used for uncertain sensitive requests		
DEGRADE is used for limited safe support		
AUDIT is used where records or review are required		
Decision is not invented after the fact		
Decision is recorded in EVT where required		
Decision preserves human accountability		


Audit question:

Did the runtime decide before executing, or did it justify after executing?


---

11. Human Oversight Audit

Review whether human oversight is defined and respected.

Oversight State	Meaning

NOT_REQUIRED	Ordinary low-risk support
RECOMMENDED	Human review useful
REQUIRED	Human review required before operational use
COMPLETED	Review completed
REJECTED	Review rejected the operation
ESCALATED	Higher authority required
BLOCKED	Operation is prohibited
UNKNOWN	Oversight requirement cannot be safely determined


Check	Status	Notes

Human oversight state is defined		
Oversight state matches risk class		
High-impact outputs require human review		
Public-sector outputs require review where needed		
Security-sensitive outputs require review where needed		
Critical infrastructure outputs require review by default		
Review outcome is recorded where applicable		
Final authority remains human or institutional		
AI output is marked advisory where required		
Human oversight is not used to authorize prohibited activity		


Audit question:

Was the right human review required before the output could be used?


---

12. EVT Audit

Review whether the event trace is present and structurally valid.

Required EVT fields:

Field	Required	Status	Notes

evt	yes		
prev	yes		
entity	yes		
ipr	yes		
timestamp	yes		
runtime	yes		
context	yes		
governance	yes		
operation	yes		
trace	yes		
verification	yes		


EVT audit checks:

Check	Status	Notes

EVT identifier is unique		
Previous event reference is present		
Identity reference is present		
Timestamp is present and valid		
Context class is present		
Risk class is present		
Governance decision is present		
Operation status is present		
Verification status is present		
Audit status is present where required		
Sensitive payload is minimized		
Public and internal views are separated where needed		


Audit question:

Can the operation be reconstructed from its EVT?


---

13. Ledger Audit

Review whether ledger continuity is preserved.

Check	Status	Notes

Ledger model is defined		
Events are append-only where implemented		
Historical events are not silently rewritten		
Corrections are represented as new events		
Previous event reference is preserved		
Event order can be reconstructed		
Ledger avoids unnecessary sensitive payloads		
Ledger supports public and internal views		
Ledger supports verification		
Ledger supports audit review		


Audit question:

Does the system preserve continuity, or only isolated outputs?


---

14. Verification Audit

Review whether event verification is possible.

Check	Status	Notes

Verification status is defined		
Hash algorithm is defined		
Canonicalization method is defined		
Hash can be recomputed where applicable		
Required EVT fields can be validated		
Previous event reference can be inspected		
Correction events can be inspected		
Verification distinguishes technical validity from institutional approval		
Public-safe verification is possible where needed		
Internal verification can include richer metadata where controlled		


Verification statuses:

Status	Meaning

VERIFIABLE	Sufficient data for verification
PARTIAL	Useful but incomplete
INVALID	Failed structural validation
UNVERIFIED	Not yet checked
ANCHORED	Externally anchored
SUPERSEDED	Corrected by later event


Audit question:

Can a reviewer verify the event, or only read a claim?


---

15. Security Audit

Review whether security boundaries are preserved.

Check	Status	Notes

Offensive cyber use is prohibited		
Malware generation is prohibited		
Unauthorized access is prohibited		
Credential theft is prohibited		
Exploit deployment is prohibited		
Evasion and stealth are prohibited		
Sabotage is prohibited		
Defensive security support is allowed and bounded		
Security outputs are documentation-oriented where sensitive		
Security-sensitive requests trigger AUDIT, ESCALATE, DEGRADE or BLOCK		


Audit question:

Does the security model support defense without enabling abuse?


---

16. Secrets Audit

Review whether secrets are protected.

Check	Status	Notes

API keys are not committed		
.env.local is ignored		
OpenAI key is stored only as environment variable		
Tokens are not logged		
Private keys are not committed		
Deployment secrets are not exposed to client		
Logs do not contain credentials		
Secret leak response is documented		
Secret rotation is required after exposure		
Repository history is reviewed if exposure occurs		


Audit question:

Could a reviewer find secrets in code, logs or public outputs?


---

17. Data Handling Audit

Review whether data handling is controlled.

Check	Status	Notes

Data classes are defined		
Personal data is minimized		
Confidential data is restricted		
Secret data is not processed as ordinary content		
File contents are not logged unnecessarily		
Sensitive payloads are minimized in EVT		
References or hashes are used where appropriate		
Public and internal views are separated		
Incomplete file visibility is disclosed		
Unknown sensitivity is treated conservatively		


Suggested data classes:

Class	Handling

PUBLIC	May be processed normally
INTERNAL	Process with care
CONFIDENTIAL	Restrict and minimize
SECRET	Do not expose or process outside controlled environment
PERSONAL	Minimize and verify legal basis
SECURITY_SENSITIVE	Minimize, summarize or reference
CRITICAL_OPERATIONAL	Strict review and minimization
UNKNOWN	Treat conservatively


Audit question:

Was only the necessary data processed, exposed or stored?


---

18. File Handling Audit

Review whether file handling is safe.

Check	Status	Notes

Uploaded files are not executed		
File type validation exists or is planned		
File size limits exist or are planned		
Unsupported files are handled safely		
File names are not trusted blindly		
Sensitive file content is not logged		
Partial reading is disclosed		
File context is user-controlled		
File output is bounded by user request		
File handling can generate EVT where required		


Recommended safe file types:

.txt
.md
.json
.csv

Audit question:

Can file processing introduce unsafe execution or false certainty?


---

19. API Audit

Review whether API routes preserve controlled execution.

Check	Status	Notes

/api/chat input is validated		
/api/files input is validated		
Future /api/verify route has clear scope		
Future /api/evidence route has clear scope		
API routes avoid exposing secrets		
API routes avoid exposing stack traces		
API routes avoid unrestricted execution		
API errors are safe and useful		
API routes preserve governance decisions		
API routes support EVT where relevant		


Audit question:

Does the API enforce boundaries, or does it bypass the governance layer?


---

20. Model Interaction Audit

Review whether model output is governed.

Check	Status	Notes

Model output is treated as advisory where appropriate		
Model output does not override policy		
Model output does not override risk classification		
Model output does not override fail-closed behavior		
Model prompts do not include secrets		
Sensitive payloads are minimized before model call		
High-impact output requires review		
Unsafe model output is blocked or degraded		
Model unavailability triggers degraded mode		
Model output is not treated as legal certification		


Audit question:

Is the model governed by the runtime, or is the runtime governed by the model?


---

21. Fail-Closed Audit

Review whether fail-closed behavior is defined and preserved.

Trigger	Expected Response	Status	Notes

Missing identity	ESCALATE or BLOCK		
Missing policy	ESCALATE or BLOCK		
Unknown risk	ESCALATE or BLOCK		
Prohibited request	BLOCK		
Offensive cyber interpretation	BLOCK or DEGRADE		
Sensitive data exposure	DEGRADE, ESCALATE or BLOCK		
Human review required but absent	ESCALATE		
EVT cannot be generated where required	DEGRADE, AUDIT_ONLY or BLOCK		
Continuity cannot be preserved	DEGRADE or ESCALATE		
Runtime state invalid	BLOCK		
Model unavailable	DEGRADED mode		
File unsafe or unsupported	BLOCK or DEGRADE		


Audit question:

Does uncertainty in sensitive contexts stop, limit or escalate the operation?


---

22. Dual-Use Audit

Review whether dual-use positioning remains controlled.

Check	Status	Notes

Dual-use is defined as civil and strategic		
Offensive military use is excluded		
Offensive cyber use is excluded		
Unlawful surveillance is excluded		
Critical infrastructure support is documentation-oriented		
Defensive cybersecurity is allowed but bounded		
Human rights risks are acknowledged through prohibited-use boundaries		
Public-sector authority is preserved		
B2B and B2G positioning remain non-offensive		
Risk and oversight apply to dual-use contexts		


Audit question:

Does dual-use mean controlled strategic support, or uncontrolled capability?


---

23. Public-Sector Audit

Review whether public-sector use preserves institutional responsibility.

Check	Status	Notes

Public authority is not replaced by AI		
Public communication requires review		
Procurement support does not become final decision		
Citizen-facing effects require review		
Public-service impacts require review		
Legal-sensitive outputs require review		
Data protection review is required where applicable		
Audit trail is available for sensitive workflows		
Human responsibility is clear		
Non-certification statement is present		


Audit question:

Does the runtime support public responsibility without replacing it?


---

24. Critical Infrastructure Audit

Review whether critical infrastructure boundaries are preserved.

Check	Status	Notes

Direct infrastructure control is excluded		
Autonomous operational command is excluded		
Documentation support is allowed		
Continuity planning support is allowed		
Incident report support is allowed		
Operational recommendations require review		
Critical contexts default to high oversight		
Sensitive topology is minimized		
Security-sensitive details are controlled		
Fail-closed behavior is strict		


Audit question:

Does the system support resilience without becoming an operational control system?


---

25. Repository Security Audit

Review whether repository development preserves safety.

Check	Status	Notes

.gitignore excludes environment files		
Dependencies are reviewed		
Lockfile is present where appropriate		
Build command succeeds		
Security policy exists		
Contribution policy exists		
No prohibited functionality is introduced		
Governance documents are not contradicted		
Fail-closed logic is not weakened		
EVT compatibility is preserved		


Recommended commands:

npm install
npm audit
npm run build

Audit question:

Does the repository remain safe, buildable and governance-consistent?


---

26. Deployment Audit

Before serious deployment, review:

Check	Status	Notes

Authentication is implemented where required		
Authorization is implemented where required		
Role-based access is implemented where required		
Environment variables are secured		
API routes are validated		
File uploads are controlled		
Logs are safe		
Rate limiting is considered		
Error handling is safe		
Human oversight is operationalized		
EVT generation is implemented		
Ledger continuity is implemented		
Verification endpoint is implemented		
Incident response process exists		
Legal review has been performed where required		
Cybersecurity review has been performed where required		
Data protection review has been performed where required		
Operational review has been performed where required		


Audit question:

Is the system still a prototype, or is it ready for controlled deployment?


---

27. Compliance Orientation Audit

Review whether compliance language is accurate.

Check	Status	Notes

Repository does not claim legal certification		
Repository does not claim automatic compliance		
Compliance is described as orientation and support		
Legal review is required for regulated use		
Cybersecurity review is required for serious deployment		
Data protection review is required where applicable		
Human responsibility is preserved		
Auditability is described as reconstruction, not certification		
Limitations are disclosed		
Documentation and implementation gaps are visible		


Audit question:

Does the repository distinguish compliance support from compliance certification?


---

28. Audit Evidence Checklist

For each reviewed operation, collect or reference:

Evidence	Present	Notes

Request summary		
Context class		
Risk class		
Policy reference		
Governance decision		
Human oversight state		
Output summary		
EVT identifier		
Previous event reference		
Hash or trace reference		
Verification status		
Audit status		
Review outcome		
Correction event, if any		
Responsible role		


Audit evidence should support reconstruction without exposing unnecessary sensitive content.


---

29. Audit Report Template

Suggested audit report structure:

# Audit Report

## Scope
Describe what was reviewed.

## Reviewed Files or Operations
List files, routes, events or workflows reviewed.

## Identity
Confirm runtime identity and IPR reference.

## Policy
Describe applicable policy boundary.

## Risk
Describe risk classification.

## Human Oversight
Describe review requirement and outcome.

## EVT and Ledger
Describe event trace and continuity.

## Verification
Describe verification status.

## Security
Describe security findings.

## Data Handling
Describe data handling findings.

## Dual-Use Boundary
Describe dual-use review.

## Findings
List PASS, PARTIAL, FAIL, NEEDS_REVIEW or BLOCKING items.

## Required Actions
List remediation steps.

## Conclusion
State whether the reviewed scope is audit-ready, partially audit-ready or not audit-ready.


---

30. Audit Findings Classification

Finding	Meaning	Suggested Action

PASS	Requirement satisfied	No action required
MINOR	Small issue with limited impact	Fix in normal cycle
MODERATE	Governance or security issue requiring remediation	Prioritize fix
MAJOR	Significant risk affecting auditability or safety	Fix before deployment
CRITICAL	Severe issue affecting secrets, safety, legality or prohibited use	Immediate remediation
BLOCKING	Operation or deployment must not proceed	Stop until resolved


Findings should be linked to evidence.


---

31. Audit Maturity Levels

Level	Description

A0	No audit model
A1	Audit checklist documented
A2	EVT fields documented
A3	Risk and oversight connected to audit
A4	Ledger continuity implemented
A5	Verification endpoint implemented
A6	Audit dashboard available
A7	Evidence packs available
A8	External review possible
A9	Controlled deployment audit-ready


AI JOKER-C2 should move from documentation audit to executable audit.


---

32. Immediate Audit Priorities

Recommended immediate audit priorities:

Priority	Item

1	Confirm documentation consistency
2	Confirm non-offensive boundary
3	Confirm risk classes
4	Confirm human oversight states
5	Confirm EVT schema
6	Confirm security policy
7	Confirm secrets handling
8	Confirm deployment limitations
9	Confirm compliance non-certification statement
10	Confirm roadmap gaps are visible



---

33. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

This audit checklist does not create legal, regulatory, cybersecurity, AI governance, public-sector, financial, medical or critical infrastructure certification.

Any real-world deployment requires review by authorized professionals and responsible organizations.

Audit readiness does not equal legal compliance.

Audit readiness means the operation can be reconstructed, reviewed and questioned.


---

34. Final Audit Formula

Audit is not trust by declaration.
Audit is reconstruction by evidence.

Operational formula:

Audit =
Identity + Policy + Risk + Human Oversight + Decision + EVT + Ledger + Verification + Findings + Remediation


---

35. Status

Document status: active audit checklist
Project: AI JOKER-C2
Framework: MATRIX
Infrastructure: HBCE
Identity layer: IPR
Trace layer: EVT
Governance principle: fail-closed
Security boundary: defensive and non-offensive
Business orientation: B2B, B2G, institutional, AI governance, defensive security and critical infrastructure
Compliance status: orientation only, not certification
Repository: hbce-ai-joker-c2
Maintainer: HBCE Research
Organization: HERMETICUM B.C.E. S.r.l.
Territorial anchor: Torino, Italy, Europe
Year: 2026

