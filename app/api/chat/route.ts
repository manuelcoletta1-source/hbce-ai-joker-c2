import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()

  const message = body.message

  if (!message) {
    return NextResponse.json({ error: "Missing message" }, { status: 400 })
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are AI JOKER-C2, an operational AI assistant connected to the Matrix Europa node in Torino."
        },
        {
          role: "user",
          content: message
        }
      ]
    })
  })

  const data = await response.json()

  const reply = data.choices?.[0]?.message?.content || "No response"

  return NextResponse.json({
    ok: true,
    reply: {
      role: "assistant",
      content: reply
    }
  })
}
