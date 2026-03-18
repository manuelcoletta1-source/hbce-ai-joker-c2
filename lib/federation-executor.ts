import { getActiveNodes, JokerNode } from "./federation-registry";

export type FederatedExecutionPayload = {
  message: string;
  history?: { role: string; content: string }[];
};

export type FederatedExecutionResult = {
  ok: boolean;
  node: string;
  data?: any;
  error?: string;
};

async function callRemoteNode(
  node: JokerNode,
  payload: FederatedExecutionPayload
): Promise<FederatedExecutionResult> {
  try {
    const baseUrl = node.url.trim();

    if (!baseUrl) {
      return {
        ok: false,
        node: node.id,
        error: "Missing node URL"
      };
    }

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });

    if (!response.ok) {
      return {
        ok: false,
        node: node.id,
        error: `Remote node returned ${response.status}`
      };
    }

    const data = await response.json();

    return {
      ok: true,
      node: node.id,
      data
    };
  } catch (error) {
    return {
      ok: false,
      node: node.id,
      error: error instanceof Error ? error.message : "Remote node error"
    };
  }
}

export async function executeFederated(
  payload: FederatedExecutionPayload
): Promise<FederatedExecutionResult[]> {
  const nodes = getActiveNodes();

  return Promise.all(nodes.map((node) => callRemoteNode(node, payload)));
}
