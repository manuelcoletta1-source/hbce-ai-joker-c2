/**
 * Matrix Europa Node Ledger Store
 * In-memory append-only event collection layer for node-bound events in AI JOKER-C2
 *
 * HBCE Research
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 */

import {
  createNodeActivationEvent,
  createRequestExecutionEvent,
  createEvidenceGenerationEvent,
  createVerificationReferenceEvent,
  type MatrixNodeEvent
} from "./matrix-node-event-factory"

const matrixNodeLedgerStore: MatrixNodeEvent[] = []

export function appendMatrixNodeEvent(event: MatrixNodeEvent): MatrixNodeEvent {
  matrixNodeLedgerStore.push(event)
  return event
}

export function getMatrixNodeLedgerEvents(): MatrixNodeEvent[] {
  return [...matrixNodeLedgerStore]
}

export function getMatrixNodeLedgerEventCount(): number {
  return matrixNodeLedgerStore.length
}

export function clearMatrixNodeLedgerStore(): void {
  matrixNodeLedgerStore.length = 0
}

export function createAndAppendNodeActivationEvent(nodeId?: string): MatrixNodeEvent {
  const event = createNodeActivationEvent(nodeId)
  return appendMatrixNodeEvent(event)
}

export function createAndAppendRequestExecutionEvent(
  description: string,
  nodeId?: string
): MatrixNodeEvent {
  const event = createRequestExecutionEvent(description, nodeId)
  return appendMatrixNodeEvent(event)
}

export function createAndAppendEvidenceGenerationEvent(
  description: string,
  evidenceHash: string,
  nodeId?: string
): MatrixNodeEvent {
  const event = createEvidenceGenerationEvent(description, evidenceHash, nodeId)
  return appendMatrixNodeEvent(event)
}

export function createAndAppendVerificationReferenceEvent(
  description: string,
  verificationReference: string,
  nodeId?: string
): MatrixNodeEvent {
  const event = createVerificationReferenceEvent(
    description,
    verificationReference,
    nodeId
  )
  return appendMatrixNodeEvent(event)
}

export function exportMatrixNodeLedgerSnapshot() {
  return {
    exported_at: new Date().toISOString(),
    total_events: getMatrixNodeLedgerEventCount(),
    events: getMatrixNodeLedgerEvents()
  }
}
