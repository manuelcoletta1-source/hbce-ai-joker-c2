/**
 * MATRIX AI Audit Trail — OPC
 *
 * Minimal OPC proof builder for the MATRIX AI Audit Trail MVP.
 *
 * OPC records do not create legal certification by themselves.
 * They create a technical operational proof linked to an EVT event.
 */

import { randomUUID } from "crypto";

import { sha256Canonical } from "./hash";
import type { MatrixEvtRecord, MatrixHash, MatrixOpcRecord } from "./types";

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

  const entropy = randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();

  return `OPC-${compactTimestamp}-${entropy}`;
}
