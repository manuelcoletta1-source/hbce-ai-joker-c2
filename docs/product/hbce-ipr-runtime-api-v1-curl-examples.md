# HBCE IPR Runtime API v1 — cURL Examples

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**API version:** `v1`  
**Repository:** `hbce-ai-joker-c2`  
**Document type:** cURL examples  
**Audience:** technical partners, B2B / B2G pilot evaluators, integration developers, internal operators  
**Example status:** `pilot curl examples ready`  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Purpose

This document provides practical `curl` examples for testing the HBCE IPR Runtime API v1.

It is designed for a technical partner who needs to verify the API surface quickly without reading the full integration guide first, because apparently even engineers occasionally deserve mercy.

The examples cover:

```txt
base URL setup
safe API key handling
public API discovery
health check
capabilities check
OpenAPI check
fail-closed unauthenticated chat
IPR session creation
authenticated chat execution
EVT lookup
OPC lookup
audit lookup
operations lookup
model usage lookup when available
cleanup
```

Core boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
```

---

## 2. Related documents

Current API v1 package:

```txt
docs/product/hbce-ipr-runtime-api-v1-client.md
docs/product/hbce-ipr-runtime-api-v1-client-smoke-test.md
docs/product/hbce-ipr-runtime-api-v1-integration-guide.md
docs/product/hbce-ipr-runtime-api-v1-pilot-package.md
docs/product/hbce-ipr-runtime-api-v1-quickstart.md
docs/product/hbce-ipr-runtime-api-v1-product-index.md
docs/product/hbce-ipr-runtime-api-v1-security-checklist.md
docs/product/hbce-ipr-runtime-api-v1-rate-limit-quota.md
docs/product/hbce-ipr-runtime-api-v1-partner-onboarding.md
docs/product/hbce-ipr-runtime-api-v1-b2b-b2g-partner-pitch.md
```

Executable smoke test:

```txt
scripts/test-api-v1-client-smoke.mjs
```

Canonical validation result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

---

## 3. Base URL

Production pilot base URL:

```bash
export HBCE_API_V1_BASE_URL="https://hbce-ai-joker-c2.vercel.app"
```

API root:

```txt
https://hbce-ai-joker-c2.vercel.app/api/v1
```

Check variable:

```bash
echo "$HBCE_API_V1_BASE_URL"
```

Expected:

```txt
https://hbce-ai-joker-c2.vercel.app
```

---

## 4. Safe API key input

Do not paste the API key into a command.

Use silent terminal input:

```bash
read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo
export HBCE_API_V1_KEY
```

Check only whether it is set:

```bash
test -n "$HBCE_API_V1_KEY" && echo "apiKey=SET" || echo "apiKey=MISSING"
```

Expected:

```txt
apiKey=SET
```

Never print the API key value.

Humanity has leaked enough secrets by typing them directly into shells like a civilization trying to lose at authentication.

---

## 5. Runtime and scope variables

Set runtime and pilot scope:

```bash
export HBCE_RUNTIME_IPR_ID="IPR-AI-0001"
export HBCE_TENANT_ID="HBCE-TENANT-SELF-PILOT"
export HBCE_WORKSPACE_ID="HBCE-WORKSPACE-RND"
```

Set operator / Human IPR according to the active pilot scope:

```bash
export HBCE_OPERATOR_IPR_ID="IPR-..."
```

For local repo-based self-pilot extraction, internal operators may derive the configured Human IPR from the route file:

```bash
cd /home/manuelcoletta1/github/hbce-ai-joker-c2 || exit 1

export HBCE_OPERATOR_IPR_ID="$(
  python3 - <<'PY'
from pathlib import Path
import re

text = Path("app/api/v1/ipr/session/route.ts").read_text(encoding="utf-8")
m = re.search(r'HBCE_SELF_PILOT_HUMAN_IPR\s*=\s*["\']([^"\']+)["\']', text)
if not m:
    raise SystemExit("HBCE_SELF_PILOT_HUMAN_IPR_NOT_FOUND")
print(m.group(1))
PY
)"
```

Check only whether it is present:

```bash
test -n "$HBCE_OPERATOR_IPR_ID" && echo "operatorIpr=SET" || echo "operatorIpr=MISSING"
```

Do not print private IPR values in public logs.

---

## 6. Public root discovery

Route:

```txt
GET /api/v1
```

Command:

```bash
curl -sS "$HBCE_API_V1_BASE_URL/api/v1" | head -c 1000
echo
```

Expected concepts:

```txt
HBCE
API
v1
legalCertification=false
technical proof receipt only
```

This route must not require an API key.

---

## 7. Health check

Route:

```txt
GET /api/v1/health
```

Command:

```bash
curl -sS "$HBCE_API_V1_BASE_URL/api/v1/health" | head -c 1000
echo
```

Expected concepts:

```txt
HBCE_IPR_RUNTIME_API_READY
legalCertification=false
technical proof receipt only
```

Smoke anchor:

```txt
PASS health
```

---

## 8. Capabilities check

Route:

```txt
GET /api/v1/capabilities
```

Command:

```bash
curl -sS "$HBCE_API_V1_BASE_URL/api/v1/capabilities" | head -c 1200
echo
```

Expected concepts:

```txt
HBCE_IPR_RUNTIME_API_CAPABILITIES_READY
capabilities
OPC
legalCertification
```

Smoke anchor:

```txt
PASS capabilities
```

---

## 9. Self-test check

Route:

```txt
GET /api/v1/self-test
```

Command:

```bash
curl -sS "$HBCE_API_V1_BASE_URL/api/v1/self-test" | head -c 1200
echo
```

Expected concepts:

```txt
self-test
API v1
legalCertification=false
```

Smoke anchor:

```txt
PASS self-test
```

---

## 10. OpenAPI check

Route:

```txt
GET /api/v1/openapi
```

Command:

```bash
curl -sS "$HBCE_API_V1_BASE_URL/api/v1/openapi" | head -c 1200
echo
```

Expected concepts:

```txt
openapi
/api/v1
HBCE
```

Smoke anchor:

```txt
PASS openapi
```

---

## 11. Fail-closed unauthenticated chat

Route:

```txt
POST /api/v1/chat
```

Command:

```bash
curl -sS -i   -X POST "$HBCE_API_V1_BASE_URL/api/v1/chat"   -H "Content-Type: application/json"   -d '{
    "message":"Unauthenticated fail-closed test from curl examples."
  }'   | head -40
```

Expected:

```txt
HTTP/2 401
```

or:

```txt
HTTP/1.1 401
```

Accepted equivalent:

```txt
HTTP 403
```

Canonical smoke anchor:

```txt
PASS chat without key fail-closed [critical] http=401
```

If this returns `200`, stop the pilot test.

That is not a cosmetic bug. That is a door with a welcome mat where the lock should be.

---

## 12. Create IPR session

Route:

```txt
POST /api/v1/ipr/session
```

Command:

```bash
SESSION_RESPONSE="$(
  curl -sS     -X POST "$HBCE_API_V1_BASE_URL/api/v1/ipr/session"     -H "Content-Type: application/json"     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     -H "X-HBCE-API-Key: $HBCE_API_V1_KEY"     -d "{
      \"tenantId\":\"$HBCE_TENANT_ID\",
      \"tenant\":\"$HBCE_TENANT_ID\",
      \"workspaceId\":\"$HBCE_WORKSPACE_ID\",
      \"workspace\":\"$HBCE_WORKSPACE_ID\",
      \"operatorIprId\":\"$HBCE_OPERATOR_IPR_ID\",
      \"operatorIpr\":\"$HBCE_OPERATOR_IPR_ID\",
      \"humanIprId\":\"$HBCE_OPERATOR_IPR_ID\",
      \"humanIpr\":\"$HBCE_OPERATOR_IPR_ID\",
      \"runtimeIprId\":\"$HBCE_RUNTIME_IPR_ID\",
      \"runtimeIpr\":\"$HBCE_RUNTIME_IPR_ID\",
      \"requestedBy\":\"API_V1_CURL_EXAMPLES\",
      \"purpose\":\"CURL_SESSION_TEST\",
      \"legalCertification\":false,
      \"opcBoundary\":\"technical proof receipt only\"
    }"
)"
```

Preview without printing secrets:

```bash
echo "$SESSION_RESPONSE" | head -c 1200
echo
```

Expected concepts:

```txt
session
IPR
created
legalCertification=false
technical proof receipt only
```

Smoke anchor:

```txt
PASS ipr session create [critical] http=201
```

---

## 13. Extract session ID

Use Node to extract a likely session ID without requiring `jq`:

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

Check whether captured:

```bash
test -n "$SESSION_ID" && echo "sessionId=SET" || echo "sessionId=MISSING"
```

Do not print the session ID in shared logs.

---

## 14. Authenticated chat

Route:

```txt
POST /api/v1/chat
```

Command:

```bash
CHAT_RESPONSE="$(
  curl -sS     -X POST "$HBCE_API_V1_BASE_URL/api/v1/chat"     -H "Content-Type: application/json"     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     -H "X-HBCE-API-Key: $HBCE_API_V1_KEY"     -d "{
      \"message\":\"HBCE API v1 curl examples readiness check. Return a minimal confirmation.\",
      \"prompt\":\"HBCE API v1 curl examples readiness check. Return a minimal confirmation.\",
      \"messages\":[
        {
          \"role\":\"user\",
          \"content\":\"HBCE API v1 curl examples readiness check. Return a minimal confirmation.\"
        }
      ],
      \"tenantId\":\"$HBCE_TENANT_ID\",
      \"tenant\":\"$HBCE_TENANT_ID\",
      \"workspaceId\":\"$HBCE_WORKSPACE_ID\",
      \"workspace\":\"$HBCE_WORKSPACE_ID\",
      \"operatorIprId\":\"$HBCE_OPERATOR_IPR_ID\",
      \"operatorIpr\":\"$HBCE_OPERATOR_IPR_ID\",
      \"humanIprId\":\"$HBCE_OPERATOR_IPR_ID\",
      \"humanIpr\":\"$HBCE_OPERATOR_IPR_ID\",
      \"runtimeIprId\":\"$HBCE_RUNTIME_IPR_ID\",
      \"runtimeIpr\":\"$HBCE_RUNTIME_IPR_ID\",
      \"sessionId\":\"$SESSION_ID\",
      \"iprSessionId\":\"$SESSION_ID\",
      \"source\":\"docs/product/hbce-ipr-runtime-api-v1-curl-examples.md\",
      \"testMode\":\"API_V1_CURL_EXAMPLES\",
      \"legalCertification\":false,
      \"opcBoundary\":\"technical proof receipt only\"
    }"
)"
```

Preview:

```bash
echo "$CHAT_RESPONSE" | head -c 1600
echo
```

Expected concepts:

```txt
HBCE
JOKER-C2
EVT
OPC
audit
legalCertification=false
technical proof receipt only
```

Smoke anchor:

```txt
PASS chat with key [critical] http=200
```

---

## 15. Extract lookup identifiers

Extract EVT, OPC, audit, operation and usage IDs if present:

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
      json?.data?.eventId ||
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

OPERATION_ID="$(
  CHAT_RESPONSE="$CHAT_RESPONSE" node -e '
    const json = JSON.parse(process.env.CHAT_RESPONSE || "{}");
    const id =
      json.operationId ||
      json?.operation?.id ||
      json?.data?.operationId ||
      "";
    process.stdout.write(id);
  '
)"

USAGE_ID="$(
  CHAT_RESPONSE="$CHAT_RESPONSE" node -e '
    const json = JSON.parse(process.env.CHAT_RESPONSE || "{}");
    const id =
      json.usageId ||
      json?.usage?.id ||
      json?.data?.usageId ||
      "";
    process.stdout.write(id);
  '
)"
```

Print safe capture status only:

```bash
test -n "$EVT_ID" && echo "EVT captured" || echo "EVT missing"
test -n "$OPC_ID" && echo "OPC captured" || echo "OPC missing"
test -n "$AUDIT_ID" && echo "AUDIT captured" || echo "AUDIT missing"
test -n "$OPERATION_ID" && echo "OPERATION captured" || echo "OPERATION missing"
test -n "$USAGE_ID" && echo "USAGE captured" || echo "USAGE missing"
```

---

## 16. EVT lookup

Route:

```txt
GET /api/v1/events?eventId={eventId}
```

Command:

```bash
if test -n "$EVT_ID"; then
  curl -sS     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     "$HBCE_API_V1_BASE_URL/api/v1/events?eventId=$EVT_ID"     | head -c 1200
  echo
else
  echo "SKIP: EVT_ID missing"
fi
```

Expected:

```txt
event lookup envelope
legalCertification=false
```

Canonical route warning:

```txt
Correct:   GET /api/v1/events?eventId=EVT-...
Incorrect: GET /api/v1/events/EVT-...
```

Smoke anchor:

```txt
PASS events lookup [optional] http=200
```

---

## 17. OPC lookup

Route:

```txt
GET /api/v1/opc/{opcId}
```

Command:

```bash
if test -n "$OPC_ID"; then
  curl -sS     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     "$HBCE_API_V1_BASE_URL/api/v1/opc/$OPC_ID"     | head -c 1200
  echo
else
  echo "SKIP: OPC_ID missing"
fi
```

Expected:

```txt
OPC
technical proof receipt only
legalCertification=false
```

Smoke anchor:

```txt
PASS opc lookup [optional] http=200
```

---

## 18. Audit lookup

Route:

```txt
GET /api/v1/audit/{auditId}
```

Command:

```bash
if test -n "$AUDIT_ID"; then
  curl -sS     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     "$HBCE_API_V1_BASE_URL/api/v1/audit/$AUDIT_ID"     | head -c 1200
  echo
else
  echo "SKIP: AUDIT_ID missing"
fi
```

Expected:

```txt
audit envelope
contract boundary
no raw secret exposure
```

Smoke anchor:

```txt
PASS audit lookup [optional] http=200
```

---

## 19. Operations lookup

Route:

```txt
GET /api/v1/operations/{operationId}
```

Command:

```bash
if test -n "$OPERATION_ID"; then
  curl -sS     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     "$HBCE_API_V1_BASE_URL/api/v1/operations/$OPERATION_ID"     | head -c 1200
  echo
else
  echo "SKIP: OPERATION_ID missing"
fi
```

Smoke anchor:

```txt
PASS operations lookup [optional] http=200
```

---

## 20. Model usage lookup

Route:

```txt
GET /api/v1/model-usage/{usageId}
```

Command:

```bash
if test -n "$USAGE_ID"; then
  curl -sS     -H "Authorization: Bearer $HBCE_API_V1_KEY"     -H "X-API-Key: $HBCE_API_V1_KEY"     "$HBCE_API_V1_BASE_URL/api/v1/model-usage/$USAGE_ID"     | head -c 1200
  echo
else
  echo "SKIP: USAGE_ID missing"
fi
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

## 21. Full minimal sequence

This is the condensed test sequence:

```bash
export HBCE_API_V1_BASE_URL="https://hbce-ai-joker-c2.vercel.app"
export HBCE_RUNTIME_IPR_ID="IPR-AI-0001"
export HBCE_TENANT_ID="HBCE-TENANT-SELF-PILOT"
export HBCE_WORKSPACE_ID="HBCE-WORKSPACE-RND"
export HBCE_OPERATOR_IPR_ID="IPR-..."

read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo
export HBCE_API_V1_KEY

curl -sS "$HBCE_API_V1_BASE_URL/api/v1/health" | head -c 600
echo

curl -sS -i   -X POST "$HBCE_API_V1_BASE_URL/api/v1/chat"   -H "Content-Type: application/json"   -d '{"message":"fail closed test"}'   | head -40

# Create session, then authenticated chat, then lookup EVT/OPC/audit as shown above.

unset HBCE_API_V1_KEY
unset HBCE_OPERATOR_IPR_ID
```

The full flow should still be validated by the smoke test script.

---

## 22. Recommended smoke test

Use the executable script for final validation:

```bash
cd /home/manuelcoletta1/github/hbce-ai-joker-c2 || exit 1

git pull --ff-only origin main

HBCE_OPERATOR_IPR_ID="$(
  python3 - <<'PY'
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

Expected:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
```

---

## 23. Rate limit response example

When rate limits are enforced, a blocked route may return:

```json
{
  "status": "RATE_LIMIT_EXCEEDED",
  "route": "/api/v1/chat",
  "retryAfterSeconds": 60,
  "legalCertification": false,
  "opcBoundary": "technical proof receipt only"
}
```

Do not retry aggressively after `429`.

Doing so converts a rate limit into an argument with the server, and the server is more patient than you.

---

## 24. Cleanup

After tests:

```bash
unset HBCE_API_V1_KEY
unset HBCE_OPERATOR_IPR_ID
unset HBCE_RUNTIME_IPR_ID
unset HBCE_TENANT_ID
unset HBCE_WORKSPACE_ID
unset HBCE_API_V1_BASE_URL
unset SESSION_RESPONSE
unset SESSION_ID
unset CHAT_RESPONSE
unset EVT_ID
unset OPC_ID
unset AUDIT_ID
unset OPERATION_ID
unset USAGE_ID
```

Confirm key cleared:

```bash
test -z "$HBCE_API_V1_KEY" && echo "apiKey=CLEARED" || echo "apiKey=STILL_SET"
```

Expected:

```txt
apiKey=CLEARED
```

---

## 25. Security reminders

Never print:

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

Never claim:

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

## 26. Common errors

### Missing API key

Expected symptom:

```txt
401
MISSING_API_KEY
```

Fix:

```bash
read -s -p "HBCE_API_V1_KEY: " HBCE_API_V1_KEY
echo
export HBCE_API_V1_KEY
```

### Missing Human IPR

Expected symptom:

```txt
MISSING_HUMAN_IPR
```

Fix:

```bash
export HBCE_OPERATOR_IPR_ID="IPR-..."
```

### Missing session

Expected symptom:

```txt
MISSING_SESSION_ID
```

Fix:

```txt
Create IPR session first.
Pass sessionId and iprSessionId to POST /api/v1/chat.
```

### Wrong event lookup path

Wrong:

```txt
/api/v1/events/EVT-...
```

Correct:

```txt
/api/v1/events?eventId=EVT-...
```

### Quota exceeded

Expected concept:

```txt
RATE_LIMIT_EXCEEDED
```

Fix:

```txt
Wait for Retry-After or contact operator for quota review.
```

---

## 27. Final curl examples verdict

```txt
HBCE IPR Runtime API v1 curl examples = ready
```

The cURL examples are suitable for controlled B2B / B2G pilot testing when used with the assigned API key, tenant, workspace, Human IPR, runtime IPR and quota scope.

Final boundary:

```txt
legalCertification=false
OPC=technical proof receipt only
