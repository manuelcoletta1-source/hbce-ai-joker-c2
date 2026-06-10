#!/usr/bin/env bash
set -euo pipefail

# HBCE IPR Runtime API v1 — v77 live contract test
# Target repo path: scripts/test-api-v1-v77.sh
#
# Usage:
#   chmod +x scripts/test-api-v1-v77.sh
#   BASE_URL="https://hbce-ai-joker-c2.vercel.app" ./scripts/test-api-v1-v77.sh
#
# Optional authenticated chat test:
#   HBCE_API_KEY="hbce_pilot_..." \
#   HBCE_TENANT_ID="HBCE-TENANT-CLIENT-CODE-PILOT" \
#   HBCE_WORKSPACE_ID="HBCE-WORKSPACE-AI-AUDIT-TRAIL" \
#   BASE_URL="https://hbce-ai-joker-c2.vercel.app" \
#   ./scripts/test-api-v1-v77.sh
#
# Boundary:
#   legalCertification=false
#   OPC is a technical proof receipt only.
#   EVT is a technical event trace only.
#   IPR is an operational identity/proof layer only.

BASE_URL="${BASE_URL:-https://hbce-ai-joker-c2.vercel.app}"
HBCE_API_KEY="${HBCE_API_KEY:-}"
HBCE_TENANT_ID="${HBCE_TENANT_ID:-HBCE-TENANT-CLIENT-CODE-PILOT}"
HBCE_WORKSPACE_ID="${HBCE_WORKSPACE_ID:-HBCE-WORKSPACE-AI-AUDIT-TRAIL}"
HBCE_SOURCE_SET="${HBCE_SOURCE_SET:-ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK}"
OUT_DIR="${OUT_DIR:-tmp/api-v1-v77-live-test}"
CURL_TIMEOUT="${CURL_TIMEOUT:-35}"

mkdir -p "${OUT_DIR}"

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

line() {
  printf '\n%s\n' "============================================================"
  printf '%s\n' "$1"
  printf '%s\n\n' "============================================================"
}

write_json_summary() {
  local status="$1"
  local message="$2"
  cat > "${OUT_DIR}/summary.json" <<JSON
{
  "status": "${status}",
  "message": "${message}",
  "baseUrl": "${BASE_URL}",
  "tenantId": "${HBCE_TENANT_ID}",
  "workspaceId": "${HBCE_WORKSPACE_ID}",
  "sourceSet": "${HBCE_SOURCE_SET}",
  "testedAt": "$(timestamp)",
  "legalCertification": false,
  "boundary": {
    "opc": "technical proof receipt only",
    "evt": "technical event trace only",
    "ipr": "operational identity/proof layer only"
  }
}
JSON
}

request_get() {
  local name="$1"
  local path="$2"
  local out="${OUT_DIR}/${name}.http"
  local status_file="${OUT_DIR}/${name}.status"

  line "GET ${path}"

  local status_code
  status_code="$(curl -sS \
    --max-time "${CURL_TIMEOUT}" \
    -D "${OUT_DIR}/${name}.headers" \
    -o "${OUT_DIR}/${name}.body" \
    -w "%{http_code}" \
    "${BASE_URL}${path}" || true)"

  printf '%s\n' "${status_code}" > "${status_file}"

  {
    printf 'HTTP status: %s\n' "${status_code}"
    printf 'URL: %s%s\n\n' "${BASE_URL}" "${path}"
    printf '%s\n' "--- headers ---"
    cat "${OUT_DIR}/${name}.headers" || true
    printf '\n%s\n' "--- body ---"
    cat "${OUT_DIR}/${name}.body" || true
  } > "${out}"

  cat "${out}" | sed -n '1,120p'
}

request_post_chat_without_key() {
  local name="chat_without_key"
  local out="${OUT_DIR}/${name}.http"
  local status_file="${OUT_DIR}/${name}.status"

  line "POST /api/v1/chat without API key, expected 401/403/503 fail-closed"

  local payload
  payload="$(cat <<JSON
{
  "message": "HBCE API v1 v77 contract-only negative test. Return the API auth fail-closed boundary without creating memory.",
  "tenantId": "${HBCE_TENANT_ID}",
  "workspaceId": "${HBCE_WORKSPACE_ID}",
  "sourceSet": "${HBCE_SOURCE_SET}",
  "contractOnly": true
}
JSON
)"

  local status_code
  status_code="$(curl -sS \
    --max-time "${CURL_TIMEOUT}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-hbce-tenant-id: ${HBCE_TENANT_ID}" \
    -H "x-hbce-workspace-id: ${HBCE_WORKSPACE_ID}" \
    -H "x-hbce-source-set: ${HBCE_SOURCE_SET}" \
    -D "${OUT_DIR}/${name}.headers" \
    -o "${OUT_DIR}/${name}.body" \
    -w "%{http_code}" \
    --data "${payload}" \
    "${BASE_URL}/api/v1/chat" || true)"

  printf '%s\n' "${status_code}" > "${status_file}"

  {
    printf 'HTTP status: %s\n' "${status_code}"
    printf 'Expected: 401/403/503 fail-closed when no API key is provided in pilot-required mode.\n'
    printf 'URL: %s/api/v1/chat\n\n' "${BASE_URL}"
    printf '%s\n' "--- headers ---"
    cat "${OUT_DIR}/${name}.headers" || true
    printf '\n%s\n' "--- body ---"
    cat "${OUT_DIR}/${name}.body" || true
  } > "${out}"

  cat "${out}" | sed -n '1,160p'
}

request_post_chat_with_key() {
  local name="chat_with_key"
  local out="${OUT_DIR}/${name}.http"
  local status_file="${OUT_DIR}/${name}.status"

  if [[ -z "${HBCE_API_KEY}" ]]; then
    line "POST /api/v1/chat with API key skipped"
    printf 'SKIPPED: HBCE_API_KEY not provided.\n' | tee "${out}"
    printf 'skipped\n' > "${status_file}"
    return 0
  fi

  line "POST /api/v1/chat with API key"

  local payload
  payload="$(cat <<JSON
{
  "message": "Run a governed AI runtime diagnostic for this tenant and show runtime identity, tenant, workspace, policy decision, EVT, OPC, audit, model usage and legal boundary. Do not create reusable memory.",
  "tenantId": "${HBCE_TENANT_ID}",
  "workspaceId": "${HBCE_WORKSPACE_ID}",
  "sourceSet": "${HBCE_SOURCE_SET}",
  "contractOnly": false
}
JSON
)"

  local status_code
  status_code="$(curl -sS \
    --max-time "${CURL_TIMEOUT}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "x-hbce-api-key: ${HBCE_API_KEY}" \
    -H "x-hbce-tenant-id: ${HBCE_TENANT_ID}" \
    -H "x-hbce-workspace-id: ${HBCE_WORKSPACE_ID}" \
    -H "x-hbce-source-set: ${HBCE_SOURCE_SET}" \
    -H "x-hbce-idempotency-key: v77-chat-test-$(date -u +%Y%m%d%H%M%S)" \
    -D "${OUT_DIR}/${name}.headers" \
    -o "${OUT_DIR}/${name}.body" \
    -w "%{http_code}" \
    --data "${payload}" \
    "${BASE_URL}/api/v1/chat" || true)"

  printf '%s\n' "${status_code}" > "${status_file}"

  {
    printf 'HTTP status: %s\n' "${status_code}"
    printf 'Expected: 200 when API key, tenant/workspace scope and quota pass.\n'
    printf 'URL: %s/api/v1/chat\n\n' "${BASE_URL}"
    printf '%s\n' "--- headers ---"
    cat "${OUT_DIR}/${name}.headers" || true
    printf '\n%s\n' "--- body ---"
    cat "${OUT_DIR}/${name}.body" || true
  } > "${out}"

  cat "${out}" | sed -n '1,220p'
}

check_status() {
  local name="$1"
  local expected="$2"
  local actual
  actual="$(cat "${OUT_DIR}/${name}.status" 2>/dev/null || printf 'missing')"

  if [[ "${expected}" == "2xx" ]]; then
    [[ "${actual}" =~ ^2[0-9][0-9]$ ]]
    return $?
  fi

  if [[ "${expected}" == "auth_fail_closed" ]]; then
    [[ "${actual}" == "401" || "${actual}" == "403" || "${actual}" == "503" ]]
    return $?
  fi

  [[ "${actual}" == "${expected}" ]]
}

main() {
  line "HBCE API v1 v77 live test started"
  printf 'Base URL: %s\n' "${BASE_URL}"
  printf 'Output directory: %s\n' "${OUT_DIR}"
  printf 'Started at: %s\n' "$(timestamp)"
  printf 'legalCertification=false\n'

  request_get "root" "/api/v1"
  request_get "health" "/api/v1/health"
  request_get "capabilities" "/api/v1/capabilities"
  request_get "self_test" "/api/v1/self-test"
  request_get "openapi" "/api/v1/openapi"

  request_post_chat_without_key
  request_post_chat_with_key

  line "Result summary"

  local failures=0

  for pair in \
    "root:2xx" \
    "health:2xx" \
    "capabilities:2xx" \
    "self_test:2xx" \
    "openapi:2xx" \
    "chat_without_key:auth_fail_closed"
  do
    local name="${pair%%:*}"
    local expected="${pair##*:}"
    if check_status "${name}" "${expected}"; then
      printf 'PASS %s expected=%s actual=%s\n' "${name}" "${expected}" "$(cat "${OUT_DIR}/${name}.status")"
    else
      printf 'FAIL %s expected=%s actual=%s\n' "${name}" "${expected}" "$(cat "${OUT_DIR}/${name}.status" 2>/dev/null || printf missing)"
      failures=$((failures + 1))
    fi
  done

  if [[ -n "${HBCE_API_KEY}" ]]; then
    if check_status "chat_with_key" "2xx"; then
      printf 'PASS chat_with_key expected=2xx actual=%s\n' "$(cat "${OUT_DIR}/chat_with_key.status")"
    else
      printf 'FAIL chat_with_key expected=2xx actual=%s\n' "$(cat "${OUT_DIR}/chat_with_key.status" 2>/dev/null || printf missing)"
      failures=$((failures + 1))
    fi
  else
    printf 'SKIP chat_with_key because HBCE_API_KEY was not provided.\n'
  fi

  if [[ "${failures}" -eq 0 ]]; then
    write_json_summary "API_V1_V77_LIVE_TEST_PASS" "All required v77 live contract checks passed."
    printf '\nAPI_V1_V77_LIVE_TEST_PASS\n'
    printf 'Report directory: %s\n' "${OUT_DIR}"
    exit 0
  fi

  write_json_summary "API_V1_V77_LIVE_TEST_FAIL" "${failures} required check(s) failed."
  printf '\nAPI_V1_V77_LIVE_TEST_FAIL failures=%s\n' "${failures}"
  printf 'Report directory: %s\n' "${OUT_DIR}"
  exit 1
}

main "$@"
