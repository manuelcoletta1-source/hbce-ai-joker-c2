/**
 * Execute Joker-C2 Matrix Request
 * Bridge layer between Joker-C2 incoming requests and Matrix Europa node-aware execution
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
}

function normalizeMode(mode?: string): string {
  if (!mode) {
    return "analysis"
  }

  return mode.trim().toLowerCase()
}

function buildExecutionDescription(request: JokerMatrixRequest): string {
  const trimmedPrompt = request.prompt.trim()
  const compactPrompt =
    trimmedPrompt.length > 160
      ? `${trimmedPrompt.slice(0, 157)}...`
      : trimmedPrompt

  return `Joker-C2 ${normalizeMode(request.mode)} request executed: ${compactPrompt}`
}

export function executeJokerMatrixRequest(
  request: JokerMatrixRequest
): JokerMatrixResponse {
  const mode = normalizeMode(request.mode)

  const execution = executeMatrixNodeOperation({
    request_id: request.request_id,
    action: mode,
    description: buildExecutionDescription(request),
    actor_identity: request.actor_identity ?? "IPR-AI-0001",
    entity: request.entity ?? "AI_JOKER-C2",
    nodeId: request.nodeId
  })

  const ledgerSnapshot = getMatrixNodeExecutionSnapshot()

  return {
    ok: true,
    request_id: request.request_id,
    mode,
    prompt: request.prompt,
    execution,
    ledger_snapshot: ledgerSnapshot
  }
}
