/**
 * MATRIX AI Audit Trail — OPC
 *
 * Minimal OPC proof builder for the MATRIX AI Audit Trail MVP.
 *
 * OPC records do not create legal certification by themselves.
 * They create a technical operational proof linked to an EVT event.
 */

import { sha256Canonical } from "./hash";
import type { MatrixEvtRecord, MatrixOpcRecord } from "./types";

export type BuildMatrixOpcInput = {
  evt: MatrixEvtRecord;
  createdAt?: string;
};

export function buildMatrixOpc(input: BuildMatrixOpcInput): MatrixOpcRecord {
  const createdAt = input.createdAt || new Date().toISOString();
  const opc = buildMatrixOpcId(createdAt);

  const proofHash = sha256Canonical({
    type: "MATRIX_AI_AUDIT_TRAIL_OPC",
    opc,
    linkedEvt: input.evt.evt,
    evtTraceHash: input.evt.traceHash,
    documentHash: input.evt.documentHash,
    outputHash: input.evt.outputHash,
    humanValidation: input.evt.humanValidation,
    createdAt
  });

  return {
    opc,
    linkedEvt: input.evt.evt,
    proofType: "OPERATIONAL_PROOF",
    proofHash,
    verificationStatus: "VALID",
    createdAt
  };
}

export function verifyMatrixOpc(opc: MatrixOpcRecord, evt: MatrixEvtRecord): boolean {
  const rebuilt = sha256Canonical({
    type: "MATRIX_AI_AUDIT_TRAIL_OPC",
    opc: opc.opc,
    linkedEvt: evt.evt,
    evtTraceHash: evt.traceHash,
    documentHash: evt.documentHash,
    outputHash: evt.outputHash,
    humanValidation: evt.humanValidation,
    createdAt: opc.createdAt
  });

  return (
    opc.linkedEvt === evt.evt &&
    opc.proofType === "OPERATIONAL_PROOF" &&
    opc.verificationStatus === "VALID" &&
    rebuilt === opc.proofHash
  );
}

function buildMatrixOpcId(timestamp: string): string {
  const compactTimestamp = timestamp
    .replace(/\D/g, "")
    .slice(0, 14)
    .padEnd(14, "0");

  const entropy = buildPortableEntropy();

  return `OPC-${compactTimestamp}-${entropy}`;
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
