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
  type OpcEventReference,
  type OpcIdentityBinding,
  type OpcMemoryReference,
  type OpcProofRecord,
  type OpcProofRecordInput,
  type OpcRuntimeSnapshot
} from "../../../lib/opc-proof";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type OpcApiPostBody = {
  identity?: Partial<OpcIdentityBinding>;
  sessionId?: string;
  event?: Partial<OpcEventReference>;
  memory?: Partial<OpcMemoryReference>;
  runtime?: Partial<OpcRuntimeSnapshot>;
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

const DEFAULT_OPC_LEDGER_FILE =
  process.env.JOKER_OPC_LEDGER_FILE ||
  path.join(tmpdir(), "hbce-ai-joker-c2-opc-proofs.jsonl");

const DEFAULT_IDENTITY: OpcIdentityBinding = {
  entity: "AI_JOKER",
  ipr: "IPR-AI-0001",
  core: "HBCE-CORE-v3",
  organization: "HERMETICUM B.C.E. S.r.l."
};

const DEFAULT_RUNTIME: OpcRuntimeSnapshot = {
  state: "OPERATIONAL",
  decision: "ALLOW",
  contextClass: "GENERAL",
  intentClass: "ASK",
  riskClass: "LOW",
  policyReference: "OPC_API_DIRECT_PROOF_REQUEST",
  policyOutcome: "PERMIT",
  humanOversight: "NOT_REQUIRED",
  operationType: "OPC_PROOF_CREATE",
  operationStatus: "COMPLETED"
};

function getLedgerPath(): string {
  return DEFAULT_OPC_LEDGER_FILE;
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

function normalizeIdentity(input?: Partial<OpcIdentityBinding>): OpcIdentityBinding {
  return {
    entity: input?.entity?.trim() || DEFAULT_IDENTITY.entity,
    ipr: input?.ipr?.trim() || DEFAULT_IDENTITY.ipr,
    core: input?.core?.trim() || DEFAULT_IDENTITY.core,
    organization: input?.organization?.trim() || DEFAULT_IDENTITY.organization
  };
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

function normalizeRuntime(input?: Partial<OpcRuntimeSnapshot>): OpcRuntimeSnapshot {
  return {
    state: input?.state || DEFAULT_RUNTIME.state,
    decision: input?.decision || DEFAULT_RUNTIME.decision,
    contextClass: input?.contextClass?.trim() || DEFAULT_RUNTIME.contextClass,
    intentClass: input?.intentClass?.trim() || DEFAULT_RUNTIME.intentClass,
    riskClass: input?.riskClass || DEFAULT_RUNTIME.riskClass,
    policyReference:
      input?.policyReference?.trim() || DEFAULT_RUNTIME.policyReference,
    policyOutcome: input?.policyOutcome?.trim() || DEFAULT_RUNTIME.policyOutcome,
    humanOversight: input?.humanOversight?.trim() || DEFAULT_RUNTIME.humanOversight,
    operationType: input?.operationType?.trim() || DEFAULT_RUNTIME.operationType,
    operationStatus:
      input?.operationStatus?.trim() || DEFAULT_RUNTIME.operationStatus
  };
}

async function buildProofInput(body: OpcApiPostBody): Promise<OpcProofRecordInput> {
  const previousProofHash =
    typeof body.previousProofHash === "string"
      ? body.previousProofHash
      : body.previousProofHash === null
        ? null
        : await getLastOpcProofHash();

  return {
    identity: normalizeIdentity(body.identity),
    sessionId: body.sessionId?.trim(),
    event: normalizeEvent(body.event),
    memory: normalizeMemory(body.memory),
    runtime: normalizeRuntime(body.runtime),
    inputPayload: body.inputPayload ?? null,
    outputPayload: body.outputPayload ?? null,
    previousProofHash,
    audit: body.audit,
    timestamp: body.timestamp
  };
}

function buildSummary(events: OpcProofRecord[], invalidLines: number) {
  const last = events[events.length - 1];

  return {
    totalProofs: events.length,
    invalidLines,
    lastProofId: last?.proofId ?? "GENESIS",
    lastChainHash: last?.proof.chainHash ?? "",
    lastEventId: last?.event.evt ?? "",
    lastAuditStatus: last?.audit.status ?? "UNVERIFIED"
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const proofId = searchParams.get("proofId");
    const limitParam = searchParams.get("limit");
    const limit =
      limitParam && Number.isFinite(Number(limitParam))
        ? Math.max(1, Math.min(Number(limitParam), 100))
        : 20;

    const ledger = await readOpcLedger();
    const summary = buildSummary(ledger.events, ledger.invalidLines);

    if (proofId) {
      const record = ledger.events.find((item) => item.proofId === proofId);

      if (!record) {
        return NextResponse.json(
          {
            ok: false,
            service: "AI JOKER-C2 OPC API",
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
        service: "AI JOKER-C2 OPC API",
        ledgerPath: ledger.ledgerPath,
        summary,
        proof: record,
        publicProof: toPublicOpcProofRecord(record),
        verification: verifyOpcProofRecord(record)
      });
    }

    const recent = ledger.events.slice(-limit);

    return NextResponse.json({
      ok: true,
      service: "AI JOKER-C2 OPC API",
      timestamp: new Date().toISOString(),
      ledgerPath: ledger.ledgerPath,
      summary,
      recentProofs: recent.map((record) => toPublicOpcProofRecord(record))
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "AI JOKER-C2 OPC API",
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
    return NextResponse.json(
      {
        ok: false,
        service: "AI JOKER-C2 OPC API",
        error: "INVALID_JSON_BODY"
      },
      { status: 400 }
    );
  }

  try {
    const proofInput = await buildProofInput(body);
    const record = createOpcProofRecord(proofInput);
    const appendResult = await appendOpcProofRecord(record);

    const statusCode = appendResult.ok ? 200 : 422;

    return NextResponse.json(
      {
        ok: appendResult.ok,
        service: "AI JOKER-C2 OPC API",
        proof: record,
        publicProof: toPublicOpcProofRecord(record),
        append: appendResult,
        verification: verifyOpcProofRecord(record)
      },
      { status: statusCode }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "AI JOKER-C2 OPC API",
        error:
          error instanceof Error
            ? error.message
            : "Unknown OPC proof creation failure."
      },
      { status: 500 }
    );
  }
}
