/**
 * =========================
 * CAUSA → POSSIBILITÀ → EFFETTO → PROBABILITÀ
 * =========================
 */

/**
 * STEP 1 — generazione possibilità
 */
export function generatePossibilities(cause) {
  if (!cause || typeof cause !== "string") return [];

  return [
    {
      id: "direct",
      effect: `Direct consequence of: ${cause}`,
      weight: 0.9,
      risk: 0.2
    },
    {
      id: "structured",
      effect: `Structured consequence of: ${cause}`,
      weight: 0.8,
      risk: 0.15
    },
    {
      id: "conservative",
      effect: `Conservative consequence of: ${cause}`,
      weight: 0.7,
      risk: 0.1
    }
  ];
}

/**
 * STEP 2 — validazione possibilità
 */
export function validatePossibility(p) {
  if (!p) return 0;

  const validWeight = typeof p.weight === "number" && p.weight >= 0.7 ? 1 : 0;
  const validRisk = typeof p.risk === "number" && p.risk <= 0.4 ? 1 : 0;

  return validWeight && validRisk ? 1 : 0;
}

/**
 * STEP 3 — calcolo probabilità
 */
export function calculateProbability(p) {
  if (!p) return 0;

  const base = p.weight || 0;
  const riskPenalty = p.risk || 0;

  return Math.max(0, base - riskPenalty);
}

/**
 * STEP 4 — selezione effetto
 */
export function resolveCausality(cause) {
  const possibilities = generatePossibilities(cause);

  const evaluated = possibilities.map((p) => {
    const valid = validatePossibility(p);
    const probability = valid ? calculateProbability(p) : 0;

    return {
      ...p,
      valid,
      probability
    };
  });

  const valid = evaluated.filter((e) => e.valid);

  if (valid.length === 0) {
    return {
      state: "FAIL_CLOSED",
      effect: null,
      probability: 0,
      possibilities: evaluated
    };
  }

  valid.sort((a, b) => b.probability - a.probability);

  return {
    state: "PASS",
    cause,
    effect: valid[0].effect,
    probability: valid[0].probability,
    possibilities: evaluated
  };
}
