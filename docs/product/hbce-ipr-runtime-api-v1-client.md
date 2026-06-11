# HBCE IPR Runtime API v1 — Internal TypeScript Client

**Document status:** operational product note  
**Scope:** internal SDK/client layer for `lib/api-v1-client.ts`  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**Boundary:** `legalCertification=false`  
**OPC:** technical proof receipt only  
**IPR Card:** internal operational identity certificate, not an official public identity document

---

## 1. Purpose

This document defines the role of the internal API v1 TypeScript client added at:

```text
lib/api-v1-client.ts
```

The client is the first SDK layer for the HBCE IPR Runtime API v1. It is not yet a published package. It is an internal integration layer used to stabilize how HBCE/JOKER-C2 calls the public `/api/v1` contract.

The client exists to prevent each integration, demo, script or dashboard component from rebuilding its own fetch logic, error parsing, API-key handling, session flow and boundary interpretation. Because apparently the most common enterprise architecture pattern is “copy-paste until the system develops folklore.” This file is the antidote.

---

## 2. Operational position

The API v1 client sits above the public contract routes and below demos, UI integrations and future SDK packaging.

```text
Demo / UI / Integration
        ↓
lib/api-v1-client.ts
        ↓
/api/v1 public surface
        ↓
JOKER-C2 governed runtime bridge
        ↓
IPR · EVT · OPC · Audit · Usage
```

It does not replace the API routes. It consumes them.

It does not create legal certification.

It does not persist raw text.

It does not automatically create IPR memory.

It does not bypass the runtime auth/session model.

---

## 3. Supported contract areas

The internal client is designed around the public API v1 surface already validated by the live test:

```text
GET  /api/v1
GET  /api/v1/health
GET  /api/v1/capabilities
GET  /api/v1/self-test
GET  /api/v1/openapi
GET  /api/v1/ipr/session
POST /api/v1/ipr/session
GET  /api/v1/ipr/session/{sessionId}
GET  /api/v1/chat
POST /api/v1/chat
GET  /api/v1/files
POST /api/v1/files
GET  /api/v1/operations
POST /api/v1/operations
GET  /api/v1/operations/{operationId}
GET  /api/v1/events
GET  /api/v1/opc/{opcId}
GET  /api/v1/audit/{auditId}
GET  /api/v1/model-usage/{usageId}
GET  /api/v1/source-intelligence
GET  /api/v1/demo/ipr-ai-audit-trail
```

The current live public-surface result is:

```text
API_V1_PUBLIC_SURFACE_LIVE_TEST_PASS
PASS_COUNT=20
FAIL_COUNT=0
```

---

## 4. Session and chat flow

The expected governed flow is:

```text
1. Create session
   POST /api/v1/ipr/session

2. Extract session.sessionId

3. Execute authenticated chat
   POST /api/v1/chat
   headers:
     x-hbce-api-key: <api key>
   body:
     sessionId
     humanIpr
     runtimeIpr
     tenant
     workspace
     message
```

The chat route must fail closed when the API key is missing.

The chat route must reject requests without `sessionId`.

The chat route must preserve the operational boundary:

```text
legalCertification=false
OPC=technical proof receipt only
IPR=operational identity/proof layer only
```

---

## 5. Error model

The client exposes typed request errors through `HbceApiV1Error`.

A failed HTTP response is not treated as an invisible string. It carries:

```text
status
headers
data
```

The typed error response fix ensures that a generic response payload can be attached to the error object without forcing every `T` to satisfy the JSON root type in the constructor. This resolves the Vercel build failure originally triggered at:

```text
lib/api-v1-client.ts:271
Type error:
Argument of type 'HbceApiV1Response<T>' is not assignable to parameter of type
'HbceApiV1Response<HbceJson>'.
```

The corrected model allows the client to remain generic while still keeping safe error payload inspection.

---

## 6. Security boundaries

The client must never hardcode API keys.

The client may accept an API key at construction time or through runtime configuration, but secrets must remain outside committed source.

The client must not expose hidden runtime internals by default.

The client must not persist raw prompts, raw source text, raw file bodies or raw model completions.

The client must preserve these boundaries in all demos and integrations:

```text
legalCertification=false
rawTextPersistence=false
automaticIprMemoryWrite=false
OPC=technical proof receipt only
```

---

## 7. Product value

The internal client is the bridge toward:

```text
@hbce/ipr-runtime-sdk
IPR AI Audit Trail Demo
B2B integration examples
B2G technical due diligence package
public API v1 developer documentation
```

It turns the public API surface from a set of endpoints into an integration layer.

That matters because a product is not just “an endpoint exists.” A product is when an external operator can call it, understand the result, handle errors, respect boundaries and repeat the process without needing an exorcist.

---

## 8. Next operational use

The next recommended file after this product note is a small client smoke test or demo adapter using the internal client.

Recommended path:

```text
scripts/test-api-v1-client-smoke.mjs
```

Purpose:

```text
1. Verify the deployed public API v1 surface is reachable.
2. Verify the expected boundary strings remain present.
3. Verify the demo and Source Intelligence contract routes respond.
4. Keep API-key usage optional and never committed.
```

The smoke test should not replace the public-surface test. It should validate integration readiness from the client/demo perspective.

---

## 9. Final status

```text
API v1 public surface: PASS
Internal API v1 TypeScript client: BUILD PASS
Typed error response fix: APPLIED
Boundary: legalCertification=false
OPC: technical proof receipt only
Ready for: SDK/demo integration layer
```

**HBCE Research**
