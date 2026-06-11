# HBCE IPR Runtime API v1 — Security Checklist

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Repository:** `hbce-ai-joker-c2`  
**Document type:** security checklist  
**Audience:** internal operators, security reviewers, B2B / B2G pilot evaluators, integration developers  
**Checklist status:** `pilot security baseline`  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Purpose

This checklist defines the minimum security controls that must be preserved when presenting, testing or integrating the HBCE IPR Runtime API v1.

The API v1 package is already documented through:

```txt
docs/product/hbce-ipr-runtime-api-v1-client.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-product-index.md
```

This document is the security layer above those documents.

It exists because an API that works is not automatically an API that is safe to expose. Humanity keeps needing this reminder, usually after production is already on fire.

---

## 2. Security verdict target

A pilot is security-ready only if the following baseline remains true:

```txt
protected execution requires API key
unauthenticated chat fails closed
IPR session creation validates human IPR scope
tenant and workspace are explicit
session ID is required for authenticated chat
API keys are never printed
session IDs are not printed in normal logs
OPC remains technical proof receipt only
legalCertification=false remains explicit
lookup routes do not expose raw internal data
audit lookup does not expose raw prompts or completions
public routes expose contract metadata only
```

Target smoke result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

---

## 3. Canonical boundary

The following boundary must remain visible in product, integration and pilot material:

```txt
legalCertification=false
OPC=technical proof receipt only
IPR Card is an internal operational identity certificate, not an official public identity document
```

The API v1 can expose technical runtime receipts, but it must not be described as:

```txt
legal certification system
public certification authority
qualified electronic signature service
official public identity provider
state identity system
court-admissible proof authority by default
```

The product can support evidence-oriented workflows, but the pilot boundary is technical, not legal certification.

---

## 4. Route classification

### Public contract routes

These routes may be publicly reachable as contract / discovery endpoints:

```txt
GET /api/v1
GET /api/v1/health
GET /api/v1/capabilities
GET /api/v1/self-test
GET /api/v1/openapi
```

Security expectation:

```txt
no secrets
no API keys
no raw prompts
no raw completions
no raw provider payloads
no private session identifiers
no private database rows
```

### Protected execution routes

These routes require authentication and controlled scope:

```txt
POST /api/v1/ipr/session
POST /api/v1/chat
POST /api/v1/files
```

Security expectation:

```txt
API key required
tenant required or resolved safely
workspace required or resolved safely
human IPR validated
runtime IPR constrained
session required for chat
fail-closed on missing/invalid inputs
```

### Lookup envelope routes

These routes may expose public or authenticated technical lookup envelopes depending on route policy:

```txt
GET /api/v1/operations/{operationId}
GET /api/v1/events?eventId={eventId}
GET /api/v1/opc/{opcId}
GET /api/v1/audit/{auditId}
GET /api/v1/model-usage/{usageId}
```

Security expectation:

```txt
contract receipt only unless explicitly wired to scoped persistence
no raw internal log dump
no secret exposure
no raw prompt exposure
no raw completion exposure
no provider payload exposure
tenant/workspace scoping before persistence lookup
redaction before response
```

---

## 5. API key handling checklist

Before pilot access:

```txt
[ ] API key generated for the correct environment.
[ ] API key scoped to pilot tenant/workspace where supported.
[ ] API key stored outside source code.
[ ] API key not committed to Git.
[ ] API key not pasted in chat.
[ ] API key not pasted in issue tracker.
[ ] API key not inserted into Markdown documentation.
[ ] API key not included in screenshots.
[ ] API key rotation plan exists.
[ ] API key revocation process exists.
[ ] API key exposure incident process exists.
```

During terminal tests:

```txt
[ ] Use silent read for API key.
[ ] Export key only for the current shell session.
[ ] Unset key after testing.
[ ] Do not echo key.
[ ] Do not save command with key inline in shell history.
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

The smoke test must print only:

```txt
apiKey=SET
```

or:

```txt
apiKey=MISSING
```

It must never print the key value.

---

## 6. Authentication checklist

For protected routes:

```txt
[ ] Missing API key returns HTTP 401 or HTTP 403.
[ ] Invalid API key returns HTTP 401 or HTTP 403.
[ ] Authenticated route does not execute with empty Authorization header.
[ ] Authenticated route does not execute with malformed bearer token.
[ ] Protected chat does not run in public-only mode.
[ ] API key does not appear in response body.
[ ] API key does not appear in logs exposed to users.
[ ] API key does not appear in audit lookup response.
```

Canonical fail-closed validation:

```txt
PASS chat without key fail-closed [critical] http=401
```

If `POST /api/v1/chat` without key returns `200`, stop the pilot and treat the deployment as security-failed.

---

## 7. IPR session checklist

Route:

```txt
POST /api/v1/ipr/session
```

Required security posture:

```txt
[ ] humanIpr is required.
[ ] missing humanIpr fails closed.
[ ] invalid humanIpr fails closed.
[ ] humanIpr is constrained to active pilot scope.
[ ] tenant is constrained to active pilot scope.
[ ] workspace is constrained to active pilot scope.
[ ] runtimeIpr is constrained to expected runtime.
[ ] session ID is created only after validation.
[ ] session ID is not printed by smoke test.
[ ] session ID is not exposed in partner documentation.
[ ] session ID is not treated as public identifier.
```

Expected failures:

```txt
MISSING_HUMAN_IPR
INVALID_HUMAN_IPR
INVALID_TENANT
INVALID_WORKSPACE
```

Expected success:

```txt
PASS ipr session create [critical] http=201
```

---

## 8. Chat execution checklist

Route:

```txt
POST /api/v1/chat
```

Required security posture:

```txt
[ ] API key required.
[ ] sessionId or iprSessionId required.
[ ] missing session ID fails closed.
[ ] invalid session ID fails closed.
[ ] tenant/workspace are passed or resolved safely.
[ ] human IPR is included or bound through session.
[ ] runtime IPR is explicit.
[ ] request source is identifiable.
[ ] legalCertification=false is preserved.
[ ] OPC boundary is preserved.
[ ] response does not include API key.
[ ] response does not include bearer token.
[ ] response does not expose internal provider secrets.
[ ] response does not expose unrelated memory.
```

Expected failure:

```txt
MISSING_SESSION_ID
```

Expected success:

```txt
PASS chat with key [critical] http=200
```

Expected status concept:

```txt
HBCE_IPR_RUNTIME_CHAT_READY
```

---

## 9. Tenant and workspace checklist

Pilot scope must be explicit.

Default self-pilot scope:

```txt
tenant=HBCE-TENANT-SELF-PILOT
workspace=HBCE-WORKSPACE-RND
runtimeIpr=IPR-AI-0001
```

Checklist:

```txt
[ ] tenant is present in session request.
[ ] workspace is present in session request.
[ ] tenant is present in chat request.
[ ] workspace is present in chat request.
[ ] invalid tenant fails closed.
[ ] invalid workspace fails closed.
[ ] partner tenant cannot access another tenant by parameter manipulation.
[ ] workspace switching requires authorization.
[ ] lookup routes do not leak cross-tenant records.
[ ] audit lookup is tenant-scoped before persistence is connected.
```

---

## 10. EVT checklist

Correct route:

```txt
GET /api/v1/events?eventId={eventId}
```

Incorrect route:

```txt
GET /api/v1/events/{eventId}
```

Checklist:

```txt
[ ] events lookup uses query-string form.
[ ] eventId is URL-encoded by clients.
[ ] eventId format is validated when needed.
[ ] lookup returns contract envelope, not raw internal event dump.
[ ] missing eventId returns safe contract/list envelope.
[ ] unknown eventId does not leak internal database behavior.
[ ] event lookup preserves legalCertification=false.
[ ] event lookup does not expose secrets.
```

Validated final result:

```txt
PASS events lookup [optional] http=200
```

---

## 11. OPC checklist

Route:

```txt
GET /api/v1/opc/{opcId}
```

Checklist:

```txt
[ ] opcId is URL-encoded by clients.
[ ] missing opcId fails safely.
[ ] malformed opcId fails safely.
[ ] lookup response preserves technical proof receipt boundary.
[ ] lookup does not claim legal certification.
[ ] lookup does not expose raw internal proof material unless explicitly allowed.
[ ] lookup does not expose secrets.
[ ] lookup does not expose cross-tenant records.
```

Canonical boundary:

```txt
OPC=technical proof receipt only
```

Validated result:

```txt
PASS opc lookup [optional] http=200
```

---

## 12. Audit checklist

Route:

```txt
GET /api/v1/audit/{auditId}
```

Audit lookup must be conservative.

Checklist:

```txt
[ ] auditId is URL-encoded by clients.
[ ] missing auditId fails safely.
[ ] malformed auditId fails safely.
[ ] audit lookup does not expose API key.
[ ] audit lookup does not expose bearer token.
[ ] audit lookup does not expose cookies.
[ ] audit lookup does not expose raw prompt.
[ ] audit lookup does not expose raw completion.
[ ] audit lookup does not expose provider payload.
[ ] audit lookup does not expose unrelated tenant data.
[ ] audit lookup response clearly states contract/receipt boundary.
[ ] audit persistence lookup requires tenant/workspace scoping before activation.
```

Validated result:

```txt
PASS audit lookup [optional] http=200
```

---

## 13. Operations checklist

Route:

```txt
GET /api/v1/operations/{operationId}
```

Checklist:

```txt
[ ] operationId is URL-encoded by clients.
[ ] operation lookup returns safe status envelope.
[ ] operation lookup does not expose internal raw job state.
[ ] operation lookup does not expose secrets.
[ ] operation lookup does not expose cross-tenant metadata.
[ ] operation lookup does not create new runtime events.
[ ] operation lookup preserves boundary metadata.
```

Validated result:

```txt
PASS operations lookup [optional] http=200
```

---

## 14. Model usage checklist

Route:

```txt
GET /api/v1/model-usage/{usageId}
```

Checklist:

```txt
[ ] usage lookup runs only if usageId exists.
[ ] missing usageId is treated as skip, not failure.
[ ] usage lookup does not expose provider secrets.
[ ] usage lookup does not expose raw provider payload.
[ ] usage lookup does not expose unrelated tenant usage.
[ ] usage records are scoped before persistence lookup is connected.
[ ] usage data is redacted for partner-facing response.
```

Accepted smoke state:

```txt
SKIPPED model usage lookup [optional] :: no lookup id returned by chat response
```

This is acceptable when:

```txt
usageId=NONE
```

---

## 15. Files route checklist

Route:

```txt
POST /api/v1/files
```

The files route is a governed ingestion contract, not an uncontrolled file dump.

Checklist:

```txt
[ ] API key required.
[ ] tenant/workspace required or safely resolved.
[ ] human IPR / session binding required where applicable.
[ ] file size limit exists or is planned before production.
[ ] allowed MIME types are defined before production.
[ ] disallowed MIME types are rejected.
[ ] filename is sanitized.
[ ] path traversal is impossible.
[ ] raw file is not exposed through public lookup.
[ ] persistence policy is explicit.
[ ] memory write requires explicit operator policy.
[ ] no automatic legal certification claim.
[ ] malware scanning or equivalent risk control is planned before external file pilots.
[ ] prompt injection screening is planned for text extraction flows.
```

For controlled pilot, file ingestion should remain limited to approved test materials.

---

## 16. Source Intelligence checklist

If Source Intelligence is enabled in API v1 pilot scope, it must remain governed.

Checklist:

```txt
[ ] source set registry is explicit.
[ ] external domains are allowlisted.
[ ] denylist exists where applicable.
[ ] rawTextPersistence=false unless explicitly approved.
[ ] memoryProfilePolicy=EXPLICIT_OPERATOR_SAVE_ONLY.
[ ] prompt injection screening is active.
[ ] fetched sources are hashed.
[ ] PDF binary/text boundary is explicit.
[ ] no unrestricted web browsing is exposed to partner clients.
[ ] source response does not include secrets.
[ ] source response does not bypass tenant/workspace policy.
```

Required boundary:

```txt
legalCertification=false
technical source receipt only
```

---

## 17. Response redaction checklist

All public and partner-facing responses must be checked for secret leakage.

Checklist:

```txt
[ ] no API key
[ ] no bearer token
[ ] no cookie
[ ] no session secret
[ ] no database URL
[ ] no provider key
[ ] no provider raw payload
[ ] no raw prompt unless explicitly allowed
[ ] no raw completion unless explicitly allowed
[ ] no unrelated memory content
[ ] no internal stack trace in production response
[ ] no private environment variable
[ ] no unredacted personal data
```

Suggested redaction labels:

```txt
[REDACTED]
NO_PUBLIC_DISCLOSURE
CONTRACT_RECEIPT_ONLY
NO_DATABASE_LOOKUP_IN_THIS_ROUTE
```

---

## 18. Error handling checklist

Failures should be useful but not revealing.

Checklist:

```txt
[ ] missing auth returns safe 401/403.
[ ] invalid auth returns safe 401/403.
[ ] missing humanIpr returns controlled error.
[ ] invalid humanIpr returns controlled error.
[ ] invalid tenant returns controlled error.
[ ] invalid workspace returns controlled error.
[ ] missing sessionId returns controlled error.
[ ] malformed identifiers return controlled error.
[ ] errors do not include stack traces.
[ ] errors do not include secrets.
[ ] errors do not reveal database structure.
[ ] errors do not reveal provider internals.
```

Allowed failure concepts:

```txt
MISSING_API_KEY
INVALID_API_KEY
MISSING_HUMAN_IPR
INVALID_HUMAN_IPR
INVALID_TENANT
INVALID_WORKSPACE
MISSING_SESSION_ID
INVALID_SESSION
LOOKUP_CONTRACT_ONLY
NO_DATABASE_LOOKUP_IN_THIS_ROUTE
```

---

## 19. Logging checklist

Internal logs should be useful for operators without leaking secrets.

Checklist:

```txt
[ ] log request ID.
[ ] log route name.
[ ] log status.
[ ] log failReason.
[ ] log tenant/workspace only if safe for internal operators.
[ ] log API key presence as boolean only.
[ ] do not log API key value.
[ ] do not log bearer token.
[ ] do not log cookies.
[ ] do not log session ID in ordinary logs.
[ ] do not log raw prompt in production default.
[ ] do not log raw completion in production default.
[ ] do not log provider payload in production default.
[ ] do not expose internal logs through public API.
```

Safe example:

```txt
apiKey=SET
secretPrinting=false
```

Unsafe example:

```txt
apiKey=<actual value>
```

The second example should not happen. It is how incident reports are born.

---

## 20. Rate limit and quota checklist

Before broader external pilot, define:

```txt
[ ] per-key request limit.
[ ] per-tenant request limit.
[ ] per-workspace request limit.
[ ] chat request quota.
[ ] file upload quota.
[ ] source intelligence quota.
[ ] burst limit.
[ ] timeout policy.
[ ] abuse detection.
[ ] key suspension process.
[ ] partner notification process for quota exceedance.
```

Recommended future document:

```txt
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
```

Until rate limits are formalized, pilot access should remain narrow and manually controlled.

---

## 21. Data classification checklist

Before a partner pilot, classify allowed data.

Checklist:

```txt
[ ] no production secrets.
[ ] no uncontrolled personal data.
[ ] no regulated personal data unless DPA/policy allows.
[ ] no confidential third-party data unless approved.
[ ] no classified information.
[ ] no credentials.
[ ] no private keys.
[ ] no payment card data.
[ ] no health data unless specifically approved and governed.
[ ] no legal privileged material unless pilot contract covers it.
```

Pilot-safe default:

```txt
synthetic data
public data
redacted internal examples
controlled technical prompts
approved test files
```

---

## 22. Partner onboarding security checklist

Before issuing a partner key:

```txt
[ ] partner identity recorded.
[ ] technical contact recorded.
[ ] security contact recorded.
[ ] pilot purpose recorded.
[ ] allowed routes defined.
[ ] allowed data types defined.
[ ] tenant defined.
[ ] workspace defined.
[ ] key owner defined.
[ ] key expiry defined.
[ ] incident contact defined.
[ ] revocation process confirmed.
[ ] documentation package sent.
[ ] boundary statement accepted.
```

The partner must receive:

```txt
quickstart
integration guide
pilot package
security checklist
client smoke test instructions
```

---

## 23. Deployment checklist

Before presenting a deployment externally:

```txt
[ ] Vercel build passed.
[ ] GitHub main is clean.
[ ] Linux pull verification passed.
[ ] product docs are present.
[ ] smoke test passes live.
[ ] unauthenticated chat fails closed.
[ ] events lookup uses correct query route.
[ ] no secrets committed.
[ ] no API key appears in documentation.
[ ] boundary statements appear in docs.
[ ] operator knows key revocation path.
```

Current validated documentation package:

```txt
client note = PASS
smoke test report = PASS
integration guide = PASS
pilot package = PASS
quickstart = PASS
product index = PASS
```

---

## 24. Live smoke test checklist

Before declaring API v1 pilot-ready after deploy, run:

```txt
scripts/test-api-v1-client-smoke.mjs
```

Expected:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

Required PASS lines:

```txt
PASS node runtime
PASS root discovery
PASS health
PASS capabilities
PASS self-test
PASS openapi
PASS chat without key fail-closed
PASS ipr session create
PASS chat with key
PASS operations lookup
PASS events lookup
PASS opc lookup
PASS audit lookup
```

Accepted optional state:

```txt
SKIPPED model usage lookup when usageId=NONE
```

---

## 25. Incident response checklist

If a key, session, route or data boundary is suspected compromised:

```txt
[ ] stop partner test.
[ ] revoke API key.
[ ] rotate affected key.
[ ] preserve relevant internal logs.
[ ] identify affected tenant/workspace.
[ ] identify exposed route.
[ ] identify exposed data class.
[ ] check whether secrets were printed.
[ ] check whether raw prompts/completions were exposed.
[ ] check audit/opc/event identifiers involved.
[ ] document timeline.
[ ] patch route or policy.
[ ] rerun smoke test.
[ ] issue partner notice if required.
```

Minimum incident record:

```txt
incidentId
date/time
detectedBy
affectedRoute
affectedTenant
affectedWorkspace
affectedKey
dataClass
impact
containment
fix
validation
status
```

---

## 26. Security review checklist for code changes

Before modifying API v1 routes:

```txt
[ ] identify protected vs public route.
[ ] confirm authentication behavior.
[ ] confirm fail-closed behavior.
[ ] confirm tenant/workspace handling.
[ ] confirm human IPR handling.
[ ] confirm response redaction.
[ ] confirm boundary metadata.
[ ] confirm no legal certification escalation.
[ ] confirm lookup does not expose raw internal data.
[ ] update smoke test if route shape changes.
[ ] update product docs if public contract changes.
[ ] run build.
[ ] run live smoke test after deploy.
```

If route shape changes, update:

```txt
scripts/test-api-v1-client-smoke.mjs
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-product-index.md
```

Yes, documentation has to follow code. Shocking. Revolutionary. Somehow still rare.

---

## 27. Minimum security acceptance criteria

The API v1 package can be considered security-baseline ready for controlled pilot only if:

```txt
[ ] API key protected routes reject missing key.
[ ] chat without key returns 401/403.
[ ] IPR session validates human IPR.
[ ] invalid tenant/workspace fails closed.
[ ] chat requires session.
[ ] smoke test passes.
[ ] lookup routes return envelopes, not raw dumps.
[ ] no secrets are printed.
[ ] no API key is committed.
[ ] legalCertification=false is visible.
[ ] OPC technical proof receipt boundary is visible.
[ ] partner data rules are defined.
[ ] key revocation process exists.
```

---

## 28. Final checklist verdict

```txt
HBCE IPR Runtime API v1 security checklist = pilot security baseline ready
```

This checklist does not claim that the system is production-certified, penetration-tested, legally certified or regulator-approved.

It establishes a baseline for controlled B2B / B2G pilot security review, with explicit attention to authentication, IPR scope, tenant/workspace boundaries, fail-closed behavior, response redaction, lookup envelopes, key handling and proof boundary preservation.

Final boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
```
