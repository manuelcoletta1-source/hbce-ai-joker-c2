export type JokerNodeRole = "CORE" | "EDGE" | "RELAY";
export type JokerNodeStatus = "ACTIVE" | "INACTIVE";

export type JokerNode = {
  node_id: string;
  region: string;
  country: string;
  role: JokerNodeRole;
  status: JokerNodeStatus;
  endpoint: string;
};

export type JokerNodeProbe = {
  node_id: string;
  endpoint: string;
  reachable: boolean;
  status: "ONLINE" | "OFFLINE" | "UNKNOWN";
  checked_at: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

export function getLocalNode(): JokerNode {
  return {
    node_id: "HBCE-MATRIX-NODE-0001-TORINO",
    region: "Piemonte",
    country: "IT",
    role: "CORE",
    status: "ACTIVE",
    endpoint: process.env.NEXT_PUBLIC_BASE_URL || ""
  };
}

export function getNetworkNodes(): JokerNode[] {
  return [
    getLocalNode(),
    {
      node_id: "HBCE-MATRIX-NODE-0002-BRUXELLES",
      region: "Brussels",
      country: "BE",
      role: "CORE",
      status: "INACTIVE",
      endpoint: process.env.HBCE_NODE_BRUXELLES_URL || ""
    },
    {
      node_id: "HBCE-MATRIX-NODE-0003-BERLIN",
      region: "Berlin",
      country: "DE",
      role: "EDGE",
      status: "INACTIVE",
      endpoint: process.env.HBCE_NODE_BERLIN_URL || ""
    }
  ];
}

export function getNetworkStatus() {
  const nodes = getNetworkNodes();
  const active = nodes.filter((node) => node.status === "ACTIVE").length;

  return {
    total_nodes: nodes.length,
    active_nodes: active,
    inactive_nodes: nodes.length - active
  };
}

export async function probeNode(node: JokerNode): Promise<JokerNodeProbe> {
  if (!node.endpoint) {
    return {
      node_id: node.node_id,
      endpoint: node.endpoint,
      reachable: false,
      status: "UNKNOWN",
      checked_at: nowIso()
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${node.endpoint.replace(/\/$/, "")}/api/verify`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "Accept": "application/json"
      },
      cache: "no-store"
    });

    clearTimeout(timeout);

    return {
      node_id: node.node_id,
      endpoint: node.endpoint,
      reachable: res.ok,
      status: res.ok ? "ONLINE" : "OFFLINE",
      checked_at: nowIso()
    };
  } catch {
    return {
      node_id: node.node_id,
      endpoint: node.endpoint,
      reachable: false,
      status: "OFFLINE",
      checked_at: nowIso()
    };
  }
}

export async function probeNetwork(): Promise<JokerNodeProbe[]> {
  const nodes = getNetworkNodes();

  return Promise.all(nodes.map((node) => probeNode(node)));
}
