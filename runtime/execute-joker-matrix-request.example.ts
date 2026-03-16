/**
 * Execute Joker-C2 Matrix Request Example
 * Example usage for Matrix Europa node-aware execution in AI JOKER-C2
 *
 * HBCE Research
 * HERMETICUM - BLINDATA · COMPUTABILE · EVOLUTIVA
 * HERMETICUM B.C.E. S.r.l.
 */

import { executeJokerMatrixRequest } from "./execute-joker-matrix-request"

const response = executeJokerMatrixRequest({
  request_id: "REQ-0001",
  prompt: "Run a territorial infrastructure analysis for the Torino experimental node.",
  mode: "analysis",
  actor_identity: "IPR-AI-0001",
  entity: "AI_JOKER-C2"
})

console.log(JSON.stringify(response, null, 2))
