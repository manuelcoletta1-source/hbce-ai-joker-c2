#!/usr/bin/env node
/*
 * HBCE / JOKER-C2 API v1 Source Intelligence smoke test.
 *
 * Purpose:
 * - validate GET /api/v1/source-intelligence and POST /api/v1/source-intelligence;
 * - preserve source-set, catalog-first, fetchLive=false, rawTextPersistence=false boundaries;
 * - verify legalCertification=false and technical source receipt only boundary;
 * - optionally link source context into POST /api/v1/chat;
 * - avoid printing API keys, bearer tokens, cookies or private identifiers.
 *
 * Node.js 18+ required for native fetch.
 */

const DEFAULT_BASE_URL = "https://hbce-ai-joker-c2.vercel.app";
const DEFAULT_TENANT_ID = "HBCE-TENANT-SELF-PILOT";
const DEFAULT_WORKSPACE_ID = "HBCE-WORKSPACE-RND";
const DEFAULT_OPERATOR_IPR_ID = "IPR-SELF-PILOT-OPERATOR";
const DEFAULT_RUNTIME_IPR_ID = "IPR-AI-0001";
const DEFAULT_SOURCE_SET = "OPENAI_AGENTIC_SYSTEMS_SECURITY";
const DEFAULT_SOURCE_ID = "openai-agentic-systems-paper";
const DEFAULT_TIMEOUT_MS = 30_000;

const PASS_MARKER = "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_PASS";
const FAIL_MARKER = "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_FAIL";
const READY_MARKER = "SOURCE_INTELLIGENCE_WORKFLOW_READY";
const LIMIT_MARKER = "RATE_LIMIT_EXCEEDED";

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
const SOURCE_SET = env.HBCE_API_V1_SOURCE_SET || env.HBCE_SOURCE_SET || DEFAULT_SOURCE_SET;
const SOURCE_ID = env.HBCE_API_V1_SOURCE_ID || env.HBCE_SOURCE_ID || DEFAULT_SOURCE_ID;
const TIMEOUT_MS = positiveInteger(env.HBCE_API_V1_TIMEOUT_MS, DEFAULT_TIMEOUT_MS);

const STRICT_AUTH =
  env.HBCE_API_V1_STRICT_AUTH === "1" ||
  env.HBCE_API_V1_STRICT_AUTH === "true";

const FETCH_LIVE =
  env.HBCE_API_V1_SOURCE_FETCH_LIVE === "1" ||
  env.HBCE_API_V1_SOURCE_FETCH_LIVE === "true";

const CHAT_LINK =
  env.HBCE_API_V1_SOURCE_CHAT_LINK === "1" ||
  env.HBCE_API_V1_SOURCE_CHAT_LINK === "true";

const results = [];
const captured = {
  sessionId: "",
  contextBlockId: "",
  summaryHash: "",
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
  checkNodeRuntime();

  await checkPublic("root discovery", "/api/v1", ["HBCE", "API", "v1"]);
  await checkPublic("health", "/api/v1/health", ["status", "revision", "legalCertification"]);
  await checkPublic("capabilities", "/api/v1/capabilities", ["capabilities", "legalCertification", "OPC"]);

  await checkSourceIntelligenceWithoutKey();

  if (!API_KEY) {
    record({
      name: "authenticated source intelligence checks",
      critical: STRICT_AUTH,
      ok: !STRICT_AUTH,
      status: STRICT_AUTH ? "FAIL" : "SKIPPED",
      detail: STRICT_AUTH
        ? "API key missing and HBCE_API_V1_STRICT_AUTH is enabled"
        : "API key missing; authenticated source intelligence checks skipped",
    });
    return finish();
  }

  await createIprSession();
  await checkSourceIntelligenceGet();
  await checkSourceIntelligencePost();

  if (CHAT_LINK) {
    await checkChatWithSourceContext();
    await optionalLookup("events lookup", "/api/v1/events", captured.evtId);
    await optionalLookup("opc lookup", "/api/v1/opc", captured.opcId);
    await optionalLookup("audit lookup", "/api/v1/audit", captured.auditId);
    await optionalLookup("model usage lookup", "/api/v1/model-usage", captured.usageId);
  } else {
    record({
      name: "chat with source context",
      critical: false,
      ok: true,
      status: "SKIPPED",
      detail:
        "disabled by default; set HBCE_API_V1_SOURCE_CHAT_LINK=1 to connect source context to POST /api/v1/chat",
    });
  }

  finish();
}

function banner() {
  console.log("HBCE / JOKER-C2 API v1 source intelligence smoke test");
  console.log("--------------------------------------------------------");
  console.log(`baseUrl=${BASE_URL}`);
  console.log(`apiKey=${API_KEY ? "SET" : "MISSING"}`);
  console.log(`tenant=${TENANT_ID}`);
  console.log(`workspace=${WORKSPACE_ID}`);
  console.log(`sourceSet=${SOURCE_SET}`);
  console.log(`sourceId=${SOURCE_ID}`);
  console.log(`fetchLive=${FETCH_LIVE ? "true" : "false"}`);
  console.log(`chatLink=${CHAT_LINK ? "true" : "false"}`);
  console.log(`timeoutMs=${TIMEOUT_MS}`);
  console.log(`strictAuth=${STRICT_AUTH ? "true" : "false"}`);
  console.log("secretPrinting=false");
  console.log("legalCertification=false");
  console.log("rawTextPersistence=false");
  console.log("opcBoundary=technical source receipt only");
  console.log("promptInjectionRisk=CHECK_REQUIRED");
  console.log("expectedLimitStatus=RATE_LIMIT_EXCEEDED");
  console.log("");
}

function checkNodeRuntime() {
  const major = Number.parseInt(process.versions.node.split(".")[0] || "0", 10);
  const ok = typeof fetch === "function" && Number.isFinite(major) && major >= 18;

  record({
    name: "node runtime",
    critical: true,
    ok,
    status: ok ? "PASS" : "FAIL",
    detail: `node=${process.versions.node}; nativeFetch=${typeof fetch === "function"}`,
  });
}

async function checkPublic(name, path, hints) {
  const response = await request("GET", path, { auth: false });
  const ok = response.status === 200 && Boolean(response.text) && hasAnyHint(response, hints);

  record({
    name,
    critical: true,
    ok,
    status: ok ? "PASS" : "FAIL",
    httpStatus: response.status,
    detail: summarize(response, hints),
  });
}

async function checkSourceIntelligenceWithoutKey() {
  const response = await request("POST", "/api/v1/source-intelligence", {
    auth: false,
    body: sourceBody(),
  });

  const failClosed = response.status === 401 || response.status === 403;
  const routeResponded = response.status > 0 && response.status !== 404 && response.status !== 405;

  record({
    name: "source intelligence without key boundary",
    critical: false,
    ok: failClosed || routeResponded,
    status: failClosed ? "PASS" : routeResponded ? "SKIPPED" : "WARN",
    httpStatus: response.status,
    detail: failClosed
      ? "unauthenticated Source Intelligence request rejected; fail-closed boundary intact"
      : summarize(response, ["SOURCE_INTELLIGENCE", "UNAUTHORIZED", "MISSING_API_KEY"]),
  });
}

async function createIprSession() {
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
      requestedBy: "HBCE_API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST",
      purpose: "SOURCE_INTELLIGENCE_CONTRACT_TEST",
      legalCertification: false,
      rawTextPersistence: false,
      opcBoundary: "technical source receipt only",
    },
  });

  captured.sessionId = pick(response.json, [
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
      : summarize(response, ["HBCE_IPR_SESSION_READY", "session", "legalCertification"]),
  });
}

async function checkSourceIntelligenceGet() {
  const query = new URLSearchParams({
    sourceSet: SOURCE_SET,
    includeProfiles: "true",
    includeContextBlock: "true",
    includeSummary: "true",
    fetchLive: FETCH_LIVE ? "true" : "false",
  });

  const response = await request("GET", `/api/v1/source-intelligence?${query.toString()}`, {
    auth: true,
  });

  captureSourceContext(response);

  const ok =
    response.status >= 200 &&
    response.status < 300 &&
    response.jsonReady &&
    hasSourceBoundary(response);

  record({
    name: "GET /api/v1/source-intelligence",
    critical: true,
    ok,
    status: ok ? "PASS" : isRateLimited(response) ? "SKIPPED" : "FAIL",
    httpStatus: response.status,
    detail: isRateLimited(response)
      ? "RATE_LIMIT_EXCEEDED returned; request blocked under quota policy"
      : summarize(response, [
          "SOURCE_INTELLIGENCE",
          "sourceSet",
          "rawTextPersistence",
          "legalCertification",
          "technical source receipt only",
        ]),
  });
}

async function checkSourceIntelligencePost() {
  const response = await request("POST", "/api/v1/source-intelligence", {
    auth: true,
    body: sourceBody(),
  });

  captureSourceContext(response);

  const ok =
    response.status >= 200 &&
    response.status < 300 &&
    response.jsonReady &&
    hasSourceBoundary(response);

  record({
    name: "POST /api/v1/source-intelligence",
    critical: true,
    ok,
    status: ok ? "PASS" : isRateLimited(response) ? "SKIPPED" : "FAIL",
    httpStatus: response.status,
    detail: isRateLimited(response)
      ? "RATE_LIMIT_EXCEEDED returned; request blocked under quota policy"
      : summarize(response, [
          "SOURCE_INTELLIGENCE",
          "sourceSet",
          "sourceIds",
          "fetchLive",
          "rawTextPersistence",
          "legalCertification",
          "promptInjectionRisk",
          "technical source receipt only",
        ]),
  });
}

async function checkChatWithSourceContext() {
  const response = await request("POST", "/api/v1/chat", {
    auth: true,
    body: chatBody(),
  });

  captured.evtId = pick(response.json, ["evtId", "eventId", "responseEvt", "data.evtId", "data.responseEvt"]);
  captured.opcId = pick(response.json, ["opcId", "opc.id", "data.opcId", "data.opc.id", "proof.opcId"]);
  captured.auditId = pick(response.json, ["auditId", "audit.id", "data.auditId", "data.audit.id"]);
  captured.usageId = pick(response.json, ["usageId", "modelUsageId", "data.usageId", "data.modelUsageId"]);

  const ok =
    response.status === 200 &&
    response.jsonReady &&
    hasAnyHint(response, ["legalCertification", "technical source receipt only", "technical proof receipt only", "OPC"]);

  record({
    name: "POST /api/v1/chat with source context",
    critical: true,
    ok,
    status: ok ? "PASS" : isRateLimited(response) ? "SKIPPED" : "FAIL",
    httpStatus: response.status,
    detail: isRateLimited(response)
      ? "RATE_LIMIT_EXCEEDED returned; chat context request blocked under quota policy"
      : summarize(response, ["legalCertification", "OPC", "technical source receipt only"]),
  });
}

async function optionalLookup(name, path, id) {
  if (!id) {
    record({
      name,
      critical: false,
      ok: true,
      status: "SKIPPED",
      detail: "no lookup id returned by chat response",
    });
    return;
  }

  const lookupPath =
    path === "/api/v1/events"
      ? `${path}?eventId=${encodeURIComponent(id)}`
      : `${path}/${encodeURIComponent(id)}`;

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
      : summarize(response, ["status", "failReason", "legalCertification"]),
  });
}

function sourceBody() {
  return {
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
    sessionId: captured.sessionId || undefined,
    iprSessionId: captured.sessionId || undefined,
    sourceSet: SOURCE_SET,
    sourceIds: [SOURCE_ID],
    fetchLive: FETCH_LIVE,
    includeProfiles: true,
    includeContextBlock: true,
    includeSummary: true,
    promptInjectionRisk: "CHECK_REQUIRED",
    requestedBy: "HBCE_API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST",
    testMode: "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST",
    legalCertification: false,
    rawTextPersistence: false,
    opcBoundary: "technical source receipt only",
  };
}

function chatBody() {
  const text =
    "Analyze the approved Source Intelligence context under API v1 boundaries. Preserve legalCertification=false, rawTextPersistence=false and technical source receipt only.";

  return {
    message: text,
    prompt: text,
    messages: [{ role: "user", content: text }],
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
    sessionId: captured.sessionId || undefined,
    iprSessionId: captured.sessionId || undefined,
    source: "scripts/test-api-v1-source-intelligence.mjs",
    testMode: "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST",
    sourceContext: {
      sourceSet: SOURCE_SET,
      sourceIds: [SOURCE_ID],
      contextBlockId: captured.contextBlockId || "NO_SOURCE_CONTEXT_BLOCK_ID",
      summaryHash: captured.summaryHash || "NO_SOURCE_SUMMARY_HASH",
      fetchLive: FETCH_LIVE,
      rawTextPersistence: false,
      legalCertification: false,
      opcBoundary: "technical source receipt only",
    },
    legalCertification: false,
    rawTextPersistence: false,
    opcBoundary: "technical source receipt only",
  };
}

async function request(method, path, options = {}) {
  const url = new URL(path, BASE_URL).toString();
  const headers = {
    Accept: "application/json, text/plain;q=0.9, */*;q=0.8",
    "User-Agent": "HBCE-JOKER-C2-API-v1-source-intelligence-smoke/1.0",
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
  if (!trimmed) return null;
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
  console.log(`sourceSet=${SOURCE_SET}`);
  console.log(`sourceId=${SOURCE_ID}`);
  console.log(`fetchLive=${FETCH_LIVE ? "true" : "false"}`);
  console.log("expectedLimitStatus=RATE_LIMIT_EXCEEDED");
  console.log("legalCertification=false");
  console.log("rawTextPersistence=false");
  console.log("opcBoundary=technical source receipt only");
  console.log("promptInjectionRisk=CHECK_REQUIRED");

  if (captured.contextBlockId || captured.summaryHash || captured.evtId || captured.opcId || captured.auditId || captured.usageId) {
    console.log("capturedIds=true");
    console.log(`sourceContextBlockId=${captured.contextBlockId ? "SET" : "NONE"}`);
    console.log(`sourceSummaryHash=${captured.summaryHash ? "SET" : "NONE"}`);
    console.log(`evtId=${captured.evtId ? "SET" : "NONE"}`);
    console.log(`opcId=${captured.opcId ? "SET" : "NONE"}`);
    console.log(`auditId=${captured.auditId ? "SET" : "NONE"}`);
    console.log(`usageId=${captured.usageId ? "SET" : "NONE"}`);
  }

  if (criticalFailures.length > 0) {
    console.log(`\n${FAIL_MARKER}`);
    process.exitCode = 1;
    return;
  }

  console.log(`\n${PASS_MARKER}`);
  console.log(READY_MARKER);
  process.exitCode = 0;
}

function captureSourceContext(response) {
  if (!response || !response.jsonReady) return;

  captured.contextBlockId =
    captured.contextBlockId ||
    pick(response.json, [
      "contextBlockId",
      "sourceContextBlockId",
      "contextBlock.id",
      "sourceContext.id",
      "data.contextBlockId",
      "data.sourceContextBlockId",
      "data.contextBlock.id",
      "result.contextBlockId",
    ]);

  captured.summaryHash =
    captured.summaryHash ||
    pick(response.json, [
      "summaryHash",
      "sourceSummaryHash",
      "summary.hash",
      "sourceSummary.hash",
      "data.summaryHash",
      "data.sourceSummaryHash",
      "data.summary.hash",
      "result.summaryHash",
    ]);
}

function hasSourceBoundary(response) {
  const text = responseText(response);
  const sourceOk =
    text.includes("sourceSet") ||
    text.includes(SOURCE_SET) ||
    text.includes("SOURCE_INTELLIGENCE") ||
    text.includes("Source Intelligence");

  const boundaryOk =
    text.includes("legalCertification") ||
    text.includes("rawTextPersistence") ||
    text.includes("technical source receipt only") ||
    text.includes("technical proof receipt only") ||
    text.includes("OPC");

  return sourceOk && boundaryOk;
}

function isRateLimited(response) {
  if (response.status === 429) return true;
  const text = responseText(response);
  return text.includes("RATE_LIMIT_EXCEEDED") || text.includes("TOO_MANY_REQUESTS");
}

function summarize(response, hints = []) {
  const status = pick(response.json, ["status", "runtimeStatus", "routeRevision", "revision", "failReason", "error"]);
  const boundary = pick(response.json, ["legalCertification", "rawTextPersistence", "opcBoundary", "boundary.opc"]);
  const preview = response.jsonReady
    ? stablePreview(redactSecrets(response.json))
    : String(response.text || "").slice(0, 260).replace(/\s+/g, " ");
  const hintText = hints.length ? ` hints=${hints.join("|")}` : "";
  const statusText = status ? ` statusHint=${status}` : "";
  const boundaryText = boundary !== "" ? ` boundary=${boundary}` : "";
  return `${statusText}${boundaryText}${hintText} preview=${preview}`.trim();
}

function hasAnyHint(response, hints = []) {
  if (!hints.length) return true;
  const text = responseText(response);
  return hints.some((hint) => text.includes(hint));
}

function responseText(response) {
  return response.jsonReady ? JSON.stringify(redactSecrets(response.json)) : response.text || "";
}

function pick(source, paths) {
  for (const path of paths) {
    const value = getPath(source, path);
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "boolean") return String(value);
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return "";
}

function getPath(source, path) {
  if (!source || typeof source !== "object") return undefined;
  let cursor = source;
  for (const part of path.split(".")) {
    if (Array.isArray(cursor) && /^\d+$/.test(part)) {
      cursor = cursor[Number.parseInt(part, 10)];
      continue;
    }
    if (!cursor || typeof cursor !== "object" || !(part in cursor)) return undefined;
    cursor = cursor[part];
  }
  return cursor;
}

function stablePreview(value) {
  try {
    return JSON.stringify(value).slice(0, 320).replace(/\s+/g, " ");
  } catch {
    return "UNSERIALIZABLE_JSON";
  }
}

function redactSecrets(value) {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (!value || typeof value !== "object") return value;

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

function positiveInteger(raw, fallback) {
  const parsed = Number.parseInt(String(raw || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function safeErrorMessage(error) {
  if (!error) return "UNKNOWN_ERROR";
  if (error.name === "AbortError") return `REQUEST_TIMEOUT_AFTER_${TIMEOUT_MS}MS`;
  const raw = String(error.message || error);
  return API_KEY ? raw.replaceAll(API_KEY, "[REDACTED]") : raw;
}
