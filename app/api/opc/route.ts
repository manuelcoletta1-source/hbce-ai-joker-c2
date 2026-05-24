/**
 * AI JOKER-C2 OPC API
 *
 * OPC = Operational Proof & Compliance Layer.
 *
 * This endpoint creates, reads and verifies OPC proof records.
 *
 * Prototype storage:
 * - local JSONL ledger;
 * - /tmp on Vercel/serverless by default;
 * - configurable with JOKER_OPC_LEDGER_FILE.
 *
 * Production storage should be moved to persistent external storage:
 * Postgres, KV, object storage, append-only database or controlled audit store.
 *
 * OpenAI provides the cognitive engine.
 * HBCE / AI JOKER-C2 provides identity, governance, event continuity,
 * proof generation and audit-ready traceability.
 */

import { appendFile, mkdir, readFile, stat, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

import { NextRequest, NextResponse } from "next/server";

import {
  buildOpcProofRecordLine,
  createOpcProofRecord,
  parseOpcProofRecordLine,
  toPublicOpcProofRecord,
  verifyOpcProofRecord,
  type OpcAuditFrame,
  type OpcEngineSnapshot,
  type OpcEventReference,
  type OpcIdentityBinding,
  type OpcMemoryReference,
  type OpcProofRecord,
  type OpcProofRecordInput,
  type OpcRuntimeSnapshot
} from "../../../lib/opc-proof";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpenAIEngineMode = "standard" | "deep";

type OpenAIEngineSnapshot = OpcEngineSnapshot & {
  provider: "OpenAI";
  apiMode: "chat.completions";
  role: "cognitive_engine";
  runtimeRole: "HBCE_governed_runtime";
  modelUsed: string;
  standardModel: string;
  deepModel: string;
  mode: OpenAIEngineMode;
  configured: boolean;
  projectBirthDate: "2026-01-19";
  projectBirthLabel: "HBCE R&D / AI JOKER-C2 project birth date";
};

type OpcApiPostBody = {
  identity?: Partial<OpcIdentityBinding> & {
    runtimeRole?: string;
  };
  sessionId?: string;
  event?: Partial<OpcEventReference>;
  memory?: Partial<OpcMemoryReference>;
  runtime?: Partial<OpcRuntimeSnapshot> & {
    projectDomain?: string;
    hbceModule?: string;
    failClosed?: boolean;
  };
  engine?: Partial<OpenAIEngineSnapshot>;
  inputPayload?: unknown;
  outputPayload?: unknown;
  previousProofHash?: string | null;
  audit?: Partial<OpcAuditFrame>;
  timestamp?: string;
};

type OpcLedgerReadResult = {
  events: OpcProofRecord[];
  invalidLines: number;
  ledgerPath: string;
};

type OpcApiSummary = {
  totalProofs: number;
  invalidLines: number;
  lastProofId: string;
  lastChainHash: string;
  lastEventId: string;
  lastAuditStatus: string;
  currentEngine: OpenAIEngineSnapshot;
  lastProofEngine?: OpcEngineSnapshot;
  lastProofEngineHash?: string;
};

const DEFAULT_OPC_LEDGER_FILE =
  process.env.JOKER_OPC_LEDGER_FILE ||
  path.join(tmpdir(), "hbce-ai-joker-c2-opc-proofs.jsonl");

const DEFAULT_JOKER_MODEL = "gpt-5.5";
const DEFAULT_JOKER_DEEP_MODEL = "gpt-5.5";

const DEFAULT_ENGINE_PROVIDER = "OpenAI" as const;
const DEFAULT_ENGINE_API_MODE = "chat.completions" as const;
const DEFAULT_ENGINE_ROLE = "cognitive_engine" as const;
const DEFAULT_ENGINE_RUNTIME_ROLE = "HBCE_governed_runtime" as const;
const DEFAULT_PROJECT_BIRTH_DATE = "2026-01-19" as const;
const DEFAULT_PROJECT_BIRTH_LABEL =
  "HBCE R&D / AI JOKER-C2 project birth date" as const;

const DEFAULT_IDENTITY = {
  entity: "AI_JOKER",
  ipr: "IPR-AI-0001",
  core: "HBCE-CORE-v3",
  organization: "HERMETICUM B.C.E. S.r.l.",
  runtimeRole: "IPR_RUNTIME_DEMONSTRATOR"
} as OpcIdentityBinding & {
  runtimeRole?: string;
};

const DEFAULT_RUNTIME = {
  state: "OPERATIONAL",
  decision: "ALLOW",
  contextClass: "GENERAL",
  intentClass: "ASK",
  projectDomain: "MATRIX",
  hbceModule: "OPC",
  riskClass: "LOW",
  policyReference: "OPC_API_DIRECT_PROOF_REQUEST",
  policyOutcome: "PERMIT",
  humanOversight: "NOT_REQUIRED",
  operationType: "OPC_PROOF_CREATE",
  operationStatus: "COMPLETED",
  failClosed: false
} as OpcRuntimeSnapshot & {
  projectDomain?: string;
  hbceModule?: string;
  failClosed?: boolean;
};

function resolveModelEnv(name: string, fallback: string): string {
  const value = process.env[name];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
}

function getLedgerPath(): string {
  return DEFAULT_OPC_LEDGER_FILE;
}

function resolveOpenAIEngineSnapshot(
  input?: Partial<OpenAIEngineSnapshot>
): OpenAIEngineSnapshot {
  const standardModel =
    input?.standardModel?.trim() ||
    resolveModelEnv("JOKER_MODEL", DEFAULT_JOKER_MODEL);

  const deepModel =
    input?.deepModel?.trim() ||
    resolveModelEnv("JOKER_DEEP_MODEL", DEFAULT_JOKER_DEEP_MODEL);

  const mode: OpenAIEngineMode =
    input?.mode === "standard" || input?.mode === "deep"
      ? input.mode
      : "deep";

  const modelUsed =
    input?.modelUsed?.trim() || (mode === "deep" ? deepModel : standardModel);

  return {
    provider: DEFAULT_ENGINE_PROVIDER,
    apiMode: DEFAULT_ENGINE_API_MODE,
    role: DEFAULT_ENGINE_ROLE,
    runtimeRole: DEFAULT_ENGINE_RUNTIME_ROLE,
    modelUsed,
    standardModel,
    deepModel,
    mode,
    configured:
      typeof input?.configured === "boolean"
        ? input.configured
        : Boolean(process.env.OPENAI_API_KEY),
    projectBirthDate: DEFAULT_PROJECT_BIRTH_DATE,
    projectBirthLabel: DEFAULT_PROJECT_BIRTH_LABEL
  };
}

function buildOpcApiMetadata(currentEngine: OpenAIEngineSnapshot) {
  return {
    service: "AI JOKER-C2 OPC API",
    layer: "OPC_OPERATIONAL_PROOF_AND_COMPLIANCE",
    runtime: "AI_JOKER_C2",
    runtimeRole: "IPR_RUNTIME_DEMONSTRATOR",
    governedRuntimeRole: currentEngine.runtimeRole,
    primaryProduct: "IPR",
    organization: "HERMETICUM B.C.E. S.r.l.",
    currentEngine,
    boundary: {
      legalCertification: false,
      automaticCompliance: false,
      officialInstitutionalRecognition: false,
      productionStorageRequired: true,
      prototypeStorage: "local JSONL ledger; /tmp on Vercel/serverless by default",
      dataRule:
        "Use synthetic, public or authorized data only. Do not store secrets, identity documents, private credentials or sensitive payloads in the prototype ledger."
    }
  };
}

function normalizeAuditFrame(
  audit: Partial<OpcAuditFrame> | undefined,
  engine: OpenAIEngineSnapshot
): Partial<OpcAuditFrame> {
  const baseReasons = Array.isArray(audit?.reasons) ? audit.reasons : [];

  return {
    ...audit,
    reasons: [
      ...baseReasons,
      `Cognitive engine provider: ${engine.provider}`,
      `Cognitive engine model: ${engine.modelUsed}`,
      `Cognitive engine API mode: ${engine.apiMode}`,
      `HBCE governed runtime role: ${engine.runtimeRole}`,
      `Project birth date: ${engine.projectBirthDate}`,
      "OPC proof receipt is technical and audit-oriented; it is not automatic legal certification."
    ]
  };
}

async function ensureOpcLedger(ledgerPath = getLedgerPath()): Promise<void> {
  const directory = path.dirname(ledgerPath);

  await mkdir(directory, { recursive: true });

  try {
    await stat(ledgerPath);
  } catch {
    await writeFile(ledgerPath, "", "utf8");
  }
}

async function readOpcLedger(
  ledgerPath = getLedgerPath()
): Promise<OpcLedgerReadResult> {
  await ensureOpcLedger(ledgerPath);

  const raw = await readFile(ledgerPath, "utf8");

  if (!raw.trim()) {
    return {
      events: [],
      invalidLines: 0,
      ledgerPath
    };
  }

  const lines = raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const events: OpcProofRecord[] = [];
  let invalidLines = 0;

  for (const line of lines) {
    const event = parseOpcProofRecordLine(line);

    if (!event) {
      invalidLines += 1;
      continue;
    }

    events.push(event);
  }

  return {
    events,
    invalidLines,
    ledgerPath
  };
}

async function appendOpcProofRecord(
  record: OpcProofRecord,
  ledgerPath = getLedgerPath()
) {
  await ensureOpcLedger(ledgerPath);

  const verification = verifyOpcProofRecord(record);

  if (verification.status !== "VERIFIABLE") {
    return {
      ok: false,
      status: "REJECTED",
      proofId: record.proofId,
      ledgerPath,
      reason: "OPC proof record is not verifiable and was not appended.",
      verification
    };
  }

  await appendFile(ledgerPath, `${buildOpcProofRecordLine(record)}\n`, "utf8");

  return {
    ok: true,
    status: "APPENDED",
    proofId: record.proofId,
    ledgerPath,
    reason: "OPC proof record appended.",
    verification
  };
}

async function getLastOpcProofRecord(): Promise<OpcProofRecord | null> {
  const ledger = await readOpcLedger();
  return ledger.events[ledger.events.length - 1] ?? null;
}

async function getLastOpcProofHash(): Promise<string | null> {
  const last = await getLastOpcProofRecord();
  return last?.proof.chainHash ?? null;
}

function normalizeIdentity(input?: OpcApiPostBody["identity"]): OpcIdentityBinding {
  const normalized = {
    entity: input?.entity?.trim() || DEFAULT_IDENTITY.entity,
    ipr: input?.ipr?.trim() || DEFAULT_IDENTITY.ipr,
    core: input?.core?.trim() || DEFAULT_IDENTITY.core,
    organization: input?.organization?.trim() || DEFAULT_IDENTITY.organization,
    runtimeRole:
      input?.runtimeRole?.trim() ||
      DEFAULT_IDENTITY.runtimeRole ||
      "IPR_RUNTIME_DEMONSTRATOR"
  };

  return normalized as OpcIdentityBinding;
}

function normalizeEvent(input?: Partial<OpcEventReference>): OpcEventReference {
  return {
    evt: input?.evt?.trim() || `EVT-OPC-DIRECT-${Date.now()}`,
    prev: input?.prev?.trim() || "GENESIS",
    hash: input?.hash?.trim() || "sha256:unbound_direct_opc_event",
    kind: input?.kind?.trim() || "OPC_DIRECT_EVENT_REFERENCE"
  };
}

function normalizeMemory(
  input?: Partial<OpcMemoryReference>
): OpcMemoryReference | undefined {
  if (!input?.evt?.trim()) {
    return undefined;
  }

  return {
    evt: input.evt.trim(),
    source: input.source?.trim(),
    hash: input.hash?.trim()
  };
}

function normalizeRuntime(input?: OpcApiPostBody["runtime"]): OpcRuntimeSnapshot {
  const normalized = {
    state: input?.state || DEFAULT_RUNTIME.state,
    decision: input?.decision || DEFAULT_RUNTIME.decision,
    contextClass: input?.contextClass?.trim() || DEFAULT_RUNTIME.contextClass,
    intentClass: input?.intentClass?.trim() || DEFAULT_RUNTIME.intentClass,
    projectDomain:
      input?.projectDomain?.trim() || DEFAULT_RUNTIME.projectDomain || "MATRIX",
    hbceModule:
      input?.hbceModule?.trim() || DEFAULT_RUNTIME.hbceModule || "OPC",
    riskClass: input?.riskClass || DEFAULT_RUNTIME.riskClass,
    policyReference:
      input?.policyReference?.trim() || DEFAULT_RUNTIME.policyReference,
    policyOutcome: input?.policyOutcome?.trim() || DEFAULT_RUNTIME.policyOutcome,
    humanOversight: input?.humanOversight?.trim() || DEFAULT_RUNTIME.humanOversight,
    operationType: input?.operationType?.trim() || DEFAULT_RUNTIME.operationType,
    operationStatus:
      input?.operationStatus?.trim() || DEFAULT_RUNTIME.operationStatus,
    failClosed:
      typeof input?.failClosed === "boolean"
        ? input.failClosed
        : DEFAULT_RUNTIME.failClosed
  };

  return normalized as OpcRuntimeSnapshot;
}

async function buildProofInput(body: OpcApiPostBody): Promise<{
  proofInput: OpcProofRecordInput;
  engine: OpenAIEngineSnapshot;
}> {
  const engine = resolveOpenAIEngineSnapshot(body.engine);

  const previousProofHash =
    typeof body.previousProofHash === "string"
      ? body.previousProofHash
      : body.previousProofHash === null
        ? null
        : await getLastOpcProofHash();

  return {
    engine,
    proofInput: {
      identity: normalizeIdentity(body.identity),
      sessionId: body.sessionId?.trim(),
      engine,
      event: normalizeEvent(body.event),
      memory: normalizeMemory(body.memory),
      runtime: normalizeRuntime(body.runtime),
      inputPayload: body.inputPayload ?? null,
      outputPayload: body.outputPayload ?? null,
      previousProofHash,
      audit: normalizeAuditFrame(body.audit, engine),
      timestamp: body.timestamp
    }
  };
}

function buildSummary(
  events: OpcProofRecord[],
  invalidLines: number,
  currentEngine: OpenAIEngineSnapshot
): OpcApiSummary {
  const last = events[events.length - 1];

  return {
    totalProofs: events.length,
    invalidLines,
    lastProofId: last?.proofId ?? "GENESIS",
    lastChainHash: last?.proof.chainHash ?? "",
    lastEventId: last?.event.evt ?? "",
    lastAuditStatus: last?.audit.status ?? "UNVERIFIED",
    currentEngine,
    lastProofEngine: last?.engine,
    lastProofEngineHash: last?.proof.engineHash
  };
}

function buildProofResponse(record: OpcProofRecord) {
  return {
    proof: record,
    publicProof: toPublicOpcProofRecord(record),
    verification: verifyOpcProofRecord(record),
    recordEngine: record.engine ?? null,
    recordEngineHash: record.proof.engineHash ?? null
  };
}

function buildRecentProofView(record: OpcProofRecord) {
  return {
    ...toPublicOpcProofRecord(record),
    recordEngine: record.engine ?? null,
    recordEngineHash: record.proof.engineHash ?? null
  };
}

export async function GET(req: NextRequest) {
  const currentEngine = resolveOpenAIEngineSnapshot();

  try {
    const { searchParams } = new URL(req.url);
    const proofId = searchParams.get("proofId");
    const limitParam = searchParams.get("limit");
    const limit =
      limitParam && Number.isFinite(Number(limitParam))
        ? Math.max(1, Math.min(Number(limitParam), 100))
        : 20;

    const ledger = await readOpcLedger();
    const summary = buildSummary(ledger.events, ledger.invalidLines, currentEngine);
    const metadata = buildOpcApiMetadata(currentEngine);

    if (proofId) {
      const record = ledger.events.find((item) => item.proofId === proofId);

      if (!record) {
        return NextResponse.json(
          {
            ok: false,
            ...metadata,
            error: "OPC_PROOF_NOT_FOUND",
            proofId,
            ledgerPath: ledger.ledgerPath,
            summary
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        ok: true,
        ...metadata,
        ledgerPath: ledger.ledgerPath,
        summary,
        ...buildProofResponse(record)
      });
    }

    const recent = ledger.events.slice(-limit);

    return NextResponse.json({
      ok: true,
      ...metadata,
      timestamp: new Date().toISOString(),
      ledgerPath: ledger.ledgerPath,
      summary,
      recentProofs: recent.map((record) => buildRecentProofView(record))
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        ...buildOpcApiMetadata(currentEngine),
        error:
          error instanceof Error
            ? error.message
            : "Unknown OPC API read failure."
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: OpcApiPostBody;

  try {
    body = (await req.json()) as OpcApiPostBody;
  } catch {
    const currentEngine = resolveOpenAIEngineSnapshot();

    return NextResponse.json(
      {
        ok: false,
        ...buildOpcApiMetadata(currentEngine),
        error: "INVALID_JSON_BODY"
      },
      { status: 400 }
    );
  }

  const fallbackEngine = resolveOpenAIEngineSnapshot(body.engine);

  try {
    const { proofInput, engine } = await buildProofInput(body);
    const record = createOpcProofRecord(proofInput);
    const appendResult = await appendOpcProofRecord(record);

    const statusCode = appendResult.ok ? 200 : 422;

    return NextResponse.json(
      {
        ok: appendResult.ok,
        ...buildOpcApiMetadata(engine),
        ...buildProofResponse(record),
        append: appendResult
      },
      { status: statusCode }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        ...buildOpcApiMetadata(fallbackEngine),
        error:
          error instanceof Error
            ? error.message
            : "Unknown OPC proof creation failure."
      },
      { status: 500 }
    );
  }
}
