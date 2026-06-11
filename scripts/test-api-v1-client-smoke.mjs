#!/usr/bin/env node
/*
 * HBCE / JOKER-C2 API v1 client smoke test.
 *
 * Purpose:
 * - test the live API v1 public surface with native Node fetch;
 * - avoid external dependencies;
 * - avoid printing API keys, bearer tokens, cookies, or session secrets;
 * - return a non-zero exit code when a critical check fails.
 *
 * Runtime:
 * - Node.js 18+ required for native fetch.
 */

const DEFAULT_BASE_URL = "https://hbce-ai-joker-c2.vercel.app";
const DEFAULT_TENANT_ID = "HBCE-TENANT-SELF-PILOT";
const DEFAULT_WORKSPACE_ID = "HBCE-WORKSPACE-RND";
const DEFAULT_OPERATOR_IPR_ID = "IPR-SELF-PILOT-OPERATOR";
const DEFAULT_RUNTIME_IPR_ID = "IPR-AI-0001";
const DEFAULT_TIMEOUT_MS = 30_000;

const env = process.env;

const BASE_URL = cleanBaseUrl(
  env.HBCE_API_V1_BASE_URL ||
    env.HBCE_API_BASE_URL ||
    env.API_V1_BASE_URL ||
    env.API_BASE_URL ||
    env.NEXT_PUBLIC_HBCE_API_BASE_URL ||
    env.VERCEL_PROJECT_PRODUCTION_URL ||
    env.VERCEL_URL ||
    DEFAULT_BASE_URL,
);

const API_KEY =
  env.HBCE_API_V1_KEY ||
  env.HBCE_API_KEY ||
  env.JOKER_C2_API_KEY ||
  env.API_V1_KEY ||
  env.API_KEY ||
  "";

const TENANT_ID = env.HBCE_TENANT_ID || DEFAULT_TENANT_ID;
const WORKSPACE_ID = env.HBCE_WORKSPACE_ID || DEFAULT_WORKSPACE_ID;
const OPERATOR_IPR_ID = env.HBCE_OPERATOR_IPR_ID || DEFAULT_OPERATOR_IPR_ID;
const RUNTIME_IPR_ID = env.HBCE_RUNTIME_IPR_ID || DEFAULT_RUNTIME_IPR_ID;
const TIMEOUT_MS = positiveInteger(env.HBCE_API_V1_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);
const STRICT_AUTH = env.HBCE_API_V1_STRICT_AUTH === "1" || env.HBCE_API_V1_STRICT_AUTH === "true";

const results = [];
const created = {
  sessionId: "",
  evtId: "",
  opcId: "",
  auditId: "",
  usageId: "",
};

main().catch((error) => {
  console.error(`\nFATAL ${safeErrorMessage(error)}`);
  process.exitCode = 1;
});

async function main() {
  banner();
  checkRuntime();

  await checkJsonGet("root discovery", "/api/v1", {
    critical: true,
    expectStatus: 200,
    expectedHints: ["HBCE", "API", "v1"],
  });

  await checkJsonGet("health", "/api/v1/health", {
    critical: true,
    expectStatus: 200,
    expectedHints: ["status", "revision", "legalCertification"],
  });

  await checkJsonGet("capabilities", "/api/v1/capabilities", {
    critical: true,
    expectStatus: 200,
    expectedHints: ["capabilities", "legalCertification", "OPC"],
  });

  await checkJsonGet("self-test", "/api/v1/self-test", {
    critical: true,
    expectStatus: 200,
    expectedHints: ["status", "PASS", "legalCertification"],
  });

  await checkTextGet("openapi", "/api/v1/openapi", {
    critical: true,
    expectStatus: 200,
    expectedHints: ["openapi", "/api/v1", "HBCE"],
  });

  await checkChatWithoutKey();

  if (!API_KEY) {
    record({
      name: "authenticated session and chat",
      critical: STRICT_AUTH,
      ok: !STRICT_AUTH,
      status: "SKIPPED",
      detail: STRICT_AUTH
        ? "API key missing and HBCE_API_V1_STRICT_AUTH is enabled"
        : "API key missing; authenticated checks skipped",
    });
    return finish();
  }

  await checkSessionCreate();
  await checkChatWithKey();

  await optionalLookup("operations lookup", "/api/v1/operations", created.evtId || created.opcId);
  await optionalLookup("events lookup", "/api/v1/events", created.evtId);
  await optionalLookup("opc lookup", "/api/v1/opc", created.opcId);
  await optionalLookup("audit lookup", "/api/v1/audit", created.auditId);
  await optionalLookup("model usage lookup", "/api/v1/model-usage", created.usageId);

  finish();
}

function banner() {
  console.log("HBCE / JOKER-C2 API v1 client smoke test");
  console.log("------------------------------------------------");
  console.log(`baseUrl=${BASE_URL}`);
  console.log(`apiKey=${API_KEY ? "SET" : "MISSING"}`);
  console.log(`tenant=${TENANT_ID}`);
  console.log(`workspace=${WORKSPACE_ID}`);
  console.log(`timeoutMs=${TIMEOUT_MS}`);
  console.log(`strictAuth=${STRICT_AUTH ? "true" : "false"}`);
  console.log("secretPrinting=false");
  console.log("legalCertification=false");
  console.log("opcBoundary=technical proof receipt only");
  console.log("");
}

function checkRuntime() {
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] || "0", 10);
  if (Number.isNaN(nodeMajor) || nodeMajor < 18) {
    record({
      name: "node runtime",
      critical: true,
      ok: false,
      status: "FAIL",
      detail: `Node.js 18+ required; detected ${process.versions.node}`,
    });
    finish();
    process.exit(1);
  }

  record({
    name: "node runtime",
    critical: true,
    ok: typeof fetch === "function",
    status: typeof fetch === "function" ? "PASS" : "FAIL",
    detail: `node=${process.versions.node}; nativeFetch=${typeof fetch === "function"}`,
  });
}

async function checkJsonGet(name, path, options) {
  const response = await request("GET", path, { auth: false });
  const ok = response.status === options.expectStatus && response.jsonReady;
  const hintsOk = ok ? hasHints(response, options.expectedHints) : false;

  record({
    name,
    critical: options.critical,
    ok: ok && hintsOk,
    status: ok && hintsOk ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail: summarizeResponse(response, options.expectedHints),
  });
}

async function checkTextGet(name, path, options) {
  const response = await request("GET", path, { auth: false });
  const ok = response.status === options.expectStatus && Boolean(response.text);
  const hintsOk = ok ? hasHints(response, options.expectedHints) : false;

  record({
    name,
    critical: options.critical,
    ok: ok && hintsOk,
    status: ok && hintsOk ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail: summarizeResponse(response, options.expectedHints),
  });
}

async function checkChatWithoutKey() {
  const response = await request("POST", "/api/v1/chat", {
    auth: false,
    body: buildChatBody({ sessionId: "NO_SESSION_FOR_NEGATIVE_AUTH_TEST" }),
  });

  const ok = response.status === 401 || response.status === 403;

  record({
    name: "chat without key fail-closed",
    critical: true,
    ok,
    status: ok ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail: ok
      ? "unauthenticated request rejected as expected"
      : summarizeResponse(response, ["MISSING_API_KEY", "UNAUTHORIZED", "failReason"]),
  });
}

async function checkSessionCreate() {
  const payload = {
    tenantId: TENANT_ID,
    workspaceId: WORKSPACE_ID,
    operatorIprId: OPERATOR_IPR_ID,
    humanIprId: OPERATOR_IPR_ID,
    runtimeIprId: RUNTIME_IPR_ID,
    requestedBy: "HBCE_API_V1_CLIENT_SMOKE_TEST",
    purpose: "LIVE_CLIENT_SMOKE_TEST",
    legalCertification: false,
    opcBoundary: "technical proof receipt only",
  };

  const response = await request("POST", "/api/v1/ipr/session", {
    auth: true,
    body: payload,
  });

  const sessionId = pickFirstString(response.json, [
    "sessionId",
    "iprSessionId",
    "id",
    "session.id",
    "data.sessionId",
    "data.iprSessionId",
    "session.sessionId",
    "iprSession.sessionId",
  ]);

  if (sessionId) {
    created.sessionId = sessionId;
  }

  const ok = response.status >= 200 && response.status < 300 && Boolean(sessionId || response.jsonReady);

  record({
    name: "ipr session create",
    critical: true,
    ok,
    status: ok ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail: sessionId
      ? "session created; sessionId captured but not printed"
      : summarizeResponse(response, ["HBCE_IPR_SESSION_READY", "session", "legalCertification"]),
  });
}

async function checkChatWithKey() {
  const response = await request("POST", "/api/v1/chat", {
    auth: true,
    body: buildChatBody({ sessionId: created.sessionId }),
  });

  created.evtId = pickFirstString(response.json, [
    "evtId",
    "eventId",
    "responseEvt",
    "data.evtId",
    "data.responseEvt",
    "audit.evtId",
  ]);
  created.opcId = pickFirstString(response.json, [
    "opcId",
    "opc.id",
    "data.opcId",
    "data.opc.id",
    "proof.opcId",
  ]);
  created.auditId = pickFirstString(response.json, [
    "auditId",
    "audit.id",
    "data.auditId",
    "data.audit.id",
  ]);
  created.usageId = pickFirstString(response.json, [
    "usageId",
    "modelUsageId",
    "data.usageId",
    "data.modelUsageId",
    "modelUsage.id",
  ]);

  const ok = response.status === 200 && response.jsonReady;
  const hintsOk = ok
    ? hasHints(response, ["HBCE_IPR_RUNTIME_CHAT_READY", "legalCertification", "OPC"])
    : false;

  record({
    name: "chat with key",
    critical: true,
    ok: ok && hintsOk,
    status: ok && hintsOk ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail: summarizeResponse(response, ["HBCE_IPR_RUNTIME_CHAT_READY", "COMPLETED", "legalCertification"]),
  });
}

async function optionalLookup(name, path, lookupId) {
  if (!lookupId) {
    record({
      name,
      critical: false,
      ok: true,
      status: "SKIPPED",
      detail: "no lookup id returned by chat response",
    });
    return;
  }

  const queryPath = `${path}/${encodeURIComponent(lookupId)}`;
  const response = await request("GET", queryPath, { auth: true });
  const ok = response.status >= 200 && response.status < 300;

  record({
    name,
    critical: false,
    ok,
    status: ok ? "PASS" : "WARN",
    httpStatus: response.status,
    detail: ok ? "lookup returned successfully" : summarizeResponse(response, ["status", "failReason"]),
  });
}

function buildChatBody({ sessionId }) {
  return {
    message: "HBCE API v1 client smoke test. Return only a minimal readiness confirmation.",
    prompt: "HBCE API v1 client smoke test. Return only a minimal readiness confirmation.",
    messages: [
      {
        role: "user",
        content: "HBCE API v1 client smoke test. Return only a minimal readiness confirmation.",
      },
    ],
    tenantId: TENANT_ID,
    workspaceId: WORKSPACE_ID,
    operatorIprId: OPERATOR_IPR_ID,
    humanIprId: OPERATOR_IPR_ID,
    runtimeIprId: RUNTIME_IPR_ID,
    sessionId: sessionId || undefined,
    iprSessionId: sessionId || undefined,
    source: "scripts/test-api-v1-client-smoke.mjs",
    testMode: "API_V1_CLIENT_SMOKE_TEST",
    legalCertification: false,
    opcBoundary: "technical proof receipt only",
  };
}

async function request(method, path, options = {}) {
  const url = new URL(path, BASE_URL).toString();
  const headers = {
    Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    "User-Agent": "HBCE-JOKER-C2-API-v1-client-smoke/1.0",
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.auth && API_KEY) {
    headers.Authorization = `Bearer ${API_KEY}`;
    headers["X-API-Key"] = API_KEY;
    headers["x-api-key"] = API_KEY;
    headers["X-HBCE-API-Key"] = API_KEY;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    const json = parseJson(text, contentType);

    return {
      status: res.status,
      ok: res.ok,
      contentType,
      text,
      json,
      jsonReady: json !== null,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      contentType: "",
      text: safeErrorMessage(error),
      json: null,
      jsonReady: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function parseJson(text, contentType) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return null;
  }

  if (!contentType.includes("json") && !trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function record(result) {
  results.push(result);
  const marker = result.status.padEnd(7, " ");
  const critical = result.critical ? "critical" : "optional";
  const http = typeof result.httpStatus === "number" ? ` http=${result.httpStatus}` : "";
  console.log(`${marker} ${result.name} [${critical}]${http} :: ${result.detail || ""}`);
}

function finish() {
  const criticalFailures = results.filter((item) => item.critical && !item.ok);
  const optionalWarnings = results.filter((item) => !item.critical && !item.ok);

  console.log("\nSummary");
  console.log("-------");
  console.log(`checks=${results.length}`);
  console.log(`criticalFailures=${criticalFailures.length}`);
  console.log(`optionalWarnings=${optionalWarnings.length}`);

  if (created.evtId || created.opcId || created.auditId || created.usageId) {
    console.log("capturedIds=true");
    console.log(`evtId=${created.evtId || "NONE"}`);
    console.log(`opcId=${created.opcId || "NONE"}`);
    console.log(`auditId=${created.auditId || "NONE"}`);
    console.log(`usageId=${created.usageId || "NONE"}`);
  }

  if (criticalFailures.length > 0) {
    console.log("\nAPI_V1_CLIENT_SMOKE_TEST_FAIL");
    process.exitCode = 1;
    return;
  }

  console.log("\nAPI_V1_CLIENT_SMOKE_TEST_PASS");
  process.exitCode = 0;
}

function summarizeResponse(response, hints = []) {
  const statusHint = pickFirstString(response.json, [
    "status",
    "runtimeStatus",
    "routeRevision",
    "revision",
    "failReason",
    "error",
  ]);

  const boundary = pickFirstString(response.json, [
    "legalCertification",
    "opcBoundary",
    "boundary.opc",
    "policy.legalCertification",
  ]);

  const previewSource = response.jsonReady
    ? stableJsonPreview(redactSecrets(response.json))
    : String(response.text || "").slice(0, 220).replace(/\s+/g, " ");

  const hintText = hints.length > 0 ? ` hints=${hints.join("|")}` : "";
  const statusText = statusHint ? ` statusHint=${statusHint}` : "";
  const boundaryText = boundary !== "" ? ` boundary=${boundary}` : "";

  return `${statusText}${boundaryText}${hintText} preview=${previewSource}`.trim();
}

function hasHints(response, hints = []) {
  if (!hints || hints.length === 0) {
    return true;
  }

  const haystack = response.jsonReady ? JSON.stringify(redactSecrets(response.json)) : response.text || "";
  return hints.some((hint) => haystack.includes(hint));
}

function pickFirstString(source, paths) {
  for (const path of paths) {
    const value = getPath(source, path);
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "boolean") {
      return String(value);
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}

function getPath(source, path) {
  if (!source || typeof source !== "object") {
    return undefined;
  }

  let cursor = source;
  for (const part of path.split(".")) {
    if (!cursor || typeof cursor !== "object" || !(part in cursor)) {
      return undefined;
    }
    cursor = cursor[part];
  }
  return cursor;
}

function stableJsonPreview(value) {
  try {
    return JSON.stringify(value).slice(0, 260).replace(/\s+/g, " ");
  } catch {
    return "UNSERIALIZABLE_JSON";
  }
}

function redactSecrets(value) {
  if (Array.isArray(value)) {
    return value.map(redactSecrets);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const redacted = {};
  for (const [key, item] of Object.entries(value)) {
    if (/key|token|secret|authorization|cookie|password/i.test(key)) {
      redacted[key] = item ? "[REDACTED]" : item;
    } else {
      redacted[key] = redactSecrets(item);
    }
  }
  return redacted;
}

function cleanBaseUrl(raw) {
  const candidate = String(raw || DEFAULT_BASE_URL).trim();
  const withProtocol = candidate.startsWith("http://") || candidate.startsWith("https://")
    ? candidate
    : `https://${candidate}`;
  return withProtocol.replace(/\/+$/, "");
}

function positiveInteger(raw, fallback) {
  const parsed = Number.parseInt(String(raw || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function safeErrorMessage(error) {
  if (!error) {
    return "UNKNOWN_ERROR";
  }

  if (error.name === "AbortError") {
    return `REQUEST_TIMEOUT_AFTER_${TIMEOUT_MS}MS`;
  }

  return String(error.message || error).replace(API_KEY, "[REDACTED]");
}
