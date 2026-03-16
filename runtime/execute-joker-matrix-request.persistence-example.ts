/**
 * Execute Joker-C2 Matrix Request Persistence Example
 * Example usage for Matrix Europa node-aware execution with persistent ledger export
 *
 * HBCE Research
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 */

import { executeJokerMatrixRequest } from "./execute-joker-matrix-request"

const response = executeJokerMatrixRequest({
  request_id: "REQ-0002",
  prompt: "Persist a Torino node operational analysis into the Matrix Europa append-only ledger.",
  mode: "analysis",
  actor_identity: "IPR-AI-0001",
  entity: "AI_JOKER-C2"
})

console.log("Execution result:")
console.log(JSON.stringify(response.execution, null, 2))

console.log("\nIn-memory ledger snapshot:")
console.log(JSON.stringify(response.ledger_snapshot, null, 2))

console.log("\nPersistent ledger file path:")
console.log(response.persistent_ledger.file_path)

console.log("\nPersistent ledger snapshot:")
console.log(JSON.stringify(response.persistent_ledger.snapshot, null, 2))
