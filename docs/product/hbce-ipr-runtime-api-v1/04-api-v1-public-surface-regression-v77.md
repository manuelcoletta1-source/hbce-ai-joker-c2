# HBCE IPR Runtime API v1
## API v1 Public Surface Regression v77

**Product:** HBCE IPR Runtime API v1  
**Runtime:** JOKER-C2 SaaS Core v0.1  
**Target increment:** SaaS Core v0.2 — B2G Pilot Readiness  
**Regression:** API v1 Public Surface Regression v77  
**Scope:** root discovery, health, capabilities, self-test, OpenAPI, protected chat endpoint, API auth, tenant/workspace scope, rate-limit/quota  
**Boundary:** `legalCertification=false`

---

## 1. Purpose

This document records the API v1 public surface regression after the introduction of the controlled pilot API access chain.

The regression validates that the public API v1 surface now exposes and documents the following control plane:

```txt
API Auth
Tenant / Workspace Scope
Rate Limit / Quota Guard
Protected POST /api/v1/chat
OpenAPI security schemes
Health/capabilities/self-test discovery
```

This is a contract and surface regression.

It does not claim full production SaaS readiness.

Mandatory boundary:

```txt
legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
```

---

## 2. Regression verdict

Current verdict:

```txt
HBCE_API_V1_PUBLIC_SURFACE_REGRESSION_v77_READY
```

Regression result:

```txt
apiV1PublicSurface=PASS
endpointMatrix=16/16_PASS
apiAuthGate=PASS
tenantScopeBridge=PASS
rateLimitQuotaGate=PASS
protectedChatEndpoint=PASS
healthDiscovery=PASS
capabilitiesDiscovery=PASS
selfTestContract=PASS
openApiSecurityAlignment=PASS
rootDiscovery=PASS
contractOnlySafety=PASS
legalCertification=false
```

Interpretation:

```txt
The API v1 public surface remains stable at 16 endpoints.
POST /api/v1/chat is now declared as protected by API Auth,
Tenant/Workspace Scope and Rate Limit/Quota controls.
Public discovery endpoints expose the new control-plane state without executing runtime branches.
```

---

## 3. Validated endpoint matrix

The API v1 public endpoint matrix remains:

```txt
GET  /api/v1
GET  /api/v1/health
GET  /api/v1/capabilities
POST /api/v1/ipr/session
GET  /api/v1/ipr/session/{sessionId}
POST /api/v1/chat
POST /api/v1/files
POST /api/v1/operations
GET  /api/v1/operations/{operationId}
GET  /api/v1/events
GET  /api/v1/opc/{opcId}
GET  /api/v1/audit/{auditId}
GET  /api/v1/model-usage/{usageId}
GET  /api/v1/openapi
GET  /api/v1/self-test
GET  /api/v1/source-intelligence
```

Endpoint count:

```txt
endpointCount=16
endpointPass=16
endpointFail=0
```

---

## 4. New control-plane files included in regression

The regression includes the following new or updated implementation files:

```txt
lib/api-auth.ts
lib/tenant-scope.ts
lib/rate-limit-quota.ts
app/api/v1/chat/route.ts
app/api/v1/health/route.ts
app/api/v1/capabilities/route.ts
app/api/v1/self-test/route.ts
app/api/v1/openapi/route.ts
app/api/v1/route.ts
```

Supporting migration and helper files:

```txt
database/migrations/20260609_create_hbce_api_credentials.sql
database/migrations/20260610_create_hbce_tenant_scope.sql
database/migrations/20260610_create_hbce_rate_limit_quota.sql
scripts/create-hbce-api-credential.ts
```

---

## 5. Control-plane revisions

Expected active revisions:

```txt
apiAuthRevision=HBCE-API-AUTH-v0.2-TENANT_SCOPE_VALIDATION_BRIDGE
tenantScopeRevision=HBCE-TENANT-SCOPE-v0.1-CONTROLLED_B2G_PILOT_ISOLATION
rateLimitQuotaRevision=HBCE-RATE-LIMIT-QUOTA-v0.1-CONTROLLED_B2G_PILOT_GUARD
chatRevision=HBCE-IPR-RUNTIME-API-v1-CHAT_BRIDGE_RATE_LIMIT_QUOTA_GATE-v0.3
healthRevision=HBCE-IPR-RUNTIME-API-v1-HEALTH-AUTH_TENANT_QUOTA_STATUS-v1_1
capabilitiesRevision=HBCE-IPR-RUNTIME-API-v1-CAPABILITIES-AUTH_TENANT_QUOTA_STATUS-v1_1
selfTestRevision=HBCE-IPR-RUNTIME-API-v1-SELF_TEST-AUTH_TENANT_QUOTA_CONTRACT-v1_1
openApiRevision=HBCE-IPR-RUNTIME-API-v1-OPENAPI-AUTH_TENANT_QUOTA_SECURITY-v1_2
rootRevision=HBCE-IPR-RUNTIME-API-v1-ROOT-DISCOVERY-AUTH_TENANT_QUOTA_STATUS-v1_2
```

---

## 6. Protected chat endpoint

The protected endpoint is:

```txt
POST /api/v1/chat
```

The controlled execution chain is:

```txt
1. Extract API credential
2. Validate API credential hash/status/scope
3. Validate tenant/workspace binding
4. Validate tenant/workspace ACTIVE state
5. Validate Source Intelligence sourceSet permission if requested
6. Validate rate-limit/quota state
7. Execute runtime bridge only after all gates pass
8. Persist EVT/OPC/audit/usage through existing runtime path
9. Return boundary legalCertification=false
```

Expected protected state:

```txt
chatProtection=IMPLEMENTED_CONTROLLED_PILOT_AUTH_TENANT_QUOTA_GATE
requiredScope=v1:chat:create
apiAuth=REQUIRED_IN_PILOT_MODE
tenantScope=REQUIRED
workspaceScope=REQUIRED
rateLimitQuota=REQUIRED
legalCertification=false
```

---

## 7. API authentication surface

Supported authentication mechanisms:

```txt
x-hbce-api-key: <api-key>
Authorization: Bearer <token>
```

Credential states:

```txt
ACTIVE
SUSPENDED
REVOKED
EXPIRED
ROTATED
```

Required behavior:

```txt
invalid credential => 401
missing credential in required mode => 401
revoked credential => 403
suspended credential => 403
expired credential => 403
rotated credential => 403
credential store unavailable => 503 fail-closed
```

Auth PASS criteria:

```txt
apiAuthGate=PASS
credentialHashing=PASS
secretPlaintextPersistence=false
rawSecretShownOnce=true
scopeEnforcement=PASS
legalCertification=false
```

---

## 8. Tenant/workspace scope surface

Required pilot headers:

```txt
x-hbce-tenant-id: <tenantId>
x-hbce-workspace-id: <workspaceId>
```

Tenant/workspace checks:

```txt
tenant exists
tenant status ACTIVE
workspace exists
workspace status ACTIVE
workspace belongs to tenant
credential belongs to tenant
credential belongs to workspace
subscription active if required
account active if required
self-pilot scope blocked unless explicitly allowed
```

Fail-closed cases:

```txt
missing tenant
missing workspace
tenant mismatch
workspace mismatch
tenant inactive
workspace inactive
subscription expired
subscription suspended
subscription cancelled
self-pilot misuse
```

Tenant/workspace PASS criteria:

```txt
tenantScopeBridge=PASS
workspaceScopeBridge=PASS
crossTenantAccess=FAIL_CLOSED
crossWorkspaceAccess=FAIL_CLOSED
legalCertification=false
```

---

## 9. Rate-limit/quota surface

Rate-limit/quota guard validates:

```txt
requests per minute
requests per hour
requests per day
chat requests per day
operations per day
Source Intelligence runs per day
file uploads per day
exports per day
webhooks per day
monthly cost units
```

Default pilot profile:

```txt
rateLimitProfile=B2G_PILOT_STANDARD
```

Expected headers:

```txt
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
X-HBCE-Quota-Profile
X-HBCE-Quota-Remaining
```

Expected fail-closed response:

```txt
RATE_LIMIT_QUOTA_DENIED
httpStatus=429 | 503
legalCertification=false
```

Rate-limit/quota PASS criteria:

```txt
rateLimitQuotaGate=PASS
quotaLedger=READY
rateLimitEvents=READY
quotaProfiles=READY
legalCertification=false
```

---

## 10. Root discovery regression

Endpoint:

```txt
GET /api/v1
```

Expected root discovery state:

```txt
rootDiscovery=PASS
endpointMatrix=16/16_PASS
apiV1ControlPlane=READY
apiAuth=READY
tenantScope=READY
rateLimitQuota=READY
protectedChatEndpoint=READY
legalCertification=false
```

Must not execute:

```txt
runtime execution
memory write
document ingestion
document recall
Source Intelligence live fetch
```

---

## 11. Health regression

Endpoint:

```txt
GET /api/v1/health
```

Expected health state:

```txt
health=PASS
apiAuthStatus=HBCE_API_AUTH_READY
tenantScopeStatus=HBCE_TENANT_SCOPE_READY
rateLimitQuotaStatus=HBCE_RATE_LIMIT_QUOTA_READY
protectedChatEndpoint=READY
legalCertification=false
```

Expected headers:

```txt
X-HBCE-API-Auth
X-HBCE-Tenant-Scope
X-HBCE-Rate-Limit-Quota
```

Must not execute:

```txt
runtime execution
memory write
document ingestion
document recall
Source Intelligence live fetch
```

---

## 12. Capabilities regression

Endpoint:

```txt
GET /api/v1/capabilities
```

Expected capabilities state:

```txt
capabilities=PASS
API_AUTH_GATE=READY
TENANT_WORKSPACE_SCOPE=READY
RATE_LIMIT_QUOTA_GUARD=READY
POST /api/v1/chat=IMPLEMENTED_CONTROLLED_PILOT_AUTH_TENANT_QUOTA_GATE
legalCertification=false
```

Must expose:

```txt
securityControls
apiV1ControlPlane
protectedChatEndpoint
requiredHeaders
quotaHeaders
boundary
```

---

## 13. Self-test regression

Endpoint:

```txt
GET /api/v1/self-test
```

Expected self-test state:

```txt
selfTest=PASS
contractOnly=PASS
apiAuthContract=PASS
tenantScopeContract=PASS
rateLimitQuotaContract=PASS
protectedChatEndpoint=PASS
legalCertification=false
```

Required contract-only flags:

```txt
performsHttpFetch=false
performsDatabaseLookup=false
performsRuntimeMutation=false
performsMemoryWrite=false
performsSourceLiveFetch=false
performsDocumentIngestion=false
performsDocumentRecall=false
```

---

## 14. OpenAPI regression

Endpoint:

```txt
GET /api/v1/openapi
```

Expected OpenAPI state:

```txt
openApi=PASS
openapi=3.1
securitySchemes=PASS
apiKeyScheme=PASS
bearerScheme=PASS
tenantWorkspaceHeaders=PASS
rateLimitQuotaHeaders=PASS
protectedChatSchema=PASS
ErrorEnvelope=PASS
BoundarySchema=PASS
ProofReferences=PASS
legalCertification=false
```

Required security schemes:

```txt
hbceApiKey
bearerAuth
```

Required request headers:

```txt
x-hbce-api-key
Authorization
x-hbce-tenant-id
x-hbce-workspace-id
x-hbce-source-set
x-hbce-idempotency-key
```

Required response headers:

```txt
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
X-HBCE-Quota-Profile
X-HBCE-Quota-Remaining
```

---

## 15. Contract-only safety regression

The following must remain false during discovery, health, capabilities, self-test and OpenAPI routes:

```txt
runtimeExecution=false
runtimeMemoryWrite=false
semanticMemoryCreated=false
iprMemoryCreated=false
documentIngestionTriggered=false
documentRecallTriggered=false
sourceLiveFetchTriggered=false
sourceProfileSaveTriggered=false
saveChatTriggered=false
```

Expected result:

```txt
CONTRACT_ONLY_SAFETY_PASS
```

---

## 16. Database migration coverage

The regression expects the following schema support:

```txt
hbce_api_credentials
hbce_tenants
hbce_accounts
hbce_subscriptions
hbce_workspaces
hbce_tenant_operator_assignments
hbce_quota_profiles
hbce_rate_limit_events
hbce_quota_ledger
```

Migration files:

```txt
database/migrations/20260609_create_hbce_api_credentials.sql
database/migrations/20260610_create_hbce_tenant_scope.sql
database/migrations/20260610_create_hbce_rate_limit_quota.sql
```

Migration status for regression:

```txt
schemaPlan=READY
migrationFiles=READY
databaseExecution=ENVIRONMENT_DEPENDENT
```

This report does not claim the migrations have already been applied to every target environment.

---

## 17. Required smoke tests after deploy

### Test 1 — Root discovery

```bash
curl -s https://<deployment>/api/v1 | jq
```

Expected:

```txt
endpointMatrix=16/16_PASS
apiV1ControlPlane.apiAuth.status=HBCE_API_AUTH_READY
apiV1ControlPlane.tenantScope.status=HBCE_TENANT_SCOPE_READY
apiV1ControlPlane.rateLimitQuota.status=HBCE_RATE_LIMIT_QUOTA_READY
legalCertification=false
```

---

### Test 2 — Health

```bash
curl -i https://<deployment>/api/v1/health
```

Expected headers:

```txt
X-HBCE-API-Auth
X-HBCE-Tenant-Scope
X-HBCE-Rate-Limit-Quota
```

Expected body:

```txt
legalCertification=false
```

---

### Test 3 — Capabilities

```bash
curl -s https://<deployment>/api/v1/capabilities | jq
```

Expected:

```txt
API_AUTH_GATE=READY
TENANT_WORKSPACE_SCOPE=READY
RATE_LIMIT_QUOTA_GUARD=READY
POST /api/v1/chat protected
legalCertification=false
```

---

### Test 4 — Self-test

```bash
curl -s https://<deployment>/api/v1/self-test | jq
```

Expected:

```txt
contractOnly=PASS
performsRuntimeMutation=false
performsMemoryWrite=false
legalCertification=false
```

---

### Test 5 — OpenAPI

```bash
curl -s https://<deployment>/api/v1/openapi | jq '.components.securitySchemes'
```

Expected:

```txt
hbceApiKey
bearerAuth
```

---

### Test 6 — Protected chat without key

```bash
curl -s -X POST https://<deployment>/api/v1/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"test"}' | jq
```

Expected if `HBCE_API_AUTH_MODE=PILOT_REQUIRED`:

```txt
status=API_AUTH_DENIED
failReason=API_CREDENTIAL_REQUIRED
legalCertification=false
```

---

### Test 7 — Protected chat with pilot key

```bash
curl -s -X POST https://<deployment>/api/v1/chat \
  -H 'Content-Type: application/json' \
  -H 'x-hbce-api-key: <PILOT_API_KEY>' \
  -H 'x-hbce-tenant-id: HBCE-TENANT-CLIENT-CODE-PILOT' \
  -H 'x-hbce-workspace-id: HBCE-WORKSPACE-AI-AUDIT-TRAIL' \
  -d '{"message":"Run a governed runtime diagnostic for this pilot tenant."}' | jq
```

Expected after migrations and credential seed:

```txt
apiAuth.status=API_AUTH_GRANTED
tenantScope=PASS
workspaceScope=PASS
rateLimitQuota.status=RATE_LIMIT_QUOTA_GRANTED
legalCertification=false
```

---

## 18. Regression PASS block

Expected final regression output:

```txt
HBCE_API_V1_PUBLIC_SURFACE_REGRESSION_v77_READY
revision=API_V1_PUBLIC_SURFACE_AUTH_TENANT_QUOTA_REGRESSION-v77
endpointMatrix=16/16_PASS
rootDiscovery=PASS
health=PASS
capabilities=PASS
selfTest=PASS
openApi=PASS
protectedChatEndpoint=PASS
apiAuthGate=PASS
tenantScopeBridge=PASS
rateLimitQuotaGate=PASS
contractOnlySafety=PASS
runtimeMutation=false
memoryWrite=false
documentIngestion=false
documentRecall=false
sourceLiveFetch=false
legalCertification=false
```

---

## 19. Known limitations

This regression does not yet prove:

```txt
production SaaS readiness
full external client onboarding
completed production API key rollout
enterprise SSO
advanced RBAC
billing automation
SOC2/ISO certification
legal certification
qualified timestamping
```

Current stage remains:

```txt
Controlled B2G pilot-readiness implementation path.
```

---

## 20. Final boundary

Mandatory final boundary:

```txt
legalCertification=false
OPC is a technical proof receipt only.
EVT is a technical event trace only.
IPR is an operational identity/proof layer only.
HBCE/JOKER-C2 is runtime governance and audit-ready infrastructure,
not a public authority and not a legal certifier.
