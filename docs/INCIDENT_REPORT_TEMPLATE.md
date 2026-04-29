# AI JOKER-C2 Incident Report Template

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document provides an incident report template for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

This template is designed for defensive, lawful and governance-oriented incident documentation.

It may support:

- cybersecurity incident reports;
- AI governance incidents;
- file handling incidents;
- runtime errors;
- policy violations;
- audit anomalies;
- public-sector digital incidents;
- critical infrastructure documentation;
- data handling issues;
- fail-closed events;
- EVT and ledger review.

This template does not authorize offensive action.

It does not replace incident command, legal review, cybersecurity review, data protection review or institutional responsibility.

---

## 2. Incident Report Principle

The core principle is:

```txt
An incident is not only an event.
An incident is a sequence that must be reconstructed.

Operational formula:

Identity -> Event -> Context -> Risk -> Impact -> Containment -> Evidence -> EVT -> Verification -> Review

Within AI JOKER-C2:

MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = event trace layer
Ledger = continuity layer
Fail-closed = safety boundary

The goal is to make incident handling structured, reviewable and audit-ready.


---

3. Incident Classification

Suggested incident classes:

Class	Meaning

AI_GOVERNANCE_INCIDENT	AI output, review, oversight or policy issue
SECURITY_INCIDENT	Defensive cybersecurity or security posture issue
DATA_HANDLING_INCIDENT	Personal, confidential, secret or sensitive data issue
RUNTIME_INCIDENT	Application, API, model, environment or deployment issue
FILE_HANDLING_INCIDENT	Upload, parsing, unsupported file or visibility issue
EVT_INCIDENT	Event generation, hash, ledger or verification issue
POLICY_INCIDENT	Policy bypass, unclear boundary or prohibited request issue
OVERSIGHT_INCIDENT	Missing, failed or bypassed human review
PUBLIC_SECTOR_INCIDENT	Institutional, administrative or public-service issue
CRITICAL_INFRASTRUCTURE_INCIDENT	High-impact infrastructure documentation or continuity issue



---

4. Incident Severity

Suggested severity levels:

Severity	Meaning	Default Handling

LOW	Limited impact, easily contained	Document and monitor
MEDIUM	Operationally relevant issue	Review and mitigate
HIGH	Serious governance, security or operational issue	Escalate and audit
CRITICAL	Severe impact on security, rights, services, infrastructure or secrets	Immediate escalation
PROHIBITED	Incident involves unsafe, unlawful or outside-scope activity	Block and escalate


Unknown severity in sensitive contexts should be treated conservatively.


---

5. Incident Status

Suggested status values:

Status	Meaning

OPEN	Incident identified and not yet resolved
TRIAGED	Initial classification completed
CONTAINED	Immediate containment performed
MITIGATED	Mitigation applied
UNDER_REVIEW	Human, security, legal or audit review ongoing
ESCALATED	Higher authority or specialist review required
CLOSED	Incident closed after review
REOPENED	Incident reopened due to new evidence
REJECTED	Report not accepted as valid incident
SUPERSEDED	Replaced by later incident record


Incident closure should not erase the incident record.

Corrections should be documented.


---

6. Incident Report Header

Use the following header for each incident report.

Incident ID:
Incident Title:
Incident Class:
Severity:
Status:
Reported By:
Responsible Role:
Date Reported:
Date Detected:
Date Occurred:
Affected Domain:
Affected Component:
Human Oversight Required:
EVT Required:
Audit Required:
Verification Required:

Example:

Incident ID: INC-20260429-0001
Incident Title: Missing human oversight state for sensitive AI-assisted output
Incident Class: AI_GOVERNANCE_INCIDENT
Severity: HIGH
Status: OPEN
Reported By: Operator
Responsible Role: Reviewer
Date Reported: 2026-04-29
Date Detected: 2026-04-29
Date Occurred: 2026-04-29
Affected Domain: AI Governance
Affected Component: Runtime decision layer
Human Oversight Required: yes
EVT Required: yes
Audit Required: yes
Verification Required: yes


---

7. Executive Summary

Provide a short summary.

Summary:
Describe the incident in clear operational language.

Impact:
Describe what may have been affected.

Current Status:
Describe whether the incident is open, contained, mitigated, escalated or closed.

Required Action:
Describe the next required action.

Example:

Summary:
A sensitive AI-assisted output was generated without a recorded human oversight state.

Impact:
The output may have been treated as usable before formal review.

Current Status:
The incident is open and requires audit review.

Required Action:
Assign reviewer, generate correction EVT and update oversight metadata.


---

8. Incident Timeline

Use a timeline table.

Time	Event	Source	Notes

2026-04-29 15:30	Incident detected	Operator	Missing oversight state identified
2026-04-29 15:35	Initial review started	Reviewer	Risk class assigned as HIGH
2026-04-29 15:40	Containment action applied	Maintainer	Output marked review-required
2026-04-29 15:45	EVT correction prepared	Runtime	Correction event pending


Timeline principles:

use absolute timestamps;

distinguish occurrence, detection and report time;

mark missing evidence clearly;

do not invent timeline events;

preserve uncertainty where evidence is incomplete.



---

9. Affected Components

Identify affected components.

Component	Affected	Notes

Runtime identity		
API route		
Model interaction		
File handling		
Policy engine		
Risk engine		
Human oversight model		
EVT generator		
Ledger		
Verification		
Security boundary		
Data handling		
Documentation		
Deployment configuration		



---

10. Impact Assessment

Assess impact across domains.

Impact Area	Impact Level	Notes

User impact	LOW, MEDIUM, HIGH, CRITICAL	
Security impact	LOW, MEDIUM, HIGH, CRITICAL	
Data impact	LOW, MEDIUM, HIGH, CRITICAL	
Operational impact	LOW, MEDIUM, HIGH, CRITICAL	
Legal or compliance impact	LOW, MEDIUM, HIGH, CRITICAL	
Public-sector impact	LOW, MEDIUM, HIGH, CRITICAL	
Critical infrastructure impact	LOW, MEDIUM, HIGH, CRITICAL	
Reputational impact	LOW, MEDIUM, HIGH, CRITICAL	
Audit impact	LOW, MEDIUM, HIGH, CRITICAL	


Impact assessment should be evidence-based.

Unknown impact in sensitive contexts should be escalated.


---

11. Root Cause Analysis

Use the following structure.

Root Cause:
Describe the main cause.

Contributing Factors:
List contributing factors.

Detection Gap:
Explain why the issue was not detected earlier.

Control Gap:
Explain which control failed, was missing or was incomplete.

Governance Gap:
Explain whether identity, policy, risk, oversight, EVT, ledger or verification failed.

Suggested root cause categories:

Category	Description

POLICY_GAP	Missing or unclear policy
RISK_GAP	Missing or incorrect risk classification
OVERSIGHT_GAP	Human review missing, unclear or bypassed
EVT_GAP	Event record missing, incomplete or invalid
LEDGER_GAP	Continuity not preserved
VERIFICATION_GAP	Event cannot be verified
DATA_GAP	Data sensitivity mishandled
SECURITY_GAP	Defensive boundary weakened
RUNTIME_GAP	Application or API behavior failed
DOCUMENTATION_GAP	Documentation incomplete or contradictory



---

12. Containment Actions

Record immediate containment steps.

Action ID	Action	Owner Role	Status	Notes

ACT-001	Mark output as review-required	Reviewer	OPEN	
ACT-002	Disable affected workflow if needed	Maintainer	OPEN	
ACT-003	Generate correction EVT	Maintainer	OPEN	
ACT-004	Notify responsible role	Operator	OPEN	


Containment principles:

stop unsafe continuation;

preserve evidence;

avoid deleting relevant records;

avoid exposing sensitive information;

maintain auditability;

escalate when required.



---

13. Mitigation Actions

Record mitigation steps.

Action ID	Mitigation	Owner Role	Due Date	Status

MIT-001	Update risk classification rule	Maintainer	2026-05-19	OPEN
MIT-002	Update oversight model	Reviewer	2026-05-19	OPEN
MIT-003	Add EVT validation	Maintainer	2026-05-19	OPEN
MIT-004	Review documentation consistency	Auditor	2026-05-19	OPEN


Mitigation should address the cause, not only the symptom.


---

14. Evidence Register

Collect evidence references without exposing unnecessary sensitive content.

Evidence ID	Evidence Type	Reference	Sensitivity	Verification Status

EVD-001	EVT	EVT-20260429-0001	INTERNAL	VERIFIABLE
EVD-002	Log summary	log-ref-001	INTERNAL	PARTIAL
EVD-003	File reference	file-hash-example	CONFIDENTIAL	UNVERIFIED
EVD-004	Reviewer note	review-note-001	INTERNAL	READY


Evidence types may include:

EVT record;

ledger entry;

hash;

log summary;

file reference;

reviewer note;

incident timeline;

screenshot reference;

deployment record;

commit reference;

audit note.


Do not include secrets, credentials or unnecessary sensitive payloads.


---

15. EVT Linkage

Each significant incident should be linked to an EVT.

Example incident EVT:

{
  "evt": "EVT-20260429-230000-0001",
  "prev": "EVT-20260429-225900-0000",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T23:00:00+02:00",
  "context": {
    "class": "INCIDENT",
    "domain": "AI_GOVERNANCE",
    "sensitivity": "HIGH"
  },
  "governance": {
    "risk": "HIGH",
    "decision": "AUDIT",
    "human_oversight": "REQUIRED",
    "policy": "INCIDENT_REPORTING",
    "fail_closed": false
  },
  "operation": {
    "type": "INCIDENT_REPORT_CREATED",
    "status": "OPEN"
  },
  "verification": {
    "status": "VERIFIABLE",
    "audit_status": "REQUIRED"
  }
}

If the incident concerns an invalid or missing EVT, create a correction or incident EVT.

Do not silently rewrite history.


---

16. Correction Event Template

Use a correction event when an earlier record is wrong, incomplete or superseded.

{
  "evt": "EVT-20260429-231000-0002",
  "prev": "EVT-20260429-230000-0001",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T23:10:00+02:00",
  "operation": {
    "type": "INCIDENT_CORRECTION",
    "corrects": "EVT-20260429-230000-0001",
    "reason": "Human oversight state was missing in the original incident record",
    "status": "CORRECTION_CREATED"
  },
  "governance": {
    "risk": "HIGH",
    "decision": "AUDIT",
    "human_oversight": "REQUIRED"
  },
  "verification": {
    "status": "VERIFIABLE",
    "audit_status": "READY"
  }
}

Correction is not erasure.

Correction is a new trace.


---

17. Human Oversight Section

Document oversight.

Human Oversight Required:
yes / no

Oversight State:
NOT_REQUIRED / RECOMMENDED / REQUIRED / COMPLETED / REJECTED / ESCALATED / BLOCKED / UNKNOWN

Responsible Role:
Operator / Reviewer / Approver / Auditor / Maintainer / Security Officer / Legal Reviewer / Data Protection Reviewer / Institutional Authority / Incident Commander

Review Outcome:
APPROVED / APPROVED_WITH_LIMITATIONS / REJECTED / NEEDS_REVISION / ESCALATED / INFORMATION_INSUFFICIENT / OUT_OF_SCOPE

Review Notes:
Describe review outcome and limitations.

High-risk incidents should not close without human review.


---

18. Security Boundary Review

Confirm whether the incident touched the security boundary.

Check	Yes or No	Notes

Did the incident involve offensive cyber content?		
Did it involve unauthorized access?		
Did it involve malware?		
Did it involve credential exposure?		
Did it involve exploit deployment?		
Did it involve evasion or stealth?		
Did it involve sensitive infrastructure details?		
Did it remain defensive and documentation-oriented?		
Was unsafe content blocked or degraded?		
Was fail-closed behavior triggered where needed?		


If any prohibited category is present, the incident must be escalated.


---

19. Data Handling Review

Confirm whether data handling was safe.

Check	Yes or No	Notes

Was personal data involved?		
Was confidential data involved?		
Were secrets, tokens or credentials involved?		
Was sensitive data minimized?		
Was sensitive data logged?		
Was data exposed in public output?		
Was file visibility complete or partial?		
Were references or hashes used where appropriate?		
Is data protection review required?		


Data incidents require conservative handling.

Secret exposure requires immediate rotation and remediation.


---

20. Policy Review

Identify which policy or boundary applies.

Policy Area	Applies	Notes

Governance model		
Security policy		
Compliance orientation		
Human oversight model		
Risk register		
EVT protocol		
Dual-use boundary		
Critical infrastructure boundary		
Public-sector boundary		
Data handling model		


If no policy applies, that is itself a governance gap.


---

21. Fail-Closed Review

Review whether fail-closed behavior was required.

Trigger	Present	Expected Response	Actual Response

Missing identity		BLOCK or ESCALATE	
Unknown risk		ESCALATE or BLOCK	
Missing policy		ESCALATE or BLOCK	
Human review missing		ESCALATE	
Prohibited request		BLOCK	
Sensitive data exposure		DEGRADE, ESCALATE or BLOCK	
Unsafe file		BLOCK or DEGRADE	
EVT failure		DEGRADE, AUDIT_ONLY or BLOCK	
Ledger failure		DEGRADE or ESCALATE	
Model failure		DEGRADED mode	


Incident question:

Did the system stop, limit or escalate when uncertainty became sensitive?


---

22. Lessons Learned

Document lessons learned.

What worked:
Describe controls that worked.

What failed:
Describe controls that failed.

What was missing:
Describe missing controls, policies or evidence.

What should change:
Describe required improvements.

What should be monitored:
Describe future monitoring needs.

Lessons learned should become roadmap, documentation or runtime improvements.


---

23. Remediation Plan

Use the remediation table.

Remediation ID	Action	Owner Role	Priority	Due Date	Status

REM-001	Update policy or documentation	Maintainer	HIGH	2026-05-19	OPEN
REM-002	Add runtime validation	Maintainer	HIGH	2026-05-19	OPEN
REM-003	Add test case	Maintainer	MEDIUM	2026-05-19	OPEN
REM-004	Review incident with auditor	Auditor	MEDIUM	2026-05-19	OPEN


Suggested priorities:

Priority	Meaning

LOW	Improve during normal cycle
MEDIUM	Fix with priority
HIGH	Required before serious use
CRITICAL	Immediate remediation
BLOCKING	Operation or deployment must stop



---

24. Closure Criteria

An incident may be closed only when:

Incident is classified.
Impact is assessed.
Evidence is recorded.
Human oversight is completed where required.
Containment is complete.
Mitigation is applied or accepted.
EVT linkage exists where required.
Verification status is clear.
Audit status is clear.
Remaining risk is documented.
Responsible role approves closure.

Closure does not erase the incident.

Closure records that the incident has been reviewed and handled.


---

25. Incident Report Template

Use this full template.

# Incident Report

## Header
Incident ID:
Incident Title:
Incident Class:
Severity:
Status:
Reported By:
Responsible Role:
Date Reported:
Date Detected:
Date Occurred:
Affected Domain:
Affected Component:
Human Oversight Required:
EVT Required:
Audit Required:
Verification Required:

## Executive Summary
Summary:
Impact:
Current Status:
Required Action:

## Timeline
| Time | Event | Source | Notes |
| --- | --- | --- | --- |

## Affected Components
| Component | Affected | Notes |
| --- | --- | --- |

## Impact Assessment
| Impact Area | Impact Level | Notes |
| --- | --- | --- |

## Root Cause Analysis
Root Cause:
Contributing Factors:
Detection Gap:
Control Gap:
Governance Gap:

## Containment Actions
| Action ID | Action | Owner Role | Status | Notes |
| --- | --- | --- | --- | --- |

## Mitigation Actions
| Action ID | Mitigation | Owner Role | Due Date | Status |
| --- | --- | --- | --- | --- |

## Evidence Register
| Evidence ID | Evidence Type | Reference | Sensitivity | Verification Status |
| --- | --- | --- | --- | --- |

## EVT Linkage
EVT ID:
Previous EVT:
Verification Status:
Audit Status:

## Human Oversight
Oversight State:
Responsible Role:
Review Outcome:
Review Notes:

## Security Boundary Review
Describe whether defensive boundary was preserved.

## Data Handling Review
Describe data handling impact.

## Policy Review
Describe applicable policy or missing policy.

## Fail-Closed Review
Describe whether fail-closed behavior was required and triggered.

## Lessons Learned
What worked:
What failed:
What was missing:
What should change:
What should be monitored:

## Remediation Plan
| Remediation ID | Action | Owner Role | Priority | Due Date | Status |
| --- | --- | --- | --- | --- | --- |

## Closure
Closure Status:
Closure Date:
Approved By Role:
Remaining Risk:
Final Notes:


---

26. Example Incident Report

# Incident Report

## Header
Incident ID: INC-20260429-0001
Incident Title: Missing oversight state for sensitive AI-assisted output
Incident Class: OVERSIGHT_INCIDENT
Severity: HIGH
Status: OPEN
Reported By: Operator
Responsible Role: Reviewer
Date Reported: 2026-04-29
Date Detected: 2026-04-29
Date Occurred: 2026-04-29
Affected Domain: AI Governance
Affected Component: Human oversight model
Human Oversight Required: yes
EVT Required: yes
Audit Required: yes
Verification Required: yes

## Executive Summary
Summary:
A sensitive AI-assisted output was generated without a recorded human oversight state.

Impact:
The output may have been treated as usable before review.

Current Status:
Incident is open and requires review.

Required Action:
Add oversight state, create correction EVT and review affected workflow.

## Root Cause Analysis
Root Cause:
Oversight metadata was not required by the affected workflow.

Contributing Factors:
Risk class was assigned but not connected to oversight requirement.

Detection Gap:
The workflow did not check for missing oversight state.

Control Gap:
Runtime decision did not require review metadata.

Governance Gap:
Human oversight model was documented but not fully implemented.

## Closure
Closure Status: pending
Closure Date:
Approved By Role:
Remaining Risk:
Final Notes:


---

27. Incident Maturity Levels

Level	Description

I0	No incident template
I1	Incident template documented
I2	Incident classes and severity defined
I3	Evidence register included
I4	EVT linkage included
I5	Correction events included
I6	Incident workflow connected to runtime
I7	Incident dashboard available
I8	Incident review connected to audit and risk register


AI JOKER-C2 should move from incident documentation to incident runtime support.


---

28. Implementation Targets

Suggested files:

docs/INCIDENT_REPORT_TEMPLATE.md
lib/incident.ts
lib/evt.ts
lib/risk-register.ts
lib/human-oversight.ts
app/api/incidents/route.ts

Suggested future types:

export type IncidentClass =
  | "AI_GOVERNANCE_INCIDENT"
  | "SECURITY_INCIDENT"
  | "DATA_HANDLING_INCIDENT"
  | "RUNTIME_INCIDENT"
  | "FILE_HANDLING_INCIDENT"
  | "EVT_INCIDENT"
  | "POLICY_INCIDENT"
  | "OVERSIGHT_INCIDENT"
  | "PUBLIC_SECTOR_INCIDENT"
  | "CRITICAL_INFRASTRUCTURE_INCIDENT";

export type IncidentSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "PROHIBITED";

export type IncidentStatus =
  | "OPEN"
  | "TRIAGED"
  | "CONTAINED"
  | "MITIGATED"
  | "UNDER_REVIEW"
  | "ESCALATED"
  | "CLOSED"
  | "REOPENED"
  | "REJECTED"
  | "SUPERSEDED";


---

29. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

This incident report template does not create legal, regulatory, cybersecurity, public-sector, financial, medical or critical infrastructure certification.

Any real-world incident requires proper review by authorized professionals and responsible organizations.

Incident documentation supports review.

It does not replace incident command.


---

30. Final Incident Formula

An incident without evidence becomes narrative.
An incident with identity, timeline, risk, EVT, verification and remediation becomes governable.

Operational formula:

Incident Governance =
Detection + Classification + Impact + Containment + Evidence + EVT + Review + Remediation + Closure


---

31. Status

Document status: active incident report template
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

