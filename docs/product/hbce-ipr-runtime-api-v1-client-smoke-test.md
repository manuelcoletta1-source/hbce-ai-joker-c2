# HBCE IPR Runtime API v1 — Client Smoke Test Report

**Product:** HBCE IPR Operational Identity & Proof Layer  
**Runtime:** AI JOKER-C2 SaaS Core v0.1  
**Repository:** `hbce-ai-joker-c2`  
**Script:** `scripts/test-api-v1-client-smoke.mjs`  
**Status:** `LIVE PASS`  
**Boundary:** `legalCertification=false`  
**OPC boundary:** technical proof receipt only

---

## 1. Purpose

This document records the live validation of the API v1 client smoke test for the HBCE / JOKER-C2 runtime.

The smoke test verifies that the public API v1 surface is reachable, that unauthenticated access fails closed, and that authenticated IPR-bound execution works through the public v1 client flow.

The test is intentionally minimal. It is not a load test, not a security audit, not a legal certification, and not a full database verification suite. It exists to confirm that the public API v1 contract can be exercised end-to-end from a clean Node.js client without external dependencies.

---

## 2. Tested file

```txt
scripts/test-api-v1-client-smoke.mjs
```

The script is a native Node.js smoke test using built-in `fetch`.

It does not require external packages.

Runtime requirement:

```txt
Node.js 18+
```

Confirmed live runtime during validation:

```txt
node=18.20.4
nativeFetch=true
```

---

## 3. Live base URL

Default live target:

```txt
https://hbce-ai-joker-c2.vercel.app
```

The script also supports overriding the base URL through environment variables:

```txt
HBCE_API_V1_BASE_URL
HBCE_API_BASE_URL
API_V1_BASE_URL
API_BASE_URL
NEXT_PUBLIC_HBCE_API_BASE_URL
VERCEL_PROJECT_PRODUCTION_URL
VERCEL_URL
```

If no variable is set, the script falls back to the live Vercel domain.

---

## 4. Authentication model

The script supports two execution modes.

### 4.1 Public-only mode

If no API key is provided, the script tests:

- public discovery;
- public health;
- public capabilities;
- public self-test;
- public OpenAPI route;
- fail-closed behavior for unauthenticated chat.

In this mode, authenticated checks are skipped unless strict auth is enabled.

### 4.2 Authenticated strict mode

When `HBCE_API_V1_KEY` is provided and `HBCE_API_V1_STRICT_AUTH=1`, the script tests the full authenticated path:

- IPR session creation;
- authenticated chat;
- linked operations lookup;
- linked events lookup;
- linked OPC lookup;
- linked audit lookup;
- optional model usage lookup if a usage ID is returned.

The script never prints the API key.

---

## 5. Environment variables

Supported variables:

```txt
HBCE_API_V1_KEY
HBCE_API_V1_STRICT_AUTH
HBCE_API_V1_BASE_URL
HBCE_OPERATOR_IPR_ID
HBCE_RUNTIME_IPR_ID
HBCE_TENANT_ID
HBCE_WORKSPACE_ID
HBCE_API_V1_TIMEOUT_MS
```

Default operational scope:

```txt
tenant=HBCE-TENANT-SELF-PILOT
workspace=HBCE-WORKSPACE-RND
runtimeIpr=IPR-AI-0001
```

The Human IPR must match the active self-pilot IPR scope enforced by:

```txt
app/api/v1/ipr/session/route.ts
```

For local live testing, the Human IPR can be read from the route file and passed to the script without printing it.

---

## 6. Final live test command

Use this command from the repository root:

```bash
cd /home/manuelcoletta1/github/hbce-ai-joker-c2 || exit 1

git pull --ff-only origin main

git status -sb

echo
echo "=== API v1 CLIENT SMOKE TEST FINAL LIVE ==="
echo "Incolla solo la API key. Human IPR letto dalla route, non stampato."

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

echo
echo "=== FINE API v1 CLIENT SMOKE TEST FINAL LIVE ==="
```

Do not paste API keys or private operational identifiers into chat logs, tickets, documentation comments, commit messages, screenshots, or issue descriptions.

The script itself prints only:

```txt
apiKey=SET
```

or:

```txt
apiKey=MISSING
```

It does not print the key value.

---

## 7. Final live validation result

Final live result:

```txt
API_V1_CLIENT_SMOKE_TEST_PASS
criticalFailures=0
optionalWarnings=0
checks=14
capturedIds=true
```

This means the client smoke test completed successfully across the public and authenticated API v1 path.

---

## 8. Final checks

The final PASS included:

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
SKIPPED model usage lookup
```

The model usage lookup was skipped because the authenticated chat response returned:

```txt
usageId=NONE
```

This is not a smoke test failure.

The script treats missing model usage as non-critical because not every runtime response is required to expose a public model usage receipt through the v1 client smoke path.

---

## 9. Public API v1 surface covered

The smoke test validates the following public API v1 routes:

```txt
GET  /api/v1
GET  /api/v1/health
GET  /api/v1/capabilities
GET  /api/v1/self-test
GET  /api/v1/openapi
POST /api/v1/chat
POST /api/v1/ipr/session
GET  /api/v1/operations/{operationId}
GET  /api/v1/events?eventId={eventId}
GET  /api/v1/opc/{opcId}
GET  /api/v1/audit/{auditId}
GET  /api/v1/model-usage/{usageId}
```

The events lookup uses query-string contract form:

```txt
GET /api/v1/events?eventId=EVT-...
```

It does not use:

```txt
GET /api/v1/events/{eventId}
```

That distinction matters because the implemented route is:

```txt
app/api/v1/events/route.ts
```

not:

```txt
app/api/v1/events/[eventId]/route.ts
```

The previous warning was caused by the script calling the wrong path. The final fix corrected the lookup path and removed the optional warning.

---

## 10. Closed issue: events lookup path

Previous non-blocking warning:

```txt
WARN events lookup [optional] http=404
```

Cause:

```txt
The script called /api/v1/events/{EVT-ID}
```

Actual route contract:

```txt
/api/v1/events?eventId={EVT-ID}
```

Fix applied in:

```txt
scripts/test-api-v1-client-smoke.mjs
```

Commit message:

```txt
Fix API v1 client smoke events lookup path
```

Final result after fix:

```txt
PASS events lookup [optional] http=200
optionalWarnings=0
```

---

## 11. Closed issue: authenticated IPR payload

Earlier authenticated tests failed because the session route required a strict Human IPR field.

Observed failures:

```txt
MISSING_HUMAN_IPR
INVALID_HUMAN_IPR
MISSING_SESSION_ID
```

Resolution:

The client smoke payload now sends both canonical and compatibility fields:

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

The authenticated local test reads the active self-pilot Human IPR from:

```txt
app/api/v1/ipr/session/route.ts
```

and injects it through:

```txt
HBCE_OPERATOR_IPR_ID
```

without printing it.

Final authenticated result:

```txt
PASS ipr session create [critical] http=201
PASS chat with key [critical] http=200
```

---

## 12. Security posture

The smoke test follows these rules:

- no API key printed;
- no bearer token printed;
- no cookie printed;
- no session ID printed;
- no raw provider payload printed;
- no raw prompt or completion persistence check;
- no legal certification claim;
- OPC treated as technical proof receipt only;
- fail-closed unauthenticated chat verified with HTTP `401`.

The unauthenticated chat check is critical.

Final expected result:

```txt
PASS chat without key fail-closed [critical] http=401
```

---

## 13. Operational interpretation

The final successful smoke test proves that the API v1 client surface is live and usable for a minimal external integration flow.

It confirms:

1. public runtime discovery is reachable;
2. public health and capabilities contracts respond;
3. OpenAPI contract route responds;
4. unauthenticated chat is rejected;
5. authenticated IPR session creation works;
6. authenticated chat execution works;
7. returned EVT / OPC / audit identifiers can be passed into public lookup contract routes;
8. the public events route responds through the correct query-string contract;
9. the client can complete with zero critical failures and zero optional warnings.

This is a technical runtime validation, not a certification of legal identity, public identity, regulatory compliance, or external legal proof.

---

## 14. Boundary statement

The following boundaries remain active:

```txt
legalCertification=false
OPC=technical proof receipt only
IPR Card is an internal operational identity certificate, not an official public identity document
```

The smoke test validates API behavior. It does not convert the runtime into a public legal certification authority.

---

## 15. Final verdict

```txt
HBCE / JOKER-C2 API v1 CLIENT SMOKE TEST = CLOSED PASS
```

The client smoke test is now suitable as a live post-deploy verification command for the API v1 public surface and authenticated IPR-bound runtime path.
