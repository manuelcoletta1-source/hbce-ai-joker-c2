import nodesRegistry from "../registry/hbce-nodes.json";

export type HBCERegistryNode = {
  node_id: string;
  location: string;
  role: string;
  status: string;
  issuer: string;
  public_key: string;
  capabilities: string[];
  trust_level: string;
  created_at: string;
  endpoint?: string;
};

export type HBCEFederationProbe = {
  node_id: string;
  endpoint: string | null;
  reachable: boolean;
  http_status: number | null;
  latency_ms: number | null;
  checked_at: string;
  registry_status: string;
  trust_level: string;
  capabilities: string[];
  error?: string;
};

type RegistryShape = {
  version: string;
  network: string;
  updated_at: string;
  nodes: HBCERegistryNode[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function normalizeEndpoint(node: HBCERegistryNode): string | null {
  const raw = typeof node.endpoint === "string" ? node.endpoint.trim() : "";
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function getFederationNodes(): HBCERegistryNode[] {
  const registry = nodesRegistry as RegistryShape;
  return Array.isArray(registry.nodes) ? registry.nodes : [];
}

export async function probeFederationNode(
  node: HBCERegistryNode
): Promise<HBCEFederationProbe> {
  const endpoint = normalizeEndpoint(node);

  if (!endpoint) {
    return {
      node_id: node.node_id,
      endpoint: null,
      reachable: false,
      http_status: null,
      latency_ms: null,
      checked_at: nowIso(),
      registry_status: node.status,
      trust_level: node.trust_level,
      capabilities: Array.isArray(node.capabilities) ? node.capabilities : [],
      error: "Missing endpoint in registry"
    };
  }

  const startedAt = Date.now();

  try {
    const response = await fetch(`${endpoint}/api/signature/public-key`, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json"
      }
    });

    const latency = Date.now() - startedAt;

    return {
      node_id: node.node_id,
      endpoint,
      reachable: response.ok,
      http_status: response.status,
      latency_ms: latency,
      checked_at: nowIso(),
      registry_status: node.status,
      trust_level: node.trust_level,
      capabilities: Array.isArray(node.capabilities) ? node.capabilities : [],
      error: response.ok ? undefined : `Remote status ${response.status}`
    };
  } catch (error) {
    const latency = Date.now() - startedAt;

    return {
      node_id: node.node_id,
      endpoint,
      reachable: false,
      http_status: null,
      latency_ms: latency,
      checked_at: nowIso(),
      registry_status: node.status,
      trust_level: node.trust_level,
      capabilities: Array.isArray(node.capabilities) ? node.capabilities : [],
      error:
        error instanceof Error
          ? error.message
          : "Unknown federation probe error"
    };
  }
}

export async function probeFederationLive(): Promise<HBCEFederationProbe[]> {
  const nodes = getFederationNodes();
  return Promise.all(nodes.map((node) => probeFederationNode(node)));
}
