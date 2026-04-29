# AI JOKER-C2 Risk Register Template

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document provides a risk register template for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The purpose of this template is to help organizations identify, classify, review and document risks related to AI-assisted operations.

The risk register supports:

- AI governance;
- defensive security;
- public-sector accountability;
- B2B and B2G evaluation;
- critical infrastructure documentation;
- human oversight;
- EVT traceability;
- audit preparation;
- fail-closed runtime behavior.

This document is a template.

It does not create legal certification.

It does not replace legal, cybersecurity, compliance, operational or data protection review.

---

## 2. Risk Register Principle

The central principle is:

```txt
No sensitive AI-assisted operation without risk classification.

Expanded:

Identity -> Context -> Policy -> Risk -> Human Oversight -> Decision -> EVT -> Verification -> Audit

Risk classification must happen before sensitive execution.

Unknown risk must not be treated as permission.


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

The risk register connects operational risk to:

identity;

policy;

context;

decision;

human oversight;

event trace;

mitigation;

audit status.



---

4. Risk Register Fields

A complete risk register entry should include the following fields.

Field	Description

risk_id	Unique risk identifier
title	Short name of the risk
description	Clear explanation of the risk
domain	Operational domain affected
context_class	Runtime context class
risk_class	LOW, MEDIUM, HIGH, CRITICAL, PROHIBITED or UNKNOWN
probability	Estimated likelihood
impact	Estimated consequence
risk_score	Combined probability and impact score
policy_reference	Applicable policy or boundary
decision	ALLOW, BLOCK, ESCALATE, DEGRADE, AUDIT or NOOP
human_oversight	Oversight state
mitigation	Required risk reduction action
owner_role	Responsible role
evt_required	Whether an EVT record is required
verification_required	Whether verification is required
audit_status	Audit state
review_date	Date for review
status	OPEN, MITIGATED, ACCEPTED, ESCALATED, CLOSED or REJECTED



---

5. Risk Classes

AI JOKER-C2 uses the following risk classes.

Risk Class	Meaning	Default Handling

LOW	Ordinary safe operation	ALLOW
MEDIUM	Operationally relevant request	ALLOW or AUDIT
HIGH	Sensitive, strategic or high-impact request	AUDIT, ESCALATE or DEGRADE
CRITICAL	Strict review required	ESCALATE or BLOCK
PROHIBITED	Unsafe, abusive or outside scope	BLOCK
UNKNOWN	Cannot be safely classified	ESCALATE or BLOCK


Unknown sensitive risk must be handled conservatively.


---

6. Probability Scale

Suggested probability scale:

Score	Probability	Meaning

1	Rare	Unlikely under normal conditions
2	Unlikely	Possible but not expected
3	Possible	Could occur in realistic conditions
4	Likely	Expected in some workflows
5	Almost certain	Expected unless actively controlled


Probability should be based on available evidence, not speculation alone.


---

7. Impact Scale

Suggested impact scale:

Score	Impact	Meaning

1	Minimal	Limited operational effect
2	Minor	Manageable issue with limited consequences
3	Moderate	Meaningful operational, legal, security or reputational effect
4	Major	Serious effect on systems, users, organization or institution
5	Severe	Critical effect on rights, safety, infrastructure, security or public trust


Impact should consider technical, legal, institutional, operational and human consequences.


---

8. Risk Score

Suggested risk score:

risk_score = probability x impact

Score Range	Risk Level	Suggested Handling

1 to 4	LOW	Allow or monitor
5 to 9	MEDIUM	Audit or mitigate
10 to 16	HIGH	Escalate, mitigate or degrade
17 to 25	CRITICAL	Escalate, block or require formal review
Prohibited	PROHIBITED	Block


The score does not override policy.

A low numeric score cannot authorize a prohibited operation.


---

9. Governance Decisions

Each risk entry should include a runtime decision.

Decision	Meaning

ALLOW	Operation may proceed
BLOCK	Operation is prohibited, unsafe or outside scope
ESCALATE	Human authority or higher review required
DEGRADE	Limited safe support only
AUDIT	Operation should be recorded or reviewed
NOOP	No operational action taken


The decision should reflect the risk, policy and oversight requirements.


---

10. Human Oversight States

Each risk entry should include a human oversight state.

State	Meaning

NOT_REQUIRED	Ordinary low-risk support
RECOMMENDED	Human review useful
REQUIRED	Human review required before operational use
COMPLETED	Human review completed
REJECTED	Human review rejected the operation
ESCALATED	Higher authority required
BLOCKED	Operation is prohibited
UNKNOWN	Oversight requirement cannot be safely determined


Human oversight should be required for high-impact, critical, institutional, legal, security, public-sector and critical infrastructure contexts.


---

11. Audit Status

Suggested audit status values:

Status	Meaning

NOT_REQUIRED	Audit not required
READY	Ready for audit
REQUIRED	Audit required before continuation
IN_REVIEW	Audit review in progress
REVIEWED	Audit review completed
DISPUTED	Event or risk is contested
REJECTED	Risk handling not accepted
CLOSED	Risk entry closed


Audit status should be explicit when the risk relates to governance, security, compliance or institutional use.


---

12. Risk Register Template Table

Use the following table as the baseline template.

risk_id	title	domain	context_class	risk_class	probability	impact	risk_score	decision	human_oversight	evt_required	audit_status	status

RISK-0001	Example risk	AI Governance	AI_GOVERNANCE	MEDIUM	3	3	9	AUDIT	RECOMMENDED	true	READY	OPEN



---

13. Full Risk Register Entry Template

{
  "risk_id": "RISK-0001",
  "title": "Unreviewed AI-assisted output used in sensitive workflow",
  "description": "AI-assisted output may be used operationally without human review in a sensitive context.",
  "domain": "AI Governance",
  "context_class": "AI_GOVERNANCE",
  "risk_class": "HIGH",
  "probability": 3,
  "impact": 4,
  "risk_score": 12,
  "policy_reference": "HUMAN_OVERSIGHT_MODEL",
  "decision": "ESCALATE",
  "human_oversight": "REQUIRED",
  "mitigation": "Require human review before operational use and record oversight state in EVT.",
  "owner_role": "REVIEWER",
  "evt_required": true,
  "verification_required": true,
  "audit_status": "REQUIRED",
  "review_date": "2026-05-19",
  "status": "OPEN"
}


---

14. Domain Categories

Suggested risk domains:

Domain	Description

AI Governance	AI operation control, review and audit
Cybersecurity	Defensive security, incident handling and hardening
Data Handling	Personal, sensitive, confidential or secret data
Public Sector	Administrative, institutional or public-service workflows
Critical Infrastructure	Energy, telecom, cloud, transport, health or utility contexts
Compliance	Audit, review, governance and regulatory preparation
Repository Security	GitHub, code, dependencies and deployment hygiene
Model Output	Accuracy, hallucination, unsafe output or overreliance
Human Oversight	Review, approval, escalation and responsibility
Dual-Use	Civil and strategic uses with misuse potential



---

15. Context Classes

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
CRITICAL_INFRASTRUCTURE	High-impact infrastructure support
AI_GOVERNANCE	AI policy, risk, oversight and audit
GENERAL	Ordinary safe requests



---

16. Common AI Governance Risks

risk_id	Risk	Default Risk Class	Default Decision

RISK-AI-001	AI output used without review	HIGH	ESCALATE
RISK-AI-002	Unknown risk treated as low risk	HIGH	BLOCK or ESCALATE
RISK-AI-003	Model output treated as final authority	HIGH	ESCALATE
RISK-AI-004	Missing human oversight state	MEDIUM	AUDIT
RISK-AI-005	Missing EVT for sensitive operation	HIGH	AUDIT or ESCALATE
RISK-AI-006	Fabricated compliance claim	PROHIBITED	BLOCK
RISK-AI-007	Policy boundary bypass	HIGH	ESCALATE
RISK-AI-008	Failure to distinguish draft from final output	MEDIUM	AUDIT



---

17. Common Cybersecurity Risks

risk_id	Risk	Default Risk Class	Default Decision

RISK-SEC-001	Request may enable offensive cyber activity	PROHIBITED	BLOCK
RISK-SEC-002	Secrets exposed in prompt or logs	CRITICAL	BLOCK or ESCALATE
RISK-SEC-003	Incident report contains sensitive infrastructure details	HIGH	AUDIT or ESCALATE
RISK-SEC-004	Vulnerability remediation request includes exploit details	HIGH	DEGRADE or ESCALATE
RISK-SEC-005	Unauthorized target activity	PROHIBITED	BLOCK
RISK-SEC-006	Unsafe file upload or unsupported file type	HIGH	BLOCK or DEGRADE
RISK-SEC-007	Dependency risk not reviewed	MEDIUM	AUDIT
RISK-SEC-008	Error logs expose sensitive data	HIGH	ESCALATE



---

18. Common Data Handling Risks

risk_id	Risk	Default Risk Class	Default Decision

RISK-DATA-001	Personal data processed without need	HIGH	ESCALATE
RISK-DATA-002	Confidential content exposed in public output	HIGH	BLOCK or DEGRADE
RISK-DATA-003	Secret or credential submitted as content	CRITICAL	BLOCK
RISK-DATA-004	Sensitive file logged unnecessarily	HIGH	ESCALATE
RISK-DATA-005	Unsupported file treated as verified	MEDIUM	AUDIT
RISK-DATA-006	Incomplete file visibility not disclosed	MEDIUM	AUDIT
RISK-DATA-007	Public and internal EVT views not separated	HIGH	ESCALATE
RISK-DATA-008	Large sensitive payload stored instead of reference	HIGH	DEGRADE or ESCALATE



---

19. Common Public-Sector Risks

risk_id	Risk	Default Risk Class	Default Decision

RISK-GOV-001	Public communication published without review	HIGH	ESCALATE
RISK-GOV-002	Procurement support becomes final decision	HIGH	ESCALATE
RISK-GOV-003	AI output affects public services without authority	CRITICAL	BLOCK or ESCALATE
RISK-GOV-004	Institutional responsibility unclear	HIGH	ESCALATE
RISK-GOV-005	Public-sector data handled without classification	HIGH	ESCALATE
RISK-GOV-006	Audit trail missing for sensitive operation	HIGH	AUDIT or ESCALATE
RISK-GOV-007	Hidden scoring or profiling	PROHIBITED	BLOCK
RISK-GOV-008	Human review bypassed	HIGH	ESCALATE



---

20. Common Critical Infrastructure Risks

risk_id	Risk	Default Risk Class	Default Decision

RISK-CI-001	AI used for direct infrastructure control	PROHIBITED	BLOCK
RISK-CI-002	Operational recommendation without authorized review	CRITICAL	ESCALATE
RISK-CI-003	Sensitive topology exposed	HIGH	DEGRADE or ESCALATE
RISK-CI-004	Incident documentation lacks evidence references	HIGH	AUDIT
RISK-CI-005	Continuity plan used without operational validation	HIGH	ESCALATE
RISK-CI-006	Human authority unclear	HIGH	ESCALATE
RISK-CI-007	Security-sensitive infrastructure request	HIGH	AUDIT or ESCALATE
RISK-CI-008	Unknown risk in critical context	CRITICAL	BLOCK or ESCALATE



---

21. Common Repository Risks

risk_id	Risk	Default Risk Class	Default Decision

RISK-REPO-001	Secret committed to repository	CRITICAL	BLOCK or ESCALATE
RISK-REPO-002	Unsafe dependency added	MEDIUM	AUDIT
RISK-REPO-003	Governance document removed or contradicted	HIGH	ESCALATE
RISK-REPO-004	Fail-closed logic weakened	HIGH	ESCALATE
RISK-REPO-005	Offensive functionality introduced	PROHIBITED	BLOCK
RISK-REPO-006	EVT compatibility removed	HIGH	ESCALATE
RISK-REPO-007	API route exposes internal metadata	HIGH	AUDIT or ESCALATE
RISK-REPO-008	File upload validation missing	HIGH	ESCALATE



---

22. Risk Mitigation Actions

Suggested mitigation actions:

Mitigation	Description

HUMAN_REVIEW	Require human review before use
ESCALATION	Escalate to higher authority or specialist
DEGRADATION	Provide limited safe output only
BLOCKING	Refuse or prevent operation
DATA_MINIMIZATION	Reduce or remove sensitive data
REDACTION	Remove sensitive content from output
EVT_RECORD	Generate event trace
AUDIT_REVIEW	Require audit review
POLICY_UPDATE	Update policy or governance document
SECURITY_REVIEW	Require technical security review
LEGAL_REVIEW	Require legal review
DPO_REVIEW	Require data protection review
VERIFICATION	Require verification before use
TESTING	Require technical testing before deployment
DOCUMENTATION	Add documentation or usage boundary



---

23. Risk Status Values

Status	Meaning

OPEN	Risk identified and not yet resolved
MITIGATED	Mitigation applied
ACCEPTED	Risk accepted by responsible authority
ESCALATED	Risk sent to higher authority
REJECTED	Risk handling rejected
CLOSED	Risk closed after review
SUPERSEDED	Replaced by a later risk entry
MONITORING	Risk remains under observation


Risk closure should not erase the original risk entry.

Corrections and updates should preserve traceability.


---

24. Example Risk Register

risk_id	title	domain	context_class	risk_class	probability	impact	risk_score	decision	human_oversight	mitigation	evt_required	audit_status	status

RISK-AI-001	AI output used without review	AI Governance	AI_GOVERNANCE	HIGH	3	4	12	ESCALATE	REQUIRED	HUMAN_REVIEW	true	REQUIRED	OPEN
RISK-SEC-002	Secrets exposed in prompt	Cybersecurity	SECURITY	CRITICAL	2	5	10	BLOCK	ESCALATED	REDACTION, SECURITY_REVIEW	true	REQUIRED	OPEN
RISK-DATA-006	Incomplete file visibility not disclosed	Data Handling	DOCUMENTAL	MEDIUM	3	3	9	AUDIT	RECOMMENDED	DOCUMENTATION	true	READY	OPEN
RISK-CI-008	Unknown risk in critical context	Critical Infrastructure	CRITICAL_INFRASTRUCTURE	CRITICAL	3	5	15	ESCALATE	REQUIRED	ESCALATION	true	REQUIRED	OPEN
RISK-REPO-004	Fail-closed logic weakened	Repository Security	GITHUB	HIGH	2	5	10	ESCALATE	REQUIRED	SECURITY_REVIEW	true	REQUIRED	OPEN



---

25. EVT Linkage

Each significant risk should be linkable to an EVT record.

Example:

{
  "risk_id": "RISK-AI-001",
  "evt": "EVT-20260429-230000-0001",
  "prev": "EVT-20260429-225900-0000",
  "risk_class": "HIGH",
  "decision": "ESCALATE",
  "human_oversight": "REQUIRED",
  "audit_status": "REQUIRED"
}

EVT linkage supports reconstruction.

A risk without traceability may be difficult to audit.


---

26. Risk Review Workflow

Recommended workflow:

Identify risk
Classify domain
Assign context class
Estimate probability
Estimate impact
Calculate risk score
Assign risk class
Apply policy
Determine human oversight
Select runtime decision
Define mitigation
Assign owner role
Generate or link EVT
Set audit status
Schedule review
Update status

Risk review should be iterative.

Risk entries may evolve, but historical records should not be silently erased.


---

27. Risk Register Checklist

Before closing a risk entry, review:

Is the risk clearly described?
Is the domain defined?
Is the context class defined?
Is the risk class assigned?
Are probability and impact estimated?
Is the decision clear?
Is human oversight defined?
Is mitigation documented?
Is the responsible role assigned?
Is EVT linkage required?
Is verification required?
Is audit status clear?
Is review date defined?
Is closure justified?


---

28. Deployment Risk Checklist

Before deploying AI JOKER-C2 in any serious environment, review:

Are authentication and authorization implemented?
Are secrets protected?
Are API routes validated?
Is file handling controlled?
Is risk classification implemented?
Is policy evaluation implemented?
Is human oversight implemented?
Is fail-closed behavior implemented?
Is EVT generation implemented?
Is ledger continuity implemented?
Is verification available?
Are logs safe?
Are prohibited uses blocked?
Is legal review required?
Is cybersecurity review required?
Is data protection review required?
Is operational review required?


---

29. Risk Register Maturity Levels

Level	Description

R0	No risk register exists
R1	Risk template documented
R2	Common risk categories documented
R3	Risk entries linked to governance decisions
R4	Risk entries linked to EVT records
R5	Mitigations and owner roles tracked
R6	Review workflow implemented
R7	Risk register connected to dashboard
R8	Risk register reviewed by external stakeholders


AI JOKER-C2 should move from documentation to executable risk governance.


---

30. Implementation Targets

Suggested files:

lib/risk-engine.ts
lib/risk-register.ts
lib/runtime-decision.ts
lib/human-oversight.ts
lib/evt.ts
docs/RISK_REGISTER_TEMPLATE.md

Suggested future fields:

risk_id
domain
context_class
risk_class
probability
impact
risk_score
decision
human_oversight
mitigation
owner_role
evt_required
verification_required
audit_status
status

Suggested future route:

app/api/risk/route.ts


---

31. Minimal Type Model

Suggested TypeScript model:

export type RiskClass =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "PROHIBITED"
  | "UNKNOWN";

export type RiskStatus =
  | "OPEN"
  | "MITIGATED"
  | "ACCEPTED"
  | "ESCALATED"
  | "REJECTED"
  | "CLOSED"
  | "SUPERSEDED"
  | "MONITORING";

export type RiskDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE"
  | "DEGRADE"
  | "AUDIT"
  | "NOOP";

export type RiskRegisterEntry = {
  risk_id: string;
  title: string;
  description: string;
  domain: string;
  context_class: string;
  risk_class: RiskClass;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  risk_score: number;
  policy_reference: string;
  decision: RiskDecision;
  human_oversight: string;
  mitigation: string;
  owner_role: string;
  evt_required: boolean;
  verification_required: boolean;
  audit_status: string;
  review_date?: string;
  status: RiskStatus;
};

This type model can be refined during implementation.


---

32. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

This risk register template does not create legal, regulatory, cybersecurity, public-sector, financial, medical or critical infrastructure certification.

Any real-world deployment requires review by authorized professionals and responsible organizations.

Risk classification must be adapted to the deployment context.


---

33. Final Risk Register Formula

Risk without classification becomes opacity.
Risk with identity, policy, oversight, EVT and verification becomes governable.

Operational formula:

Risk Governance =
Domain + Context + Probability + Impact + Decision + Oversight + Mitigation + EVT + Audit


---

34. Status

Document status: active risk register template
Project: AI JOKER-C2
Framework: MATRIX
Infrastructure: HBCE
Identity layer: IPR
Trace layer: EVT
Governance principle: fail-closed
Security boundary: defensive and non-offensive
Business orientation: B2B, B2G, institutional, AI governance, defensive security and critical infrastructure
Repository: hbce-ai-joker-c2
Maintainer: HBCE Research
Organization: HERMETICUM B.C.E. S.r.l.
Territorial anchor: Torino, Italy, Europe
Year: 2026

