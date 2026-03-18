import { NextResponse } from "next/server";
import { probeFederationLive } from "@/lib/federation-live";

export const runtime = "nodejs";

export async function GET() {
  try {
    const probes = await probeFederationLive();

    const totalNodes = probes.length;
    const reachableNodes = probes.filter((probe) => probe.reachable).length;
    const unreachableNodes = totalNodes - reachableNodes;

    return NextResponse.json({
      ok: true,
      network: "HBCE-MATRIX",
      checked_at: new Date().toISOString(),
      summary: {
        total_nodes: totalNodes,
        reachable_nodes: reachableNodes,
        unreachable_nodes: unreachableNodes
      },
      probes
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Federation live probe failed"
      },
      { status: 500 }
    );
  }
}
