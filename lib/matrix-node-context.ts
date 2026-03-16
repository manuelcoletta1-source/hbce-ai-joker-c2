/**
 * Matrix Europa Node Context
 * Shared runtime context for Matrix node-aware execution in AI JOKER-C2
 *
 * HBCE Research
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 */

import {
  getActiveMatrixNodeContext
} from "../runtime/matrix-node-router"

export type MatrixNodeContext = {
  node_id: string
  name: string
  city: string
  country: string
  jurisdiction: string
  runtime: string
  identity_layer: string
  ledger: string
  status: string
}

export function createMatrixNodeContext(nodeId?: string): MatrixNodeContext {
  const node = getActiveMatrixNodeContext(nodeId)

  return {
    node_id: node.node_id,
    name: node.name,
    city: node.city,
    country: node.country,
    jurisdiction: node.jurisdiction,
    runtime: node.runtime,
    identity_layer: node.identity_layer,
    ledger: node.ledger,
    status: node.status
  }
}

export function attachMatrixNodeContext<T extends Record<string, unknown>>(
  payload: T,
  nodeId?: string
): T & { matrix_node: MatrixNodeContext } {
  return {
    ...payload,
    matrix_node: createMatrixNodeContext(nodeId)
  }
}

export function getMatrixNodeLabel(nodeId?: string): string {
  const context = createMatrixNodeContext(nodeId)
  return `${context.name} (${context.node_id})`
}

export function isExperimentalMatrixNode(nodeId?: string): boolean {
  const context = createMatrixNodeContext(nodeId)
  return context.status === "experimental"
}
