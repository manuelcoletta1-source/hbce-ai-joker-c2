# HBCE IPR Runtime API v1 — Quickstart

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Audience:** technical partners, pilot integrators, B2B / B2G evaluators  
**Status:** quickstart for controlled pilot usage  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. What this quickstart does

This quickstart shows the minimum path for testing the HBCE IPR Runtime API v1 from an external client.

The flow is:

```txt
1. Check public API surface.
2. Verify fail-closed unauthenticated chat.
3. Create an IPR session.
4. Send authenticated chat.
5. Capture EVT / OPC / audit IDs.
6. Check public lookup envelopes.
7. Run the smoke test.
```

This is not the full integration manual. That document exists here:

```txt
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
```

This file is the short version for humans who want to test the API without reading a small novel first. A shocking concept, apparently.

---

## 2. Base URL

Production pilot endpoint:

```txt
https://hbce-ai-joker-c2.vercel.app
```

API v1 root:

```txt
https://hbce-ai-joker-c2.vercel.app/api/v1
```

Shell variable:

```bash
export HBCE_API_V1_BASE_URL="https://hbce-ai-joker-c2.vercel.app"
```

---

## 3. Boundary

This API exposes a governed runtime interface.

It does not provide legal certification.

Canonical boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
IPR=operational identity/proof layer only
EVT=technical event trace only
```

Do not present OPC as legal proof, public identity certification, public authority certification or qualified electronic signature.

---

## 4. Required inputs

For authenticated testing you need:

```txt
HBCE_API_V1_KEY
HBCE_OPERATOR_IPR_ID
HBCE_RUNTIME_IPR_ID
HBCE_TENANT_ID
HBCE_WORKSPACE_ID
```

Default pilot values used in the self-pilot environment:

```txt
HBCE_RUNTIME_IPR_ID=IPR-AI-0001
HBCE_TENANT_ID=HBCE-TENANT-SELF-PILOT
HBCE_WORKSPACE_ID=HBCE-WORKSPACE-RND
```

The Human IPR / operator IPR must match the active self-pilot scope configured in the runtime.

Do not paste API keys into chat, tickets, screenshots, commit messages or public docs. The amount of preventable chaos this rule avoids is depressing.

---

## 5. Safe terminal setup

Set base URL:

```bash
export HBCE_API_V1_BASE_URL="https://hbce-ai-joker-c2.vercel.app"
```

Read the API key silently:

```bash
read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo
export HBCE_API_V1_KEY
```

Set the runtime and scope:

```bash
export HBCE_RUNTIME_IPR_ID="IPR-AI-0001"
export HBCE_TENANT_ID="HBCE-TENANT-SELF-PILOT"
export HBCE_WORKSPACE_ID="HBCE-WORKSPACE-RND"
```

Set the operator / Human IPR according to the active pilot scope:

```bash
export HBCE_OPERATOR_IPR_ID="IPR-..."
```

At the end of the test, clear secrets:

```bash
unset HBCE_API_V1_KEY
unset HBCE_OPERATOR_IPR_ID
```

---

## 6. Public health check

### API root

```bash
curl -sS "$HBCE_API_V1_BASE_URL/api/v1" | head -c 600
echo
```

Expected:

```txt
HTTP 200
HBCE
API
v1
```

### Health

```bash
curl -sS "$HBCE_API_V1_BASE_URL/api/v1/health" | head -c 600
echo
```

Expected concepts:

```txt
HBCE_IPR_RUNTIME_API_READY
legalCertification=false
technical proof receipt only
```

### Capabilities

```bash
curl -sS "$HBCE_API_V1_BASE_URL/api/v1/capabilities" | head -c 900
echo
```

Expected concepts:

```txt
HBCE_IPR_RUNTIME_API_CAPABILITIES_READY
capabilities
OPC
legalCertification
```

### OpenAPI

```bash
curl -sS "$HBCE_API_V1_BASE_URL/api/v1/openapi" | head -c 900
echo
```

Expected concepts:

```txt
openapi
/api/v1
HBCE
```

---

## 7. Verify fail-closed chat

Protected chat must not execute without a key.

```bash
curl -sS -i   -X POST "$HBCE_API_V1_BASE_URL/api/v1/chat"   -H "Content-Type: application/json"   -d '{"message":"Unauthenticated fail-closed test."}'   | head -40
```

Expected:

```txt
HTTP/2 401
```

or:

```txt
HTTP/1.1 401
```

The smoke test expects:

```txt
PASS chat without key fail-closed [critical] http=401
```

If this returns `200`, stop the pilot test. Protected execution is not in the expected posture.

---

## 8. Create IPR session

Route:

```txt
POST /api/v1/ipr/session
```

Example:

```bash
SESSION_RESPONSE="$(
  curl -sS     -X POST "$HBCE_API_V1_BASE_URL/api/v1/ipr/session"     -H "Content-Type: application/json"     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     -H "X-HBCE-API-Key: $HBCE_API_V1_KEY"     -d "{
      "tenantId":"$HBCE_TENANT_ID",
      "tenant":"$HBCE_TENANT_ID",
      "workspaceId":"$HBCE_WORKSPACE_ID",
      "workspace":"$HBCE_WORKSPACE_ID",
      "operatorIprId":"$HBCE_OPERATOR_IPR_ID",
      "operatorIpr":"$HBCE_OPERATOR_IPR_ID",
      "humanIprId":"$HBCE_OPERATOR_IPR_ID",
      "humanIpr":"$HBCE_OPERATOR_IPR_ID",
      "runtimeIprId":"$HBCE_RUNTIME_IPR_ID",
      "runtimeIpr":"$HBCE_RUNTIME_IPR_ID",
      "requestedBy":"API_V1_QUICKSTART",
      "purpose":"QUICKSTART_SESSION_TEST",
      "legalCertification":false,
      "opcBoundary":"technical proof receipt only"
    }"
)"
```

Print only a preview:

```bash
echo "$SESSION_RESPONSE" | head -c 900
echo
```

Expected:

```txt
HTTP 201 equivalent
HBCE_IPR_SESSION_READY
```

The exact response shape may include the session ID at one of these paths:

```txt
sessionId
iprSessionId
id
session.sessionId
data.sessionId
```

For production scripts, parse the JSON and capture the session ID without printing it.

---

## 9. Create session with Node helper

If `jq` is not available, use Node to extract a likely session ID:

```bash
SESSION_ID="$(
  node -e '
    const input = process.env.SESSION_RESPONSE || "";
    const json = JSON.parse(input);
    const id =
      json.sessionId ||
      json.iprSessionId ||
      json.id ||
      json?.session?.sessionId ||
      json?.data?.sessionId ||
      "";
    process.stdout.write(id);
  ' 
)"
```

Pass the response into Node:

```bash
SESSION_ID="$(
  SESSION_RESPONSE="$SESSION_RESPONSE" node -e '
    const json = JSON.parse(process.env.SESSION_RESPONSE || "{}");
    const id =
      json.sessionId ||
      json.iprSessionId ||
      json.id ||
      json?.session?.sessionId ||
      json?.data?.sessionId ||
      "";
    process.stdout.write(id);
  '
)"
```

Do not print the session ID unless you are debugging in a controlled local environment.

---

## 10. Authenticated chat

Route:

```txt
POST /api/v1/chat
```

Example:

```bash
CHAT_RESPONSE="$(
  curl -sS     -X POST "$HBCE_API_V1_BASE_URL/api/v1/chat"     -H "Content-Type: application/json"     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     -H "X-HBCE-API-Key: $HBCE_API_V1_KEY"     -d "{
      "message":"HBCE API v1 quickstart readiness check. Return a minimal confirmation.",
      "prompt":"HBCE API v1 quickstart readiness check. Return a minimal confirmation.",
      "messages":[
        {
          "role":"user",
          "content":"HBCE API v1 quickstart readiness check. Return a minimal confirmation."
        }
      ],
      "tenantId":"$HBCE_TENANT_ID",
      "tenant":"$HBCE_TENANT_ID",
      "workspaceId":"$HBCE_WORKSPACE_ID",
      "workspace":"$HBCE_WORKSPACE_ID",
      "operatorIprId":"$HBCE_OPERATOR_IPR_ID",
      "operatorIpr":"$HBCE_OPERATOR_IPR_ID",
      "humanIprId":"$HBCE_OPERATOR_IPR_ID",
      "humanIpr":"$HBCE_OPERATOR_IPR_ID",
      "runtimeIprId":"$HBCE_RUNTIME_IPR_ID",
      "runtimeIpr":"$HBCE_RUNTIME_IPR_ID",
      "sessionId":"$SESSION_ID",
      "iprSessionId":"$SESSION_ID",
      "source":"docs/product/hbce-ipr-runtime-api-v1-quickstart.md",
      "testMode":"API_V1_QUICKSTART",
      "legalCertification":false,
      "opcBoundary":"technical proof receipt only"
    }"
)"
```

Preview:

```bash
echo "$CHAT_RESPONSE" | head -c 1200
echo
```

Expected concepts:

```txt
HBCE_IPR_RUNTIME_CHAT_READY
legalCertification=false
technical proof receipt only
```

---

## 11. Extract runtime identifiers

Use Node:

```bash
EVT_ID="$(
  CHAT_RESPONSE="$CHAT_RESPONSE" node -e '
    const json = JSON.parse(process.env.CHAT_RESPONSE || "{}");
    const id =
      json.responseEvt ||
      json.evtId ||
      json.eventId ||
      json.lastEvtId ||
      json?.data?.responseEvt ||
      json?.data?.evtId ||
      "";
    process.stdout.write(id);
  '
)"

OPC_ID="$(
  CHAT_RESPONSE="$CHAT_RESPONSE" node -e '
    const json = JSON.parse(process.env.CHAT_RESPONSE || "{}");
    const id =
      json.opcId ||
      json?.opc?.id ||
      json?.data?.opcId ||
      json?.data?.opc?.id ||
      "";
    process.stdout.write(id);
  '
)"

AUDIT_ID="$(
  CHAT_RESPONSE="$CHAT_RESPONSE" node -e '
    const json = JSON.parse(process.env.CHAT_RESPONSE || "{}");
    const id =
      json.auditId ||
      json?.audit?.id ||
      json?.data?.auditId ||
      json?.data?.audit?.id ||
      "";
    process.stdout.write(id);
  '
)"
```

Print only whether IDs were captured:

```bash
test -n "$EVT_ID" && echo "EVT captured" || echo "EVT missing"
test -n "$OPC_ID" && echo "OPC captured" || echo "OPC missing"
test -n "$AUDIT_ID" && echo "AUDIT captured" || echo "AUDIT missing"
```

---

## 12. EVT lookup

Correct route:

```txt
GET /api/v1/events?eventId={eventId}
```

Command:

```bash
if test -n "$EVT_ID"; then
  curl -sS     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     "$HBCE_API_V1_BASE_URL/api/v1/events?eventId=$EVT_ID"     | head -c 900
  echo
else
  echo "SKIP: no EVT_ID"
fi
```

Expected:

```txt
HTTP 200 equivalent
EVT lookup envelope
```

Important:

```txt
Correct:   /api/v1/events?eventId=EVT-...
Incorrect: /api/v1/events/EVT-...
```

---

## 13. OPC lookup

Route:

```txt
GET /api/v1/opc/{opcId}
```

Command:

```bash
if test -n "$OPC_ID"; then
  curl -sS     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     "$HBCE_API_V1_BASE_URL/api/v1/opc/$OPC_ID"     | head -c 900
  echo
else
  echo "SKIP: no OPC_ID"
fi
```

Expected:

```txt
HTTP 200 equivalent
OPC lookup envelope
technical proof receipt only
```

---

## 14. Audit lookup

Route:

```txt
GET /api/v1/audit/{auditId}
```

Command:

```bash
if test -n "$AUDIT_ID"; then
  curl -sS     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     "$HBCE_API_V1_BASE_URL/api/v1/audit/$AUDIT_ID"     | head -c 900
  echo
else
  echo "SKIP: no AUDIT_ID"
fi
```

Expected:

```txt
HTTP 200 equivalent
audit lookup contract
```

Audit lookup must not expose raw prompts, completions, provider payloads, secrets or unrestricted internal logs.

---

## 15. Recommended smoke test

For full validation, use the live smoke script:

```txt
scripts/test-api-v1-client-smoke.mjs
```

Command from repo root:

```bash
cd /home/manuelcoletta1/github/hbce-ai-joker-c2 || exit 1

git pull --ff-only origin main

HBCE_OPERATOR_IPR_ID="$(python3 - <<'PY'
from pathlib import Path
import re

text = Path("app/api/v1/ipr/session/route.ts").read_text(encoding="utf-8")
m = re.search(r'HBCE_SELF_PILOT_HUMAN_IPR\s*=\s*["\']([^"\']+)["\']', text)
if not m:
    raise SystemExit("HBCE_SELF_PILOT_HUMAN_IPR_NOT_FOUND")
print(m.group(1))
PY
)"

read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo

HBCE_API_V1_KEY="$HBCE_API_V1_KEY" \
HBCE_OPERATOR_IPR_ID="$HBCE_OPERATOR_IPR_ID" \
HBCE_API_V1_STRICT_AUTH=1 \
HBCE_API_V1_BASE_URL="https://hbce-ai-joker-c2.vercel.app" \
node scripts/test-api-v1-client-smoke.mjs

unset HBCE_API_V1_KEY
unset HBCE_OPERATOR_IPR_ID
```

Expected final output:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

---

## 16. Quick success checklist

A quickstart pass means:

```txt
GET /api/v1 works
GET /api/v1/health works
GET /api/v1/capabilities works
GET /api/v1/openapi works
POST /api/v1/chat without key returns 401
POST /api/v1/ipr/session returns session
POST /api/v1/chat returns HBCE_IPR_RUNTIME_CHAT_READY
EVT / OPC / audit identifiers are captured when returned
GET /api/v1/events?eventId works when EVT is present
GET /api/v1/opc/{opcId} works when OPC is present
GET /api/v1/audit/{auditId} works when audit ID is present
legalCertification=false remains explicit
OPC remains technical proof receipt only
```

---

## 17. Common failures

### API key missing

Symptom:

```txt
apiKey=MISSING
```

Resolution:

```bash
read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo
export HBCE_API_V1_KEY
```

### Missing Human IPR

Symptom:

```txt
MISSING_HUMAN_IPR
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

Symptom:

```txt
INVALID_HUMAN_IPR
```

Resolution:

Use the Human IPR allowed by the active environment scope.

### Missing session ID

Symptom:

```txt
MISSING_SESSION_ID
```

Resolution:

Create the IPR session first and pass:

```txt
sessionId
iprSessionId
```

into the chat body.

### Events lookup returns 404

Likely cause:

```txt
wrong path: /api/v1/events/{eventId}
```

Correct path:

```txt
/api/v1/events?eventId={eventId}
```

---

## 18. Security reminders

Do not print:

```txt
API key
bearer token
session ID
cookies
private Human IPR values
raw provider payloads
private prompts
private completions
```

Do not claim:

```txt
legal certification
public identity certification
official public authority proof
qualified electronic signature
```

Always preserve:

```txt
legalCertification=false
OPC=technical proof receipt only
```

---

## 19. Where to go next

For the full technical guide:

```txt
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
```

For the smoke test report:

```txt
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
```

For the pilot package:

```txt
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
```

For the client product note:

```txt
docs/product/hbce-ipr-runtime-api-v1-client.md
```

For the executable smoke test:

```txt
scripts/test-api-v1-client-smoke.mjs
```

---

## 20. Final quickstart verdict

```txt
HBCE IPR Runtime API v1 quickstart = ready for controlled partner pilot testing
```

The API v1 surface is suitable for a short external technical validation when used with the correct API key, active Human IPR scope, IPR session flow, authenticated chat call and lookup route sequence.

The system remains bounded:

```txt
legalCertification=false
OPC=technical proof receipt only
