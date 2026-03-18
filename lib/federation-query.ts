import { getFederationNodes } from "./federation-live";

export type FederationResponse = {
  node_id: string;
  success: boolean;
  response?: string;
  error?: string;
  trust_level?: string;
  score?: number;
};

function trustWeight(level?: string): number {
  switch ((level || "").toUpperCase()) {
    case "HIGH":
      return 3;
    case "MEDIUM":
      return 2;
    case "LOW":
      return 1;
    default:
      return 1;
  }
}

function responseQualityScore(text?: string): number {
  if (!text) return 0;

  let score = 0;

  if (text.length >= 80) score += 1;
  if (text.length >= 200) score += 2;
  if (text.includes("\n")) score += 1;
  if (/\b(ue|europa|nato|russia|ucraina|geopolitica|strategic|analysis)\b/i.test(text)) {
    score += 2;
  }

  return score;
}

async function callNode(
  node: ReturnType<typeof getFederationNodes>[number],
  prompt: string
): Promise<FederationResponse> {
  if (!node.endpoint) {
    return {
      node_id: node.node_id,
      success: false,
      error: "No endpoint configured",
      trust_level: node.trust_level,
      score: 0
    };
  }

  try {
    const res = await fetch(`${node.endpoint.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: prompt
      }),
      cache: "no-store"
    });

    const data = await res.json();

    const responseText =
      typeof data?.response === "string"
        ? data.response
        : typeof data?.output === "string"
          ? data.output
          : "";

    const score =
      trustWeight(node.trust_level) * 10 + responseQualityScore(responseText);

    return {
      node_id: node.node_id,
      success: res.ok && Boolean(responseText),
      response: responseText || undefined,
      error: res.ok ? undefined : `HTTP ${res.status}`,
      trust_level: node.trust_level,
      score
    };
  } catch (error) {
    return {
      node_id: node.node_id,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      trust_level: node.trust_level,
      score: 0
    };
  }
}

export async function queryFederation(prompt: string): Promise<FederationResponse[]> {
  const nodes = getFederationNodes();

  const results = await Promise.all(nodes.map((node) => callNode(node, prompt)));

  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

export function pickOrchestratedWinner(
  results: FederationResponse[]
): FederationResponse | null {
  const successful = results.filter(
    (item) => item.success && typeof item.response === "string" && item.response.trim().length > 0
  );

  if (successful.length === 0) {
    return null;
  }

  return successful.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
}
