import { createHash, randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  describeHbceTransactionDatabase,
  isHbceTransactionDatabaseConfigured,
  withHbceDatabaseTransaction,
  type HbceTransactionContext,
} from "@/lib/ipr-database-transaction";

import {
  queryHbceDatabase,
} from "@/lib/ipr-database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

type CheckStatus =
  | "PASS"
  | "FAIL"
  | "SKIPPED";

type Check = {
  id: string;
  label: string;
  required: boolean;
  status: CheckStatus;
  durationMs: number;
  details: Record<string, unknown>;
  error: string | null;
};

type GenericRow =
  Record<string, unknown>;

type CountRow = {
  memory_count?: unknown;
  evt_count?: unknown;
  opc_count?: unknown;
  audit_count?: unknown;
  usage_count?: unknown;
};

type ScenarioIds = {
  operationId: string;
  memoryId: string;
  evtId: string;
  proofId: string;
  auditId: string;
  usageId: string;
  sessionId: string;
  threadId: string;
};

const REVISION =
  "HBCE-RUNTIME-MULTI-STATEMENT-TRANSACTION-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";

const RUNTIME_NAME =
  "AI_JOKER_C2_SAAS_CORE_v0_1";

const HUMAN_IPR =
  "IPR-HBCE-MULTI-STATEMENT-SELF-TEST";

const RUNTIME_IPR =
  "IPR-AI-0001";

const TENANT_ID =
  "HBCE-TENANT-SELF-PILOT";

const WORKSPACE_ID =
  "HBCE-WORKSPACE-RND";

const SUBSCRIPTION_ID =
  "HBCE-SUBSCRIPTION-SELF-PILOT";

function nowMs(): number {
  return Date.now();
}

function elapsedMs(
  startedAt: number,
): number {
  return Math.max(
    0,
    Date.now() - startedAt,
  );
}

function normalizeError(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "UNKNOWN_ERROR";
  }
}

function asString(
  value: unknown,
): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return Number.isNaN(
      value.getTime(),
    )
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

function asNumber(
  value: unknown,
): number | null {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (
    typeof value === "bigint"
  ) {
    return Number(value);
  }

  if (
    typeof value === "string"
  ) {
    const parsed =
      Number(value);

    return Number.isFinite(
      parsed,
    )
      ? parsed
      : null;
  }

  return null;
}

function stableJson(
  value: unknown,
): string {
  if (
    value === null ||
    typeof value !== "object"
  ) {
    return JSON.stringify(value);
  }

  if (
    value instanceof Date
  ) {
    return JSON.stringify(
      value.toISOString(),
    );
  }

  if (
    Array.isArray(value)
  ) {
    return `[${value
      .map(stableJson)
      .join(",")}]`;
  }

  const record =
    value as Record<
      string,
      unknown
    >;

  return `{${Object.keys(
    record,
  )
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(
          key,
        )}:${stableJson(
          record[key],
        )}`,
    )
    .join(",")}}`;
}

function sha256(
  value: string,
): string {
  return `sha256:${createHash(
    "sha256",
  )
    .update(
      value,
      "utf8",
    )
    .digest("hex")}`;
}

function createCheck(input: {
  id: string;
  label: string;
  required?: boolean;
  status: CheckStatus;
  durationMs: number;
  details?: Record<
    string,
    unknown
  >;
  error?: string | null;
}): Check {
  return {
    id: input.id,
    label: input.label,
    required:
      input.required ??
      true,
    status:
      input.status,
    durationMs:
      input.durationMs,
    details:
      input.details ??
      {},
    error:
      input.error ??
      null,
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
    details: {
      reason,
    },
    error:
      `${id}_SKIPPED`,
  });
}

function getOrigin(
  request: NextRequest,
): string {
  const proto =
    request.headers.get(
      "x-forwarded-proto",
    );

  const forwardedHost =
    request.headers.get(
      "x-forwarded-host",
    );

  const host =
    forwardedHost ??
    request.headers.get(
      "host",
    );

  return host
    ? `${proto ?? "https"}://${host}`
    : request.nextUrl.origin;
}

function buildSummary(
  checks: Check[],
  durationMs: number,
) {
  const required =
    checks.filter(
      (check) =>
        check.required,
    );

  return {
    totalChecks:
      checks.length,

    passedChecks:
      checks.filter(
        (check) =>
          check.status ===
          "PASS",
      ).length,

    failedChecks:
      checks.filter(
        (check) =>
          check.status ===
          "FAIL",
      ).length,

    skippedChecks:
      checks.filter(
        (check) =>
          check.status ===
          "SKIPPED",
      ).length,

    requiredChecks:
      required.length,

    requiredPassed:
      required.filter(
        (check) =>
          check.status ===
          "PASS",
      ).length,

    requiredFailed:
      required.filter(
        (check) =>
          check.status !==
          "PASS",
      ).length,

    durationMs,
  };
}

function createIds(
  prefix: "COMMIT" | "ROLLBACK",
  generatedAt: string,
): ScenarioIds {
  const timestamp =
    generatedAt
      .replace(/\D/g, "")
      .slice(0, 14);

  const suffix =
    randomUUID()
      .replace(/-/g, "")
      .slice(0, 8)
      .toUpperCase();

  return {
    operationId:
      `HBCE-${prefix}-${timestamp}-${suffix}`,

    memoryId:
      `MEM-${prefix}-${timestamp}-${suffix}`,

    evtId:
      `EVT-${prefix}-${timestamp}-${suffix}`,

    proofId:
      `OPC-${prefix}-${timestamp}-${suffix}`,

    auditId:
      `AUDIT-${prefix}-${timestamp}-${suffix}`,

    usageId:
      `USAGE-${prefix}-${timestamp}-${suffix}`,

    sessionId:
      `HBCE-${prefix}-SESSION-${randomUUID()}`,

    threadId:
      `HBCE-${prefix}-THREAD-${randomUUID()}`,
  };
}

function buildHashes(
  ids: ScenarioIds,
  generatedAt: string,
) {
  const memoryHash =
    sha256(
      stableJson({
        operationId:
          ids.operationId,
        memoryId:
          ids.memoryId,
        generatedAt,
      }),
    );

  const eventHash =
    sha256(
      stableJson({
        operationId:
          ids.operationId,
        evtId:
          ids.evtId,
        memoryId:
          ids.memoryId,
        memoryHash,
        generatedAt,
      }),
    );

  const proofHash =
    sha256(
      stableJson({
        operationId:
          ids.operationId,
        proofId:
          ids.proofId,
        evtId:
          ids.evtId,
        eventHash,
        generatedAt,
      }),
    );

  const auditHash =
    sha256(
      stableJson({
        operationId:
          ids.operationId,
        auditId:
          ids.auditId,
        proofId:
          ids.proofId,
        proofHash,
        generatedAt,
      }),
    );

  const usageHash =
    sha256(
      stableJson({
        operationId:
          ids.operationId,
        usageId:
          ids.usageId,
        auditId:
          ids.auditId,
        auditHash,
        generatedAt,
      }),
    );

  return {
    memoryHash,
    eventHash,
    proofHash,
    auditHash,
    usageHash,
  };
}

async function insertMemory(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  generatedAt: string,
  memoryHash: string,
): Promise<void> {
  await tx.query(
    `
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
        'HBCE Multi-Statement Transaction Self-Test',
        'Temporary root record for persistent-session transaction testing.',
        false,
        true,
        false,
        'INTERNAL_TECHNICAL_TEST',
        'VERIFIED_SELF_TEST',
        false,
        '[]'::jsonb,
        $7,
        $8,
        $9::timestamptz,
        $10::jsonb,
        false
      )
    `,
    [
      ids.memoryId,
      sha256(
        `memory-key:${ids.memoryId}`,
      ),
      HUMAN_IPR,
      RUNTIME_IPR,
      ids.sessionId,
      ids.threadId,
      memoryHash,
      sha256(
        stableJson({
          previousHash:
            null,
          memoryHash,
          operationId:
            ids.operationId,
        }),
      ),
      generatedAt,
      stableJson({
        operationId:
          ids.operationId,
        memoryId:
          ids.memoryId,
        generatedAt,
        transactionMode:
          "MULTI_STATEMENT",
        legalCertification:
          false,
      }),
    ],
  );
}

async function insertEvt(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  generatedAt: string,
  memoryHash: string,
  eventHash: string,
): Promise<void> {
  await tx.query(
    `
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
        response_utc,
        operational_context,
        anchors,
        trace,
        payload,
        event_payload,
        legal_certification
      )
      VALUES (
        $1,
        $1,
        $2,
        $3,
        $4,
        $5,
        $5,
        $6,
        $7,
        $8,
        $9,
        'RUNTIME_SELF_TEST',
        'MULTI_STATEMENT_TRANSACTION',
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
        $10,
        $10,
        $10,
        $11,
        $12,
        $13::timestamptz,
        $14::jsonb,
        $15::jsonb,
        $16::jsonb,
        $17::jsonb,
        $17::jsonb,
        false
      )
    `,
    [
      ids.evtId,
      TENANT_ID,
      WORKSPACE_ID,
      SUBSCRIPTION_ID,
      HUMAN_IPR,
      RUNTIME_IPR,
      ids.sessionId,
      ids.threadId,
      ids.memoryId,
      eventHash,
      sha256(
        stableJson({
          previousEvent:
            null,
          eventHash,
          operationId:
            ids.operationId,
        }),
      ),
      memoryHash,
      generatedAt,
      stableJson({
        operationId:
          ids.operationId,
        transactionMode:
          "MULTI_STATEMENT",
      }),
      stableJson({
        memoryId:
          ids.memoryId,
        proofId:
          ids.proofId,
        auditId:
          ids.auditId,
        usageId:
          ids.usageId,
      }),
      stableJson({
        memoryHash,
        eventHash,
      }),
      stableJson({
        operationId:
          ids.operationId,
        evtId:
          ids.evtId,
        memoryId:
          ids.memoryId,
        eventHash,
      }),
    ],
  );
}

async function insertOpc(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  generatedAt: string,
  memoryHash: string,
  eventHash: string,
  proofHash: string,
): Promise<void> {
  await tx.query(
    `
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
        previous_proof_hash,
        chain_hash,
        audit_status,
        verification_status,
        runtime_state,
        runtime_decision,
        risk_class,
        policy_reference,
        project_domain,
        hbce_module,
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
      VALUES (
        $1,
        $1,
        $2,
        $2,
        $3,
        $4,
        $5,
        $6,
        $6,
        $7,
        $8,
        $9,
        $10,
        'RUNTIME_SELF_TEST',
        'MULTI_STATEMENT_TRANSACTION',
        'OPC_TECHNICAL_PROOF_RECEIPT',
        'DATABASE_PERSISTENT',
        'PERSISTED',
        $11,
        $11,
        $12,
        NULL,
        $13,
        'NOT_CREATED',
        'VERIFIABLE',
        'READY',
        'ALLOW',
        'LOW',
        $14,
        'HBCE_RUNTIME',
        'OPC',
        $15::timestamptz,
        $16::jsonb,
        $17::jsonb,
        $18::jsonb,
        $19::jsonb,
        $20::jsonb,
        $21::jsonb,
        $22::jsonb,
        $23::jsonb,
        $24::jsonb,
        $25::jsonb,
        $26::jsonb,
        $27::jsonb,
        $27::jsonb,
        false
      )
    `,
    [
      ids.proofId,
      ids.evtId,
      TENANT_ID,
      WORKSPACE_ID,
      SUBSCRIPTION_ID,
      HUMAN_IPR,
      RUNTIME_IPR,
      ids.sessionId,
      ids.threadId,
      ids.memoryId,
      eventHash,
      memoryHash,
      sha256(
        stableJson({
          proofHash,
          eventHash,
          memoryHash,
          operationId:
            ids.operationId,
        }),
      ),
      REVISION,
      generatedAt,
      stableJson({
        operationId:
          ids.operationId,
        transactionMode:
          "MULTI_STATEMENT",
      }),
      stableJson({
        humanIpr:
          HUMAN_IPR,
        runtimeIpr:
          RUNTIME_IPR,
      }),
      stableJson({
        runtime:
          RUNTIME_NAME,
        revision:
          REVISION,
      }),
      stableJson({
        evtId:
          ids.evtId,
        eventHash,
      }),
      stableJson({
        memoryId:
          ids.memoryId,
        memoryHash,
      }),
      stableJson({
        state:
          "READY",
        decision:
          "ALLOW",
      }),
      stableJson({
        proofId:
          ids.proofId,
        proofHash,
        evtId:
          ids.evtId,
      }),
      stableJson({
        auditId:
          ids.auditId,
        status:
          "NOT_CREATED",
      }),
      stableJson({
        status:
          "VERIFIABLE",
        proofHash,
      }),
      stableJson({
        legalCertification:
          false,
        opcBoundary:
          "technical proof receipt only",
      }),
      stableJson({
        operationId:
          ids.operationId,
        proofId:
          ids.proofId,
        proofHash,
        evtId:
          ids.evtId,
        memoryId:
          ids.memoryId,
      }),
      stableJson({
        operationId:
          ids.operationId,
        proofId:
          ids.proofId,
        proofHash,
        eventHash,
        memoryHash,
      }),
    ],
  );
}

async function insertAudit(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  generatedAt: string,
  memoryHash: string,
  eventHash: string,
  proofHash: string,
  auditHash: string,
): Promise<void> {
  await tx.query(
    `
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
        response_utc,
        audit_hash,
        reason,
        payload,
        audit_payload,
        legal_certification
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $11,
        $12,
        $13,
        $13,
        $14,
        $15,
        $15,
        $16,
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
        $17::timestamptz,
        $18,
        'HBCE multi-statement transaction self-test',
        $19::jsonb,
        $19::jsonb,
        false
      )
    `,
    [
      ids.auditId,
      REVISION,
      ids.operationId,
      TENANT_ID,
      WORKSPACE_ID,
      SUBSCRIPTION_ID,
      HUMAN_IPR,
      RUNTIME_IPR,
      ids.sessionId,
      ids.threadId,
      ids.evtId,
      eventHash,
      ids.proofId,
      proofHash,
      ids.memoryId,
      memoryHash,
      generatedAt,
      auditHash,
      stableJson({
        operationId:
          ids.operationId,
        auditId:
          ids.auditId,
        evtId:
          ids.evtId,
        proofId:
          ids.proofId,
        memoryId:
          ids.memoryId,
        auditHash,
      }),
    ],
  );
}

async function insertUsage(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  generatedAt: string,
  eventHash: string,
  proofHash: string,
  auditHash: string,
  usageHash: string,
): Promise<void> {
  await tx.query(
    `
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
        response_utc,
        usage_hash,
        reason,
        payload,
        usage_payload,
        legal_certification
      )
      VALUES (
        $1,
        $2,
        'LOCAL',
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $11,
        $12,
        $13,
        $13,
        $14,
        $15,
        'hbce-multi-statement-self-test',
        'hbce-multi-statement-self-test',
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
        $16::timestamptz,
        $17,
        'HBCE multi-statement transaction self-test',
        $18::jsonb,
        $18::jsonb,
        false
      )
    `,
    [
      ids.usageId,
      REVISION,
      TENANT_ID,
      WORKSPACE_ID,
      SUBSCRIPTION_ID,
      HUMAN_IPR,
      RUNTIME_IPR,
      ids.sessionId,
      ids.threadId,
      ids.operationId,
      ids.evtId,
      eventHash,
      ids.proofId,
      proofHash,
      ids.auditId,
      generatedAt,
      usageHash,
      stableJson({
        operationId:
          ids.operationId,
        usageId:
          ids.usageId,
        evtId:
          ids.evtId,
        proofId:
          ids.proofId,
        auditId:
          ids.auditId,
        eventHash,
        proofHash,
        auditHash,
        usageHash,
        inputTokens:
          128,
        outputTokens:
          64,
        totalTokens:
          192,
      }),
    ],
  );
}

async function verifyInsideTransaction(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
): Promise<{
  counts: Record<
    string,
    number
  >;
  linked: boolean;
}> {
  const result =
    await tx.query<GenericRow>(
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
              AND memory_id = $1
          ) AS evt_count,

          (
            SELECT COUNT(*)::int
            FROM opc_proofs
            WHERE proof_id = $3
              AND evt_id = $2
              AND memory_id = $1
          ) AS opc_count,

          (
            SELECT COUNT(*)::int
            FROM runtime_audit_logs
            WHERE audit_id = $4
              AND evt_id = $2
              AND opc_proof_id = $3
              AND memory_id = $1
          ) AS audit_count,

          (
            SELECT COUNT(*)::int
            FROM model_usage
            WHERE usage_id = $5
              AND evt_id = $2
              AND opc_proof_id = $3
              AND audit_id = $4
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

  const row =
    result.rows[0] ??
    {};

  const counts = {
    memory:
      asNumber(
        row.memory_count,
      ) ?? -1,

    evt:
      asNumber(
        row.evt_count,
      ) ?? -1,

    opc:
      asNumber(
        row.opc_count,
      ) ?? -1,

    audit:
      asNumber(
        row.audit_count,
      ) ?? -1,

    usage:
      asNumber(
        row.usage_count,
      ) ?? -1,
  };

  return {
    counts,

    linked:
      Object.values(
        counts,
      ).every(
        (count) =>
          count === 1,
      ),
  };
}

async function countOutsideTransaction(
  ids: ScenarioIds,
): Promise<{
  counts: Record<
    string,
    number
  >;
  total: number;
}> {
  const result =
    await queryHbceDatabase<CountRow>(
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

  const row =
    result.rows[0] ??
    {};

  const counts = {
    memory:
      asNumber(
        row.memory_count,
      ) ?? -1,

    evt:
      asNumber(
        row.evt_count,
      ) ?? -1,

    opc:
      asNumber(
        row.opc_count,
      ) ?? -1,

    audit:
      asNumber(
        row.audit_count,
      ) ?? -1,

    usage:
      asNumber(
        row.usage_count,
      ) ?? -1,
  };

  return {
    counts,

    total:
      Object.values(
        counts,
      ).reduce(
        (
          sum,
          count,
        ) =>
          sum + count,
        0,
      ),
  };
}

async function cleanupCommittedDataset(
  ids: ScenarioIds,
): Promise<void> {
  await withHbceDatabaseTransaction(
    async (tx) => {
      await tx.query(
        `
          DELETE FROM model_usage
          WHERE usage_id = $1
        `,
        [ids.usageId],
      );

      await tx.query(
        `
          DELETE FROM runtime_audit_logs
          WHERE audit_id = $1
        `,
        [ids.auditId],
      );

      await tx.query(
        `
          DELETE FROM opc_proofs
          WHERE proof_id = $1
        `,
        [ids.proofId],
      );

      await tx.query(
        `
          DELETE FROM evt_records
          WHERE evt_id = $1
        `,
        [ids.evtId],
      );

      await tx.query(
        `
          DELETE FROM memory_records
          WHERE memory_id = $1
        `,
        [ids.memoryId],
      );
    },
  );
}

async function executeFullChain(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  generatedAt: string,
): Promise<{
  queryCount: number;
  verification: {
    counts: Record<
      string,
      number
    >;
    linked: boolean;
  };
}> {
  const hashes =
    buildHashes(
      ids,
      generatedAt,
    );

  await insertMemory(
    tx,
    ids,
    generatedAt,
    hashes.memoryHash,
  );

  await insertEvt(
    tx,
    ids,
    generatedAt,
    hashes.memoryHash,
    hashes.eventHash,
  );

  await insertOpc(
    tx,
    ids,
    generatedAt,
    hashes.memoryHash,
    hashes.eventHash,
    hashes.proofHash,
  );

  await insertAudit(
    tx,
    ids,
    generatedAt,
    hashes.memoryHash,
    hashes.eventHash,
    hashes.proofHash,
    hashes.auditHash,
  );

  await insertUsage(
    tx,
    ids,
    generatedAt,
    hashes.eventHash,
    hashes.proofHash,
    hashes.auditHash,
    hashes.usageHash,
  );

  const verification =
    await verifyInsideTransaction(
      tx,
      ids,
    );

  if (
    !verification.linked
  ) {
    throw new Error(
      "HBCE_MULTI_STATEMENT_LINK_VERIFICATION_FAILED",
    );
  }

  return {
    queryCount: 6,
    verification,
  };
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt =
    nowMs();

  const generatedAt =
    new Date().toISOString();

  const checks:
    Check[] = [];

  const commitIds =
    createIds(
      "COMMIT",
      generatedAt,
    );

  const rollbackIds =
    createIds(
      "ROLLBACK",
      generatedAt,
    );

  const configured =
    isHbceTransactionDatabaseConfigured();

  const description =
    describeHbceTransactionDatabase();

  checks.push(
    createCheck({
      id:
        "TRANSACTION_DATABASE_CONFIGURATION",

      label:
        "Persistent transaction database configuration",

      status:
        configured
          ? "PASS"
          : "FAIL",

      durationMs:
        0,

      details:
        description,

      error:
        configured
          ? null
          : "TRANSACTION_DATABASE_NOT_CONFIGURED",
    }),
  );

  if (!configured) {
    checks.push(
      skipped(
        "MULTI_STATEMENT_COMMIT",
        "Execute multi-statement transaction and commit",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),

      skipped(
        "COMMIT_VISIBILITY_VERIFY",
        "Verify committed records outside transaction",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),

      skipped(
        "COMMIT_DATASET_CLEANUP",
        "Remove committed test dataset",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),

      skipped(
        "MULTI_STATEMENT_ROLLBACK",
        "Execute multi-statement transaction and rollback",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),

      skipped(
        "ROLLBACK_VISIBILITY_VERIFY",
        "Verify rolled-back records are absent",
        "TRANSACTION_DATABASE_NOT_CONFIGURED",
      ),
    );
  } else {
    const commitStartedAt =
      nowMs();

    const commitOutcome =
      await withHbceDatabaseTransaction(
        async (tx) =>
          executeFullChain(
            tx,
            commitIds,
            generatedAt,
          ),
        {
          isolationLevel:
            "SERIALIZABLE",

          statementTimeoutMs:
            120_000,

          lockTimeoutMs:
            15_000,

          idleInTransactionSessionTimeoutMs:
            120_000,
        },
      );

    const commitPassed =
      commitOutcome.ok &&
      commitOutcome.state ===
        "COMMITTED" &&
      commitOutcome.value
        .verification.linked;

    checks.push(
      createCheck({
        id:
          "MULTI_STATEMENT_COMMIT",

        label:
          "Execute multi-statement transaction and commit",

        status:
          commitPassed
            ? "PASS"
            : "FAIL",

        durationMs:
          elapsedMs(
            commitStartedAt,
          ),

        details: {
          operationId:
            commitIds.operationId,

          transactionId:
            commitOutcome.transactionId,

          state:
            commitOutcome.state,

          durationMs:
            commitOutcome.durationMs,

          queryCount:
            commitOutcome.ok
              ? commitOutcome.value
                  .queryCount
              : null,

          insideTransactionVerification:
            commitOutcome.ok
              ? commitOutcome.value
                  .verification
              : null,

          error:
            commitOutcome.ok
              ? null
              : commitOutcome.error,

          rollbackError:
            commitOutcome.ok
              ? null
              : commitOutcome.rollbackError,
        },

        error:
          commitPassed
            ? null
            : commitOutcome.ok
              ? "MULTI_STATEMENT_COMMIT_NOT_CONFIRMED"
              : commitOutcome.error,
      }),
    );

    const commitVisibilityStartedAt =
      nowMs();

    const committedCounts =
      await countOutsideTransaction(
        commitIds,
      );

    const commitVisible =
      committedCounts.total ===
        5 &&
      Object.values(
        committedCounts.counts,
      ).every(
        (count) =>
          count === 1,
      );

    checks.push(
      createCheck({
        id:
          "COMMIT_VISIBILITY_VERIFY",

        label:
          "Verify committed records outside transaction",

        status:
          commitVisible
            ? "PASS"
            : "FAIL",

        durationMs:
          elapsedMs(
            commitVisibilityStartedAt,
          ),

        details: {
          operationId:
            commitIds.operationId,

          counts:
            committedCounts.counts,

          total:
            committedCounts.total,

          expectedTotal:
            5,
        },

        error:
          commitVisible
            ? null
            : "COMMITTED_RECORDS_NOT_VISIBLE",
      }),
    );

    const cleanupStartedAt =
      nowMs();

    await cleanupCommittedDataset(
      commitIds,
    );

    const postCleanup =
      await countOutsideTransaction(
        commitIds,
      );

    const cleanupPassed =
      postCleanup.total ===
      0;

    checks.push(
      createCheck({
        id:
          "COMMIT_DATASET_CLEANUP",

        label:
          "Remove committed test dataset",

        status:
          cleanupPassed
            ? "PASS"
            : "FAIL",

        durationMs:
          elapsedMs(
            cleanupStartedAt,
          ),

        details: {
          operationId:
            commitIds.operationId,

          remaining:
            postCleanup.counts,

          remainingTotal:
            postCleanup.total,
        },

        error:
          cleanupPassed
            ? null
            : "COMMITTED_DATASET_CLEANUP_FAILED",
      }),
    );

    const rollbackStartedAt =
      nowMs();

    const rollbackOutcome =
      await withHbceDatabaseTransaction(
        async (tx) => {
          const chain =
            await executeFullChain(
              tx,
              rollbackIds,
              generatedAt,
            );

          if (
            !chain.verification
              .linked
          ) {
            throw new Error(
              "ROLLBACK_SCENARIO_LINK_VERIFICATION_FAILED",
            );
          }

          throw new Error(
            "HBCE_CONTROLLED_FAILURE_AFTER_FIVE_LEDGER_WRITES",
          );
        },
        {
          isolationLevel:
            "SERIALIZABLE",

          statementTimeoutMs:
            120_000,

          lockTimeoutMs:
            15_000,

          idleInTransactionSessionTimeoutMs:
            120_000,
        },
      );

    const rollbackTriggered =
      !rollbackOutcome.ok &&
      rollbackOutcome.state ===
        "ROLLED_BACK" &&
      rollbackOutcome.error ===
        "HBCE_CONTROLLED_FAILURE_AFTER_FIVE_LEDGER_WRITES" &&
      rollbackOutcome.rollbackError ===
        null;

    checks.push(
      createCheck({
        id:
          "MULTI_STATEMENT_ROLLBACK",

        label:
          "Execute multi-statement transaction and rollback",

        status:
          rollbackTriggered
            ? "PASS"
            : "FAIL",

        durationMs:
          elapsedMs(
            rollbackStartedAt,
          ),

        details: {
          operationId:
            rollbackIds.operationId,

          transactionId:
            rollbackOutcome.transactionId,

          state:
            rollbackOutcome.state,

          expectedError:
            "HBCE_CONTROLLED_FAILURE_AFTER_FIVE_LEDGER_WRITES",

          actualError:
            rollbackOutcome.ok
              ? null
              : rollbackOutcome.error,

          rollbackError:
            rollbackOutcome.ok
              ? null
              : rollbackOutcome.rollbackError,

          explicitCleanupUsed:
            false,

          failurePoint:
            "AFTER_FIVE_INSERTS_AND_IN_TRANSACTION_LINK_VERIFICATION",
        },

        error:
          rollbackTriggered
            ? null
            : rollbackOutcome.ok
              ? "EXPECTED_ROLLBACK_DID_NOT_OCCUR"
              : rollbackOutcome.error,
      }),
    );

    const rollbackVisibilityStartedAt =
      nowMs();

    const rolledBackCounts =
      await countOutsideTransaction(
        rollbackIds,
      );

    const rollbackInvisible =
      rolledBackCounts.total ===
        0 &&
      Object.values(
        rolledBackCounts.counts,
      ).every(
        (count) =>
          count === 0,
      );

    checks.push(
      createCheck({
        id:
          "ROLLBACK_VISIBILITY_VERIFY",

        label:
          "Verify rolled-back records are absent",

        status:
          rollbackInvisible
            ? "PASS"
            : "FAIL",

        durationMs:
          elapsedMs(
            rollbackVisibilityStartedAt,
          ),

        details: {
          operationId:
            rollbackIds.operationId,

          counts:
            rolledBackCounts.counts,

          total:
            rolledBackCounts.total,

          expectedTotal:
            0,

          explicitCleanupUsed:
            false,
        },

        error:
          rollbackInvisible
            ? null
            : "ROLLED_BACK_RECORDS_REMAIN",
      }),
    );
  }

  const ok =
    !checks.some(
      (check) =>
        check.required &&
        check.status !==
          "PASS",
    );

  const durationMs =
    elapsedMs(startedAt);

  const firstFailure =
    checks.find(
      (check) =>
        check.required &&
        check.status !==
          "PASS",
    ) ??
    null;

  return NextResponse.json(
    {
      ok,

      status:
        ok
          ? "HBCE_RUNTIME_MULTI_STATEMENT_TRANSACTION_PASS"
          : "HBCE_RUNTIME_MULTI_STATEMENT_TRANSACTION_FAIL",

      operationalStatus:
        ok
          ? "PASS"
          : "FAIL",

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
          getOrigin(
            request,
          ),

        runtimeEnvironment:
          process.env
            .VERCEL_ENV ??
          process.env
            .NODE_ENV ??
          "unknown",

        vercelEnvironment:
          process.env
            .VERCEL_ENV ??
          null,

        vercelRegion:
          process.env
            .VERCEL_REGION ??
          process.env
            .AWS_REGION ??
          null,

        nodeVersion:
          process.version,
      },

      scenarios: {
        commit: {
          operationId:
            commitIds.operationId,

          identifiers:
            commitIds,

          flow: [
            "BEGIN SERIALIZABLE",
            "INSERT MEMORY",
            "INSERT EVT",
            "INSERT OPC",
            "INSERT AUDIT",
            "INSERT MODEL USAGE",
            "VERIFY LINKS INSIDE TRANSACTION",
            "COMMIT",
            "VERIFY VISIBILITY OUTSIDE TRANSACTION",
            "CLEANUP IN SECOND TRANSACTION",
          ],
        },

        rollback: {
          operationId:
            rollbackIds.operationId,

          identifiers:
            rollbackIds,

          flow: [
            "BEGIN SERIALIZABLE",
            "INSERT MEMORY",
            "INSERT EVT",
            "INSERT OPC",
            "INSERT AUDIT",
            "INSERT MODEL USAGE",
            "VERIFY LINKS INSIDE TRANSACTION",
            "INJECT CONTROLLED FAILURE",
            "ROLLBACK",
            "VERIFY ZERO RECORDS OUTSIDE TRANSACTION",
          ],
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
        persistentSessionAvailable:
          checks.find(
            (check) =>
              check.id ===
              "TRANSACTION_DATABASE_CONFIGURATION",
          )?.status ===
          "PASS",

        multiStatementCommitSucceeded:
          checks.find(
            (check) =>
              check.id ===
              "MULTI_STATEMENT_COMMIT",
          )?.status ===
          "PASS",

        committedRecordsVisible:
          checks.find(
            (check) =>
              check.id ===
              "COMMIT_VISIBILITY_VERIFY",
          )?.status ===
          "PASS",

        committedDatasetRemoved:
          checks.find(
            (check) =>
              check.id ===
              "COMMIT_DATASET_CLEANUP",
          )?.status ===
          "PASS",

        controlledFailureTriggeredRollback:
          checks.find(
            (check) =>
              check.id ===
              "MULTI_STATEMENT_ROLLBACK",
          )?.status ===
          "PASS",

        rollbackLeftZeroRecords:
          checks.find(
            (check) =>
              check.id ===
              "ROLLBACK_VISIBILITY_VERIFY",
          )?.status ===
          "PASS",

        multiStatementTransactionPassed:
          ok,
      },

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        driver:
          "@neondatabase/serverless Pool",

        connectionMode:
          "PERSISTENT_POOLED_SESSION",

        isolationLevel:
          "SERIALIZABLE",

        usesBeginCommitRollback:
          true,

        statementsPerScenario:
          6,

        commitScenarioUsesExplicitCleanup:
          true,

        rollbackScenarioUsesExplicitCleanup:
          false,

        rollbackMechanism:
          "POSTGRESQL_MULTI_STATEMENT_TRANSACTION_ROLLBACK",

        verifiesVisibilityOutsideTransaction:
          true,

        performsRealModelCall:
          false,

        createsPersistentBusinessData:
          false,

        replacesHumanReview:
          false,

        note:
          "Level 4 proves that separate SQL statements execute on one pooled PostgreSQL session under BEGIN/COMMIT or BEGIN/ROLLBACK. The rollback scenario injects a controlled application error after five ledger inserts and an in-transaction link verification, then confirms zero records from a separate database query.",
      },
    },
    {
      status:
        ok
          ? 200
          : 503,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",

        Pragma:
          "no-cache",

        Expires:
          "0",

        "X-HBCE-Multi-Statement-Test-Revision":
          REVISION,

        "X-HBCE-Multi-Statement-Test-Status":
          ok
            ? "PASS"
            : "FAIL",

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
        "HBCE_RUNTIME_MULTI_STATEMENT_TRANSACTION_SELF_TEST_READY",

      revision:
        REVISION,

      endpoint:
        `${getOrigin(
          request,
        )}/api/v1/runtime/transaction-session/self-test`,

      executionMethod:
        "POST",

      description:
        "Verifica una transazione PostgreSQL multi-statement su connessione persistente: scenario BEGIN/COMMIT con visibilità esterna e scenario BEGIN/fault/ROLLBACK con zero residui.",

      scenarios: [
        {
          id:
            "MULTI_STATEMENT_COMMIT",

          flow: [
            "BEGIN SERIALIZABLE",
            "INSERT MEMORY",
            "INSERT EVT",
            "INSERT OPC",
            "INSERT AUDIT",
            "INSERT MODEL USAGE",
            "VERIFY LINKS",
            "COMMIT",
            "VERIFY EXTERNAL VISIBILITY",
          ],
        },

        {
          id:
            "MULTI_STATEMENT_ROLLBACK",

          flow: [
            "BEGIN SERIALIZABLE",
            "INSERT MEMORY",
            "INSERT EVT",
            "INSERT OPC",
            "INSERT AUDIT",
            "INSERT MODEL USAGE",
            "VERIFY LINKS",
            "CONTROLLED FAILURE",
            "ROLLBACK",
            "VERIFY ZERO RECORDS",
          ],
        },
      ],

      warning:
        "GET non esegue il test. POST usa una connessione PostgreSQL persistente e scritture temporanee sui cinque ledger.",

      boundary: {
        legalCertification:
          false,

        technicalRuntimeTestOnly:
          true,

        usesPersistentPoolSession:
          true,

        usesBeginCommitRollback:
          true,

        isolationLevel:
          "SERIALIZABLE",

        rollbackScenarioUsesExplicitCleanup:
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

        "X-HBCE-Multi-Statement-Test-Revision":
          REVISION,

        "X-HBCE-Legal-Certification":
          "false",
      },
    },
  );
}
