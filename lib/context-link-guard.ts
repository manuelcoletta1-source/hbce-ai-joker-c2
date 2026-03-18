export type ContextLinkResult = {
  resolved: boolean;
  reference?: string;
  index?: number;
  confidence: number;
};

function normalize(text: string): string {
  return (text || "").toLowerCase().trim();
}

function isShortReference(msg: string): boolean {
  const patterns = [
    /^punto\s*\d+$/,
    /^il\s*primo$/,
    /^il\s*secondo$/,
    /^il\s*terzo$/,
    /^argomenta$/,
    /^\d+(-\d+)*$/,
    /^questo$/,
    /^questi$/
  ];
  return patterns.some((p) => p.test(msg));
}

function extractNumber(msg: string): number | null {
  const match = msg.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export function resolveContextLink(input: {
  message: string;
  history: string[];
}): ContextLinkResult {
  const msg = normalize(input.message);

  if (!isShortReference(msg)) {
    return { resolved: false, confidence: 0 };
  }

  const index = extractNumber(msg);

  // Cerca ultimo blocco strutturato (lista numerata)
  for (let i = input.history.length - 1; i >= 0; i--) {
    const h = normalize(input.history[i]);

    if (h.includes("1.") && h.includes("2.") && h.includes("3.")) {
      return {
        resolved: true,
        reference: input.history[i],
        index: index ?? undefined,
        confidence: 0.9
      };
    }
  }

  return { resolved: false, confidence: 0.2 };
}
