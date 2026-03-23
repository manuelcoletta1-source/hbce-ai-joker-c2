export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * 🔥 NUOVO: causality engine
 */
import { resolveCausality } from "@/lib/causality-engine";

import { createAnchor } from "@/lib/anchor";
import { validateTruth } from "@/lib/truth-validator";
import { evaluateHBCEPolicy } from "@/lib/policy-engine";
import {
  signFederationResponse,
  federationSignatureIsConfigured
} from "@/lib/federation-signature";
import {
  runNodeRuntime,
  finalizeNodeRuntime
} from "@/lib/node/node-runtime";

export const preferredRegion = "iad1";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const NODE_ID =
  process.env.JOKER_NODE_ID || "HBCE-MATRIX-NODE-0001-TORINO";
const NODE_IDENTITY =
  process.env.JOKER_IDENTITY || "IPR-AI-0001";

/**
 * =========================
 * ROUTE
 * =========================
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    const message =
      typeof body?.message === "string"
        ? body.message.trim()
        : "";

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Missing message" },
        { status: 400 }
      );
    }

    /**
     * =========================
     * 🧠 CAUSALITY ENGINE
     * =========================
     */
    const causality = resolveCausality(message);

    /**
     * =========================
     * NODE RUNTIME START
     * =========================
     */
    const runtimeStart = await runNodeRuntime({
      sessionId: "SESSION-001",
      userMessage: message,
      actor: NODE_IDENTITY
    });

    /**
     * =========================
     * POLICY
     * =========================
     */
    const policy = evaluateHBCEPolicy({
      message,
      response: "",
      research: false,
      history: [],
      strong_sources_count: 0,
      weak_sources_count: 0
    });

    if (policy.blocked) {
      return NextResponse.json({
        ok: false,
        error: "Blocked by policy"
      });
    }

    /**
     * =========================
     * 🤖 LLM
     * =========================
     */
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are JOKER-C2. Answer clearly and operationally."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    let response =
      completion.choices[0]?.message?.content?.trim() ||
      "No response generated.";

    /**
     * =========================
     * TRUTH VALIDATION
     * =========================
     */
    const truth = validateTruth({
      text: response,
      research: false,
      sources: []
    });

    /**
     * =========================
     * NODE RUNTIME END
     * =========================
     */
    const runtimeEnd = await finalizeNodeRuntime({
      sessionId: "SESSION-001",
      assistantResponse: response,
      actor: NODE_IDENTITY
    });

    /**
     * =========================
     * ANCHOR
     * =========================
     */
    const anchor = createAnchor({
      message,
      response,
      causality,
      truth
    });

    /**
     * =========================
     * RESPONSE
     * =========================
     */
    return NextResponse.json({
      ok: true,

      joker: "C2",

      response,

      /**
       * 🔥 NUOVO BLOCCO CAUSALE
       */
      causality: {
        state: causality.state,
        cause: message,
        effect: causality.effect,
        probability: causality.probability
      },

      truth,
      anchor,

      node_runtime: {
        session_id: runtimeEnd.session.session_id,
        continuity_reference:
          runtimeEnd.session.continuity_reference
      },

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
