/**
 * MATRIX AI Audit Trail — EVT
 *
 * Minimal EVT builder for the MATRIX AI Audit Trail MVP.
 *
 * EVT records do not create legal certification by themselves.
 * They create a verifiable operational trace for AI-assisted document work.
 */

import { sha256Canonical } from "./hash";
import type {
  MatrixAiActionType,
  MatrixEvtRecord,
  MatrixHash,
  MatrixHumanValidationStatus,
  MatrixRiskClass,
  MatrixRuntimeDecision
} from "./types";

export type BuildMatrixEvtInput = {
  prev?: string;
  documentHash: MatrixHash;
  userIpr: string;
  action: MatrixAiActionType;
  riskClass: MatrixRiskClass;
  decision: MatrixRuntimeDecision;
  humanValidation: MatrixHumanValidationStatus;
  outputHash: MatrixHash;
  timestamp?: string;
};

export function buildMatrixEvt(input: BuildMatrixEvtInput): MatrixEvtRecord {
  const timestamp = input.timestamp || new Date().toISOString();
  const evt = buildMatrixEvtId(timestamp);
  const prev = input.prev?.trim() || "GENESIS";

  const eventWithoutHash = {
    evt,
    prev,
    timestamp,
    documentHash: input.documentHash,
    userIpr: input.userIpr,
    action: input.action,
    riskClass: input.riskClass,
    decision: input.decision,
    humanValidation: input.humanValidation,
    outputHash: input.outputHash,
    status: "VERIFIABLE" as const
  };

  const traceHash = sha256Canonical({
    type: "MATRIX_AI_AUDIT_TRAIL_EVT",
    ...eventWithoutHash
  });

  return {
    ...eventWithoutHash,
    traceHash
  };
}

export function verifyMatrixEvt(evt: MatrixEvtRecord): boolean {
  const rebuilt = sha256Canonical({
    type: "MATRIX_AI_AUDIT_TRAIL_EVT",
    evt: evt.evt,
    prev: evt.prev,
    timestamp: evt.timestamp,
    documentHash: evt.documentHash,
    userIpr: evt.userIpr,
    action: evt.action,
    riskClass: evt.riskClass,
    decision: evt.decision,
    humanValidation: evt.humanValidation,
    outputHash: evt.outputHash,
    status: evt.status
  });

  return rebuilt === evt.traceHash;
}

function buildMatrixEvtId(timestamp: string): string {
  const compactTimestamp = timestamp
    .replace(/\D/g, "")
    .slice(0, 14)
    .padEnd(14, "0");

  const entropy = buildPortableEntropy();

  return `EVT-${compactTimestamp}-${entropy}`;
}

function buildPortableEntropy(): string {
  const browserCrypto =
    typeof globalThis !== "undefined" ? globalThis.crypto : undefined;

  if (browserCrypto && typeof browserCrypto.randomUUID === "function") {
    return browserCrypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  }

  if (browserCrypto && typeof browserCrypto.getRandomValues === "function") {
    const bytes = new Uint8Array(4);
    browserCrypto.getRandomValues(bytes);

    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
  }

  return Math.random().toString(16).slice(2, 10).padEnd(8, "0").toUpperCase();
}
