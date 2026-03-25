export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const preferredRegion = "iad1";

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { resolveCausality } from "@/lib/causality-engine";
import { evaluateHBCEPolicy } from "@/lib/policy-engine";
import { validateTruth } from "@/lib/truth-validator";

import {
  runNodeRuntime,
  finalizeNodeRuntime
} from "@/lib/node/node-runtime";

import {
  appendEVTRecord,
  computeEVTHash,
  readEVTLedger,
  type EVTRecord
} from "@/lib/evt-registry";

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

function padEvt(n: number): string {
  return `EVT-${String(n).padStart(4, "0")}`;
}

/**
 * EVT STRICT (fail-closed)
 */
async function appendEVTStrict(record: EVTRecord) {
  const saved = await appendEVTRecord(record);

  if (!saved || !saved.evt) {
    throw new Error("EVT persistence failed");
  }

  return saved;
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
     * HARD REQUIREMENTS
     * =========================
     */

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "OPENAI_API_KEY missing" },
        { status: 500 }
      );
    }

    if (!process.env.POSTGRES_URL) {
      return NextResponse.json(
        { ok: false, error: "POSTGRES_URL missing (fail-closed)" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const message =
      typeof body.message === "string" ? body.message.trim() : "";

    const sessionId =
      typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim()
        : "JOKER-SESSION-0001";

    if (!message) {
      return NextResponse.json(
        { ok: false, error: "Missing message" },
        { status: 400 }
      );
    }

    /**
     * =========================
     * RUNTIME START
     * =========================
     */

    const runtimeStart = await runNodeRuntime({
      sessionId,
      userMessage: message,
      actor: NODE_IDENTITY
    });

    if (!runtimeStart.ledger_valid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ledger invalid (fail-closed)",
          node_runtime: runtimeStart
        },
        { status: 503 }
      );
    }

    /**
     * =========================
     * POLICY
     * =========================
     */

    const causality = resolveCausality(message);

    const policy = evaluateHBCEPolicy({
      message,
      response: "",
      research: false,
      history: [],
      strong_sources_count: 0,
      weak_sources_count: 0
    });

    if (policy.blocked) {
      return NextResponse.json(
        {
          ok: false,
          error: "Blocked by policy",
          causality
        },
        { status: 403 }
      );
    }

    /**
     * =========================
     * LLM
     * =========================
     */

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are JOKER-C2. Deterministic, no hallucinations, governance-first."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    let response =
      completion.choices[0]?.message?.content?.trim() ||
      "No response generated";

    /**
     * =========================
     * TRUTH CHECK
     * =========================
     */

    const truth = validateTruth({
      text: response,
      research: false,
      sources: []
    });

    if (truth.decision === "WARN") {
      response = `[TRUTH WARNING]\n${response}`;
    }

    /**
     * =========================
     * RUNTIME FINALIZE
     * =========================
     */

    const runtimeEnd = await finalizeNodeRuntime({
      sessionId,
      assistantResponse: response,
      actor: NODE_IDENTITY
    });

    if (!runtimeEnd.ledger_valid) {
      return NextResponse.json(
        {
          ok: false,
          error: "Ledger invalid after execution (fail-closed)",
          node_runtime: runtimeEnd
        },
        { status: 503 }
      );
    }

    /**
     * =========================
     * EVT GENERATION
     * =========================
     */

    const ledger = await readEVTLedger();
    const last = ledger.length > 0 ? ledger[ledger.length - 1] : null;

    const evtId = padEvt(ledger.length + 1);

    const base: EVTRecord = {
      evt: evtId,
      prev: last ? last.evt : null,
      t: new Date().toISOString(),
      entity: "AI_JOKER",
      ipr: NODE_IDENTITY,
      state: "LOCKED",
      baseline: false,
      kind: "JOKER_RUNTIME_EVENT",
      cycle: "JOKER-C2",
      loc: ["Torino", "Italy"],
      org: "HERMETICUM B.C.E. S.r.l.",
      core: "HBCE-CORE-v3",
      anchors: {
        monthly_hash: ""
      },
      upstream: {
        root_evt: "EVT-0008",
        root_prev: "EVT-0007",
        root_t: "2026-01-19T15:30:00+01:00",
        proto: "UNEBDO-ΦΩ",
        inrim: "2025-INRMCLE-0021541",
        t0: "2025-10-24T15:36:00Z"
      },
      continuity: {
        checkpoint_type: "RUNTIME",
        elapsed_months: ledger.length,
        origin_lock: "EVT-0008",
        origin_ipr: "IPR-AI-0001",
        rule: "fail-closed runtime",
        note: `session=${sessionId}`
      }
    };

    const hash = computeEVTHash(base);

    const record: EVTRecord = {
      ...base,
      anchors: {
        ...base.anchors,
        monthly_hash: hash
      }
    };

    const evtSaved = await appendEVTStrict(record);

    /**
     * =========================
     * RESPONSE
     * =========================
     */

    return NextResponse.json({
      ok: true,
      joker: "C2",
      response,
      causality,
      evt: {
        id: evtSaved.evt,
        hash: evtSaved.anchors.monthly_hash
      },
      node_runtime: runtimeEnd
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
