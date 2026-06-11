# HBCE IPR Runtime API v1 — Integration Guide

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**Repository:** `hbce-ai-joker-c2`  
**API version:** `v1`  
**Audience:** B2B / B2G technical partners, integration developers, institutional pilot teams  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Purpose

This document explains how to integrate with the HBCE IPR Runtime API v1 from an external client.

The API v1 surface exposes a governed runtime flow built around operational identity, IPR-bound execution, event tracing, OPC technical proof receipts, audit visibility and controlled public lookup envelopes.

This guide is written for practical integration. It does not describe the full internal JOKER-C2 runtime, the database implementation, the private memory layer, provider-level model routing or internal governance logic.

It explains what an external client needs to do:

1. discover the API;
2. verify health and capabilities;
3. create an IPR session;
4. send an authenticated chat request;
5. handle returned EVT / OPC / audit / usage identifiers;
6. inspect public lookup envelopes;
7. respect security and certification boundaries.

---

## 2. Base URL

Default production URL:

```txt
https://hbce-ai-joker-c2.vercel.app
```

Public API v1 root:

```txt
GET /api/v1
```

Equivalent full URL:

```txt
https://hbce-ai-joker-c2.vercel.app/api/v1
```

---

## 3. Runtime boundary

The API v1 is an operational runtime interface.

It is not:

- a public legal certification authority;
- a state identity provider;
- a public registry of legal identity;
- a substitute for CIE, SPID, passport, qualified electronic signature or official public record;
- an unrestricted database export API;
- a raw prompt / completion disclosure interface;
- a provider-level telemetry dump.

Canonical boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
IPR=operational identity/proof layer only
EVT=technical event trace only
```

The API v1 can expose technical proof envelopes and runtime receipts. It must not be described as producing official legal certification.

---

## 4. Authentication

Authenticated routes require an API key.

Recommended header forms:

```txt
Authorization: Bearer <API_KEY>
X-API-Key: <API_KEY>
X-HBCE-API-Key: <API_KEY>
```

The live client smoke test sends all supported key header aliases for compatibility.

Do not print API keys in:

- logs;
- chat transcripts;
- screenshots;
- issue reports;
- documentation examples;
- commit messages;
- shell history, when avoidable.

For terminal tests, use silent input:

```bash
read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo
```

Then pass it only as an environment variable:

```bash
HBCE_API_V1_KEY="$HBCE_API_V1_KEY" node scripts/test-api-v1-client-smoke.mjs
```

Unset it after use:

```bash
unset HBCE_API_V1_KEY
```

---

## 5. Public discovery flow

Before running authenticated operations, a client should verify the public surface.

Recommended sequence:

```txt
GET /api/v1
GET /api/v1/health
GET /api/v1/capabilities
GET /api/v1/self-test
GET /api/v1/openapi
```

These routes are safe public contract endpoints.

They help confirm:

- API version;
- runtime product identity;
- health state;
- public capability matrix;
- OpenAPI contract availability;
- boundary metadata.

---

## 6. Public root

### Request

```http
GET /api/v1
```

### Purpose

Returns API v1 discovery metadata.

Expected concepts:

```txt
product
apiVersion
routeRevision
runtime
available routes
boundary
```

### Expected success

```txt
HTTP 200
```

---

## 7. Health

### Request

```http
GET /api/v1/health
```

### Purpose

Returns runtime health and operational readiness metadata.

Expected concepts:

```txt
HBCE_IPR_RUNTIME_API_READY
AI_JOKER_C2
apiVersion=v1
legalCertification=false
technical proof receipt only
```

### Expected success

```txt
HTTP 200
```

---

## 8. Capabilities

### Request

```http
GET /api/v1/capabilities
```

### Purpose

Returns a public capability map for the API v1 product surface.

Expected categories include:

```txt
IPR session
chat
files
operations
events
OPC
audit
model usage
source intelligence
```

### Expected success

```txt
HTTP 200
```

---

## 9. Self-test

### Request

```http
GET /api/v1/self-test
```

### Purpose

Returns a public contract-level self-test.

This route is not the same thing as the full client smoke test. It verifies the API v1 contract from the server-side public surface, not necessarily a full external authenticated client flow.

### Expected success

```txt
HTTP 200
```

---

## 10. OpenAPI

### Request

```http
GET /api/v1/openapi
```

### Purpose

Returns the OpenAPI contract surface.

The OpenAPI route is used by external clients to discover endpoint shape, method, request body and response envelope.

### Expected success

```txt
HTTP 200
```

---

## 11. Fail-closed unauthenticated chat

A client must verify that protected execution does not run without authentication.

### Request

```http
POST /api/v1/chat
```

without API key.

### Expected result

```txt
HTTP 401
```

Canonical smoke test line:

```txt
PASS chat without key fail-closed [critical] http=401
```

If unauthenticated chat returns `200`, the system is not in the expected fail-closed posture.

---

## 12. IPR session creation

Before authenticated chat, the client creates an IPR-bound session.

### Request

```http
POST /api/v1/ipr/session
```

### Required concepts

The session route expects a valid human IPR within the active self-pilot scope.

The client smoke test sends both canonical and compatibility names:

```txt
tenantId
tenant
workspaceId
workspace
operatorIprId
operatorIpr
humanIprId
humanIpr
runtimeIprId
runtimeIpr
```

Default integration scope used by the live smoke test:

```txt
tenant=HBCE-TENANT-SELF-PILOT
workspace=HBCE-WORKSPACE-RND
runtimeIpr=IPR-AI-0001
```

The Human IPR is environment-driven:

```txt
HBCE_OPERATOR_IPR_ID
```

The live smoke test can read the active self-pilot Human IPR from:

```txt
app/api/v1/ipr/session/route.ts
```

without printing it.

### Example body shape

```json
{
  "tenantId": "HBCE-TENANT-SELF-PILOT",
  "tenant": "HBCE-TENANT-SELF-PILOT",
  "workspaceId": "HBCE-WORKSPACE-RND",
  "workspace": "HBCE-WORKSPACE-RND",
  "operatorIprId": "IPR-...",
  "operatorIpr": "IPR-...",
  "humanIprId": "IPR-...",
  "humanIpr": "IPR-...",
  "runtimeIprId": "IPR-AI-0001",
  "runtimeIpr": "IPR-AI-0001",
  "requestedBy": "EXTERNAL_CLIENT",
  "purpose": "API_V1_INTEGRATION",
  "legalCertification": false,
  "opcBoundary": "technical proof receipt only"
}
```

### Expected success

```txt
HTTP 201
```

Canonical smoke test line:

```txt
PASS ipr session create [critical] http=201
```

The session ID must be captured by the client but should not be printed in ordinary logs.

---

## 13. Authenticated chat

After session creation, the client sends an authenticated chat request.

### Request

```http
POST /api/v1/chat
```

### Example body shape

```json
{
  "message": "Minimal readiness check.",
  "prompt": "Minimal readiness check.",
  "messages": [
    {
      "role": "user",
      "content": "Minimal readiness check."
    }
  ],
  "tenantId": "HBCE-TENANT-SELF-PILOT",
  "tenant": "HBCE-TENANT-SELF-PILOT",
  "workspaceId": "HBCE-WORKSPACE-RND",
  "workspace": "HBCE-WORKSPACE-RND",
  "operatorIprId": "IPR-...",
  "operatorIpr": "IPR-...",
  "humanIprId": "IPR-...",
  "humanIpr": "IPR-...",
  "runtimeIprId": "IPR-AI-0001",
  "runtimeIpr": "IPR-AI-0001",
  "sessionId": "<SESSION_ID>",
  "iprSessionId": "<SESSION_ID>",
  "source": "external-client",
  "testMode": "API_V1_INTEGRATION_TEST",
  "legalCertification": false,
  "opcBoundary": "technical proof receipt only"
}
```

### Expected success

```txt
HTTP 200
```

Expected status concept:

```txt
HBCE_IPR_RUNTIME_CHAT_READY
```

Canonical smoke test line:

```txt
PASS chat with key [critical] http=200
```

---

## 14. Runtime identifiers returned by chat

An authenticated chat response may return:

```txt
responseEvt
evtId
eventId
lastEvtId
opcId
auditId
usageId
modelUsageId
```

The client should capture these identifiers when present.

The current smoke test extracts:

```txt
EVT
OPC
audit
model usage
```

Observed final live shape:

```txt
capturedIds=true
evtId=EVT-...
opcId=OPC-...
auditId=AUDIT-...
usageId=NONE
```

The exact IDs are technical runtime receipts and should be handled as operational metadata.

Do not print secrets. Do not print API keys. Avoid printing session IDs.

---

## 15. Operations lookup

### Request

```http
GET /api/v1/operations/{operationId}
```

The smoke test uses a linked identifier when available.

Expected success:

```txt
HTTP 200
```

Canonical smoke test line:

```txt
PASS operations lookup [optional] http=200
```

This is an optional lookup in the smoke test because not every chat flow is required to expose a full operation ID.

---

## 16. Events lookup

### Request

```http
GET /api/v1/events?eventId={eventId}
```

Important: this route uses query-string form.

Correct:

```txt
GET /api/v1/events?eventId=EVT-...
```

Incorrect:

```txt
GET /api/v1/events/EVT-...
```

Implemented route:

```txt
app/api/v1/events/route.ts
```

Not implemented:

```txt
app/api/v1/events/[eventId]/route.ts
```

Expected success:

```txt
HTTP 200
```

Canonical smoke test line:

```txt
PASS events lookup [optional] http=200
```

The events route currently exposes the EVT contract and lookup envelope. It is not a raw internal database export route.

---

## 17. OPC lookup

### Request

```http
GET /api/v1/opc/{opcId}
```

Expected success:

```txt
HTTP 200
```

Canonical smoke test line:

```txt
PASS opc lookup [optional] http=200
```

OPC remains a technical proof receipt only.

It is not legal certification.

---

## 18. Audit lookup

### Request

```http
GET /api/v1/audit/{auditId}
```

Expected success:

```txt
HTTP 200
```

Canonical smoke test line:

```txt
PASS audit lookup [optional] http=200
```

Audit lookup must not expose raw prompts, raw completions, provider payloads, secrets or unrestricted internal logs.

---

## 19. Model usage lookup

### Request

```http
GET /api/v1/model-usage/{usageId}
```

This route is tested only if a usage ID is returned.

If the chat response returns:

```txt
usageId=NONE
```

the smoke test reports:

```txt
SKIPPED model usage lookup [optional] :: no lookup id returned by chat response
```

This is not a failure.

---

## 20. Files route

### Request

```http
POST /api/v1/files
```

The files route is part of the public API v1 surface.

It is intended to expose a governed file ingestion contract, not uncontrolled raw persistence.

Integration clients should treat file upload and document ingestion as governed operations subject to:

```txt
tenant
workspace
human IPR
runtime IPR
file boundary
memory policy
legalCertification=false
```

The file route must not be treated as a public raw file storage API.

---

## 21. Source Intelligence route

### Request

```http
GET /api/v1/source-intelligence
```

The Source Intelligence route exposes the public contract for source intelligence capability.

It is not an unrestricted web-fetch interface.

Source Intelligence remains governed by:

```txt
allowlist
source set registry
prompt injection screening
rawTextPersistence=false
memoryProfilePolicy=EXPLICIT_OPERATOR_SAVE_ONLY
legalCertification=false
```

---

## 22. Minimal JavaScript client pattern

The integration pattern is:

```js
const baseUrl = "https://hbce-ai-joker-c2.vercel.app";

const headers = {
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": `Bearer ${apiKey}`,
  "X-API-Key": apiKey,
  "X-HBCE-API-Key": apiKey
};

const sessionResponse = await fetch(`${baseUrl}/api/v1/ipr/session`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    tenantId: "HBCE-TENANT-SELF-PILOT",
    tenant: "HBCE-TENANT-SELF-PILOT",
    workspaceId: "HBCE-WORKSPACE-RND",
    workspace: "HBCE-WORKSPACE-RND",
    operatorIprId: humanIpr,
    operatorIpr: humanIpr,
    humanIprId: humanIpr,
    humanIpr,
    runtimeIprId: "IPR-AI-0001",
    runtimeIpr: "IPR-AI-0001",
    requestedBy: "EXTERNAL_CLIENT",
    purpose: "API_V1_INTEGRATION",
    legalCertification: false,
    opcBoundary: "technical proof receipt only"
  })
});

const session = await sessionResponse.json();

const sessionId =
  session.sessionId ||
  session.iprSessionId ||
  session.id ||
  session?.session?.sessionId ||
  session?.data?.sessionId;

const chatResponse = await fetch(`${baseUrl}/api/v1/chat`, {
  method: "POST",
  headers,
  body: JSON.stringify({
    message: "Minimal readiness check.",
    messages: [{ role: "user", content: "Minimal readiness check." }],
    tenantId: "HBCE-TENANT-SELF-PILOT",
    tenant: "HBCE-TENANT-SELF-PILOT",
    workspaceId: "HBCE-WORKSPACE-RND",
    workspace: "HBCE-WORKSPACE-RND",
    operatorIprId: humanIpr,
    operatorIpr: humanIpr,
    humanIprId: humanIpr,
    humanIpr,
    runtimeIprId: "IPR-AI-0001",
    runtimeIpr: "IPR-AI-0001",
    sessionId,
    iprSessionId: sessionId,
    source: "external-client",
    legalCertification: false,
    opcBoundary: "technical proof receipt only"
  })
});

const chat = await chatResponse.json();
```

Never hardcode production API keys in source files.

---

## 23. Live smoke test command

The canonical live smoke command is documented in:

```txt
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
```

Canonical final result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

The smoke script:

```txt
scripts/test-api-v1-client-smoke.mjs
```

is the recommended post-deploy client validation command.

---

## 24. Error handling

### Missing API key

Expected public-only mode:

```txt
apiKey=MISSING
SKIPPED authenticated session and chat
```

Expected strict mode failure if key missing:

```txt
API key missing and HBCE_API_V1_STRICT_AUTH is enabled
```

### Missing Human IPR

Possible failure:

```txt
MISSING_HUMAN_IPR
```

Meaning:

```txt
The session route did not receive the required humanIpr field.
```

Resolution:

Send:

```txt
humanIpr
humanIprId
operatorIpr
operatorIprId
```

### Invalid Human IPR

Possible failure:

```txt
INVALID_HUMAN_IPR
```

Meaning:

```txt
The supplied Human IPR is outside the active self-pilot IPR scope.
```

Resolution:

Use the active self-pilot Human IPR for the environment being tested.

### Missing session ID

Possible failure:

```txt
MISSING_SESSION_ID
```

Meaning:

```txt
The chat route did not receive a valid sessionId / iprSessionId.
```

Resolution:

Create the IPR session first, capture the returned session ID, then pass it into chat.

### Events 404

Previous issue:

```txt
WARN events lookup [optional] http=404
```

Cause:

```txt
Wrong path: /api/v1/events/{eventId}
```

Correct path:

```txt
/api/v1/events?eventId={eventId}
```

---

## 25. Recommended integration sequence

A robust external integration should execute this sequence:

```txt
1. GET  /api/v1
2. GET  /api/v1/health
3. GET  /api/v1/capabilities
4. GET  /api/v1/openapi
5. POST /api/v1/chat without key and verify 401 in test environments
6. POST /api/v1/ipr/session with API key
7. POST /api/v1/chat with API key and sessionId
8. Capture responseEvt / opcId / auditId / usageId if present
9. GET  /api/v1/operations/{operationId} if an operation identifier is returned
10. GET /api/v1/events?eventId={eventId}
11. GET /api/v1/opc/{opcId}
12. GET /api/v1/audit/{auditId}
13. GET /api/v1/model-usage/{usageId} if usageId exists
```

---

## 26. Partner-facing interpretation

For a technical partner, the API v1 provides:

- a runtime discovery surface;
- a health and capabilities contract;
- authenticated IPR session creation;
- governed chat execution;
- EVT trace visibility;
- OPC technical proof receipt lookup;
- audit lookup envelope;
- model usage lookup envelope when available;
- fail-closed behavior for protected execution;
- public contract separation from internal raw data.

The API is suitable for controlled B2B / B2G pilot integration where the partner needs to verify that AI execution is bound to operational identity, runtime traceability and proof receipt boundaries.

---

## 27. What the API v1 does not expose

The public API v1 does not automatically expose:

- raw database rows;
- raw internal memory;
- raw prompts;
- raw completions;
- raw provider payloads;
- unrestricted source fetching;
- legal certification;
- public identity certification;
- unlimited tenant access;
- unrestricted workspace access;
- automatic IPR memory writing.

This is deliberate.

The API is designed as a governed public contract, not as a giant hosepipe from the internal runtime. Humanity has enough hoses pointed at databases already.

---

## 28. Compliance and governance notes

The integration must preserve:

```txt
UE-first posture
audit-first posture
GDPR-min posture
hash/proof orientation
fail-closed access control
tenant/workspace scoping
no legal certification claim
OPC technical proof only
```

Any production partner integration should additionally define:

- API key issuance policy;
- tenant provisioning;
- workspace provisioning;
- Human IPR onboarding;
- retention policy;
- audit redaction policy;
- operational incident process;
- allowed routes;
- rate limits;
- source intelligence permissions, if enabled;
- file ingestion permissions, if enabled.

---

## 29. Final integration verdict

```txt
HBCE IPR Runtime API v1 = integration-ready for controlled pilot usage
```

This means:

```txt
public surface = validated
client smoke = validated
authenticated IPR session = validated
authenticated chat = validated
EVT/OPC/audit lookup flow = validated
legalCertification=false = preserved
OPC technical proof boundary = preserved
```

It does not mean unrestricted public production access.

It means the v1 API surface is ready to be presented, tested and integrated under controlled B2B / B2G pilot conditions.
