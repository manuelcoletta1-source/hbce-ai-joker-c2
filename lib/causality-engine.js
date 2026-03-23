/**
 * =========================
 * HBCE CAUSALITY ENGINE v2
 * causa → possibilità → effetto → probabilità → decisione
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
      risk: 0.2,
      class: "fast"
    },
    {
      id: "structured",
      effect: `Structured consequence of: ${cause}`,
      weight: 0.8,
      risk: 0.15,
      class: "balanced"
    },
    {
      id: "conservative",
      effect: `Conservative consequence of: ${cause}`,
      weight: 0.7,
      risk: 0.1,
      class: "safe"
    }
  ];
}

/**
 * STEP 2 — validazione
 */
export function validatePossibility(p) {
  if (!p) return 0;

  const weightOk = typeof p.weight === "number" && p.weight >= 0.7;
  const riskOk = typeof p.risk === "number" && p.risk <= 0.4;

  return weightOk && riskOk ? 1 : 0;
}

/**
 * STEP 3 — probabilità
 */
export function calculateProbability(p) {
  if (!p) return 0;

  return Math.max(0, (p.weight || 0) - (p.risk || 0));
}

/**
 * STEP 4 — classificazione decisione
 */
function classifyDecision(probability) {
  if (probability >= 0.75) return "EXECUTE";
  if (probability >= 0.6) return "EVALUATE";
  if (probability >= 0.4) return "MONITOR";
  return "BLOCK";
}

/**
 * STEP 5 — livello rischio
 */
function classifyRisk(risk) {
  if (risk <= 0.1) return "LOW";
  if (risk <= 0.25) return "MEDIUM";
  return "HIGH";
}

/**
 * STEP 6 — attivazione operativa
 */
function activationLevel(decision) {
  switch (decision) {
    case "EXECUTE":
      return "AUTO";
    case "EVALUATE":
      return "SUPERVISED";
    case "MONITOR":
      return "PASSIVE";
    default:
      return "BLOCKED";
  }
}

/**
 * STEP 7 — risoluzione completa
 */
export function resolveCausality(cause) {
  const possibilities = generatePossibilities(cause);

  const evaluated = possibilities.map((p) => {
    const valid = validatePossibility(p);
    const probability = valid ? calculateProbability(p) : 0;

    return {
      ...p,
      valid,
      probability,
      risk_level: classifyRisk(p.risk)
    };
  });

  const valid = evaluated.filter((e) => e.valid);

  if (valid.length === 0) {
    return {
      state: "FAIL_CLOSED",
      decision: "BLOCK",
      activation: "BLOCKED",
      effect: null,
      probability: 0,
      possibilities: evaluated
    };
  }

  valid.sort((a, b) => b.probability - a.probability);

  const best = valid[0];

  const decision = classifyDecision(best.probability);
  const activation = activationLevel(decision);

  return {
    state: "PASS",

    cause,

    effect: best.effect,
    probability: best.probability,

    decision,           // 🔥 nuovo
    activation,         // 🔥 nuovo
    risk_level: best.risk_level,

    possibilities: evaluated
  };
}
