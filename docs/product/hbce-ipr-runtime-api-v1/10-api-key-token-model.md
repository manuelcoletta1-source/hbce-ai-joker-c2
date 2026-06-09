HBCE IPR Runtime API v1

API Key / Client Token Model

Product: HBCE IPR Runtime API v1
Runtime: JOKER-C2 SaaS Core v0.1
Pilot stage: SaaS Core v0.2 — B2G Pilot Readiness
Scope: API key, client token, tenant-scoped access, pilot authentication model
Target: B2G / regulated enterprise / software integrator / institutional pilot
Boundary: "legalCertification=false"

---

1. Purpose

This document defines the API key and client token model required to move HBCE IPR Runtime API v1 from internal self-pilot usage toward controlled external B2G pilot integration.

The goal is to introduce a client access layer that can bind API requests to:

client tenant
client workspace
client account
subscription tier
allowed endpoints
allowed sourceSets
rate limit profile
audit scope
usage accounting scope

This is the next technical increment after the validated API v1 public surface.

Mandatory boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.

---

2. Why this model is required

The current self-pilot runtime proves that JOKER-C2 can operate as a governed AI runtime.

Current validated state:

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
legalCertification=false

But external client integration requires more than internal session validation.

A B2G client must not use the self-pilot scope.

External access requires:

client-specific credentials
tenant/workspace binding
scope restriction
rate limits
revocation
audit trail
usage accounting
error model
credential rotation

Without this layer, the API is technically valid but not yet safely client-accessible. Naturally, because doors usually need locks. Humanity discovered this after caves.

---

3. Current state

Current runtime identity context:

Runtime IPR = IPR-AI-0001
Human IPR = IPR-88505FE91013DCFE97C56ED1
Tenant = HBCE-TENANT-SELF-PILOT
Workspace = HBCE-WORKSPACE-RND
Subscription = HBCE-SUBSCRIPTION-SELF-PILOT
Account = HBCE-ACCOUNT-SELF-PILOT
Tier = IPR

Current access mode:

self-pilot account/session bridge
server-side IPR validation
JOKER_C2_ACCESS scope
ACCESS_GRANTED
SERVER_RUNTIME_VALIDATED authority

This is valid for internal R&D/self-pilot.

It is not enough for external B2G client access.

---

4. Target state

The target state is:

Client system
  ↓
API key / client token
  ↓
tenant/workspace validation
  ↓
scope/rate-limit validation
  ↓
HBCE IPR Runtime API v1
  ↓
JOKER-C2 governed runtime
  ↓
EVT / OPC / Audit / Usage

Each external request must be attributable to:

client
tenant
workspace
account
subscription
API credential
operator if available
request scope
policy decision
EVT
OPC
audit record
usage record

---

5. Credential types

The model supports two credential forms.

Option A — API key

Recommended for simple server-to-server pilots.

Header:

x-hbce-api-key: <client-api-key>

Use cases:

guided technical pilot
server-side client integration
controlled B2G proof-of-concept
software integrator testing

Option B — Bearer client token

Recommended for structured client access and future SDK usage.

Header:

Authorization: Bearer <client-token>

Use cases:

SDK integration
partner system integration
workspace-scoped application access
future OAuth-like gateway

Recommended first implementation:

API key model first.
Bearer token model second.

Because building the cathedral before the front door is how software teams produce archaeology instead of products.

---

6. Credential format

Recommended API key public format:

hbce_live_<keyId>_<secret>

Recommended pilot API key format:

hbce_pilot_<keyId>_<secret>

Recommended environment labels:

pilot
staging
production

Example:

hbce_pilot_k_01HBCEXAMPLE_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

The "keyId" may be stored and displayed.

The "secret" must never be stored in plaintext.

---

7. Secret storage rule

API secrets must be hashed before persistence.

Required storage rule:

store keyId
store secretHash
do not store raw secret
show raw secret only once at creation time

Recommended hashing approach:

secretHash = SHA-256 or stronger password-hash/KDF depending on implementation phase

Minimum pilot rule:

rawSecret must not be persisted
rawSecret must not be logged
rawSecret must not appear in audit logs
rawSecret must not appear in frontend payloads

For production candidate:

use HMAC / KDF / secret manager pattern
support rotation
support revocation
support expiration

---

8. Core credential record

Recommended credential record:

{
  "credentialId": "APIKEY-...",
  "keyId": "k_...",
  "secretHash": "sha256:...",
  "credentialType": "API_KEY",
  "environment": "pilot",
  "status": "ACTIVE",
  "clientName": "Client name",
  "tenantId": "HBCE-TENANT-CLIENT-CODE",
  "workspaceId": "HBCE-WORKSPACE-PILOT-CODE",
  "accountId": "HBCE-ACCOUNT-CLIENT-CODE",
  "subscriptionId": "HBCE-SUBSCRIPTION-CLIENT-CODE-PILOT",
  "tier": "B2G_PILOT",
  "scopes": [
    "v1:health:read",
    "v1:capabilities:read",
    "v1:ipr-session:create",
    "v1:chat:create",
    "v1:opc:read",
    "v1:audit:read",
    "v1:model-usage:read",
    "v1:source-intelligence:read"
  ],
  "allowedSourceSets": [
    "EU_AI_GOVERNANCE_REGULATORY_STACK",
    "ENISA_CYBER_THREAT_LANDSCAPE"
  ],
  "rateLimitProfile": "B2G_PILOT_STANDARD",
  "createdAt": "ISO-8601",
  "expiresAt": "ISO-8601",
  "revokedAt": null,
  "lastUsedAt": null,
  "createdBy": "HBCE operator",
  "legalCertification": false
}

---

9. Credential status

Allowed statuses:

ACTIVE
SUSPENDED
REVOKED
EXPIRED
ROTATED

Meaning:

ACTIVE = usable credential
SUSPENDED = temporarily blocked
REVOKED = permanently blocked
EXPIRED = blocked after expiration
ROTATED = replaced by newer credential

Fail-closed rule:

Any credential that is not ACTIVE must be rejected.

---

10. Scope model

Scopes define what the credential can do.

Recommended scope format:

v1:<resource>:<action>

Example scopes:

v1:root:read
v1:health:read
v1:capabilities:read
v1:ipr-session:create
v1:ipr-session:read
v1:chat:create
v1:files:create
v1:operations:create
v1:operations:read
v1:events:read
v1:opc:read
v1:audit:read
v1:model-usage:read
v1:openapi:read
v1:self-test:read
v1:source-intelligence:read

Pilot default scope:

health read
capabilities read
IPR session create/read
chat create
operations create/read
OPC read
audit read
model usage read
source intelligence read

Do not enable by default:

file ingestion
document profile creation
manual memory save
source profile save
admin routes
tenant management
credential management

Those require explicit pilot scope.

---

11. Endpoint-to-scope matrix

Endpoint| Required scope
"GET /api/v1"| "v1:root:read"
"GET /api/v1/health"| "v1:health:read"
"GET /api/v1/capabilities"| "v1:capabilities:read"
"POST /api/v1/ipr/session"| "v1:ipr-session:create"
"GET /api/v1/ipr/session/{sessionId}"| "v1:ipr-session:read"
"POST /api/v1/chat"| "v1:chat:create"
"POST /api/v1/files"| "v1:files:create"
"POST /api/v1/operations"| "v1:operations:create"
"GET /api/v1/operations/{operationId}"| "v1:operations:read"
"GET /api/v1/events"| "v1:events:read"
"GET /api/v1/opc/{opcId}"| "v1:opc:read"
"GET /api/v1/audit/{auditId}"| "v1:audit:read"
"GET /api/v1/model-usage/{usageId}"| "v1:model-usage:read"
"GET /api/v1/openapi"| "v1:openapi:read"
"GET /api/v1/self-test"| "v1:self-test:read"
"GET /api/v1/source-intelligence"| "v1:source-intelligence:read"

---

12. Tenant and workspace binding

Every credential must be bound to exactly one tenant and at least one workspace.

Minimum rule:

credential.tenantId must match request tenantId
credential.workspaceId must match request workspaceId

External pilot rule:

No external client credential may use HBCE-TENANT-SELF-PILOT.
No external client credential may use HBCE-WORKSPACE-RND.

Fail-closed cases:

missing tenant
missing workspace
tenant mismatch
workspace mismatch
credential without tenant
credential without workspace
cross-tenant record lookup
cross-workspace record lookup

---

13. Request validation flow

Every authenticated API request should follow this order:

1. Extract API key or bearer token.
2. Reject if missing.
3. Parse keyId.
4. Lookup credential by keyId.
5. Reject if credential not found.
6. Hash incoming secret.
7. Compare with stored secretHash.
8. Reject if invalid.
9. Check status ACTIVE.
10. Check expiration.
11. Check tenant/workspace binding.
12. Check endpoint scope.
13. Check rate limit.
14. Attach credential context to request.
15. Continue to runtime.
16. Write audit metadata.

Fail-closed rule:

Any missing, invalid or mismatched authentication field must reject the request.

---

14. Request context after authentication

After validation, the runtime should receive:

{
  "authMode": "API_KEY",
  "credentialId": "APIKEY-...",
  "clientName": "Client name",
  "tenantId": "HBCE-TENANT-CLIENT-CODE",
  "workspaceId": "HBCE-WORKSPACE-PILOT-CODE",
  "accountId": "HBCE-ACCOUNT-CLIENT-CODE",
  "subscriptionId": "HBCE-SUBSCRIPTION-CLIENT-CODE-PILOT",
  "tier": "B2G_PILOT",
  "scopes": ["v1:chat:create"],
  "rateLimitProfile": "B2G_PILOT_STANDARD",
  "legalCertification": false
}

This context should be propagated into:

EVT
OPC
audit
model usage
operation records
dashboard state

---

15. Audit requirements

Every credential-authenticated request should create or update audit metadata.

Audit should include:

credentialId
keyId
credentialType
clientName
tenantId
workspaceId
accountId
subscriptionId
endpoint
method
scope used
policy decision
rate limit profile
IP address hash if applicable
user-agent hash if applicable
EVT
OPC
usage ID
legalCertification=false

Never audit:

raw API secret
raw bearer token
full Authorization header
raw sensitive prompt content unless explicitly allowed

---

16. Model usage requirements

Model usage must be scoped to credential context.

Usage record should include:

usageId
credentialId
tenantId
workspaceId
accountId
subscriptionId
tier
model
model level
token fields if available
cost/accounting fields
EVT
OPC
audit ID
legalCertification=false

This allows:

quota control
billing estimation
pilot reporting
tenant-level cost analysis
workspace-level usage analysis

---

17. Rate limit model

Minimum rate-limit fields:

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

Rate limits should be scoped by:

tenant
workspace
credentialId
subscription tier
endpoint
operation type

Rate limit response:

{
  "status": "FAIL",
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded for this credential.",
    "retryable": true,
    "retryAfterSeconds": 60
  },
  "legalCertification": false
}

---

18. Revocation model

Credential revocation must be immediate.

Revocation fields:

status = REVOKED
revokedAt
revokedBy
revocationReason
replacementCredentialId if rotated

Revocation must block:

all new requests
operation creation
document ingestion
Source Intelligence execution
audit lookup if policy requires
usage lookup if policy requires

Revocation does not delete existing audit records.

Audit and proof records should remain available according to retention policy.

---

19. Rotation model

Credential rotation should create a new credential and mark the old one as rotated or revoked.

Rotation flow:

1. Create new credential.
2. Show new secret once.
3. Mark old credential as ROTATED or schedule revocation.
4. Allow short overlap only if policy permits.
5. Audit rotation event.

Recommended pilot rule:

no overlap by default
manual rotation by HBCE operator

Production candidate rule:

self-service rotation
scheduled expiration
automated notification

---

20. Expiration model

Every pilot credential should expire.

Recommended expiration:

Guided demo credential: 1–7 days
B2G technical pilot credential: 30–60 days
Controlled API integration pilot credential: 60–90 days

Expired credentials must fail closed.

Error code:

API_KEY_EXPIRED

---

21. Error model

Recommended authentication error codes:

API_KEY_REQUIRED
API_KEY_INVALID
API_KEY_REVOKED
API_KEY_EXPIRED
API_KEY_SUSPENDED
API_KEY_SCOPE_DENIED
INVALID_BEARER_TOKEN
TOKEN_EXPIRED
TENANT_SCOPE_MISMATCH
WORKSPACE_SCOPE_MISMATCH
RATE_LIMITED

Example error:

{
  "status": "FAIL",
  "error": {
    "code": "API_KEY_SCOPE_DENIED",
    "message": "Credential does not include the required scope for this endpoint.",
    "retryable": false
  },
  "boundary": {
    "legalCertification": false
  }
}

---

22. Credential creation endpoint roadmap

Future internal/admin endpoint:

POST /api/admin/credentials

Possible request:

{
  "clientName": "Client name",
  "tenantId": "HBCE-TENANT-CLIENT-CODE",
  "workspaceId": "HBCE-WORKSPACE-PILOT-CODE",
  "accountId": "HBCE-ACCOUNT-CLIENT-CODE",
  "subscriptionId": "HBCE-SUBSCRIPTION-CLIENT-CODE-PILOT",
  "tier": "B2G_PILOT",
  "scopes": ["v1:chat:create", "v1:opc:read"],
  "allowedSourceSets": ["EU_AI_GOVERNANCE_REGULATORY_STACK"],
  "rateLimitProfile": "B2G_PILOT_STANDARD",
  "expiresAt": "ISO-8601"
}

Possible response:

{
  "credentialId": "APIKEY-...",
  "keyId": "k_...",
  "apiKey": "hbce_pilot_k_..._...",
  "secretVisibleOnce": true,
  "status": "ACTIVE",
  "legalCertification": false
}

Security rule:

apiKey is visible only once.
After creation, only keyId and metadata are retrievable.

---

23. Credential lookup endpoint roadmap

Future internal/admin endpoint:

GET /api/admin/credentials/{credentialId}

Must return:

{
  "credentialId": "APIKEY-...",
  "keyId": "k_...",
  "status": "ACTIVE",
  "tenantId": "HBCE-TENANT-CLIENT-CODE",
  "workspaceId": "HBCE-WORKSPACE-PILOT-CODE",
  "scopes": ["v1:chat:create"],
  "lastUsedAt": "ISO-8601",
  "expiresAt": "ISO-8601",
  "legalCertification": false
}

Must not return:

raw secret
full API key
authorization header

---

24. Public endpoint authentication behavior

Public API v1 endpoints should eventually enforce authentication based on deployment mode.

Recommended modes:

SELF_PILOT_INTERNAL
GUIDED_DEMO
B2G_PILOT_AUTH_REQUIRED
PRODUCTION_AUTH_REQUIRED

Behavior:

SELF_PILOT_INTERNAL = current internal bridge allowed
GUIDED_DEMO = selected demo endpoints allowed under controlled operator session
B2G_PILOT_AUTH_REQUIRED = API key/token required
PRODUCTION_AUTH_REQUIRED = API key/token + RBAC + rate limits required

No external client should access production-like endpoints without a credential.

---

25. Integration with IPR session

API key/token authenticates the client application.

IPR session identifies the operational subject or runtime operator.

They are not the same thing.

Model:

API credential = client/application access
IPR session = operational subject/runtime identity

A complete B2G request should include both:

valid API credential
valid or created IPR session
tenant/workspace match
scope match
policy decision

This prevents the API key from becoming a magical skeleton key, because apparently humans keep inventing those and calling them platforms.

---

26. Minimum implementation order

Recommended engineering order:

1. Define credential schema.
2. Add credential creation utility or admin route.
3. Add secret hashing.
4. Add credential lookup by keyId.
5. Add request authentication helper.
6. Add tenant/workspace binding check.
7. Add endpoint scope check.
8. Add audit metadata injection.
9. Add model usage credential fields.
10. Add rate-limit placeholder.
11. Add revocation/expiration checks.
12. Add error envelope.
13. Add API v1 contract test for auth-required mode.

First code target:

lib/api-auth.ts

Possible route integration targets:

app/api/v1/chat/route.ts
app/api/v1/operations/route.ts
app/api/v1/files/route.ts
app/api/v1/source-intelligence/route.ts

Do not start by modifying all endpoints.

Start with one protected endpoint.

Recommended first protected endpoint:

POST /api/v1/chat

---

27. Database schema sketch

Suggested table:

CREATE TABLE hbce_api_credentials (
  credential_id TEXT PRIMARY KEY,
  key_id TEXT UNIQUE NOT NULL,
  secret_hash TEXT NOT NULL,
  credential_type TEXT NOT NULL,
  environment TEXT NOT NULL,
  status TEXT NOT NULL,
  client_name TEXT NOT NULL,
  tenant_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  account_id TEXT,
  subscription_id TEXT,
  tier TEXT,
  scopes JSONB NOT NULL,
  allowed_source_sets JSONB NOT NULL,
  rate_limit_profile TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_by TEXT,
  revoked_by TEXT,
  revocation_reason TEXT,
  legal_certification BOOLEAN NOT NULL DEFAULT false
);

Indexes:

CREATE INDEX hbce_api_credentials_key_id_idx
ON hbce_api_credentials (key_id);

CREATE INDEX hbce_api_credentials_tenant_workspace_idx
ON hbce_api_credentials (tenant_id, workspace_id);

CREATE INDEX hbce_api_credentials_status_idx
ON hbce_api_credentials (status);

Boundary:

legal_certification must remain false.

---

28. First pilot acceptance criteria

The first API key/token implementation is acceptable when:

API key can be created
raw secret is shown only once
secret is stored hashed
invalid key is rejected
revoked key is rejected
expired key is rejected
tenant mismatch is rejected
workspace mismatch is rejected
missing scope is rejected
valid key reaches protected endpoint
audit record includes credentialId
usage record includes credentialId
legalCertification=false is preserved

Minimum PASS output:

API_KEY_AUTH_READY
credentialStatus=ACTIVE
tenantScope=PASS
workspaceScope=PASS
scopeCheck=PASS
auditCredentialBinding=PASS
usageCredentialBinding=PASS
legalCertification=false

---

29. Non-goals for first implementation

Do not include in the first implementation:

OAuth
SAML
OIDC
full RBAC
self-service dashboard
customer billing portal
automatic procurement workflow
multi-region key replication
hardware security module integration
advanced anomaly detection

Those are future layers.

First implement the boring gate that says:

who is calling,
for which tenant,
with which scope,
under which limit.

Civilization begins with paperwork, sadly.

---

30. Final statement

The API key / client token model is the next required technical increment for HBCE IPR Runtime API v1.

It enables controlled external B2G pilot access by binding every request to:

credential
tenant
workspace
scope
rate limit
audit
usage
EVT
OPC
legal boundary

It must preserve the core HBCE/JOKER-C2 boundary:

legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
