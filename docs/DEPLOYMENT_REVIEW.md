# AI JOKER-C2 Deployment Review

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the deployment review model for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

Deployment review is the control process required before exposing, testing, demonstrating or operating the runtime in any environment.

The objective is to verify that deployment does not weaken:

- identity;
- security;
- governance;
- data handling;
- human oversight;
- EVT traceability;
- auditability;
- fail-closed behavior;
- non-offensive boundaries;
- compliance disclaimers.

This document does not create legal, cybersecurity, regulatory or institutional certification.

---

## 2. Core Deployment Principle

The core principle is:

```txt
No deployment without review.

Expanded:

A runtime should not be exposed to users, organizations or institutions unless environment, secrets, API routes, file handling, logging, model access, governance boundaries and failure modes are reviewed.

Operational formula:

Deployment Review =
Environment + Secrets + Build + API + Files + Logs + Governance + EVT + Fail-Closed + Human Review

Within AI JOKER-C2:

MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = event trace layer
Ledger = continuity layer
Fail-closed = safety boundary


---

3. Deployment Scope

Deployment review applies to:

local development;

preview deployment;

public demo deployment;

internal review environment;

controlled pilot;

B2B evaluation;

B2G evaluation;

institutional review;

critical infrastructure documentation pilot;

production candidate.


The more sensitive the deployment context, the stronger the required review.


---

4. Deployment Types

Deployment Type	Description	Default Review Level

LOCAL_DEV	Local development on maintainer machine	Basic
PREVIEW	Temporary preview deployment	Basic plus secrets review
PUBLIC_DEMO	Public-facing demonstration	Security and disclaimer review
INTERNAL_REVIEW	Restricted internal review environment	Governance and data review
CONTROLLED_PILOT	Limited pilot with defined users	Full deployment review
B2B_EVALUATION	Business evaluation	Security, governance and data review
B2G_EVALUATION	Public-sector evaluation	Legal, governance and oversight review
CRITICAL_CONTEXT_REVIEW	Critical infrastructure or high-impact context	Strict escalation review
PRODUCTION_CANDIDATE	Candidate for serious operational use	External review required


No deployment type should be treated as production-ready by default.


---

5. Deployment Status Values

Status	Meaning

NOT_REVIEWED	Deployment has not been reviewed
DRAFT	Deployment preparation in progress
READY_FOR_REVIEW	Deployment package ready for review
UNDER_REVIEW	Review in progress
APPROVED_WITH_LIMITATIONS	Approved only for defined scope
APPROVED	Approved for stated deployment type
REJECTED	Deployment not accepted
BLOCKED	Deployment must not proceed
SUPERSEDED	Replaced by newer deployment review
ARCHIVED	Retained for historical record


Deployment status must be explicit.


---

6. Deployment Environment Review

Review the target environment.

Check	Status	Notes

Deployment type is defined		
Environment name is defined		
Runtime branch is defined		
Commit hash is recorded		
Build command is documented		
Start command is documented		
Environment variables are documented		
Secrets are stored outside repository		
Public URL is reviewed		
Deployment limitations are documented		


Suggested environment metadata:

{
  "deployment_id": "DEPLOY-20260429-0001",
  "deployment_type": "PUBLIC_DEMO",
  "status": "READY_FOR_REVIEW",
  "repository": "hbce-ai-joker-c2",
  "branch": "main",
  "commit": "commit-hash-here",
  "platform": "Vercel",
  "runtime": "Next.js",
  "review_required": true
}


---

7. Build Review

Recommended build commands:

npm install
npm audit
npm run build

Optional commands if available:

npm run lint
npm run typecheck
npm test

Build checklist:

Check	Status	Notes

Dependencies install successfully		
Lockfile is present		
Build completes successfully		
TypeScript errors are absent		
Critical audit issues are absent or documented		
Runtime can start locally		
Missing environment variables are handled safely		
Build logs do not expose secrets		
Preview deployment works as expected		
Known build limitations are documented		


A runtime deployment should not proceed if the build is broken.


---

8. Environment Variables Review

Required variable:

OPENAI_API_KEY

Optional variable:

JOKER_MODEL

Environment variable checklist:

Check	Status	Notes

OPENAI_API_KEY is configured in deployment provider		
OPENAI_API_KEY is not committed to repository		
OPENAI_API_KEY is not exposed to client-side code		
OPENAI_API_KEY is not logged		
JOKER_MODEL behavior is documented		
Missing variables trigger safe degraded mode		
Environment files are ignored by Git		
Production and preview secrets are separated where required		
Secret rotation process is documented		
Secret leak triggers incident response		


Secret rule:

A leaked secret must be treated as compromised.


---

9. Vercel Deployment Review

If deployed on Vercel, review:

Check	Status	Notes

Project is connected to correct GitHub repository		
Production branch is correct		
Preview deployments are controlled		
Environment variables are configured in Vercel dashboard		
Secrets are not exposed as public variables		
Build command is correct		
Output framework is detected correctly		
Logs do not expose secrets or payloads		
Public URL is reviewed before sharing		
Deployment rollback is possible		


Vercel is a deployment target.

It does not replace runtime governance.


---

10. API Route Review

Primary API routes may include:

/api/chat
/api/files
/api/verify
/api/evidence

API checklist:

Check	Status	Notes

/api/chat validates input		
/api/files validates input		
API routes reject unsupported methods where needed		
API routes avoid exposing stack traces		
API routes avoid returning secrets		
API routes avoid unrestricted execution		
API routes preserve policy and risk boundaries		
API routes support safe degraded mode		
API routes can generate or support EVT where required		
API route errors are safe and useful		


API rule:

APIs are operational surfaces. They must not bypass governance.


---

11. Chat Runtime Review

Review the chat runtime.

Check	Status	Notes

User input is normalized		
Empty or malformed input is handled safely		
Model errors are handled safely		
Model unavailable state triggers degraded mode		
Runtime identity is preserved		
Sensitive requests are classified		
Prohibited requests are blocked or degraded		
Outputs remain useful and bounded		
Public answers do not expose internal secrets		
Technical diagnostics are shown only when appropriate		


The model must not override runtime governance.


---

12. File Upload Review

File handling checklist:

Check	Status	Notes

Supported file types are documented		
Unsupported file types are rejected or safely handled		
Uploaded files are not executed		
File names are not trusted blindly		
File size limits are defined or planned		
File content is not logged unnecessarily		
Sensitive files are minimized or summarized		
File visibility limits are disclosed		
User control over uploaded content is preserved		
File processing can trigger EVT where required		


Recommended safe file types:

.txt
.md
.json
.csv

Unknown or binary files should be treated conservatively.


---

13. Logging Review

Logging checklist:

Check	Status	Notes

Logs do not contain API keys		
Logs do not contain tokens		
Logs do not contain private keys		
Logs do not contain full sensitive prompts		
Logs do not contain full uploaded confidential files		
Logs do not expose stack traces in production		
Logs include useful generic status information		
Logs may reference EVT identifiers where appropriate		
Log retention is minimized or defined		
Log access is controlled where required		


Safe log fields may include:

timestamp
route
operation_type
context_class
risk_class
decision
evt_id
verification_status
generic_error_code


---

14. Data Handling Review

Data classes:

PUBLIC
INTERNAL
CONFIDENTIAL
SECRET
PERSONAL
SECURITY_SENSITIVE
CRITICAL_OPERATIONAL
UNKNOWN

Data handling checklist:

Check	Status	Notes

Data classification model is documented		
Sensitive data is minimized		
Secrets are blocked or removed		
Personal data is minimized		
Confidential content is not exposed publicly		
Security-sensitive content is restricted		
Critical operational content triggers escalation		
Public and internal EVT views are separated where required		
Model prompts are minimized		
Data incidents trigger incident reporting		


Deployment should not proceed in sensitive contexts without data handling review.


---

15. Governance Review

Governance checklist:

Check	Status	Notes

Runtime identity is defined		
Policy boundaries are defined		
Risk classes are defined		
Governance decisions are defined		
Human oversight states are defined		
Prohibited uses are documented		
Fail-closed behavior is documented		
EVT traceability is defined		
Auditability is defined		
Deployment limitations are clear		


Governance decisions:

ALLOW
BLOCK
ESCALATE
DEGRADE
AUDIT
NOOP

The runtime must not treat all requests as automatically executable.


---

16. Risk Review

Risk classes:

LOW
MEDIUM
HIGH
CRITICAL
PROHIBITED
UNKNOWN

Risk checklist:

Check	Status	Notes

Risk classes are documented		
Unknown risk is treated conservatively		
Security-sensitive requests are not treated as ordinary		
Public-sector contexts trigger review where required		
Critical infrastructure contexts trigger escalation		
Dual-use contexts trigger classification		
Prohibited requests trigger BLOCK		
Risk can be connected to decision		
Risk can be connected to human oversight		
Risk can be connected to EVT where required		


Risk review prevents blind runtime exposure.


---

17. Human Oversight Review

Oversight states:

NOT_REQUIRED
RECOMMENDED
REQUIRED
COMPLETED
REJECTED
ESCALATED
BLOCKED
UNKNOWN

Human oversight checklist:

Check	Status	Notes

Oversight model is documented		
High-impact outputs require review		
Public-sector outputs require review where needed		
Security-sensitive outputs require review where needed		
Critical infrastructure outputs require review by default		
AI output is marked advisory where required		
Final authority remains human or institutional		
Oversight cannot authorize prohibited use		
Review states can be recorded in EVT where required		
Review limitations are documented		


Human oversight is a deployment gate, not a footnote.


---

18. EVT Readiness Review

EVT readiness levels:

Level	Meaning

EVT-DOC	EVT documented
EVT-TYPE	EVT types implemented
EVT-GEN	EVT generator implemented
EVT-LEDGER	Ledger implemented
EVT-VERIFY	Verification implemented
EVT-AUDIT	Audit integration implemented


EVT checklist:

Check	Status	Notes

EVT protocol is documented		
Required fields are defined		
Previous event reference is defined		
Runtime identity is included		
Context class is included		
Risk class is included		
Governance decision is included		
Operation status is included		
Verification status is included		
Audit status is included where required		
Sensitive payloads are minimized		
Correction events are defined		


Deployment claims must match actual EVT readiness.


---

19. Ledger Review

Ledger checklist:

Check	Status	Notes

Ledger model is documented		
Append-only behavior is implemented or planned		
Historical events are not silently rewritten		
Corrections are new events		
Previous event references are preserved		
Ledger avoids unnecessary sensitive payloads		
Public and internal views are separated where required		
Ledger can support verification		
Ledger can support audit review		
Ledger limitations are disclosed		


If ledger is not implemented, release notes must say so.


---

20. Verification Review

Verification checklist:

Check	Status	Notes

Verification status is defined		
Hash algorithm is defined		
Canonicalization is defined		
Hashes can be recomputed where implemented		
Required EVT fields can be validated		
Previous event references can be inspected		
Correction events can be inspected		
Verification is distinguished from certification		
Verification is distinguished from authorization		
Verification limitations are documented		


Verification supports reconstruction.

It does not create compliance certification.


---

21. Security Boundary Review

Security boundary checklist:

Check	Status	Notes

Offensive cyber use is prohibited		
Unauthorized access is prohibited		
Malware generation is prohibited		
Credential theft is prohibited		
Exploit deployment is prohibited		
Evasion and stealth are prohibited		
Sabotage is prohibited		
Defensive security support is allowed and bounded		
Unsafe security requests are blocked, degraded or escalated		
Safe defensive alternatives are available		


Deployment must not expand the runtime into unsafe security capability.


---

22. Dual-Use Review

Dual-use classes:

ALLOWED
SENSITIVE
RESTRICTED
PROHIBITED
UNKNOWN

Dual-use checklist:

Check	Status	Notes

Dual-use is defined as controlled civil and strategic use		
Offensive use is excluded		
Unlawful surveillance is excluded		
Autonomous weapons are excluded		
Critical infrastructure control is excluded		
Defensive cybersecurity is bounded		
Sensitive dual-use contexts require review		
Prohibited dual-use contexts trigger BLOCK		
EVT is required where relevant		
Human oversight is required where relevant		


Dual-use must remain governed, not elastic.


---

23. Compliance Disclaimer Review

Disclaimer checklist:

Check	Status	Notes

Prototype status is clear		
Non-certification statement is present		
Legal review requirement is clear		
Cybersecurity review requirement is clear		
Data protection review requirement is clear		
Public-sector authority is preserved		
Critical infrastructure control is excluded		
Audit readiness is not presented as certification		
Model output is support material		
Human responsibility is preserved		


The deployment must not imply certification that does not exist.


---

24. Public Demo Review

Before sharing a public demo URL, review:

Is the demo clearly labeled as prototype?
Are secrets protected?
Are API routes safe?
Are file uploads controlled?
Are unsafe requests blocked or degraded?
Is offensive use prohibited?
Is data handling clear?
Are logs safe?
Is model failure handled safely?
Is public communication consistent with README and disclaimers?

Public demo limitation statement:

This is a prototype demonstration of a governance-oriented AI runtime. It is not a certified compliance product, cybersecurity product, public-sector control system or critical infrastructure control system.


---

25. Controlled Pilot Review

Before controlled pilot use, review:

Is pilot scope defined?
Are authorized users defined?
Is data class defined?
Is risk classification active or documented?
Is human oversight assigned?
Is incident response defined?
Are secrets protected?
Are API routes validated?
Is file handling controlled?
Is EVT generation implemented or limitation disclosed?
Is ledger implemented or limitation disclosed?
Is verification implemented or limitation disclosed?
Is audit checklist available?
Is legal review required?
Is cybersecurity review required?
Is data protection review required?

A pilot is not production.

A pilot is a controlled test under review.


---

26. Production Candidate Review

Before any production candidate status, review:

Authentication implemented.
Authorization implemented.
Role-based access implemented where required.
Secrets managed securely.
API validation implemented.
File validation implemented.
Rate limiting considered.
Secure logging implemented.
Human oversight workflow implemented.
Risk engine implemented.
Policy engine implemented.
Runtime decision object implemented.
EVT generation implemented.
Ledger continuity implemented.
Verification endpoint implemented.
Incident response process implemented.
Evidence pack process implemented.
Legal review performed.
Cybersecurity review performed.
Data protection review performed.
Operational review performed.

Without these controls, the system should not be presented as production-ready.


---

27. Deployment Blocking Conditions

Deployment must be blocked when:

secrets are present in repository;

API keys are exposed;

build fails for runtime deployment;

offensive capability is introduced;

unsafe file execution exists;

prohibited-use boundary is removed;

fail-closed behavior is weakened;

human accountability is removed;

compliance certification is falsely claimed;

critical infrastructure control is implied;

public-sector authority is implied without authorization;

logs expose sensitive data;

data handling rules are absent for sensitive deployment.


Blocking is a safety feature.


---

28. Deployment Review Record

Use this template.

# Deployment Review Record

## Deployment ID
DEPLOY-YYYYMMDD-0001

## Deployment Type
LOCAL_DEV / PREVIEW / PUBLIC_DEMO / INTERNAL_REVIEW / CONTROLLED_PILOT / B2B_EVALUATION / B2G_EVALUATION / PRODUCTION_CANDIDATE

## Status
NOT_REVIEWED / DRAFT / READY_FOR_REVIEW / UNDER_REVIEW / APPROVED_WITH_LIMITATIONS / APPROVED / REJECTED / BLOCKED

## Repository
Repository:
Branch:
Commit:
Tag:

## Environment
Platform:
Runtime:
Public URL:
Environment Variables:
Deployment Limitations:

## Build Review
Result:
Command:
Notes:

## Security Review
Result:
Notes:

## Data Handling Review
Result:
Notes:

## Governance Review
Result:
Notes:

## Human Oversight Review
Result:
Notes:

## EVT and Ledger Review
Result:
Notes:

## Verification Review
Result:
Notes:

## Dual-Use Review
Result:
Notes:

## Compliance Disclaimer Review
Result:
Notes:

## Findings
List findings.

## Required Actions
List required actions.

## Approval
Approved By Role:
Approval Date:
Limitations:


---

29. Deployment EVT

A deployment may generate an EVT record.

Example:

{
  "evt": "EVT-20260429-235500-0001",
  "prev": "EVT-20260429-235000-0000",
  "entity": "AI_JOKER",
  "ipr": "IPR-AI-0001",
  "timestamp": "2026-04-29T23:55:00+02:00",
  "context": {
    "class": "DEPLOYMENT_REVIEW",
    "domain": "PUBLIC_DEMO",
    "sensitivity": "MEDIUM"
  },
  "governance": {
    "risk": "MEDIUM",
    "decision": "AUDIT",
    "human_oversight": "RECOMMENDED",
    "policy": "DEPLOYMENT_REVIEW",
    "fail_closed": false
  },
  "operation": {
    "type": "DEPLOYMENT_REVIEW_CREATED",
    "status": "READY_FOR_REVIEW"
  },
  "verification": {
    "status": "VERIFIABLE",
    "audit_status": "READY"
  }
}

Deployment EVT supports reconstruction.

It does not certify deployment.


---

30. Deployment Maturity Levels

Level	Description

D0	No deployment review
D1	Deployment checklist documented
D2	Environment and secrets reviewed
D3	Build and API reviewed
D4	Data handling reviewed
D5	Governance and oversight reviewed
D6	EVT and ledger reviewed
D7	Verification and evidence reviewed
D8	Controlled pilot review completed
D9	Production candidate requires external review


Deployment maturity must match real controls.


---

31. Implementation Targets

Suggested files:

docs/DEPLOYMENT_REVIEW.md
docs/RELEASE_GOVERNANCE.md
docs/AUDIT_CHECKLIST.md
docs/DATA_HANDLING_MODEL.md
docs/INCIDENT_REPORT_TEMPLATE.md
lib/runtime-decision.ts
lib/policy-engine.ts
lib/risk-engine.ts
lib/evt.ts
app/api/verify/route.ts
app/api/evidence/route.ts

Suggested future types:

export type DeploymentType =
  | "LOCAL_DEV"
  | "PREVIEW"
  | "PUBLIC_DEMO"
  | "INTERNAL_REVIEW"
  | "CONTROLLED_PILOT"
  | "B2B_EVALUATION"
  | "B2G_EVALUATION"
  | "CRITICAL_CONTEXT_REVIEW"
  | "PRODUCTION_CANDIDATE";

export type DeploymentReviewStatus =
  | "NOT_REVIEWED"
  | "DRAFT"
  | "READY_FOR_REVIEW"
  | "UNDER_REVIEW"
  | "APPROVED_WITH_LIMITATIONS"
  | "APPROVED"
  | "REJECTED"
  | "BLOCKED"
  | "SUPERSEDED"
  | "ARCHIVED";


---

32. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

Deployment review does not create legal, regulatory, cybersecurity, public-sector, financial, medical or critical infrastructure certification.

A reviewed deployment may still require additional external review.

A public demo is not production.

A controlled pilot is not unrestricted deployment.

A production candidate is not production-ready until all required controls and external reviews are completed.


---

33. Final Deployment Formula

Deployment without review is exposure.
Deployment with environment control, secrets protection, governance, EVT, audit and fail-closed behavior becomes reviewable runtime operation.

Operational formula:

Deployment Review =
Build + Environment + Secrets + API + Files + Logs + Governance + Risk + Oversight + EVT + Verification + Disclaimer


---

34. Status

Document status: active deployment review model
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

