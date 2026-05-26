# Database Persistence Plan

**HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA**  
**HERMETICUM B.C.E. S.r.l.**

## 1. Document identity

**Document:** Database Persistence Plan  
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
**Target release:** SaaS Core v0.1  
**Runtime entity:** AI_JOKER  
**Runtime IPR:** IPR-AI-0001  
**Organization:** HERMETICUM B.C.E. S.r.l.  
**Core:** HBCE-CORE-v3  
**State:** ACTIVE_PERSISTENCE_PLAN

This document defines the persistence plan required to transfer AI JOKER-C2 from a governed R&D prototype into a SaaS Core v0.1 runtime with database-backed continuity.

The goal is to prepare persistent storage for IPR subjects, runtime sessions, IPR-bound memory records, EVT continuity records, OPC technical proof receipts, audit logs, organizations, workspaces, subscriptions and model usage records.

---

## 2. Core persistence thesis

JOKER-C2 memory is not generic chat history.

JOKER-C2 memory is operational continuity connected to:

```text
IPR identity
runtime session
SaaS tier
model level
risk decision
memory scope
EVT continuity
OPC proof receipt
audit state
workspace or organization context

SaaS Core v0.1 must be able to operate in two modes:

PROCESS_MEMORY_MVP
DATABASE_PERSISTENT

During the R&D-to-SaaS transition, the runtime may still use MVP memory, but the boundary must remain explicit.

If persistent storage is unavailable, the runtime must declare:

Persistence mode: PROCESS_MEMORY_MVP
Boundary: non-persistent serverless memory

If persistent storage is available, the runtime may declare:

Persistence mode: DATABASE_PERSISTENT
Boundary: operational persistence enabled


---

3. Persistence objective

The objective of this plan is to prepare the minimum data model required for SaaS Core v0.1.

The persistence layer must support:

verified IPR subject continuity
runtime session tracking
IPR-bound memory
workspace-bound memory
EVT record storage
OPC receipt storage
audit log storage
organization and workspace mapping
subscription tier mapping
model usage accounting
dashboard state reconstruction

The persistence layer must not create legal certification.

Boundary:

Database persistence supports operational continuity and audit reconstruction.
Database persistence does not create legal certification.


---

4. Minimum data objects

SaaS Core v0.1 requires the following minimum data objects:

ipr_subjects
ipr_sessions
ipr_memory_records
evt_records
opc_receipts
runtime_audit_logs
organizations
workspaces
subscriptions
model_usage

These objects are the minimum required to convert runtime state into SaaS state.


---

5. ipr_subjects

The ipr_subjects table stores verified operational subject references.

Purpose

Identify verified biological or operational subjects inside the HBCE/JOKER-C2 runtime.

Minimum fields

id
iprId
displayName
subjectType
status
certificateId
certificateStatus
identityBinding
createdAt
updatedAt

Suggested values

subjectType:
BIOLOGICAL_SUBJECT
ORGANIZATION_SUBJECT
RUNTIME_ENTITY

status:
ACTIVE
LIMITED
SUSPENDED
REVOKED
MISSING

identityBinding:
IPR_VERIFIED_BIOLOGICAL_SUBJECT
IPR_VERIFIED_ORGANIZATION
IPR_VERIFIED_WORKSPACE
NOT_VERIFIED

Boundary

IPR subject records are operational identity records.
They are not public authority identity documents.


---

6. ipr_sessions

The ipr_sessions table stores runtime access sessions.

Purpose

Track authenticated or limited runtime sessions connected to IPR state.

Minimum fields

id
sessionId
runtimeEntity
runtimeIpr
humanIpr
organizationIpr
workspaceId
certificateId
accessDecision
identityBinding
handoffSource
handoffAuthority
matrixState
createdAt
updatedAt
expiresAt

Suggested access decisions

ACCESS_GRANTED
LIMITED_ACCESS
SERVER_VALIDATION_REQUIRED
CLIENT_TRANSPORT_ONLY
NOT_VERIFIED
ACCESS_DENIED
FAIL_CLOSED

Required behavior

If server-side IPR validation succeeds, the session may become IPR-bound.
If validation fails, the session must remain limited or fail closed.
If handoff exists only client-side, the runtime must require server-side validation.


---

7. ipr_memory_records

The ipr_memory_records table stores IPR-bound and workspace-bound memory records.

Purpose

Preserve operational continuity across runtime sessions without treating memory as unrestricted authorization.

Minimum fields

id
memoryId
timestamp
runtimeEntity
runtimeIpr
humanIpr
organizationIpr
workspaceId
scope
authority
persistenceMode
summary
sourceEvent
evtRef
opcRef
memoryHash
createdAt
updatedAt

Suggested memory scopes

RUNTIME_ONLY
PROCESS_MEMORY_MVP
IPR_BOUND
WORKSPACE_BOUND
DATABASE_PERSISTENT
DEDICATED_CONTRACTUAL_SCOPE

Suggested authority values

SERVER_RUNTIME_VALIDATED
CLIENT_TRANSPORT_ONLY
RUNTIME_ONLY
DATABASE_VALIDATED
WORKSPACE_AUTHORIZED

Mandatory boundary

Memory does not authorize future unsafe requests.
Memory does not bypass policy review.
Memory does not reduce risk evaluation.
Memory does not replace human oversight.
Memory does not create legal certification.


---

8. evt_records

The evt_records table stores event continuity records.

Purpose

Store operational event records for audit reconstruction and runtime continuity.

Minimum fields

id
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
saasTier
modelLevel
contextClass
riskLevel
decision
inputHash
outputHash
memoryHash
eventHash
createdAt

Suggested decisions

ALLOW
ALLOW_WITH_AUDIT
ALLOW_WITH_MANDATORY_AUDIT
ESCALATE
BLOCK
FAIL_CLOSED

Boundary

EVT is an operational continuity record.
EVT is not a legal certification.


---

9. opc_receipts

The opc_receipts table stores technical proof receipts.

Purpose

Store technical proof receipts linking IPR, EVT, runtime state, memory state, decision state and proof hashes.

Minimum fields

id
opcId
timestamp
linkedEvt
runtimeEntity
runtimeIpr
humanIpr
organizationIpr
workspaceId
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
createdAt

Required value

legalCertification = false

Boundary

OPC is a technical proof receipt only.
OPC is not a regulated legal certification.


---

10. runtime_audit_logs

The runtime_audit_logs table stores runtime governance decisions.

Purpose

Preserve audit-relevant runtime decisions, tier evaluations, risk classifications, model routing decisions and C2 boundary outcomes.

Minimum fields

id
auditId
timestamp
sessionId
runtimeEntity
runtimeIpr
humanIpr
organizationIpr
workspaceId
saasTier
modelLevel
riskLevel
decision
policyState
cyberBoundary
evtRef
opcRef
createdAt

Suggested cyber boundary values

C2_NOT_AVAILABLE
C2_REQUIRES_VERIFICATION
C2_REQUIRES_ORGANIZATION
C2_REQUIRES_AUTHORIZED_PERIMETER
C2_AUTHORIZED_DEFENSIVE_ONLY
C2_BLOCKED_UNAUTHORIZED
C2_FAIL_CLOSED


---

11. organizations

The organizations table stores verified or limited organization references.

Purpose

Support organization-level SaaS governance, workspace access and C2 Defense authorization.

Minimum fields

id
organizationIpr
name
status
verificationState
createdAt
updatedAt

Suggested status values

ACTIVE
PENDING_VERIFICATION
LIMITED
SUSPENDED
REVOKED

Required behavior

GOVERNANCE tier requires organization or workspace state.
C2_DEFENSE requires verified organization or approved workspace.
STRATEGIC requires contractual or pilot authorization.


---

12. workspaces

The workspaces table stores SaaS workspace references.

Purpose

Support team, company, institutional or pilot workspaces.

Minimum fields

id
workspaceId
organizationIpr
name
tier
status
createdAt
updatedAt

Suggested tiers

BASE
IPR
PRO
GOVERNANCE
C2_DEFENSE
STRATEGIC

Suggested status values

ACTIVE
LIMITED
PENDING
SUSPENDED
REVOKED


---

13. subscriptions

The subscriptions table stores SaaS commercial state.

Purpose

Track SaaS tier, billing mode and access status.

Minimum fields

id
subscriptionId
workspaceId
humanIpr
organizationIpr
tier
status
billingMode
createdAt
updatedAt

Suggested billing modes

FREE
SELF_PILOT
DEMO
MONTHLY
ANNUAL
PILOT_CONTRACT
STRATEGIC_CONTRACT

Boundary

Payment alone does not grant C2 Defense access.
C2 Defense requires verified authorization and defensive perimeter.


---

14. model_usage

The model_usage table stores model usage accounting.

Purpose

Track selected model, model level, routing reason and cost-relevant metadata.

Minimum fields

id
usageId
sessionId
humanIpr
organizationIpr
workspaceId
tier
selectedModel
modelLevel
routingReason
riskLevel
evtRef
opcRef
createdAt

Suggested model levels

STANDARD
ENHANCED
ADVANCED
C2_ESCALATED
BLOCKED

Boundary

Model escalation does not bypass governance.
A stronger model does not grant stronger authorization.


---

15. Persistence modes

The runtime must explicitly expose its current persistence mode.

PROCESS_MEMORY_MVP

Used when database persistence is not available.

Memory exists only inside runtime process or temporary execution context.
Serverless deployments may lose memory across cold starts, deployments or runtime resets.

Required dashboard message:

Persistence: PROCESS_MEMORY_MVP
Boundary: non-persistent serverless memory

DATABASE_PERSISTENT

Used when database persistence is configured and available.

Memory, EVT, OPC and audit records may be stored in database-backed persistence.

Required dashboard message:

Persistence: DATABASE_PERSISTENT
Boundary: operational persistence enabled

FAIL_CLOSED_PERSISTENCE

Used when persistence is required but unavailable.

The operation cannot continue because persistence is required by policy, tier or C2 Defense boundary.

Required dashboard message:

Persistence: FAIL_CLOSED_PERSISTENCE
Boundary: required persistence unavailable


---

16. Database adapter boundary

The persistence layer should be accessed through adapters, not scattered direct database calls.

Expected adapter files:

lib/ipr-database.ts
lib/ipr-bound-memory.ts
lib/evt-ledger.ts
lib/opc-proof.ts
lib/runtime-audit-log.ts
lib/model-usage-log.ts

Required adapter behavior:

detect database configuration
detect database availability
declare fallback boundary
write record if available
return structured failure if unavailable
never silently pretend persistence exists

Canonical principle:

If persistence is unavailable, the runtime must say so.


---

17. Runtime write flow

For each operational request, the runtime should follow this persistence-aware flow:

1. Resolve IPR session.
2. Evaluate SaaS tier.
3. Evaluate risk and C2 boundary.
4. Select model level.
5. Generate response if allowed.
6. Build memory record if allowed.
7. Build EVT record if required.
8. Build OPC receipt if required.
9. Write memory record if persistence is available.
10. Write EVT record if persistence is available.
11. Write OPC receipt if persistence is available.
12. Write audit log if required.
13. Write model usage record.
14. Return runtime metadata to dashboard.

If database is not available and the selected tier requires persistence, the runtime must fail closed.


---

18. Dashboard requirements

The dashboard must expose persistence state.

Minimum dashboard fields:

databaseConfigured
databaseAvailable
persistenceMode
memoryPersistenceBoundary
evtPersistenceBoundary
opcPersistenceBoundary
auditLogPersistenceBoundary
lastMemoryRecord
lastEvtRecord
lastOpcReceipt
lastAuditRecord
modelUsageRecorded

Suggested dashboard states:

DATABASE_NOT_CONFIGURED
DATABASE_CONFIGURED_UNAVAILABLE
DATABASE_AVAILABLE
PROCESS_MEMORY_MVP
DATABASE_PERSISTENT
FAIL_CLOSED_PERSISTENCE

Dashboard principle:

If the user cannot see whether persistence exists, the SaaS value is unclear.


---

19. Health endpoint requirements

GET /api/health must expose database and persistence status.

Minimum fields:

databaseConfigured
databaseAvailable
databaseBoundary
persistenceMode
memoryMode
evtPersistenceEnabled
opcPersistenceEnabled
auditPersistenceEnabled
modelUsagePersistenceEnabled

Suggested output:

{
  "database": {
    "configured": false,
    "available": false,
    "boundary": "PROCESS_MEMORY_MVP",
    "persistenceMode": "PROCESS_MEMORY_MVP",
    "message": "Database persistence is not configured. Runtime uses non-persistent MVP memory."
  }
}

If configured:

{
  "database": {
    "configured": true,
    "available": true,
    "boundary": "DATABASE_PERSISTENT",
    "persistenceMode": "DATABASE_PERSISTENT",
    "message": "Database persistence is available for memory, EVT, OPC and audit records."
  }
}


---

20. C2 Defense persistence rule

C2 Defense requires mandatory audit.

For C2 Defense operations:

EVT is mandatory.
OPC is mandatory.
Audit logging is mandatory.
Model usage logging is mandatory.

If C2 Defense requires database persistence and persistence is unavailable, the runtime must fail closed.

Suggested fail-closed state:

C2_FAIL_CLOSED_PERSISTENCE_REQUIRED

Suggested message:

C2 Defense cannot proceed because required persistence or audit storage is unavailable.


---

21. Data minimization

The persistence layer must avoid unnecessary data exposure.

Principles:

store operational identifiers
store hashes for proof and audit
avoid storing unnecessary sensitive raw data
minimize public proof metadata
keep legal certification boundary explicit
separate internal records from public verification records

Public registry or verification surfaces should expose minimized proof records, not full private runtime data.


---

22. Security boundary

The persistence layer must follow basic security requirements.

Minimum requirements:

environment-based credentials
no database secrets in repository
server-side database access only
no client-side database credentials
structured error handling
fail-closed behavior for required persistence
minimal public metadata exposure
audit logs for critical operations

Forbidden:

hardcoded secrets
public database credentials
client-side write access to private persistence
silent persistence failure
pretending temporary memory is durable storage

Because apparently humans do keep doing this, so yes, it must be written.


---

23. Migration path

The recommended migration path is:

Phase 1: PROCESS_MEMORY_MVP declared clearly.
Phase 2: Database adapter introduced.
Phase 3: Memory records written to database.
Phase 4: EVT records written to database.
Phase 5: OPC receipts written to database.
Phase 6: Audit logs written to database.
Phase 7: Workspace and subscription state introduced.
Phase 8: Dashboard reads persistent records.
Phase 9: C2 Defense requires persistence for authorized operations.
Phase 10: SaaS Core v1.0 moves toward production-grade persistence.


---

24. SaaS Core v0.1 acceptance criteria

The database persistence plan is accepted for SaaS Core v0.1 when:

database boundary is documented
PROCESS_MEMORY_MVP is explicit
DATABASE_PERSISTENT target is defined
minimum tables are defined
memory persistence model is defined
EVT persistence model is defined
OPC persistence model is defined
audit log model is defined
model usage model is defined
dashboard persistence fields are defined
health endpoint persistence fields are defined
C2 Defense persistence requirements are defined
fail-closed persistence behavior is defined


---

25. Mandatory boundaries

The following boundaries are mandatory:

Database persistence does not create legal certification.
IPR is an operational identity record, not a public authority identity document.
IPR Card is an internal operational credential, not a replacement for official identity documents.
EVT is an operational continuity record, not legal certification.
OPC is a technical proof receipt only.
legalCertification = false.
Memory does not authorize unsafe future requests.
Model escalation does not bypass policy.
C2 Defense requires authorized defensive use.
C2 Defense may fail closed when required persistence is unavailable.


---

26. Linked documents

This document is linked to:

docs/PROJECT_HBCE_RD_TRANSFER_SAAS.md
docs/SAAS_CORE_V0_1.md
docs/SAAS_TIER_MODEL.md
docs/C2_DEFENSE_BOUNDARY.md
docs/SELF_PILOT_HBCE_SAAS.md

Expected implementation files:

lib/ipr-database.ts
lib/ipr-bound-memory.ts
lib/evt-ledger.ts
lib/opc-proof.ts
lib/runtime-audit-log.ts
lib/model-usage-log.ts
app/api/health/route.ts
app/api/chat/route.ts
app/interface/page.tsx
components/AuditTrailPanel.tsx
components/ModelEscalationPanel.tsx
components/SaasTierPanel.tsx


---

27. Canonical record

{
  "document": "DATABASE_PERSISTENCE_PLAN",
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
  "target_release": "SaaS Core v0.1",
  "runtime_entity": "AI_JOKER",
  "runtime_ipr": "IPR-AI-0001",
  "org": "HERMETICUM B.C.E. S.r.l.",
  "core": "HBCE-CORE-v3",
  "state": "ACTIVE_PERSISTENCE_PLAN",
  "persistence_modes": [
    "PROCESS_MEMORY_MVP",
    "DATABASE_PERSISTENT",
    "FAIL_CLOSED_PERSISTENCE"
  ],
  "minimum_objects": [
    "ipr_subjects",
    "ipr_sessions",
    "ipr_memory_records",
    "evt_records",
    "opc_receipts",
    "runtime_audit_logs",
    "organizations",
    "workspaces",
    "subscriptions",
    "model_usage"
  ],
  "boundary": {
    "legalCertification": false,
    "opc": "technical proof receipt only",
    "evt": "operational continuity record only",
    "memory_authorizes_future_requests": false,
    "c2_requires_audit": true
  }
}


---

28. Completion statement

The Database Persistence Plan defines the transition from process-level MVP memory to database-backed operational continuity for JOKER-C2 SaaS Core v0.1.

The persistence layer supports IPR-bound memory, EVT continuity, OPC technical proof receipts, runtime audit logs, SaaS workspace state, subscription state and model usage accounting while preserving the mandatory boundary that persistence does not create legal certification.

