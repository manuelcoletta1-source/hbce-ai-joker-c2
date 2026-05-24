/**
 * AI JOKER-C2 EVT Ledger
 *
 * Append-only JSONL ledger for HBCE / MATRIX runtime events.
 *
 * This module supports:
 * - append-only EVT persistence
 * - previous event reference lookup
 * - previous event hash lookup
 * - event reading
 * - event lookup by EVT ID
 * - chain verification
 * - public-safe ledger summaries
 * - compatibility with OPC proof receipts
 *
 * Prototype note:
 * This file-based ledger is suitable for local and prototype use.
 * Controlled deployment may require database storage, access control,
 * signing, backup, retention rules and external review.
 *
 * Serverless note:
 * On Vercel/serverless runtimes, local filesystem persistence may fail or
 * reset between invocations. In that case, append failures should not make
 * event generation unverifiable; they should be reported as persistence
 * failures while the generated event hash remains independently verifiable.
 *
 * EVT creates traceability.
 * OPC creates the audit-oriented proof receipt.
 *
 * EVT does not create legal authorization, certification or compliance.
 */

import { appendFile, mkdir, readFile, stat, writeFile } from "fs/promises";
import os from "os";
import path from "path";

import type { RuntimeEvent, VerificationStatus } from "./runtime-types";

import {
  buildEventChainReference,
  buildEventLine,
  isRuntimeEventHashValid,
  isRuntimeEventStructurallyValid,
  parseEventLine,
  summarizeRuntimeEvent,
  verifyRuntimeEvent
} from "./evt";

import {
  verifyRuntimeEventChain,
  type RuntimeEventBatchVerificationReport
} from "./evt-verify";

const DEFAULT_LEDGER_FILENAME = "hbce-ai-joker-c2-events.jsonl";

export const DEFAULT_LEDGER_DIR =
  process.env.JOKER_EVT_LEDGER_DIR ||
  process.env.HBCE_EVT_LEDGER_DIR ||
  path.join(os.tmpdir(), "hbce-ai-joker-c2");

export const DEFAULT_LEDGER_FILE =
  process.env.JOKER_EVT_LEDGER_FILE ||
  process.env.HBCE_EVT_LEDGER_FILE ||
  path.join(DEFAULT_LEDGER_DIR, DEFAULT_LEDGER_FILENAME);

export type LedgerAppendStatus = "APPENDED" | "REJECTED" | "FAILED";

export type LedgerReadStatus = "READY" | "EMPTY" | "MISSING" | "FAILED";

export type LedgerAppendResult = {
  ok: boolean;
  status: LedgerAppendStatus;
  evt?: string;
  prev?: string;
  hash?: string;
  chainReference?: string;
  ledgerPath: string;
  reason: string;
  verificationStatus?: VerificationStatus;
  alreadyPresent?: boolean;
};

export type LedgerReadResult = {
  ok: boolean;
  status: LedgerReadStatus;
  ledgerPath: string;
  events: RuntimeEvent[];
  invalidLines: number;
  summary: LedgerSummary;
  reason: string;
};

export type LedgerSummary = {
  ledgerPath: string;
  totalEvents: number;
  lastEvent: string;
  lastPrev: string;
  lastHash: string;
  lastChainReference: string;
  lastProjectDomain: string;
  lastHbceModule: string;
  verificationStatus: VerificationStatus;
  invalidLines: number;
  hashValid: boolean;
  chainValid: boolean;
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

export type EventReference = {
  evt: string;
  prev: string;
  hash: string;
  chainReference: string;
  projectDomain: string;
  hbceModule: string;
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

    const verification = verifyRuntimeEvent(event);

    if (!isRuntimeEventStructurallyValid(event)) {
      return {
        ok: false,
        status: "REJECTED",
        evt: event.evt,
        prev: event.prev,
        hash: event.trace?.hash,
        chainReference: safeEventChainReference(event),
        ledgerPath,
        verificationStatus: verification.status,
        alreadyPresent: false,
        reason: [
          "Runtime event is structurally invalid and was not appended.",
          verification.reasons.join(" ")
        ].join(" ")
      };
    }

    if (!isRuntimeEventHashValid(event)) {
      return {
        ok: false,
        status: "REJECTED",
        evt: event.evt,
        prev: event.prev,
        hash: event.trace?.hash,
        chainReference: safeEventChainReference(event),
        ledgerPath,
        verificationStatus: verification.status,
        alreadyPresent: false,
        reason: [
          "Runtime event hash is invalid and was not appended.",
          `ExpectedHash: ${verification.expectedHash || "unavailable"}.`,
          `ActualHash: ${verification.actualHash || "unavailable"}.`
        ].join(" ")
      };
    }

    const existing = await readLedger(ledgerPath);

    if (existing.status === "FAILED") {
      return {
        ok: false,
        status: "FAILED",
        evt: event.evt,
        prev: event.prev,
        hash: event.trace.hash,
        chainReference: buildEventChainReference(event),
        ledgerPath,
        verificationStatus: verification.status,
        alreadyPresent: false,
        reason: `Ledger read failed before append: ${existing.reason}`
      };
    }

    const alreadyPresent = existing.events.some((item) =>
      isSameRuntimeEvent(item, event)
    );

    if (alreadyPresent) {
      return {
        ok: true,
        status: "APPENDED",
        evt: event.evt,
        prev: event.prev,
        hash: event.trace.hash,
        chainReference: buildEventChainReference(event),
        ledgerPath,
        verificationStatus: verification.status,
        alreadyPresent: true,
        reason:
          "Runtime event is already present in the EVT ledger. Append treated as idempotent success."
      };
    }

    const continuity = validateAppendContinuity(existing.events, event);

    if (!continuity.ok) {
      return {
        ok: false,
        status: "REJECTED",
        evt: event.evt,
        prev: event.prev,
        hash: event.trace.hash,
        chainReference: buildEventChainReference(event),
        ledgerPath,
        verificationStatus: verification.status,
        alreadyPresent: false,
        reason: continuity.reason
      };
    }

    const line = `${buildEventLine(event)}\n`;

    await appendFile(ledgerPath, line, "utf8");

    return {
      ok: true,
      status: "APPENDED",
      evt: event.evt,
      prev: event.prev,
      hash: event.trace.hash,
      chainReference: buildEventChainReference(event),
      ledgerPath,
      verificationStatus: verification.status,
      alreadyPresent: false,
      reason: continuity.reason || "Runtime event appended to ledger."
    };
  } catch (error) {
    return {
      ok: false,
      status: "FAILED",
      evt: event.evt,
      prev: event.prev,
      hash: event.trace?.hash,
      chainReference: safeEventChainReference(event),
      ledgerPath,
      verificationStatus: "UNVERIFIED",
      alreadyPresent: false,
      reason:
        error instanceof Error
          ? `EVT ledger append failed: ${error.message}`
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
        ok: true,
        status: "EMPTY",
        ledgerPath,
        events: [],
        invalidLines: 0,
        summary: buildStaticLedgerSummary({
          ledgerPath,
          events: [],
          invalidLines: 0,
          verificationStatus: "UNVERIFIED",
          hashValid: true,
          chainValid: true
        }),
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

    const hashValid = events.every((event) => isRuntimeEventHashValid(event));
    const chainValid = verifyPreviousReferences(events);

    return {
      ok: true,
      status: events.length > 0 ? "READY" : "EMPTY",
      ledgerPath,
      events,
      invalidLines,
      summary: buildStaticLedgerSummary({
        ledgerPath,
        events,
        invalidLines,
        verificationStatus: inferLedgerVerificationStatus({
          totalEvents: events.length,
          invalidLines,
          hashValid,
          chainValid,
          verificationStatus:
            events.length > 0 && invalidLines === 0 && hashValid && chainValid
              ? "VERIFIABLE"
              : "PARTIAL"
        }),
        hashValid,
        chainValid
      }),
      reason:
        invalidLines > 0
          ? "Ledger read completed with invalid lines."
          : "Ledger read completed."
    };
  } catch (error) {
    return {
      ok: false,
      status: "FAILED",
      ledgerPath,
      events: [],
      invalidLines: 0,
      summary: buildStaticLedgerSummary({
        ledgerPath,
        events: [],
        invalidLines: 0,
        verificationStatus: "INVALID",
        hashValid: false,
        chainValid: false
      }),
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

export async function getLastEventChainReference(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<string> {
  const lastEvent = await getLastEvent(ledgerPath);

  return lastEvent ? buildEventChainReference(lastEvent) : "GENESIS";
}

export async function getLastEventReferenceObject(
  ledgerPath = DEFAULT_LEDGER_FILE
): Promise<EventReference | null> {
  const lastEvent = await getLastEvent(ledgerPath);

  if (!lastEvent) {
    return null;
  }

  const summary = summarizeRuntimeEvent(lastEvent);

  return {
    evt: lastEvent.evt,
    prev: lastEvent.prev,
    hash: lastEvent.trace.hash,
    chainReference: buildEventChainReference(lastEvent),
    projectDomain: summary.projectDomain,
    hbceModule: summary.hbceModule
  };
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

  if (readResult.status === "FAILED") {
    const verification = verifyRuntimeEventChain([]);

    return {
      status: "INVALID",
      ledgerPath,
      totalEvents: 0,
      invalidLines: 0,
      hashValid: false,
      chainValid: false,
      warnings: [`Ledger could not be read: ${readResult.reason}`],
      verification
    };
  }

  const verification = verifyRuntimeEventChain(events);

  const hashValid = events.every((event) => {
    const report = verifyRuntimeEvent(event);
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
  const integrity = await verifyLedger(ledgerPath);

  return buildStaticLedgerSummary({
    ledgerPath,
    events: readResult.events,
    invalidLines: readResult.invalidLines,
    verificationStatus: integrity.status,
    hashValid: integrity.hashValid,
    chainValid: integrity.chainValid
  });
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
    lastPrev: summary.lastPrev,
    lastHash: summary.lastHash,
    lastChainReference: summary.lastChainReference,
    lastProjectDomain: summary.lastProjectDomain,
    lastHbceModule: summary.lastHbceModule,
    verificationStatus: summary.verificationStatus,
    invalidLines: summary.invalidLines,
    hashValid: summary.hashValid,
    chainValid: summary.chainValid
  };
}

function buildStaticLedgerSummary(input: {
  ledgerPath: string;
  events: RuntimeEvent[];
  invalidLines: number;
  verificationStatus: VerificationStatus;
  hashValid: boolean;
  chainValid: boolean;
}): LedgerSummary {
  const lastEvent = input.events[input.events.length - 1] ?? null;
  const lastSummary = lastEvent ? summarizeRuntimeEvent(lastEvent) : null;

  return {
    ledgerPath: input.ledgerPath,
    totalEvents: input.events.length,
    lastEvent: lastEvent?.evt ?? "GENESIS",
    lastPrev: lastEvent?.prev ?? "",
    lastHash: lastEvent?.trace.hash ?? "",
    lastChainReference: lastEvent ? buildEventChainReference(lastEvent) : "GENESIS",
    lastProjectDomain: lastSummary?.projectDomain ?? "GENERAL",
    lastHbceModule: lastSummary?.hbceModule ?? "NONE",
    verificationStatus: input.verificationStatus,
    invalidLines: input.invalidLines,
    hashValid: input.hashValid,
    chainValid: input.chainValid
  };
}

function validateAppendContinuity(
  events: RuntimeEvent[],
  nextEvent: RuntimeEvent
): { ok: boolean; reason: string } {
  if (!nextEvent.prev || !nextEvent.prev.trim()) {
    return {
      ok: false,
      reason: "Append continuity rejected: next event has no previous reference."
    };
  }

  if (events.length === 0) {
    return {
      ok: true,
      reason:
        nextEvent.prev === "GENESIS"
          ? "First event references GENESIS."
          : `First event references external runtime anchor ${nextEvent.prev}.`
    };
  }

  const lastEvent = events[events.length - 1];

  if (!lastEvent) {
    return {
      ok: false,
      reason: "Append continuity rejected: last ledger event is unavailable."
    };
  }

  if (nextEvent.prev !== lastEvent.evt) {
    return {
      ok: false,
      reason:
        `Append continuity rejected: next prev=${nextEvent.prev} does not match last evt=${lastEvent.evt}.`
    };
  }

  return {
    ok: true,
    reason: "Append continuity OK."
  };
}

function verifyPreviousReferences(events: RuntimeEvent[]): boolean {
  if (events.length === 0) {
    return true;
  }

  if (!events[0]?.prev) {
    return false;
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

  warnings.push(
    "EVT ledger is a technical traceability layer and does not create legal certification by itself."
  );

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

function isSameRuntimeEvent(left: RuntimeEvent, right: RuntimeEvent): boolean {
  return (
    left.evt === right.evt ||
    left.trace?.hash === right.trace?.hash ||
    buildEventChainReference(left) === buildEventChainReference(right)
  );
}

function safeEventChainReference(event: Partial<RuntimeEvent>): string {
  if (event.evt && event.trace?.hash) {
    return `${event.evt}:${event.trace.hash}`;
  }

  return event.evt || "UNKNOWN_EVT";
}

function uniqueWarnings(warnings: string[]): string[] {
  return Array.from(new Set(warnings.filter(Boolean)));
}
