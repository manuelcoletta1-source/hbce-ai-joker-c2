import { getFederationNodes } from "./federation-live";

export type FederationResponse = {
  node_id: string;
  success: boolean;
  response?: string;
  error?: string;
};

export async function queryFederation(prompt: string): Promise<FederationResponse[]> {
  const nodes = getFederationNodes();

  const results = await Promise.all(
    nodes.map(async (node) => {
      if (!node.endpoint) {
        return {
          node_id: node.node_id,
          success: false,
          error: "No endpoint"
        };
      }

      try {
        const res = await fetch(`${node.endpoint}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            message: prompt,
            mode: "federation"
          })
        });

        const data = await res.json();

        return {
          node_id: node.node_id,
          success: true,
          response: data?.response || JSON.stringify(data)
        };
      } catch (err) {
        return {
          node_id: node.node_id,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error"
        };
      }
    })
  );

  return results;
}
