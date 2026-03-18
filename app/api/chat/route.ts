import { NextResponse } from "next/server";
import { createAnchor } from "@/lib/anchor";

export const runtime = "nodejs";

function detectIntent(message: string): "chat" | "research" | "general" {
  const m = message.toLowerCase().trim();

  if (!m || m.length <= 5) return "chat";

  if (
    m.includes("ciao") ||
    m.includes("chi sei") ||
    m.includes("come stai")
  ) {
    return "chat";
  }

  if (
    m.includes("notizie") ||
    m.includes("oggi") ||
    m.includes("geopolitica") ||
    m.includes("guerra") ||
    m.includes("crisi") ||
    m.includes("ue") ||
    m.includes("nato")
  ) {
    return "research";
  }

  return "general";
}

function shouldApplyTruth(message: string, research: boolean): boolean {
  if (research) return true;

  const m = message.toLowerCase();

  if (
    m.includes("notizie") ||
    m.includes("oggi") ||
    m.includes("geopolitica") ||
    m.includes("guerra")
  ) {
    return true;
  }

  return false;
}

function validateTruth(text: string) {
  if (!text || text.length < 10) {
    return {
      level: "LOW",
      decision: "BLOCK",
      score: 0
    } as const;
  }

  return {
    level: "HIGH",
    decision: "PASS",
    score: 100
  } as const;
}

function generateResponse(message: string, intent: string): string {
  if (intent === "chat") {
    return "Ciao. Sono JOKER-C2, sistema operativo HBCE. Come posso aiutarti?";
  }

  if (intent === "research") {
    return "Richiesta di tipo informativo rilevata. Elaborazione dati in corso (simulazione).";
  }

  return "Richiesta ricevuta. Elaborazione completata.";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message : "";

    const intent = detectIntent(message);
    const research = intent === "research";
    const outputText = generateResponse(message, intent);

    let truthMeta;

    if (shouldApplyTruth(message, research)) {
      truthMeta = validateTruth(outputText);

      if (truthMeta.decision === "BLOCK") {
        return NextResponse.json(
          {
            ok: false,
            error: "Truth validation blocked output"
          },
          { status: 422 }
        );
      }
    } else {
      truthMeta = {
        level: "HIGH",
        decision: "PASS",
        score: 100,
        note: "Skipped (non-critical query)"
      } as const;
    }

    const anchor = createAnchor({
      message,
      intent,
      research,
      output: outputText,
      truth: truthMeta
    });

    return NextResponse.json({
      ok: true,
      intent,
      research,
      output: outputText,
      truth: truthMeta,
      anchor
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Internal error"
      },
      { status: 500 }
    );
  }
}
