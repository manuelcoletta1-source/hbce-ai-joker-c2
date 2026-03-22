import { NextResponse } from "next/server";

import { nodeGetNetworkSnapshot } from "@/lib/node/node-network";
import { nodeGetHealth } from "@/lib/node/node-verify";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [networkSnapshot, health] = await Promise.all([
      nodeGetNetworkSnapshot(),
      nodeGetHealth()
    ]);

    return NextResponse.json({
      ok: true,
      system: health.system,
      identity: health.identity,
      local_node: networkSnapshot.local_node,
      network: {
        nodes: networkSnapshot.nodes,
        status: networkSnapshot.status,
        probes: networkSnapshot.probes
      },
      node_health: {
        status: health.status,
        continuity_status: health.continuity_status,
        signature_enabled: health.signature_enabled,
        db_configured: health.db_configured,
        ledger: health.ledger
      },
      ts: health.ts
    });
  } catch (_error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Network error"
      },
      { status: 500 }
    );
  }
}
