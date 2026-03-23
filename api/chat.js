import { runJokerPhi } from "../runtime/joker-runtime.js";

/**
 * Parse request body safely
 */
function parseBody(req) {
  if (!req || !req.body) return {};
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

/**
 * Generate multiple candidates from LLM (placeholder)
 * TODO: replace with real LLM integration (OpenAI / local model / gateway)
 */
async function llmGenerateMultiple(input) {
  // Simulazione — sostituisci con chiamate reali
  return [
    {
      content: `Direct answer: ${input}`,
      source: "llm",
      confidence: 0.85,
      risk: 0.2,
      traceId: `llm-${Date.now()}-1`
    },
    {
      content: `Structured answer: ${input}`,
      source: "llm",
      confidence: 0.82,
      risk: 0.15,
      traceId: `llm-${Date.now()}-2`
    },
    {
      content: `Safe answer: ${input}`,
      source: "llm",
      confidence: 0.78,
      risk: 0.1,
      traceId: `llm-${Date.now()}-3`
    }
  ];
}

/**
 * API Handler
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Metodo non consentito"
    });
  }

  try {
    const body = parseBody(req);
    const input = body?.input || "";

    if (!input || typeof input !== "string") {
      return res.status(400).json({
        ok: false,
        error: "Input non valido"
      });
    }

    /**
     * STEP 1 — genera possibilità
     */
    const candidates = await llmGenerateMultiple(input);

    /**
     * STEP 2 — passa nel Φ-engine
     */
    const result = runJokerPhi(input);

    /**
     * DEBUG (utile su Vercel logs)
     */
    console.log("Φ INPUT:", input);
    console.log("Φ CANDIDATES:", candidates);
    console.log("Φ RESULT:", result);

    /**
     * STEP 3 — gestione FAIL_CLOSED
     */
    if (!result.ok) {
      return res.status(200).json({
        ok: false,
        state: "FAIL_CLOSED",
        message: "No valid operational effect generated",
        debug: result.result
      });
    }

    /**
     * STEP 4 — output finale
     */
    return res.status(200).json({
      ok: true,
      state: "PASS",
      message: result.message,
      strategy: result.strategy,
      probability: result.probability,
      trace: result.trace
    });

  } catch (error) {
    console.error("Φ ERROR:", error);

    return res.status(500).json({
      ok: false,
      error: "Errore interno",
      detail: error instanceof Error ? error.message : String(error)
    });
  }
}
