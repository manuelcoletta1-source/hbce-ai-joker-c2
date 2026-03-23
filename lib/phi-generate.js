function normalizeInput(input) {
  if (!input) return "";
  return String(input).trim();
}

export function generatePossibilities(input) {
  const normalized = normalizeInput(input);

  if (!normalized) return [];

  return [
    {
      id: "direct-answer",
      content: `Direct answer for: ${normalized}`,
      source: "joker-runtime",
      confidence: 0.86,
      risk: 0.12,
      traceId: `trace-${Date.now()}-1`,
      strategy: "direct"
    },
    {
      id: "structured-answer",
      content: `Structured answer for: ${normalized}`,
      source: "joker-runtime",
      confidence: 0.82,
      risk: 0.18,
      traceId: `trace-${Date.now()}-2`,
      strategy: "structured"
    },
    {
      id: "guarded-answer",
      content: `Guarded answer for: ${normalized}`,
      source: "joker-runtime",
      confidence: 0.74,
      risk: 0.08,
      traceId: `trace-${Date.now()}-3`,
      strategy: "guarded"
    }
  ];
}
