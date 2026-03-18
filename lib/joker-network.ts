export type JokerNode = {
  node_id: string;
  region: string;
  country: string;
  role: "CORE" | "EDGE" | "RELAY";
  status: "ACTIVE" | "INACTIVE";
  endpoint: string;
};

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

    // placeholder future nodes
    {
      node_id: "HBCE-MATRIX-NODE-0002-BRUXELLES",
      region: "Brussels",
      country: "BE",
      role: "CORE",
      status: "INACTIVE",
      endpoint: ""
    },
    {
      node_id: "HBCE-MATRIX-NODE-0003-BERLIN",
      region: "Berlin",
      country: "DE",
      role: "EDGE",
      status: "INACTIVE",
      endpoint: ""
    }
  ];
}

export function getNetworkStatus() {
  const nodes = getNetworkNodes();

  const active = nodes.filter((n) => n.status === "ACTIVE").length;

  return {
    total_nodes: nodes.length,
    active_nodes: active,
    inactive_nodes: nodes.length - active
  };
}
