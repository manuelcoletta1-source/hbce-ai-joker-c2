/**
 * Matrix Europa Node Router
 * Runtime resolver for territorial nodes connected to AI JOKER-C2
 *
 * HBCE Research
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 */

import {
  MATRIX_NODES_REGISTRY,
  getMatrixNodeById,
  isMatrixNodeRegistered,
  type MatrixNodeRecord
} from "../core/matrix-nodes-registry"

const DEFAULT_MATRIX_NODE_ID = "HBCE-MATRIX-NODE-0001-TORINO"

export function getDefaultMatrixNode(): MatrixNodeRecord {
  const node = getMatrixNodeById(DEFAULT_MATRIX_NODE_ID)

  if (!node) {
    throw new Error(
      `Default Matrix node not found: ${DEFAULT_MATRIX_NODE_ID}`
    )
  }

  return node
}

export function resolveMatrixNode(nodeId?: string): MatrixNodeRecord {
  if (!nodeId) {
    return getDefaultMatrixNode()
  }

  const node = getMatrixNodeById(nodeId)

  if (!node) {
    throw new Error(`Matrix node not found: ${nodeId}`)
  }

  return node
}

export function listMatrixNodes(): MatrixNodeRecord[] {
  return MATRIX_NODES_REGISTRY
}

export function requireRegisteredMatrixNode(nodeId: string): MatrixNodeRecord {
  if (!isMatrixNodeRegistered(nodeId)) {
    throw new Error(`Unregistered Matrix node: ${nodeId}`)
  }

  return resolveMatrixNode(nodeId)
}

export function getActiveMatrixNodeContext(nodeId?: string) {
  const node = resolveMatrixNode(nodeId)

  return {
    node_id: node.node_id,
    name: node.name,
    city: node.city,
    country: node.country,
    jurisdiction: node.jurisdiction,
    runtime: node.system_runtime,
    identity_layer: node.identity_layer,
    ledger: node.ledger,
    status: node.status
  }
}
