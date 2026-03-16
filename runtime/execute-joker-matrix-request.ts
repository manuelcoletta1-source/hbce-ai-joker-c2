/**
 * Execute Joker-C2 Matrix Request
 * Bridge layer between Joker-C2 incoming requests and Matrix Europa node-aware execution
 * with optional persistent append-only ledger export.
 *
 * Cloud-safe behavior:
 * - Local/dev environments may persist ledger snapshots to disk
 * - Vercel/serverless environments disable file-based persistence by default
 *
 * HBCE Research
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 */

import {
  executeMatrixNodeOperation,
  getMatrixNodeExecutionSnapshot,
  type MatrixNodeExecutionResult
} from "./matrix-node-execution"

import {
  appendPersistentMatrixNodeLedgerSnapshot,
  resolveMatrixNodeLedgerFilePath,
  type MatrixNodeLedgerFileShape
} from "../ledger/matrix-node-ledger-persistence"

export type JokerMatrixRequest = {
  request_id: string
  prompt: string
  mode?: string
  actor_identity?: string
  entity?: string
  nodeId?: string
}

export type JokerMatrixResponse = {
  ok: true
  request_id: string
  mode: string
  prompt: string
  execution: MatrixNodeExecutionResult
  ledger_snapshot: ReturnType<typeof getMatrixNodeExecutionSnapshot>
  persistent_ledger: {
    enabled: boolean
    reason?: string
    file_path: string | null
    snapshot: MatrixNodeLedgerFileShape | null
  }
}

const DEFAULT_NODE_ID = "HBCE-MATRIX-NODE-0001-TORINO"

function normalizeMode(mode?: string): string {
  if (!mode) {
    return "analysis"
  }

  return mode.trim().toLowerCase()
}

function normalizeNodeId(nodeId?: string): string {
  if (!nodeId || !nodeId.trim()) {
    return DEFAULT_NODE_ID
  }

  return nodeId.trim()
}

function buildExecutionDescription(request: JokerMatrixRequest): string {
  const trimmedPrompt = request.prompt.trim()
  const compactPrompt =
    trimmedPrompt.length > 160
      ? `${trimmedPrompt.slice(0, 157)}...`
      : trimmedPrompt

  return `Joker-C2 ${normalizeMode(request.mode)} request executed: ${compactPrompt}`
}

function isFileLedgerPersistenceEnabled(): boolean {
  const explicitFlag = process.env.HBCE_ENABLE_FILE_LEDGER

  if (explicitFlag === "true") {
    return true
  }

  if (explicitFlag === "false") {
    return false
  }

  if (process.env.VERCEL === "1") {
    return false
  }

  if (process.env.NODE_ENV === "production") {
    return false
  }

  return true
}

function buildDisabledPersistentLedger(
  nodeId: string,
  reason: string
): JokerMatrixResponse["persistent_ledger"] {
  return {
    enabled: false,
    reason,
    file_path: null,
    snapshot: {
      node_id: nodeId,
      exported_at: new Date().toISOString(),
      total_events: 0,
      events: []
    }
  }
}

function buildPersistentLedger(nodeId: string): JokerMatrixResponse["persistent_ledger"] {
  const snapshot = appendPersistentMatrixNodeLedgerSnapshot(nodeId)
  const filePath = resolveMatrixNodeLedgerFilePath(nodeId)

  return {
    enabled: true,
    file_path: filePath,
    snapshot
  }
}

export function executeJokerMatrixRequest(
  request: JokerMatrixRequest
): JokerMatrixResponse {
  const mode = normalizeMode(request.mode)
  const nodeId = normalizeNodeId(request.nodeId)

  const execution = executeMatrixNodeOperation({
    request_id: request.request_id,
    action: mode,
    description: buildExecutionDescription(request),
    actor_identity: request.actor_identity ?? "IPR-AI-0001",
    entity: request.entity ?? "AI_JOKER-C2",
    nodeId
  })

  const ledgerSnapshot = getMatrixNodeExecutionSnapshot()

  const persistentLedger = isFileLedgerPersistenceEnabled()
    ? buildPersistentLedger(nodeId)
    : buildDisabledPersistentLedger(
        nodeId,
        "File-based ledger persistence is disabled for this runtime environment."
      )

  return {
    ok: true,
    request_id: request.request_id,
    mode,
    prompt: request.prompt,
    execution,
    ledger_snapshot: ledgerSnapshot,
    persistent_ledger: persistentLedger
  }
}
