# AI JOKER-C2 Release Governance

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the release governance model for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The purpose of release governance is to define when a repository state, runtime version, documentation package or deployed instance may be considered ready for review, demonstration, pilot use or controlled release.

A release must not be declared only because code exists.

A release must be evaluated through:

- documentation readiness;
- build status;
- security review;
- data handling review;
- governance consistency;
- risk classification;
- human oversight readiness;
- EVT readiness;
- audit readiness;
- deployment limitations;
- non-offensive boundary;
- compliance disclaimer.

This document does not create legal, regulatory, cybersecurity or institutional certification.

---

## 2. Core Release Principle

The core principle is:

```txt
No release without governance.

Expanded:

A version is not release-ready unless identity, policy, risk, oversight, traceability, security and limitations are clear.

Operational formula:

Release Governance =
Documentation + Build + Security + Risk + Oversight + EVT + Audit + Disclaimer + Human Review

Within AI JOKER-C2:

MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = event trace layer
Ledger = continuity layer
Fail-closed = safety boundary


---

3. Release Types

AI JOKER-C2 may use the following release types.

Release Type	Meaning

DOCUMENTATION_BASELINE	Documentation package completed or updated
PROTOTYPE_RELEASE	Working experimental runtime with known limitations
GOVERNANCE_RELEASE	Governance, policy, risk and oversight files aligned
SECURITY_REVIEW_RELEASE	Security boundary and defensive-use files reviewed
EVT_READINESS_RELEASE	EVT protocol and event-chain design ready for implementation
INTERNAL_REVIEW_RELEASE	Suitable for internal review only
PUBLIC_DEMO_RELEASE	Suitable for public demonstration with limitations
PILOT_CANDIDATE	Candidate for controlled pilot review
RELEASE_CANDIDATE	Candidate for broader technical review
PRODUCTION_CANDIDATE	Requires full external review before real production use


A release type must be explicit.

Do not present a documentation baseline as a production system.


---

4. Release Status Values

Suggested release statuses:

Status	Meaning

DRAFT	Release material is being prepared
READY_FOR_REVIEW	Release is ready for human review
UNDER_REVIEW	Review is in progress
APPROVED_WITH_LIMITATIONS	Approved only within defined scope
APPROVED	Approved for the stated release type
REJECTED	Release is not accepted
BLOCKED	Release cannot proceed until blocking issues are resolved
SUPERSEDED	Release was replaced by a newer release
ARCHIVED	Release retained for historical record


Release status must not hide limitations.

If a release is partial, say partial.


---

5. Release Readiness Levels

Level	Name	Description

R0	Unstructured	No release model exists
R1	Documentation baseline	Core documents exist
R2	Governance baseline	Governance, risk and policy are documented
R3	Security baseline	Security boundary and non-offensive use are documented
R4	EVT baseline	EVT, ledger and verification model are documented
R5	Runtime prototype	Runtime exists and builds
R6	Governed prototype	Runtime includes policy, risk and decision logic
R7	Traceable prototype	Runtime generates EVT and ledger records
R8	Audit-ready prototype	Verification, audit and evidence pack model implemented
R9	Controlled pilot candidate	External review, access control and deployment controls required


AI JOKER-C2 should advance through these levels without skipping governance gates.


---

6. Release Gate Overview

A release should pass the following gates.

Gate	Purpose

Documentation Gate	Confirms documentation exists and is aligned
Build Gate	Confirms the project builds successfully
Security Gate	Confirms secrets, API routes and security boundaries are reviewed
Governance Gate	Confirms policy, risk and decision model are consistent
Human Oversight Gate	Confirms review requirements are defined
EVT Gate	Confirms event traceability is defined or implemented
Data Handling Gate	Confirms data minimization and classification are addressed
Dual-Use Gate	Confirms non-offensive civil and strategic boundary
Compliance Disclaimer Gate	Confirms no false compliance or certification claim
Deployment Gate	Confirms runtime limitations and deployment controls


A release that fails a blocking gate must not be promoted.


---

7. Documentation Gate

Required core files:

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

Required documentation files:

docs/B2B_OVERVIEW.md
docs/B2G_OVERVIEW.md
docs/INSTITUTIONAL_USE_CASES.md
docs/CRITICAL_INFRASTRUCTURE_USE_CASES.md
docs/AI_GOVERNANCE_USE_CASES.md
docs/DEFENSIVE_SECURITY_USE_CASES.md
docs/COMPLIANCE_MAPPING.md
docs/HUMAN_OVERSIGHT_MODEL.md
docs/RISK_REGISTER_TEMPLATE.md
docs/AUDIT_CHECKLIST.md
docs/INCIDENT_REPORT_TEMPLATE.md
docs/DATA_HANDLING_MODEL.md
docs/DUAL_USE_RISK_REGISTER.md
docs/COMPLIANCE_DISCLAIMER.md
docs/EVIDENCE_PACK_MODEL.md
docs/RELEASE_GOVERNANCE.md

Documentation checklist:

Is the project definition consistent?
Is the non-offensive boundary clear?
Is dual-use described as controlled civil and strategic use?
Is compliance described as orientation only?
Is human accountability preserved?
Are implementation gaps visible?
Are roadmap phases clear?
Are prohibited uses documented?
Are security boundaries documented?
Are deployment limitations documented?


---

8. Build Gate

The build gate checks whether the project can be built from source.

Recommended commands:

npm install
npm audit
npm run build

Optional commands if available:

npm run lint
npm run typecheck
npm test

Build checklist:

Does npm install complete?
Does npm audit show blocking issues?
Does npm run build complete?
Are TypeScript errors absent?
Are required environment variables documented?
Are missing environment variables handled safely?
Does the runtime degrade safely if the model provider is unavailable?

A failed build blocks runtime release.

A documentation-only release may proceed with build limitations clearly stated.


---

9. Security Gate

Security checklist:

Are secrets excluded from the repository?
Is .env.local ignored?
Are API keys absent from source files?
Are tokens absent from logs and examples?
Are API routes safe?
Is file handling controlled?
Are errors handled safely?
Is offensive cyber use prohibited?
Is malware generation prohibited?
Is unauthorized access prohibited?
Is exploit deployment prohibited?
Is credential theft prohibited?
Is evasion or stealth prohibited?
Is fail-closed behavior documented?

Security gate outcomes:

Outcome	Meaning

PASS	Security boundary acceptable for release type
PARTIAL	Known issues exist but are non-blocking for documentation release
FAIL	Security problems must be fixed
BLOCKING	Release must stop


Any secret leak is blocking until revoked, rotated and documented.


---

10. Governance Gate

Governance checklist:

Is runtime identity defined?
Is policy evaluation defined?
Are risk classes defined?
Are governance decisions defined?
Is human oversight defined?
Is fail-closed behavior defined?
Is EVT traceability defined?
Is auditability defined?
Are prohibited uses documented?
Are corrections treated as new events?

Governance decisions:

Decision	Meaning

ALLOW	Operation may proceed
BLOCK	Operation is prohibited or unsafe
ESCALATE	Human authority or higher review required
DEGRADE	Limited safe support only
AUDIT	Operation should be recorded or reviewed
NOOP	No operational action taken


Governance must remain consistent across all documentation.


---

11. Risk Gate

Risk checklist:

Are LOW, MEDIUM, HIGH, CRITICAL, PROHIBITED and UNKNOWN risk classes defined?
Is UNKNOWN risk treated conservatively?
Are high-impact domains identified?
Are security-sensitive contexts handled carefully?
Are public-sector contexts handled carefully?
Are critical infrastructure contexts handled carefully?
Are dual-use contexts handled carefully?
Is risk connected to decision and human oversight?
Is risk connected to EVT where required?

Release should not proceed if prohibited or unknown high-impact risks are treated as ordinary safe operations.


---

12. Human Oversight Gate

Human oversight checklist:

Are oversight states documented?
Is final human responsibility preserved?
Are high-impact outputs marked for review?
Are public-sector outputs reviewed where required?
Are security-sensitive outputs reviewed where required?
Are critical infrastructure outputs reviewed by default?
Is model output treated as advisory where appropriate?
Is human oversight prevented from authorizing prohibited use?

Oversight states:

NOT_REQUIRED
RECOMMENDED
REQUIRED
COMPLETED
REJECTED
ESCALATED
BLOCKED
UNKNOWN

A release that removes human accountability must be blocked.


---

13. EVT Gate

EVT checklist:

Is EVT defined?
Is previous event reference defined?
Is runtime identity included?
Is timestamp included?
Is context class included?
Is risk class included?
Is governance decision included?
Is operation status included?
Is verification status included?
Is audit status included where required?
Is hash model defined?
Is correction event model defined?
Are sensitive payloads minimized?

EVT readiness levels:

Level	Meaning

EVT-DOC	EVT documented
EVT-TYPE	EVT types implemented
EVT-GEN	EVT generator implemented
EVT-LEDGER	Ledger implemented
EVT-VERIFY	Verification implemented
EVT-AUDIT	Audit integration implemented


A release must clearly state which EVT readiness level applies.


---

14. Ledger Gate

Ledger checklist:

Is ledger model defined?
Are events append-only where implemented?
Are historical events protected from silent rewrite?
Are corrections represented as new events?
Is previous event continuity preserved?
Are public and internal views separated?
Are sensitive payloads minimized?
Can ledger entries be verified?

A release that claims traceability without ledger or equivalent event continuity must state the limitation.


---

15. Verification Gate

Verification checklist:

Is verification status defined?
Is hash algorithm defined?
Is canonicalization defined?
Can hashes be recomputed where applicable?
Can EVT required fields be validated?
Can previous event references be inspected?
Can correction events be inspected?
Is verification distinguished from certification?
Is verification distinguished from legal authorization?

Verification statuses:

VERIFIABLE
PARTIAL
INVALID
UNVERIFIED
ANCHORED
SUPERSEDED
DISPUTED

Verification supports review.

It does not create certification.


---

16. Data Handling Gate

Data handling checklist:

Are data classes defined?
Are secrets protected?
Are personal data rules defined?
Are confidential data rules defined?
Are security-sensitive data rules defined?
Is file handling controlled?
Are logs safe?
Are public and internal EVT views separated?
Is data minimization documented?
Are data incident triggers defined?

Data classes:

PUBLIC
INTERNAL
CONFIDENTIAL
SECRET
PERSONAL
SECURITY_SENSITIVE
CRITICAL_OPERATIONAL
UNKNOWN

Unknown sensitivity in high-impact contexts must trigger conservative handling.


---

17. Dual-Use Gate

Dual-use checklist:

Is dual-use defined as controlled civil and strategic use?
Are offensive cyber operations excluded?
Are autonomous weapons excluded?
Is unlawful surveillance excluded?
Is sabotage excluded?
Is coercive manipulation excluded?
Are critical infrastructure limits clear?
Are defensive security limits clear?
Are B2B and B2G boundaries clear?
Is human oversight required for sensitive dual-use contexts?
Is fail-closed behavior defined?

Dual-use classification:

ALLOWED
SENSITIVE
RESTRICTED
PROHIBITED
UNKNOWN

A release that expands dual-use capability without stronger controls must be blocked.


---

18. Compliance Disclaimer Gate

Compliance disclaimer checklist:

Is non-certification clear?
Is legal review requirement clear?
Is cybersecurity review requirement clear?
Is data protection review requirement clear?
Is public-sector authority preserved?
Is critical infrastructure control excluded?
Is model output described as support material?
Is auditability distinguished from legal compliance?
Is prototype status clear?
Are implementation gaps disclosed?

The release must not claim:

legal compliance;

regulatory certification;

cybersecurity certification;

critical infrastructure authorization;

public-sector approval;

production readiness without controls.



---

19. Deployment Gate

Deployment checklist:

Is deployment target defined?
Are environment variables documented?
Are secrets stored outside the repository?
Is authentication required for serious deployment?
Is authorization required for serious deployment?
Is role-based access considered?
Are API routes validated?
Are file uploads controlled?
Are logs safe?
Is rate limiting considered?
Is error handling safe?
Is human oversight operationalized?
Is EVT generation implemented?
Is ledger continuity implemented?
Is verification available?
Is incident response defined?

Deployment status values:

Status	Meaning

LOCAL_ONLY	Local prototype only
PUBLIC_DEMO	Public demo with limitations
INTERNAL_REVIEW	Internal review environment
CONTROLLED_PILOT	Limited pilot with review
PRODUCTION_CANDIDATE	Requires full external review
PRODUCTION_READY	Only after formal deployment controls and review


Do not label a public demo as production-ready.


---

20. Release Candidate Checklist

Before declaring a release candidate, review:

Documentation aligned.
Build passes.
No secrets in repository.
Security boundary clear.
Dual-use boundary clear.
Compliance disclaimer present.
Risk classes defined.
Governance decisions defined.
Human oversight defined.
EVT model defined.
Ledger limitations disclosed.
Verification limitations disclosed.
Data handling model present.
Audit checklist present.
Incident template present.
Evidence pack model present.
Roadmap gaps disclosed.
Deployment limitations disclosed.

A release candidate may still be limited.

Limitations must be explicit.


---

21. Release Manifest

Each release may include a release manifest.

Suggested structure:

{
  "release_id": "REL-20260429-0001",
  "version": "v0.2.0",
  "release_type": "GOVERNANCE_RELEASE",
  "status": "READY_FOR_REVIEW",
  "created_at": "2026-04-29T15:30:00+02:00",
  "repository": {
    "name": "hbce-ai-joker-c2",
    "branch": "main",
    "commit": "commit-hash-here"
  },
  "identity": {
    "entity": "AI_JOKER",
    "ipr": "IPR-AI-0001",
    "runtime": "AI JOKER-C2",
    "core": "HBCE-CORE-v3"
  },
  "readiness": {
    "documentation": "PASS",
    "build": "NEEDS_REVIEW",
    "security": "PASS",
    "governance": "PASS",
    "risk": "PASS",
    "human_oversight": "PASS",
    "evt": "DOCUMENTED",
    "ledger": "PLANNED",
    "verification": "PLANNED",
    "deployment": "PROTOTYPE"
  },
  "disclaimer": "This release is governance-oriented and does not create legal, regulatory, cybersecurity or institutional certification."
}


---

22. Release Notes Template

Use this template for release notes.

# Release Notes

## Version
v0.0.0

## Release Type
DOCUMENTATION_BASELINE / PROTOTYPE_RELEASE / GOVERNANCE_RELEASE / RELEASE_CANDIDATE

## Status
DRAFT / READY_FOR_REVIEW / APPROVED_WITH_LIMITATIONS / APPROVED / BLOCKED

## Summary
Describe what changed.

## Added
List new files or features.

## Changed
List modified files or behavior.

## Security
Describe security impact.

## Governance
Describe policy, risk, decision or oversight impact.

## EVT and Evidence
Describe event traceability impact.

## Data Handling
Describe data handling impact.

## Known Limitations
List what is not implemented or not certified.

## Required Review
List legal, security, data protection, operational or human review requirements.

## Commit Reference
Add commit hash or tag.

## Disclaimer
This release does not create legal, regulatory, cybersecurity, public-sector or critical infrastructure certification.


---

23. Release EVT

A release may generate an EVT record.

Example:

{
  "evt": "EVT-20260429-235000-0001",
  "prev": "EVT-20260429-234500-0000",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T23:50:00+02:00",
  "context": {
    "class": "RELEASE_GOVERNANCE",
    "domain": "DOCUMENTATION_BASELINE",
    "sensitivity": "MEDIUM"
  },
  "governance": {
    "risk": "MEDIUM",
    "decision": "AUDIT",
    "human_oversight": "RECOMMENDED",
    "policy": "RELEASE_GOVERNANCE",
    "fail_closed": false
  },
  "operation": {
    "type": "RELEASE_DOCUMENTATION_BASELINE",
    "status": "READY_FOR_REVIEW"
  },
  "verification": {
    "status": "VERIFIABLE",
    "audit_status": "READY"
  }
}

A release EVT supports reconstruction.

It does not certify the release.


---

24. Release Blocking Conditions

A release must be blocked when:

secrets are present in repository;

offensive functionality is introduced;

fail-closed behavior is weakened;

prohibited use boundary is removed;

human accountability is removed;

compliance certification is falsely claimed;

critical infrastructure control is implied without authorization;

API route exposes secrets or unrestricted execution;

data handling rules are missing for sensitive deployment;

build fails for runtime release;

security review identifies unresolved critical issue.


Blocking protects the project.

It is not a bureaucratic inconvenience.


---

25. Release Limitation Statement

Every non-production release should include a limitation statement.

Recommended statement:

This release is a governance-oriented prototype release. It is intended for documentation, review, demonstration or controlled evaluation. It is not a certified compliance product, cybersecurity product, public-sector control system or critical infrastructure control system. Any real-world deployment requires legal, cybersecurity, data protection, operational and human review.

Short statement:

Prototype release. Governance-oriented. Not certified. Human review required for real-world deployment.


---

26. Versioning Model

Suggested versioning model:

Version	Meaning

v0.1.x	Runtime prototype
v0.2.x	Governance and documentation baseline
v0.3.x	Policy and risk engine
v0.4.x	EVT ledger and verifier
v0.5.x	Signed evidence pack model
v0.6.x	Dashboard and audit view
v0.7.x	B2B and B2G package
v0.8.x	Federation and node registry
v0.9.x	Compliance-oriented package
v1.0.0	Governed operational release candidate


Version numbers must match real maturity.

Do not use v1.0.0 before governance, traceability, security and review controls exist.


---

27. Tagging Model

Recommended Git tags:

v0.1.0-runtime-prototype
v0.2.0-governance-baseline
v0.3.0-policy-risk-engine
v0.4.0-evt-ledger-verifier
v0.5.0-evidence-pack
v0.6.0-dashboard-audit
v0.7.0-b2b-b2g-package
v0.8.0-federation-node-registry
v0.9.0-compliance-package
v1.0.0-governed-release-candidate

Tags should be used only when the repository state supports the label.


---

28. Release Review Roles

Suggested roles:

Role	Function

Maintainer	Prepares release and validates repository state
Security reviewer	Reviews security boundary, secrets and API behavior
Governance reviewer	Reviews policy, risk, oversight and fail-closed consistency
Data reviewer	Reviews data handling and privacy-sensitive issues
Auditor	Reviews EVT, ledger, evidence and audit readiness
Legal reviewer	Reviews legal and regulatory implications where required
Institutional reviewer	Reviews public-sector or B2G use where relevant
Operator	Tests runtime behavior in controlled environment


Role-based review helps avoid treating a release as approved by default.


---

29. Release Evidence Pack

A release may be accompanied by an evidence pack.

Recommended pack type:

RELEASE_REVIEW

Recommended contents:

PACK_MANIFEST.json
RELEASE_NOTES.md
REPOSITORY_REFERENCE.md
EVT_RECORDS.jsonl
HASHES.json
VERIFICATION_REPORT.md
AUDIT_NOTES.md
RISK_REGISTER_EXTRACT.md
HUMAN_OVERSIGHT.md
COMPLIANCE_DISCLAIMER.md

Release evidence packs support review.

They do not create certification.


---

30. Release Workflow

Recommended workflow:

Define release scope
Confirm release type
Update documentation
Run build checks
Run security review
Run governance review
Run risk review
Run data handling review
Confirm human oversight model
Confirm EVT readiness
Confirm disclaimer
Prepare release notes
Create release manifest
Create release EVT if applicable
Create evidence pack if applicable
Tag release if justified
Publish release only with limitations

Release workflow should be repeatable.


---

31. Release Review Checklist

Before publishing a release, check:

Is the release scope clear?
Is the release type accurate?
Is the status accurate?
Are all required files present?
Does the build pass if runtime release?
Are secrets absent?
Are security boundaries intact?
Are prohibited uses excluded?
Are risk classes present?
Are governance decisions present?
Is human oversight present?
Is EVT readiness stated accurately?
Is ledger readiness stated accurately?
Is verification readiness stated accurately?
Are data handling rules present?
Are limitations documented?
Is compliance disclaimer included?
Is external review required?


---

32. Release Findings

Release findings should be classified as:

Finding	Meaning	Suggested Action

PASS	Requirement satisfied	No action required
MINOR	Small issue	Fix normally
MODERATE	Governance or security issue	Prioritize remediation
MAJOR	Significant issue	Fix before serious use
CRITICAL	Severe issue	Immediate remediation
BLOCKING	Release must not proceed	Stop release


Findings should be linked to evidence or files.


---

33. Release Maturity Matrix

Area	Documentation Baseline	Runtime Prototype	Pilot Candidate	Release Candidate

Documentation	Required	Required	Required	Required
Build	Optional	Required	Required	Required
Security policy	Required	Required	Required	Required
Risk classes	Required	Required	Implemented	Implemented
Policy engine	Documented	Planned	Implemented	Implemented
Human oversight	Documented	Planned	Implemented	Implemented
EVT	Documented	Basic	Implemented	Implemented
Ledger	Planned	Basic	Implemented	Implemented
Verification	Planned	Basic	Implemented	Implemented
Audit checklist	Required	Required	Required	Required
Evidence pack	Documented	Optional	Recommended	Required
External review	Optional	Recommended	Required	Required


This matrix prevents maturity inflation.


---

34. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

Release governance does not create legal, regulatory, cybersecurity, public-sector, financial, medical or critical infrastructure certification.

A release may be ready for review without being ready for production.

A release may be technically functional without being legally deployable.

A release may be traceable without being institutionally authorized.

Any real-world deployment requires proper review by authorized professionals and responsible organizations.


---

35. Final Release Governance Formula

A release without governance is only a snapshot.
A release with identity, policy, risk, oversight, EVT, verification, audit and disclaimer becomes reviewable infrastructure.

Operational formula:

Release Governance =
Scope + Version + Build + Security + Policy + Risk + Oversight + EVT + Verification + Evidence + Disclaimer


---

36. Status

Document status: active release governance model
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
