diff --git a/app/api/v1/chat/route.ts b/app/api/v1/chat/route.ts
--- a/app/api/v1/chat/route.ts
+++ b/app/api/v1/chat/route.ts
@@
-const ROUTE_REVISION = "HBCE-IPR-RUNTIME-API-v1-CHAT_BRIDGE_CONTRACT-v0.1" as const;
+const ROUTE_REVISION = "HBCE-IPR-RUNTIME-API-v1-CHAT_BRIDGE_AUTH_GATE_PRIORITY-v0.2" as const;
@@
 const MAX_IDEMPOTENCY_KEY_LENGTH = 180;
 const MAX_SESSION_ID_LENGTH = 220;
 const INTERNAL_CHAT_TIMEOUT_MS = 55_000;
+const API_KEY_HEADER = "x-hbce-api-key" as const;
+const AUTHORIZATION_HEADER = "authorization" as const;
@@
   routeRevision: typeof ROUTE_REVISION;
   failReason:
+    | "MISSING_API_KEY"
+    | "API_KEY_NOT_CONFIGURED"
+    | "INVALID_API_KEY"
     | "INVALID_JSON_BODY"
     | "MISSING_SESSION_ID"
@@
 function fail(
   failReason: V1ChatFailPayload["failReason"],
   message: string,
   init: ResponseInit,
   extra?: Pick<V1ChatFailPayload, "expected" | "bridge">
@@
 
   return jsonResponse(payload, init);
 }
+
+function extractProvidedApiKey(request: NextRequest): string | null {
+  const directKey = normalizeString(request.headers.get(API_KEY_HEADER));
+  if (directKey) {
+    return directKey;
+  }
+
+  const authorization = normalizeString(request.headers.get(AUTHORIZATION_HEADER));
+  if (!authorization) {
+    return null;
+  }
+
+  const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
+  return bearerMatch ? normalizeString(bearerMatch[1]) : null;
+}
+
+function validatePilotApiKey(request: NextRequest) {
+  const providedApiKey = extractProvidedApiKey(request);
+
+  if (!providedApiKey) {
+    return fail(
+      "MISSING_API_KEY",
+      "Missing required HBCE API key for /api/v1/chat pilot access.",
+      {
+        status: 401,
+        headers: {
+          "WWW-Authenticate": 'Bearer realm="HBCE API v1 chat", error="missing_token"'
+        }
+      },
+      {
+        expected: {
+          header: "x-hbce-api-key or Authorization: Bearer <token>"
+        }
+      }
+    );
+  }
+
+  const expectedApiKey = normalizeString(process.env.HBCE_API_KEY);
+
+  if (!expectedApiKey) {
+    return fail(
+      "API_KEY_NOT_CONFIGURED",
+      "HBCE_API_KEY is not configured for /api/v1/chat pilot access.",
+      { status: 503 },
+      {
+        expected: {
+          environment: "HBCE_API_KEY"
+        }
+      }
+    );
+  }
+
+  if (providedApiKey !== expectedApiKey) {
+    return fail(
+      "INVALID_API_KEY",
+      "Invalid HBCE API key for /api/v1/chat pilot access.",
+      { status: 403 },
+      {
+        expected: {
+          header: "valid x-hbce-api-key or Authorization: Bearer <token>"
+        }
+      }
+    );
+  }
+
+  return null;
+}
 
 async function readJsonBody(request: NextRequest): Promise<V1ChatRequestBody | null> {
@@
 export async function POST(request: NextRequest) {
+  const apiKeyFailure = validatePilotApiKey(request);
+  if (apiKeyFailure) {
+    return apiKeyFailure;
+  }
+
   const body = await readJsonBody(request);
 
   if (!body) {
