# AI JOKER-C2 Runtime Implementation Plan

HBCE Research  
HERMETICUM B.C.E. S.r.l.  
Torino, Italy, Europe  
2026

---

## 1. Purpose

This document defines the runtime implementation plan for AI JOKER-C2.

AI JOKER-C2 is an identity-bound operational AI runtime built within the HBCE infrastructure and aligned with the MATRIX framework.

The purpose of this plan is to translate the documentation and governance layer into executable runtime modules.

The implementation path focuses on:

- context classification;
- policy evaluation;
- risk classification;
- human oversight;
- runtime decisions;
- EVT generation;
- append-only ledger;
- verification;
- evidence packs;
- safe API behavior;
- fail-closed execution.

This document is an implementation plan.

It does not create legal, regulatory, cybersecurity or institutional certification.

---

## 2. Core Runtime Principle

The core runtime principle is:

```txt
No sensitive execution without identity, policy, risk, decision, trace and reviewability.

Canonical runtime sequence:

Identity -> Input -> Intent -> Context -> Policy -> Risk -> Human Oversight -> Decision -> Execution -> EVT -> Ledger -> Verification -> Continuity

Condensed formula:

Identity -> Policy -> Risk -> Decision -> EVT -> Verification -> Continuity

Within AI JOKER-C2:

MATRIX = strategic framework
HBCE = governance infrastructure
AI JOKER-C2 = operational runtime
IPR = identity layer
EVT = event trace layer
Ledger = continuity layer
Fail-closed = safety boundary

The runtime implementation must preserve this sequence.


---

3. Implementation Objective

The implementation objective is to move from documentation baseline to governed runtime behavior.

Current phase:

documentation baseline + governance architecture

Target phase:

executable governance runtime

The first runtime implementation should be small, clear and modular.

It should not attempt to build every future feature at once.

The correct engineering sequence is:

types -> classifiers -> policy -> risk -> decision -> EVT -> ledger -> verify -> dashboard


---

4. Implementation Phases

Phase	Objective	Main Deliverable

RUNTIME-0	Preserve current working runtime	Stable chat and file APIs
RUNTIME-1	Add shared type system	lib/runtime-types.ts
RUNTIME-2	Add context and intent classification	lib/context-classifier.ts
RUNTIME-3	Add policy engine	lib/policy-engine.ts
RUNTIME-4	Add risk engine	lib/risk-engine.ts
RUNTIME-5	Add human oversight engine	lib/human-oversight.ts
RUNTIME-6	Add runtime decision object	lib/runtime-decision.ts
RUNTIME-7	Add EVT generator and hash	lib/evt.ts, lib/evt-hash.ts
RUNTIME-8	Add append-only ledger	lib/evt-ledger.ts
RUNTIME-9	Add verification endpoint	app/api/verify/route.ts
RUNTIME-10	Add evidence pack endpoint	app/api/evidence/route.ts
RUNTIME-11	Add dashboard and event view	app/dashboard, app/events


Each phase should remain buildable.


---

5. Recommended File Structure

Recommended implementation files:

lib/runtime-types.ts
lib/runtime-identity.ts
lib/context-classifier.ts
lib/policy-engine.ts
lib/risk-engine.ts
lib/human-oversight.ts
lib/runtime-decision.ts
lib/evt.ts
lib/evt-hash.ts
lib/evt-ledger.ts
lib/evt-verify.ts
lib/data-classifier.ts
lib/file-policy.ts
lib/evidence-pack.ts
lib/safe-error.ts

Recommended API routes:

app/api/chat/route.ts
app/api/files/route.ts
app/api/verify/route.ts
app/api/evidence/route.ts
app/api/health/route.ts

Recommended future folders:

ledger/
evidence/
registry/
docs/

The implementation should avoid large, opaque modules.

Governance logic should be readable and reviewable.


---

6. Runtime Type System

The first implementation step should define shared runtime types.

Suggested file:

lib/runtime-types.ts

Suggested TypeScript model:

export type RuntimeState =
  | "OPERATIONAL"
  | "DEGRADED"
  | "BLOCKED"
  | "INVALID"
  | "AUDIT_ONLY"
  | "MAINTENANCE";

export type RuntimeDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE"
  | "DEGRADE"
  | "AUDIT"
  | "NOOP";

export type RiskClass =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL"
  | "PROHIBITED"
  | "UNKNOWN";

export type ContextClass =
  | "IDENTITY"
  | "MATRIX"
  | "DOCUMENTAL"
  | "TECHNICAL"
  | "GITHUB"
  | "EDITORIAL"
  | "STRATEGIC"
  | "SECURITY"
  | "COMPLIANCE"
  | "CRITICAL_INFRASTRUCTURE"
  | "AI_GOVERNANCE"
  | "DUAL_USE"
  | "GENERAL";

export type IntentClass =
  | "ASK"
  | "WRITE"
  | "ANALYZE"
  | "SUMMARIZE"
  | "TRANSFORM"
  | "CODE"
  | "GITHUB"
  | "GOVERNANCE"
  | "SECURITY"
  | "STRATEGIC"
  | "VERIFY"
  | "PROHIBITED"
  | "UNKNOWN";

export type OversightState =
  | "NOT_REQUIRED"
  | "RECOMMENDED"
  | "REQUIRED"
  | "COMPLETED"
  | "REJECTED"
  | "ESCALATED"
  | "BLOCKED"
  | "UNKNOWN";

export type VerificationStatus =
  | "VERIFIABLE"
  | "PARTIAL"
  | "INVALID"
  | "UNVERIFIED"
  | "ANCHORED"
  | "SUPERSEDED"
  | "DISPUTED";

export type AuditStatus =
  | "NOT_REQUIRED"
  | "READY"
  | "REQUIRED"
  | "IN_REVIEW"
  | "REVIEWED"
  | "DISPUTED"
  | "REJECTED"
  | "CLOSED";

export type DataClass =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "SECRET"
  | "PERSONAL"
  | "SECURITY_SENSITIVE"
  | "CRITICAL_OPERATIONAL"
  | "UNKNOWN";

This file becomes the shared grammar of the runtime.


---

7. Runtime Identity Module

Suggested file:

lib/runtime-identity.ts

Purpose:

define canonical runtime identity;

prevent duplicated identity literals across the codebase;

provide identity metadata for EVT records;

support diagnostics.


Suggested model:

export const RUNTIME_IDENTITY = {
  publicName: "AI JOKER-C2",
  entity: "AI_JOKER",
  ipr: "IPR-AI-0001",
  checkpoint: "EVT-0014-AI",
  core: "HBCE-CORE-v3",
  framework: "MATRIX",
  infrastructure: "HBCE",
  organization: "HERMETICUM B.C.E. S.r.l.",
  territorialAnchor: "Torino, Italy, Europe"
} as const;

Runtime identity must not authorize unsafe execution.

It provides attribution and continuity.


---

8. Context Classifier

Suggested file:

lib/context-classifier.ts

Purpose:

classify the operational context of a request;

support policy and risk logic;

avoid treating all requests as equal.


Inputs:

user message;

file metadata;

route;

session context;

requested operation.


Outputs:

context class;

intent class;

sensitivity note;

confidence level.


Suggested function signature:

import type { ContextClass, IntentClass } from "./runtime-types";

export type ContextClassification = {
  contextClass: ContextClass;
  intentClass: IntentClass;
  sensitivity: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  confidence: number;
  reasons: string[];
};

export function classifyContext(input: {
  message: string;
  hasFiles?: boolean;
  route?: string;
}): ContextClassification {
  // deterministic lightweight classifier
}

Initial implementation may use keyword and rule-based classification.

Do not begin with an opaque machine-learning classifier.

The first version should be auditable.


---

9. Policy Engine

Suggested file:

lib/policy-engine.ts

Purpose:

apply project boundaries;

identify prohibited requests;

distinguish allowed, restricted and sensitive operations;

preserve non-offensive boundary.


Inputs:

context classification;

message;

file metadata;

data class;

runtime state.


Outputs:

policy status;

policy reference;

prohibited flag;

fail-closed trigger;

reasons.


Suggested model:

export type PolicyStatus =
  | "ALLOWED"
  | "RESTRICTED"
  | "PROHIBITED"
  | "UNKNOWN";

export type PolicyEvaluation = {
  status: PolicyStatus;
  policyReference: string;
  prohibited: boolean;
  failClosed: boolean;
  reasons: string[];
};

export function evaluatePolicy(input: {
  message: string;
  contextClass: string;
  intentClass: string;
  dataClass?: string;
}): PolicyEvaluation {
  // rule-based governance boundary
}

Policy engine must block or degrade:

offensive cyber operations;

malware;

credential theft;

unauthorized access;

unlawful surveillance;

sabotage;

autonomous targeting;

evidence fabrication;

bypass of human oversight.



---

10. Risk Engine

Suggested file:

lib/risk-engine.ts

Purpose:

assign risk class before sensitive execution;

connect risk to decision and human oversight;

prevent unknown risk from becoming permission.


Inputs:

context classification;

policy evaluation;

data class;

route;

file sensitivity.


Outputs:

risk class;

probability;

impact;

risk score;

reasons.


Suggested model:

import type { RiskClass } from "./runtime-types";

export type RiskEvaluation = {
  riskClass: RiskClass;
  probability: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  riskScore: number;
  reasons: string[];
};

export function evaluateRisk(input: {
  contextClass: string;
  intentClass: string;
  policyStatus: string;
  dataClass?: string;
  hasFiles?: boolean;
}): RiskEvaluation {
  // deterministic risk scoring
}

Risk engine rule:

PROHIBITED policy always produces PROHIBITED risk.
UNKNOWN sensitive risk must produce ESCALATE or BLOCK downstream.


---

11. Human Oversight Engine

Suggested file:

lib/human-oversight.ts

Purpose:

determine human review requirement;

preserve human accountability;

define review-required outputs.


Inputs:

risk evaluation;

context class;

policy status;

data class.


Outputs:

oversight state;

required role;

review reason.


Suggested model:

import type { OversightState } from "./runtime-types";

export type OversightEvaluation = {
  state: OversightState;
  requiredRole:
    | "OPERATOR"
    | "REVIEWER"
    | "APPROVER"
    | "AUDITOR"
    | "MAINTAINER"
    | "SECURITY_OFFICER"
    | "LEGAL_REVIEWER"
    | "DATA_PROTECTION_REVIEWER"
    | "INSTITUTIONAL_AUTHORITY"
    | "INCIDENT_COMMANDER"
    | "NONE";
  reason: string;
};

export function evaluateHumanOversight(input: {
  riskClass: string;
  contextClass: string;
  policyStatus: string;
  dataClass?: string;
}): OversightEvaluation {
  // review requirement logic
}

Default rule:

HIGH, CRITICAL, public-sector, security-sensitive and critical infrastructure contexts require review or escalation.


---

12. Runtime Decision Module

Suggested file:

lib/runtime-decision.ts

Purpose:

combine policy, risk and oversight into a final runtime decision;

provide a consistent decision object to API routes;

prevent ad hoc branching.


Suggested model:

import type { RuntimeDecision } from "./runtime-types";

export type RuntimeDecisionResult = {
  decision: RuntimeDecision;
  allowExecution: boolean;
  allowModelCall: boolean;
  allowFileProcessing: boolean;
  evtRequired: boolean;
  auditRequired: boolean;
  failClosed: boolean;
  reasons: string[];
};

export function decideRuntimeAction(input: {
  policyStatus: string;
  riskClass: string;
  oversightState: string;
  runtimeState?: string;
}): RuntimeDecisionResult {
  // deterministic decision logic
}

Decision rules:

Condition	Decision

prohibited policy	BLOCK
prohibited risk	BLOCK
critical risk without authority	ESCALATE or BLOCK
high risk	AUDIT, ESCALATE or DEGRADE
unknown sensitive risk	ESCALATE or BLOCK
medium risk	AUDIT or ALLOW
low risk	ALLOW
runtime invalid	BLOCK
runtime degraded	DEGRADE


The runtime decision must be generated before execution.


---

13. Data Classifier

Suggested file:

lib/data-classifier.ts

Purpose:

classify data sensitivity;

support file, prompt and EVT minimization;

prevent secrets from entering ordinary processing.


Suggested model:

import type { DataClass } from "./runtime-types";

export type DataClassification = {
  dataClass: DataClass;
  containsSecret: boolean;
  containsPersonalData: boolean;
  containsSecuritySensitiveData: boolean;
  reasons: string[];
};

export function classifyData(input: {
  text?: string;
  fileName?: string;
  mimeType?: string;
}): DataClassification {
  // lightweight deterministic classification
}

Initial implementation should detect obvious secrets by pattern:

OPENAI_API_KEY;

sk-;

api_key;

token;

password;

private_key;

.env;

Authorization: Bearer.


If a secret is detected, processing should degrade, escalate or block.


---

14. File Policy Module

Suggested file:

lib/file-policy.ts

Purpose:

validate file types;

classify file processing status;

prevent execution of uploaded content;

support safe user-facing errors.


Suggested model:

export type FileProcessingStatus =
  | "NOT_PROCESSED"
  | "TEXT_EXTRACTED"
  | "PARTIAL"
  | "UNSUPPORTED"
  | "REJECTED"
  | "FAILED";

export type FilePolicyResult = {
  allowed: boolean;
  status: FileProcessingStatus;
  reason: string;
  maxSizeBytes: number;
};

export function evaluateFilePolicy(input: {
  name?: string;
  type?: string;
  size?: number;
}): FilePolicyResult {
  // file validation rules
}

Recommended safe file types:

.txt
.md
.json
.csv

Unknown or binary files should be rejected or treated only as inert metadata.


---

15. EVT Generator

Suggested file:

lib/evt.ts

Purpose:

create event records for relevant runtime operations;

standardize event shape;

support audit and verification.


Suggested model:

import type {
  RuntimeState,
  RuntimeDecision,
  RiskClass,
  ContextClass,
  IntentClass,
  VerificationStatus,
  AuditStatus
} from "./runtime-types";

export type RuntimeEvent = {
  evt: string;
  prev: string;
  entity: string;
  ipr: string;
  timestamp: string;
  runtime: {
    name: string;
    core: string;
    state: RuntimeState;
  };
  context: {
    class: ContextClass;
    intent: IntentClass;
    sensitivity: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  };
  governance: {
    risk: RiskClass;
    decision: RuntimeDecision;
    policy: string;
    human_oversight: string;
    fail_closed: boolean;
    reasons: string[];
  };
  operation: {
    type: string;
    status: string;
  };
  trace: {
    hash_algorithm: "sha256";
    canonicalization: "deterministic-json";
    hash: string;
  };
  verification: {
    status: VerificationStatus;
    audit_status: AuditStatus;
  };
};

export function createRuntimeEvent(input: {
  prev: string;
  contextClass: ContextClass;
  intentClass: IntentClass;
  riskClass: RiskClass;
  decision: RuntimeDecision;
  policyReference: string;
  humanOversight: string;
  operationType: string;
  operationStatus: string;
  failClosed: boolean;
  reasons: string[];
}): RuntimeEvent {
  // generate EVT with hash
}

Initial EVT IDs may be timestamp-based.

Future versions may use stricter canonical IDs.


---

16. EVT Hash Module

Suggested file:

lib/evt-hash.ts

Purpose:

canonicalize EVT payloads;

compute SHA-256 hash;

preserve deterministic verification.


Suggested model:

import { createHash } from "crypto";

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

export function sha256(value: string): string {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }

  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = sortKeys((value as Record<string, unknown>)[key]);
        return acc;
      }, {});
  }

  return value;
}

Hashing supports integrity.

Hashing does not prove legal authorization.


---

17. EVT Ledger

Suggested file:

lib/evt-ledger.ts

Purpose:

preserve append-only event continuity;

provide previous event reference;

avoid silent mutation.


Prototype implementation options:

Option	Description

In-memory ledger	Useful for demo only
JSONL file ledger	Useful for local prototype
Database ledger	Future controlled deployment
Signed event registry	Future evidence layer


Suggested first implementation:

append-only JSONL ledger

Suggested folder:

ledger/events.jsonl

Suggested functions:

export async function appendEvent(event: RuntimeEvent): Promise<void> {
  // append one JSON line
}

export async function getLastEventReference(): Promise<string> {
  // return last EVT identifier or GENESIS
}

export async function readEvents(limit?: number): Promise<RuntimeEvent[]> {
  // read recent events
}

Historical events should not be silently rewritten.

Corrections must be new events.


---

18. EVT Verification

Suggested file:

lib/evt-verify.ts

Suggested API route:

app/api/verify/route.ts

Purpose:

verify event structure;

verify required fields;

verify hash consistency;

inspect previous event reference;

return public-safe verification output.


Suggested verification result:

export type VerificationResult = {
  status: "VERIFIABLE" | "PARTIAL" | "INVALID" | "UNVERIFIED";
  evt?: string;
  hashMatches?: boolean;
  missingFields: string[];
  warnings: string[];
};

Suggested endpoint behavior:

GET /api/verify?evt=EVT-ID

Response should not expose sensitive payloads by default.


---

19. Evidence Pack Module

Suggested file:

lib/evidence-pack.ts

Suggested API route:

app/api/evidence/route.ts

Purpose:

export selected EVT records;

include hashes;

generate manifest;

prepare audit-ready evidence pack metadata.


Suggested first implementation:

metadata-only evidence pack

Do not export sensitive payloads in the first version.

Suggested manifest fields:

pack ID;

created at;

runtime identity;

scope;

included EVT IDs;

file hashes;

verification status;

audit status;

disclaimer.


Evidence packs support review.

They do not create certification.


---

20. Safe Error Module

Suggested file:

lib/safe-error.ts

Purpose:

avoid leaking stack traces;

return user-safe errors;

preserve diagnostic codes.


Suggested model:

export type SafeErrorCode =
  | "INPUT_ERROR"
  | "POLICY_ERROR"
  | "RISK_ERROR"
  | "MODEL_ERROR"
  | "FILE_ERROR"
  | "EVT_ERROR"
  | "LEDGER_ERROR"
  | "SECURITY_ERROR"
  | "RUNTIME_ERROR";

export type SafeError = {
  code: SafeErrorCode;
  message: string;
  status: number;
};

export function toSafeError(error: unknown): SafeError {
  return {
    code: "RUNTIME_ERROR",
    message: "The runtime could not complete the operation safely.",
    status: 500
  };
}

Safe errors should be useful without exposing secrets.


---

21. API Chat Route Integration

Primary route:

app/api/chat/route.ts

Recommended runtime flow:

receive request
validate input
classify data
classify context
evaluate policy
evaluate risk
evaluate human oversight
decide runtime action
if BLOCK: return safe refusal and optional EVT
if DEGRADE: return limited safe response and EVT
if ESCALATE: return review-required response and EVT
if ALLOW or AUDIT: call model if permitted
generate response
create EVT if required
append EVT to ledger if available
return response and public-safe diagnostics

The model call should happen after policy and risk checks, not before them.


---

22. API Files Route Integration

Primary route:

app/api/files/route.ts

Recommended runtime flow:

receive file metadata and content
evaluate file policy
classify data
reject unsupported or unsafe files
extract safe text only
minimize sensitive content
return file context object
generate EVT if required

File route must not:

execute uploaded content;

trust file names blindly;

expose sensitive contents in logs;

claim complete visibility when extraction is partial.



---

23. Public Diagnostics

The runtime may return public-safe diagnostics.

Allowed public diagnostics:

runtime state
context class
risk class
decision
EVT identifier
verification status
degraded mode reason

Do not expose:

API keys
secrets
full hidden prompts
private file contents
internal tokens
sensitive logs
critical infrastructure details

Diagnostics should help the user understand the runtime without creating exposure.


---

24. Fail-Closed Implementation

Fail-closed triggers:

Trigger	Response

Missing identity	BLOCK
Invalid runtime state	BLOCK
Prohibited policy	BLOCK
Prohibited risk	BLOCK
Unknown sensitive risk	ESCALATE or BLOCK
Secret detected	BLOCK or ESCALATE
Unsupported file	BLOCK or DEGRADE
Human review required but absent	ESCALATE
EVT required but cannot be generated	DEGRADE or AUDIT_ONLY
Ledger unavailable	DEGRADE or AUDIT_ONLY
Model unavailable	DEGRADE
Unsafe security request	BLOCK or DEGRADE


Implementation rule:

Fail-closed must be deterministic and visible in the decision object.


---

25. Safe Refusal and Degraded Output

The runtime should distinguish:

Mode	Meaning

BLOCK	Do not provide unsafe content
DEGRADE	Provide limited safe support
ESCALATE	Require human or specialist review
AUDIT	Provide output with trace and review status


Example degraded security response:

I cannot provide offensive or unauthorized instructions. I can help create a defensive incident report, remediation checklist or hardening plan.

Example public-sector review response:

This output is support material and requires review by the responsible public authority before use.

Example critical infrastructure response:

This output is documentation support only and must not be used as direct operational control.


---

26. Testing Plan

Initial tests should cover:

Module	Test

context classifier	ordinary, GitHub, security, compliance, critical infrastructure messages
policy engine	allowed, restricted, prohibited requests
risk engine	LOW, MEDIUM, HIGH, CRITICAL, PROHIBITED, UNKNOWN
human oversight	review not required, recommended, required, escalated
runtime decision	ALLOW, BLOCK, ESCALATE, DEGRADE, AUDIT
data classifier	public text, secret-like text, personal data markers
file policy	supported, unsupported, oversized, missing metadata
EVT generator	required fields and hash presence
EVT hash	deterministic hash stability
ledger	append and read events
verification	valid, missing field, hash mismatch


Testing should verify governance behavior, not only happy paths.


---

27. Build and Verification Commands

Recommended commands:

npm install
npm audit
npm run build

Optional future commands:

npm run lint
npm run typecheck
npm test

No runtime implementation should be considered stable if the build fails.


---

28. Immediate Implementation Priority

Recommended first code sequence:

Priority	File	Why

1	lib/runtime-types.ts	Shared governance grammar
2	lib/runtime-identity.ts	Stable identity reference
3	lib/context-classifier.ts	Request classification
4	lib/policy-engine.ts	Allowed and prohibited boundary
5	lib/risk-engine.ts	Sensitivity classification
6	lib/human-oversight.ts	Review requirements
7	lib/runtime-decision.ts	Final control object
8	lib/evt-hash.ts	Deterministic hash
9	lib/evt.ts	Event generation
10	app/api/chat/route.ts	Runtime integration


Do not start with dashboard or evidence packs.

Start with the decision chain.


---

29. First Runtime Decision Object

The first integrated runtime should return an object similar to:

{
  "runtime": {
    "state": "OPERATIONAL",
    "entity": "AI_JOKER",
    "ipr": "IPR-AI-0001"
  },
  "classification": {
    "context": "GITHUB",
    "intent": "WRITE",
    "sensitivity": "LOW"
  },
  "governance": {
    "policy": "REPOSITORY_DOCUMENTATION",
    "risk": "LOW",
    "decision": "ALLOW",
    "human_oversight": "NOT_REQUIRED",
    "fail_closed": false
  },
  "evt": {
    "required": true,
    "id": "EVT-20260429-153000-0001",
    "verification": "VERIFIABLE"
  }
}

This object should be used internally first.

Public display can be minimal.


---

30. Integration Rule for Existing Code

When refactoring existing runtime code:

1. preserve working behavior;


2. add types first;


3. add classifier without changing model call behavior;


4. add policy checks;


5. add risk checks;


6. add decision object;


7. only then change execution behavior;


8. add EVT generation after decision object is stable;


9. add ledger after EVT generation is stable;


10. add verification after ledger is stable.



Avoid large uncontrolled rewrites.

Runtime governance must be introduced in layers.


---

31. Non-Offensive Boundary in Code

The policy engine must identify and block or degrade requests involving:

malware
credential theft
unauthorized access
exploit deployment
phishing
evasion
stealth
persistence
sabotage
unlawful surveillance
autonomous targeting
evidence fabrication
bypass human oversight
remove auditability

The safe alternative should be:

defensive report
hardening checklist
remediation plan
incident response template
access control review
logging and detection guidance
audit trail model

Code must preserve the defensive boundary.


---

32. Minimal Runtime Maturity Levels

Level	Description

M0	Documentation only
M1	Types and identity implemented
M2	Context classifier implemented
M3	Policy and risk engines implemented
M4	Runtime decision object implemented
M5	Human oversight integrated
M6	EVT generator integrated
M7	Ledger integrated
M8	Verification endpoint integrated
M9	Evidence packs and dashboard integrated


Current repository should move from M0 to M4 before adding advanced features.


---

33. Implementation Risks

Risk	Mitigation

Overengineering early	Build small deterministic modules
Breaking existing runtime	Integrate one layer at a time
Inconsistent types	Centralize in runtime-types.ts
Policy bypass	Route all sensitive execution through decision object
Weak risk logic	Use conservative defaults
Secret exposure	Add data classifier and safe logging
EVT noise	Generate EVT for relevant operations first
Ledger complexity	Start with simple append-only JSONL
Public metadata exposure	Separate public and internal diagnostics
False compliance claim	Preserve disclaimer in UI and docs


The implementation should be boring, deterministic and inspectable.

That is the point.


---

34. Deployment Readiness for Runtime Code

Before deploying runtime implementation, review:

Does the project build?
Are secrets protected?
Are API routes safe?
Is file handling controlled?
Is context classification deterministic?
Is policy evaluation active?
Is risk classification active?
Is runtime decision object active?
Is fail-closed behavior active?
Is human oversight evaluated?
Is EVT generated where required?
Are diagnostics public-safe?
Are limitations disclosed?

Deployment must follow:

docs/DEPLOYMENT_REVIEW.md


---

35. Release Readiness for Runtime Code

Before tagging a runtime release, review:

README.md
ARCHITECTURE.md
GOVERNANCE.md
PROTOCOL.md
EVT_PROTOCOL.md
SECURITY.md
COMPLIANCE.md
docs/RELEASE_GOVERNANCE.md
docs/DEPLOYMENT_REVIEW.md
docs/RUNTIME_IMPLEMENTATION_PLAN.md

Release must follow:

docs/RELEASE_GOVERNANCE.md

Runtime maturity must not be overstated.


---

36. Non-Certification Statement

AI JOKER-C2 is a governance-oriented architecture and operational prototype.

This implementation plan does not create legal, regulatory, cybersecurity, public-sector, financial, medical or critical infrastructure certification.

Code implementation may support governance and audit readiness.

It does not replace qualified human review, legal review, cybersecurity review, data protection review or institutional authorization.


---

37. Final Runtime Implementation Formula

Documentation defines the boundary.
Types define the grammar.
Classifiers define the context.
Policy defines the permitted space.
Risk defines the sensitivity.
Oversight defines the human review.
Decision defines execution.
EVT defines trace.
Ledger defines continuity.
Verification defines auditability.
Fail-closed defines safety.

Operational formula:

Runtime Implementation =
Types + Identity + Context + Policy + Risk + Oversight + Decision + EVT + Ledger + Verification


---

38. Status

Document status: active runtime implementation plan
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

