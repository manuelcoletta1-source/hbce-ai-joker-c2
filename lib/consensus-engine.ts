export type ModelResponse = {
  model: string;
  text: string;
};

export type ConsensusResult = {
  consensus_text: string;
  models: string[];
  confidence: "low" | "medium" | "high";
};

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function scoreConfidence(responses: ModelResponse[]): "low" | "medium" | "high" {
  if (responses.length >= 3) return "high";
  if (responses.length === 2) return "medium";
  return "low";
}

export function buildConsensus(
  responses: ModelResponse[]
): ConsensusResult | null {
  const valid = responses
    .filter((item) => item && typeof item.text === "string" && item.text.trim().length > 0)
    .map((item) => ({
      model: item.model,
      text: normalizeText(item.text)
    }));

  if (valid.length === 0) {
    return null;
  }

  const consensusText = valid.map((item) => item.text).join("\n\n---\n\n");

  return {
    consensus_text: consensusText,
    models: valid.map((item) => item.model),
    confidence: scoreConfidence(valid)
  };
}
