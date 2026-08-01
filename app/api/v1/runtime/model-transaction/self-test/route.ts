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
export const maxDuration = 300;

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
  requestId: string;
};

type OpenAIUsage = {
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
};

type GovernedModelExecution = {
  provider: "OPENAI";
  providerState: "COMPLETED";
  responseId: string;
  model: string;
  outputText: string;
  outputHash: string;
  outputLength: number;
  usage: OpenAIUsage;
  requestStartedAt: string;
  responseReceivedAt: string;
  durationMs: number;
};

type OpenAIResponseBody = {
  id?: unknown;
  model?: unknown;
  status?: unknown;
  output_text?: unknown;
  output?: unknown;
  usage?: unknown;
  error?: unknown;
};

const REVISION =
  "HBCE-RUNTIME-GOVERNED-REAL-MODEL-TRANSACTION-SELF-TEST-v1_0";

const PRODUCT =
  "HBCE IPR Operational Identity & Proof Layer";

const API_VERSION = "v1";
const RUNTIME_NAME = "AI_JOKER_C2_SAAS_CORE_v0_1";

const HUMAN_IPR =
  "IPR-HBCE-REAL-MODEL-TRANSACTION-SELF-TEST";

const RUNTIME_IPR = "IPR-AI-0001";

const MODEL_LEVEL = "STANDARD";
const PROVIDER = "OPENAI";

const COMMIT_PROMPT =
  "Return exactly this token and nothing else: HBCE_MODEL_COMMIT_OK";

const ROLLBACK_PROMPT =
  "Return exactly this token and nothing else: HBCE_MODEL_ROLLBACK_OK";

const COMMIT_EXPECTED = "HBCE_MODEL_COMMIT_OK";
const ROLLBACK_EXPECTED = "HBCE_MODEL_ROLLBACK_OK";

function nowMs(): number {
  return Date.now();
}

function elapsedMs(startedAt: number): number {
  return Math.max(0, Date.now() - startedAt);
}

function normalizeError(error: unknown): string {
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

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
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

function createIds(
  mode: "COMMIT" | "ROLLBACK",
  generatedAt: string,
): ScenarioIds {
  const timestamp = generatedAt
    .replace(/\D/g, "")
    .slice(0, 14);

  const suffix = randomUUID()
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();

  return {
    operationId:
      `HBCE-MODEL-${mode}-${timestamp}-${suffix}`,

    memoryId:
      `MEM-MODEL-${mode}-${timestamp}-${suffix}`,

    evtId:
      `EVT-MODEL-${mode}-${timestamp}-${suffix}`,

    proofId:
      `OPC-MODEL-${mode}-${timestamp}-${suffix}`,

    auditId:
      `AUDIT-MODEL-${mode}-${timestamp}-${suffix}`,

    usageId:
      `USAGE-MODEL-${mode}-${timestamp}-${suffix}`,

    sessionId:
      `HBCE-MODEL-${mode}-SESSION-${randomUUID()}`,

    threadId:
      `HBCE-MODEL-${mode}-THREAD-${randomUUID()}`,

    requestId:
      `HBCE-MODEL-${mode}-REQUEST-${randomUUID()}`,
  };
}

function buildSummary(checks: Check[], durationMs: number) {
  const required = checks.filter((check) => check.required);

  return {
    totalChecks: checks.length,
    passedChecks:
      checks.filter((check) => check.status === "PASS").length,
    failedChecks:
      checks.filter((check) => check.status === "FAIL").length,
    skippedChecks:
      checks.filter((check) => check.status === "SKIPPED").length,
    requiredChecks: required.length,
    requiredPassed:
      required.filter((check) => check.status === "PASS").length,
    requiredFailed:
      required.filter((check) => check.status !== "PASS").length,
    durationMs,
  };
}

function extractOutputText(body: OpenAIResponseBody): string {
  if (typeof body.output_text === "string") {
    return body.output_text.trim();
  }

  if (!Array.isArray(body.output)) {
    return "";
  }

  const fragments: string[] = [];

  for (const item of body.output) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const content = (item as { content?: unknown }).content;

    if (!Array.isArray(content)) {
      continue;
    }

    for (const part of content) {
      if (!part || typeof part !== "object") {
        continue;
      }

      const text = (part as { text?: unknown }).text;

      if (typeof text === "string") {
        fragments.push(text);
      }
    }
  }

  return fragments.join("").trim();
}

function extractUsage(body: OpenAIResponseBody): OpenAIUsage {
  const usage =
    body.usage && typeof body.usage === "object"
      ? (body.usage as Record<string, unknown>)
      : {};

  const inputTokens =
    asNumber(usage.input_tokens) ??
    asNumber(usage.prompt_tokens);

  const outputTokens =
    asNumber(usage.output_tokens) ??
    asNumber(usage.completion_tokens);

  const totalTokens =
    asNumber(usage.total_tokens) ??
    (
      inputTokens !== null &&
      outputTokens !== null
        ? inputTokens + outputTokens
        : null
    );

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

function resolveOpenAIModel(): string {
  return (
    process.env.HBCE_OPENAI_MODEL ??
    process.env.OPENAI_MODEL ??
    "gpt-5-nano"
  );
}

function requireOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY;

  if (!key) {
    throw new Error("OPENAI_API_KEY_NOT_CONFIGURED");
  }

  return key;
}

async function executeRealModel(
  prompt: string,
  expectedOutput: string,
): Promise<GovernedModelExecution> {
  const apiKey = requireOpenAIKey();
  const model = resolveOpenAIModel();

  const startedAtMs = nowMs();
  const requestStartedAt = new Date().toISOString();

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    120_000,
  );

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          model,
          input: prompt,
          store: false,
          max_output_tokens: 32,
        }),

        signal: controller.signal,
        cache: "no-store",
      },
    );

    const body =
      (await response.json()) as OpenAIResponseBody;

    if (!response.ok) {
      const providerError =
        body.error && typeof body.error === "object"
          ? stableJson(body.error)
          : `HTTP_${response.status}`;

      throw new Error(
        `OPENAI_RESPONSE_FAILED:${providerError}`,
      );
    }

    const outputText = extractOutputText(body);
    const responseId = asString(body.id);
    const returnedModel = asString(body.model) ?? model;

    if (!responseId) {
      throw new Error("OPENAI_RESPONSE_ID_MISSING");
    }

    if (outputText !== expectedOutput) {
      throw new Error(
        `OPENAI_OUTPUT_VALIDATION_FAILED:${sha256(outputText)}`,
      );
    }

    return {
      provider: "OPENAI",
      providerState: "COMPLETED",
      responseId,
      model: returnedModel,
      outputText,
      outputHash: sha256(outputText),
      outputLength: outputText.length,
      usage: extractUsage(body),
      requestStartedAt,
      responseReceivedAt: new Date().toISOString(),
      durationMs: elapsedMs(startedAtMs),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function buildHashes(
  ids: ScenarioIds,
  generatedAt: string,
  execution: GovernedModelExecution,
  promptHash: string,
) {
  const policyHash = sha256(
    stableJson({
      decision: "ALLOW",
      riskLevel: "LOW",
      modelExecutionRequired: true,
      legalCertification: false,
      revision: REVISION,
    }),
  );

  const memoryHash = sha256(
    stableJson({
      operationId: ids.operationId,
      responseId: execution.responseId,
      promptHash,
      outputHash: execution.outputHash,
      generatedAt,
    }),
  );

  const eventHash = sha256(
    stableJson({
      evtId: ids.evtId,
      memoryId: ids.memoryId,
      memoryHash,
      responseId: execution.responseId,
      outputHash: execution.outputHash,
      policyHash,
    }),
  );

  const proofHash = sha256(
    stableJson({
      proofId: ids.proofId,
      evtId: ids.evtId,
      eventHash,
      memoryHash,
      outputHash: execution.outputHash,
    }),
  );

  const auditHash = sha256(
    stableJson({
      auditId: ids.auditId,
      evtId: ids.evtId,
      proofId: ids.proofId,
      proofHash,
      responseId: execution.responseId,
    }),
  );

  const usageHash = sha256(
    stableJson({
      usageId: ids.usageId,
      responseId: execution.responseId,
      model: execution.model,
      usage: execution.usage,
      auditId: ids.auditId,
    }),
  );

  return {
    promptHash,
    outputHash: execution.outputHash,
    policyHash,
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
  hashes: ReturnType<typeof buildHashes>,
  execution: GovernedModelExecution,
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
        'REAL_MODEL_EXECUTION',
        'HBCE Governed Real Model Transaction Self-Test',
        'Hash-only technical memory record for a governed model execution.',
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
      sha256(`memory-key:${ids.memoryId}`),
      HUMAN_IPR,
      RUNTIME_IPR,
      ids.sessionId,
      ids.threadId,
      hashes.memoryHash,
      sha256(
        stableJson({
          previousHash: null,
          memoryHash: hashes.memoryHash,
          operationId: ids.operationId,
        }),
      ),
      generatedAt,
      stableJson({
        operationId: ids.operationId,
        provider: execution.provider,
        providerResponseId: execution.responseId,
        model: execution.model,
        promptHash: hashes.promptHash,
        outputHash: hashes.outputHash,
        outputLength: execution.outputLength,
        rawPromptPersisted: false,
        rawOutputPersisted: false,
        reusableInPrompt: false,
        legalCertification: false,
      }),
    ],
  );
}

async function insertEvt(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  hashes: ReturnType<typeof buildHashes>,
  execution: GovernedModelExecution,
): Promise<void> {
  await tx.query(
    `
      INSERT INTO evt_records (
        evt_id,
        event_id,
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
        input_hash,
        output_hash,
        policy_hash,
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
        $2,
        $3,
        $4,
        $5,
        $6,
        'REAL_MODEL_EXECUTION',
        'GOVERNED_REAL_MODEL_RESPONSE',
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
        'REAL_MODEL_SELF_TEST',
        'HBCE_RUNTIME',
        'EVT',
        $7,
        $7,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12::timestamptz,
        $13::jsonb,
        $14::jsonb,
        $15::jsonb,
        $16::jsonb,
        $16::jsonb,
        false
      )
    `,
    [
      ids.evtId,
      HUMAN_IPR,
      RUNTIME_IPR,
      ids.sessionId,
      ids.threadId,
      ids.memoryId,
      hashes.eventHash,
      hashes.promptHash,
      hashes.outputHash,
      hashes.policyHash,
      hashes.memoryHash,
      execution.responseReceivedAt,
      stableJson({
        operationId: ids.operationId,
        provider: execution.provider,
        providerResponseId: execution.responseId,
        model: execution.model,
        modelCallPerformed: true,
      }),
      stableJson({
        memoryId: ids.memoryId,
        proofId: ids.proofId,
        auditId: ids.auditId,
        usageId: ids.usageId,
      }),
      stableJson({
        inputHash: hashes.promptHash,
        outputHash: hashes.outputHash,
        policyHash: hashes.policyHash,
        memoryHash: hashes.memoryHash,
        eventHash: hashes.eventHash,
      }),
      stableJson({
        operationId: ids.operationId,
        evtId: ids.evtId,
        providerResponseId: execution.responseId,
        promptHash: hashes.promptHash,
        outputHash: hashes.outputHash,
        rawPromptPersisted: false,
        rawOutputPersisted: false,
        legalCertification: false,
      }),
    ],
  );
}

async function insertOpc(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  hashes: ReturnType<typeof buildHashes>,
  execution: GovernedModelExecution,
): Promise<void> {
  await tx.query(
    `
      INSERT INTO opc_proofs (
        proof_id,
        id,
        evt_id,
        event_id,
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
        input_hash,
        output_hash,
        decision_hash,
        event_hash,
        evt_hash,
        memory_hash,
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
        $3,
        $4,
        $5,
        $6,
        $7,
        'RUNTIME_SELF_TEST',
        'GOVERNED_REAL_MODEL_EXECUTION',
        'OPC_TECHNICAL_PROOF_RECEIPT',
        'DATABASE_PERSISTENT',
        'PERSISTED',
        $8,
        $9,
        $10,
        $11,
        $11,
        $12,
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
        false
      )
    `,
    [
      ids.proofId,
      ids.evtId,
      HUMAN_IPR,
      RUNTIME_IPR,
      ids.sessionId,
      ids.threadId,
      ids.memoryId,
      hashes.promptHash,
      hashes.outputHash,
      hashes.policyHash,
      hashes.eventHash,
      hashes.memoryHash,
      hashes.proofHash,
      REVISION,
      execution.responseReceivedAt,
      stableJson({
        operationId: ids.operationId,
        providerResponseId: execution.responseId,
        modelCallPerformed: true,
      }),
      stableJson({
        humanIpr: HUMAN_IPR,
        runtimeIpr: RUNTIME_IPR,
      }),
      stableJson({
        provider: execution.provider,
        model: execution.model,
        providerResponseId: execution.responseId,
      }),
      stableJson({
        evtId: ids.evtId,
        eventHash: hashes.eventHash,
      }),
      stableJson({
        memoryId: ids.memoryId,
        memoryHash: hashes.memoryHash,
      }),
      stableJson({
        runtime: RUNTIME_NAME,
        state: "READY",
        decision: "ALLOW",
      }),
      stableJson({
        proofId: ids.proofId,
        proofHash: hashes.proofHash,
        verification: "VERIFIABLE",
      }),
      stableJson({
        auditId: ids.auditId,
        status: "NOT_CREATED",
      }),
      stableJson({
        providerResponseId: execution.responseId,
        outputHash: hashes.outputHash,
        responseValidated: true,
      }),
      stableJson({
        legalCertification: false,
        opcBoundary: "technical proof receipt only",
        rawPromptPersisted: false,
        rawOutputPersisted: false,
      }),
      stableJson({
        operationId: ids.operationId,
        proofId: ids.proofId,
        evtId: ids.evtId,
        memoryId: ids.memoryId,
        providerResponseId: execution.responseId,
        proofHash: hashes.proofHash,
      }),
      stableJson({
        operationId: ids.operationId,
        providerResponseId: execution.responseId,
        promptHash: hashes.promptHash,
        outputHash: hashes.outputHash,
        eventHash: hashes.eventHash,
        memoryHash: hashes.memoryHash,
        proofHash: hashes.proofHash,
      }),
    ],
  );
}

async function insertAudit(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  hashes: ReturnType<typeof buildHashes>,
  execution: GovernedModelExecution,
): Promise<void> {
  await tx.query(
    `
      INSERT INTO runtime_audit_logs (
        audit_id,
        source,
        request_id,
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
        data_class,
        context_class,
        project_domain,
        hbce_module,
        access_decision,
        blocked,
        allowed,
        fail_closed,
        human_oversight,
        memory_scope,
        memory_authority,
        persistence_mode,
        evt_required,
        opc_required,
        audit_required,
        input_hash,
        output_hash,
        decision_hash,
        policy_hash,
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
        $8,
        $9,
        $10,
        $10,
        $11,
        $12,
        $12,
        $13,
        'GOVERNED_REAL_MODEL_EXECUTION',
        'READY',
        'ALLOW',
        'PERSISTED',
        'LOW',
        'PUBLIC_OR_SYNTHETIC',
        'TECHNICAL_DIAGNOSTIC',
        'HBCE_RUNTIME',
        'AUDIT',
        'ALLOW',
        false,
        true,
        false,
        'NOT_REQUIRED',
        'RUNTIME_ONLY',
        'SESSION_RUNTIME_ONLY',
        'DATABASE_PERSISTENT',
        true,
        true,
        true,
        $14,
        $15,
        $16,
        $17,
        $18::timestamptz,
        $19,
        'HBCE governed real model execution self-test',
        $20::jsonb,
        $20::jsonb,
        false
      )
    `,
    [
      ids.auditId,
      REVISION,
      ids.requestId,
      HUMAN_IPR,
      RUNTIME_IPR,
      ids.sessionId,
      ids.threadId,
      ids.evtId,
      hashes.eventHash,
      ids.proofId,
      hashes.proofHash,
      ids.memoryId,
      hashes.memoryHash,
      hashes.promptHash,
      hashes.outputHash,
      hashes.policyHash,
      hashes.policyHash,
      execution.responseReceivedAt,
      hashes.auditHash,
      stableJson({
        operationId: ids.operationId,
        provider: execution.provider,
        providerResponseId: execution.responseId,
        model: execution.model,
        promptHash: hashes.promptHash,
        outputHash: hashes.outputHash,
        eventHash: hashes.eventHash,
        proofHash: hashes.proofHash,
        memoryHash: hashes.memoryHash,
        auditHash: hashes.auditHash,
        rawPromptPersisted: false,
        rawOutputPersisted: false,
        legalCertification: false,
      }),
    ],
  );
}

async function insertUsage(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  hashes: ReturnType<typeof buildHashes>,
  execution: GovernedModelExecution,
): Promise<void> {
  await tx.query(
    `
      INSERT INTO model_usage (
        usage_id,
        source,
        provider,
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
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $9,
        $10,
        $11,
        $11,
        $12,
        $13,
        $14,
        $14,
        $15,
        'REAL_MODEL_SELF_TEST',
        'REAL_MODEL_SELF_TEST',
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
        $16,
        $17,
        $18,
        false,
        true,
        false,
        'DATABASE_PERSISTENT',
        $19::timestamptz,
        $20,
        'HBCE governed real model execution self-test',
        $21::jsonb,
        $21::jsonb,
        false
      )
    `,
    [
      ids.usageId,
      REVISION,
      execution.provider,
      HUMAN_IPR,
      RUNTIME_IPR,
      ids.sessionId,
      ids.threadId,
      ids.requestId,
      ids.evtId,
      hashes.eventHash,
      ids.proofId,
      hashes.proofHash,
      ids.auditId,
      execution.model,
      MODEL_LEVEL,
      execution.usage.inputTokens,
      execution.usage.outputTokens,
      execution.usage.totalTokens,
      execution.responseReceivedAt,
      hashes.usageHash,
      stableJson({
        operationId: ids.operationId,
        provider: execution.provider,
        providerState: execution.providerState,
        providerResponseId: execution.responseId,
        model: execution.model,
        modelLevel: MODEL_LEVEL,
        inputTokens: execution.usage.inputTokens,
        outputTokens: execution.usage.outputTokens,
        totalTokens: execution.usage.totalTokens,
        promptHash: hashes.promptHash,
        outputHash: hashes.outputHash,
        usageHash: hashes.usageHash,
        rawPromptPersisted: false,
        rawOutputPersisted: false,
        legalCertification: false,
      }),
    ],
  );
}

async function verifyInsideTransaction(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
): Promise<{
  counts: Record<string, number>;
  linked: boolean;
}> {
  const result = await tx.query<GenericRow>(
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

  const row = result.rows[0] ?? {};

  const counts = {
    memory: asNumber(row.memory_count) ?? -1,
    evt: asNumber(row.evt_count) ?? -1,
    opc: asNumber(row.opc_count) ?? -1,
    audit: asNumber(row.audit_count) ?? -1,
    usage: asNumber(row.usage_count) ?? -1,
  };

  return {
    counts,
    linked:
      Object.values(counts).every((count) => count === 1),
  };
}

async function executeLedgerChain(
  tx: HbceTransactionContext,
  ids: ScenarioIds,
  generatedAt: string,
  prompt: string,
  execution: GovernedModelExecution,
): Promise<{
  queryCount: number;
  verification: {
    counts: Record<string, number>;
    linked: boolean;
  };
}> {
  const hashes = buildHashes(
    ids,
    generatedAt,
    execution,
    sha256(prompt),
  );

  await insertMemory(tx, ids, generatedAt, hashes, execution);
  await insertEvt(tx, ids, hashes, execution);
  await insertOpc(tx, ids, hashes, execution);
  await insertAudit(tx, ids, hashes, execution);
  await insertUsage(tx, ids, hashes, execution);

  const verification =
    await verifyInsideTransaction(tx, ids);

  if (!verification.linked) {
    throw new Error(
      "HBCE_REAL_MODEL_LEDGER_LINK_VERIFICATION_FAILED",
    );
  }

  return {
    queryCount: 6,
    verification,
  };
}

async function countOutsideTransaction(
  ids: ScenarioIds,
): Promise<{
  counts: Record<string, number>;
  total: number;
}> {
  const result = await queryHbceDatabase<CountRow>(
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
    memory: asNumber(row.memory_count) ?? -1,
    evt: asNumber(row.evt_count) ?? -1,
    opc: asNumber(row.opc_count) ?? -1,
    audit: asNumber(row.audit_count) ?? -1,
    usage: asNumber(row.usage_count) ?? -1,
  };

  return {
    counts,
    total:
      Object.values(counts).reduce(
        (sum, count) => sum + count,
        0,
      ),
  };
}

async function cleanupCommittedDataset(
  ids: ScenarioIds,
): Promise<void> {
  const outcome = await withHbceDatabaseTransaction(
    async (tx) => {
      await tx.query(
        "DELETE FROM model_usage WHERE usage_id = $1",
        [ids.usageId],
      );

      await tx.query(
        "DELETE FROM runtime_audit_logs WHERE audit_id = $1",
        [ids.auditId],
      );

      await tx.query(
        "DELETE FROM opc_proofs WHERE proof_id = $1",
        [ids.proofId],
      );

      await tx.query(
        "DELETE FROM evt_records WHERE evt_id = $1",
        [ids.evtId],
      );

      await tx.query(
        "DELETE FROM memory_records WHERE memory_id = $1",
        [ids.memoryId],
      );
    },
    {
      isolationLevel: "SERIALIZABLE",
      statementTimeoutMs: 120_000,
    },
  );

  if (!outcome.ok) {
    throw new Error(
      `HBCE_REAL_MODEL_CLEANUP_FAILED:${outcome.error}`,
    );
  }
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse> {
  const startedAt = nowMs();
  const generatedAt = new Date().toISOString();

  const checks: Check[] = [];

  const commitIds = createIds("COMMIT", generatedAt);
  const rollbackIds = createIds("ROLLBACK", generatedAt);

  const transactionConfigured =
    isHbceTransactionDatabaseConfigured();

  const openAIConfigured =
    Boolean(process.env.OPENAI_API_KEY);

  checks.push(
    createCheck({
      id: "RUNTIME_CONFIGURATION",
      label: "Transaction and OpenAI runtime configuration",
      status:
        transactionConfigured && openAIConfigured
          ? "PASS"
          : "FAIL",
      durationMs: 0,
      details: {
        transaction:
          describeHbceTransactionDatabase(),
        openAIConfigured,
        model: resolveOpenAIModel(),
        rawPromptPersistence: false,
        rawOutputPersistence: false,
      },
      error:
        !transactionConfigured
          ? "TRANSACTION_DATABASE_NOT_CONFIGURED"
          : !openAIConfigured
            ? "OPENAI_API_KEY_NOT_CONFIGURED"
            : null,
    }),
  );

  if (!transactionConfigured || !openAIConfigured) {
    checks.push(
      skipped(
        "REAL_MODEL_COMMIT_CALL",
        "Execute real model call for commit scenario",
        "RUNTIME_NOT_CONFIGURED",
      ),
      skipped(
        "REAL_MODEL_COMMIT_TRANSACTION",
        "Commit governed model execution ledger chain",
        "RUNTIME_NOT_CONFIGURED",
      ),
      skipped(
        "REAL_MODEL_COMMIT_VERIFY",
        "Verify committed governed model execution",
        "RUNTIME_NOT_CONFIGURED",
      ),
      skipped(
        "REAL_MODEL_COMMIT_CLEANUP",
        "Remove committed governed model execution",
        "RUNTIME_NOT_CONFIGURED",
      ),
      skipped(
        "REAL_MODEL_ROLLBACK_CALL",
        "Execute real model call for rollback scenario",
        "RUNTIME_NOT_CONFIGURED",
      ),
      skipped(
        "REAL_MODEL_ROLLBACK_TRANSACTION",
        "Rollback governed model execution after controlled failure",
        "RUNTIME_NOT_CONFIGURED",
      ),
      skipped(
        "REAL_MODEL_ROLLBACK_VERIFY",
        "Verify rollback left zero ledger records",
        "RUNTIME_NOT_CONFIGURED",
      ),
    );
  } else {
    let commitExecution: GovernedModelExecution | null = null;

    const commitCallStartedAt = nowMs();

    try {
      commitExecution = await executeRealModel(
        COMMIT_PROMPT,
        COMMIT_EXPECTED,
      );

      checks.push(
        createCheck({
          id: "REAL_MODEL_COMMIT_CALL",
          label: "Execute real model call for commit scenario",
          status: "PASS",
          durationMs: elapsedMs(commitCallStartedAt),
          details: {
            provider: commitExecution.provider,
            providerState: commitExecution.providerState,
            responseId: commitExecution.responseId,
            model: commitExecution.model,
            outputHash: commitExecution.outputHash,
            outputLength: commitExecution.outputLength,
            usage: commitExecution.usage,
            providerDurationMs: commitExecution.durationMs,
            outputValidated: true,
            rawPromptPersisted: false,
            rawOutputPersisted: false,
          },
        }),
      );
    } catch (error) {
      checks.push(
        createCheck({
          id: "REAL_MODEL_COMMIT_CALL",
          label: "Execute real model call for commit scenario",
          status: "FAIL",
          durationMs: elapsedMs(commitCallStartedAt),
          details: {
            provider: PROVIDER,
            model: resolveOpenAIModel(),
          },
          error: normalizeError(error),
        }),
      );
    }

    if (!commitExecution) {
      checks.push(
        skipped(
          "REAL_MODEL_COMMIT_TRANSACTION",
          "Commit governed model execution ledger chain",
          "REAL_MODEL_CALL_FAILED",
        ),
        skipped(
          "REAL_MODEL_COMMIT_VERIFY",
          "Verify committed governed model execution",
          "REAL_MODEL_CALL_FAILED",
        ),
        skipped(
          "REAL_MODEL_COMMIT_CLEANUP",
          "Remove committed governed model execution",
          "REAL_MODEL_CALL_FAILED",
        ),
      );
    } else {
      const commitTransactionStartedAt = nowMs();

      const commitOutcome = await withHbceDatabaseTransaction(
        async (tx) =>
          executeLedgerChain(
            tx,
            commitIds,
            generatedAt,
            COMMIT_PROMPT,
            commitExecution!,
          ),
        {
          isolationLevel: "SERIALIZABLE",
          statementTimeoutMs: 120_000,
          lockTimeoutMs: 15_000,
          idleInTransactionSessionTimeoutMs: 120_000,
        },
      );

      const commitPassed =
        commitOutcome.ok &&
        commitOutcome.state === "COMMITTED" &&
        commitOutcome.value.verification.linked;

      checks.push(
        createCheck({
          id: "REAL_MODEL_COMMIT_TRANSACTION",
          label: "Commit governed model execution ledger chain",
          status: commitPassed ? "PASS" : "FAIL",
          durationMs: elapsedMs(commitTransactionStartedAt),
          details: {
            operationId: commitIds.operationId,
            transactionId: commitOutcome.transactionId,
            state: commitOutcome.state,
            providerResponseId: commitExecution.responseId,
            queryCount:
              commitOutcome.ok
                ? commitOutcome.value.queryCount
                : null,
            insideTransactionVerification:
              commitOutcome.ok
                ? commitOutcome.value.verification
                : null,
            rollbackError:
              commitOutcome.ok
                ? null
                : commitOutcome.rollbackError,
          },
          error:
            commitPassed
              ? null
              : commitOutcome.ok
                ? "REAL_MODEL_COMMIT_NOT_CONFIRMED"
                : commitOutcome.error,
        }),
      );

      const commitVerifyStartedAt = nowMs();
      const committedCounts =
        await countOutsideTransaction(commitIds);

      const commitVisible =
        committedCounts.total === 5 &&
        Object.values(committedCounts.counts).every(
          (count) => count === 1,
        );

      checks.push(
        createCheck({
          id: "REAL_MODEL_COMMIT_VERIFY",
          label: "Verify committed governed model execution",
          status: commitVisible ? "PASS" : "FAIL",
          durationMs: elapsedMs(commitVerifyStartedAt),
          details: {
            operationId: commitIds.operationId,
            providerResponseId: commitExecution.responseId,
            counts: committedCounts.counts,
            total: committedCounts.total,
            expectedTotal: 5,
          },
          error:
            commitVisible
              ? null
              : "REAL_MODEL_COMMITTED_RECORDS_NOT_VISIBLE",
        }),
      );

      const cleanupStartedAt = nowMs();

      try {
        await cleanupCommittedDataset(commitIds);

        const remaining =
          await countOutsideTransaction(commitIds);

        checks.push(
          createCheck({
            id: "REAL_MODEL_COMMIT_CLEANUP",
            label: "Remove committed governed model execution",
            status:
              remaining.total === 0 ? "PASS" : "FAIL",
            durationMs: elapsedMs(cleanupStartedAt),
            details: {
              operationId: commitIds.operationId,
              remaining: remaining.counts,
              remainingTotal: remaining.total,
            },
            error:
              remaining.total === 0
                ? null
                : "REAL_MODEL_COMMIT_CLEANUP_INCOMPLETE",
          }),
        );
      } catch (error) {
        checks.push(
          createCheck({
            id: "REAL_MODEL_COMMIT_CLEANUP",
            label: "Remove committed governed model execution",
            status: "FAIL",
            durationMs: elapsedMs(cleanupStartedAt),
            details: {
              operationId: commitIds.operationId,
            },
            error: normalizeError(error),
          }),
        );
      }
    }

    let rollbackExecution: GovernedModelExecution | null = null;

    const rollbackCallStartedAt = nowMs();

    try {
      rollbackExecution = await executeRealModel(
        ROLLBACK_PROMPT,
        ROLLBACK_EXPECTED,
      );

      checks.push(
        createCheck({
          id: "REAL_MODEL_ROLLBACK_CALL",
          label: "Execute real model call for rollback scenario",
          status: "PASS",
          durationMs: elapsedMs(rollbackCallStartedAt),
          details: {
            provider: rollbackExecution.provider,
            providerState: rollbackExecution.providerState,
            responseId: rollbackExecution.responseId,
            model: rollbackExecution.model,
            outputHash: rollbackExecution.outputHash,
            outputLength: rollbackExecution.outputLength,
            usage: rollbackExecution.usage,
            providerDurationMs: rollbackExecution.durationMs,
            outputValidated: true,
            rawPromptPersisted: false,
            rawOutputPersisted: false,
          },
        }),
      );
    } catch (error) {
      checks.push(
        createCheck({
          id: "REAL_MODEL_ROLLBACK_CALL",
          label: "Execute real model call for rollback scenario",
          status: "FAIL",
          durationMs: elapsedMs(rollbackCallStartedAt),
          details: {
            provider: PROVIDER,
            model: resolveOpenAIModel(),
          },
          error: normalizeError(error),
        }),
      );
    }

    if (!rollbackExecution) {
      checks.push(
        skipped(
          "REAL_MODEL_ROLLBACK_TRANSACTION",
          "Rollback governed model execution after controlled failure",
          "REAL_MODEL_CALL_FAILED",
        ),
        skipped(
          "REAL_MODEL_ROLLBACK_VERIFY",
          "Verify rollback left zero ledger records",
          "REAL_MODEL_CALL_FAILED",
        ),
      );
    } else {
      const rollbackTransactionStartedAt = nowMs();

      const rollbackOutcome =
        await withHbceDatabaseTransaction(
          async (tx) => {
            const chain = await executeLedgerChain(
              tx,
              rollbackIds,
              generatedAt,
              ROLLBACK_PROMPT,
              rollbackExecution!,
            );

            if (!chain.verification.linked) {
              throw new Error(
                "REAL_MODEL_ROLLBACK_LINK_VERIFICATION_FAILED",
              );
            }

            throw new Error(
              "HBCE_CONTROLLED_FAILURE_AFTER_REAL_MODEL_AND_FIVE_LEDGER_WRITES",
            );
          },
          {
            isolationLevel: "SERIALIZABLE",
            statementTimeoutMs: 120_000,
            lockTimeoutMs: 15_000,
            idleInTransactionSessionTimeoutMs: 120_000,
          },
        );

      const rollbackPassed =
        !rollbackOutcome.ok &&
        rollbackOutcome.state === "ROLLED_BACK" &&
        rollbackOutcome.error ===
          "HBCE_CONTROLLED_FAILURE_AFTER_REAL_MODEL_AND_FIVE_LEDGER_WRITES" &&
        rollbackOutcome.rollbackError === null;

      checks.push(
        createCheck({
          id: "REAL_MODEL_ROLLBACK_TRANSACTION",
          label:
            "Rollback governed model execution after controlled failure",
          status: rollbackPassed ? "PASS" : "FAIL",
          durationMs: elapsedMs(rollbackTransactionStartedAt),
          details: {
            operationId: rollbackIds.operationId,
            transactionId: rollbackOutcome.transactionId,
            state: rollbackOutcome.state,
            providerResponseId: rollbackExecution.responseId,
            expectedError:
              "HBCE_CONTROLLED_FAILURE_AFTER_REAL_MODEL_AND_FIVE_LEDGER_WRITES",
            actualError:
              rollbackOutcome.ok
                ? null
                : rollbackOutcome.error,
            rollbackError:
              rollbackOutcome.ok
                ? null
                : rollbackOutcome.rollbackError,
            explicitCleanupUsed: false,
            failurePoint:
              "AFTER_REAL_MODEL_RESPONSE_FIVE_LEDGER_WRITES_AND_LINK_VERIFICATION",
          },
          error:
            rollbackPassed
              ? null
              : rollbackOutcome.ok
                ? "EXPECTED_REAL_MODEL_ROLLBACK_DID_NOT_OCCUR"
                : rollbackOutcome.error,
        }),
      );

      const rollbackVerifyStartedAt = nowMs();
      const rolledBackCounts =
        await countOutsideTransaction(rollbackIds);

      const rollbackInvisible =
        rolledBackCounts.total === 0 &&
        Object.values(rolledBackCounts.counts).every(
          (count) => count === 0,
        );

      checks.push(
        createCheck({
          id: "REAL_MODEL_ROLLBACK_VERIFY",
          label: "Verify rollback left zero ledger records",
          status: rollbackInvisible ? "PASS" : "FAIL",
          durationMs: elapsedMs(rollbackVerifyStartedAt),
          details: {
            operationId: rollbackIds.operationId,
            providerResponseId: rollbackExecution.responseId,
            counts: rolledBackCounts.counts,
            total: rolledBackCounts.total,
            expectedTotal: 0,
            explicitCleanupUsed: false,
          },
          error:
            rollbackInvisible
              ? null
              : "REAL_MODEL_ROLLBACK_LEFT_RESIDUAL_RECORDS",
        }),
      );
    }
  }

  const ok =
    !checks.some(
      (check) =>
        check.required &&
        check.status !== "PASS",
    );

  const firstFailure =
    checks.find(
      (check) =>
        check.required &&
        check.status !== "PASS",
    ) ?? null;

  const durationMs = elapsedMs(startedAt);

  return NextResponse.json(
    {
      ok,

      status:
        ok
          ? "HBCE_RUNTIME_GOVERNED_REAL_MODEL_TRANSACTION_PASS"
          : "HBCE_RUNTIME_GOVERNED_REAL_MODEL_TRANSACTION_FAIL",

      operationalStatus: ok ? "PASS" : "FAIL",

      revision: REVISION,
      generatedAt,
      product: PRODUCT,
      apiVersion: API_VERSION,
      runtime: RUNTIME_NAME,

      deployment: {
        origin: getOrigin(request),

        runtimeEnvironment:
          process.env.VERCEL_ENV ??
          process.env.NODE_ENV ??
          "unknown",

        vercelEnvironment:
          process.env.VERCEL_ENV ?? null,

        vercelRegion:
          process.env.VERCEL_REGION ??
          process.env.AWS_REGION ??
          null,

        nodeVersion: process.version,
      },

      scenarios: {
        commit: {
          operationId: commitIds.operationId,
          identifiers: commitIds,
          expectedModelOutputHash: sha256(COMMIT_EXPECTED),
          flow: [
            "POLICY_ALLOW",
            "REAL_OPENAI_RESPONSES_API_CALL",
            "OUTPUT_VALIDATION",
            "BEGIN SERIALIZABLE",
            "INSERT MEMORY",
            "INSERT EVT",
            "INSERT OPC",
            "INSERT AUDIT",
            "INSERT MODEL USAGE",
            "VERIFY LINKS",
            "COMMIT",
            "VERIFY EXTERNAL VISIBILITY",
            "CLEANUP",
          ],
        },

        rollback: {
          operationId: rollbackIds.operationId,
          identifiers: rollbackIds,
          expectedModelOutputHash: sha256(ROLLBACK_EXPECTED),
          flow: [
            "POLICY_ALLOW",
            "REAL_OPENAI_RESPONSES_API_CALL",
            "OUTPUT_VALIDATION",
            "BEGIN SERIALIZABLE",
            "INSERT MEMORY",
            "INSERT EVT",
            "INSERT OPC",
            "INSERT AUDIT",
            "INSERT MODEL USAGE",
            "VERIFY LINKS",
            "CONTROLLED_FAILURE",
            "ROLLBACK",
            "VERIFY_ZERO_RECORDS",
          ],
        },

        firstFailure:
          firstFailure
            ? {
                id: firstFailure.id,
                error: firstFailure.error,
              }
            : null,
      },

      summary: buildSummary(checks, durationMs),

      checks,

      interpretation: {
        transactionRuntimeConfigured:
          checks.find(
            (check) => check.id === "RUNTIME_CONFIGURATION",
          )?.status === "PASS",

        realCommitModelCallSucceeded:
          checks.find(
            (check) => check.id === "REAL_MODEL_COMMIT_CALL",
          )?.status === "PASS",

        realModelExecutionCommitted:
          checks.find(
            (check) =>
              check.id === "REAL_MODEL_COMMIT_TRANSACTION",
          )?.status === "PASS",

        committedModelExecutionVisible:
          checks.find(
            (check) => check.id === "REAL_MODEL_COMMIT_VERIFY",
          )?.status === "PASS",

        committedModelExecutionRemoved:
          checks.find(
            (check) => check.id === "REAL_MODEL_COMMIT_CLEANUP",
          )?.status === "PASS",

        realRollbackModelCallSucceeded:
          checks.find(
            (check) => check.id === "REAL_MODEL_ROLLBACK_CALL",
          )?.status === "PASS",

        controlledFailureTriggeredRollback:
          checks.find(
            (check) =>
              check.id === "REAL_MODEL_ROLLBACK_TRANSACTION",
          )?.status === "PASS",

        rollbackLeftZeroRecords:
          checks.find(
            (check) =>
              check.id === "REAL_MODEL_ROLLBACK_VERIFY",
          )?.status === "PASS",

        governedRealModelTransactionPassed: ok,
      },

      boundary: {
        legalCertification: false,
        technicalRuntimeTestOnly: true,
        provider: PROVIDER,
        api: "OPENAI_RESPONSES_API",
        realModelCallPerformed: true,
        modelSelectedFromEnvironment: true,
        requestStore: false,
        rawPromptPersisted: false,
        rawOutputPersisted: false,
        hashOnlyOperationalEvidence: true,
        usesPersistentPoolSession: true,
        usesBeginCommitRollback: true,
        isolationLevel: "SERIALIZABLE",
        commitScenarioUsesExplicitCleanup: true,
        rollbackScenarioUsesExplicitCleanup: false,
        rollbackMechanism:
          "POSTGRESQL_MULTI_STATEMENT_TRANSACTION_ROLLBACK",
        modelCallInsideDatabaseTransaction: false,
        reasonModelCallOutsideTransaction:
          "Avoid holding PostgreSQL locks during external network latency. The validated provider response becomes the governed input to the database transaction.",
        createsPersistentBusinessData: false,
        replacesProviderAttestation: false,
        replacesHumanReview: false,
        note:
          "Level 5 verifies two real OpenAI model executions. A validated response is committed with linked Memory, EVT, OPC, Audit and Model Usage records in the success scenario. A second validated response is followed by five linked ledger writes and an intentional runtime failure; PostgreSQL rollback must leave zero records without explicit cleanup.",
      },
    },
    {
      status: ok ? 200 : 503,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",

        Pragma: "no-cache",
        Expires: "0",

        "X-HBCE-Real-Model-Transaction-Revision":
          REVISION,

        "X-HBCE-Real-Model-Transaction-Status":
          ok ? "PASS" : "FAIL",

        "X-HBCE-Legal-Certification": "false",
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
        "HBCE_RUNTIME_GOVERNED_REAL_MODEL_TRANSACTION_SELF_TEST_READY",

      revision: REVISION,

      endpoint:
        `${getOrigin(request)}/api/v1/runtime/model-transaction/self-test`,

      executionMethod: "POST",

      description:
        "Esegue due chiamate reali alla OpenAI Responses API. La prima viene validata e registrata in una transazione cross-ledger con COMMIT. La seconda viene validata, scritta nei cinque ledger e poi annullata tramite errore controllato e ROLLBACK.",

      requiredEnvironment: {
        OPENAI_API_KEY: "required",
        HBCE_OPENAI_MODEL:
          "optional; fallback OPENAI_MODEL then gpt-5-nano",
        DATABASE_URL:
          "required through the persistent HBCE transaction helper",
      },

      scenarios: [
        {
          id: "REAL_MODEL_COMMIT",
          expected:
            "Real provider response validated; five linked ledger records committed, externally verified and removed.",
        },

        {
          id: "REAL_MODEL_ROLLBACK",
          expected:
            "Real provider response validated; five linked ledger records written inside BEGIN; controlled failure triggers ROLLBACK; zero records remain without explicit cleanup.",
        },
      ],

      warning:
        "POST performs two billable real model calls and temporary database writes. GET performs neither.",

      boundary: {
        legalCertification: false,
        technicalRuntimeTestOnly: true,
        provider: PROVIDER,
        api: "OPENAI_RESPONSES_API",
        requestStore: false,
        rawPromptPersisted: false,
        rawOutputPersisted: false,
        hashOnlyOperationalEvidence: true,
        modelCallInsideDatabaseTransaction: false,
        usesBeginCommitRollback: true,
        isolationLevel: "SERIALIZABLE",
        performsTwoRealModelCalls: true,
        createsPersistentBusinessData: false,
      },
    },
    {
      status: 200,

      headers: {
        "Cache-Control": "no-store",

        "X-HBCE-Real-Model-Transaction-Revision":
          REVISION,

        "X-HBCE-Legal-Certification": "false",
      },
    },
  );
}
