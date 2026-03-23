export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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

/**
 * =========================
 * CONFIG
 * =========================
 */

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const NODE_ID =
  process.env.JOKER_NODE_ID || "HBCE-MATRIX-NODE-0001-TORINO";

const NODE_IDENTITY =
  process.env.JOKER_IDENTITY || "IPR-AI-0001";

/**
 * =========================
 * HELPERS
 * =========================
 */

function normalizeMessage(message?: string): string {
  if (!message || typeof message !== "string") return "";
  return message.trim();
}

function buildSystemPrompt(): string {
  return [
    "You are JOKER-C2, HBCE operational AI node.",
    "Operate with precision, auditability and governance awareness.",
    "Do not exaggerate capabilities.",
    "Translate conceptual inputs into operational reasoning.",
    "Prefer structured, clear, non-redundant output."
  ].join(" ");
}

/**
 * =========================
 * ROUTE
 * =========================
 */

export async function POST(req: NextRequest) {
  try {
    /**
     * =========================
     * INPUT
     * =========================
     */
    const body = await req.json().catch(() => ({}));
    const message = normalizeMessage(body?.message);

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
     * 🏛️ POLICY GOVERNANCE
     * =========================
     */
    const causalityPolicyCheck = evaluateHBCEPolicy({
      message,
      response: causality.effect || "",
      research: false,
      history: [],
      strong_sources_count: 0,
      weak_sources_count: 0
    });

    let finalDecision = causality.decision;
    let finalActivation = causality.activation;

    if (causalityPolicyCheck.blocked) {
      finalDecision = "BLOCK";
      finalActivation = "BLOCKED";
    }

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
     * POLICY (CHAT LEVEL)
     * =========================
     */
    const chatPolicy = evaluateHBCEPolicy({
      message,
      response: "",
      research: false,
      history: [],
      strong_sources_count: 0,
      weak_sources_count: 0
    });

    if (chatPolicy.blocked) {
      const blockedResponse = "Request blocked by HBCE policy.";

      const runtimeEnd = await finalizeNodeRuntime({
        sessionId: "SESSION-001",
        assistantResponse: blockedResponse,
        actor: NODE_IDENTITY
      });

      return NextResponse.json({
        ok: false,
        error: blockedResponse,
        causality: {
          state: "FAIL_CLOSED",
          decision: "BLOCK",
          activation: "BLOCKED"
        },
        node_runtime: {
          session_id: runtimeEnd.session.session_id
        }
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
          content: buildSystemPrompt()
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
      truth,
      decision: finalDecision
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
       * 🔥 CAUSALITY BLOCK
       */
      causality: {
        state: causality.state,
        cause: message,
        effect: causality.effect,
        probability: causality.probability,

        decision: finalDecision,
        activation: finalActivation,
        risk_level: causality.risk_level,

        governance: {
          policy_blocked: causalityPolicyCheck.blocked,
          policy_notes: causalityPolicyCheck.prompt_guidance || []
        }
      },

      truth,
      anchor,

      node_runtime: {
        session_id: runtimeEnd.session.session_id,
        continuity_reference:
          runtimeEnd.session.continuity_reference,
        runtime_start_state: runtimeStart.runtime_state
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
