# HBCE IPR Runtime API v1 — Rate Limit and Quota Policy

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Repository:** `hbce-ai-joker-c2`  
**Document type:** rate limit and quota policy  
**Audience:** internal operators, technical partners, security reviewers, B2B / B2G pilot evaluators  
**Policy status:** `pilot rate limit baseline`  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Purpose

This document defines the pilot-stage rate limit and quota policy for the HBCE IPR Runtime API v1.

It complements:

```txt
docs/product/hbce-ipr-runtime-api-v1-client.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-product-index.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
```

The goal is to define how much traffic a pilot partner may send, how limits are measured, how abuse is blocked, how keys are suspended and how the runtime remains governed under load.

An API without quotas is not a pilot. It is a polite invitation for chaos to wear a lanyard.

---

## 2. Policy verdict target

The rate limit baseline is ready when the following posture is preserved:

```txt
protected execution requires API key
each API key belongs to one pilot scope
tenant and workspace are explicit
chat execution is rate-limited
IPR session creation is rate-limited
file ingestion is quota-limited
lookup routes are rate-limited
source intelligence is quota-limited
burst traffic is controlled
abuse triggers suspension
key revocation process exists
quota increase requires operator approval
legalCertification=false remains explicit
OPC remains technical proof receipt only
```

Canonical live smoke result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

---

## 3. Boundary

This document defines technical access controls and operational quotas.

It does not define legal certification.

Canonical boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
IPR Card is an internal operational identity certificate, not an official public identity document
```

Rate limits do not convert technical proof receipts into legal certification. They only prevent a pilot from becoming a small, self-inflicted denial-of-service experiment.

---

## 4. Scope

This policy applies to:

```txt
GET  /api/v1
GET  /api/v1/health
GET  /api/v1/capabilities
GET  /api/v1/self-test
GET  /api/v1/openapi
POST /api/v1/ipr/session
POST /api/v1/chat
POST /api/v1/files
GET  /api/v1/operations/{operationId}
GET  /api/v1/events?eventId={eventId}
GET  /api/v1/opc/{opcId}
GET  /api/v1/audit/{auditId}
GET  /api/v1/model-usage/{usageId}
```

It also applies to future v1 pilot extensions, including:

```txt
source intelligence
document profile lookup
partner onboarding endpoints
client telemetry endpoints
usage reporting endpoints
```

---

## 5. Limit dimensions

API v1 limits should be evaluated across the following dimensions:

```txt
apiKey
tenant
workspace
humanIpr
runtimeIpr
sessionId
route
method
IP address
partner organization
time window
payload size
file size
source intelligence source set
```

Minimum pilot dimensions:

```txt
apiKey
tenant
workspace
route
time window
```

Recommended full dimensions:

```txt
apiKey + tenant + workspace + route + humanIpr + sessionId
```

---

## 6. Pilot access tiers

### Tier 0 — internal validation

Use for:

```txt
internal operator tests
post-deploy smoke tests
route validation
documentation verification
```

Recommended limits:

```txt
chat requests: 30/hour
IPR session creation: 20/hour
lookup requests: 300/hour
file ingestion: disabled unless explicitly tested
source intelligence: disabled unless explicitly tested
```

### Tier 1 — controlled partner pilot

Use for:

```txt
single partner
single tenant
single workspace
technical integration test
limited business evaluation
```

Recommended limits:

```txt
chat requests: 100/day
IPR session creation: 50/day
lookup requests: 1,000/day
file ingestion: 20 files/day
source intelligence fetch/register: 50/day
```

### Tier 2 — extended pilot

Use for:

```txt
approved partner sandbox
multiple technical users
scheduled demo cycle
controlled pre-commercial evaluation
```

Recommended limits:

```txt
chat requests: 1,000/day
IPR session creation: 300/day
lookup requests: 10,000/day
file ingestion: 200 files/day
source intelligence fetch/register: 500/day
```

### Tier 3 — production candidate

Use only after:

```txt
security review
quota review
logging review
incident response process
commercial or institutional agreement
data processing boundaries
```

Recommended limits must be defined by contract, not copied from pilot defaults.

---

## 7. Default pilot quotas

Default controlled pilot policy:

```txt
tier=Tier 1
chatRequestsPerDay=100
iprSessionsPerDay=50
lookupRequestsPerDay=1000
fileUploadsPerDay=20
sourceFetchesPerDay=50
maxRequestBodyBytes=262144
maxFileBytes=10485760
burstWindowSeconds=60
burstChatRequests=10
burstLookupRequests=100
```

Default conservative pilot policy:

```txt
tier=Tier 1 Conservative
chatRequestsPerDay=50
iprSessionsPerDay=25
lookupRequestsPerDay=500
fileUploadsPerDay=10
sourceFetchesPerDay=25
maxRequestBodyBytes=131072
maxFileBytes=5242880
burstWindowSeconds=60
burstChatRequests=5
burstLookupRequests=50
```

Default technical demo policy:

```txt
tier=Demo
chatRequestsPerDay=20
iprSessionsPerDay=10
lookupRequestsPerDay=200
fileUploadsPerDay=0
sourceFetchesPerDay=0
maxRequestBodyBytes=65536
maxFileBytes=0
burstWindowSeconds=60
burstChatRequests=3
burstLookupRequests=30
```

---

## 8. Public route policy

Public contract routes:

```txt
GET /api/v1
GET /api/v1/health
GET /api/v1/capabilities
GET /api/v1/self-test
GET /api/v1/openapi
```

Recommended limit:

```txt
100 requests/minute per IP
1,000 requests/hour per IP
10,000 requests/day per IP
```

Security expectation:

```txt
no secrets
no private data
no raw prompts
no raw completions
no session identifiers
no private tenant data
```

If public route traffic spikes:

```txt
return HTTP 429
cache safe metadata where possible
do not degrade protected execution
do not expose internal load state
```

---

## 9. IPR session route policy

Route:

```txt
POST /api/v1/ipr/session
```

Recommended controlled pilot limit:

```txt
50 sessions/day per API key
10 sessions/hour per API key
5 sessions/minute per API key
```

Additional dimensions:

```txt
tenant
workspace
humanIpr
IP address
```

Hard stop conditions:

```txt
missing API key
invalid API key
missing humanIpr
invalid humanIpr
invalid tenant
invalid workspace
session creation spike
session creation from unexpected IP range
```

Expected smoke result:

```txt
PASS ipr session create [critical] http=201
```

Required boundary fields:

```txt
legalCertification=false
opcBoundary=technical proof receipt only
```

---

## 10. Chat route policy

Route:

```txt
POST /api/v1/chat
```

Recommended controlled pilot limit:

```txt
100 chat requests/day per API key
30 chat requests/hour per API key
10 chat requests/minute per API key
5 chat requests/minute per session
```

Recommended demo limit:

```txt
20 chat requests/day per API key
10 chat requests/hour per API key
3 chat requests/minute per API key
```

Required fail-closed behavior:

```txt
POST /api/v1/chat without API key -> HTTP 401 or HTTP 403
POST /api/v1/chat without sessionId -> controlled failure
POST /api/v1/chat with invalid tenant/workspace -> controlled failure
```

Canonical smoke line:

```txt
PASS chat without key fail-closed [critical] http=401
```

Expected authenticated smoke line:

```txt
PASS chat with key [critical] http=200
```

---

## 11. File ingestion policy

Route:

```txt
POST /api/v1/files
```

Default controlled pilot limit:

```txt
20 files/day per API key
5 files/hour per API key
2 files/minute per API key
maxFileBytes=10485760
maxTotalDailyUploadBytes=104857600
```

Conservative pilot limit:

```txt
10 files/day per API key
2 files/hour per API key
1 file/minute per API key
maxFileBytes=5242880
maxTotalDailyUploadBytes=26214400
```

Security controls:

```txt
filename sanitization
MIME type restriction
path traversal prevention
payload size validation
no unrestricted raw file exposure
memory write only by explicit operator policy
prompt injection screening for extracted text
malware/risk scanning before wider external pilot
```

Default pilot posture:

```txt
file ingestion allowed only for approved test materials
```

---

## 12. Lookup route policy

Lookup routes:

```txt
GET /api/v1/operations/{operationId}
GET /api/v1/events?eventId={eventId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
GET /api/v1/model-usage/{usageId}
```

Recommended controlled pilot limit:

```txt
1,000 lookup requests/day per API key
300 lookup requests/hour per API key
100 lookup requests/minute per API key
30 lookup requests/minute per identifier family
```

Lookup routes should return:

```txt
safe envelopes
status
boundary
technical identifiers
redacted metadata
```

Lookup routes must not return:

```txt
API keys
bearer tokens
cookies
raw prompts
raw completions
raw provider payloads
database connection details
cross-tenant data
```

---

## 13. EVT lookup policy

Correct route:

```txt
GET /api/v1/events?eventId={eventId}
```

Incorrect route:

```txt
GET /api/v1/events/{eventId}
```

Recommended limits:

```txt
300 event lookups/hour per API key
100 event lookups/minute per API key
30 event lookups/minute per eventId pattern
```

Expected smoke result:

```txt
PASS events lookup [optional] http=200
```

If the event route changes, update:

```txt
scripts/test-api-v1-client-smoke.mjs
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-product-index.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
```

Yes, the route path must match the docs. Apparently this has to be said out loud because computers are annoyingly literal.

---

## 14. OPC lookup policy

Route:

```txt
GET /api/v1/opc/{opcId}
```

Recommended limits:

```txt
300 OPC lookups/hour per API key
100 OPC lookups/minute per API key
30 OPC lookups/minute per opcId pattern
```

Required boundary:

```txt
OPC=technical proof receipt only
legalCertification=false
```

Expected smoke result:

```txt
PASS opc lookup [optional] http=200
```

---

## 15. Audit lookup policy

Route:

```txt
GET /api/v1/audit/{auditId}
```

Recommended limits:

```txt
300 audit lookups/hour per API key
100 audit lookups/minute per API key
30 audit lookups/minute per auditId pattern
```

Audit lookup must remain conservative.

Do not expose:

```txt
raw prompt
raw completion
provider payload
API key
session secret
cookies
private database rows
cross-tenant data
```

Expected smoke result:

```txt
PASS audit lookup [optional] http=200
```

---

## 16. Model usage lookup policy

Route:

```txt
GET /api/v1/model-usage/{usageId}
```

Recommended limits:

```txt
300 usage lookups/hour per API key
100 usage lookups/minute per API key
```

Accepted smoke state:

```txt
SKIPPED model usage lookup [optional] :: no lookup id returned by chat response
```

This is acceptable when:

```txt
usageId=NONE
```

Do not treat usage lookup skip as security failure during pilot if the chat response does not return a usage ID.

---

## 17. Source intelligence quota policy

If source intelligence is enabled:

```txt
defaultSourceFetchesPerDay=50
defaultSourceRegistrationsPerDay=20
defaultSourceVerificationsPerDay=50
defaultSourceSearchesPerDay=100
maxSourceTextBytes=250000
rawTextPersistence=false
memoryProfilePolicy=EXPLICIT_OPERATOR_SAVE_ONLY
```

Controls:

```txt
allowlist domains only
registered source sets only
prompt injection screening
hash fetched content
do not persist raw text by default
technical source receipt only
no legal certification claim
```

Boundary:

```txt
legalCertification=false
technical source receipt only
```

---

## 18. Burst control

Recommended burst windows:

```txt
window=60 seconds
chat burst=10 per API key
session burst=5 per API key
file burst=2 per API key
lookup burst=100 per API key
source burst=20 per API key
```

When exceeded:

```txt
return HTTP 429
include safe Retry-After when available
do not expose internal counter details
do not execute protected runtime operation
do not create EVT/OPC for blocked request unless explicitly logged as security event
```

Recommended response concept:

```txt
RATE_LIMIT_EXCEEDED
```

Optional safe metadata:

```txt
limitType
retryAfterSeconds
route
tenant
workspace
legalCertification=false
```

Do not include:

```txt
full internal quota table
API key value
database record IDs beyond safe public receipt envelope
```

---

## 19. Daily quota reset

Recommended reset strategy:

```txt
daily quota window = UTC calendar day
hourly quota window = rolling 60 minutes
minute quota window = rolling 60 seconds
```

Operational display may also include local time:

```txt
Europe/Rome
```

But quota enforcement should use a consistent canonical clock.

Recommended canonical clock:

```txt
UTC
```

---

## 20. Quota increase process

Quota increases require operator approval.

Checklist:

```txt
[ ] partner identified
[ ] tenant identified
[ ] workspace identified
[ ] current quota documented
[ ] requested quota documented
[ ] reason documented
[ ] expected traffic documented
[ ] data class documented
[ ] route list documented
[ ] security checklist reviewed
[ ] key rotation path confirmed
[ ] incident contact confirmed
[ ] approval recorded
```

Do not increase quota automatically from a partner email alone.

Emails are not security controls. They are vibes with headers.

---

## 21. Abuse detection signals

Monitor for:

```txt
chat request spike
session creation spike
lookup enumeration pattern
many unknown IDs
many invalid sessions
many invalid tenants
many invalid workspaces
many 401/403 responses
many 429 responses
large payload spikes
file upload bursts
source fetch bursts
repeated malformed JSON
route probing
unexpected IP geography
```

Possible abuse outcomes:

```txt
temporary throttle
temporary key suspension
tenant-level pause
workspace-level pause
route-specific block
manual review
key revocation
incident record
```

---

## 22. Suspension policy

Suspend API key when:

```txt
API key appears leaked
chat route is abused
file ingestion is abused
source intelligence is abused
cross-tenant probing is detected
rate limit evasion is detected
malformed traffic is persistent
partner exceeds agreed quota repeatedly
security boundary is violated
```

Suspension record should include:

```txt
keyId or key fingerprint
tenant
workspace
partner
reason
detectedAt
suspendedAt
routes affected
evidence summary
operator
status
```

Do not store the raw API key in the suspension record.

---

## 23. Revocation policy

Revoke API key when:

```txt
confirmed leak
confirmed unauthorized use
partner offboarding
contract termination
severe abuse
repeated policy breach
operator security decision
```

Revocation checklist:

```txt
[ ] identify key.
[ ] disable key.
[ ] confirm protected routes reject key.
[ ] notify internal operator.
[ ] notify partner if appropriate.
[ ] preserve audit record.
[ ] issue replacement key only after review.
[ ] rerun smoke test if runtime policy changed.
```

---

## 24. HTTP response policy

Recommended status codes:

```txt
200 OK = successful lookup or public metadata
201 Created = session created
400 Bad Request = malformed input
401 Unauthorized = missing/invalid authentication
403 Forbidden = authenticated but not allowed
404 Not Found = safe unknown resource or contract boundary
409 Conflict = conflicting session/scope where applicable
413 Payload Too Large = request/file too large
415 Unsupported Media Type = disallowed file type
429 Too Many Requests = rate limit exceeded
500 Internal Server Error = unexpected server failure, redacted
503 Service Unavailable = temporary runtime unavailable
```

429 response should be safe:

```json
{
  "status": "RATE_LIMIT_EXCEEDED",
  "route": "/api/v1/chat",
  "retryAfterSeconds": 60,
  "legalCertification": false,
  "opcBoundary": "technical proof receipt only"
}
```

Do not include internal counter implementation details in partner-facing responses.

---

## 25. Headers policy

Recommended response headers for limited routes:

```txt
Retry-After
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
```

Only expose these if they do not leak sensitive internal state.

Conservative pilot option:

```txt
Retry-After only
```

Do not expose:

```txt
key fingerprint
internal tenant primary key
internal database counter key
raw quota storage identifier
```

---

## 26. Storage policy for quota counters

Quota counters may be stored by:

```txt
apiKey fingerprint
tenant
workspace
route
time window
```

Do not store:

```txt
raw API key
bearer token
session secret
full request body
raw prompt
raw completion
```

Recommended counter key format concept:

```txt
quota:{tenant}:{workspace}:{apiKeyFingerprint}:{route}:{window}
```

Actual implementation should avoid leaking secrets in key names.

---

## 27. Logging policy for quotas

Log:

```txt
route
method
status
tenant
workspace
apiKeyPresent boolean
apiKeyFingerprint if safe
quotaDecision
limitType
failReason
timestamp
```

Do not log:

```txt
raw API key
bearer token
cookies
session secret
raw prompt
raw completion
provider payload
private file content
```

Safe examples:

```txt
apiKey=SET
quotaDecision=ALLOW
quotaDecision=BLOCK_429
failReason=RATE_LIMIT_EXCEEDED
```

Unsafe example:

```txt
apiKey=<actual key value>
```

---

## 28. Smoke test relationship

The live smoke test validates functional access, not the full quota implementation.

Smoke test file:

```txt
scripts/test-api-v1-client-smoke.mjs
```

Expected result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Smoke confirms:

```txt
root discovery works
health works
capabilities works
self-test works
openapi works
chat without key fails closed
IPR session creation works
authenticated chat works
operations lookup works
events lookup works
OPC lookup works
audit lookup works
model usage skip is accepted when usageId=NONE
```

Smoke does not automatically confirm:

```txt
daily quota enforcement
burst enforcement
file upload limits
source fetch limits
tenant quota isolation
quota storage correctness
partner suspension workflow
```

Those require separate tests.

---

## 29. Quota testing plan

Recommended tests:

```txt
1. Send chat requests under minute limit: expect 200.
2. Exceed chat burst limit: expect 429.
3. Retry after window: expect 200.
4. Exceed session creation burst: expect 429.
5. Exceed lookup burst: expect 429.
6. Upload file over size limit: expect 413.
7. Upload unsupported MIME type: expect 415.
8. Use invalid tenant: expect 403 or controlled failure.
9. Use invalid workspace: expect 403 or controlled failure.
10. Use revoked key: expect 401/403.
11. Confirm no secrets in error bodies.
12. Confirm no raw prompts in quota logs.
```

Future test file candidate:

```txt
scripts/test-api-v1-rate-limit-quota.mjs
```

---

## 30. Partner-facing quota statement

Suggested partner statement:

```txt
Your pilot access is rate-limited by API key, tenant, workspace and route. The pilot is intended for controlled technical validation, not unrestricted production traffic. Quotas may be adjusted only after operator approval. HBCE may throttle, suspend or revoke access in case of abuse, key exposure, cross-scope probing or policy violation.
```

Boundary sentence:

```txt
All runtime receipts remain technical proof receipts only. legalCertification=false.
```

---

## 31. Internal operator checklist

Before issuing partner access:

```txt
[ ] choose pilot tier.
[ ] assign tenant.
[ ] assign workspace.
[ ] issue API key.
[ ] record key fingerprint.
[ ] record partner technical contact.
[ ] record security contact.
[ ] define allowed routes.
[ ] define daily quota.
[ ] define burst quota.
[ ] define file quota.
[ ] define source quota.
[ ] define expiration date.
[ ] define revocation owner.
[ ] send quickstart.
[ ] send security checklist.
[ ] send rate limit/quota policy.
```

---

## 32. External pilot checklist

Before partner test:

```txt
[ ] partner confirms API key handling.
[ ] partner confirms no production secrets in prompts.
[ ] partner confirms no unauthorized personal data.
[ ] partner confirms quota boundaries.
[ ] partner confirms legalCertification=false.
[ ] partner confirms OPC technical proof receipt only.
[ ] partner runs quickstart.
[ ] partner runs smoke test if authorized.
[ ] operator reviews traffic after first test.
```

---

## 33. Quota escalation conditions

Quota may be increased only if:

```txt
smoke test passes
partner stayed within initial quota
no abuse signals
no key leakage
no cross-tenant probing
data class is approved
security checklist is accepted
operator approves escalation
```

Quota must not be increased if:

```txt
key handling is unclear
partner cannot identify technical contact
partner wants unrestricted production usage during pilot
partner wants to process unapproved sensitive data
partner refuses boundary statement
partner repeatedly hits 429 without coordination
```

---

## 34. Quota breach response

If quota is exceeded:

```txt
[ ] return 429.
[ ] preserve safe quota event.
[ ] avoid runtime execution.
[ ] avoid creating unnecessary model usage.
[ ] notify operator if repeated.
[ ] notify partner if persistent.
[ ] require approval before increasing quota.
```

If abuse is suspected:

```txt
[ ] suspend key.
[ ] review logs.
[ ] identify affected tenant/workspace.
[ ] check for data exposure.
[ ] document incident.
[ ] rotate key if needed.
[ ] rerun smoke test after mitigation.
```

---

## 35. Contract and pilot boundary

The rate limit policy should be attached to any controlled pilot agreement.

Minimum terms:

```txt
allowed routes
quota tier
data class
tenant/workspace
API key handling
revocation rights
incident contact
legalCertification=false
OPC technical proof receipt only
no production reliance without written approval
```

Do not allow a pilot partner to treat pilot quotas as production service-level commitments.

Pilot means pilot. Not stealth production wearing a fake mustache.

---

## 36. Current product documentation state

Current API v1 documentation package:

```txt
client note = PASS
smoke test report = PASS
integration guide = PASS
pilot package = PASS
quickstart = PASS
product index = PASS
security checklist = PASS
rate limit and quota policy = ready
```

Core validation anchor:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

---

## 37. Final policy verdict

```txt
HBCE IPR Runtime API v1 rate limit and quota policy = pilot baseline ready
```

The API v1 package is suitable for controlled B2B / B2G pilot evaluation when access is limited by API key, tenant, workspace, route, burst window, daily quota and operator approval.

Final boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
