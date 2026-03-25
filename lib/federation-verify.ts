import {
  verifyFederationResponse,
  type FederationSignedEnvelope
} from "./federation-signature";
import nodesRegistry from "../registry/hbce-nodes.json";

type RegistryNode = {
  node_id: string;
  public_key: string;
};

type RegistryShape = {
  version: string;
  network: string;
  updated_at: string;
  nodes: RegistryNode[];
};

function normalizeRegistry(): RegistryNode[] {
  const registry = nodesRegistry as RegistryShape;
  return Array.isArray(registry.nodes) ? registry.nodes : [];
}

export function getNodePublicKey(node_id: string): string | null {
  const nodes = normalizeRegistry();
  const node = nodes.find((item) => item.node_id === node_id);

  if (!node || typeof node.public_key !== "string" || !node.public_key.trim()) {
    return null;
  }

  return node.public_key;
}

export function verifyFederationEnvelope(envelope: unknown): boolean {
  if (!envelope || typeof envelope !== "object") {
    return false;
  }

  const candidate = envelope as Partial<FederationSignedEnvelope>;

  if (
    typeof candidate.node_id !== "string" ||
    typeof candidate.response !== "string" ||
    typeof candidate.anchor !== "string" ||
    typeof candidate.timestamp !== "string" ||
    typeof candidate.signature !== "string" ||
    candidate.algorithm !== "ED25519"
  ) {
    return false;
  }

  const publicKey = getNodePublicKey(candidate.node_id);
  if (!publicKey) {
    return false;
  }

  return verifyFederationResponse(
    candidate as FederationSignedEnvelope,
    publicKey
  );
}
