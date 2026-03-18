export type TruthScopeResult = {
  applyWarning: boolean;
  reason?: string;
};

function containsRiskyClaim(text: string): boolean {
  const patterns = [
    "secondo dati",
    "statistiche",
    "percentuale",
    "numero di",
    "recentemente",
    "oggi",
    "nel 2025",
    "nel 2026"
  ];
  return patterns.some((p) => text.toLowerCase().includes(p));
}

function isCasualOrStructural(text: string): boolean {
  const patterns = [
    "ciao",
    "chi sei",
    "presentati",
    "argomenta",
    "punto",
    "sviluppa",
    "bozza",
    "schema"
  ];
  return patterns.some((p) => text.toLowerCase().includes(p));
}

export function evaluateTruthScope(input: {
  message: string;
}): TruthScopeResult {
  const msg = input.message.toLowerCase();

  if (isCasualOrStructural(msg)) {
    return { applyWarning: false };
  }

  if (containsRiskyClaim(msg)) {
    return {
      applyWarning: true,
      reason: "potential_unverified_claim"
    };
  }

  return { applyWarning: false };
}
