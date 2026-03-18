import { NextRequest, NextResponse } from "next/server";

import { executeParallel } from "@/lib/parallel-executor";
import { executeFederated } from "@/lib/federation-executor";
import { computeConsensus } from "@/lib/federation-consensus";
import { fuseModelResponses } from "@/lib/fusion";

export const runtime = "nodejs";

type ChatRequest = {
  message: string;
  history?: { role: string; content: string }[];
};

function badRequest(msg: string) {
  return NextResponse.json({ ok: false, error: msg }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();

    if (!body || !body.message) {
      return badRequest("Missing message");
    }

    const message = body.message;
    const history = Array.isArray(body.history) ? body.history.slice(-6) : [];

    // =========================
    // 1. PARALLEL MODELS
    // =========================
    const parallel = await executeParallel({
      message,
      history
    });

    // =========================
    // 2. FEDERATION NODES
    // =========================
    const federation = await executeFederated({
      message,
      history
    });

    // =========================
    // 3. NORMALIZE RESPONSES
    // =========================
    const allCandidates = [
      ...parallel.responses.map((r: any) => ({
        model: r.model,
        ok: r.ok,
        text: r.text
      })),
      ...federation.map((r: any) => ({
        model: r.node,
        ok: r.ok,
        text: r.data?.response
      }))
    ];

    // =========================
    // 4. CONSENSUS ENGINE
    // =========================
    const consensus = computeConsensus(allCandidates, 0.55);

    if (!consensus.ok) {
      return NextResponse.json({
        ok: false,
        error: "Consensus failed",
        consensus
      });
    }

    // =========================
    // 5. FUSION (OPTIONAL LAYER)
    // =========================
    const fusion = fuseModelResponses(
      allCandidates
        .filter((c) => c.ok && c.text)
        .map((c) => ({
          model: c.model,
          ok: true,
          text: c.text
        }))
    );

    // =========================
    // 6. FINAL RESPONSE
    // =========================
    return NextResponse.json({
      ok: true,
      mode: "federated-consensus",

      input: {
        message,
        history_length: history.length
      },

      output: {
        text: consensus.winner_text,
        supporters: consensus.winner_supporters
      },

      meta: {
        consensus,
        fusion,
        parallel_models: parallel.responses.length,
        federation_nodes: federation.length
      }
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err.message || "Internal error"
      },
      { status: 500 }
    );
  }
}
