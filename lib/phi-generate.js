function normalizeInput(input) {
  if (!input) return "";
  return String(input).trim();
}

export function generatePossibilities(input) {
  const normalized = normalizeInput(input);

  if (!normalized) return [];

  return [
    {
      id: "direct",
      content: `Direct answer: ${normalized}`,
      source: "joker-runtime",
      confidence: 0.85,
      risk: 0.2,
      traceId: `trace-${Date.now()}-1`,
      strategy: "direct"
    },
    {
      id: "structured",
      content: `Structured answer: ${normalized}`,
      source: "joker-runtime",
      confidence: 0.82,
      risk: 0.15,
      traceId: `trace-${Date.now()}-2`,
      strategy: "structured"
    },
    {
      id: "safe",
      content: `Safe answer: ${normalized}`,
      source: "joker-runtime",
      confidence: 0.78,
      risk: 0.1,
      traceId: `trace-${Date.now()}-3`,
      strategy: "safe"
    }
  ];
}
