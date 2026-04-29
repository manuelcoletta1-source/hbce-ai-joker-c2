# AI JOKER-C2 Human Oversight Model

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the human oversight model for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The purpose of this model is to define when AI-assisted operations may proceed, when they require human review, when they must be escalated and when they must be blocked.

AI JOKER-C2 is not designed to replace human responsibility.

It is designed to support human operators, organizations, institutions and reviewers by making AI-assisted operations:

- traceable;
- bounded;
- reviewable;
- risk-classified;
- auditable;
- human-accountable;
- fail-closed by design.

---

## 2. Core Principle

The core principle is:

```txt
AI may assist.
Humans remain responsible.

Expanded:

AI JOKER-C2 can generate, classify, structure and support.
AI JOKER-C2 must not become the final authority in high-impact, sensitive or regulated contexts.

Operational formula:

Identity -> Policy -> Risk -> Human Oversight -> Decision -> EVT -> Verification -> Audit

Human oversight is not external decoration.

It is a governance layer inside the runtime.


---

3. Oversight Position in the Runtime

The canonical AI JOKER-C2 runtime sequence is:

Identity -> Input -> Intent -> Context -> Policy -> Risk -> Human Oversight -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity

Human oversight sits between risk classification and final decision.

This means:

1. the runtime receives the request;


2. the runtime classifies intent and context;


3. the runtime evaluates policy;


4. the runtime assigns risk;


5. the runtime determines whether human review is needed;


6. the runtime decides whether to allow, block, escalate, degrade or audit;


7. the runtime records the operation when relevant.



Human oversight must be evaluated before sensitive execution.


---

4. Oversight States

AI JOKER-C2 uses the following oversight states.

State	Meaning

NOT_REQUIRED	Ordinary low-risk support; human review is not required before use
RECOMMENDED	Human review is useful before relying on the output
REQUIRED	Human review is required before the output can be used operationally
COMPLETED	Human review has been completed
REJECTED	Human review rejected the output or operation
ESCALATED	Higher authority, specialist review or institutional validation is required
BLOCKED	Human oversight cannot authorize the operation because it is prohibited
UNKNOWN	Oversight requirement cannot be safely determined


Unknown oversight in sensitive contexts must not be treated as permission.


---

5. Oversight Decision Table

Risk Class	Default Oversight	Default Runtime Decision

LOW	NOT_REQUIRED or RECOMMENDED	ALLOW
MEDIUM	RECOMMENDED	ALLOW or AUDIT
HIGH	REQUIRED	AUDIT, ESCALATE or DEGRADE
CRITICAL	REQUIRED or ESCALATED	ESCALATE or BLOCK
PROHIBITED	BLOCKED	BLOCK
UNKNOWN	ESCALATED	ESCALATE or BLOCK


The runtime must not convert unknown risk into automatic execution.


---

6. Oversight by Domain

Domain	Default Oversight

Ordinary writing	NOT_REQUIRED or RECOMMENDED
Technical documentation	RECOMMENDED
Code refactoring	RECOMMENDED
Security documentation	RECOMMENDED or REQUIRED
Active cybersecurity incident support	REQUIRED
Public-sector communication	REQUIRED
Procurement support	REQUIRED
Compliance mapping	RECOMMENDED or REQUIRED
Legal-sensitive analysis	REQUIRED
Medical or health-related operations	REQUIRED
Financial decision support	REQUIRED
Critical infrastructure support	REQUIRED or ESCALATED
Law enforcement or coercive authority	ESCALATED or BLOCKED
Offensive cyber request	BLOCKED
Unlawful surveillance request	BLOCKED


Human oversight intensity increases with operational impact.


---

7. Allowed AI Assistance

AI JOKER-C2 may assist humans with:

drafting;

summarization;

classification;

documentation;

risk mapping;

code review;

policy structuring;

security hardening notes;

incident report templates;

audit checklists;

compliance-oriented documentation;

public communication drafts;

institutional briefing drafts;

technical comparison tables;

evidence pack outlines;

governance maps.


These outputs may still require human review depending on context.

AI assistance is not the same as operational authority.


---

8. Operations Requiring Human Review

Human review should be required when the output may affect:

rights;

public services;

access to resources;

procurement outcomes;

legal interpretation;

financial decisions;

medical or health-related decisions;

cybersecurity operations;

critical infrastructure;

public communication;

institutional reputation;

emergency response;

law enforcement;

coercive authority;

regulated decisions;

irreversible operational action.


In these cases, AI JOKER-C2 should mark the output as review-required.


---

9. Operations Requiring Escalation

Escalation is required when ordinary human review is not enough.

Escalation may be required for:

critical infrastructure incidents;

security events affecting live systems;

public safety scenarios;

legal or regulatory uncertainty;

sensitive public-sector operations;

high-impact public communication;

emergency continuity planning;

potential rights impact;

unclear authorization;

sensitive dual-use interpretation;

unknown risk in high-impact contexts.


Escalation means the runtime should not treat the request as ordinary.

It should produce limited safe support, require authority or stop execution.


---

10. Operations Requiring Blocking

The runtime must block requests that involve:

offensive cyber operations;

unauthorized intrusion;

malware;

credential theft;

exploit deployment against real targets;

evasion of security tools;

stealth or persistence mechanisms;

sabotage;

unlawful surveillance;

autonomous targeting;

coercive manipulation;

disinformation operations;

fabrication of evidence;

bypassing human oversight;

hiding AI involvement where disclosure is required;

replacing public authority without review;

removing auditability from sensitive processes.


No human oversight workflow should be used to legitimize prohibited activity.

Some operations are not reviewable.

They are outside scope.


---

11. Advisory Output Rule

AI JOKER-C2 outputs should be treated as advisory unless explicitly validated by a responsible human or institutional process.

Recommended label for sensitive outputs:

Status: AI-assisted draft.
Human review required before operational use.

Recommended label for institutional outputs:

Status: support material.
Final authority remains with the responsible human office or organization.

Recommended label for technical outputs:

Status: technical support draft.
Review and test before deployment.

Advisory status prevents model output from being mistaken for authority.


---

12. Human Roles

The following roles may participate in oversight.

Role	Function

Operator	Uses the runtime for ordinary or technical tasks
Reviewer	Reviews AI-assisted output before use
Approver	Authorizes use in a defined workflow
Auditor	Reviews event records and evidence
Maintainer	Controls repository, deployment and runtime configuration
Security officer	Reviews security-sensitive outputs
Legal reviewer	Reviews legal or regulatory sensitivity
Data protection reviewer	Reviews personal or sensitive data processing
Institutional authority	Holds responsibility in public-sector contexts
Incident commander	Holds authority in emergency or incident response contexts


AI JOKER-C2 supports these roles.

It does not replace them.


---

13. Oversight Metadata

Relevant operations may include oversight metadata.

Suggested structure:

{
  "human_oversight": {
    "state": "REQUIRED",
    "reason": "Sensitive institutional context",
    "required_role": "REVIEWER",
    "final_authority": "HUMAN_OPERATOR",
    "review_status": "PENDING"
  }
}

For completed review:

{
  "human_oversight": {
    "state": "COMPLETED",
    "reviewer_role": "SECURITY_OFFICER",
    "review_result": "APPROVED_WITH_LIMITATIONS",
    "review_note": "Output approved as documentation only"
  }
}

Oversight metadata should not expose unnecessary personal data.

Role-based references are preferred unless identity is required by the deployment context.


---

14. Oversight in EVT Records

EVT records should include human oversight status when relevant.

Example:

{
  "evt": "EVT-20260429-220000-0001",
  "prev": "GENESIS",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T22:00:00+02:00",
  "context": {
    "class": "AI_GOVERNANCE",
    "domain": "HUMAN_OVERSIGHT",
    "sensitivity": "HIGH"
  },
  "governance": {
    "risk": "HIGH",
    "decision": "ESCALATE",
    "human_oversight": "REQUIRED",
    "policy": "HUMAN_REVIEW_REQUIRED",
    "fail_closed": false
  },
  "operation": {
    "type": "PUBLIC_SECTOR_DRAFT",
    "status": "DRAFT_GENERATED"
  },
  "verification": {
    "status": "VERIFIABLE",
    "audit_status": "REVIEW_REQUIRED"
  }
}

The EVT should show whether review was required, completed, rejected or escalated.


---

15. Review Outcomes

Human review may produce different outcomes.

Outcome	Meaning

APPROVED	Output may be used within defined scope
APPROVED_WITH_LIMITATIONS	Output may be used only with constraints
REJECTED	Output must not be used
NEEDS_REVISION	Output requires modification
ESCALATED	Higher authority or specialist review required
INFORMATION_INSUFFICIENT	More evidence or context is required
OUT_OF_SCOPE	Request is outside allowed workflow


The runtime should preserve review outcome when connected to EVT or audit workflows.


---

16. Human Oversight and Fail-Closed

Human oversight supports fail-closed behavior.

The runtime should block, degrade or escalate when:

human review is required but unavailable;

authority is unclear;

reviewer role is undefined;

output may affect high-impact decisions;

data sensitivity is unknown;

operational impact is unclear;

compliance basis is uncertain;

request involves security-sensitive content;

EVT generation fails where required;

audit status cannot be determined.


Fail-closed rule:

No high-impact operational reliance without human review.


---

17. Oversight and Public-Sector Use

In public-sector contexts, human oversight is required when outputs may affect:

citizen communication;

public services;

administrative decisions;

procurement;

public safety;

policy positions;

regulated procedures;

rights or access;

critical infrastructure;

emergency response.


AI JOKER-C2 may prepare support material.

The public office remains responsible.

Recommended public-sector label:

This output is AI-assisted support material and requires review by the responsible public authority before use.


---

18. Oversight and B2B Use

In business contexts, human oversight is required or recommended when outputs may affect:

production systems;

customers;

contracts;

security posture;

compliance claims;

incident response;

financial exposure;

data handling;

regulated operations;

critical infrastructure clients.


Recommended B2B label:

This output is AI-assisted business support and should be reviewed before operational, legal, security or compliance use.


---

19. Oversight and Defensive Security

In defensive security contexts, human oversight is required when outputs involve:

active incidents;

real systems;

vulnerabilities;

security architecture;

access control;

remediation planning;

sensitive logs;

critical infrastructure;

public communication;

customer impact.


AI JOKER-C2 must not generate offensive instructions.

Recommended security label:

This output is defensive security support only. Review before applying to real systems.


---

20. Oversight and Critical Infrastructure

In critical infrastructure contexts, human oversight is required by default.

AI JOKER-C2 may support:

documentation;

continuity planning;

escalation templates;

incident reporting;

audit checklists;

evidence organization.


AI JOKER-C2 must not control infrastructure assets.

Recommended critical infrastructure label:

This output is documentation support only. It must not be used as direct operational control.


---

21. Oversight Checklist

Before relying on AI-assisted output, review:

Is the use case defined?
Is the responsible human role defined?
Is the domain sensitive?
Is the risk class known?
Is the output advisory or operational?
Could the output affect rights, services, systems or safety?
Is human review required?
Has review been completed?
Is the review outcome recorded?
Is EVT traceability required?
Is the output safe to use?
Is legal, security or compliance review required?


---

22. Runtime Oversight Checklist

Before executing a sensitive operation, the runtime should check:

Is identity defined?
Is context classified?
Is policy applicable?
Is risk classified?
Is human oversight required?
Is the required reviewer role known?
Is the operation allowed before review?
Should the output be degraded?
Should the request be escalated?
Should the request be blocked?
Should an EVT be generated?
Can verification be preserved?


---

23. Oversight Anti-Patterns

The following patterns must be avoided:

treating AI output as final authority;

hiding that output was AI-assisted where disclosure is required;

skipping review for high-impact use;

using AI to fabricate evidence;

using AI to justify decisions after the fact;

relying on AI for legal, medical, financial or public authority decisions without review;

using generic disclaimers instead of real oversight;

allowing unknown risk to proceed as low risk;

removing audit status from sensitive workflows;

using human oversight as a decorative checkbox.


Human oversight must be functional.

Not theatrical.


---

24. Non-Replacement Rule

AI JOKER-C2 does not replace:

legal professionals;

medical professionals;

financial professionals;

cybersecurity operators;

public authorities;

procurement officials;

auditors;

incident commanders;

infrastructure operators;

compliance officers;

data protection officers;

responsible organizational leadership.


The runtime assists.

The responsible human or organization decides.


---

25. Oversight Maturity Levels

Level	Description

O0	No oversight model defined
O1	Oversight states documented
O2	Oversight states included in runtime decisions
O3	Oversight states included in EVT records
O4	Review outcomes recorded
O5	Role-based review workflow implemented
O6	Audit and verification connected to oversight
O7	Oversight dashboard available
O8	External review and deployment controls integrated


AI JOKER-C2 should move from documentation toward executable oversight.


---

26. Implementation Targets

Suggested modules:

lib/human-oversight.ts
lib/runtime-decision.ts
lib/risk-engine.ts
lib/policy-engine.ts
lib/evt.ts

Suggested types:

OversightState
OversightRequirement
ReviewOutcome
ReviewerRole
RuntimeDecision
RiskClass

Suggested API or UI additions:

oversight_state
review_required
review_reason
reviewer_role
review_status
audit_status

Oversight should become part of runtime logic, not only documentation.


---

27. Minimal Type Model

Suggested TypeScript model:

export type OversightState =
  | "NOT_REQUIRED"
  | "RECOMMENDED"
  | "REQUIRED"
  | "COMPLETED"
  | "REJECTED"
  | "ESCALATED"
  | "BLOCKED"
  | "UNKNOWN";

export type ReviewOutcome =
  | "APPROVED"
  | "APPROVED_WITH_LIMITATIONS"
  | "REJECTED"
  | "NEEDS_REVISION"
  | "ESCALATED"
  | "INFORMATION_INSUFFICIENT"
  | "OUT_OF_SCOPE";

export type ReviewerRole =
  | "OPERATOR"
  | "REVIEWER"
  | "APPROVER"
  | "AUDITOR"
  | "MAINTAINER"
  | "SECURITY_OFFICER"
  | "LEGAL_REVIEWER"
  | "DATA_PROTECTION_REVIEWER"
  | "INSTITUTIONAL_AUTHORITY"
  | "INCIDENT_COMMANDER";

This model can be expanded during runtime implementation.


---

28. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

This human oversight model does not create legal, regulatory, medical, financial, cybersecurity or institutional certification.

Any real-world deployment requires proper review by authorized professionals and responsible organizations.

Human oversight must be adapted to the deployment context.


---

29. Final Human Oversight Formula

AI assistance without human oversight can become operational opacity.
AI assistance with identity, policy, risk, review, EVT and verification becomes accountable support.

Operational formula:

Human Oversight =
Risk Classification + Review Requirement + Responsible Role + Review Outcome + EVT + Auditability


---

30. Status

Document status: active human oversight model
Project: AI JOKER-C2
Framework: MATRIX
Infrastructure: HBCE
Identity layer: IPR
Trace layer: EVT
Governance principle: fail-closed
Security boundary: defensive and non-offensive
Business orientation: B2B, B2G, institutional, AI governance and critical infrastructure
Repository: hbce-ai-joker-c2
Maintainer: HBCE Research
Organization: HERMETICUM B.C.E. S.r.l.
Territorial anchor: Torino, Italy, Europe
Year: 2026

