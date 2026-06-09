HBCE IPR Runtime API v1

Tenant Onboarding Model

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: tenant creation, workspace isolation, account mapping, subscription frame, operator onboarding
Target: B2G / regulated enterprise / software integrator / institutional pilot
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the tenant onboarding model required to move HBCE IPR Runtime API v1 from internal self-pilot operation to controlled external B2G pilot deployment.

The tenant onboarding model answers the following question:

How does HBCE/JOKER-C2 create a safe, scoped and auditable client environment for a B2G pilot?

The model defines:

tenant identity
workspace boundary
account reference
subscription profile
operator access
API credential binding
allowed endpoints
allowed sourceSets
document registry scope
memory scope
audit scope
usage scope
retention profile
pilot acceptance criteria

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Why tenant onboarding is required

The current runtime is validated under self-pilot context.

Current self-pilot identifiers:

Tenant = HBCE-TENANT-SELF-PILOT
Workspace = HBCE-WORKSPACE-RND
Subscription = HBCE-SUBSCRIPTION-SELF-PILOT
Account = HBCE-ACCOUNT-SELF-PILOT
Tier = IPR

This is correct for HBCE internal R&D.

It is not suitable for external clients.

An external B2G client must receive its own scoped runtime frame so that:

client data is isolated
client audit records are isolated
client usage records are isolated
client document profiles are isolated
client API credentials are isolated
client Source Intelligence permissions are explicit
client memory cannot mix with HBCE self-pilot memory

Without tenant onboarding, SaaS becomes “everybody inside the same room holding knives and spreadsheets”. Not ideal. Humans keep requiring boundaries, and for once they are right.

---

3. Target onboarding model

The target model is:

Client organization
  ↓
HBCE tenant
  ↓
Workspace
  ↓
Account
  ↓
Subscription
  ↓
Operators / API credentials
  ↓
Runtime execution
  ↓
EVT / OPC / Audit / Usage

Each client pilot should map to:

one tenant
one or more workspaces
one account
one subscription
one or more named operators
one or more API credentials
one allowed endpoint profile
one allowed Source Intelligence profile
one retention profile
one data boundary profile

---

4. Core entities

Tenant

The tenant represents the client organization or pilot entity.

Example:

HBCE-TENANT-CITY-TORINO-PILOT
HBCE-TENANT-REGION-PIEMONTE-PILOT
HBCE-TENANT-CYBER-PARTNER-001

The tenant is the top-level isolation boundary.

Tenant-scoped objects:

IPR sessions
workspaces
API credentials
audit records
usage records
operations
document profiles
memory records
Source Intelligence saved profiles

---

Workspace

The workspace represents a specific project, unit, pilot or operational area inside the tenant.

Example:

HBCE-WORKSPACE-AI-AUDIT-TRAIL
HBCE-WORKSPACE-SOURCE-INTELLIGENCE
HBCE-WORKSPACE-CYBER-GOVERNANCE

The workspace is the operational boundary.

Workspace-scoped objects:

chat requests
operations
files
document profiles
recall context
audit visibility
usage accounting
operator access

---

Account

The account represents the commercial or operational client record.

Example:

HBCE-ACCOUNT-CITY-TORINO
HBCE-ACCOUNT-REGION-PIEMONTE
HBCE-ACCOUNT-PARTNER-CYBER-001

The account links the client to commercial, support and governance metadata.

---

Subscription

The subscription represents the pilot or commercial service tier.

Example:

HBCE-SUBSCRIPTION-CITY-TORINO-PILOT
HBCE-SUBSCRIPTION-CYBER-PARTNER-B2G-PILOT

Subscription defines:

tier
duration
usage limits
allowed endpoints
allowed workspaces
included sourceSets
support level
pilot deliverables
retention profile

---

Operator

The operator is a named human or technical user allowed to use the tenant/workspace.

Operator references should be mapped to IPR or equivalent client-side identity where available.

Operator metadata:

operatorId
displayName
role
email or contact reference
tenantId
workspaceId
allowedScopes
status
createdAt
disabledAt

Operator roles may include:

PILOT_OWNER
TECHNICAL_OPERATOR
SECURITY_REVIEWER
AUDIT_REVIEWER
READ_ONLY_VIEWER
HBCE_OPERATOR

---

API credential

The API credential authenticates a client application or integration.

It is not the same as IPR.

Model:

API credential = client/application access
IPR session = operational subject/runtime identity

Credential must bind to:

tenant
workspace
account
subscription
scope
rate limit
allowed endpoints
allowed sourceSets

---

5. Recommended naming convention

Tenant:

HBCE-TENANT-<CLIENT-CODE>-PILOT

Workspace:

HBCE-WORKSPACE-<PROJECT-CODE>

Account:

HBCE-ACCOUNT-<CLIENT-CODE>

Subscription:

HBCE-SUBSCRIPTION-<CLIENT-CODE>-PILOT

Operator:

HBCE-OPERATOR-<CLIENT-CODE>-<ROLE>-<NUMBER>

API credential:

APIKEY-<CLIENT-CODE>-<ENV>-<NUMBER>

Example pilot frame:

Tenant: HBCE-TENANT-CITY-TORINO-PILOT
Workspace: HBCE-WORKSPACE-AI-AUDIT-TRAIL
Account: HBCE-ACCOUNT-CITY-TORINO
Subscription: HBCE-SUBSCRIPTION-CITY-TORINO-PILOT
Tier: B2G_PILOT

---

6. Onboarding input form

Minimum client onboarding input:

clientName
clientType
country
region
city if relevant
pilotOwner
technicalContact
securityContact
billingContact if applicable
pilotUseCase
riskDomain
dataSensitivityLevel
desiredStartDate
desiredDuration
integrationMode
allowedOperators
allowedSourceSets
allowedEndpoints
documentHandlingRequired
retentionProfile
supportLevel

Client type values:

PUBLIC_SECTOR
REGULATED_ENTERPRISE
SOFTWARE_INTEGRATOR
CYBERSECURITY_PARTNER
RESEARCH_LAB
INSTITUTIONAL_ADVISOR
OTHER

Integration mode values:

GUIDED_DEMO
DASHBOARD_ONLY
API_ONLY
DASHBOARD_AND_API
PARTNER_SYSTEM_INTEGRATION

Data sensitivity values:

PUBLIC
SYNTHETIC
INTERNAL_TEST
CONFIDENTIAL_TEST
SENSITIVE_REQUIRES_REVIEW
PRODUCTION_DATA_NOT_ALLOWED_IN_PILOT

Default pilot rule:

Use PUBLIC or SYNTHETIC data unless a separate written security and data-processing agreement exists.

---

7. Onboarding workflow

The tenant onboarding workflow follows this sequence:

1. Receive pilot request.
2. Classify client type.
3. Define pilot use case.
4. Confirm data boundary.
5. Create tenant.
6. Create workspace.
7. Create account reference.
8. Create subscription profile.
9. Define allowed operators.
10. Define allowed endpoints.
11. Define allowed sourceSets.
12. Define rate-limit profile.
13. Define retention profile.
14. Issue API credential if required.
15. Run onboarding validation.
16. Run guided first request.
17. Generate onboarding EVT/OPC/audit/usage proof.
18. Deliver onboarding summary.

The onboarding itself should be traceable.

Recommended output:

TENANT_ONBOARDING_READY
tenantId=...
workspaceId=...
accountId=...
subscriptionId=...
tier=B2G_PILOT
legalCertification=false

---

8. Tenant record

Recommended tenant record:

{
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "clientName": "Client name",
  "clientType": "PUBLIC_SECTOR",
  "country": "IT",
  "region": "Piemonte",
  "status": "ACTIVE",
  "environment": "pilot",
  "createdAt": "ISO-8601",
  "createdBy": "HBCE operator",
  "dataBoundary": "PUBLIC_OR_SYNTHETIC_ONLY",
  "legalCertification": false
}

Allowed tenant statuses:

DRAFT
ACTIVE
SUSPENDED
CLOSED
ARCHIVED

Fail-closed rule:

Only ACTIVE tenants may execute runtime requests.

---

9. Workspace record

Recommended workspace record:

{
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceName": "AI Audit Trail Pilot",
  "status": "ACTIVE",
  "riskDomain": "AI_GOVERNANCE",
  "integrationMode": "DASHBOARD_AND_API",
  "allowedSourceSets": [
    "EU_AI_GOVERNANCE_REGULATORY_STACK",
    "ENISA_CYBER_THREAT_LANDSCAPE"
  ],
  "documentHandlingEnabled": false,
  "sourceIntelligenceEnabled": true,
  "createdAt": "ISO-8601",
  "legalCertification": false
}

Allowed workspace statuses:

DRAFT
ACTIVE
SUSPENDED
CLOSED
ARCHIVED

Fail-closed rule:

Only ACTIVE workspaces may execute runtime requests.

---

10. Account record

Recommended account record:

{
  "accountId": "HBCE-ACCOUNT-CLIENT-CODE",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "clientName": "Client name",
  "commercialOwner": "HBCE operator",
  "supportLevel": "PILOT_STANDARD",
  "billingMode": "PILOT_FIXED_SCOPE",
  "createdAt": "ISO-8601",
  "legalCertification": false
}

The account record is commercial/operational.

It should not contain sensitive pilot data.

---

11. Subscription record

Recommended subscription record:

{
  "subscriptionId": "HBCE-SUBSCRIPTION-CLIENT-CODE-PILOT",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "accountId": "HBCE-ACCOUNT-CLIENT-CODE",
  "tier": "B2G_PILOT",
  "status": "ACTIVE",
  "startDate": "ISO-8601",
  "endDate": "ISO-8601",
  "includedRequestsPerDay": 1000,
  "includedOperationsPerDay": 100,
  "includedSourceIntelligenceRunsPerDay": 50,
  "includedFileUploadsPerDay": 20,
  "includedWorkspaces": 1,
  "supportLevel": "PILOT_STANDARD",
  "legalCertification": false
}

Allowed subscription statuses:

ACTIVE
SUSPENDED
EXPIRED
CANCELLED

Fail-closed rule:

Expired, suspended or cancelled subscriptions must not execute runtime requests.

---

12. Operator record

Recommended operator record:

{
  "operatorId": "HBCE-OPERATOR-CLIENT-CODE-PILOT-001",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "displayName": "Pilot Operator",
  "role": "TECHNICAL_OPERATOR",
  "status": "ACTIVE",
  "allowedScopes": [
    "v1:health:read",
    "v1:chat:create",
    "v1:opc:read",
    "v1:audit:read",
    "v1:model-usage:read"
  ],
  "createdAt": "ISO-8601",
  "legalCertification": false
}

Allowed operator statuses:

ACTIVE
SUSPENDED
DISABLED
REMOVED

---

13. Source Intelligence permissions

Source Intelligence must be explicitly permissioned per workspace.

Available sourceSets:

ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK
EU_AI_GOVERNANCE_REGULATORY_STACK
ENISA_CYBER_THREAT_LANDSCAPE
ECB_FINANCIAL_SYSTEM_AI_CYBER_RISK
OPENAI_AGENTIC_SYSTEMS_SECURITY

Permission record:

{
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "allowedSourceSets": [
    "EU_AI_GOVERNANCE_REGULATORY_STACK",
    "ENISA_CYBER_THREAT_LANDSCAPE"
  ],
  "rawTextPersistence": false,
  "profileSavePolicy": "EXPLICIT_OPERATOR_SAVE_ONLY",
  "pdfBoundary": "PDF_BINARY_HASH_ONLY",
  "legalCertification": false
}

Fail-closed rules:

unknown sourceSet = reject
sourceSet not allowed for workspace = reject
source/sourceSet mismatch = reject
local/private URL = reject
raw text persistence attempt without policy = reject

---

14. Document handling permissions

Document handling must be optional and explicit.

Default pilot setting:

documentHandlingEnabled=false
fileIngestionEnabled=false
documentRecallEnabled=false
rawTextPersistence=false

If enabled, define:

allowedFileTypes
maxFileSizeMb
textExtractionPolicy
pdfHandlingPolicy
documentProfilePolicy
documentRecallPolicy
documentRetentionPolicy

Recommended document permission record:

{
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "fileIngestionEnabled": false,
  "documentRecallEnabled": false,
  "rawTextPersistence": false,
  "pdfBoundary": "PDF_BINARY_HASH_ONLY",
  "maxFileSizeMb": 10,
  "legalCertification": false
}

Boundary:

Document profile creation does not imply legal validation.
Document recall must remain explicit.
No production sensitive documents in first pilot unless separately approved.

---

15. Memory permissions

Memory must be scoped to tenant/workspace.

Default settings:

runtimeMemoryEnabled=true
semanticMemoryGoverned=true
manualSaveChatToIpr=true
automaticReusableMemory=false
contractOnlyMemoryCreation=false

Memory permission record:

{
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "memoryScope": "TENANT_WORKSPACE_BOUND",
  "runtimeMemoryEnabled": true,
  "semanticMemoryEnabled": true,
  "manualSaveChatToIprAllowed": true,
  "automaticReusableMemoryAllowed": false,
  "contractOnlyMemoryCreationAllowed": false,
  "legalCertification": false
}

Fail-closed rules:

cross-tenant memory access = reject
cross-workspace memory access = reject
contract-only memory creation = reject
automatic reusable memory without policy = reject

---

16. Audit and usage permissions

Audit and usage records must be scoped and visible only to allowed roles.

Audit visibility roles:

PILOT_OWNER
SECURITY_REVIEWER
AUDIT_REVIEWER
HBCE_OPERATOR

Usage visibility roles:

PILOT_OWNER
TECHNICAL_OPERATOR
HBCE_OPERATOR

Audit/usage boundary:

Audit records are technical reconstruction records.
Usage records are technical/accounting records.
They are not legal certification records.
legalCertification=false

---

17. Rate-limit profile

Default pilot rate-limit profile:

{
  "rateLimitProfile": "B2G_PILOT_STANDARD",
  "requestsPerMinute": 30,
  "requestsPerDay": 1000,
  "maxOperationsPerDay": 100,
  "maxSourceIntelligenceRunsPerDay": 50,
  "maxFileUploadsPerDay": 20,
  "maxFileSizeMb": 10,
  "maxCostUnitsPerMonth": 10000
}

Rate limits must apply to:

tenant
workspace
API credential
operator if available
endpoint
operation type
subscription tier

---

18. Retention profile

Default pilot retention profile:

{
  "retentionProfile": "B2G_PILOT_MINIMAL",
  "rawTextPersistence": false,
  "technicalMetadataRetentionDays": 90,
  "auditRetentionDays": 180,
  "usageRetentionDays": 180,
  "documentProfileRetentionDays": 90,
  "memoryRetentionDays": 90,
  "deletionRequestSupported": true,
  "legalCertification": false
}

Retention boundary:

Retention must be defined before external pilot start.
Deletion/removal procedures must be defined before production candidate.

---

19. Onboarding validation checklist

Before activating a tenant:

[ ] Client name confirmed
[ ] Client type confirmed
[ ] Pilot owner assigned
[ ] Technical contact assigned
[ ] Data boundary confirmed
[ ] Tenant ID created
[ ] Workspace ID created
[ ] Account ID created
[ ] Subscription ID created
[ ] Operator list defined
[ ] Allowed endpoints defined
[ ] Allowed sourceSets defined
[ ] Document handling policy defined
[ ] Memory policy defined
[ ] Rate-limit profile assigned
[ ] Retention profile assigned
[ ] Legal boundary accepted
[ ] API credential issued if required
[ ] Test request completed
[ ] EVT/OPC/audit/usage proof generated

Minimum activation output:

TENANT_ONBOARDING_READY
tenantStatus=ACTIVE
workspaceStatus=ACTIVE
subscriptionStatus=ACTIVE
accessMode=GUIDED_DEMO | API_KEY
legalCertification=false

---

20. First runtime request after onboarding

The first request should be low-risk and synthetic.

Recommended prompt:

Run a governed AI runtime diagnostic for this tenant and show IPR, tenant, workspace, policy, EVT, OPC, audit, model usage and legal boundary.

Expected result:

ACCESS_GRANTED
tenantScope=PASS
workspaceScope=PASS
policyDecision=ALLOW
EVT=PERSISTED
OPC=PERSISTED
audit=PERSISTED
usage=PERSISTED
legalCertification=false

---

21. Onboarding evidence package

Each onboarding should produce:

tenant ID
workspace ID
account ID
subscription ID
operator list
API credential ID if issued
allowed endpoint list
allowed sourceSet list
rate-limit profile
retention profile
first EVT
first OPC
first audit ID
first usage ID
dashboard screenshot
legal boundary statement

This package is technical onboarding evidence.

It is not legal certification.

---

22. Database schema sketch

Suggested tenant table:

CREATE TABLE hbce_tenants (
  tenant_id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_type TEXT NOT NULL,
  country TEXT,
  region TEXT,
  status TEXT NOT NULL,
  environment TEXT NOT NULL,
  data_boundary TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  created_by TEXT,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested workspace table:

CREATE TABLE hbce_workspaces (
  workspace_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_name TEXT NOT NULL,
  status TEXT NOT NULL,
  risk_domain TEXT,
  integration_mode TEXT,
  source_intelligence_enabled BOOLEAN NOT NULL DEFAULT false,
  document_handling_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested subscription table:

CREATE TABLE hbce_subscriptions (
  subscription_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  account_id TEXT,
  tier TEXT NOT NULL,
  status TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  support_level TEXT,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested operator table:

CREATE TABLE hbce_operators (
  operator_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  status TEXT NOT NULL,
  allowed_scopes JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  disabled_at TIMESTAMPTZ,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested indexes:

CREATE INDEX hbce_workspaces_tenant_idx
ON hbce_workspaces (tenant_id);

CREATE INDEX hbce_subscriptions_tenant_idx
ON hbce_subscriptions (tenant_id);

CREATE INDEX hbce_operators_tenant_workspace_idx
ON hbce_operators (tenant_id, workspace_id);

---

23. API route roadmap

Future internal/admin routes:

POST /api/admin/tenants
GET  /api/admin/tenants/{tenantId}
POST /api/admin/workspaces
GET  /api/admin/workspaces/{workspaceId}
POST /api/admin/subscriptions
POST /api/admin/operators
POST /api/admin/credentials

Future client-facing descriptor route:

GET /api/v1/tenant

Possible "GET /api/v1/tenant" response:

{
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "accountId": "HBCE-ACCOUNT-CLIENT-CODE",
  "subscriptionId": "HBCE-SUBSCRIPTION-CLIENT-CODE-PILOT",
  "tier": "B2G_PILOT",
  "status": "ACTIVE",
  "allowedSourceSets": [
    "EU_AI_GOVERNANCE_REGULATORY_STACK"
  ],
  "legalCertification": false
}

---

24. First implementation order

Recommended implementation order:

1. Define tenant/workspace/subscription/operator schema.
2. Add static self-pilot compatibility mapping.
3. Add tenant creation helper.
4. Add workspace creation helper.
5. Add subscription creation helper.
6. Add operator creation helper.
7. Add tenant/workspace validation helper.
8. Bind API credentials to tenant/workspace.
9. Inject tenant/workspace into audit records.
10. Inject tenant/workspace into usage records.
11. Scope document profiles by tenant/workspace.
12. Scope memory records by tenant/workspace.
13. Add onboarding self-test.

First technical target:

lib/tenant-onboarding.ts

Second technical target:

lib/api-auth.ts

Third technical target:

app/api/admin/tenants/route.ts

Do not start by rewiring every runtime branch. That road leads to another 11,000-line file having a nervous breakdown.

---

25. Acceptance criteria

Tenant onboarding is acceptable when:

tenant can be created
workspace can be created
subscription can be created
operator can be created
API credential can bind to tenant/workspace
valid tenant/workspace reaches protected endpoint
tenant mismatch fails closed
workspace mismatch fails closed
audit record includes tenant/workspace
usage record includes tenant/workspace
memory is tenant/workspace scoped
document profile is tenant/workspace scoped
Source Intelligence permissions are enforced
legalCertification=false is preserved

Minimum PASS output:

TENANT_ONBOARDING_READY
tenantStatus=ACTIVE
workspaceStatus=ACTIVE
subscriptionStatus=ACTIVE
operatorStatus=ACTIVE
apiCredentialBound=true
tenantScope=PASS
workspaceScope=PASS
auditTenantBinding=PASS
usageTenantBinding=PASS
legalCertification=false

---

26. Non-goals for first implementation

Do not include in first implementation:

full customer portal
self-service billing
complex RBAC
OIDC/SAML
enterprise SSO
multi-region tenant replication
automated procurement workflow
production SLA
public admin UI

First implementation must establish:

tenant
workspace
subscription
operator
credential binding
scope validation
audit/usage tenant binding

Simple. Boring. Useful. The holy trinity of software nobody celebrates until it breaks.

---

27. Final statement

The tenant onboarding model is the structural bridge between HBCE/JOKER-C2 self-pilot and external B2G SaaS pilot deployment.

It ensures that every client pilot can be scoped by:

tenant
workspace
account
subscription
operator
credential
sourceSet permissions
document permissions
memory permissions
audit scope
usage scope
retention policy

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
