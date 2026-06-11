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
#   HBCE_TENANT_ID="HBCE-TENANT-SELF-PILOT" \
#   HBCE_WORKSPACE_ID="HBCE-WORKSPACE-RND" \
#   BASE_URL="https://hbce-ai-joker-c2.vercel.app" \
#   ./scripts/test-api-v1-v77.sh
#
# Boundary:
#   legalCertification=false
#   OPC is a technical proof receipt only.
#   EVT is a technical event trace only.
#   IPR is an operational identity/proof layer only.
#
# v77.4 test-script fix:
#   The positive /api/v1/chat test must first create an IPR session through
#   POST /api/v1/ipr/session, extract session.sessionId, and send that sessionId
#   in the authenticated /api/v1/chat request. Without sessionId, /api/v1/chat
#   correctly fails closed with MISSING_SESSION_ID.

BASE_URL="${BASE_URL:-https://hbce-ai-joker-c2.vercel.app}"
HBCE_API_KEY="${HBCE_API_KEY:-}"
HBCE_HUMAN_IPR="${HBCE_HUMAN_IPR:-IPR-88505FE91013DCFE97C56ED1}"
HBCE_RUNTIME_IPR="${HBCE_RUNTIME_IPR:-IPR-AI-0001}"
HBCE_TENANT_ID="${HBCE_TENANT_ID:-HBCE-TENANT-SELF-PILOT}"
HBCE_WORKSPACE_ID="${HBCE_WORKSPACE_ID:-HBCE-WORKSPACE-RND}"
HBCE_SOURCE_SET="${HBCE_SOURCE_SET:-ANTHROPIC_MYTHOS_RECURSIVE_AI_RISK}"
OUT_DIR="${OUT_DIR:-tmp/api-v1-v77-live-test}"
CURL_TIMEOUT="${CURL_TIMEOUT:-55}"

mkdir -p "${OUT_DIR}"

timestamp() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

compact_timestamp() {
  date -u +"%Y%m%d%H%M%S"
}

line() {
  printf '\n%s\n' "============================================================"
  printf '%s\n' "$1"
  printf '%s\n\n' "============================================================"
}

write_json_summary() {
  local status="$1"
  local message="$2"
  local session_id=""
  session_id="$(cat "${OUT_DIR}/ipr_session.id" 2>/dev/null || true)"

  cat > "${OUT_DIR}/summary.json" <<JSON
{
  "status": "${status}",
  "message": "${message}",
  "baseUrl": "${BASE_URL}",
  "humanIpr": "${HBCE_HUMAN_IPR}",
  "runtimeIpr": "${HBCE_RUNTIME_IPR}",
  "tenantId": "${HBCE_TENANT_ID}",
  "workspaceId": "${HBCE_WORKSPACE_ID}",
  "sourceSet": "${HBCE_SOURCE_SET}",
  "sessionId": "${session_id}",
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

extract_session_id() {
  local body_file="$1"

  sed -n 's/.*"sessionId"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "${body_file}" | head -1
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

  sed -n '1,120p' "${out}"
}

request_post_chat_without_key() {
  local name="chat_without_key"
  local out="${OUT_DIR}/${name}.http"
  local status_file="${OUT_DIR}/${name}.status"

  line "POST /api/v1/chat without API key, expected 401/403/503 fail-closed"

  local payload
  payload="$(cat <<JSON
{
  "sessionId": "NEGATIVE_TEST_NO_AUTH_SESSION_SHOULD_NOT_BE_USED",
  "humanIpr": "${HBCE_HUMAN_IPR}",
  "message": "HBCE API v1 v77 contract-only negative test. Return the API auth fail-closed boundary without creating memory.",
  "tenantId": "${HBCE_TENANT_ID}",
  "workspaceId": "${HBCE_WORKSPACE_ID}",
  "sourceSet": "${HBCE_SOURCE_SET}",
  "contractOnly": true,
  "constraints": {
    "legalCertification": false,
    "rawTextPersistence": false,
    "automaticIprMemoryWrite": false
  }
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

  sed -n '1,160p' "${out}"
}

request_post_ipr_session_with_key_context() {
  local name="ipr_session"
  local out="${OUT_DIR}/${name}.http"
  local status_file="${OUT_DIR}/${name}.status"
  local session_id_file="${OUT_DIR}/${name}.id"

  : > "${session_id_file}"

  if [[ -z "${HBCE_API_KEY}" ]]; then
    line "POST /api/v1/ipr/session skipped"
    printf 'SKIPPED: HBCE_API_KEY not provided, so authenticated session/chat test is skipped.\n' | tee "${out}"
    printf 'skipped\n' > "${status_file}"
    return 0
  fi

  line "POST /api/v1/ipr/session before authenticated chat"

  local idempotency_key="v77-ipr-session-test-$(compact_timestamp)"
  local payload
  payload="$(cat <<JSON
{
  "humanIpr": "${HBCE_HUMAN_IPR}",
  "runtimeIpr": "${HBCE_RUNTIME_IPR}",
  "tenant": "${HBCE_TENANT_ID}",
  "workspace": "${HBCE_WORKSPACE_ID}",
  "sessionIntent": "API_V1_V77_CHAT_WITH_KEY_LIVE_TEST",
  "idempotencyKey": "${idempotency_key}"
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
    -H "x-hbce-idempotency-key: ${idempotency_key}" \
    -D "${OUT_DIR}/${name}.headers" \
    -o "${OUT_DIR}/${name}.body" \
    -w "%{http_code}" \
    --data "${payload}" \
    "${BASE_URL}/api/v1/ipr/session" || true)"

  printf '%s\n' "${status_code}" > "${status_file}"

  local session_id
  session_id="$(extract_session_id "${OUT_DIR}/${name}.body" || true)"
  printf '%s\n' "${session_id}" > "${session_id_file}"

  {
    printf 'HTTP status: %s\n' "${status_code}"
    printf 'Expected: 200 and a JSON session.sessionId for authenticated /api/v1/chat.\n'
    printf 'Extracted sessionId: %s\n' "${session_id:-NO_SESSION_ID_EXTRACTED}"
    printf 'URL: %s/api/v1/ipr/session\n\n' "${BASE_URL}"
    printf '%s\n' "--- headers ---"
    cat "${OUT_DIR}/${name}.headers" || true
    printf '\n%s\n' "--- body ---"
    cat "${OUT_DIR}/${name}.body" || true
  } > "${out}"

  sed -n '1,200p' "${out}"
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

  local session_id
  session_id="$(cat "${OUT_DIR}/ipr_session.id" 2>/dev/null || true)"

  if [[ -z "${session_id}" ]]; then
    line "POST /api/v1/chat with API key blocked before curl"
    {
      printf 'BLOCKED: no sessionId extracted from POST /api/v1/ipr/session.\n'
      printf 'Expected: session.sessionId must exist before authenticated chat.\n'
    } | tee "${out}"
    printf 'missing_session\n' > "${status_file}"
    return 0
  fi

  line "POST /api/v1/chat with API key + sessionId"

  local idempotency_key="v77-chat-test-$(compact_timestamp)"
  local payload
  payload="$(cat <<JSON
{
  "sessionId": "${session_id}",
  "humanIpr": "${HBCE_HUMAN_IPR}",
  "message": "HBCE API v1 chat_with_key v77 live test. Rispondi solo: HBCE_API_V1_CHAT_WITH_KEY_READY legalCertification=false",
  "tenantId": "${HBCE_TENANT_ID}",
  "workspaceId": "${HBCE_WORKSPACE_ID}",
  "sourceSet": "${HBCE_SOURCE_SET}",
  "contractOnly": false,
  "constraints": {
    "legalCertification": false,
    "rawTextPersistence": false,
    "automaticIprMemoryWrite": false,
    "automaticSemanticMemoryWrite": false,
    "sourceProfileSaveMode": "EXPLICIT_OPERATOR_SAVE_ONLY"
  },
  "idempotencyKey": "${idempotency_key}"
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
    -H "x-hbce-idempotency-key: ${idempotency_key}" \
    -D "${OUT_DIR}/${name}.headers" \
    -o "${OUT_DIR}/${name}.body" \
    -w "%{http_code}" \
    --data "${payload}" \
    "${BASE_URL}/api/v1/chat" || true)"

  printf '%s\n' "${status_code}" > "${status_file}"

  {
    printf 'HTTP status: %s\n' "${status_code}"
    printf 'Expected: 200 when API key, sessionId, tenant/workspace scope and quota pass.\n'
    printf 'SessionId: %s\n' "${session_id}"
    printf 'URL: %s/api/v1/chat\n\n' "${BASE_URL}"
    printf '%s\n' "--- headers ---"
    cat "${OUT_DIR}/${name}.headers" || true
    printf '\n%s\n' "--- body ---"
    cat "${OUT_DIR}/${name}.body" || true
  } > "${out}"

  sed -n '1,240p' "${out}"
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

print_result_line() {
  local name="$1"
  local expected="$2"
  local failures_ref_name="$3"
  local actual
  actual="$(cat "${OUT_DIR}/${name}.status" 2>/dev/null || printf missing)"

  if check_status "${name}" "${expected}"; then
    printf 'PASS %s expected=%s actual=%s\n' "${name}" "${expected}" "${actual}"
  else
    printf 'FAIL %s expected=%s actual=%s\n' "${name}" "${expected}" "${actual}"
    eval "${failures_ref_name}=\$(( ${failures_ref_name} + 1 ))"
  fi
}

main() {
  line "HBCE API v1 v77 live test started"
  printf 'Base URL: %s\n' "${BASE_URL}"
  printf 'Output directory: %s\n' "${OUT_DIR}"
  printf 'Started at: %s\n' "$(timestamp)"
  printf 'Human IPR: %s\n' "${HBCE_HUMAN_IPR}"
  printf 'Runtime IPR: %s\n' "${HBCE_RUNTIME_IPR}"
  printf 'Tenant: %s\n' "${HBCE_TENANT_ID}"
  printf 'Workspace: %s\n' "${HBCE_WORKSPACE_ID}"
  printf 'SourceSet: %s\n' "${HBCE_SOURCE_SET}"
  printf 'Authenticated chat: %s\n' "$([[ -n "${HBCE_API_KEY}" ]] && printf 'ENABLED' || printf 'SKIPPED_NO_HBCE_API_KEY')"
  printf 'legalCertification=false\n'

  request_get "root" "/api/v1"
  request_get "health" "/api/v1/health"
  request_get "capabilities" "/api/v1/capabilities"
  request_get "self_test" "/api/v1/self-test"
  request_get "openapi" "/api/v1/openapi"

  request_post_chat_without_key
  request_post_ipr_session_with_key_context
  request_post_chat_with_key

  line "Result summary"

  local failures=0

  print_result_line "root" "2xx" failures
  print_result_line "health" "2xx" failures
  print_result_line "capabilities" "2xx" failures
  print_result_line "self_test" "2xx" failures
  print_result_line "openapi" "2xx" failures
  print_result_line "chat_without_key" "auth_fail_closed" failures

  if [[ -n "${HBCE_API_KEY}" ]]; then
    print_result_line "ipr_session" "2xx" failures

    local session_id
    session_id="$(cat "${OUT_DIR}/ipr_session.id" 2>/dev/null || true)"
    if [[ -n "${session_id}" ]]; then
      printf 'PASS ipr_session_id extracted=%s\n' "${session_id}"
    else
      printf 'FAIL ipr_session_id expected=non_empty actual=empty\n'
      failures=$((failures + 1))
    fi

    print_result_line "chat_with_key" "2xx" failures
  else
    printf 'SKIP ipr_session because HBCE_API_KEY was not provided.\n'
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
