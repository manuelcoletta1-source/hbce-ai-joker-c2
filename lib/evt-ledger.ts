/**
 * AI JOKER-C2 EVT Ledger
 *
 * Append-only local JSONL ledger for HBCE / MATRIX runtime events.
 *
 * This module supports:
 * - append-only EVT persistence
 * - previous event reference lookup
 * - event reading
 * - event lookup by EVT ID
 * - chain verification
 * - public-safe ledger summaries
 *
 * Prototype note:
 * This file-based ledger is suitable for local and prototype use.
 * Controlled deployment may require database storage, access control,
 * signing, backup, retention rules and external review.
 */

import { mkdir, readFile, stat, writeFile, appendFile } from "fs/promises";
import path from "path";

import type {
  RuntimeEvent,
  VerificationStatus
} from "./runtime-types";

import {
  buildEventLine,
  isRuntimeEventHashValid,
  isRuntimeEventStructurallyValid,
  parseEventLine,
  summarizeRuntimeEvent
} from "./evt";

import {
  verifyRuntimeEvent,
  verifyRuntimeEventChain,
  type RuntimeEventBatchVerificationReport
} from "./evt-verify";

export const DEFAULT_LEDGER_DIR = path.join(process.cwd(), "ledger");
export const DEFAULT_LEDGER_FILE = path.join(DEFAULT_LEDGER_DIR, "events.jsonl");

export type LedgerAppendStatus =
  | "APPENDED"
  | "REJECTED"
  | "FAILED";

export type LedgerReadStatus =
  | "READY"
  | "EMPTY"
  | "MISSING"
  | "FAILED";

export type LedgerAppendResult = {
  status: LedgerAppendStatus;
  evt?: string;
  prev?: string;
  ledgerPath: string;
  reason: string;
};

export type LedgerReadResult = {
  status: LedgerReadStatus;
  ledgerPath: string;
  events: RuntimeEvent[];
  invalidLines: number;
  reason: string;
};

export type LedgerSummary = {
  ledgerPath: string;
  totalEvents: number;
  lastEvent: string;
  lastHash: string;
  verificationStatus: VerificationStatus;
  invalidLines: number;
};

export type LedgerLookupResult = {
  found: boolean;
  event?: RuntimeEvent;
  ledgerPath: string;
  reason: string;
};

export type LedgerIntegrityResult = {
  status: VerificationStatus;
  ledgerPath: string;
  totalEvents: number;
  invalidLines: number;
  hashValid: boolean;
  chainValid: boolean;
  warnings: string[];
  verification: RuntimeEventBatchVerificationReport;
};

export async function ensureLedger(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<void> {
  const directory = path.dirname(ledgerPath);

  await mkdir(directory, { recursive: true });

  try {
    await stat(ledgerPath);
  } catch {
    await writeFile(ledgerPath, "", "utf8");
  }
}

export async function appendEvent(
  event: RuntimeEvent,
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerAppendResult> {
  try {
    await ensureLedger(ledgerPath);

    if (!isRuntimeEventStructurallyValid(event)) {
      return {
        status: "REJECTED",
        evt: event.evt,
        prev: event.prev,
        ledgerPath,
        reason: "Runtime event is structurally invalid and was not appended."
      };
    }

    if (!isRuntimeEventHashValid(event)) {
      return {
        status: "REJECTED",
        evt: event.evt,
        prev: event.prev,
        ledgerPath,
        reason: "Runtime event hash is invalid and was not appended."
      };
    }

    const line = `${buildEventLine(event)}\n`;

    await appendFile(ledgerPath, line, "utf8");

    return {
      status: "APPENDED",
      evt: event.evt,
      prev: event.prev,
      ledgerPath,
      reason: "Runtime event appended to ledger."
    };
  } catch (error) {
    return {
      status: "FAILED",
      evt: event.evt,
      prev: event.prev,
      ledgerPath,
      reason:
        error instanceof Error
          ? error.message
          : "Unknown ledger append failure."
    };
  }
}

export async function appendEvents(
  events: RuntimeEvent[],
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerAppendResult[]> {
  const results: LedgerAppendResult[] = [];

  for (const event of events) {
    results.push(await appendEvent(event, ledgerPath));
  }

  return results;
}

export async function readEvents(
  limit?: number,
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<RuntimeEvent[]> {
  const result = await readLedger(ledgerPath);

  if (typeof limit === "number" && limit > 0) {
    return result.events.slice(-limit);
  }

  return result.events;
}

export async function readLedger(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerReadResult> {
  try {
    await ensureLedger(ledgerPath);

    const raw = await readFile(ledgerPath, "utf8");

    if (!raw.trim()) {
      return {
        status: "EMPTY",
        ledgerPath,
        events: [],
        invalidLines: 0,
        reason: "Ledger exists but contains no events."
      };
    }

    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const events: RuntimeEvent[] = [];
    let invalidLines = 0;

    for (const line of lines) {
      const event = parseEventLine(line);

      if (!event) {
        invalidLines += 1;
        continue;
      }

      events.push(event);
    }

    return {
      status: events.length > 0 ? "READY" : "EMPTY",
      ledgerPath,
      events,
      invalidLines,
      reason:
        invalidLines > 0
          ? "Ledger read completed with invalid lines."
          : "Ledger read completed."
    };
  } catch (error) {
    return {
      status: "FAILED",
      ledgerPath,
      events: [],
      invalidLines: 0,
      reason:
        error instanceof Error
          ? error.message
          : "Unknown ledger read failure."
    };
  }
}

export async function getLastEvent(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<RuntimeEvent | null> {
  const events = await readEvents(undefined, ledgerPath);

  if (events.length === 0) {
    return null;
  }

  return events[events.length - 1] ?? null;
}

export async function getLastEventReference(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<string> {
  const lastEvent = await getLastEvent(ledgerPath);

  return lastEvent?.evt ?? "GENESIS";
}

export async function getLastEventHash(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<string> {
  const lastEvent = await getLastEvent(ledgerPath);

  return lastEvent?.trace.hash ?? "";
}

export async function findEventById(
  evt: string,
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerLookupResult> {
  const normalizedEvt = evt.trim();

  if (!normalizedEvt) {
    return {
      found: false,
      ledgerPath,
      reason: "No EVT identifier was provided."
    };
  }

  const events = await readEvents(undefined, ledgerPath);
  const event = events.find((item) => item.evt === normalizedEvt);

  if (!event) {
    return {
      found: false,
      ledgerPath,
      reason: `Event ${normalizedEvt} was not found in the ledger.`
    };
  }

  return {
    found: true,
    event,
    ledgerPath,
    reason: `Event ${normalizedEvt} found.`
  };
}

export async function getEventById(
  evt: string,
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<RuntimeEvent | null> {
  const result = await findEventById(evt, ledgerPath);

  return result.event ?? null;
}

export async function verifyLedger(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerIntegrityResult> {
  const readResult = await readLedger(ledgerPath);
  const events = readResult.events;

  const verification = verifyRuntimeEventChain(events);

  const hashValid = events.every((event) => {
    const report = verifyRuntimeEvent({ event });
    return report.hashMatches === true && report.status === "VERIFIABLE";
  });

  const chainValid = verifyPreviousReferences(events);
  const warnings = [
    ...verification.warnings,
    ...buildLedgerWarnings(readResult.invalidLines, hashValid, chainValid)
  ];

  return {
    status: inferLedgerVerificationStatus({
      totalEvents: events.length,
      invalidLines: readResult.invalidLines,
      hashValid,
      chainValid,
      verificationStatus: verification.status
    }),
    ledgerPath,
    totalEvents: events.length,
    invalidLines: readResult.invalidLines,
    hashValid,
    chainValid,
    warnings: uniqueWarnings(warnings),
    verification
  };
}

export async function buildLedgerSummary(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<LedgerSummary> {
  const readResult = await readLedger(ledgerPath);
  const lastEvent = readResult.events[readResult.events.length - 1];
  const integrity = await verifyLedger(ledgerPath);

  return {
    ledgerPath,
    totalEvents: readResult.events.length,
    lastEvent: lastEvent?.evt ?? "GENESIS",
    lastHash: lastEvent?.trace.hash ?? "",
    verificationStatus: integrity.status,
    invalidLines: readResult.invalidLines
  };
}

export async function clearLedgerForLocalDevelopmentOnly(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<void> {
  await ensureLedger(ledgerPath);
  await writeFile(ledgerPath, "", "utf8");
}

export async function exportPublicLedgerView(
  limit?: number,
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<Array<ReturnType<typeof summarizeRuntimeEvent>>> {
  const events = await readEvents(limit, ledgerPath);

  return events.map((event) => summarizeRuntimeEvent(event));
}

export async function buildLedgerDiagnostics(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<Record<string, string | number | boolean>> {
  const summary = await buildLedgerSummary(ledgerPath);

  return {
    ledgerPath: summary.ledgerPath,
    totalEvents: summary.totalEvents,
    lastEvent: summary.lastEvent,
    lastHash: summary.lastHash,
    verificationStatus: summary.verificationStatus,
    invalidLines: summary.invalidLines
  };
}

function verifyPreviousReferences(events: RuntimeEvent[]): boolean {
  if (events.length <= 1) {
    return true;
  }

  for (let index = 1; index < events.length; index += 1) {
    const current = events[index];
    const previous = events[index - 1];

    if (!current || !previous) {
      return false;
    }

    if (current.prev !== previous.evt) {
      return false;
    }
  }

  return true;
}

function buildLedgerWarnings(
  invalidLines: number,
  hashValid: boolean,
  chainValid: boolean
): string[] {
  const warnings: string[] = [];

  if (invalidLines > 0) {
    warnings.push(`Ledger contains ${invalidLines} invalid line(s).`);
  }

  if (!hashValid) {
    warnings.push("One or more ledger event hashes are invalid.");
  }

  if (!chainValid) {
    warnings.push("Ledger previous-event continuity is invalid.");
  }

  return warnings;
}

function inferLedgerVerificationStatus(input: {
  totalEvents: number;
  invalidLines: number;
  hashValid: boolean;
  chainValid: boolean;
  verificationStatus: VerificationStatus;
}): VerificationStatus {
  if (input.totalEvents === 0) {
    return "UNVERIFIED";
  }

  if (input.invalidLines > 0 || !input.hashValid) {
    return "INVALID";
  }

  if (!input.chainValid || input.verificationStatus === "PARTIAL") {
    return "PARTIAL";
  }

  return input.verificationStatus;
}

function uniqueWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings.filter(Boolean)));
}
