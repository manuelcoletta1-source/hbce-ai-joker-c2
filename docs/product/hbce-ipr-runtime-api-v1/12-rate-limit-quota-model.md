HBCE IPR Runtime API v1

Rate Limit & Quota Model

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: rate limits, quotas, usage caps, SaaS cost control, tenant/workspace enforcement
Target: B2G / regulated enterprise / software integrator / institutional pilot
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the rate limit and quota model required to move HBCE IPR Runtime API v1 toward controlled B2G pilot access.

The purpose is to protect:

runtime stability
tenant isolation
model usage cost
Source Intelligence execution
document ingestion capacity
audit storage
database persistence
operator-controlled access
commercial pilot boundaries

The rate limit and quota model ensures that every external client pilot has defined operational limits.

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Why rate limits are required

HBCE IPR Runtime API v1 is not only an answer endpoint.

Each governed request may generate:

policy evaluation
AI model execution
EVT trace
OPC proof receipt
audit record
model usage record
memory metadata
dashboard state
Source Intelligence context if requested
document profile operations if requested

Without limits, one client can affect:

runtime availability
database load
model cost
audit volume
usage accounting
other tenant performance
pilot commercial scope

So the rule is simple:

No external pilot without rate limits.
No rate limits without tenant/workspace scope.
No quota consumption without audit/usage linkage.

---

3. Current validated baseline

Current runtime baseline:

JOKER-C2 SaaS Core v0.1 = HEALTHY
Runtime = ACTIVE_RESPONSE_READY
B2G active response readiness = READY
IPR = ACCESS_GRANTED
MATRIX = MATRIX_ACTIVE
Memory = IPR_BOUND
Persistence = DATABASE_PERSISTENT
EVT = PERSISTED
OPC = PERSISTED
Audit = PERSISTED
Model usage = PERSISTED
API v1 public surface = 16/16 PASS
Source Intelligence = SOURCESET_REGISTRY_READY
SourceSets = 5/5
Document registry = AVAILABLE
legalCertification=false

This proves execution.

The next requirement is controlled execution volume.

---

4. Rate limit vs quota

Rate limit means:

how fast a client can call the API

Quota means:

how much a client can consume during a period

Examples:

Rate limit: 30 requests per minute
Quota: 10,000 requests per month
Rate limit: 5 file uploads per minute
Quota: 100 file uploads per month
Rate limit: 3 Source Intelligence runs per minute
Quota: 500 Source Intelligence runs per month

Both are required.

Rate limit protects runtime stability.

Quota protects commercial scope and cost.

---

5. Enforcement scope

Rate limits and quotas must be scoped by:

tenant
workspace
account
subscription
API credential
operator if available
endpoint
operation type
sourceSet
document profile operation
model usage cost

Minimum enforcement key:

tenantId + workspaceId + credentialId + endpoint

Recommended extended enforcement key:

tenantId + workspaceId + credentialId + operatorId + endpoint + operationType

Fail-closed rule:

If tenant, workspace or credential scope cannot be resolved, quota enforcement must fail closed.

---

6. Pilot rate-limit profiles

B2G_PILOT_LIGHT

For guided demos and very small pilots.

{
  "rateLimitProfile": "B2G_PILOT_LIGHT",
  "requestsPerMinute": 10,
  "requestsPerDay": 250,
  "chatRequestsPerDay": 50,
  "operationsPerDay": 25,
  "sourceIntelligenceRunsPerDay": 10,
  "fileUploadsPerDay": 5,
  "maxFileSizeMb": 5,
  "maxCostUnitsPerMonth": 1000
}

B2G_PILOT_STANDARD

Default for technical B2G pilots.

{
  "rateLimitProfile": "B2G_PILOT_STANDARD",
  "requestsPerMinute": 30,
  "requestsPerDay": 1000,
  "chatRequestsPerDay": 250,
  "operationsPerDay": 100,
  "sourceIntelligenceRunsPerDay": 50,
  "fileUploadsPerDay": 20,
  "maxFileSizeMb": 10,
  "maxCostUnitsPerMonth": 10000
}

B2G_PILOT_EXTENDED

For controlled integration pilots.

{
  "rateLimitProfile": "B2G_PILOT_EXTENDED",
  "requestsPerMinute": 60,
  "requestsPerDay": 5000,
  "chatRequestsPerDay": 1000,
  "operationsPerDay": 500,
  "sourceIntelligenceRunsPerDay": 250,
  "fileUploadsPerDay": 100,
  "maxFileSizeMb": 25,
  "maxCostUnitsPerMonth": 50000
}

INTERNAL_SELF_PILOT

For HBCE internal R&D only.

{
  "rateLimitProfile": "INTERNAL_SELF_PILOT",
  "requestsPerMinute": 120,
  "requestsPerDay": 10000,
  "chatRequestsPerDay": 2500,
  "operationsPerDay": 1000,
  "sourceIntelligenceRunsPerDay": 500,
  "fileUploadsPerDay": 250,
  "maxFileSizeMb": 50,
  "maxCostUnitsPerMonth": 100000
}

Boundary:

External clients must not use INTERNAL_SELF_PILOT.

---

7. Endpoint-level rate limits

Recommended endpoint grouping:

read endpoints
write endpoints
AI execution endpoints
file endpoints
operation endpoints
Source Intelligence endpoints
audit/usage lookup endpoints
admin endpoints

Read endpoints

Examples:

GET /api/v1
GET /api/v1/health
GET /api/v1/capabilities
GET /api/v1/openapi
GET /api/v1/source-intelligence

Recommended limits:

higher rate
lower cost
no model usage
no memory creation

AI execution endpoints

Examples:

POST /api/v1/chat

Recommended limits:

lower rate
cost-unit tracked
EVT/OPC/audit/usage linked
quota enforced

File endpoints

Examples:

POST /api/v1/files

Recommended limits:

file count limit
file size limit
document profile quota
PDF boundary enforcement
explicit ingestion only

Operation endpoints

Examples:

POST /api/v1/operations
GET /api/v1/operations/{operationId}

Recommended limits:

operation creation quota
polling rate limit
status lookup limit

Audit and usage lookup endpoints

Examples:

GET /api/v1/audit/{auditId}
GET /api/v1/model-usage/{usageId}
GET /api/v1/opc/{opcId}

Recommended limits:

tenant-scoped lookup
moderate rate
no cross-tenant access

---

8. Quota dimensions

Quota should be tracked across these dimensions:

requests
chat executions
operations
Source Intelligence runs
file uploads
document profiles
document recalls
audit lookups
OPC lookups
model usage cost units
storage volume
monthly active operators

Minimum pilot quotas:

requestsPerDay
chatRequestsPerDay
operationsPerDay
sourceIntelligenceRunsPerDay
fileUploadsPerDay
maxFileSizeMb
maxCostUnitsPerMonth

Production candidate quotas:

requestsPerMinute
requestsPerDay
requestsPerMonth
chatRequestsPerMonth
sourceIntelligenceRunsPerMonth
documentProfilesPerMonth
auditRetentionDays
usageRetentionDays
maxStorageMb
maxOperators
maxWorkspaces

---

9. Cost-unit model

The runtime should track cost units even when token data is unavailable.

Current model usage may expose:

input tokens
output tokens
total tokens
cost units
cost minor units
model
model level
usage ID

If token fields are unavailable:

cost units must still be tracked where possible.

Recommended cost-unit fields:

{
  "usageId": "USAGE-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "credentialId": "APIKEY-...",
  "model": "gpt-5.4-nano",
  "modelLevel": "STANDARD",
  "inputTokens": null,
  "outputTokens": null,
  "totalTokens": null,
  "costUnits": 2.025,
  "costMinor": 203,
  "legalCertification": false
}

Quota should support:

monthly cost-unit cap
daily cost-unit cap
per-request max cost
model-level restrictions

---

10. Source Intelligence quota model

Source Intelligence requires specific quotas.

Dimensions:

runs per day
runs per month
sources fetched per run
sourceSets allowed
PDF binary hash-only operations
source profile saves
summaries generated

Recommended pilot defaults:

{
  "sourceIntelligenceRunsPerDay": 50,
  "sourceIntelligenceRunsPerMonth": 500,
  "maxSourcesPerRun": 5,
  "allowedSourceSets": [
    "EU_AI_GOVERNANCE_REGULATORY_STACK",
    "ENISA_CYBER_THREAT_LANDSCAPE"
  ],
  "sourceProfileSavesPerMonth": 25,
  "rawTextPersistence": false,
  "profileSavePolicy": "EXPLICIT_OPERATOR_SAVE_ONLY"
}

Fail-closed rules:

unknown sourceSet = reject
sourceSet not allowed = reject
sourceSet quota exceeded = reject
source profile save quota exceeded = reject
raw text persistence attempt without policy = reject

---

11. Document quota model

Document operations require strict quotas.

Dimensions:

file uploads
file size
document profiles
document recalls
text extraction operations
PDF binary hash-only operations
linked document memory
storage volume

Recommended default for pilot:

{
  "fileUploadsPerDay": 20,
  "fileUploadsPerMonth": 100,
  "maxFileSizeMb": 10,
  "documentProfilesPerMonth": 50,
  "documentRecallsPerDay": 50,
  "rawTextPersistence": false,
  "pdfBoundary": "PDF_BINARY_HASH_ONLY"
}

Boundary:

No bulk production document ingestion during first pilot.
No sensitive production documents without separate agreement.
Document profile existence does not imply legal certification.

---

12. Memory quota model

Memory must be governed.

Dimensions:

runtime memory records
semantic memory records
manual Save Chat → IPR records
document-linked memory records
prompt memory recall items

Recommended pilot defaults:

{
  "manualIprMemorySavesPerDay": 20,
  "manualIprMemorySavesPerMonth": 100,
  "semanticMemoryPersistable": false,
  "automaticReusableMemory": false,
  "maxRecallItems": 10,
  "legalCertification": false
}

Contract-only rule:

Contract-only API tests must not create semantic memory or IPR memory.

Manual save rule:

Manual Save Chat → IPR must remain explicit operator action.

---

13. Rate limit response model

When a request exceeds rate limit:

{
  "status": "FAIL",
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded for this credential, tenant or workspace.",
    "retryable": true,
    "retryAfterSeconds": 60
  },
  "quota": {
    "rateLimitProfile": "B2G_PILOT_STANDARD",
    "scope": "tenant:workspace:credential:endpoint"
  },
  "boundary": {
    "legalCertification": false
  }
}

Required HTTP status:

429 Too Many Requests

Recommended response headers:

Retry-After
X-HBCE-RateLimit-Limit
X-HBCE-RateLimit-Remaining
X-HBCE-RateLimit-Reset
X-HBCE-Quota-Profile

---

14. Quota exceeded response model

When a period quota is exceeded:

{
  "status": "FAIL",
  "error": {
    "code": "QUOTA_EXCEEDED",
    "message": "Monthly quota exceeded for this tenant, workspace or subscription.",
    "retryable": false
  },
  "quota": {
    "quotaName": "maxCostUnitsPerMonth",
    "limit": 10000,
    "used": 10000,
    "period": "MONTHLY"
  },
  "boundary": {
    "legalCertification": false
  }
}

Required HTTP status:

403 Forbidden

or:

429 Too Many Requests

Recommended pilot choice:

429 for temporary rate limits.
403 for exhausted commercial quota.

---

15. Quota periods

Supported quota periods:

minute
hour
day
month
pilot term

Recommended reset model:

minute quota resets every rolling minute
daily quota resets at tenant timezone day boundary
monthly quota resets at billing cycle boundary
pilot-term quota resets only by operator/admin action

Tenant timezone should be explicit.

For EU pilots, default:

Europe/Rome

---

16. Quota ledger

Quota consumption should be persisted.

Recommended quota ledger record:

{
  "quotaEventId": "QUOTA-...",
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "credentialId": "APIKEY-...",
  "operatorId": "HBCE-OPERATOR-...",
  "endpoint": "POST /api/v1/chat",
  "operationType": "CHAT_COMPLETION",
  "quotaName": "chatRequestsPerDay",
  "amount": 1,
  "period": "DAILY",
  "evtId": "EVT-...",
  "opcId": "OPC-...",
  "auditId": "AUDIT-...",
  "usageId": "USAGE-...",
  "createdAt": "ISO-8601",
  "legalCertification": false
}

Quota ledger must not contain:

raw API secret
raw bearer token
sensitive prompt content
unscoped client data

---

17. Audit linkage

Every quota-relevant action should be linked to audit.

Audit should include:

rateLimitProfile
quota profile
quota consumed
quota remaining if available
credentialId
tenantId
workspaceId
endpoint
operation type
legalCertification=false

This lets HBCE and the client reconstruct why a request was allowed, limited or blocked.

Again, not legal certification. Just technical sanity, which is rare enough.

---

18. Model usage linkage

Every model-backed request should link quota to model usage.

Usage should include:

usageId
tenantId
workspaceId
credentialId
model
model level
cost units
quota profile
subscription tier
EVT
OPC
audit ID
legalCertification=false

This supports:

pilot cost reporting
subscription planning
client usage review
quota enforcement
future billing

---

19. Abuse and anomaly handling

Rate limits should trigger fail-closed behavior for obvious abuse.

Examples:

too many failed auth attempts
credential used from unexpected region
credential used across mismatched tenant
sourceSet mismatch attempts
file upload bursts
repeated document recall failures
polling loops
unknown endpoint probing

Pilot response:

temporarily suspend credential
require manual review
record audit event
do not delete existing proof records

Possible status:

SUSPENDED

---

20. Polling limits

Polling endpoints need special control.

Examples:

GET /api/v1/operations/{operationId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
GET /api/v1/model-usage/{usageId}

Recommended polling rule:

minimum polling interval = 2 seconds
recommended polling interval = 5 seconds
high-frequency polling = rate limited

Future option:

webhook event delivery

Because polling every 100 milliseconds is how developers prove they cannot be trusted with loops.

---

21. Dashboard quota visibility

The dashboard should eventually display:

tenant
workspace
subscription tier
rateLimitProfile
requests used today
requests remaining today
monthly cost units used
monthly cost units remaining
Source Intelligence runs used
file uploads used
quota warnings
rate-limit status

Recommended dashboard states:

QUOTA_HEALTHY
QUOTA_WARNING
QUOTA_LIMITED
QUOTA_EXCEEDED

---

22. API route roadmap

Future routes:

GET /api/v1/quota
GET /api/v1/quota/usage
GET /api/v1/quota/limits

Future admin routes:

POST /api/admin/rate-limit-profiles
GET  /api/admin/rate-limit-profiles/{profileId}
PATCH /api/admin/rate-limit-profiles/{profileId}
POST /api/admin/tenant-quota-overrides

Possible "GET /api/v1/quota" response:

{
  "tenantId": "HBCE-TENANT-CLIENT-CODE-PILOT",
  "workspaceId": "HBCE-WORKSPACE-AI-AUDIT-TRAIL",
  "rateLimitProfile": "B2G_PILOT_STANDARD",
  "status": "QUOTA_HEALTHY",
  "limits": {
    "requestsPerDay": 1000,
    "chatRequestsPerDay": 250,
    "maxCostUnitsPerMonth": 10000
  },
  "usage": {
    "requestsToday": 120,
    "chatRequestsToday": 20,
    "costUnitsThisMonth": 420.5
  },
  "boundary": {
    "legalCertification": false
  }
}

---

23. Database schema sketch

Suggested table:

CREATE TABLE hbce_rate_limit_profiles (
  profile_id TEXT PRIMARY KEY,
  profile_name TEXT UNIQUE NOT NULL,
  requests_per_minute INTEGER NOT NULL,
  requests_per_day INTEGER NOT NULL,
  chat_requests_per_day INTEGER NOT NULL,
  operations_per_day INTEGER NOT NULL,
  source_intelligence_runs_per_day INTEGER NOT NULL,
  file_uploads_per_day INTEGER NOT NULL,
  max_file_size_mb INTEGER NOT NULL,
  max_cost_units_per_month INTEGER NOT NULL,
  environment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested quota ledger:

CREATE TABLE hbce_quota_events (
  quota_event_id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  credential_id TEXT,
  operator_id TEXT,
  endpoint TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  quota_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  period TEXT NOT NULL,
  evt_id TEXT,
  opc_id TEXT,
  audit_id TEXT,
  usage_id TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Suggested indexes:

CREATE INDEX hbce_quota_events_tenant_workspace_idx
ON hbce_quota_events (tenant_id, workspace_id);

CREATE INDEX hbce_quota_events_created_at_idx
ON hbce_quota_events (created_at);

CREATE INDEX hbce_quota_events_credential_idx
ON hbce_quota_events (credential_id);

---

24. First implementation order

Recommended implementation order:

1. Define rate limit profiles as constants.
2. Add quota profile type.
3. Bind profile to subscription or credential.
4. Add request counter helper.
5. Add quota ledger write helper.
6. Add endpoint-level rate check.
7. Add daily request quota.
8. Add monthly cost-unit quota.
9. Add Source Intelligence run quota.
10. Add file upload quota.
11. Add rate-limit error envelope.
12. Add quota dashboard descriptor.

First code target:

lib/rate-limit-quota.ts

Second code target:

lib/api-auth.ts

Third code target:

app/api/v1/quota/route.ts

Do not wire every endpoint on day one.

Recommended first protected quota path:

POST /api/v1/chat

---

25. Acceptance criteria

The first rate limit/quota implementation is acceptable when:

rateLimitProfile can be resolved
tenant/workspace quota scope is resolved
valid request consumes quota
rate-limited request returns 429
quota-exceeded request returns stable error
quota ledger records tenant/workspace/credential
audit includes quota profile
usage includes quota context
Source Intelligence quota can be checked
file upload quota can be checked
legalCertification=false is preserved

Minimum PASS output:

RATE_LIMIT_QUOTA_READY
rateLimitProfile=B2G_PILOT_STANDARD
tenantScope=PASS
workspaceScope=PASS
credentialScope=PASS
quotaLedgerWrite=PASS
auditQuotaBinding=PASS
usageQuotaBinding=PASS
legalCertification=false

---

26. Non-goals for first implementation

Do not include in first implementation:

complex billing engine
customer invoice generation
payment processor integration
usage marketplace
dynamic pricing
AI cost forecasting
advanced anomaly detection
machine-learning abuse detection
multi-region quota sync

First implementation must establish:

who is consuming,
how much they can consume,
how fast they can consume,
what happens when they exceed limits,
and how this is traced.

Astonishingly, that is already more governance than many platforms ship with.

---

27. Final statement

The Rate Limit & Quota Model is a required SaaS B2G increment.

It protects HBCE/JOKER-C2 from uncontrolled external usage while enabling controlled client pilots.

It binds runtime consumption to:

tenant
workspace
credential
operator
endpoint
operation type
subscription
audit
usage
EVT
OPC
legal boundary

Mandatory final boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
