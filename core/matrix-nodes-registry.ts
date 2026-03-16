/**
 * Matrix Europa Nodes Registry
 * Internal registry for territorial nodes connected to AI JOKER-C2
 *
 * HBCE Research
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 */

import { MATRIX_NODE_0001 } from "./matrix-node-0001"

export type MatrixNodeRecord = {
  node_id: string
  name: string
  city: string
  country: string
  jurisdiction: string
  operator: string
  organization: string
  system_runtime: string
  identity_layer: string
  ledger: string
  status: string
}

export const MATRIX_NODES_REGISTRY: MatrixNodeRecord[] = [
  MATRIX_NODE_0001
]

export function getAllMatrixNodes(): MatrixNodeRecord[] {
  return MATRIX_NODES_REGISTRY
}

export function getMatrixNodeById(nodeId: string): MatrixNodeRecord | undefined {
  return MATRIX_NODES_REGISTRY.find((node) => node.node_id === nodeId)
}

export function isMatrixNodeRegistered(nodeId: string): boolean {
  return MATRIX_NODES_REGISTRY.some((node) => node.node_id === nodeId)
}
