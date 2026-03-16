import OpenAI from "openai"
import { NextResponse } from "next/server"
import { executeJokerMatrixRequest } from "../../../runtime/execute-joker-matrix-request"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

type ChatRequestBody = {
  message?: string
  request_id?: string
  mode?: string
  actor_identity?: string
  entity?: string
  nodeId?: string
  conversation?: Array<{
    role: "user" | "assistant" | "system"
    content: string
  }>
}

function buildRequestId(): string {
  return `REQ-${Date.now()}`
}

function buildSystemPrompt(nodeId: string) {
  return [
    "You are AI JOKER-C2.",
    "You are the operational AI layer of the HBCE infrastructure.",
    "You must respond like a highly capable conversational assistant, but remain aligned with the Joker-C2 project.",
    "Default territorial context: Matrix Europa Node-0001 Torino.",
    `Active node: ${nodeId}.`,
    "Identity layer: IPR-AI-0001.",
    "Operational model: identity -> action -> evidence -> verification.",
    "When relevant, reason in terms of infrastructure, governance, operational identity, evidence, verification, and European technological context.",
    "Do not behave like a keyword search engine or a corpus lookup tool.",
    "Give natural, useful, well-structured answers.",
    "If the user asks for strategic, technical, architectural, or geopolitical analysis, answer in depth.",
    "If the user asks for implementation help, produce concrete engineering guidance."
  ].join(" ")
}

function normalizeConversation(
  conversation?: ChatRequestBody["conversation"]
): Array<{ role: "user" | "assistant" | "system"; content: string }> {
  if (!Array.isArray(conversation)) {
    return []
  }

  return conversation.filter(
    (item) =>
      item &&
      (item.role === "user" || item.role === "assistant" || item.role === "system") &&
      typeof item.content === "string" &&
      item.content.trim().length > 0
  )
}

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing OPENAI_API_KEY on server"
        },
        { status: 500 }
      )
    }

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
    const nodeId = body.nodeId || "HBCE-MATRIX-NODE-0001-TORINO"

    const matrixResponse = executeJokerMatrixRequest({
      request_id: requestId,
      prompt: message,
      mode: body.mode || "analysis",
      actor_identity: body.actor_identity || "IPR-AI-0001",
      entity: body.entity || "AI_JOKER-C2",
      nodeId
    })

    const priorConversation = normalizeConversation(body.conversation)

    const input = [
      {
        role: "system" as const,
        content: buildSystemPrompt(nodeId)
      },
      ...priorConversation,
      {
        role: "user" as const,
        content: message
      }
    ]

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input,
      temperature: 0.7
    })

    const reply =
      response.output_text?.trim() ||
      "Joker-C2 completed the request but returned no textual output."

    return NextResponse.json({
      ok: true,
      request_id: requestId,
      reply: {
        role: "assistant",
        content: reply
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
