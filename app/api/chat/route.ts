import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createAnchor } from "@/lib/anchor";
import { validateTruth } from "@/lib/truth-validator";
import {
  signFederationResponse,
  federationSignatureIsConfigured
} from "@/lib/federation-signature";
import { evaluateHBCEPolicy } from "@/lib/policy-engine";

export const runtime = "nodejs";

type ChatBody = {
  message?: string;
  history?: { role: "user" | "assistant"; content: string }[];
  research?: boolean;
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const NODE_ID =
  process.env.JOKER_NODE_ID || "HBCE-MATRIX-NODE-0001-TORINO";
const NODE_IDENTITY =
  process.env.JOKER_IDENTITY || "IPR-AI-0001";

function normalizeMessage(message?: string): string {
  if (!message || typeof message !== "string") return "";
  return message.trim();
}

function normalizeHistory(
  history?: { role: "user" | "assistant"; content: string }[]
): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(history)) return [];

  return history
    .filter(
      (item) =>
        item &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0
    )
    .slice(-8);
}

function detectIntent(message: string): "chat" | "research" | "general" {
  const m = message.toLowerCase();

  if (!m || m.length < 5) return "chat";

  if (m.includes("chi sei") || m.includes("presentati") || m === "ciao") {
    return "chat";
  }

  if (
    m.includes("geopolitica") ||
    m.includes("guerra") ||
    m.includes("ue") ||
    m.includes("nato") ||
    m.includes("oggi") ||
    m.includes("notizie")
  ) {
    return "research";
  }

  return "general";
}

function buildSystemPrompt(
  intent: "chat" | "research" | "general",
  policyGuidance: string[]
): string {
  const base = [
    "You are JOKER-C2, the operational cybernetic entity of the HBCE system.",
    `Identity: ${NODE_IDENTITY}.`,
    `Node: ${NODE_ID}.`,
    "Answer clearly, precisely, and without inflating capabilities.",
    "Never present potential integrations as already active direct operational control.",
    "When symbolic or narrative language appears, translate it into IPR-based operational language.",
    "When evidence is partial, use cautious wording and indicative ranges.",
    "Prefer governance, supervision, auditability, compliance, and infrastructure framing over speculative implementation detail."
  ];

  const intentBlock =
    intent === "chat"
      ? ["Conversational mode."]
      : intent === "research"
      ? ["Research mode: be analytical, source-aware, and cautious."]
      : ["General reasoning mode."];

  return [...base, ...intentBlock, ...policyGuidance].join(" ");
}

function shouldApplyTruthWarning(policy: ReturnType<typeof evaluateHBCEPolicy>): boolean {
  return policy.truth_scope.applyWarning;
}

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const body = (await req.json()) as ChatBody;
    const message = normalizeMessage(body.message);
    const history = normalizeHistory(body.history);

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Missing message" },
        { status: 400 }
      );
    }

    const intent = detectIntent(message);
    const research = intent === "research";
    const historyTexts = history.map((item) => item.content);

    const prePolicy = evaluateHBCEPolicy({
      message,
      response: "",
      research,
      history: historyTexts,
      strong_sources_count: 0,
      weak_sources_count: 0
    });

    if (prePolicy.blocked) {
      const blockedResponse =
        prePolicy.block_response ||
        "Richiesta non supportata nel formato richiesto.";

      const anchor = createAnchor({
        message,
        response: blockedResponse,
        intent,
        policy: prePolicy
      });

      return NextResponse.json({
        ok: true,
        joker: "C2",
        response: blockedResponse,
        intent,
        policy: prePolicy,
        anchor,
        federation_signature: federationSignatureIsConfigured()
          ? signFederationResponse(NODE_ID, blockedResponse)
          : null
      });
    }

    const prompt = buildSystemPrompt(intent, prePolicy.prompt_guidance);

    const input =
      history.length > 0
        ? [
            ...history.map((item) => ({
              role: item.role,
              content: item.content
            })),
            {
              role: "user" as const,
              content: message
            }
          ]
        : message;

    const ai = await client.responses.create({
      model: "gpt-4.1-mini",
      instructions: prompt,
      input
    });

    let response = ai.output_text?.trim() || "No response generated.";

    const postPolicy = evaluateHBCEPolicy({
      message,
      response,
      research,
      history: historyTexts,
      strong_sources_count: 0,
      weak_sources_count: 0
    });

    if (postPolicy.numeric_guard.numeric_request) {
      if (postPolicy.numeric_guard.mode === "insufficient-evidence") {
        response = postPolicy.numeric_guard.guidance_prefix;
      } else if (
        postPolicy.numeric_guard.mode === "estimated-range" &&
        postPolicy.numeric_guard.guidance_prefix
      ) {
        response =
          postPolicy.numeric_guard.guidance_prefix + "\n\n" + response;
      }
    }

    const truth = validateTruth({
      text: response,
      research,
      sources: []
    });

    if (truth.decision === "WARN" && shouldApplyTruthWarning(postPolicy)) {
      response = `[TRUTH WARNING]\n${response}`;
    }

    const anchor = createAnchor({
      message,
      response,
      intent,
      policy: postPolicy,
      truth
    });

    return NextResponse.json({
      ok: true,
      joker: "C2",
      response,
      intent,
      policy: postPolicy,
      truth,
      anchor,
      federation_signature: federationSignatureIsConfigured()
        ? signFederationResponse(NODE_ID, response)
        : null
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Internal error"
      },
      { status: 500 }
    );
  }
}
