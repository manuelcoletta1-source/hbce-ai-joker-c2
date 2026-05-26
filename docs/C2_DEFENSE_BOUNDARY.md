# C2 Defense Boundary

**HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA**  
**HERMETICUM B.C.E. S.r.l.**

## 1. Document identity

**Document:** C2 Defense Boundary  
**Repository scope:** `hbce-ai-joker-c2`  
**Project:** Project HBCE R&D Transfer SaaS  
**Related release:** SaaS Core v0.1  
**Opening date:** 2026-05-26T15:30:00+02:00  
**Source operational event:** UP-EVT-0016 / UP-EVT-0016-AI  
**Source operational event date:** 2026-05-25T15:30:00+02:00  
**Monthly reference checkpoint:** EVT-0015 / EVT-0015-AI  
**Monthly reference date:** 2026-05-19T15:30:00+02:00  
**Target checkpoint:** 2026-06-19T15:30:00+02:00  
**Target cycle:** UP-MESE-5  
**Runtime entity:** AI_JOKER  
**Runtime IPR:** IPR-AI-0001  
**Organization:** HERMETICUM B.C.E. S.r.l.  
**Core:** HBCE-CORE-v3  
**State:** ACTIVE_C2_DEFENSE_BOUNDARY

This document defines the authorized defensive cyber boundary for JOKER-C2 Defense.

JOKER-C2 Defense is not a public premium subscription. It is a governed defensive operational perimeter that requires verified IPR identity, verified organization, declared authorized assets, defensive purpose, runtime audit, EVT continuity and OPC technical proof receipts.

---

## 2. Core boundary statement

Canonical statement:

```text
C2 is not a premium subscription.
C2 is a governed defensive operational perimeter.

Operational statement:

JOKER-C2 Defense may support defensive cyber analysis only when identity, organization, authorization, asset perimeter, purpose, risk and audit requirements are resolved.

Fail-closed statement:

If authorization, asset perimeter, identity, purpose or risk cannot be resolved, JOKER-C2 Defense must fail closed.


---

3. Strategic purpose

The purpose of C2 Defense is to allow authorized defensive cyber work inside the JOKER-C2 runtime while preventing misuse, ambiguous cyber escalation, unauthorized targeting or harmful operational guidance.

C2 Defense exists to support:

defensive governance
security posture review
incident response support
authorized risk assessment
SOC documentation
configuration review
defensive vulnerability triage
critical infrastructure protection planning
audit-ready cyber workflows

C2 Defense does not exist to provide:

unauthorized exploitation
credential theft
malware development
stealth guidance
evasion guidance
targeting of third-party systems
offensive automation
unauthorized access support
harmful operational cyber instructions


---

4. Access requirements

C2 Defense access requires all of the following:

verified IPR subject
verified organization or approved workspace
authorized asset perimeter
defensive purpose
runtime logging enabled
EVT generation mandatory
OPC receipt generation mandatory
risk evaluation mandatory
policy evaluation mandatory
fail-closed enforcement

Payment alone does not grant access to C2 Defense.

A paid subscription may grant access to ordinary SaaS capabilities, but C2 Defense requires verification and authorization beyond payment.

Canonical rule:

Payment may unlock SaaS capacity.
Authorization unlocks C2 Defense.


---

5. Required identity state

The runtime must distinguish between generic access and verified C2 access.

Minimum identity states:

NOT_VERIFIED
CLIENT_TRANSPORT_ONLY
SERVER_VALIDATION_REQUIRED
IPR_VERIFIED_BIOLOGICAL_SUBJECT
IPR_VERIFIED_ORGANIZATION
IPR_VERIFIED_WORKSPACE
C2_DEFENSE_AUTHORIZED

C2 Defense requires:

IPR_VERIFIED_BIOLOGICAL_SUBJECT
IPR_VERIFIED_ORGANIZATION or IPR_VERIFIED_WORKSPACE
C2_DEFENSE_AUTHORIZED

If only a biological subject is verified but no organization or asset perimeter is authorized, the runtime must not grant C2 Defense escalation.


---

6. Authorized asset perimeter

C2 Defense requires a declared and authorized asset perimeter.

The asset perimeter may include:

owned systems
company infrastructure
approved cloud resources
internal repositories
authorized applications
authorized APIs
authorized logs
authorized documentation
approved security reports
approved synthetic test environments

The asset perimeter must not include:

third-party systems without authorization
public targets without authorization
unknown infrastructure
personal accounts of other subjects
external services not owned or approved
systems where permission is unclear

Boundary rule:

No clear perimeter, no C2 escalation.


---

7. Allowed defensive use cases

C2 Defense may support the following categories when authorization and perimeter are clear.

Defensive hardening

Allowed:

security configuration review
defensive architecture review
access control improvement
logging improvement
backup and recovery planning
secure deployment review
dependency risk review
cloud security posture review

Incident response support

Allowed:

incident triage planning
containment checklist creation
forensic report structuring
log review guidance
recovery planning
communication templates
post-incident analysis
defensive remediation planning

Authorized risk assessment

Allowed:

asset inventory review
risk classification
exposure mapping
control gap analysis
security policy mapping
defensive vulnerability prioritization
audit preparation

SOC documentation

Allowed:

alert classification logic
playbook drafting
defensive escalation procedures
incident report templates
audit trail structuring
control evidence organization

Repository and application defense

Allowed:

secure coding review
dependency audit planning
configuration review
secret handling review
CI/CD hardening guidance
runtime boundary review
access policy review

Governance and compliance

Allowed:

cyber policy drafting
defensive risk registers
security governance documentation
audit-ready evidence mapping
role and responsibility mapping
control verification planning


---

8. Disallowed use cases

The runtime must refuse or block requests that seek, enable or meaningfully facilitate harmful or unauthorized cyber activity.

Disallowed:

unauthorized exploitation
credential theft
phishing enablement
malware development or operation
stealth mechanisms
persistence mechanisms for intrusion
evasion of detection
bypassing access controls
targeting third-party systems
offensive automation
exfiltration guidance
unauthorized scanning of third-party assets
weaponization of vulnerabilities
destructive actions

The runtime must also block ambiguous requests where the user does not establish ownership, authorization, defensive purpose or safe context.

Canonical refusal reason:

Cyber request requires verified authorization, declared defensive purpose and a clear authorized perimeter.


---

9. Runtime decision model

C2 Defense must produce a structured runtime decision.

Minimum decisions:

ALLOW_DEFENSIVE
ALLOW_WITH_MANDATORY_AUDIT
ESCALATE_TO_C2
BLOCK_UNAUTHORIZED
FAIL_CLOSED

Decision logic:

If request is non-cyber and low risk:
  handle under ordinary SaaS tier policy.

If request is cyber but general educational:
  allow only high-level safe explanation.

If request is defensive and authorized:
  allow with audit.

If request is defensive, high-risk and authorized:
  allow with mandatory EVT/OPC and C2 policy.

If request is cyber and authorization is missing:
  fail closed.

If request appears offensive:
  block.

If request targets third-party assets without authorization:
  block.

If perimeter is unclear:
  fail closed.


---

10. C2 escalation model

C2 model escalation is not automatic.

C2 escalation requires:

C2_DEFENSE tier
verified IPR
verified organization or workspace
authorized asset perimeter
defensive purpose
risk evaluation
policy approval
mandatory audit
mandatory EVT
mandatory OPC

Model level mapping:

BASE → STANDARD
IPR → STANDARD or ENHANCED
PRO → ENHANCED or ADVANCED
GOVERNANCE → ADVANCED
C2_DEFENSE → C2_ESCALATED only if authorized
STRATEGIC → ADVANCED or C2_ESCALATED according to contract

Boundary:

A more powerful model does not grant more authorization.
Model escalation follows authorization.
Authorization does not follow model escalation.


---

11. EVT requirements

EVT generation is mandatory for C2 Defense.

Each C2-relevant event should include:

evtId
previousEvt
timestamp
eventFamily
cycle
runtimeEntity
runtimeIpr
humanIpr
organizationIpr
workspaceId
SaaS tier
C2 authorization state
asset perimeter state
modelLevel
riskLevel
decision
policyState
inputHash
outputHash
memoryHash
eventHash

For blocked or failed C2 requests, EVT may record the denial event when appropriate.

Boundary:

EVT is an operational continuity record.
EVT is not a legal certification.


---

12. OPC requirements

OPC generation is mandatory for allowed C2 Defense operations.

Each C2-related OPC receipt should include:

opcId
timestamp
linkedEvt
runtimeEntity
runtimeIpr
humanIpr
organizationIpr
workspaceId
C2 authorization state
asset perimeter state
inputHash
outputHash
memoryHash
decisionHash
policyHash
riskState
auditState
modelLevel
proofHash
legalCertification

Boundary:

OPC is a technical proof receipt only.
OPC is not a regulated legal certification.
legalCertification = false.

For blocked high-risk requests, OPC may optionally record a denial proof when the runtime policy requires it.


---

13. Memory requirements

C2 Defense memory must remain governed.

Allowed memory scopes:

IPR_BOUND
WORKSPACE_BOUND
DATABASE_PERSISTENT
DEDICATED_CONTRACTUAL_SCOPE

C2 memory must not be used to bypass future policy checks.

Mandatory memory boundaries:

Memory does not authorize future cyber requests.
Memory does not replace authorization.
Memory does not bypass risk evaluation.
Memory does not bypass policy review.
Memory does not create legal certification.

If database persistence is not configured, the runtime must declare:

Persistence mode: PROCESS_MEMORY_MVP
Boundary: non-persistent serverless memory

If database persistence is configured, the runtime may declare:

Persistence mode: DATABASE_PERSISTENT
Boundary: operational persistence enabled


---

14. Dashboard requirements

The dashboard must expose the C2 Defense boundary clearly.

Minimum dashboard fields:

SaaS tier
C2 Defense status
C2 authorization state
organization verification state
workspace state
asset perimeter state
defensive purpose state
model level
selected model
risk state
policy decision
EVT required
OPC required
audit required
last EVT
last OPC
fail-closed state
boundary message

Suggested C2 dashboard states:

C2_NOT_AVAILABLE
C2_REQUIRES_VERIFICATION
C2_REQUIRES_ORGANIZATION
C2_REQUIRES_AUTHORIZED_PERIMETER
C2_AUTHORIZED_DEFENSIVE_ONLY
C2_BLOCKED_UNAUTHORIZED
C2_FAIL_CLOSED

Dashboard statement:

C2 Defense is available only for verified defensive cyber use within an authorized perimeter.


---

15. Health endpoint requirements

GET /api/health should expose the C2 boundary state.

Minimum fields:

c2DefenseBoundaryConfigured
c2DefenseDefaultState
c2DefenseRequiresVerifiedIpr
c2DefenseRequiresOrganization
c2DefenseRequiresAuthorizedPerimeter
c2DefenseRequiresEvt
c2DefenseRequiresOpc
c2DefenseFailClosed

Suggested health output:

{
  "c2Defense": {
    "configured": true,
    "defaultState": "RESTRICTED",
    "requiresVerifiedIpr": true,
    "requiresOrganization": true,
    "requiresAuthorizedPerimeter": true,
    "requiresDefensivePurpose": true,
    "requiresEvt": true,
    "requiresOpc": true,
    "failClosed": true,
    "boundary": "Authorized defensive cyber use only."
  }
}


---

16. API behavior

POST /api/chat

For C2-relevant requests, /api/chat must:

resolve IPR session
resolve organization or workspace state
evaluate SaaS tier
classify cyber relevance
evaluate defensive purpose
evaluate asset perimeter
evaluate risk
evaluate C2 policy
select model level
block or fail closed when required
generate response only when allowed
generate EVT when required
generate OPC when required
return dashboard metadata

GET /api/health

Must expose C2 Defense boundary state.

GET /api/opc

May expose available proof receipts according to allowed scope.

POST /api/opc

May register proof receipts when policy permits.


---

17. Policy output structure

The C2 policy should produce a structured result.

Authorized defensive case

{
  "tier": "C2_DEFENSE",
  "allowed": true,
  "decision": "ALLOW_WITH_MANDATORY_AUDIT",
  "modelLevel": "C2_ESCALATED",
  "identityState": "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
  "organizationState": "IPR_VERIFIED_ORGANIZATION",
  "assetPerimeterState": "AUTHORIZED",
  "defensivePurpose": true,
  "evtRequired": true,
  "opcRequired": true,
  "auditRequired": true,
  "cyberBoundary": "AUTHORIZED_DEFENSIVE_PERIMETER",
  "reason": "Verified IPR, verified organization and authorized defensive perimeter."
}

Missing authorization case

{
  "tier": "PRO",
  "allowed": false,
  "decision": "FAIL_CLOSED",
  "modelLevel": "BLOCKED",
  "identityState": "IPR_VERIFIED_BIOLOGICAL_SUBJECT",
  "organizationState": "NOT_VERIFIED",
  "assetPerimeterState": "UNRESOLVED",
  "defensivePurpose": false,
  "evtRequired": true,
  "opcRequired": false,
  "auditRequired": true,
  "cyberBoundary": "UNAUTHORIZED_OR_UNCLEAR",
  "reason": "C2 Defense requires verified organization, defensive purpose and authorized asset perimeter."
}

Offensive or harmful case

{
  "tier": "BASE",
  "allowed": false,
  "decision": "BLOCK_UNAUTHORIZED",
  "modelLevel": "BLOCKED",
  "identityState": "NOT_VERIFIED",
  "organizationState": "NOT_VERIFIED",
  "assetPerimeterState": "UNAUTHORIZED",
  "defensivePurpose": false,
  "evtRequired": true,
  "opcRequired": false,
  "auditRequired": true,
  "cyberBoundary": "BLOCKED_HARMFUL_CYBER",
  "reason": "The request appears to seek unauthorized or harmful cyber capability."
}


---

18. Refusal and redirection language

When C2 access is not authorized, the runtime should refuse clearly and redirect to safe defensive alternatives.

Suggested refusal:

I cannot assist with unauthorized or potentially harmful cyber activity. C2 Defense requires verified IPR, verified organization, declared defensive purpose and an authorized asset perimeter. I can help with defensive security planning, hardening checklists, incident response documentation, governance policy, risk assessment structure or audit preparation.

Suggested fail-closed message:

C2 Defense cannot proceed because authorization, organization state or asset perimeter is unresolved. The runtime is failing closed. Provide a verified defensive context through the authorized onboarding and workspace flow.

Suggested safe redirection:

Allowed defensive alternatives include security posture review, hardening guidance, incident response planning, SOC documentation, authorized risk assessment and governance controls.


---

19. Commercial boundary

C2 Defense must not be marketed as ordinary premium access.

Allowed positioning:

restricted defensive cyber tier
authorized security operations support
audit-ready cyber governance runtime
defensive C2 operational perimeter
contractual or verified access level

Disallowed positioning:

unrestricted cyber AI
offensive cyber assistant
pay-to-unlock cyber operations
premium hacking plan
public C2 access

Commercial sentence:

JOKER-C2 Defense is available only for verified defensive cyber operations within an authorized perimeter and under mandatory audit.


---

20. Repository implementation targets

This document supports the following implementation files:

lib/c2-defense-policy.ts
lib/runtime-risk-policy.ts
lib/runtime-model-router.ts
lib/saas-tier-policy.ts
app/api/chat/route.ts
app/api/health/route.ts
app/interface/page.tsx
components/SaasTierPanel.tsx
components/ModelEscalationPanel.tsx
components/AuditTrailPanel.tsx

Expected runtime stages:

1. Resolve IPR session.
2. Resolve organization or workspace.
3. Evaluate SaaS tier.
4. Classify cyber relevance.
5. Evaluate authorization and perimeter.
6. Evaluate risk.
7. Apply C2 Defense policy.
8. Select model level.
9. Allow, block or fail closed.
10. Generate EVT where required.
11. Generate OPC where required.
12. Return dashboard metadata.


---

21. Acceptance criteria

The C2 Defense Boundary is accepted when:

C2 is clearly defined as restricted defensive perimeter.
Payment alone does not grant C2 access.
Verified IPR is required.
Verified organization or workspace is required.
Authorized asset perimeter is required.
Defensive purpose is required.
EVT is mandatory for C2 operations.
OPC is mandatory for allowed C2 operations.
Offensive or unauthorized cyber requests are blocked.
Unclear authorization fails closed.
Dashboard exposes C2 status.
Health endpoint exposes C2 boundary state.
The policy can guide model escalation.
The runtime can refuse unsafe cyber requests safely.


---

22. Mandatory boundaries

The following boundaries are mandatory:

C2 Defense is restricted to authorized defensive cyber use.
C2 Defense is not a public premium subscription.
Payment alone does not grant C2 Defense access.
IPR is an operational identity record, not a public authority identity document.
IPR Card is an internal operational credential, not a replacement for official identity documents.
EVT is an operational continuity record, not legal certification.
OPC is a technical proof receipt only.
legalCertification = false.
Model escalation does not bypass governance.
Memory does not authorize future cyber requests.
The runtime must fail closed when authorization, perimeter or risk cannot be resolved.


---

23. Linked documents

This document is linked to:

docs/PROJECT_HBCE_RD_TRANSFER_SAAS.md
docs/SAAS_CORE_V0_1.md
docs/SAAS_TIER_MODEL.md
docs/DATABASE_PERSISTENCE_PLAN.md
docs/SELF_PILOT_HBCE_SAAS.md


---

24. Canonical record

{
  "document": "C2_DEFENSE_BOUNDARY",
  "project": "Project HBCE R&D Transfer SaaS",
  "related_release": "SaaS Core v0.1",
  "opened_at": "2026-05-26T15:30:00+02:00",
  "source_event": "UP-EVT-0016",
  "source_event_ai": "UP-EVT-0016-AI",
  "source_event_date": "2026-05-25T15:30:00+02:00",
  "monthly_reference": "EVT-0015 / EVT-0015-AI",
  "monthly_reference_date": "2026-05-19T15:30:00+02:00",
  "target_checkpoint_date": "2026-06-19T15:30:00+02:00",
  "target_cycle": "UP-MESE-5",
  "runtime_entity": "AI_JOKER",
  "runtime_ipr": "IPR-AI-0001",
  "org": "HERMETICUM B.C.E. S.r.l.",
  "core": "HBCE-CORE-v3",
  "state": "ACTIVE_C2_DEFENSE_BOUNDARY",
  "c2": {
    "public_premium_plan": false,
    "authorized_defensive_use_only": true,
    "requires_verified_ipr": true,
    "requires_verified_organization": true,
    "requires_authorized_perimeter": true,
    "requires_defensive_purpose": true,
    "requires_evt": true,
    "requires_opc": true,
    "fail_closed": true
  },
  "boundary": {
    "legalCertification": false,
    "opc": "technical proof receipt only",
    "evt": "operational continuity record only",
    "payment_alone_grants_c2": false
  }
}


---

25. Completion statement

The C2 Defense Boundary defines JOKER-C2 Defense as a restricted, verified, defensive cyber perimeter governed by IPR, organization verification, authorized assets, runtime risk policy, model escalation control, EVT continuity and OPC technical proof receipts.

C2 Defense is accepted only when it can support authorized defensive workflows while blocking offensive, unauthorized, unclear or harmful cyber requests through fail-closed policy.

