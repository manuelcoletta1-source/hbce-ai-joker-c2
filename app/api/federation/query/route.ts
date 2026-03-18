import { NextResponse } from "next/server";
import { queryFederation } from "@/lib/federation-query";
import { buildConsensus } from "@/lib/consensus-engine";

export const runtime = "nodejs";

type FederationQueryBody = {
  message?: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FederationQueryBody;
    const message =
      typeof body?.message === "string" ? body.message.trim() : "";

    if (!message) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing message"
        },
        { status: 400 }
      );
    }

    const federationResults = await queryFederation(message);

    const successfulResponses = federationResults
      .filter((item) => item.success && typeof item.response === "string" && item.response.trim().length > 0)
      .map((item) => ({
        model: item.node_id,
        text: item.response as string
      }));

    const consensus = buildConsensus(successfulResponses);

    return NextResponse.json({
      ok: true,
      network: "HBCE-MATRIX",
      message,
      federation: {
        total_nodes: federationResults.length,
        successful_nodes: federationResults.filter((item) => item.success).length,
        failed_nodes: federationResults.filter((item) => !item.success).length,
        responses: federationResults
      },
      consensus
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Federation query failed"
      },
      { status: 500 }
    );
  }
}
