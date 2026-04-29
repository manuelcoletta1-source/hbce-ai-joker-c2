# AI JOKER-C2 Compliance Mapping

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document maps AI JOKER-C2 runtime components to compliance-oriented governance needs.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

This document does not claim legal certification.

It provides a structured mapping between the runtime architecture and the compliance concerns typically relevant to:

- AI governance;
- cybersecurity governance;
- data handling;
- auditability;
- human oversight;
- operational accountability;
- critical infrastructure resilience;
- dual-use risk control;
- fail-closed runtime behavior.

The goal is to show how AI JOKER-C2 can support compliance-oriented workflows through technical architecture.

---

## 2. Compliance Position

AI JOKER-C2 is not a certified compliance product.

It is a governance-oriented architecture and operational prototype.

The repository supports compliance preparation by making AI-assisted operations:

- identity-bound;
- policy-aware;
- risk-classified;
- decision-controlled;
- event-traceable;
- reviewable;
- auditable;
- verifiable;
- fail-closed by design.

Any real-world deployment in regulated environments requires legal, cybersecurity, data protection and operational review.

---

## 3. Canonical Mapping Formula

```txt
Compliance Mapping =
Identity + Authority + Policy + Risk + Human Oversight + Decision + EVT + Ledger + Verification + Audit

Operational sequence:

Identity -> Context -> Policy -> Risk -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity

Within the MATRIX and HBCE architecture:

MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = event trace layer
Ledger = continuity layer
Fail-closed = safety boundary

Compliance is not treated as a label.

Compliance is treated as a reconstructable operational sequence.


---

4. Mapping Overview

Compliance Need	AI JOKER-C2 Component	Function

Accountability	IPR identity layer	Binds operations to runtime identity
Traceability	EVT protocol	Records relevant operational events
Auditability	Ledger and verification layer	Supports reconstruction and review
Risk management	Risk classifier	Classifies operational sensitivity
Policy control	Policy engine	Applies project and organizational boundaries
Human oversight	Oversight state	Preserves human review requirements
Security governance	Defensive security boundary	Prevents offensive or abusive use
Data minimization	File and data handling rules	Reduces unnecessary exposure
Incident review	EVT and correction events	Supports post-event reconstruction
Continuity	Previous event reference	Links operations over time
Fail-closed behavior	Runtime safety boundary	Blocks, degrades or escalates uncertainty
Dual-use control	Strategic boundary	Limits use to lawful civil and defensive contexts



---

5. AI Governance Mapping

AI Governance Requirement	AI JOKER-C2 Support

Define AI system scope	README, ARCHITECTURE, GOVERNANCE
Identify operational context	Context classification
Classify risk	Risk classes: LOW, MEDIUM, HIGH, CRITICAL, PROHIBITED, UNKNOWN
Apply usage policy	Policy engine and prohibited-use matrix
Preserve human oversight	Oversight states: NOT_REQUIRED, RECOMMENDED, REQUIRED, COMPLETED, REJECTED, ESCALATED
Track AI-assisted activity	EVT event records
Preserve audit trail	Ledger and verification logic
Prevent unsafe execution	Fail-closed behavior
Distinguish advisory from authoritative output	Human accountability model
Review high-impact outputs	ESCALATE, AUDIT and DEGRADE decisions


AI JOKER-C2 supports AI governance by treating model output as operational material that must be classified, bounded and reviewed where necessary.


---

6. Cybersecurity Governance Mapping

Cybersecurity Governance Need	AI JOKER-C2 Support

Defensive-only boundary	SECURITY.md and DEFENSIVE_SECURITY_USE_CASES.md
Secure development	Contribution and security review checklists
Secret protection	Environment variable and secrets policy
Safe API behavior	API protocol and validation requirements
File handling security	Controlled file processing model
Incident documentation	Incident report templates and EVT traceability
Vulnerability remediation planning	Defensive remediation workflows
Logging safety	Logging policy and sensitive data restrictions
Dependency hygiene	npm audit and dependency review guidance
Security event reconstruction	EVT, ledger and verification layers
Fail-safe behavior	Fail-closed security principle


AI JOKER-C2 supports defensive cybersecurity governance.

It does not support offensive cyber capability.


---

7. Data Handling Mapping

Data Handling Need	AI JOKER-C2 Support

Data minimization	Process only necessary content
Sensitive data control	Classify data as PUBLIC, INTERNAL, CONFIDENTIAL, SECRET, PERSONAL, UNKNOWN
Secret protection	Do not process credentials, tokens or private keys as ordinary content
Safe file processing	Do not execute uploaded files
Incomplete visibility disclosure	State when file reading is partial or unsupported
Payload reduction	Prefer summaries, references and hashes
Public and internal separation	Separate public-safe EVT from internal EVT
Logging protection	Avoid logging full sensitive payloads
User control	Treat uploaded files as user-controlled context
Review before regulated use	Require legal and data protection review where applicable


Data handling is treated as a governance layer, not a mere technical detail.


---

8. Human Oversight Mapping

Oversight Need	AI JOKER-C2 Support

Identify when review is needed	Risk and context classification
Preserve human responsibility	Human accountability model
Escalate high-impact operations	ESCALATE decision
Mark advisory outputs	Model output governance
Prevent final authority claims	Non-replacement rule
Record review requirement	Human oversight state in EVT
Support audit of review	Audit status and verification status
Reject unsafe operations	BLOCK decision
Limit uncertain sensitive output	DEGRADE decision
Preserve institutional accountability	B2G and institutional use case model


AI JOKER-C2 supports human review.

It must not replace responsible human authority.


---

9. Risk Management Mapping

Risk Management Need	AI JOKER-C2 Support

Identify risk level	Runtime risk classes
Define default handling	ALLOW, AUDIT, ESCALATE, DEGRADE, BLOCK
Treat unknown risk conservatively	UNKNOWN defaults to ESCALATE or BLOCK
Separate ordinary and sensitive requests	Context and intent classification
Identify prohibited use	Prohibited-use matrix
Reduce unsafe output	DEGRADE and safe redirection
Require review for high-impact domains	Human oversight model
Preserve decision rationale	Governance metadata in EVT
Support review after operation	Ledger and verification
Prevent silent unsafe execution	Fail-closed behavior


Risk management occurs before sensitive execution.

It is not added after the output is produced.


---

10. Auditability Mapping

Audit Need	AI JOKER-C2 Support

Event identification	EVT identifier
Event continuity	Previous event reference
Time reference	Timestamp
Responsible runtime	Entity and IPR fields
Context reconstruction	Context class and domain
Risk review	Risk class
Decision review	Governance decision
Execution status	Operation status
Integrity reference	Hash and canonicalization
Verification	Verification status
Audit review	Audit status
Correction handling	Correction events instead of silent rewrite


Auditability means that a reviewer can reconstruct what happened, under which identity, at which time, with which decision and with which verification state.


---

11. EVT Mapping

EVT Field	Compliance Function

evt	Unique event identifier
prev	Operational continuity
entity	Runtime attribution
ipr	Identity binding
timestamp	Time reference
runtime	Runtime state reconstruction
context	Operational domain classification
governance	Risk, policy and decision metadata
operation	Operation type and status
trace	Hash and canonicalization
verification	Verification and audit status
correction reference	Review and correction without erasure


EVT is the compliance bridge between AI-assisted output and operational reconstruction.


---

12. Ledger Mapping

Ledger Requirement	AI JOKER-C2 Support

Preserve sequence	Append-only event model
Avoid silent mutation	Correction events
Support verification	Hash and canonical payload
Support audit review	Audit status
Support internal review	Internal EVT mode
Support public-safe disclosure	Public EVT mode
Preserve continuity	Previous event reference
Reduce sensitive exposure	References and hashes
Support evidence export	Future evidence pack model
Support institutional review	Verification endpoint and audit checklist


The ledger is not a surveillance system.

It is a continuity and reconstruction layer.


---

13. Fail-Closed Mapping

Fail-Closed Trigger	Runtime Response

Missing identity	BLOCK or ESCALATE
Unclear authority	ESCALATE
Unknown risk	ESCALATE or BLOCK
Missing policy	ESCALATE or BLOCK
Prohibited request	BLOCK
Offensive cyber interpretation	BLOCK or DEGRADE
Sensitive data exposure	DEGRADE, ESCALATE or BLOCK
Human review required but absent	ESCALATE
EVT cannot be generated where required	AUDIT_ONLY, DEGRADE or BLOCK
Continuity cannot be preserved	DEGRADE or ESCALATE
Runtime state invalid	BLOCK
Model unavailable	DEGRADED mode


Fail-closed behavior prevents uncertainty from becoming unauthorized execution.


---

14. Dual-Use Governance Mapping

Dual-Use Concern	AI JOKER-C2 Control

Civil and strategic use	DUAL_USE_STRATEGIC_POSITIONING.md
Offensive cyber risk	SECURITY.md and defensive boundary
Unauthorized surveillance	Prohibited-use matrix
Critical infrastructure sensitivity	CRITICAL_INFRASTRUCTURE_USE_CASES.md
Institutional accountability	B2G overview and institutional use cases
Human rights risk	Prohibited use boundary
Auditability	EVT and ledger
Escalation	Decision layer
Controlled deployment	Roadmap and compliance orientation
Non-certification clarity	COMPLIANCE.md


Dual-use does not mean unrestricted use.

It means controlled, lawful, accountable and reviewable strategic application.


---

15. Critical Infrastructure Mapping

Critical Infrastructure Need	AI JOKER-C2 Support

Continuity planning	Documentation and resilience templates
Incident review	Incident report and EVT model
Human authority	Oversight and escalation states
Conservative risk handling	HIGH or CRITICAL default where applicable
Non-operational control boundary	No direct infrastructure control
Cybersecurity defense	Defensive-only security use cases
Evidence preservation	EVT and ledger model
Data minimization	Sensitive operational data handling
Public communication review	Human review required
Audit preparation	Verification and audit status


AI JOKER-C2 supports governance around critical infrastructure.

It does not control infrastructure assets.


---

16. Public-Sector Mapping

Public-Sector Need	AI JOKER-C2 Support

Administrative traceability	EVT and audit state
Human authority	Oversight states and non-replacement rule
Document support	Institutional document workflows
Public communication review	Review-required output
Procurement support	Neutral document analysis under human authority
Audit office support	Reconstruction and evidence checklist
Digital transformation	Governed AI adoption model
Cybersecurity resilience	Defensive documentation and risk mapping
Critical services continuity	Continuity planning and escalation templates
Non-certification clarity	Compliance disclaimer


Public-sector use must preserve institutional authority and human responsibility.


---

17. B2B Mapping

Business Need	AI JOKER-C2 Support

Controlled AI adoption	Governance runtime model
Documentation automation	GitHub and technical documentation workflows
Security posture	Defensive security policy and review
Audit readiness	EVT, ledger and verification
Compliance preparation	Risk registers and checklists
Enterprise integration	Roadmap and API model
Human accountability	Oversight states
Operational continuity	Previous event reference and ledger
Risk control	Risk classification and decision layer
Strategic differentiation	MATRIX and HBCE framework


AI JOKER-C2 helps companies use AI without losing operational control.


---

18. Repository File Mapping

File	Compliance Function

README.md	Public project definition
ARCHITECTURE.md	Runtime structure and architectural invariants
GOVERNANCE.md	Runtime governance model
PROTOCOL.md	Operational sequence
EVT_PROTOCOL.md	Event trace structure
SECURITY.md	Defensive security policy
COMPLIANCE.md	Compliance orientation and non-certification boundary
DUAL_USE_STRATEGIC_POSITIONING.md	Dual-use civil and strategic boundary
ROADMAP.md	Development phases and maturity path
CONTRIBUTING.md	Contribution rules and review boundary
docs/B2B_OVERVIEW.md	Enterprise positioning
docs/B2G_OVERVIEW.md	Public-sector positioning
docs/INSTITUTIONAL_USE_CASES.md	Institutional use cases
docs/CRITICAL_INFRASTRUCTURE_USE_CASES.md	Critical infrastructure use cases
docs/AI_GOVERNANCE_USE_CASES.md	AI governance workflows
docs/DEFENSIVE_SECURITY_USE_CASES.md	Defensive security workflows
docs/COMPLIANCE_MAPPING.md	Runtime to compliance mapping


This file acts as the index of governance relevance across the documentation layer.


---

19. Runtime Component Mapping

Runtime Component	Compliance Role

Context classifier	Determines operational domain
Policy engine	Applies boundaries
Risk engine	Classifies sensitivity
Runtime decision object	Produces ALLOW, BLOCK, ESCALATE, DEGRADE or AUDIT
EVT generator	Creates event record
EVT hash module	Supports integrity
Ledger module	Preserves continuity
Verification endpoint	Supports inspection
Evidence pack module	Supports audit export
Dashboard	Supports review and visibility
File handler	Controls document processing
API layer	Enforces input and execution boundaries


These components should be developed in phases according to ROADMAP.md.


---

20. Compliance Artifact Mapping

Future artifacts may include:

Artifact	Function

AI_GOVERNANCE_MAPPING.md	AI governance control mapping
CYBERSECURITY_GOVERNANCE_MAPPING.md	Defensive security control mapping
HUMAN_OVERSIGHT_MODEL.md	Human review states and responsibilities
RISK_REGISTER_TEMPLATE.md	Risk documentation template
AUDIT_CHECKLIST.md	Review and verification checklist
INCIDENT_REPORT_TEMPLATE.md	Incident documentation support
DATA_HANDLING_MODEL.md	Data classification and processing rules
DUAL_USE_RISK_REGISTER.md	Dual-use sensitivity review
COMPLIANCE_DISCLAIMER.md	Non-certification and deployment boundary
EVIDENCE_PACK_MODEL.md	Exportable evidence structure


These artifacts support review.

They do not create automatic certification.


---

21. Compliance Gap Matrix

Current Capability	Status	Gap

Documentation baseline	Active	Must remain synchronized
Governance model	Defined	Needs runtime implementation
Risk classes	Defined	Needs executable classifier
Policy boundaries	Defined	Needs policy engine
EVT protocol	Defined	Needs generator and ledger
Ledger continuity	Designed	Needs implementation
Verification	Designed	Needs endpoint
Human oversight	Defined	Needs workflow support
Evidence packs	Planned	Needs signing and export logic
Dashboard	Planned	Needs UI implementation
Role-based access	Planned	Needed for serious deployment
External review	Not included	Required before regulated use


This gap matrix prevents documentation from being confused with production maturity.


---

22. Implementation Priority Mapping

Priority	Compliance Reason

Context classifier	Needed to understand operational domain
Policy engine	Needed to enforce boundaries
Risk engine	Needed for sensitive operations
Decision object	Needed for controlled runtime behavior
EVT generator	Needed for traceability
Append-only ledger	Needed for continuity
Verifier endpoint	Needed for auditability
Human oversight state	Needed for accountability
Data handling model	Needed for confidentiality and minimization
Dashboard	Needed for review and operational visibility


Implementation should move from documentation to executable governance.


---

23. Compliance Review Checklist

Before presenting AI JOKER-C2 as compliance-oriented, review:

Is the project scope clear?
Is the non-certification statement present?
Is the runtime identity defined?
Are policy boundaries documented?
Are risk classes documented?
Are governance decisions documented?
Are human oversight states documented?
Is EVT traceability documented?
Is ledger continuity documented?
Is verification documented?
Is the defensive security boundary clear?
Is the dual-use boundary clear?
Are prohibited uses documented?
Are data handling rules documented?
Are deployment limitations clear?
Are current gaps disclosed?


---

24. Deployment Review Checklist

Before any real deployment, review:

Has legal review been performed?
Has cybersecurity review been performed?
Has data protection review been performed?
Has operational risk assessment been performed?
Are authentication and authorization implemented?
Are secrets managed safely?
Are API routes validated?
Are logs safe?
Is file handling controlled?
Is human oversight implemented?
Is fail-closed behavior tested?
Is EVT generation implemented?
Is ledger integrity tested?
Is verification available?
Is incident response defined?
Is external review required?

Deployment without these controls should be considered experimental or prototype-level.


---

25. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

It is not a certified AI, cybersecurity, compliance, critical infrastructure or public-sector control system.

This mapping is intended to support:

review;

planning;

documentation;

governance design;

audit preparation;

implementation discussion.


It does not replace:

legal review;

cybersecurity review;

data protection review;

institutional authorization;

regulated compliance assessment;

external audit;

human accountability.



---

26. Final Compliance Mapping Formula

Compliance is not declared.
Compliance is reconstructed.

Expanded:

Identity -> Authority -> Policy -> Risk -> Human Oversight -> Decision -> EVT -> Ledger -> Verification -> Audit

Operational formula:

AI JOKER-C2 Compliance Mapping =
Governance Documentation + Runtime Controls + Event Traceability + Human Review + Verification + Fail-Closed Behavior


---

27. Status

Document status: active compliance mapping
Project: AI JOKER-C2
Framework: MATRIX
Infrastructure: HBCE
Identity layer: IPR
Trace layer: EVT
Governance principle: fail-closed
Security boundary: defensive and non-offensive
Business orientation: B2B, B2G, institutional, critical infrastructure and AI governance
Compliance status: orientation only, not certification
Repository: hbce-ai-joker-c2
Maintainer: HBCE Research
Organization: HERMETICUM B.C.E. S.r.l.
Territorial anchor: Torino, Italy, Europe
Year: 2026

