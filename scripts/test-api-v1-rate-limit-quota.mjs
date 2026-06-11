#!/usr/bin/env node
/*
 * HBCE / JOKER-C2 API v1 rate limit and quota smoke test.
 *
 * Purpose:
 * - validate API v1 rate-limit/quota contract signals without external dependencies;
 * - verify unauthenticated chat remains fail-closed;
 * - verify authenticated pilot flow when an API key is provided;
 * - optionally probe rate-limit behavior with a bounded request burst;
 * - avoid printing API keys, bearer tokens, cookies, session IDs, or private IPR values.
 *
 * Runtime:
 * - Node.js 18+ required for native fetch.
 *
 * Safety:
 * - By default this script does NOT hammer the API.
 * - Bounded probe is enabled only with HBCE_API_V1_RATE_LIMIT_PROBE=1.
 */

const DEFAULT_BASE_URL = "https://hbce-ai-joker-c2.vercel.app";
const DEFAULT_TENANT_ID = "HBCE-TENANT-SELF-PILOT";
const DEFAULT_WORKSPACE_ID = "HBCE-WORKSPACE-RND";
const DEFAULT_OPERATOR_IPR_ID = "IPR-SELF-PILOT-OPERATOR";
const DEFAULT_RUNTIME_IPR_ID = "IPR-AI-0001";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_PROBE_REQUESTS = 3;
const DEFAULT_PROBE_ROUTE = "/api/v1/health";

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
const STRICT_AUTH =
  env.HBCE_API_V1_STRICT_AUTH === "1" ||
  env.HBCE_API_V1_STRICT_AUTH === "true";

const RATE_LIMIT_PROBE =
  env.HBCE_API_V1_RATE_LIMIT_PROBE === "1" ||
  env.HBCE_API_V1_RATE_LIMIT_PROBE === "true";

const PROBE_REQUESTS = boundedInteger(
  env.HBCE_API_V1_RATE_LIMIT_PROBE_REQUESTS,
  DEFAULT_PROBE_REQUESTS,
  1,
  25,
);

const PROBE_ROUTE = normalizePath(env.HBCE_API_V1_RATE_LIMIT_PROBE_ROUTE || DEFAULT_PROBE_ROUTE);

const results = [];
const captured = {
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

  await checkPublicContract("root discovery", "/api/v1", ["HBCE", "API", "v1"]);
  await checkPublicContract("health", "/api/v1/health", ["status", "revision", "legalCertification"]);
  await checkPublicContract("capabilities", "/api/v1/capabilities", [
    "capabilities",
    "legalCertification",
    "OPC",
  ]);

  await checkRateLimitPolicySurface();
  await checkChatWithoutKey();

  if (!API_KEY) {
    record({
      name: "authenticated quota boundary checks",
      critical: STRICT_AUTH,
      ok: !STRICT_AUTH,
      status: STRICT_AUTH ? "FAIL" : "SKIPPED",
      detail: STRICT_AUTH
        ? "API key missing and HBCE_API_V1_STRICT_AUTH is enabled"
        : "API key missing; authenticated rate-limit/quota checks skipped",
    });

    return finish();
  }

  await checkSessionCreate();
  await checkAuthenticatedChatContract();

  if (RATE_LIMIT_PROBE) {
    await checkBoundedRateLimitProbe();
  } else {
    record({
      name: "bounded rate-limit probe",
      critical: false,
      ok: true,
      status: "SKIPPED",
      detail:
        "disabled by default; set HBCE_API_V1_RATE_LIMIT_PROBE=1 for a bounded probe; RATE_LIMIT_EXCEEDED remains the expected blocked status",
    });
  }

  await optionalLookup("events lookup", "/api/v1/events", captured.evtId);
  await optionalLookup("opc lookup", "/api/v1/opc", captured.opcId);
  await optionalLookup("audit lookup", "/api/v1/audit", captured.auditId);
  await optionalLookup("model usage lookup", "/api/v1/model-usage", captured.usageId);

  finish();
}

function banner() {
  console.log("HBCE / JOKER-C2 API v1 rate limit quota smoke test");
  console.log("-------------------------------------------------------");
  console.log(`baseUrl=${BASE_URL}`);
  console.log(`apiKey=${API_KEY ? "SET" : "MISSING"}`);
  console.log(`tenant=${TENANT_ID}`);
  console.log(`workspace=${WORKSPACE_ID}`);
  console.log(`timeoutMs=${TIMEOUT_MS}`);
  console.log(`strictAuth=${STRICT_AUTH ? "true" : "false"}`);
  console.log(`rateLimitProbe=${RATE_LIMIT_PROBE ? "true" : "false"}`);
  console.log(`probeRoute=${PROBE_ROUTE}`);
  console.log(`probeRequests=${PROBE_REQUESTS}`);
  console.log("secretPrinting=false");
  console.log("legalCertification=false");
  console.log("opcBoundary=technical proof receipt only");
  console.log("expectedLimitStatus=RATE_LIMIT_EXCEEDED");
  console.log("");
}

function checkRuntime() {
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] || "0", 10);
  const ok = typeof fetch === "function" && Number.isFinite(nodeMajor) && nodeMajor >= 18;

  record({
    name: "node runtime",
    critical: true,
    ok,
    status: ok ? "PASS" : "FAIL",
    detail: `node=${process.versions.node}; nativeFetch=${typeof fetch === "function"}`,
  });
}

async function checkPublicContract(name, path, hints) {
  const response = await request("GET", path, { auth: false });
  const ok = response.status === 200 && Boolean(response.text);
  const hintsOk = ok ? hasHints(response, hints) : false;

  record({
    name,
    critical: true,
    ok: ok && hintsOk,
    status: ok && hintsOk ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail: summarizeResponse(response, hints),
  });
}

async function checkRateLimitPolicySurface() {
  const response = await request("GET", "/api/v1/capabilities", { auth: false });
  const haystack = responseToText(response);
  const hasBoundary =
    haystack.includes("legalCertification") ||
    haystack.includes("technical proof receipt only") ||
    haystack.includes("OPC");

  record({
    name: "rate-limit quota policy boundary surface",
    critical: true,
    ok: response.status === 200 && hasBoundary,
    status: response.status === 200 && hasBoundary ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail:
      response.status === 200 && hasBoundary
        ? "capabilities surface preserves policy/proof boundary; expected blocked status RATE_LIMIT_EXCEEDED"
        : summarizeResponse(response, ["legalCertification", "OPC", "RATE_LIMIT_EXCEEDED"]),
  });
}

async function checkChatWithoutKey() {
  const response = await request("POST", "/api/v1/chat", {
    auth: false,
    body: buildChatBody({
      sessionId: "NO_SESSION_FOR_RATE_LIMIT_NEGATIVE_AUTH_TEST",
      message: "Unauthenticated rate-limit quota smoke test. This request must fail closed.",
    }),
  });

  const ok = response.status === 401 || response.status === 403;

  record({
    name: "chat without key fail-closed",
    critical: true,
    ok,
    status: ok ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail: ok
      ? "unauthenticated request rejected; fail-closed boundary intact"
      : summarizeResponse(response, ["MISSING_API_KEY", "UNAUTHORIZED", "failReason"]),
  });
}

async function checkSessionCreate() {
  const response = await request("POST", "/api/v1/ipr/session", {
    auth: true,
    body: {
      tenantId: TENANT_ID,
      tenant: TENANT_ID,
      workspaceId: WORKSPACE_ID,
      workspace: WORKSPACE_ID,
      operatorIprId: OPERATOR_IPR_ID,
      operatorIpr: OPERATOR_IPR_ID,
      humanIprId: OPERATOR_IPR_ID,
      humanIpr: OPERATOR_IPR_ID,
      runtimeIprId: RUNTIME_IPR_ID,
      runtimeIpr: RUNTIME_IPR_ID,
      requestedBy: "HBCE_API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST",
      purpose: "RATE_LIMIT_QUOTA_CONTRACT_TEST",
      legalCertification: false,
      opcBoundary: "technical proof receipt only",
    },
  });

  captured.sessionId = pickFirstString(response.json, [
    "sessionId",
    "iprSessionId",
    "id",
    "session.id",
    "data.sessionId",
    "data.iprSessionId",
    "session.sessionId",
    "iprSession.sessionId",
  ]);

  const ok = response.status >= 200 && response.status < 300 && response.jsonReady;

  record({
    name: "ipr session create",
    critical: true,
    ok,
    status: ok ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail: captured.sessionId
      ? "session created; sessionId captured but not printed"
      : summarizeResponse(response, ["HBCE_IPR_SESSION_READY", "session", "legalCertification"]),
  });
}

async function checkAuthenticatedChatContract() {
  const response = await request("POST", "/api/v1/chat", {
    auth: true,
    body: buildChatBody({
      sessionId: captured.sessionId,
      message:
        "HBCE API v1 rate limit quota smoke test. Return a minimal readiness confirmation with boundary intact.",
    }),
  });

  captured.evtId = pickFirstString(response.json, [
    "evtId",
    "eventId",
    "responseEvt",
    "data.evtId",
    "data.responseEvt",
    "audit.evtId",
  ]);
  captured.opcId = pickFirstString(response.json, [
    "opcId",
    "opc.id",
    "data.opcId",
    "data.opc.id",
    "proof.opcId",
  ]);
  captured.auditId = pickFirstString(response.json, [
    "auditId",
    "audit.id",
    "data.auditId",
    "data.audit.id",
  ]);
  captured.usageId = pickFirstString(response.json, [
    "usageId",
    "modelUsageId",
    "data.usageId",
    "data.modelUsageId",
    "modelUsage.id",
  ]);

  const ok = response.status === 200 && response.jsonReady;
  const hintsOk = ok
    ? hasHints(response, ["legalCertification", "OPC", "technical proof receipt only"])
    : false;

  record({
    name: "authenticated chat quota contract",
    critical: true,
    ok: ok && hintsOk,
    status: ok && hintsOk ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail: summarizeResponse(response, ["legalCertification", "OPC", "COMPLETED"]),
  });
}

async function checkBoundedRateLimitProbe() {
  console.log("");
  console.log("Bounded probe");
  console.log("-------------");
  console.log(
    `Running ${PROBE_REQUESTS} request(s) against ${PROBE_ROUTE}. This is intentionally bounded.`,
  );

  const statuses = [];
  const limitSignals = [];

  for (let index = 0; index < PROBE_REQUESTS; index += 1) {
    const response = await request("GET", PROBE_ROUTE, { auth: true });
    statuses.push(response.status);

    if (isRateLimitResponse(response)) {
      limitSignals.push({
        index,
        status: response.status,
        retryAfter: pickRetryAfter(response),
        failReason: pickFirstString(response.json, ["status", "failReason", "error"]),
      });
    }

    console.log(
      `probe[${index + 1}/${PROBE_REQUESTS}] http=${response.status} rateLimitSignal=${
        isRateLimitResponse(response) ? "true" : "false"
      }`,
    );
  }

  if (limitSignals.length > 0) {
    record({
      name: "bounded rate-limit probe",
      critical: false,
      ok: true,
      status: "PASS",
      detail: `RATE_LIMIT_EXCEEDED detected; statuses=${statuses.join(",")}; retryAfter=${limitSignals
        .map((item) => item.retryAfter || "NONE")
        .join(",")}`,
    });
    return;
  }

  record({
    name: "bounded rate-limit probe",
    critical: false,
    ok: true,
    status: "PASS",
    detail: `no RATE_LIMIT_EXCEEDED within bounded probe; statuses=${statuses.join(
      ",",
    )}; quota may be above probe threshold`,
  });
}

async function optionalLookup(name, path, lookupId) {
  if (!lookupId) {
    record({
      name,
      critical: false,
      ok: true,
      status: "SKIPPED",
      detail: "no lookup id returned by authenticated chat response",
    });
    return;
  }

  const lookupPath =
    path === "/api/v1/events"
      ? `${path}?eventId=${encodeURIComponent(lookupId)}`
      : `${path}/${encodeURIComponent(lookupId)}`;

  const response = await request("GET", lookupPath, { auth: true });
  const ok = response.status >= 200 && response.status < 300;

  record({
    name,
    critical: false,
    ok: true,
    status: ok ? "PASS" : "SKIPPED",
    httpStatus: response.status,
    detail: ok
      ? "lookup returned successfully"
      : `lookup unavailable or id not accepted in this environment; ${summarizeResponse(response, [
          "status",
          "failReason",
          "legalCertification",
        ])}`,
  });
}

function buildChatBody({ sessionId, message }) {
  const text =
    message ||
    "HBCE API v1 rate limit quota smoke test. Return a minimal readiness confirmation.";

  return {
    message: text,
    prompt: text,
    messages: [
      {
        role: "user",
        content: text,
      },
    ],
    tenantId: TENANT_ID,
    tenant: TENANT_ID,
    workspaceId: WORKSPACE_ID,
    workspace: WORKSPACE_ID,
    operatorIprId: OPERATOR_IPR_ID,
    operatorIpr: OPERATOR_IPR_ID,
    humanIprId: OPERATOR_IPR_ID,
    humanIpr: OPERATOR_IPR_ID,
    runtimeIprId: RUNTIME_IPR_ID,
    runtimeIpr: RUNTIME_IPR_ID,
    sessionId: sessionId || undefined,
    iprSessionId: sessionId || undefined,
    source: "scripts/test-api-v1-rate-limit-quota.mjs",
    testMode: "API_V1_RATE_LIMIT_QUOTA_SMOKE_TEST",
    legalCertification: false,
    opcBoundary: "technical proof receipt only",
  };
}

async function request(method, path, options = {}) {
  const url = new URL(path, BASE_URL).toString();
  const headers = {
    Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    "User-Agent": "HBCE-JOKER-C2-API-v1-rate-limit-quota-smoke/1.0",
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
    const retryAfter = res.headers.get("retry-after") || "";
    const text = await res.text();
    const json = parseJson(text, contentType);

    return {
      status: res.status,
      ok: res.ok,
      contentType,
      retryAfter,
      text,
      json,
      jsonReady: json !== null,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      contentType: "",
      retryAfter: "",
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
  console.log("expectedLimitStatus=RATE_LIMIT_EXCEEDED");
  console.log("legalCertification=false");
  console.log("opcBoundary=technical proof receipt only");

  if (captured.evtId || captured.opcId || captured.auditId || captured.usageId) {
    console.log("capturedIds=true");
    console.log(`evtId=${captured.evtId ? "SET" : "NONE"}`);
    console.log(`opcId=${captured.opcId ? "SET" : "NONE"}`);
    console.log(`auditId=${captured.auditId ? "SET" : "NONE"}`);
    console.log(`usageId=${captured.usageId ? "SET" : "NONE"}`);
  }

  if (criticalFailures.length > 0) {
    console.log("\nAPI_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_FAIL");
    process.exitCode = 1;
    return;
  }

  console.log("\nAPI_V1_RATE_LIMIT_QUOTA_SMOKE_TEST_PASS");
  process.exitCode = 0;
}

function isRateLimitResponse(response) {
  if (response.status === 429) {
    return true;
  }

  const haystack = responseToText(response);
  return haystack.includes("RATE_LIMIT_EXCEEDED") || haystack.includes("TOO_MANY_REQUESTS");
}

function pickRetryAfter(response) {
  return response.retryAfter || pickFirstString(response.json, ["retryAfterSeconds", "retryAfter"]);
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

  const haystack = responseToText(response);
  return hints.some((hint) => haystack.includes(hint));
}

function responseToText(response) {
  return response.jsonReady ? JSON.stringify(redactSecrets(response.json)) : response.text || "";
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
  const withProtocol =
    candidate.startsWith("http://") || candidate.startsWith("https://")
      ? candidate
      : `https://${candidate}`;
  return withProtocol.replace(/\/+$/, "");
}

function normalizePath(raw) {
  const candidate = String(raw || DEFAULT_PROBE_ROUTE).trim();
  if (!candidate) {
    return DEFAULT_PROBE_ROUTE;
  }
  return candidate.startsWith("/") ? candidate : `/${candidate}`;
}

function positiveInteger(raw, fallback) {
  const parsed = Number.parseInt(String(raw || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function boundedInteger(raw, fallback, min, max) {
  const parsed = positiveInteger(raw, fallback);
  return Math.max(min, Math.min(max, parsed));
}

function safeErrorMessage(error) {
  if (!error) {
    return "UNKNOWN_ERROR";
  }

  if (error.name === "AbortError") {
    return `REQUEST_TIMEOUT_AFTER_${TIMEOUT_MS}MS`;
  }

  const raw = String(error.message || error);
  return API_KEY ? raw.replaceAll(API_KEY, "[REDACTED]") : raw;
}
