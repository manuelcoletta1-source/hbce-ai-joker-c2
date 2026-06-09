HBCE IPR Runtime API v1

Admin & Operator Console Plan

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: admin console, operator console, tenant management, API credentials, audit visibility, quota visibility, webhook management
Target: HBCE operators / B2G pilot administrators / regulated client operators
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the Admin & Operator Console Plan for HBCE IPR Runtime API v1.

The console is the operational control surface for managing B2G pilots, SaaS tenants and governed runtime execution.

The console must allow authorized HBCE operators to manage:

tenants
workspaces
accounts
subscriptions
operators
API credentials
rate-limit profiles
quota status
webhook endpoints
audit records
model usage records
EVT/OPC proof references
Source Intelligence permissions
document registry visibility
exports
pilot reports
runtime health

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Why the console is required

The current JOKER-C2 dashboard proves runtime state.

It shows:

IPR status
runtime health
MATRIX state
memory state
document registry
Source Intelligence state
API v1 public surface status
audit persistence
usage persistence
SaaS context

That is enough for self-pilot visibility.

It is not enough for external B2G SaaS operation.

A B2G SaaS pilot requires an operator console where authorized users can:

create a client tenant
create a workspace
issue API credentials
assign allowed sourceSets
assign rate limits
view audit and usage
export pilot evidence
monitor webhook delivery
suspend unsafe access
review runtime proof chains

Without a console, the system becomes technically powerful and operationally annoying. A familiar human achievement.

---

3. Current validated baseline

Current runtime baseline:

JOKER-C2 SaaS Core v0.1 = HEALTHY
Runtime = ACTIVE_RESPONSE_READY
B2G active response readiness = READY
IPR = ACCESS_GRANTED
Certificate status = ACTIVE
Scope = JOKER_C2_ACCESS
Identity binding = IPR_VERIFIED_BIOLOGICAL_SUBJECT
MATRIX = MATRIX_ACTIVE
Memory = IPR_BOUND
Persistence = DATABASE_PERSISTENT
EVT = PERSISTED
OPC = PERSISTED
Audit = PERSISTED
Model usage = PERSISTED
Source Intelligence = SOURCESET_REGISTRY_READY
API v1 public surface = 16/16 PASS
Document registry = AVAILABLE
legalCertification=false

Current dashboard state:

Dashboard = PASS
API v1 product card = PASS
Runtime SaaS Core = PASS
Source Intelligence = 5/5 sourceSets
API v1 endpoints = 16/16 PASS

The Admin & Operator Console is the next operational layer above this baseline.

---

4. Console types

The plan separates two console modes.

Admin Console

Used by HBCE administrators.

Primary purpose:

manage SaaS structure and pilot configuration

Admin can manage:

tenants
workspaces
subscriptions
API credentials
rate limits
webhook endpoints
export policies
operator roles
runtime status
security actions

Operator Console

Used by pilot operators and technical reviewers.

Primary purpose:

operate and review a scoped pilot workspace

Operator can view:

runtime health
workspace requests
audit records
model usage records
EVT/OPC references
Source Intelligence descriptors
document profile status
export packages
quota status
webhook status

Operator permissions must be role-scoped.

No “everyone is admin” nonsense. That is not agility; that is negligence with a login screen.

---

5. Console roles

Recommended roles:

HBCE_SUPER_ADMIN
HBCE_OPERATOR
PILOT_OWNER
TECHNICAL_OPERATOR
AUDIT_REVIEWER
SECURITY_REVIEWER
READ_ONLY_VIEWER

HBCE_SUPER_ADMIN

Can manage:

all tenants
all workspaces
all credentials
all subscriptions
all console settings

HBCE_OPERATOR

Can manage assigned pilots:

tenant onboarding
workspace setup
API credential issuance
rate-limit assignment
webhook review
export support

PILOT_OWNER

Client-side or internal owner.

Can view:

pilot summary
tenant/workspace status
quota
audit summaries
usage summaries
exports

TECHNICAL_OPERATOR

Can execute or review technical pilot actions.

Can use:

IPR session
chat
operation status
Source Intelligence descriptor
OPC lookup
audit lookup
usage lookup

AUDIT_REVIEWER

Can view/export:

audit records
EVT references
OPC references
evidence packages

SECURITY_REVIEWER

Can view:

security boundary
credential status
webhook status
rate-limit events
quota warnings
policy denials

READ_ONLY_VIEWER

Can view summaries only.

Cannot:

create credentials
export detailed records
trigger operations
modify tenant settings

---

6. Console modules

The console should be split into modules.

Recommended modules:

Runtime Overview
Tenant Management
Workspace Management
Account & Subscription
Operator Management
API Credentials
Rate Limit & Quota
Source Intelligence Permissions
Document Registry
Audit Records
Model Usage
EVT/OPC Proof Chain
Webhook Events
Export Center
Pilot Reports
Security Boundary
System Diagnostics

First version should not attempt everything at once.

Recommended first modules:

Runtime Overview
Tenant Management
API Credentials
Rate Limit & Quota
Audit Records
Model Usage
Export Center

---

7. Runtime Overview module

Purpose:

Show current runtime health and SaaS readiness.

Fields:

runtime status
model
runtime IPR
human IPR
MATRIX state
memory state
document registry state
Source Intelligence state
API v1 surface state
audit persistence
usage persistence
SaaS context
legalCertification=false

Current example:

JOKER_C2_SAAS_CORE_HEALTHY
Runtime IPR = IPR-AI-0001
Memory = IPR_BOUND
Docs = AVAILABLE
Source Intelligence = SOURCESET_REGISTRY_READY
API v1 = 16/16 PASS
Audit = PERSISTED
Usage = PERSISTED

---

8. Tenant Management module

Purpose:

Create and manage tenant records.

Actions:

create tenant
view tenant
suspend tenant
close tenant
archive tenant
assign workspace
assign subscription
view tenant health

Tenant fields:

tenantId
clientName
clientType
country
region
status
environment
dataBoundary
createdAt
createdBy
legalCertification=false

Allowed statuses:

DRAFT
ACTIVE
SUSPENDED
CLOSED
ARCHIVED

Fail-closed rule:

Only ACTIVE tenants can execute runtime requests.

---

9. Workspace Management module

Purpose:

Create and manage workspace boundaries inside a tenant.

Actions:

create workspace
view workspace
suspend workspace
assign allowed sourceSets
enable or disable document handling
assign rate-limit profile
view workspace audit
view workspace usage

Workspace fields:

workspaceId
tenantId
workspaceName
status
riskDomain
integrationMode
sourceIntelligenceEnabled
documentHandlingEnabled
createdAt
legalCertification=false

Fail-closed rule:

Only ACTIVE workspaces can execute runtime requests.

---

10. Account & Subscription module

Purpose:

Manage commercial and service scope.

Account fields:

accountId
tenantId
clientName
commercialOwner
supportLevel
billingMode
createdAt
legalCertification=false

Subscription fields:

subscriptionId
tenantId
accountId
tier
status
startDate
endDate
includedRequestsPerDay
includedOperationsPerDay
includedSourceIntelligenceRunsPerDay
includedFileUploadsPerDay
supportLevel
legalCertification=false

Allowed subscription statuses:

ACTIVE
SUSPENDED
EXPIRED
CANCELLED

Fail-closed rule:

Suspended, expired or cancelled subscriptions cannot execute runtime requests.

---

11. Operator Management module

Purpose:

Manage human and technical operators.

Actions:

create operator
assign role
assign workspace
disable operator
view operator activity
review operator access

Operator fields:

operatorId
tenantId
workspaceId
displayName
role
status
allowedScopes
createdAt
disabledAt
legalCertification=false

Allowed statuses:

ACTIVE
SUSPENDED
DISABLED
REMOVED

---

12. API Credentials module

Purpose:

Issue and manage client API access.

Actions:

create API key
show secret once
revoke credential
suspend credential
rotate credential
view last used
view scopes
view tenant/workspace binding

Credential fields:

credentialId
keyId
credentialType
environment
status
clientName
tenantId
workspaceId
accountId
subscriptionId
tier
scopes
allowedSourceSets
rateLimitProfile
createdAt
expiresAt
revokedAt
lastUsedAt
legalCertification=false

Security rules:

raw secret visible only once
secret never stored in plaintext
secret never logged
revoked credentials fail closed
expired credentials fail closed

---

13. Rate Limit & Quota module

Purpose:

Show and manage consumption limits.

Visible fields:

rateLimitProfile
requests today
requests remaining
chat requests today
operations today
Source Intelligence runs
file uploads
monthly cost units
quota warnings
quota exceeded state

Actions:

assign profile
view quota ledger
apply temporary override
suspend credential on abuse
export quota report

Recommended states:

QUOTA_HEALTHY
QUOTA_WARNING
QUOTA_LIMITED
QUOTA_EXCEEDED

---

14. Source Intelligence Permissions module

Purpose:

Manage sourceSet permissions per workspace.

Available sourceSets:

ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK
EU_AI_GOVERNANCE_REGULATORY_STACK
ENISA_CYBER_THREAT_LANDSCAPE
ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK
OPENAI_AGENTIC_SYSTEMS_SECURITY

Actions:

allow sourceSet
remove sourceSet
view source catalog
view sourceSet status
review PDF boundary
review raw text persistence policy

Boundary:

Source Intelligence does not certify external legal authority of sources.
rawTextPersistence=false by default.

---

15. Document Registry module

Purpose:

View and manage document profile visibility.

Fields:

documentProfileId
filename
fileHash
docFamily
documentKind
textStatus
profileStatus
linkedMemoryId
tenantId
workspaceId
createdAt
legalCertification=false

Actions:

view document profile
disable document profile
review linked memory
review text status
review PDF boundary
export profile metadata

Boundary:

Document profile does not imply legal validation.
Document recall must remain explicit.

---

16. Audit Records module

Purpose:

Review technical runtime audit records.

Filters:

tenantId
workspaceId
from
to
auditId
evtId
opcId
usageId
policyDecision
riskLevel
model
credentialId
operatorId

Fields:

auditId
tenantId
workspaceId
runtimeIpr
humanIpr
policyDecision
operationDecision
securityOutcome
riskLevel
evtId
opcId
usageId
createdAt
legalCertification=false

Actions:

view audit record
copy audit ID
open linked EVT
open linked OPC
open linked usage
export audit records

---

17. Model Usage module

Purpose:

Review model usage and SaaS accounting records.

Filters:

tenantId
workspaceId
from
to
usageId
auditId
evtId
opcId
model
modelLevel
credentialId
operatorId

Fields:

usageId
tenantId
workspaceId
provider
providerState
model
modelLevel
inputTokens
outputTokens
totalTokens
costUnits
costMinor
evtId
opcId
auditId
createdAt
legalCertification=false

Actions:

view usage record
copy usage ID
open linked audit
open linked EVT
open linked OPC
export usage records

---

18. EVT/OPC Proof Chain module

Purpose:

Review technical proof continuity.

EVT fields:

evtId
eventType
eventHash
tenantId
workspaceId
createdAt
linkedOpcId
legalCertification=false

OPC fields:

opcId
eventHash
chainHash
verificationStatus
tenantId
workspaceId
createdAt
legalCertification=false

Actions:

lookup EVT
lookup OPC
copy chain hash
export proof references
create evidence package

Boundary:

EVT is a technical event trace only.
OPC is a technical proof receipt only.

---

19. Webhook Events module

Purpose:

Manage webhook endpoints and delivery state.

Actions:

create webhook endpoint
test webhook endpoint
disable endpoint
view delivery attempts
retry failed delivery
view subscribed event types

Fields:

webhookEndpointId
tenantId
workspaceId
url
status
eventTypes
createdAt
lastDeliveryStatus
failureCount
legalCertification=false

States:

WEBHOOKS_READY
WEBHOOKS_DISABLED
WEBHOOKS_DEGRADED
WEBHOOK_DELIVERY_FAILED

---

20. Export Center module

Purpose:

Create and manage tenant-scoped evidence exports.

Export types:

audit export
usage export
EVT/OPC export
evidence package
pilot report
quota report

Actions:

create export
download export
view export hash
view export audit
expire export
delete export metadata if policy allows

Fields:

exportId
exportType
format
tenantId
workspaceId
recordCount
redactionMode
status
downloadExpiresAt
exportHash
legalCertification=false

Boundary:

Exports are technical evidence packages.
They are not legal certificates.

---

21. Pilot Reports module

Purpose:

Generate human-readable pilot reports.

Report sections:

pilot identity
runtime baseline
tenant/workspace
API surface status
request summary
EVT summary
OPC summary
audit summary
usage summary
quota summary
Source Intelligence summary
security boundary
legal boundary
next steps

Formats:

Markdown first
JSON summary
PDF later

PDF is future. Do not let PDF generation hijack the pilot console. It always tries.

---

22. Security Boundary module

Purpose:

Show the active boundary state for operators and clients.

Must show:

legalCertification=false
OPC technical proof receipt only
EVT technical event trace only
IPR operational identity/proof layer only
not public authority
not legal certifier
rawTextPersistence=false by default
manual Save Chat → IPR only
Source Intelligence profile save explicit only

This module should be visible in every B2G pilot workspace.

---

23. System Diagnostics module

Purpose:

Run safe diagnostics without triggering live branches or memory writes.

Diagnostics should include:

runtime health
API v1 self-test
Source Intelligence descriptor
database persistence status
audit persistence status
usage persistence status
document registry status
tenant/workspace scope status
quota state
webhook delivery state

Diagnostic rule:

Diagnostics must not create reusable memory.
Diagnostics must not trigger live Source Intelligence fetch unless explicit.
Diagnostics must not ingest files.
Diagnostics must not perform document recall unless explicit.

---

24. Console access control

Console access must be controlled.

Required checks:

authenticated operator
role assigned
tenant scope assigned
workspace scope assigned
active account
active subscription if client-side
session not expired
legal boundary accepted

Fail-closed cases:

missing role
inactive operator
tenant mismatch
workspace mismatch
expired subscription
revoked credential
unknown scope

---

25. Console audit

Every admin/operator action must be audited.

Console audit events should include:

consoleAuditId
operatorId
role
tenantId
workspaceId
action
targetType
targetId
beforeHash if applicable
afterHash if applicable
evtId
opcId
createdAt
legalCertification=false

Audited console actions:

tenant created
workspace created
credential issued
credential revoked
rate limit changed
webhook created
webhook disabled
export created
operator disabled
subscription suspended
document profile disabled

---

26. Console event types

Recommended console event types:

console.tenant.created
console.workspace.created
console.credential.created
console.credential.revoked
console.operator.created
console.operator.disabled
console.subscription.suspended
console.rate_limit.updated
console.webhook.created
console.webhook.disabled
console.export.created
console.document_profile.disabled

Console events should link to EVT/OPC where appropriate.

---

27. Console dashboard states

Recommended top-level console states:

CONSOLE_READY
CONSOLE_DEGRADED
TENANT_SCOPE_REQUIRED
WORKSPACE_SCOPE_REQUIRED
AUTH_REQUIRED
ROLE_DENIED
EXPORT_DEGRADED
WEBHOOKS_DEGRADED
QUOTA_WARNING
QUOTA_EXCEEDED

The UI should avoid ambiguous “not ready” states.

If something is waiting because no tenant is selected, say:

WAITING_FOR_TENANT_SELECTION

Not:

NOT_READY

The machine should not make humans solve riddles. They already invented procurement.

---

28. UI implementation path

Recommended route:

app/admin/page.tsx

Alternative first route:

app/interface/admin/page.tsx

Recommended first implementation:

app/admin/page.tsx

Reason:

Keep operator/admin console separate from public runtime interface.

Recommended first UI layout:

left navigation
top runtime status bar
tenant/workspace selector
main content panel
right boundary/proof panel

First UI modules:

Runtime Overview
Tenant Selector
API Credentials
Audit Records
Model Usage
Quota
Exports
Security Boundary

---

29. Admin API route roadmap

Future admin routes:

GET  /api/admin/health
POST /api/admin/tenants
GET  /api/admin/tenants
GET  /api/admin/tenants/{tenantId}
POST /api/admin/workspaces
GET  /api/admin/workspaces
POST /api/admin/operators
POST /api/admin/credentials
GET  /api/admin/credentials
POST /api/admin/credentials/{credentialId}/revoke
POST /api/admin/rate-limit-profiles
GET  /api/admin/exports
GET  /api/admin/webhooks
GET  /api/admin/audit
GET  /api/admin/model-usage

Admin routes must not be confused with public "/api/v1".

Admin routes require stricter authorization.

---

30. Database schema additions

Suggested console audit table:

CREATE TABLE hbce_console_audit_events (
  console_audit_id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  role TEXT NOT NULL,
  tenant_id TEXT,
  workspace_id TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  before_hash TEXT,
  after_hash TEXT,
  evt_id TEXT,
  opc_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested operator session table:

CREATE TABLE hbce_operator_sessions (
  operator_session_id TEXT PRIMARY KEY,
  operator_id TEXT NOT NULL,
  tenant_id TEXT,
  workspace_id TEXT,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested indexes:

CREATE INDEX hbce_console_audit_tenant_workspace_idx
ON hbce_console_audit_events (tenant_id, workspace_id);

CREATE INDEX hbce_console_audit_operator_idx
ON hbce_console_audit_events (operator_id);

CREATE INDEX hbce_operator_sessions_operator_idx
ON hbce_operator_sessions (operator_id);

---

31. First implementation order

Recommended implementation order:

1. Define admin/operator roles.
2. Define console audit event types.
3. Create console audit helper.
4. Create admin health route.
5. Create admin runtime overview route.
6. Create tenant list/read route.
7. Create workspace list/read route.
8. Create credential list/read route.
9. Create audit list route for admin console.
10. Create model usage list route for admin console.
11. Create app/admin/page.tsx shell.
12. Add runtime overview card.
13. Add tenant/workspace selector.
14. Add audit table.
15. Add usage table.
16. Add quota card.
17. Add security boundary card.
18. Add export card later.

First code target:

lib/admin-console.ts

Second code target:

app/api/admin/health/route.ts

Third code target:

app/admin/page.tsx

Do not start by building a majestic admin palace. Start with the health card, tenant selector and audit table. Modesty, somehow, remains undefeated.

---

32. Acceptance criteria

The first Admin & Operator Console is acceptable when:

admin page loads
runtime overview is visible
tenant/workspace selector is visible
API v1 status is visible
audit records can be listed
model usage records can be listed
quota state is visible
security boundary is visible
operator role is enforced
console actions are audited
legalCertification=false is visible

Minimum PASS output:

ADMIN_OPERATOR_CONSOLE_READY
runtimeOverview=PASS
tenantSelector=PASS
workspaceSelector=PASS
auditTable=PASS
usageTable=PASS
quotaCard=PASS
boundaryCard=PASS
roleCheck=PASS
consoleAudit=PASS
legalCertification=false

---

33. Non-goals for first implementation

Do not include in first implementation:

full customer portal
billing portal
public signup
enterprise SSO
OIDC/SAML
advanced RBAC
complex charts
PDF report designer
webhook marketplace
SIEM integration
drag-and-drop workflow builder

First implementation must prove:

operator visibility
tenant/workspace selection
audit review
usage review
quota review
boundary visibility
console audit

Everything else can wait, despite the ancient developer temptation to build a dashboard cathedral before the door handle works.

---

34. Final statement

The Admin & Operator Console is the operational control layer for HBCE IPR Runtime API v1.

It allows HBCE and authorized pilot operators to manage and review:

tenants
workspaces
operators
credentials
rate limits
quotas
audit records
usage records
EVT/OPC references
Source Intelligence permissions
document profiles
exports
webhook deliveries
runtime health
security boundaries

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
