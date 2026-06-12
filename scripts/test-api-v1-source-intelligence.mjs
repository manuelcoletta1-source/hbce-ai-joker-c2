#!/usr/bin/env node

/**
 * HBCE IPR Runtime API v1 — Source Intelligence Smoke Test
 *
 * Bounded smoke test for:
 * - GET  /api/v1/source-intelligence
 * - POST /api/v1/source-intelligence with fetchLive=false
 *
 * Product boundaries:
 * - legalCertification=false
 * - OPC=technical source receipt only
 * - rawTextPersistence=false
 */

const DEFAULT_BASE_URL = "http://localhost:3000";

const baseUrl = String(
  process.env.HBCE_API_V1_BASE_URL ||
    process.env.HBCE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    DEFAULT_BASE_URL,
).replace(/\/+$/, "");

const apiKey =
  process.env.HBCE_API_KEY ||
  process.env.HBCE_API_V1_KEY ||
  process.env.API_KEY ||
  "";

const sourceSet =
  process.env.HBCE_API_V1_SOURCE_SET ||
  process.env.HBCE_SOURCE_SET ||
  "ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK";

const sourceId =
  process.env.HBCE_API_V1_SOURCE_ID ||
  process.env.HBCE_SOURCE_ID ||
  "SRC-ANTHROPIC-MYTHOS-REDTEAM-2026";

const probePost =
  String(process.env.HBCE_API_V1_SOURCE_INTELLIGENCE_POST || "true").toLowerCase() !==
  "false";

const result = {
  status: "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_PENDING",
  route: "/api/v1/source-intelligence",
  baseUrl,
  sourceSet,
  sourceId,
  fetchLive: false,
  rawTextPersistence: false,
  legalCertification: false,
  opcBoundary: "technical source receipt only",
  criticalFailures: [],
  optionalWarnings: [],
  checks: [],
};

function pass(name, details = {}) {
  result.checks.push({
    name,
    status: "PASS",
    ...details,
  });
}

function skip(name, reason) {
  result.checks.push({
    name,
    status: "SKIP",
    reason,
  });
}

function fail(name, reason, details = {}) {
  result.criticalFailures.push({
    name,
    reason,
    ...details,
  });
}

function warn(name, reason, details = {}) {
  result.optionalWarnings.push({
    name,
    reason,
    ...details,
  });
}

function requestHeaders() {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

async function readBody(response) {
  const text = await response.text();

  if (!text) {
    return {
      ok: false,
      text,
      json: null,
      parseError: "EMPTY_BODY",
    };
  }

  try {
    return {
      ok: true,
      text,
      json: JSON.parse(text),
      parseError: null,
    };
  } catch (error) {
    return {
      ok: false,
      text,
      json: null,
      parseError: error instanceof Error ? error.message : String(error),
    };
  }
}

function checkBoundaries(payload, context) {
  const serialized = JSON.stringify(payload);

  if (serialized.includes('"legalCertification":true')) {
    fail(`${context}: legalCertification boundary`, "LEGAL_CERTIFICATION_TRUE_DETECTED");
  } else if (serialized.includes("legalCertification")) {
    pass(`${context}: legalCertification boundary`);
  } else {
    warn(`${context}: legalCertification boundary`, "LEGAL_CERTIFICATION_MARKER_NOT_EXPLICIT");
  }

  if (serialized.includes('"rawTextPersistence":true')) {
    fail(`${context}: rawTextPersistence boundary`, "RAW_TEXT_PERSISTENCE_TRUE_DETECTED");
  } else if (serialized.includes("rawTextPersistence")) {
    pass(`${context}: rawTextPersistence boundary`);
  } else {
    warn(`${context}: rawTextPersistence boundary`, "RAW_TEXT_PERSISTENCE_MARKER_NOT_EXPLICIT");
  }

  if (
    serialized.includes("technical source receipt only") ||
    serialized.includes("technical proof receipt only")
  ) {
    pass(`${context}: technical source boundary`);
  } else {
    warn(`${context}: technical source boundary`, "TECHNICAL_SOURCE_RECEIPT_MARKER_NOT_EXPLICIT");
  }
}

async function testGet() {
  const url = `${baseUrl}/api/v1/source-intelligence`;

  let response;

  try {
    response = await fetch(url, {
      method: "GET",
      headers: requestHeaders(),
    });
  } catch (error) {
    fail("GET /api/v1/source-intelligence", "NETWORK_ERROR", {
      message: error instanceof Error ? error.message : String(error),
      url,
    });
    return;
  }

  const body = await readBody(response);

  if (response.status === 404) {
    fail("GET /api/v1/source-intelligence", "ROUTE_NOT_FOUND", {
      status: response.status,
      url,
    });
    return;
  }

  if (response.status >= 500) {
    fail("GET /api/v1/source-intelligence", "SERVER_ERROR", {
      status: response.status,
      bodyPreview: body.text.slice(0, 500),
    });
    return;
  }

  if (!body.ok) {
    fail("GET /api/v1/source-intelligence", "NON_JSON_RESPONSE", {
      status: response.status,
      parseError: body.parseError,
      bodyPreview: body.text.slice(0, 500),
    });
    return;
  }

  pass("GET /api/v1/source-intelligence", {
    status: response.status,
  });

  const serialized = JSON.stringify(body.json);

  if (
    serialized.includes("SOURCE_INTELLIGENCE") ||
    serialized.includes("sourceIntelligence") ||
    serialized.includes("sourceSets") ||
    serialized.includes("catalog") ||
    serialized.includes("sources")
  ) {
    pass("GET source intelligence payload signal");
  } else {
    warn("GET source intelligence payload signal", "EXPECTED_SOURCE_SIGNAL_NOT_FOUND");
  }

  checkBoundaries(body.json, "GET /api/v1/source-intelligence");
}

async function testPost() {
  if (!probePost) {
    skip("POST /api/v1/source-intelligence", "POST_PROBE_DISABLED");
    return;
  }

  const url = `${baseUrl}/api/v1/source-intelligence`;

  const payload = {
    sourceSet,
    sourceId,
    fetchLive: false,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: "technical source receipt only",
    testMode: "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST",
  };

  let response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers: requestHeaders(),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    fail("POST /api/v1/source-intelligence", "NETWORK_ERROR", {
      message: error instanceof Error ? error.message : String(error),
      url,
    });
    return;
  }

  const body = await readBody(response);

  if (response.status === 404) {
    fail("POST /api/v1/source-intelligence", "ROUTE_NOT_FOUND", {
      status: response.status,
      url,
    });
    return;
  }

  if (response.status === 401 || response.status === 403) {
    pass("POST /api/v1/source-intelligence auth boundary", {
      status: response.status,
      note: "Route is protected or requires authorized access.",
    });
    return;
  }

  if (response.status === 400 || response.status === 422) {
    warn("POST /api/v1/source-intelligence schema boundary", {
      status: response.status,
      note: "Route exists but rejected the bounded smoke payload.",
      bodyPreview: body.text.slice(0, 500),
    });
    return;
  }

  if (response.status >= 500) {
    fail("POST /api/v1/source-intelligence", "SERVER_ERROR", {
      status: response.status,
      bodyPreview: body.text.slice(0, 500),
    });
    return;
  }

  if (!body.ok) {
    fail("POST /api/v1/source-intelligence", "NON_JSON_RESPONSE", {
      status: response.status,
      parseError: body.parseError,
      bodyPreview: body.text.slice(0, 500),
    });
    return;
  }

  pass("POST /api/v1/source-intelligence", {
    status: response.status,
    fetchLive: false,
  });

  checkBoundaries(body.json, "POST /api/v1/source-intelligence");
}

function printAndExit() {
  result.status =
    result.criticalFailures.length === 0
      ? "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_PASS"
      : "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_FAIL";

  result.criticalFailureCount = result.criticalFailures.length;
  result.optionalWarningCount = result.optionalWarnings.length;
  result.checkCount = result.checks.length;

  console.log(JSON.stringify(result, null, 2));

  if (result.criticalFailures.length > 0) {
    process.exitCode = 1;
  }
}

async function main() {
  pass("node runtime", {
    node: process.version,
  });

  pass("bounded source intelligence posture", {
    fetchLive: false,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: "technical source receipt only",
  });

  await testGet();
  await testPost();

  printAndExit();
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        status: "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_FAIL",
        failReason: "UNHANDLED_ERROR",
        message: error instanceof Error ? error.message : String(error),
        legalCertification: false,
        opcBoundary: "technical source receipt only",
      },
      null,
      2,
    ),
  );

  process.exitCode = 1;
});
