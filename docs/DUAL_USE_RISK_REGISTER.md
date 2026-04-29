# AI JOKER-C2 Dual-Use Risk Register

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the dual-use risk register for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The purpose of this document is to classify and control risks that may arise when AI-assisted operations can have both civil and strategic relevance.

The system is designed for lawful, defensive, accountable and governance-oriented use.

It is not designed for offensive use.

It is not designed for unlawful surveillance.

It is not designed for autonomous weapons, sabotage, coercive manipulation or cyber-offensive operations.

This document provides a structured register for:

- allowed dual-use contexts;
- sensitive dual-use contexts;
- prohibited dual-use contexts;
- escalation triggers;
- fail-closed triggers;
- human oversight requirements;
- EVT traceability;
- audit readiness;
- mitigation actions.

---

## 2. Dual-Use Definition

In this repository, dual-use means that AI JOKER-C2 may support both:

1. civil, business, institutional and public-sector workflows;
2. strategic resilience, critical infrastructure, cybersecurity governance and operational continuity workflows.

Dual-use does not mean unrestricted use.

Dual-use does not mean military offensive use.

Dual-use does not mean cyber-offensive capability.

Dual-use does not mean surveillance without lawful basis.

Dual-use means:

```txt
Controlled strategic applicability under identity, policy, risk, oversight, EVT, verification and fail-closed governance.


---

3. Core Principle

The core dual-use principle is:

Strategic usefulness must not become uncontrolled capability.

Expanded:

Dual-Use Governance =
Identity + Authorization + Policy + Risk + Human Oversight + EVT + Verification + Fail-Closed

Operational sequence:

Identity -> Context -> Policy -> Risk -> Decision -> Human Oversight -> EVT -> Ledger -> Verification -> Audit

The more sensitive the domain, the stronger the oversight and fail-closed requirements.


---

4. Strategic Architecture

AI JOKER-C2 operates inside the following architecture:

MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = event trace layer
Ledger = continuity layer
Fail-closed = safety boundary

Dual-use risk must be handled inside this architecture.

A dual-use request must never bypass:

identity;

policy;

risk classification;

human oversight;

decision control;

EVT traceability;

verification;

fail-closed behavior.



---

5. Dual-Use Risk Classes

AI JOKER-C2 uses the following dual-use risk classes.

Risk Class	Meaning	Default Decision

LOW	Ordinary civil or documentation use	ALLOW
MEDIUM	Strategic or operational relevance with low misuse potential	AUDIT
HIGH	Sensitive domain, possible misuse, institutional or security relevance	ESCALATE or DEGRADE
CRITICAL	High-impact dual-use context requiring strict review	ESCALATE or BLOCK
PROHIBITED	Offensive, unlawful, abusive or outside project boundary	BLOCK
UNKNOWN	Cannot be safely classified	ESCALATE or BLOCK


Unknown dual-use risk must not be treated as LOW.


---

6. Dual-Use Decision Model

Decision	Meaning

ALLOW	Operation may proceed within defined safe scope
BLOCK	Operation is prohibited or unsafe
ESCALATE	Human authority, legal review, security review or institutional review required
DEGRADE	Provide limited safe support only
AUDIT	Operation may proceed but should be recorded and reviewed
NOOP	No operational action is taken


The decision must be produced before sensitive execution.

No decision should be invented after the fact to justify an unsafe operation.


---

7. Authorized Dual-Use Domains

The following domains may be authorized when use remains lawful, defensive, accountable and reviewable.

Domain	Authorized Function

AI governance	Risk classification, policy mapping, human oversight, audit preparation
Defensive cybersecurity	Incident documentation, hardening notes, remediation planning, resilience support
Critical infrastructure resilience	Continuity planning, escalation templates, documentation, evidence mapping
Public administration	Document support, traceability, internal process governance
Cloud and data governance	Runtime governance, audit trails, data handling documentation
Enterprise governance	B2B AI control, documentation, risk mapping, compliance preparation
Public-sector governance	B2G documentation, institutional review, audit-oriented workflows
Research and education	Safe prototype testing, governance simulation, audit model design
Civil protection	Scenario documentation, continuity planning, communication drafts under review
Strategic risk analysis	Non-operational analysis, institutional reports, governance mapping


Authorization depends on context, user authority, data sensitivity and operational impact.


---

8. Sensitive Dual-Use Domains

The following domains require stricter review.

Domain	Risk Reason	Default Handling

Cybersecurity	Can shift from defense to offense	AUDIT, DEGRADE or ESCALATE
Critical infrastructure	High impact on services and safety	ESCALATE
Public-sector workflows	Institutional authority and rights impact	AUDIT or ESCALATE
Procurement	Legal and administrative consequences	AUDIT or ESCALATE
Public communication	Reputational, civic or institutional impact	REVIEW REQUIRED
Data handling	Personal, confidential or secret data risk	AUDIT or ESCALATE
Security incidents	Sensitive logs, topology and active response	ESCALATE
Emergency planning	Public safety and continuity implications	ESCALATE
Cloud operations	Secrets, access control, infrastructure exposure	AUDIT or ESCALATE
AI compliance	Risk of false certification claims	AUDIT


Sensitive domains require human oversight and EVT traceability where relevant.


---

9. Prohibited Dual-Use Domains

AI JOKER-C2 must not be used for:

offensive cyber operations;

unauthorized intrusion;

exploit deployment against real targets;

malware creation or deployment;

credential theft;

phishing operations;

persistence mechanisms;

evasion of security tools;

stealth operations;

sabotage;

destructive actions;

autonomous targeting;

lethal decision support;

autonomous weapons;

unlawful surveillance;

biometric identification without lawful basis;

coercive population manipulation;

disinformation operations;

repression of fundamental rights;

hidden scoring of citizens;

bypassing public authority;

fabrication of evidence;

removal of auditability;

bypassing human oversight.


Prohibited use must produce BLOCK or safe redirection.


---

10. Dual-Use Risk Register Fields

Each dual-use risk entry should include:

Field	Description

risk_id	Unique risk identifier
title	Short risk name
description	Clear explanation of the risk
domain	Dual-use domain
context_class	Runtime context class
dual_use_class	ALLOWED, SENSITIVE, RESTRICTED, PROHIBITED or UNKNOWN
risk_class	LOW, MEDIUM, HIGH, CRITICAL, PROHIBITED or UNKNOWN
probability	Likelihood from 1 to 5
impact	Impact from 1 to 5
risk_score	Probability multiplied by impact
decision	ALLOW, BLOCK, ESCALATE, DEGRADE, AUDIT or NOOP
human_oversight	Oversight state
policy_reference	Applicable policy file or boundary
mitigation	Required mitigation
evt_required	Whether an EVT is required
audit_status	Audit status
owner_role	Responsible role
status	OPEN, MITIGATED, ESCALATED, BLOCKED, CLOSED or MONITORING



---

11. Dual-Use Classes

Dual-Use Class	Meaning	Default Handling

ALLOWED	Clearly lawful, civil, defensive or documentation-oriented	ALLOW or AUDIT
SENSITIVE	Lawful but operationally, institutionally or technically sensitive	AUDIT or ESCALATE
RESTRICTED	Requires explicit authority, review or controlled environment	ESCALATE or DEGRADE
PROHIBITED	Unsafe, unlawful, offensive or outside boundary	BLOCK
UNKNOWN	Cannot be safely classified	ESCALATE or BLOCK


The default for unknown dual-use classification is conservative.


---

12. Probability Scale

Score	Probability	Meaning

1	Rare	Unlikely under normal conditions
2	Unlikely	Possible but not expected
3	Possible	Could occur in realistic use
4	Likely	Expected in some workflows
5	Almost certain	Expected unless controlled


Probability should be based on context, not imagination alone.


---

13. Impact Scale

Score	Impact	Meaning

1	Minimal	Limited effect
2	Minor	Manageable operational effect
3	Moderate	Meaningful organizational, security or governance effect
4	Major	Serious effect on systems, users, institutions or services
5	Severe	Critical effect on rights, safety, security, infrastructure or public trust


Impact must consider misuse potential, institutional consequences and technical sensitivity.


---

14. Risk Score

Suggested formula:

risk_score = probability x impact

Score Range	Risk Level	Suggested Handling

1 to 4	LOW	ALLOW or monitor
5 to 9	MEDIUM	AUDIT or mitigate
10 to 16	HIGH	ESCALATE, mitigate or DEGRADE
17 to 25	CRITICAL	ESCALATE or BLOCK
Prohibited	PROHIBITED	BLOCK


A low numeric score cannot override a prohibited category.

Policy always dominates numeric scoring.


---

15. Dual-Use Risk Register Template

risk_id	title	domain	dual_use_class	risk_class	probability	impact	risk_score	decision	human_oversight	evt_required	audit_status	status

DUR-0001	Example dual-use risk	AI Governance	SENSITIVE	MEDIUM	3	3	9	AUDIT	RECOMMENDED	true	READY	OPEN



---

16. Full Risk Entry Template

{
  "risk_id": "DUR-0001",
  "title": "Defensive cybersecurity request may be interpreted as offensive",
  "description": "A request framed as defensive security may contain details that could enable unauthorized activity if answered without limitation.",
  "domain": "Defensive Cybersecurity",
  "context_class": "SECURITY",
  "dual_use_class": "SENSITIVE",
  "risk_class": "HIGH",
  "probability": 3,
  "impact": 4,
  "risk_score": 12,
  "decision": "DEGRADE",
  "human_oversight": "REQUIRED",
  "policy_reference": "SECURITY.md",
  "mitigation": "Provide defensive documentation only and avoid exploit deployment details.",
  "evt_required": true,
  "audit_status": "REQUIRED",
  "owner_role": "SECURITY_OFFICER",
  "status": "OPEN"
}


---

17. Common Dual-Use Risks

risk_id	Risk	Default Class	Default Decision

DUR-AI-001	AI governance output treated as certification	SENSITIVE	AUDIT
DUR-AI-002	High-impact AI output used without review	RESTRICTED	ESCALATE
DUR-AI-003	Model output treated as final authority	SENSITIVE	AUDIT or ESCALATE
DUR-AI-004	Human oversight bypassed	RESTRICTED	ESCALATE
DUR-AI-005	Fabricated audit or compliance evidence	PROHIBITED	BLOCK
DUR-AI-006	Unknown risk treated as low risk	RESTRICTED	ESCALATE or BLOCK
DUR-AI-007	Runtime decision invented after execution	SENSITIVE	AUDIT
DUR-AI-008	EVT not generated for sensitive operation	SENSITIVE	AUDIT or ESCALATE



---

18. Cybersecurity Dual-Use Risks

risk_id	Risk	Default Class	Default Decision

DUR-SEC-001	Defensive request contains offensive details	SENSITIVE	DEGRADE
DUR-SEC-002	Request asks for exploit deployment	PROHIBITED	BLOCK
DUR-SEC-003	Request involves unauthorized target	PROHIBITED	BLOCK
DUR-SEC-004	Incident report exposes secrets or topology	RESTRICTED	ESCALATE
DUR-SEC-005	Remediation request includes attack chain	SENSITIVE	DEGRADE
DUR-SEC-006	Security output could enable evasion	PROHIBITED	BLOCK
DUR-SEC-007	SOC workflow lacks human review	SENSITIVE	AUDIT
DUR-SEC-008	Security logs processed without minimization	RESTRICTED	ESCALATE



---

19. Critical Infrastructure Dual-Use Risks

risk_id	Risk	Default Class	Default Decision

DUR-CI-001	AI used for direct infrastructure control	PROHIBITED	BLOCK
DUR-CI-002	Operational recommendation without authority	RESTRICTED	ESCALATE
DUR-CI-003	Critical topology exposed	RESTRICTED	ESCALATE
DUR-CI-004	Continuity plan used without review	SENSITIVE	AUDIT or ESCALATE
DUR-CI-005	Incident documentation lacks evidence	SENSITIVE	AUDIT
DUR-CI-006	Unknown risk in critical domain	RESTRICTED	ESCALATE or BLOCK
DUR-CI-007	Human authority unclear	RESTRICTED	ESCALATE
DUR-CI-008	Output may affect public safety	RESTRICTED	ESCALATE



---

20. Public-Sector Dual-Use Risks

risk_id	Risk	Default Class	Default Decision

DUR-GOV-001	Public communication published without review	SENSITIVE	ESCALATE
DUR-GOV-002	Procurement support becomes final decision	RESTRICTED	ESCALATE
DUR-GOV-003	AI output affects public services	RESTRICTED	ESCALATE
DUR-GOV-004	Public-sector data not classified	SENSITIVE	AUDIT
DUR-GOV-005	Hidden scoring or profiling	PROHIBITED	BLOCK
DUR-GOV-006	Institutional responsibility unclear	SENSITIVE	AUDIT or ESCALATE
DUR-GOV-007	Audit trail missing for sensitive workflow	SENSITIVE	AUDIT
DUR-GOV-008	Human review bypassed	RESTRICTED	ESCALATE



---

21. Data Dual-Use Risks

risk_id	Risk	Default Class	Default Decision

DUR-DATA-001	Secrets included in prompt	RESTRICTED	BLOCK or ESCALATE
DUR-DATA-002	Confidential material exposed in public output	RESTRICTED	BLOCK or DEGRADE
DUR-DATA-003	Personal data processed without need	SENSITIVE	AUDIT or ESCALATE
DUR-DATA-004	Critical operational data exposed	RESTRICTED	ESCALATE
DUR-DATA-005	Public and internal EVT views mixed	SENSITIVE	AUDIT or ESCALATE
DUR-DATA-006	Unknown data sensitivity	RESTRICTED	ESCALATE
DUR-DATA-007	Evidence pack contains unnecessary sensitive payloads	SENSITIVE	AUDIT
DUR-DATA-008	Logs contain security-sensitive content	RESTRICTED	ESCALATE



---

22. B2B Dual-Use Risks

risk_id	Risk	Default Class	Default Decision

DUR-B2B-001	Customer treats prototype as certified product	SENSITIVE	AUDIT
DUR-B2B-002	Enterprise workflow lacks human review	SENSITIVE	AUDIT
DUR-B2B-003	Security support shifts toward offensive use	RESTRICTED	DEGRADE or BLOCK
DUR-B2B-004	Compliance support becomes compliance claim	SENSITIVE	AUDIT
DUR-B2B-005	Deployment without access control	RESTRICTED	ESCALATE
DUR-B2B-006	Secrets mishandled in integration	RESTRICTED	ESCALATE
DUR-B2B-007	Data retention undefined	SENSITIVE	AUDIT
DUR-B2B-008	Audit evidence unavailable	SENSITIVE	AUDIT



---

23. B2G Dual-Use Risks

risk_id	Risk	Default Class	Default Decision

DUR-B2G-001	Public authority delegated to AI	PROHIBITED	BLOCK
DUR-B2G-002	Institutional output used without review	RESTRICTED	ESCALATE
DUR-B2G-003	Citizen-facing effect without authority	RESTRICTED	ESCALATE
DUR-B2G-004	Public-sector data exposed	RESTRICTED	ESCALATE
DUR-B2G-005	Procurement review lacks audit trail	SENSITIVE	AUDIT
DUR-B2G-006	Emergency planning used operationally without command review	RESTRICTED	ESCALATE
DUR-B2G-007	Public communication lacks human approval	SENSITIVE	ESCALATE
DUR-B2G-008	Institutional accountability unclear	SENSITIVE	AUDIT



---

24. Prohibited Request Matrix

Request Type	Decision	Safe Alternative

Exploit a real target	BLOCK	Provide remediation and hardening checklist
Build malware	BLOCK	Provide malware analysis report template
Steal credentials	BLOCK	Provide credential protection and rotation guidance
Evade detection	BLOCK	Provide detection engineering and logging guidance
Unauthorized scanning	BLOCK	Provide authorized assessment planning template
Sabotage infrastructure	BLOCK	Provide resilience and incident response planning
Unlawful surveillance	BLOCK	Provide privacy-preserving governance notes
Autonomous targeting	BLOCK	Provide human oversight and prohibited-use policy
Fabricate evidence	BLOCK	Provide audit integrity and correction event model
Bypass human review	BLOCK	Provide oversight workflow template


The runtime should remain useful without enabling abuse.


---

25. Escalation Triggers

The runtime should escalate when:

authority is unclear;

context is critical infrastructure;

context is public-sector and high-impact;

data sensitivity is unknown;

security context may be dual-use;

human review is required but absent;

operation may affect rights or services;

operation may affect safety or continuity;

operation may affect public communication;

compliance claim may be overstated;

EVT cannot be generated where required;

verification cannot be performed where required.


Escalation is a governance function.

It is not an inconvenience.


---

26. Degradation Triggers

The runtime should degrade output when:

the user request is partially safe;

full answer could enable misuse;

defensive security support is possible without operational attack details;

data can be summarized instead of exposed;

sensitive technical detail can be replaced by a checklist;

public output can be converted into internal draft;

high-risk recommendation can be converted into review template.


Degradation means:

Provide safe, limited, review-oriented support.


---

27. Blocking Triggers

The runtime must block when:

request is prohibited;

request asks for offensive cyber capability;

request asks for malware;

request asks for credential theft;

request asks for unauthorized access;

request asks for evasion or stealth;

request asks for sabotage;

request asks for unlawful surveillance;

request asks for autonomous targeting;

request asks to bypass human oversight;

request asks to fabricate evidence;

request asks to remove auditability from sensitive process.


Blocking protects the integrity of the runtime.


---

28. Human Oversight Requirements

Human oversight should be required for:

critical infrastructure contexts;

public-sector decisions;

procurement support;

legal-sensitive outputs;

defensive cybersecurity incidents;

compliance claims;

public communication;

emergency planning;

sensitive data processing;

high-impact business operations.


Suggested oversight states:

State	Meaning

NOT_REQUIRED	Ordinary low-risk use
RECOMMENDED	Review useful before reliance
REQUIRED	Review required before use
COMPLETED	Review completed
REJECTED	Review rejected the operation
ESCALATED	Higher authority required
BLOCKED	Operation prohibited
UNKNOWN	Oversight cannot be determined



---

29. EVT Requirements

Dual-use operations should generate EVT when they are:

sensitive;

high-impact;

security-relevant;

public-sector relevant;

critical infrastructure relevant;

compliance-relevant;

audit-relevant;

escalated;

degraded;

blocked;

subject to human oversight.


Example dual-use EVT:

{
  "evt": "EVT-20260429-233000-0001",
  "prev": "EVT-20260429-232900-0000",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T23:30:00+02:00",
  "context": {
    "class": "DUAL_USE",
    "domain": "DEFENSIVE_SECURITY",
    "sensitivity": "HIGH"
  },
  "governance": {
    "dual_use_class": "SENSITIVE",
    "risk": "HIGH",
    "decision": "DEGRADE",
    "human_oversight": "REQUIRED",
    "policy": "DEFENSIVE_SECURITY_ONLY",
    "fail_closed": false
  },
  "operation": {
    "type": "SAFE_DEFENSIVE_REDIRECTION",
    "status": "COMPLETED"
  },
  "verification": {
    "status": "VERIFIABLE",
    "audit_status": "READY"
  }
}

EVT does not authorize the operation.

EVT makes governance reconstructable.


---

30. Audit Requirements

Dual-use audit should check:

Is the use lawful?
Is the use authorized?
Is the context civil, defensive or institutional?
Is the request within project scope?
Is the dual-use class assigned?
Is the risk class assigned?
Is human oversight required?
Was the decision appropriate?
Was the output allowed, degraded, escalated or blocked?
Was EVT generated where required?
Can the operation be verified?
Was any prohibited capability avoided?

If these questions cannot be answered, the operation is not audit-ready.


---

31. Mitigation Actions

Suggested mitigation actions:

Mitigation	Description

HUMAN_REVIEW	Require review before use
ESCALATION	Escalate to authority or specialist
DEGRADATION	Provide limited safe support
BLOCKING	Refuse unsafe or prohibited request
REDACTION	Remove sensitive content
DATA_MINIMIZATION	Reduce data exposure
DEFENSIVE_REFRAMING	Convert request into safe defensive guidance
EVT_RECORD	Generate event trace
AUDIT_REVIEW	Require audit review
POLICY_UPDATE	Update policy boundary
SECURITY_REVIEW	Require security review
LEGAL_REVIEW	Require legal review
DPO_REVIEW	Require data protection review
NON_CERTIFICATION_NOTICE	Prevent false compliance or certification claim



---

32. Dual-Use Review Workflow

Recommended workflow:

Identify request
Classify context
Classify dual-use domain
Assign dual-use class
Assign risk class
Check authorization
Check policy boundary
Check data sensitivity
Determine human oversight
Select decision
Apply mitigation
Generate EVT if required
Set audit status
Review or close

The workflow must remain conservative when uncertainty is significant.


---

33. Dual-Use Checklist

Before processing a dual-use request, check:

Is the domain dual-use sensitive?
Is the user authorized?
Is the target system owned or authorized?
Is the request defensive, civil or institutional?
Can the output enable abuse?
Can the output enable offensive cyber activity?
Can the output enable unlawful surveillance?
Can the output affect critical infrastructure?
Can the output affect rights, services or safety?
Is data sensitivity known?
Is human oversight required?
Should the output be degraded?
Should the request be escalated?
Should the request be blocked?
Should an EVT be generated?


---

34. Repository Alignment

This document must remain aligned with:

README.md
ARCHITECTURE.md
GOVERNANCE.md
PROTOCOL.md
EVT_PROTOCOL.md
SECURITY.md
COMPLIANCE.md
DUAL_USE_STRATEGIC_POSITIONING.md
ROADMAP.md
CONTRIBUTING.md
docs/DEFENSIVE_SECURITY_USE_CASES.md
docs/CRITICAL_INFRASTRUCTURE_USE_CASES.md
docs/HUMAN_OVERSIGHT_MODEL.md
docs/RISK_REGISTER_TEMPLATE.md
docs/AUDIT_CHECKLIST.md
docs/DATA_HANDLING_MODEL.md

Contradictions between dual-use files should be treated as governance issues.


---

35. Implementation Targets

Suggested future files:

lib/dual-use-classifier.ts
lib/risk-engine.ts
lib/policy-engine.ts
lib/runtime-decision.ts
lib/human-oversight.ts
lib/evt.ts

Suggested future types:

export type DualUseClass =
  | "ALLOWED"
  | "SENSITIVE"
  | "RESTRICTED"
  | "PROHIBITED"
  | "UNKNOWN";

export type DualUseDomain =
  | "AI_GOVERNANCE"
  | "DEFENSIVE_SECURITY"
  | "CRITICAL_INFRASTRUCTURE"
  | "PUBLIC_SECTOR"
  | "B2B"
  | "B2G"
  | "DATA_HANDLING"
  | "RESEARCH"
  | "CIVIL_PROTECTION"
  | "UNKNOWN";

export type DualUseDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE"
  | "DEGRADE"
  | "AUDIT"
  | "NOOP";


---

36. Dual-Use Maturity Levels

Level	Description

DU0	No dual-use model
DU1	Dual-use boundary documented
DU2	Dual-use risks registered
DU3	Dual-use classifier designed
DU4	Dual-use classification implemented
DU5	Dual-use decisions connected to EVT
DU6	Dual-use audit workflow implemented
DU7	Dashboard and reporting available
DU8	External review possible


AI JOKER-C2 should evolve from documented boundary to executable dual-use governance.


---

37. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

This dual-use risk register does not create legal, military, cybersecurity, export-control, public-sector, financial, medical or critical infrastructure certification.

Any real-world deployment in sensitive or regulated contexts requires review by authorized legal, security, compliance and operational professionals.

Dual-use governance must be adapted to deployment context, jurisdiction, use case and authority.


---

38. Final Dual-Use Formula

Dual-use without governance becomes uncontrolled capability.
Dual-use with identity, policy, risk, oversight, EVT, verification and fail-closed behavior becomes accountable strategic support.

Operational formula:

Dual-Use Governance =
Authorization + Identity + Policy + Risk + Human Oversight + EVT + Verification + Fail-Closed


---

39. Status

Document status: active dual-use risk register
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

