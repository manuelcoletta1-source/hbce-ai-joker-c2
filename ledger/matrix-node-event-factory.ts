/**
 * Matrix Europa Node Event Factory
 * Event generation layer for node-bound operational events in AI JOKER-C2
 *
 * HBCE Research
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 */

import { createMatrixNodeContext, type MatrixNodeContext } from "../lib/matrix-node-context"

export type MatrixNodeEventType =
  | "NODE_ACTIVATION"
  | "IPR_BINDING"
  | "SYSTEM_ASSOCIATION"
  | "REQUEST_EXECUTION"
  | "EVIDENCE_GENERATION"
  | "VERIFICATION_REFERENCE"

export type MatrixNodeEvidence = {
  hash: string
  signature: string
  verification: string
}

export type MatrixNodeEvent = {
  event_id: string
  type: MatrixNodeEventType
  timestamp: string
  actor_identity: string
  entity: string
  description: string
  location: string
  matrix_node: MatrixNodeContext
  evidence: MatrixNodeEvidence
}

type CreateMatrixNodeEventInput = {
  type: MatrixNodeEventType
  actor_identity?: string
  entity?: string
  description: string
  location?: string
  evidence?: Partial<MatrixNodeEvidence>
  nodeId?: string
}

function buildMatrixNodeEventId(type: MatrixNodeEventType): string {
  const normalizedType = type.replace(/_/g, "-")
  const stamp = Date.now()
  return `NODE0001-${normalizedType}-${stamp}`
}

export function createMatrixNodeEvent(
  input: CreateMatrixNodeEventInput
): MatrixNodeEvent {
  const context = createMatrixNodeContext(input.nodeId)

  return {
    event_id: buildMatrixNodeEventId(input.type),
    type: input.type,
    timestamp: new Date().toISOString(),
    actor_identity: input.actor_identity ?? "IPR-AI-0001",
    entity: input.entity ?? "AI_JOKER-C2",
    description: input.description,
    location: input.location ?? `${context.city}, ${context.country}`,
    matrix_node: context,
    evidence: {
      hash: input.evidence?.hash ?? "pending",
      signature: input.evidence?.signature ?? "pending",
      verification: input.evidence?.verification ?? "pending"
    }
  }
}

export function createNodeActivationEvent(nodeId?: string): MatrixNodeEvent {
  return createMatrixNodeEvent({
    type: "NODE_ACTIVATION",
    description: "Activation of Matrix Europa node within HBCE infrastructure",
    nodeId
  })
}

export function createRequestExecutionEvent(
  description: string,
  nodeId?: string
): MatrixNodeEvent {
  return createMatrixNodeEvent({
    type: "REQUEST_EXECUTION",
    description,
    nodeId
  })
}

export function createEvidenceGenerationEvent(
  description: string,
  evidenceHash: string,
  nodeId?: string
): MatrixNodeEvent {
  return createMatrixNodeEvent({
    type: "EVIDENCE_GENERATION",
    description,
    nodeId,
    evidence: {
      hash: evidenceHash
    }
  })
}

export function createVerificationReferenceEvent(
  description: string,
  verificationReference: string,
  nodeId?: string
): MatrixNodeEvent {
  return createMatrixNodeEvent({
    type: "VERIFICATION_REFERENCE",
    description,
    nodeId,
    evidence: {
      verification: verificationReference
    }
  })
}
