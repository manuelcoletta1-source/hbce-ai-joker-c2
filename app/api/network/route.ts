import { NextResponse } from "next/server";

import {
  getLocalNode,
  getNetworkNodes,
  getNetworkStatus,
  probeNetwork
} from "@/lib/joker-network";

export const runtime = "nodejs";

export async function GET() {
  try {
    const local = getLocalNode();
    const nodes = getNetworkNodes();
    const status = getNetworkStatus();
    const probes = await probeNetwork();

    return NextResponse.json({
      ok: true,
      system: "JOKER-C2",
      identity: "IPR-AI-0001",
      local_node: local,
      network: {
        nodes,
        status,
        probes
      },
      ts: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Network error"
      },
      { status: 500 }
    );
  }
}
