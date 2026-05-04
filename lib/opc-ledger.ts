import { appendFile, mkdir, readFile, stat, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

import {
  buildOpcProofRecordLine,
  parseOpcProofRecordLine,
  verifyOpcProofRecord,
  type OpcProofRecord
} from "./opc-proof";

export type OpcAppendStatus = "APPENDED" | "REJECTED" | "FAILED";

export type OpcAppendResult = {
  ok: boolean;
  status: OpcAppendStatus;
  proofId?: string;
  ledgerPath: string;
  reason: string;
  verificationStatus?: string;
  alreadyPresent?: boolean;
};

export type OpcLedgerReadResult = {
  ok: boolean;
  ledgerPath: string;
  records: OpcProofRecord[];
  rejectedLines: number;
  reason: string;
};

export type OpcLedgerConfig = {
  ledgerFile?: string;
};

export const DEFAULT_OPC_LEDGER_FILE =
  process.env.JOKER_OPC_LEDGER_FILE ||
  path.join(tmpdir(), "hbce-ai-joker-c2-opc-proofs.jsonl");

function resolveOpcLedgerFile(config?: OpcLedgerConfig): string {
  return config?.ledgerFile || DEFAULT_OPC_LEDGER_FILE;
}

function getVerificationStatus(
  verification: ReturnType<typeof verifyOpcProofRecord>
): string {
  const maybe = verification as {
    status?: string;
  };

  return maybe.status || "UNKNOWN";
}

function getVerificationReason(
  verification: ReturnType<typeof verifyOpcProofRecord>
): string {
  const maybe = verification as {
    reason?: string;
    reasons?: string[];
    errors?: string[];
  };

  if (typeof maybe.reason === "string" && maybe.reason.trim()) {
    return maybe.reason.trim();
  }

  if (Array.isArray(maybe.reasons) && maybe.reasons.length > 0) {
    return maybe.reasons.join(" | ");
  }

  if (Array.isArray(maybe.errors) && maybe.errors.length > 0) {
    return maybe.errors.join(" | ");
  }

  return "No detailed verification reason returned.";
}

function isSameProofRecord(
  left: OpcProofRecord,
  right: OpcProofRecord
): boolean {
  return (
    left.proofId === right.proofId ||
    left.proof?.chainHash === right.proof?.chainHash
  );
}

function safeParseOpcProofRecordLine(line: string): OpcProofRecord | null {
  try {
    return parseOpcProofRecordLine(line);
  } catch {
    return null;
  }
}

export async function ensureOpcLedger(
  config?: OpcLedgerConfig
): Promise<string> {
  const ledgerPath = resolveOpcLedgerFile(config);
  const directory = path.dirname(ledgerPath);

  await mkdir(directory, { recursive: true });

  try {
    await stat(ledgerPath);
  } catch {
    await writeFile(ledgerPath, "", "utf8");
  }

  return ledgerPath;
}

export async function readOpcProofRecords(
  config?: OpcLedgerConfig
): Promise<OpcProofRecord[]> {
  const ledgerPath = await ensureOpcLedger(config);
  const raw = await readFile(ledgerPath, "utf8");

  if (!raw.trim()) {
    return [];
  }

  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => safeParseOpcProofRecordLine(line))
    .filter((record): record is OpcProofRecord => Boolean(record));
}

export async function readOpcLedger(
  config?: OpcLedgerConfig
): Promise<OpcLedgerReadResult> {
  try {
    const ledgerPath = await ensureOpcLedger(config);
    const raw = await readFile(ledgerPath, "utf8");

    if (!raw.trim()) {
      return {
        ok: true,
        ledgerPath,
        records: [],
        rejectedLines: 0,
        reason: "OPC ledger exists and is empty."
      };
    }

    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const records: OpcProofRecord[] = [];
    let rejectedLines = 0;

    for (const line of lines) {
      const record = safeParseOpcProofRecordLine(line);

      if (record) {
        records.push(record);
      } else {
        rejectedLines += 1;
      }
    }

    return {
      ok: true,
      ledgerPath,
      records,
      rejectedLines,
      reason:
        rejectedLines > 0
          ? `OPC ledger read with ${rejectedLines} rejected malformed line(s).`
          : "OPC ledger read successfully."
    };
  } catch (error) {
    return {
      ok: false,
      ledgerPath: resolveOpcLedgerFile(config),
      records: [],
      rejectedLines: 0,
      reason:
        error instanceof Error
          ? error.message
          : "Unknown OPC ledger read failure."
    };
  }
}

export async function getLastOpcProofHash(
  config?: OpcLedgerConfig
): Promise<string | null> {
  const records = await readOpcProofRecords(config);
  const last = records[records.length - 1];

  return last?.proof?.chainHash ?? null;
}

export async function hasOpcProofRecord(
  record: OpcProofRecord,
  config?: OpcLedgerConfig
): Promise<boolean> {
  const records = await readOpcProofRecords(config);

  return records.some((existing) => isSameProofRecord(existing, record));
}

export async function appendOpcProofRecord(
  record: OpcProofRecord,
  config?: OpcLedgerConfig
): Promise<OpcAppendResult> {
  const ledgerPath = resolveOpcLedgerFile(config);

  try {
    await ensureOpcLedger(config);

    const verification = verifyOpcProofRecord(record);
    const verificationStatus = getVerificationStatus(verification);

    if (verificationStatus !== "VERIFIABLE") {
      return {
        ok: false,
        status: "REJECTED",
        proofId: record.proofId,
        ledgerPath,
        verificationStatus,
        alreadyPresent: false,
        reason: [
          "OPC proof record rejected before append.",
          `VerificationStatus: ${verificationStatus}.`,
          `Reason: ${getVerificationReason(verification)}`
        ].join(" ")
      };
    }

    const alreadyPresent = await hasOpcProofRecord(record, config);

    if (alreadyPresent) {
      return {
        ok: true,
        status: "APPENDED",
        proofId: record.proofId,
        ledgerPath,
        verificationStatus,
        alreadyPresent: true,
        reason:
          "OPC proof record is verifiable and already present in the ledger. Append treated as idempotent success."
      };
    }

    await appendFile(
      ledgerPath,
      `${buildOpcProofRecordLine(record)}\n`,
      "utf8"
    );

    return {
      ok: true,
      status: "APPENDED",
      proofId: record.proofId,
      ledgerPath,
      verificationStatus,
      alreadyPresent: false,
      reason:
        "OPC proof record is verifiable and was appended to the chat runtime ledger."
    };
  } catch (error) {
    return {
      ok: false,
      status: "FAILED",
      proofId: record.proofId,
      ledgerPath,
      verificationStatus: "UNKNOWN",
      alreadyPresent: false,
      reason:
        error instanceof Error
          ? `OPC ledger append failed: ${error.message}`
          : "OPC ledger append failed with unknown storage error."
    };
  }
}

export function explainOpcAppendState(input: {
  verificationStatus: string;
  appendStatus: OpcAppendStatus;
  appendReason: string;
}): string {
  if (
    input.verificationStatus === "VERIFIABLE" &&
    input.appendStatus === "APPENDED"
  ) {
    return "VERIFIABLE + APPENDED = catena accettata.";
  }

  if (
    input.verificationStatus !== "VERIFIABLE" &&
    input.appendStatus === "REJECTED"
  ) {
    return "NOT_VERIFIABLE + REJECTED = prova tecnicamente non accettata.";
  }

  if (
    input.verificationStatus === "VERIFIABLE" &&
    input.appendStatus === "FAILED"
  ) {
    return "VERIFIABLE + FAILED = prova valida ma append non riuscito per errore di storage.";
  }

  if (
    input.verificationStatus === "VERIFIABLE" &&
    input.appendStatus === "REJECTED"
  ) {
    return [
      "VERIFIABLE + REJECTED = stato anomalo.",
      "Questo stato deve essere eliminato o spiegato da una policy di append esplicita.",
      `Reason: ${input.appendReason}`
    ].join(" ");
  }

  return [
    "OPC append state non standard.",
    `VerificationStatus: ${input.verificationStatus}.`,
    `AppendStatus: ${input.appendStatus}.`,
    `Reason: ${input.appendReason}`
  ].join(" ");
}
