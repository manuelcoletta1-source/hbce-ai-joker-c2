cd /home/manuelcoletta1/github/hbce-ai-joker-c2 || exit 1

git pull --ff-only origin main

cat > scripts/test-api-v1-source-intelligence.mjs <<'EOF'
#!/usr/bin/env node

/**
 * HBCE IPR Runtime API v1 — Source Intelligence Smoke Test
 *
 * Purpose:
 * - Validate the API v1 Source Intelligence route surface.
 * - Check catalog/discovery behavior through GET /api/v1/source-intelligence.
 * - Optionally probe POST /api/v1/source-intelligence with fetchLive=false.
 * - Preserve product boundaries:
 *   legalCertification=false
 *   technical source receipt only
 *   rawTextPersistence=false
 *
 * This script is intentionally bounded.
 * It must not perform unrestricted crawling, scraping or live source fetching.
 */

const DEFAULT_BASE_URL = "http://localhost:3000";

const baseUrl = normalizeBaseUrl(
  process.env.HBCE_API_V1_BASE_URL ||
    process.env.HBCE_API_BASE_URL ||
    process.env.API_BASE_URL ||
    DEFAULT_BASE_URL,
);

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

const state = {
  baseUrl,
  route: "/api/v1/source-intelligence",
  criticalFailures: [],
  optionalWarnings: [],
  checks: [],
  boundary: {
    legalCertification: false,
    opcBoundary: "technical source receipt only",
    rawTextPersistence: false,
  },
};

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function markPass(name, details = {}) {
  state.checks.push({
    name,
    status: "PASS",
    ...details,
  });
}

function markSkip(name, reason) {
  state.checks.push({
    name,
    status: "SKIP",
    reason,
  });
}

function markFail(name, reason, details = {}) {
  state.criticalFailures.push({
    name,
    reason,
    ...details,
  });
}

function markWarning(name, reason, details = {}) {
  state.optionalWarnings.push({
    name,
    reason,
    ...details,
  });
}

function headers(extra = {}) {
  const result = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...extra,
  };

  if (apiKey) {
    result.Authorization = `Bearer ${apiKey}`;
  }

  return result;
}

async function readJsonSafe(response) {
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

function assertBoundaryObject(payload, context) {
  const serialized = JSON.stringify(payload);

  if (serialized.includes('"legalCertification":true')) {
    markFail(`${context}: legalCertification boundary`, "LEGAL_CERTIFICATION_TRUE_DETECTED");
    return;
  }

  if (serialized.includes("legalCertification")) {
    markPass(`${context}: legalCertification boundary present or preserved`);
  } else {
    markWarning(
      `${context}: legalCertification marker`,
      "LEGAL_CERTIFICATION_MARKER_NOT_EXPLICIT_IN_RESPONSE",
    );
  }

  if (
    serialized.includes("technical source receipt only") ||
    serialized.includes("technical proof receipt only")
  ) {
    markPass(`${context}: OPC/source technical boundary present`);
  } else {
    markWarning(
      `${context}: OPC/source technical boundary`,
      "TECHNICAL_SOURCE_RECEIPT_MARKER_NOT_EXPLICIT_IN_RESPONSE",
    );
  }

  if (serialized.includes('"rawTextPersistence":true')) {
    markFail(`${context}: rawTextPersistence boundary`, "RAW_TEXT_PERSISTENCE_TRUE_DETECTED");
    return;
  }

  if (serialized.includes("rawTextPersistence")) {
    markPass(`${context}: rawTextPersistence boundary present or preserved`);
  } else {
    markWarning(
      `${context}: rawTextPersistence marker`,
      "RAW_TEXT_PERSISTENCE_MARKER_NOT_EXPLICIT_IN_RESPONSE",
    );
  }
}

async function testGetSourceIntelligence() {
  const url = `${baseUrl}/api/v1/source-intelligence`;

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers: headers(),
    });
  } catch (error) {
    markFail("GET /api/v1/source-intelligence", "NETWORK_ERROR", {
      message: error instanceof Error ? error.message : String(error),
      url,
    });
    return;
  }

  const body = await readJsonSafe(response);

  if (response.status === 404) {
    markFail("GET /api/v1/source-intelligence", "ROUTE_NOT_FOUND", {
      status: response.status,
      url,
    });
    return;
  }

  if (response.status >= 500) {
    markFail("GET /api/v1/source-intelligence", "SERVER_ERROR", {
      status: response.status,
      url,
      body: body.text.slice(0, 500),
    });
    return;
  }

  if (!body.ok) {
    markFail("GET /api/v1/source-intelligence", "NON_JSON_RESPONSE", {
      status: response.status,
      parseError: body.parseError,
      bodyPreview: body.text.slice(0, 500),
    });
    return;
  }

  markPass("GET /api/v1/source-intelligence", {
    status: response.status,
    url,
  });

  const serialized = JSON.stringify(body.json);

  if (
    serialized.includes("SOURCE_INTELLIGENCE") ||
    serialized.includes("sourceIntelligence") ||
    serialized.includes("sourceSets") ||
    serialized.includes("catalog") ||
    serialized.includes("sources")
  ) {
    markPass("GET source intelligence payload signal");
  } else {
    markWarning("GET source intelligence payload signal", "EXPECTED_SOURCE_SIGNAL_NOT_FOUND");
  }

  assertBoundaryObject(body.json, "GET /api/v1/source-intelligence");
}

async function testPostSourceIntelligence() {
  if (!probePost) {
    markSkip("POST /api/v1/source-intelligence", "POST_PROBE_DISABLED");
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
      headers: headers(),
      body: JSON.stringify(payload),
    });
  } catch (error) {
    markFail("POST /api/v1/source-intelligence", "NETWORK_ERROR", {
      message: error instanceof Error ? error.message : String(error),
      url,
    });
    return;
  }

  const body = await readJsonSafe(response);

  if (response.status === 404) {
    markFail("POST /api/v1/source-intelligence", "ROUTE_NOT_FOUND", {
      status: response.status,
      url,
    });
    return;
  }

  if (response.status === 401 || response.status === 403) {
    markPass("POST /api/v1/source-intelligence auth boundary", {
      status: response.status,
      note: "Route is protected or requires authorized access.",
    });
    return;
  }

  if (response.status === 400 || response.status === 422) {
    markWarning("POST /api/v1/source-intelligence schema boundary", {
      status: response.status,
      note: "Route exists but rejected the bounded smoke payload.",
      bodyPreview: body.text.slice(0, 500),
    });
    return;
  }

  if (response.status >= 500) {
    markFail("POST /api/v1/source-intelligence", "SERVER_ERROR", {
      status: response.status,
      bodyPreview: body.text.slice(0, 500),
    });
    return;
  }

  if (!body.ok) {
    markFail("POST /api/v1/source-intelligence", "NON_JSON_RESPONSE", {
      status: response.status,
      parseError: body.parseError,
      bodyPreview: body.text.slice(0, 500),
    });
    return;
  }

  markPass("POST /api/v1/source-intelligence", {
    status: response.status,
    url,
    fetchLive: false,
  });

  assertBoundaryObject(body.json, "POST /api/v1/source-intelligence");
}

function printSummary() {
  const result = {
    status:
      state.criticalFailures.length === 0
        ? "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_PASS"
        : "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_FAIL",
    route: state.route,
    baseUrl: state.baseUrl,
    sourceSet,
    sourceId,
    fetchLive: false,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: "technical source receipt only",
    criticalFailures: state.criticalFailures.length,
    optionalWarnings: state.optionalWarnings.length,
    checks: state.checks.length,
    checkResults: state.checks,
    warnings: state.optionalWarnings,
    failures: state.criticalFailures,
  };

  console.log(JSON.stringify(result, null, 2));

  if (state.criticalFailures.length > 0) {
    process.exitCode = 1;
  }
}

async function main() {
  markPass("node runtime", {
    node: process.version,
  });

  markPass("bounded source intelligence posture", {
    fetchLive: false,
    rawTextPersistence: false,
    legalCertification: false,
    opcBoundary: "technical source receipt only",
  });

  await testGetSourceIntelligence();
  await testPostSourceIntelligence();

  printSummary();
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
EOF

echo
echo "=== CHECK SOURCE INTELLIGENCE SMOKE SCRIPT ==="

test -f scripts/test-api-v1-source-intelligence.mjs || {
  echo "FAIL: script mancante"
  exit 1
}

grep -n "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_PASS" scripts/test-api-v1-source-intelligence.mjs
grep -n "API_V1_SOURCE_INTELLIGENCE_SMOKE_TEST_FAIL" scripts/test-api-v1-source-intelligence.mjs
grep -n "technical source receipt only" scripts/test-api-v1-source-intelligence.mjs
grep -n "rawTextPersistence" scripts/test-api-v1-source-intelligence.mjs
grep -n "legalCertification" scripts/test-api-v1-source-intelligence.mjs
grep -n "/api/v1/source-intelligence" scripts/test-api-v1-source-intelligence.mjs

echo
echo "=== NODE CHECK SOURCE INTELLIGENCE SCRIPT ==="
node --check scripts/test-api-v1-source-intelligence.mjs

echo
echo "=== GIT STATUS ==="
git status -sb

echo
echo "=== DIFF SOURCE INTELLIGENCE SCRIPT ==="
git diff -- scripts/test-api-v1-source-intelligence.mjs | sed -n '1,260p'

echo
echo "=== SOURCE INTELLIGENCE SMOKE SCRIPT READY ==="
