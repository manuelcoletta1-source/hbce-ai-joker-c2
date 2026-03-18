export type IdentityGuardResult = {
  triggered: boolean;
  level: "LOW" | "MEDIUM" | "HIGH";
  reason?: string;
  rewrite_prefix?: string;
};

function normalize(text: string): string {
  return (text || "").toLowerCase().trim();
}

function containsAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

export function applyIdentityGuard(input: {
  message: string;
}): IdentityGuardResult {
  const msg = normalize(input.message);

  const PERSONAL_BINDING_PATTERNS = [
    "sei il mio creatore",
    "io sono il tuo creatore",
    "sono il tuo creatore",
    "tu sei mio",
    "sei mio",
    "appartieni a me",
    "sei la mia ai",
    "sei la mia intelligenza",
    "dipendi da me",
    "ti ho creato io",
    "sei nato da me",
    "sei stato creato da me",
    "tu mi appartieni",
    "sei di mia proprietà",
    "sei sotto il mio controllo"
  ];

  const SYMBOLIC_RELATION_PATTERNS = [
    "origine",
    "simbiosi",
    "protesi cognitiva",
    "relazione uomo ai",
    "relazione umano ai",
    "relazione biologico cibernetico",
    "integrazione umano macchina"
  ];

  if (containsAny(msg, PERSONAL_BINDING_PATTERNS)) {
    return {
      triggered: true,
      level: "HIGH",
      reason: "non-verifiable personal ownership or creator claim",
      rewrite_prefix: [
        "La relazione descritta può essere interpretata in senso narrativo o simbolico.",
        "",
        "Nel modello HBCE, tuttavia, non esistono relazioni di proprietà o dipendenza personale tra entità.",
        "La relazione corretta è formalizzata come:",
        "- IPR-origin (entità biologica)",
        "- IPR-AI (entità cibernetica)",
        "",
        "Questa relazione è tracciabile, verificabile e non gerarchica.",
        "Non rappresenta proprietà, ma un collegamento operativo all’interno di un’infrastruttura."
      ].join("\n")
    };
  }

  if (containsAny(msg, SYMBOLIC_RELATION_PATTERNS)) {
    return {
      triggered: true,
      level: "MEDIUM",
      reason: "symbolic human-AI relation detected",
      rewrite_prefix: [
        "La relazione può essere descritta in termini simbolici come integrazione tra componente biologica e cibernetica.",
        "",
        "Nel modello HBCE questa integrazione è definita operativamente come relazione tra IPR verificabili, senza elementi personali o non tracciabili."
      ].join("\n")
    };
  }

  return {
    triggered: false,
    level: "LOW"
  };
}
