import { NextResponse } from "next/server"
import { executeJokerMatrixRequest } from "../../../runtime/execute-joker-matrix-request"

type ChatRequestBody = {
  message?: string
  request_id?: string
  mode?: string
  actor_identity?: string
  entity?: string
  nodeId?: string
}

function buildRequestId(): string {
  const stamp = Date.now()
  return `REQ-${stamp}`
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequestBody

    const message = body.message?.trim()

    if (!message) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing message"
        },
        { status: 400 }
      )
    }

    const requestId = body.request_id?.trim() || buildRequestId()

    const matrixResponse = executeJokerMatrixRequest({
      request_id: requestId,
      prompt: message,
      mode: body.mode || "analysis",
      actor_identity: body.actor_identity || "IPR-AI-0001",
      entity: body.entity || "AI_JOKER-C2",
      nodeId: body.nodeId || "HBCE-MATRIX-NODE-0001-TORINO"
    })

    return NextResponse.json({
      ok: true,
      reply: {
        role: "assistant",
        content: `AI JOKER-C2 processed request ${requestId} on ${matrixResponse.execution.matrix_node.name}.`
      },
      matrix: matrixResponse
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error"

    return NextResponse.json(
      {
        ok: false,
        error: message
      },
      { status: 500 }
    )
  }
}
