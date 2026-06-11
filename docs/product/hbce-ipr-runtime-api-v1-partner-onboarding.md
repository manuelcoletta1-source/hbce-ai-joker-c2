# HBCE IPR Runtime API v1 — Partner Onboarding

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Repository:** `hbce-ai-joker-c2`  
**Document type:** partner onboarding guide  
**Audience:** B2B / B2G pilot partners, internal operators, technical integrators, security reviewers  
**Onboarding status:** `controlled partner pilot onboarding`  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Purpose

This document defines the onboarding process for a controlled partner pilot of the HBCE IPR Runtime API v1.

It explains how a partner moves from initial qualification to technical access, quickstart execution, smoke validation, quota assignment, security review, pilot operation and offboarding.

This is not a marketing one-pager. It is the operational checklist that stops a pilot from becoming three people emailing screenshots at midnight and calling it “integration”.

---

## 2. Related API v1 documents

The onboarding process depends on the current API v1 documentation package:

```txt
docs/product/hbce-ipr-runtime-api-v1-client.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-product-index.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
```

Executable smoke test:

```txt
scripts/test-api-v1-client-smoke.mjs
```

Core validation anchor:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

---

## 3. Onboarding verdict target

A partner is onboarded only when the following state is true:

```txt
partner identity recorded
technical contact recorded
security contact recorded
pilot purpose recorded
tenant assigned
workspace assigned
API key issued
API key handling accepted
allowed routes defined
quota tier assigned
data class approved
quickstart sent
security checklist accepted
rate limit policy accepted
IPR session flow understood
authenticated chat flow tested
lookup routes tested
smoke test passed or operator-validated
legalCertification=false accepted
OPC technical proof receipt boundary accepted
offboarding and revocation path defined
```

Final onboarding verdict:

```txt
HBCE IPR Runtime API v1 partner onboarding = pilot-ready
```

---

## 4. Canonical boundary

The partner must explicitly accept this boundary before receiving pilot access:

```txt
legalCertification=false
OPC=technical proof receipt only
IPR Card is an internal operational identity certificate, not an official public identity document
```

The pilot does not provide:

```txt
legal certification
public identity certification
qualified electronic signature
court-admissible proof by default
official public authority certification
unrestricted production API access
```

The API provides governed technical runtime interaction, traceability and technical proof receipts within the agreed pilot scope.

---

## 5. Partner qualification

Before onboarding, collect:

```txt
partner legal/company name
partner website
partner country
partner business domain
pilot sponsor
technical contact
security contact
data protection contact where applicable
intended use case
expected pilot duration
expected traffic volume
expected data class
requested routes
requested quota tier
```

Qualification checklist:

```txt
[ ] partner identity is clear.
[ ] pilot use case is clear.
[ ] partner technical contact exists.
[ ] partner security contact exists.
[ ] data class is known.
[ ] expected traffic is known.
[ ] requested routes are known.
[ ] partner understands pilot boundary.
[ ] partner does not expect legal certification.
[ ] partner does not expect unrestricted production usage.
```

Do not issue a key when the partner cannot name a technical owner. “The team” is not an owner. It is a fog bank with email addresses.

---

## 6. Pilot use case classification

Classify the pilot into one or more domains:

```txt
AI governance
cybersecurity
compliance
legal-tech
B2B software integration
B2G technical evaluation
institutional audit workflow
source intelligence
document governance
runtime proof workflow
controlled AI interaction
```

Use case notes:

```txt
AI governance = governed AI runtime and audit trail.
Cybersecurity = defensive-only runtime control and traceability.
Compliance = event, audit and technical proof envelopes.
Legal-tech = technical evidence layer only, no legal certification claim.
B2G = institutional technical evaluation, not public authority certification.
Source intelligence = allowlisted source handling, technical source receipts only.
```

---

## 7. Data class approval

Allowed by default:

```txt
synthetic data
public data
redacted internal examples
controlled technical prompts
approved test files
non-sensitive demo documents
```

Requires explicit approval:

```txt
confidential business data
personal data
regulated personal data
legal privileged material
financial system data
security incident material
source intelligence from restricted domains
```

Not allowed in default pilot:

```txt
API keys
passwords
private keys
payment card data
unredacted health data
classified information
unapproved personal data
third-party confidential data without authorization
production secrets
```

Partner data checklist:

```txt
[ ] data class documented.
[ ] data owner identified.
[ ] sensitive data excluded unless approved.
[ ] no secrets in prompts.
[ ] no credentials in files.
[ ] no unapproved personal data.
[ ] no production secrets.
```

---

## 8. Pilot scope assignment

Each partner pilot must receive a defined scope.

Required fields:

```txt
tenantId
workspaceId
allowedRoutes
quotaTier
apiKeyOwner
technicalContact
securityContact
pilotStartDate
pilotEndDate
revocationOwner
```

Default self-pilot runtime reference:

```txt
runtimeIprId=IPR-AI-0001
```

Partner scope example:

```txt
tenantId=HBCE-TENANT-PARTNER-<NAME>
workspaceId=HBCE-WORKSPACE-PILOT-<NAME>
quotaTier=Tier 1 controlled partner pilot
allowedRoutes=ipr/session, chat, events, opc, audit, operations
```

Never rely on a partner name alone for runtime authorization. Names are for humans, and humans already caused enough trouble.

---

## 9. Allowed route set

Default controlled partner pilot routes:

```txt
GET  /api/v1
GET  /api/v1/health
GET  /api/v1/capabilities
GET  /api/v1/openapi
POST /api/v1/ipr/session
POST /api/v1/chat
GET  /api/v1/operations/{operationId}
GET  /api/v1/events?eventId={eventId}
GET  /api/v1/opc/{opcId}
GET  /api/v1/audit/{auditId}
```

Optional routes:

```txt
GET  /api/v1/self-test
POST /api/v1/files
GET  /api/v1/model-usage/{usageId}
source intelligence routes when explicitly enabled
```

Restricted by default:

```txt
file ingestion
source intelligence fetch/register
memory write operations
administrative routes
tenant management
key management
raw database lookup
```

---

## 10. API key issuance

Before issuing a key:

```txt
[ ] partner identity recorded.
[ ] tenant assigned.
[ ] workspace assigned.
[ ] technical contact recorded.
[ ] security contact recorded.
[ ] allowed routes approved.
[ ] quota tier approved.
[ ] data class approved.
[ ] expiration date set.
[ ] revocation owner assigned.
[ ] security checklist accepted.
[ ] rate limit policy accepted.
```

Key handling rules:

```txt
do not paste API key in chat
do not commit API key
do not store API key in Markdown
do not include API key in screenshots
do not send API key to shared mailing lists
do not log API key value
do not print API key in smoke output
```

Safe terminal pattern:

```bash
read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo
export HBCE_API_V1_KEY
```

Cleanup:

```bash
unset HBCE_API_V1_KEY
```

---

## 11. Partner package delivery

Send the partner:

```txt
hbce-ipr-runtime-api-v1-quickstart.md
hbce-ipr-runtime-api-v1-integration-guide.md
hbce-ipr-runtime-api-v1-security-checklist.md
hbce-ipr-runtime-api-v1-rate-limit-quota.md
hbce-ipr-runtime-api-v1-pilot-package.md
hbce-ipr-runtime-api-v1-client-smoke-test.md
```

Recommended reading order for partner:

```txt
1. quickstart
2. security checklist
3. rate limit and quota policy
4. integration guide
5. smoke test report
6. pilot package
```

Recommended operator note:

```txt
Start with the quickstart. Do not run production traffic. Do not use secrets or uncontrolled personal data. Keep legalCertification=false and OPC technical proof receipt only in all internal notes.
```

---

## 12. Partner technical setup

Partner environment variables:

```txt
HBCE_API_V1_BASE_URL
HBCE_API_V1_KEY
HBCE_OPERATOR_IPR_ID
HBCE_RUNTIME_IPR_ID
HBCE_TENANT_ID
HBCE_WORKSPACE_ID
```

Default base URL:

```txt
https://hbce-ai-joker-c2.vercel.app
```

Base API root:

```txt
https://hbce-ai-joker-c2.vercel.app/api/v1
```

Minimum terminal setup:

```bash
export HBCE_API_V1_BASE_URL="https://hbce-ai-joker-c2.vercel.app"

read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo
export HBCE_API_V1_KEY

export HBCE_RUNTIME_IPR_ID="IPR-AI-0001"
export HBCE_TENANT_ID="<assigned tenant>"
export HBCE_WORKSPACE_ID="<assigned workspace>"
export HBCE_OPERATOR_IPR_ID="<assigned operator/human IPR>"
```

---

## 13. Public discovery check

Partner should test:

```txt
GET /api/v1
GET /api/v1/health
GET /api/v1/capabilities
GET /api/v1/openapi
```

Expected concepts:

```txt
HBCE
API v1
health ready
capabilities ready
legalCertification=false
technical proof receipt only
```

Public discovery must not expose:

```txt
API key
session ID
private Human IPR
raw prompts
raw completions
database rows
provider payloads
```

---

## 14. Fail-closed validation

Partner must verify protected chat does not run without key.

Route:

```txt
POST /api/v1/chat
```

Expected:

```txt
HTTP 401
```

or:

```txt
HTTP 403
```

Canonical smoke line:

```txt
PASS chat without key fail-closed [critical] http=401
```

If unauthenticated chat returns `200`, stop the pilot immediately.

This is not a “small issue”. This is the system politely removing its own front door.

---

## 15. IPR session creation

Route:

```txt
POST /api/v1/ipr/session
```

Partner must send:

```txt
tenantId
workspaceId
operatorIprId
humanIprId
runtimeIprId
legalCertification=false
opcBoundary=technical proof receipt only
```

Expected smoke result:

```txt
PASS ipr session create [critical] http=201
```

Session rules:

```txt
session must be created after scope validation
session ID must not be published
session ID must not be inserted into documentation
session ID must be used only in the controlled test flow
```

---

## 16. Authenticated chat execution

Route:

```txt
POST /api/v1/chat
```

Partner must send:

```txt
message or messages
tenantId
workspaceId
operatorIprId or humanIprId
runtimeIprId
sessionId or iprSessionId
legalCertification=false
opcBoundary=technical proof receipt only
```

Expected smoke result:

```txt
PASS chat with key [critical] http=200
```

Expected concept:

```txt
HBCE_IPR_RUNTIME_CHAT_READY
```

Chat response may return:

```txt
EVT ID
OPC ID
audit ID
operation ID
usage ID when available
```

Partner must not treat these as legal certification identifiers.

---

## 17. Lookup validation

Lookup routes:

```txt
GET /api/v1/operations/{operationId}
GET /api/v1/events?eventId={eventId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
GET /api/v1/model-usage/{usageId}
```

Correct EVT route:

```txt
GET /api/v1/events?eventId={eventId}
```

Incorrect EVT route:

```txt
GET /api/v1/events/{eventId}
```

Expected smoke results:

```txt
PASS operations lookup [optional] http=200
PASS events lookup [optional] http=200
PASS opc lookup [optional] http=200
PASS audit lookup [optional] http=200
SKIPPED model usage lookup when usageId=NONE
```

Lookup routes must return envelopes, not raw internal data dumps.

---

## 18. Smoke test

Authorized partners or internal operators may run:

```txt
scripts/test-api-v1-client-smoke.mjs
```

Expected final result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Smoke validates:

```txt
node runtime
root discovery
health
capabilities
self-test
openapi
chat without key fail-closed
IPR session creation
authenticated chat
operations lookup
events lookup
OPC lookup
audit lookup
model usage skip when usageId=NONE
```

Smoke does not prove:

```txt
full production readiness
legal certification
penetration test completion
quota enforcement in all windows
regulatory approval
```

---

## 19. Quota assignment

Default controlled partner pilot:

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

Quota checklist:

```txt
[ ] quota tier assigned.
[ ] partner accepts limits.
[ ] partner understands 429.
[ ] partner understands no automatic quota escalation.
[ ] partner has escalation contact.
[ ] operator has suspension path.
```

Expected rate-limit response concept:

```txt
RATE_LIMIT_EXCEEDED
```

---

## 20. Security acceptance

Partner must accept:

```txt
security checklist
rate limit policy
key handling rules
data class restrictions
boundary statement
revocation rights
incident contact process
```

Minimum acceptance criteria:

```txt
[ ] no secrets in prompts.
[ ] no API key in code.
[ ] no unapproved personal data.
[ ] no production traffic.
[ ] no quota abuse.
[ ] no route probing.
[ ] no cross-tenant testing.
[ ] no legal certification claim.
[ ] no OPC misuse.
```

---

## 21. Pilot kickoff checklist

Before kickoff:

```txt
[ ] partner qualified.
[ ] use case classified.
[ ] data class approved.
[ ] tenant assigned.
[ ] workspace assigned.
[ ] API key issued.
[ ] quota tier assigned.
[ ] allowed routes defined.
[ ] quickstart sent.
[ ] security checklist sent.
[ ] rate limit policy sent.
[ ] partner technical setup confirmed.
[ ] kickoff date confirmed.
[ ] revocation owner confirmed.
```

During kickoff:

```txt
[ ] public discovery works.
[ ] fail-closed chat works.
[ ] IPR session creation works.
[ ] authenticated chat works.
[ ] EVT lookup works.
[ ] OPC lookup works.
[ ] audit lookup works.
[ ] smoke test result captured where authorized.
[ ] partner confirms boundary.
```

---

## 22. Pilot monitoring

Monitor:

```txt
request count
route usage
chat request volume
session creation volume
lookup volume
429 count
401/403 count
invalid tenant attempts
invalid workspace attempts
invalid session attempts
file upload attempts
source intelligence attempts
unexpected IP activity
quota breach patterns
```

Operator actions:

```txt
continue
warn partner
reduce quota
increase quota after approval
suspend key
revoke key
open incident record
```

---

## 23. Pilot success criteria

A pilot is successful when:

```txt
quickstart completed
authenticated chat completed
lookup envelope validated
partner can reproduce basic flow
no secrets exposed
no policy breach
no uncontrolled data
no quota abuse
partner understands boundary
operator can trace technical receipts
```

Technical success:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Business/operational success:

```txt
partner understands governed runtime value
partner identifies valid use case
partner accepts technical proof boundary
partner can define next integration step
```

---

## 24. Pilot failure criteria

A pilot should be paused or stopped if:

```txt
API key is leaked
partner sends secrets in prompts
partner sends unapproved sensitive data
partner exceeds quota repeatedly
partner probes routes outside scope
partner attempts cross-tenant access
partner claims legal certification
partner misrepresents OPC
partner cannot provide technical contact
partner cannot handle basic security requirements
```

Failure action:

```txt
pause access
suspend key
review logs
document issue
notify partner
repair process if possible
revoke if necessary
```

---

## 25. Quota escalation

Quota may be increased only if:

```txt
partner completed quickstart
partner stayed within quota
no abuse signal
no key exposure
approved data class
security checklist accepted
rate limit policy accepted
operator approves increase
```

Quota escalation record:

```txt
partner
tenant
workspace
old quota
new quota
reason
approvedBy
approvedAt
expiration
```

---

## 26. Partner support model

Support channels should define:

```txt
technical contact
security contact
operator contact
expected response window
incident contact
key revocation contact
quota escalation contact
```

Support should not accept:

```txt
API keys in messages
secrets in screenshots
raw production data
unredacted personal data
private keys
passwords
```

Partner support must redirect unsafe material immediately.

---

## 27. Offboarding

Offboarding checklist:

```txt
[ ] pilot end date confirmed.
[ ] API key disabled.
[ ] partner notified.
[ ] tenant/workspace status reviewed.
[ ] quota records archived.
[ ] incident records reviewed.
[ ] partner feedback captured.
[ ] technical result captured.
[ ] next step defined.
[ ] no active key remains unexpectedly.
```

Offboarding outcomes:

```txt
pilot closed
pilot extended
quota revised
commercial discussion
institutional review
technical follow-up
access revoked
```

---

## 28. Internal onboarding record template

Use this internal template:

```txt
partnerName:
partnerDomain:
country:
pilotUseCase:
dataClass:
technicalContact:
securityContact:
tenantId:
workspaceId:
runtimeIprId:
apiKeyFingerprint:
quotaTier:
allowedRoutes:
pilotStartDate:
pilotEndDate:
revocationOwner:
securityChecklistAccepted:
rateLimitPolicyAccepted:
legalCertificationBoundaryAccepted:
opcBoundaryAccepted:
quickstartCompleted:
smokeResult:
operatorNotes:
status:
```

Never store the raw API key in this record.

---

## 29. Partner-facing summary

Suggested partner-facing summary:

```txt
HBCE IPR Runtime API v1 provides a controlled interface for identity-bound AI execution through JOKER-C2. The pilot allows your technical team to create an IPR-bound session, execute authenticated AI interactions, capture runtime identifiers such as EVT, OPC and audit IDs, and inspect technical proof envelopes within a defined tenant/workspace scope.
```

Boundary:

```txt
The pilot does not provide legal certification. legalCertification=false. OPC remains a technical proof receipt only.
```

---

## 30. Final onboarding verdict

```txt
HBCE IPR Runtime API v1 partner onboarding = pilot-ready
```

The partner onboarding process is ready for controlled B2B / B2G evaluation when partner identity, contacts, tenant, workspace, API key, quota, route scope, security acceptance, rate limit acceptance, technical quickstart and proof boundary are all recorded.

Final boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
