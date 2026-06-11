#!/usr/bin/env bash

set -euo pipefail

BASE_URL="${BASE_URL:-https://hbce-ai-joker-c2.vercel.app}"
OUT_DIR="${OUT_DIR:-tmp/api-v1-public-surface-live-test}"
CURL_TIMEOUT="${CURL_TIMEOUT:-35}"

mkdir -p "${OUT_DIR}"

PASS_COUNT=0
FAIL_COUNT=0

line() {
  printf '\n%s\n' "============================================================"
  printf '%s\n' "$1"
  printf '%s\n\n' "============================================================"
}

record_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf 'PASS %s expected=%s actual=%s\n' "$1" "$2" "$3"
}

record_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf 'FAIL %s expected=%s actual=%s\n' "$1" "$2" "$3"
}

safe_name() {
  printf '%s' "$1" | tr '/{}?=&: ' '________' | tr -cd '[:alnum:]_.-'
}

request_get() {
  local name="$1"
  local path="$2"
  local expected_class="$3"

  local safe
  safe="$(safe_name "$name")"

  local headers="${OUT_DIR}/${safe}.headers"
  local body="${OUT_DIR}/${safe}.body"
  local status_file="${OUT_DIR}/${safe}.status"

  rm -f "$headers" "$body" "$status_file"

  line "GET ${path}"

  local http_status
  http_status="$(
    curl -sS \
      --max-time "${CURL_TIMEOUT}" \
      -X GET \
      -D "$headers" \
      -o "$body" \
      -w "%{http_code}" \
      "${BASE_URL}${path}" || printf "000"
  )"

  printf '%s\n' "$http_status" > "$status_file"

  printf 'HTTP status: %s\n' "$http_status"
  printf 'URL: %s%s\n' "$BASE_URL" "$path"

  printf '\n--- body preview ---\n'
  head -c 1200 "$body" 2>/dev/null || true
  printf '\n'

  case "$expected_class" in
    2xx)
      if [[ "$http_status" =~ ^2[0-9][0-9]$ ]]; then
        record_pass "$name" "2xx" "$http_status"
      else
        record_fail "$name" "2xx" "$http_status"
      fi
      ;;
    2xx_or_4xx)
      if [[ "$http_status" =~ ^2[0-9][0-9]$ || "$http_status" =~ ^4[0-9][0-9]$ ]]; then
        record_pass "$name" "2xx_or_4xx" "$http_status"
      else
        record_fail "$name" "2xx_or_4xx" "$http_status"
      fi
      ;;
    *)
      record_fail "$name" "known_expected_class" "$expected_class"
      ;;
  esac
}

line "HBCE API v1 public surface live test started"
printf 'Base URL: %s\n' "$BASE_URL"
printf 'Output directory: %s\n' "$OUT_DIR"
printf 'Started at: %s\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
printf 'legalCertification=false\n'

request_get "root" "/api/v1" "2xx"
request_get "health" "/api/v1/health" "2xx"
request_get "capabilities" "/api/v1/capabilities" "2xx"
request_get "self_test" "/api/v1/self-test" "2xx"
request_get "openapi" "/api/v1/openapi" "2xx"
request_get "ipr_session_contract" "/api/v1/ipr/session" "2xx"
request_get "ipr_session_lookup_demo" "/api/v1/ipr/session/IPR-SESSION-DEMO" "2xx_or_4xx"
request_get "chat_contract" "/api/v1/chat" "2xx"
request_get "files_contract" "/api/v1/files" "2xx"
request_get "operations_contract" "/api/v1/operations" "2xx"
request_get "operation_lookup_demo" "/api/v1/operations/OPERATION-DEMO" "2xx_or_4xx"
request_get "events_contract" "/api/v1/events" "2xx"
request_get "opc_lookup_demo" "/api/v1/opc/OPC-DEMO" "2xx_or_4xx"
request_get "audit_lookup_demo" "/api/v1/audit/AUDIT-DEMO" "2xx_or_4xx"
request_get "model_usage_lookup_demo" "/api/v1/model-usage/USAGE-DEMO" "2xx_or_4xx"
request_get "source_intelligence_contract" "/api/v1/source-intelligence" "2xx"
request_get "demo_ipr_ai_audit_trail" "/api/v1/demo/ipr-ai-audit-trail" "2xx"

line "Boundary scan"

if grep -R '"legalCertification"[[:space:]]*:[[:space:]]*true' "$OUT_DIR"/*.body >/dev/null 2>&1; then
  record_fail "legal_certification_boundary" "no_true" "true_found"
else
  record_pass "legal_certification_boundary" "no_true" "no_true_found"
fi

if grep -R "official public identity document" "$OUT_DIR"/*.body >/dev/null 2>&1; then
  record_pass "ipr_card_boundary_text" "present" "present"
else
  record_fail "ipr_card_boundary_text" "present" "missing"
fi

if grep -R "technical proof receipt only" "$OUT_DIR"/*.body >/dev/null 2>&1; then
  record_pass "opc_boundary_text" "present" "present"
else
  record_fail "opc_boundary_text" "present" "missing"
fi

line "Result summary"

printf 'PASS_COUNT=%s\n' "$PASS_COUNT"
printf 'FAIL_COUNT=%s\n' "$FAIL_COUNT"
printf 'Report directory: %s\n' "$OUT_DIR"

if [ "$FAIL_COUNT" -eq 0 ]; then
  printf '\nAPI_V1_PUBLIC_SURFACE_LIVE_TEST_PASS\n'
  exit 0
fi

printf '\nAPI_V1_PUBLIC_SURFACE_LIVE_TEST_FAIL failures=%s\n' "$FAIL_COUNT"
exit 1
