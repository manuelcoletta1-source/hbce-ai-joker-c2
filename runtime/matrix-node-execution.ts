/**
 * Matrix Europa Node Execution
 * Runtime execution helpers for node-aware operations in AI JOKER-C2
 *
 * HBCE Research
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 */

import { createMatrixNodeContext, type MatrixNodeContext } from "../lib/matrix-node-context"
import {
  createAndAppendRequestExecutionEvent,
  createAndAppendEvidenceGenerationEvent,
  createAndAppendVerificationReferenceEvent,
  exportMatrixNodeLedgerSnapshot
} from "../ledger/matrix-node-ledger-store"

export type MatrixNodeExecutionInput = {
  request_id: string
  action: string
  description: string
  actor_identity?: string
  entity?: string
  nodeId?: string
}

export type MatrixNodeExecutionResult = {
  request_id: string
  action: string
  description: string
  actor_identity: string
  entity: string
  matrix_node: MatrixNodeContext
  execution_event_id: string
  evidence_event_id: string
  verification_event_id: string
  evidence_hash: string
  verification_reference: string
  executed_at: string
}

function buildExecutionEvidenceHash(input: MatrixNodeExecutionInput, node: MatrixNodeContext): string {
  const normalized = [
    input.request_id,
    input.action,
    input.description,
    input.actor_identity ?? "IPR-AI-0001",
    input.entity ?? "AI_JOKER-C2",
    node.node_id,
    node.city,
    node.country
  ].join("|")

  return `sha256:${Buffer.from(normalized).toString("base64")}`
}

function buildVerificationReference(requestId: string, nodeId: string): string {
  return `verify://${nodeId}/${requestId}`
}

export function executeMatrixNodeOperation(
  input: MatrixNodeExecutionInput
): MatrixNodeExecutionResult {
  const matrixNode = createMatrixNodeContext(input.nodeId)
  const actorIdentity = input.actor_identity ?? "IPR-AI-0001"
  const entity = input.entity ?? "AI_JOKER-C2"
  const evidenceHash = buildExecutionEvidenceHash(input, matrixNode)
  const verificationReference = buildVerificationReference(
    input.request_id,
    matrixNode.node_id
  )

  const executionEvent = createAndAppendRequestExecutionEvent(
    input.description,
    input.nodeId
  )

  const evidenceEvent = createAndAppendEvidenceGenerationEvent(
    `Evidence generated for request ${input.request_id}`,
    evidenceHash,
    input.nodeId
  )

  const verificationEvent = createAndAppendVerificationReferenceEvent(
    `Verification reference created for request ${input.request_id}`,
    verificationReference,
    input.nodeId
  )

  return {
    request_id: input.request_id,
    action: input.action,
    description: input.description,
    actor_identity: actorIdentity,
    entity,
    matrix_node: matrixNode,
    execution_event_id: executionEvent.event_id,
    evidence_event_id: evidenceEvent.event_id,
    verification_event_id: verificationEvent.event_id,
    evidence_hash: evidenceHash,
    verification_reference: verificationReference,
    executed_at: new Date().toISOString()
  }
}

export function executeMatrixNodeAnalysis(
  requestId: string,
  description: string,
  nodeId?: string
): MatrixNodeExecutionResult {
  return executeMatrixNodeOperation({
    request_id: requestId,
    action: "analysis",
    description,
    nodeId
  })
}

export function executeMatrixNodeVerification(
  requestId: string,
  description: string,
  nodeId?: string
): MatrixNodeExecutionResult {
  return executeMatrixNodeOperation({
    request_id: requestId,
    action: "verification",
    description,
    nodeId
  })
}

export function getMatrixNodeExecutionSnapshot() {
  return exportMatrixNodeLedgerSnapshot()
}
