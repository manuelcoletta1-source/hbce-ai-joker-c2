import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * 🧠 INTENT DETECTION
 */
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

/**
 * 🔐 TRUTH CONTROL
 */
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

/**
 * 🔍 MOCK TRUTH VALIDATION
 * (puoi collegarlo al tuo vero modulo)
 */
function validateTruth(text: string) {
  // semplice placeholder
  if (!text || text.length < 10) {
    return {
      level: "LOW",
      decision: "BLOCK",
      score: 0
    };
  }

  return {
    level: "HIGH",
    decision: "PASS",
    score: 100
  };
}

/**
 * 🤖 MOCK MODEL RESPONSE
 * (sostituisci con GPT reale)
 */
function generateResponse(message: string, intent: string): string {
  if (intent === "chat") {
    return "Ciao. Sono JOKER-C2, sistema operativo HBCE. Come posso aiutarti?";
  }

  if (intent === "research") {
    return "Richiesta di tipo informativo rilevata. Elaborazione dati in corso (simulazione).";
  }

  return "Richiesta ricevuta. Elaborazione completata.";
}

/**
 * 🚀 API ROUTE
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message || "";

    /**
     * 1. INTENT
     */
    const intent = detectIntent(message);

    /**
     * 2. RESEARCH MODE
     */
    const research = intent === "research";

    /**
     * 3. GENERAZIONE
     */
    const outputText = generateResponse(message, intent);

    /**
     * 4. TRUTH LAYER
     */
    let truthMeta;

    if (shouldApplyTruth(message, research)) {
      truthMeta = validateTruth(outputText);

      if (truthMeta.decision === "BLOCK") {
        return NextResponse.json({
          ok: false,
          error: "Truth validation blocked output"
        });
      }
    } else {
      truthMeta = {
        level: "HIGH",
        decision: "PASS",
        score: 100,
        note: "Skipped (non-critical query)"
      };
    }

    /**
     * 5. RESPONSE
     */
    return NextResponse.json({
      ok: true,
      intent,
      research,
      output: outputText,
      truth: truthMeta
    });

  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Internal error"
      },
      { status: 500 }
    );
  }
}
