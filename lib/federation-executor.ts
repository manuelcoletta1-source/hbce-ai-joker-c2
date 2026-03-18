import { getActiveNodes } from "./federation-registry";
import { callRemoteNode } from "./federation-client";

export async function executeFederated(payload: any) {
  const nodes = getActiveNodes();

  const results = await Promise.all(
    nodes.map((node) => callRemoteNode(node, payload))
  );

  return results;
}
