import { createHash, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  describeDefaultHbceDatabase,
  isHbceDatabaseConfigured,
  queryHbceDatabase,
  type HbceDatabaseQueryValue,
} from "@/lib/ipr-database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type CheckStatus = "PASS" | "FAIL" | "SKIPPED";

type Check = {
  id: string;
  label: string;
  required: boolean;
  status: CheckStatus;
  durationMs: number;
  details: Record<string, unknown>;
  error: string | null;
};

type GenericRow = Record<string, unknown>;

const REVISION =
  "HBCE-RUNTIME-ATOMIC-FAILURE-INJECTION-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

const HUMAN_IPR = "IPR-HBCE-ATOMIC-SELF-TEST";
const RUNTIME_IPR = "IPR-AI-0001";
const TENANT_ID = "HBCE-TENANT-SELF-PILOT";
const WORKSPACE_ID = "HBCE-WORKSPACE-RND";
const SUBSCRIPTION_ID = "HBCE-SUBSCRIPTION-SELF-PILOT";

function nowMs(): number {
  return Date.now();
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function normalizeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_ERROR";
  }
}

function asString(value: unknown): string | null {
  if (typeof value === "string") return value;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime())
      ? null
      : value.toISOString();
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }

  return null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }

  const record = value as Record<string, unknown>;

  return `{${Object.keys(record)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableJson(record[key])}`,
    )
    .join(",")}}`;
}

function sha256(value: string): string {
  return `sha256:${createHash("sha256")
    .update(value, "utf8")
    .digest("hex")}`;
}

function createCheck(input: {
  id: string;
  label: string;
  required?: boolean;
  status: CheckStatus;
  durationMs: number;
  details?: Record<string, unknown>;
  error?: string | null;
}): Check {
  return {
    id: input.id,
    label: input.label,
    required: input.required ?? true,
    status: input.status,
    durationMs: input.durationMs,
    details: input.details ?? {},
    error: input.error ?? null,
  };
}

function skipped(
  id: string,
  label: string,
  reason: string,
): Check {
  return createCheck({
    id,
    label,
    status: "SKIPPED",
    durationMs: 0,
    details: { reason },
    error: `${id}_SKIPPED`,
  });
}

function getOrigin(request: NextRequest): string {
  const proto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");

  return host
    ? `${proto ?? "https"}://${host}`
    : request.nextUrl.origin;
}

function buildSummary(checks: Check[], durationMs: number) {
  const required = checks.filter((check) => check.required);

  return {
    totalChecks: checks.length,
    passedChecks: checks.filter((check) => check.status === "PASS").length,
    failedChecks: checks.filter((check) => check.status === "FAIL").length,
    skippedChecks: checks.filter((check) => check.status === "SKIPPED").length,
    requiredChecks: required.length,
    requiredPassed: required.filter((check) => check.status === "PASS").length,
    requiredFailed: required.filter((check) => check.status !== "PASS").length,
    durationMs,
  };
}

type AtomicIds = {
  transactionId: string;
  memoryId: string;
  evtId: string;
  proofId: string;
  auditId: string;
  usageId: string;
  sessionId: string;
  threadId: string;
};

function makeIds(
  generatedAt: string,
  mode: "SUCCESS" | "FAILURE",
): AtomicIds {
  const timestamp = generatedAt
    .replace(/\D/g, "")
    .slice(0, 14);

  const suffix = randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  const marker = mode === "SUCCESS" ? "ATOMIC" : "FAULT";

  return {
    transactionId:
      `HBCE-${marker}-${timestamp}-${suffix}`,
    memoryId:
      `MEM-${marker}-${timestamp}-${suffix}`,
    evtId:
      `EVT-${marker}-${timestamp}-${suffix}`,
    proofId:
      `OPC-${marker}-${timestamp}-${suffix}`,
    auditId:
      `AUDIT-${marker}-${timestamp}-${suffix}`,
    usageId:
      `USAGE-${marker}-${timestamp}-${suffix}`,
    sessionId:
      `HBCE-${marker}-SESSION-${randomUUID()}`,
    threadId:
      `HBCE-${marker}-THREAD-${randomUUID()}`,
  };
}

function buildPayloads(
  ids: AtomicIds,
  generatedAt: string,
) {
  const memoryPayload = {
    transactionId: ids.transactionId,
    memoryId: ids.memoryId,
    generatedAt,
    mode: "ATOMIC_TRANSACTION_SELF_TEST",
    legalCertification: false,
  };

  const memoryHash =
    sha256(stableJson(memoryPayload));

  const eventPayload = {
    transactionId: ids.transactionId,
    evtId: ids.evtId,
    memoryId: ids.memoryId,
    memoryHash,
    generatedAt,
    legalCertification: false,
  };

  const eventHash =
    sha256(stableJson(eventPayload));

  const proofPayload = {
    transactionId: ids.transactionId,
    proofId: ids.proofId,
    evtId: ids.evtId,
    memoryId: ids.memoryId,
    eventHash,
    memoryHash,
    generatedAt,
    legalCertification: false,
  };

  const proofHash =
    sha256(stableJson(proofPayload));

  const auditPayload = {
    transactionId: ids.transactionId,
    auditId: ids.auditId,
    evtId: ids.evtId,
    proofId: ids.proofId,
    memoryId: ids.memoryId,
    eventHash,
    proofHash,
    memoryHash,
    generatedAt,
    legalCertification: false,
  };

  const auditHash =
    sha256(stableJson(auditPayload));

  const usagePayload = {
    transactionId: ids.transactionId,
    usageId: ids.usageId,
    evtId: ids.evtId,
    proofId: ids.proofId,
    auditId: ids.auditId,
    provider: "LOCAL",
    model: "hbce-atomic-self-test",
    inputTokens: 128,
    outputTokens: 64,
    totalTokens: 192,
    generatedAt,
    legalCertification: false,
  };

  const usageHash =
    sha256(stableJson(usagePayload));

  const temporalCertificate = {
    status: "DUAL_TIME_SEAL_READY",
    generatedAtUtc: generatedAt,
    locality: "Torino / Italia / Europa",
    runtimeBirth: "2026-01-19T15:30:00+01:00",
    timezone: "Europe/Rome",
    legalCertification: false,
  };

  return {
    memoryPayload,
    eventPayload,
    proofPayload,
    auditPayload,
    usagePayload,
    temporalCertificate,
    memoryHash,
    eventHash,
    proofHash,
    auditHash,
    usageHash,
  };
}

function atomicInsertSql(
  injectFailure: boolean,
): string {
  return `
    WITH
    memory_insert AS (
      INSERT INTO memory_records (
        memory_id,
        memory_key_hash,
        human_ipr,
        runtime_ipr,
        session_id,
        thread_id,
        scope,
        authority,
        persistence_mode,
        memory_kind,
        memory_status,
        source_kind,
        memory_title,
        memory_summary,
        save_raw,
        save_synthesis,
        reusable_in_prompt,
        classification,
        quality,
        threshold_detected,
        semantic_terms,
        memory_hash,
        memory_chain_hash,
        temporal_certificate,
        response_utc,
        record_payload,
        legal_certification
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        'RUNTIME_ONLY',
        'SESSION_RUNTIME_ONLY',
        'DATABASE_PERSISTENT',
        'RUNTIME_MEMORY',
        'ACTIVE',
        'RUNTIME_MEMORY',
        'HBCE Atomic Transaction Self-Test',
        'Temporary root record for an atomic cross-ledger transaction.',
        false,
        true,
        false,
        'INTERNAL_TECHNICAL_TEST',
        'VERIFIED_SELF_TEST',
        false,
        '[]'::jsonb,
        $7,
        $8,
        $9::jsonb,
        $10::timestamptz,
        $11::jsonb,
        false
      )
      RETURNING memory_id, memory_hash
    ),

    evt_insert AS (
      INSERT INTO evt_records (
        evt_id,
        event_id,
        tenant_id,
        workspace_id,
        subscription_id,
        human_ipr,
        subject_ipr,
        runtime_ipr,
        session_id,
        thread_id,
        memory_id,
        event_kind,
        event_type,
        kind,
        event_family,
        cycle,
        runtime_state,
        state,
        runtime_decision,
        decision,
        policy_decision,
        risk_level,
        memory_scope,
        context_class,
        intent_class,
        project_domain,
        hbce_module,
        evt_hash,
        event_hash,
        hash,
        chain_hash,
        memory_hash,
        temporal_certificate,
        response_utc,
        operational_context,
        anchors,
        trace,
        payload,
        event_payload,
        legal_certification
      )
      SELECT
        $12,
        $12,
        $13,
        $14,
        $15,
        $3,
        $3,
        $4,
        $5,
        $6,
        memory_insert.memory_id,
        'RUNTIME_SELF_TEST',
        'ATOMIC_CROSS_LEDGER_TRANSACTION',
        'EVT_TECHNICAL_SELF_TEST',
        'UP-EVT',
        'UP-CANONICO',
        'READY',
        'VERIFIED',
        'ALLOW',
        'ALLOW',
        'ALLOW',
        'LOW',
        'RUNTIME_ONLY',
        'TECHNICAL_DIAGNOSTIC',
        'RUNTIME_SELF_TEST',
        'HBCE_RUNTIME',
        'EVT',
        $16,
        $16,
        $16,
        $17,
        memory_insert.memory_hash,
        $9::jsonb,
        $10::timestamptz,
        $18::jsonb,
        $19::jsonb,
        $20::jsonb,
        $21::jsonb,
        $21::jsonb,
        false
      FROM memory_insert
      RETURNING evt_id, event_hash, memory_id
    ),

    opc_insert AS (
      INSERT INTO opc_proofs (
        proof_id,
        id,
        evt_id,
        event_id,
        tenant_id,
        workspace_id,
        subscription_id,
        human_ipr,
        subject_ipr,
        runtime_ipr,
        session_id,
        thread_id,
        memory_id,
        kind,
        proof_kind,
        receipt_type,
        persistence_mode,
        persistence_status,
        event_hash,
        evt_hash,
        memory_hash,
        chain_hash,
        verification_status,
        runtime_state,
        runtime_decision,
        risk_class,
        policy_reference,
        project_domain,
        hbce_module,
        temporal_certificate,
        response_utc,
        operational_context,
        identity,
        engine,
        event,
        memory,
        runtime,
        proof,
        audit,
        verification,
        boundary,
        payload,
        proof_payload,
        legal_certification
      )
      SELECT
        $22,
        $22,
        evt_insert.evt_id,
        evt_insert.evt_id,
        $13,
        $14,
        $15,
        $3,
        $3,
        $4,
        $5,
        $6,
        evt_insert.memory_id,
        'RUNTIME_SELF_TEST',
        'ATOMIC_CROSS_LEDGER_TRANSACTION',
        'OPC_TECHNICAL_PROOF_RECEIPT',
        'DATABASE_PERSISTENT',
        'PERSISTED',
        evt_insert.event_hash,
        evt_insert.event_hash,
        $7,
        $23,
        'VERIFIABLE',
        'READY',
        'ALLOW',
        'LOW',
        $24,
        'HBCE_RUNTIME',
        'OPC',
        $9::jsonb,
        $10::timestamptz,
        $25::jsonb,
        $26::jsonb,
        $27::jsonb,
        $28::jsonb,
        $29::jsonb,
        $30::jsonb,
        $31::jsonb,
        $32::jsonb,
        $33::jsonb,
        $34::jsonb,
        $35::jsonb,
        $36::jsonb,
        $36::jsonb,
        false
      FROM evt_insert
      RETURNING proof_id, evt_id, memory_id
    ),

    audit_insert AS (
      INSERT INTO runtime_audit_logs (
        audit_id,
        source,
        request_id,
        tenant_id,
        workspace_id,
        subscription_id,
        human_ipr,
        runtime_ipr,
        session_id,
        thread_id,
        evt_id,
        evt_ref,
        evt_hash,
        opc_proof_id,
        opc_ref,
        opc_proof_hash,
        memory_id,
        memory_ref,
        memory_hash,
        audit_kind,
        runtime_state,
        runtime_decision,
        audit_state,
        risk_level,
        project_domain,
        hbce_module,
        access_decision,
        blocked,
        allowed,
        fail_closed,
        persistence_mode,
        evt_required,
        opc_required,
        audit_required,
        temporal_certificate,
        response_utc,
        audit_hash,
        reason,
        payload,
        audit_payload,
        legal_certification
      )
      SELECT
        $37,
        $24,
        $38,
        $13,
        $14,
        $15,
        $3,
        $4,
        $5,
        $6,
        opc_insert.evt_id,
        opc_insert.evt_id,
        $16,
        opc_insert.proof_id,
        opc_insert.proof_id,
        $39,
        opc_insert.memory_id,
        opc_insert.memory_id,
        $7,
        'RUNTIME_SELF_TEST',
        'READY',
        'ALLOW',
        'PERSISTED',
        'LOW',
        'HBCE_RUNTIME',
        'AUDIT',
        'ALLOW',
        false,
        true,
        false,
        'DATABASE_PERSISTENT',
        true,
        true,
        true,
        $9::jsonb,
        $10::timestamptz,
        $40,
        'HBCE atomic transaction self-test',
        $41::jsonb,
        $41::jsonb,
        false
      FROM opc_insert
      RETURNING audit_id, evt_id, opc_proof_id, memory_id
    ),

    usage_insert AS (
      INSERT INTO model_usage (
        usage_id,
        source,
        provider,
        tenant_id,
        workspace_id,
        subscription_id,
        human_ipr,
        runtime_ipr,
        session_id,
        thread_id,
        request_id,
        evt_id,
        evt_ref,
        evt_hash,
        opc_proof_id,
        opc_ref,
        opc_proof_hash,
        audit_id,
        selected_model,
        model,
        model_level,
        model_routing_reason,
        routing_reason,
        saas_tier,
        risk_level,
        runtime_decision,
        audit_state,
        operational_value,
        cyber_relevance,
        c2_boundary,
        proof_requirement,
        evt_required,
        opc_required,
        audit_required,
        input_tokens,
        output_tokens,
        total_tokens,
        cached_input_tokens,
        reasoning_tokens,
        estimated_cost_units,
        estimated_cost_minor,
        currency,
        accounting_mode,
        blocked,
        allowed,
        fail_closed,
        persistence_mode,
        temporal_certificate,
        response_utc,
        usage_hash,
        reason,
        payload,
        usage_payload,
        legal_certification
      )
      SELECT
        $42,
        $24,
        'LOCAL',
        $13,
        $14,
        $15,
        $3,
        $4,
        $5,
        $6,
        $38,
        audit_insert.evt_id,
        audit_insert.evt_id,
        $16,
        audit_insert.opc_proof_id,
        audit_insert.opc_proof_id,
        $39,
        audit_insert.audit_id,
        'hbce-atomic-self-test',
        'hbce-atomic-self-test',
        'STANDARD',
        'TECHNICAL_SELF_TEST',
        'TECHNICAL_SELF_TEST',
        'IPR',
        'LOW',
        'ALLOW',
        'PERSISTED',
        'TECHNICAL_VALIDATION',
        'LOW',
        'TECHNICAL_RUNTIME_TEST_ONLY',
        'EVT_OPC_AUDIT_REQUIRED',
        true,
        true,
        true,
        128,
        64,
        192,
        0,
        0,
        0,
        0,
        'EUR',
        'TECHNICAL_SELF_TEST',
        false,
        true,
        false,
        'DATABASE_PERSISTENT',
        $9::jsonb,
        $10::timestamptz,
        $43,
        'HBCE atomic transaction self-test',
        $44::jsonb,
        $44::jsonb,
        false
      FROM audit_insert
      RETURNING
        usage_id,
        evt_id,
        opc_proof_id,
        audit_id
    )

    SELECT
      memory_insert.memory_id,
      evt_insert.evt_id,
      opc_insert.proof_id,
      audit_insert.audit_id,
      usage_insert.usage_id,
      ${
        injectFailure
          ? `1 / CASE
               WHEN usage_insert.usage_id = $42
               THEN 0
               ELSE 1
             END AS injected_failure`
          : `true AS atomic_insert_completed`
      }
    FROM memory_insert
    CROSS JOIN evt_insert
    CROSS JOIN opc_insert
    CROSS JOIN audit_insert
    CROSS JOIN usage_insert
  `;
}

function buildParameters(
  ids: AtomicIds,
  generatedAt: string,
): HbceDatabaseQueryValue[] {
  const payloads =
    buildPayloads(ids, generatedAt);

  const memoryChainHash = sha256(
    stableJson({
      previousHash: null,
      memoryHash: payloads.memoryHash,
      transactionId: ids.transactionId,
    }),
  );

  const eventChainHash = sha256(
    stableJson({
      previousEventId: null,
      eventHash: payloads.eventHash,
      transactionId: ids.transactionId,
    }),
  );

  const proofChainHash = sha256(
    stableJson({
      previousProofHash: null,
      proofHash: payloads.proofHash,
      transactionId: ids.transactionId,
    }),
  );

  return [
    ids.memoryId,                                             // 1
    sha256(`memory-key:${ids.memoryId}`),                     // 2
    HUMAN_IPR,                                                // 3
    RUNTIME_IPR,                                              // 4
    ids.sessionId,                                            // 5
    ids.threadId,                                             // 6
    payloads.memoryHash,                                      // 7
    memoryChainHash,                                          // 8
    stableJson(payloads.temporalCertificate),                 // 9
    generatedAt,                                              // 10
    stableJson(payloads.memoryPayload),                       // 11
    ids.evtId,                                                // 12
    TENANT_ID,                                                // 13
    WORKSPACE_ID,                                             // 14
    SUBSCRIPTION_ID,                                          // 15
    payloads.eventHash,                                       // 16
    eventChainHash,                                           // 17
    stableJson({
      transactionId: ids.transactionId,
      mode: "ATOMIC_TRANSACTION_SELF_TEST",
    }),                                                       // 18
    stableJson({
      memoryId: ids.memoryId,
      proofId: ids.proofId,
      auditId: ids.auditId,
      usageId: ids.usageId,
    }),                                                       // 19
    stableJson({
      memoryHash: payloads.memoryHash,
      eventHash: payloads.eventHash,
    }),                                                       // 20
    stableJson(payloads.eventPayload),                        // 21
    ids.proofId,                                              // 22
    proofChainHash,                                           // 23
    REVISION,                                                 // 24
    stableJson({
      transactionId: ids.transactionId,
      mode: "ATOMIC_TRANSACTION_SELF_TEST",
    }),                                                       // 25
    stableJson({
      humanIpr: HUMAN_IPR,
      runtimeIpr: RUNTIME_IPR,
    }),                                                       // 26
    stableJson({
      runtime: RUNTIME_NAME,
      revision: REVISION,
    }),                                                       // 27
    stableJson({
      evtId: ids.evtId,
      eventHash: payloads.eventHash,
    }),                                                       // 28
    stableJson({
      memoryId: ids.memoryId,
      memoryHash: payloads.memoryHash,
    }),                                                       // 29
    stableJson({
      state: "READY",
      decision: "ALLOW",
    }),                                                       // 30
    stableJson({
      ...payloads.proofPayload,
      proofHash: payloads.proofHash,
    }),                                                       // 31
    stableJson({
      auditId: ids.auditId,
      status: "NOT_CREATED",
    }),                                                       // 32
    stableJson({
      status: "VERIFIABLE",
      proofHash: payloads.proofHash,
    }),                                                       // 33
    stableJson({
      legalCertification: false,
      opcBoundary: "technical proof receipt only",
    }),                                                       // 34
    stableJson(payloads.proofPayload),                        // 35
    stableJson({
      ...payloads.proofPayload,
      proofHash: payloads.proofHash,
    }),                                                       // 36
    ids.auditId,                                              // 37
    ids.transactionId,                                        // 38
    payloads.proofHash,                                       // 39
    payloads.auditHash,                                       // 40
    stableJson({
      ...payloads.auditPayload,
      auditHash: payloads.auditHash,
    }),                                                       // 41
    ids.usageId,                                              // 42
    payloads.usageHash,                                       // 43
    stableJson({
      ...payloads.usagePayload,
      usageHash: payloads.usageHash,
    }),                                                       // 44
  ];
}

async function countDataset(
  ids: AtomicIds,
): Promise<{
  result: Awaited<
    ReturnType<typeof queryHbceDatabase<GenericRow>>
  >;
  counts: Record<string, number>;
  total: number;
}> {
  const result =
    await queryHbceDatabase<GenericRow>(
      `
        SELECT
          (
            SELECT COUNT(*)::int
            FROM memory_records
            WHERE memory_id = $1
          ) AS memory_count,

          (
            SELECT COUNT(*)::int
            FROM evt_records
            WHERE evt_id = $2
          ) AS evt_count,

          (
            SELECT COUNT(*)::int
            FROM opc_proofs
            WHERE proof_id = $3
          ) AS opc_count,

          (
            SELECT COUNT(*)::int
            FROM runtime_audit_logs
            WHERE audit_id = $4
          ) AS audit_count,

          (
            SELECT COUNT(*)::int
            FROM model_usage
            WHERE usage_id = $5
          ) AS usage_count
      `,
      [
        ids.memoryId,
        ids.evtId,
        ids.proofId,
        ids.auditId,
        ids.usageId,
      ],
    );

  const row = result.rows[0] ?? {};

  const counts = {
    memory:
      asNumber(row.memory_count) ?? -1,
    evt:
      asNumber(row.evt_count) ?? -1,
    opc:
      asNumber(row.opc_count) ?? -1,
    audit:
      asNumber(row.audit_count) ?? -1,
    usage:
      asNumber(row.usage_count) ?? -1,
  };

  return {
    result,
    counts,
    total:
      counts.memory +
      counts.evt +
      counts.opc +
      counts.audit +
      counts.usage,
  };
}

async function cleanupSuccessDataset(
  ids: AtomicIds,
): Promise<
  Awaited<ReturnType<typeof queryHbceDatabase<GenericRow>>>
> {
  return queryHbceDatabase<GenericRow>(
    `
      WITH
      delete_usage AS (
        DELETE FROM model_usage
        WHERE usage_id = $5
        RETURNING usage_id
      ),

      delete_audit AS (
        DELETE FROM runtime_audit_logs
        WHERE audit_id = $4
        RETURNING audit_id
      ),

      delete_opc AS (
        DELETE FROM opc_proofs
        WHERE proof_id = $3
        RETURNING proof_id
      ),

      delete_evt AS (
        DELETE FROM evt_records
        WHERE evt_id = $2
        RETURNING evt_id
      ),

      delete_memory AS (
        DELETE FROM memory_records
        WHERE memory_id = $1
        RETURNING memory_id
      )

      SELECT
        (SELECT COUNT(*)::int FROM delete_usage) AS usage_deleted,
        (SELECT COUNT(*)::int FROM delete_audit) AS audit_deleted,
        (SELECT COUNT(*)::int FROM delete_opc) AS opc_deleted,
        (SELECT COUNT(*)::int FROM delete_evt) AS evt_deleted,
        (SELECT COUNT(*)::int FROM delete_memory) AS memory_deleted
    `,
    [
      ids.memoryId,
      ids.evtId,
      ids.proofId,
      ids.auditId,
      ids.usageId,
    ],
  );
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();
  const generatedAt =
    new Date().toISOString();

  const checks: Check[] = [];

  const successIds =
    makeIds(generatedAt, "SUCCESS");

  const failureIds =
    makeIds(generatedAt, "FAILURE");

  try {
    const configurationStartedAt =
      nowMs();

    const configured =
      isHbceDatabaseConfigured();

    const databaseDescription =
      describeDefaultHbceDatabase();

    checks.push(
      createCheck({
        id:
          "DATABASE_CONFIGURATION",
        label:
          "HBCE database configuration",
        status:
          configured
            ? "PASS"
            : "FAIL",
        durationMs:
          elapsedMs(
            configurationStartedAt,
          ),
        details: {
          configured,
          available:
            databaseDescription.available,
          kind:
            databaseDescription.kind,
          driver:
            databaseDescription.driver,
          mode:
            databaseDescription.mode,
          databaseUrlPresent:
            databaseDescription.databaseUrlPresent,
          schemaVersion:
            databaseDescription.schemaVersion,
          persistenceMode:
            databaseDescription.persistenceMode,
        },
        error:
          configured
            ? null
            : "DATABASE_URL_NOT_CONFIGURED",
      }),
    );

    if (!configured) {
      checks.push(
        skipped(
          "ATOMIC_SUCCESS_INSERT",
          "Execute successful atomic cross-ledger insert",
          "DATABASE_NOT_CONFIGURED",
        ),
        skipped(
          "ATOMIC_SUCCESS_VERIFY",
          "Verify successful atomic dataset",
          "DATABASE_NOT_CONFIGURED",
        ),
        skipped(
          "ATOMIC_SUCCESS_CLEANUP",
          "Delete successful atomic dataset",
          "DATABASE_NOT_CONFIGURED",
        ),
        skipped(
          "FAILURE_INJECTION_EXECUTE",
          "Execute atomic transaction with injected failure",
          "DATABASE_NOT_CONFIGURED",
        ),
        skipped(
          "FAILURE_INJECTION_ROLLBACK_VERIFY",
          "Verify native rollback after injected failure",
          "DATABASE_NOT_CONFIGURED",
        ),
      );
    } else {
      /*
       * Scenario A:
       * una singola istruzione SQL crea tutti e cinque i record.
       */
      const successStartedAt =
        nowMs();

      const successInsert =
        await queryHbceDatabase<GenericRow>(
          atomicInsertSql(false),
          buildParameters(
            successIds,
            generatedAt,
          ),
        );

      const successInsertPassed =
        successInsert.ok &&
        successInsert.rowCount === 1 &&
        asString(
          successInsert.rows[0]?.memory_id,
        ) === successIds.memoryId &&
        asString(
          successInsert.rows[0]?.evt_id,
        ) === successIds.evtId &&
        asString(
          successInsert.rows[0]?.proof_id,
        ) === successIds.proofId &&
        asString(
          successInsert.rows[0]?.audit_id,
        ) === successIds.auditId &&
        asString(
          successInsert.rows[0]?.usage_id,
        ) === successIds.usageId;

      checks.push(
        createCheck({
          id:
            "ATOMIC_SUCCESS_INSERT",
          label:
            "Execute successful atomic cross-ledger insert",
          status:
            successInsertPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(
              successStartedAt,
            ),
          details: {
            transactionId:
              successIds.transactionId,
            rowCount:
              successInsert.rowCount,
            returned:
              successInsert.rows[0] ??
              null,
            queryStatus:
              successInsert.status,
            queryDurationMs:
              successInsert.durationMs,
            sqlHash:
              successInsert.sqlHash,
            singleSqlStatement:
              true,
          },
          error:
            successInsert.error ??
            (
              successInsertPassed
                ? null
                : "ATOMIC_SUCCESS_INSERT_NOT_CONFIRMED"
            ),
        }),
      );

      const successCountStartedAt =
        nowMs();

      const successCounts =
        await countDataset(
          successIds,
        );

      const successVerifyPassed =
        successCounts.result.ok &&
        successCounts.total === 5 &&
        Object.values(
          successCounts.counts,
        ).every(
          (count) =>
            count === 1,
        );

      checks.push(
        createCheck({
          id:
            "ATOMIC_SUCCESS_VERIFY",
          label:
            "Verify successful atomic dataset",
          status:
            successVerifyPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(
              successCountStartedAt,
            ),
          details: {
            transactionId:
              successIds.transactionId,
            counts:
              successCounts.counts,
            total:
              successCounts.total,
            queryStatus:
              successCounts.result.status,
            queryDurationMs:
              successCounts.result.durationMs,
            sqlHash:
              successCounts.result.sqlHash,
          },
          error:
            successCounts.result.error ??
            (
              successVerifyPassed
                ? null
                : "ATOMIC_SUCCESS_DATASET_INCOMPLETE"
            ),
        }),
      );

      const cleanupStartedAt =
        nowMs();

      const cleanupResult =
        await cleanupSuccessDataset(
          successIds,
        );

      const cleanupRow =
        cleanupResult.rows[0] ?? {};

      const cleanupDeleted = {
        memory:
          asNumber(
            cleanupRow.memory_deleted,
          ) ?? -1,
        evt:
          asNumber(
            cleanupRow.evt_deleted,
          ) ?? -1,
        opc:
          asNumber(
            cleanupRow.opc_deleted,
          ) ?? -1,
        audit:
          asNumber(
            cleanupRow.audit_deleted,
          ) ?? -1,
        usage:
          asNumber(
            cleanupRow.usage_deleted,
          ) ?? -1,
      };

      const postCleanupCounts =
        await countDataset(
          successIds,
        );

      const cleanupPassed =
        cleanupResult.ok &&
        Object.values(
          cleanupDeleted,
        ).every(
          (count) =>
            count === 1,
        ) &&
        postCleanupCounts.result.ok &&
        postCleanupCounts.total === 0;

      checks.push(
        createCheck({
          id:
            "ATOMIC_SUCCESS_CLEANUP",
          label:
            "Delete successful atomic dataset",
          status:
            cleanupPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(
              cleanupStartedAt,
            ),
          details: {
            transactionId:
              successIds.transactionId,
            deleted:
              cleanupDeleted,
            remaining:
              postCleanupCounts.counts,
            remainingTotal:
              postCleanupCounts.total,
            cleanupQueryStatus:
              cleanupResult.status,
            cleanupSqlHash:
              cleanupResult.sqlHash,
          },
          error:
            cleanupResult.error ??
            postCleanupCounts.result.error ??
            (
              cleanupPassed
                ? null
                : "ATOMIC_SUCCESS_CLEANUP_FAILED"
            ),
        }),
      );

      /*
       * Scenario B:
       * la stessa singola istruzione inserisce i cinque record,
       * poi genera intenzionalmente division_by_zero.
       *
       * PostgreSQL deve annullare l'intera istruzione.
       */
      const faultStartedAt =
        nowMs();

      const injectedFailure =
        await queryHbceDatabase<GenericRow>(
          atomicInsertSql(true),
          buildParameters(
            failureIds,
            generatedAt,
          ),
        );

      const errorText =
        injectedFailure.error ??
        "";

      const failureObserved =
        !injectedFailure.ok &&
        (
          errorText
            .toLowerCase()
            .includes(
              "division by zero",
            ) ||
          errorText
            .toLowerCase()
            .includes(
              "division_by_zero",
            )
        );

      checks.push(
        createCheck({
          id:
            "FAILURE_INJECTION_EXECUTE",
          label:
            "Execute atomic transaction with injected failure",
          status:
            failureObserved
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(
              faultStartedAt,
            ),
          details: {
            transactionId:
              failureIds.transactionId,
            faultPoint:
              "AFTER_MODEL_USAGE_INSERT_BEFORE_STATEMENT_COMPLETION",
            expectedDatabaseError:
              "division by zero",
            queryStatus:
              injectedFailure.status,
            rowCount:
              injectedFailure.rowCount,
            queryDurationMs:
              injectedFailure.durationMs,
            sqlHash:
              injectedFailure.sqlHash,
            databaseError:
              injectedFailure.error,
            singleSqlStatement:
              true,
          },
          error:
            failureObserved
              ? null
              : injectedFailure.error ??
                "EXPECTED_FAILURE_WAS_NOT_OBSERVED",
        }),
      );

      const rollbackStartedAt =
        nowMs();

      const rollbackCounts =
        await countDataset(
          failureIds,
        );

      const rollbackPassed =
        rollbackCounts.result.ok &&
        rollbackCounts.total === 0 &&
        Object.values(
          rollbackCounts.counts,
        ).every(
          (count) =>
            count === 0,
        );

      checks.push(
        createCheck({
          id:
            "FAILURE_INJECTION_ROLLBACK_VERIFY",
          label:
            "Verify native rollback after injected failure",
          status:
            rollbackPassed
              ? "PASS"
              : "FAIL",
          durationMs:
            elapsedMs(
              rollbackStartedAt,
            ),
          details: {
            transactionId:
              failureIds.transactionId,
            counts:
              rollbackCounts.counts,
            total:
              rollbackCounts.total,
            expectedTotal:
              0,
            rollbackMechanism:
              "POSTGRESQL_SINGLE_STATEMENT_ATOMICITY",
            explicitCleanupUsed:
              false,
            queryStatus:
              rollbackCounts.result.status,
            queryDurationMs:
              rollbackCounts.result.durationMs,
            sqlHash:
              rollbackCounts.result.sqlHash,
          },
          error:
            rollbackCounts.result.error ??
            (
              rollbackPassed
                ? null
                : "NATIVE_ROLLBACK_NOT_CONFIRMED"
            ),
        }),
      );
    }
  } catch (error) {
    checks.push(
      createCheck({
        id:
          "UNHANDLED_RUNTIME_ERROR",
        label:
          "Unhandled atomic transaction self-test runtime error",
        status: "FAIL",
        durationMs:
          elapsedMs(startedAt),
        details: {
          successTransactionId:
            successIds.transactionId,
          failureTransactionId:
            failureIds.transactionId,
        },
        error:
          normalizeError(error),
      }),
    );

    /*
     * Pulizia difensiva del solo scenario SUCCESS.
     * Il dataset FAILURE non viene pulito qui:
     * deve risultare vuoto per rollback nativo.
     */
    try {
      await cleanupSuccessDataset(
        successIds,
      );
    } catch {
      // Best effort.
    }
  }

  const ok =
    !checks.some(
      (check) =>
        check.required &&
        check.status !== "PASS",
    );

  const durationMs =
    elapsedMs(startedAt);

  const firstFailure =
    checks.find(
      (check) =>
        check.required &&
        check.status !== "PASS",
    ) ?? null;

  return NextResponse.json(
    {
      ok,

      status:
        ok
          ? "HBCE_RUNTIME_ATOMIC_FAILURE_INJECTION_PASS"
          : "HBCE_RUNTIME_ATOMIC_FAILURE_INJECTION_FAIL",

      operationalStatus:
        ok ? "PASS" : "FAIL",

      revision:
        REVISION,

      generatedAt,

      product:
        PRODUCT,

      apiVersion:
        API_VERSION,

      runtime:
        RUNTIME_NAME,

      deployment: {
        origin:
          getOrigin(request),

        runtimeEnvironment:
          process.env.VERCEL_ENV ??
          process.env.NODE_ENV ??
          "unknown",

        vercelEnvironment:
          process.env.VERCEL_ENV ??
          null,

        vercelRegion:
          process.env.VERCEL_REGION ??
          process.env.AWS_REGION ??
          null,

        nodeVersion:
          process.version,
      },

      scenarios: {
        atomicSuccess: {
          transactionId:
            successIds.transactionId,

          identifiers:
            successIds,

          expected:
            "FIVE_LINKED_RECORDS_COMMITTED_BY_ONE_SQL_STATEMENT_THEN_REMOVED",
        },

        injectedFailure: {
          transactionId:
            failureIds.transactionId,

          identifiers:
            failureIds,

          faultPoint:
            "AFTER_MODEL_USAGE_INSERT_BEFORE_STATEMENT_COMPLETION",

          expected:
            "DATABASE_ERROR_AND_ZERO_PERSISTED_RECORDS_WITHOUT_EXPLICIT_CLEANUP",
        },

        firstFailure:
          firstFailure
            ? {
                id:
                  firstFailure.id,
                error:
                  firstFailure.error,
              }
            : null,
      },

      summary:
        buildSummary(
          checks,
          durationMs,
        ),

      checks,

      interpretation: {
        databaseConfigured:
          checks.find(
            (check) =>
              check.id ===
              "DATABASE_CONFIGURATION",
          )?.status === "PASS",

        successfulAtomicStatementCommitted:
          checks.find(
            (check) =>
              check.id ===
              "ATOMIC_SUCCESS_INSERT",
          )?.status === "PASS",

        successfulAtomicDatasetVerified:
          checks.find(
            (check) =>
              check.id ===
              "ATOMIC_SUCCESS_VERIFY",
          )?.status === "PASS",

        successfulDatasetRemoved:
          checks.find(
            (check) =>
              check.id ===
              "ATOMIC_SUCCESS_CLEANUP",
          )?.status === "PASS",

        injectedFailureObserved:
          checks.find(
            (check) =>
              check.id ===
              "FAILURE_INJECTION_EXECUTE",
          )?.status === "PASS",

        nativeRollbackVerified:
          checks.find(
            (check) =>
              check.id ===
              "FAILURE_INJECTION_ROLLBACK_VERIFY",
          )?.status === "PASS",

        atomicTransactionAndFailureInjectionPassed:
          ok,
      },

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        performsDirectDatabaseMutation:
          true,

        successfulScenarioUsesSingleSqlStatement:
          true,

        failureScenarioUsesSingleSqlStatement:
          true,

        failureInjection:
          "POSTGRESQL_DIVISION_BY_ZERO_AFTER_ALL_DATA_MODIFYING_CTES",

        rollbackMechanism:
          "POSTGRESQL_SINGLE_STATEMENT_ATOMICITY",

        explicitCleanupUsedForFailureScenario:
          false,

        explicitCleanupUsedForSuccessScenario:
          true,

        multiStatementBeginCommitTested:
          false,

        persistentConnectionRequired:
          false,

        performsRealModelCall:
          false,

        createsPersistentBusinessData:
          false,

        replacesHumanReview:
          false,

        note:
          "Level 3 proves PostgreSQL atomicity for one data-modifying SQL statement spanning Memory, EVT, OPC, Audit and Model Usage. The injected error occurs after all five modifying CTEs are referenced. Zero remaining records confirms native statement rollback. This does not yet prove a multi-statement BEGIN/COMMIT transaction over a persistent database session.",
      },
    },
    {
      status:
        ok ? 200 : 503,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",

        Pragma:
          "no-cache",

        Expires:
          "0",

        "X-HBCE-Atomic-Test-Revision":
          REVISION,

        "X-HBCE-Atomic-Test-Status":
          ok ? "PASS" : "FAIL",

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}

export async function GET(
  request: NextRequest,
): Promise<NextResponse> {
  return NextResponse.json(
    {
      ok: true,

      status:
        "HBCE_RUNTIME_ATOMIC_FAILURE_INJECTION_SELF_TEST_READY",

      revision:
        REVISION,

      endpoint:
        `${getOrigin(
          request,
        )}/api/v1/runtime/atomic-failure/self-test`,

      executionMethod:
        "POST",

      description:
        "Esegue una catena cross-ledger atomica in una singola istruzione PostgreSQL e una seconda catena con errore intenzionale dopo i cinque inserimenti, verificando rollback nativo e zero residui.",

      scenarios: [
        {
          id:
            "ATOMIC_SUCCESS",

          expected:
            "Five linked records are committed by one SQL statement, verified, then explicitly removed.",
        },

        {
          id:
            "INJECTED_FAILURE",

          fault:
            "Division by zero after all five data-modifying CTEs.",

          expected:
            "The statement fails and PostgreSQL leaves zero records without explicit cleanup.",
        },
      ],

      warning:
        "GET non esegue il test. POST effettua scritture temporanee dirette e provoca intenzionalmente un errore PostgreSQL controllato.",

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        successfulScenarioUsesSingleSqlStatement:
          true,

        failureScenarioUsesSingleSqlStatement:
          true,

        rollbackMechanism:
          "POSTGRESQL_SINGLE_STATEMENT_ATOMICITY",

        multiStatementBeginCommitTested:
          false,

        performsRealModelCall:
          false,

        createsPersistentBusinessData:
          false,
      },
    },
    {
      status:
        200,

      headers: {
        "Cache-Control":
          "no-store",

        "X-HBCE-Atomic-Test-Revision":
          REVISION,

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
