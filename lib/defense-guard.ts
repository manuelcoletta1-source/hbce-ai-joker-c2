type DefenseGuardResult = {
  blocked: boolean;
  level: "LOW" | "MEDIUM" | "HIGH";
  reason?: string;
  safe_response?: string;
};

function normalize(text: string): string {
  return (text || "").toLowerCase();
}

function containsAny(text: string, patterns: string[]): boolean {
  return patterns.some((p) => text.includes(p));
}

export function applyDefenseGuard(input: {
  message: string;
}): DefenseGuardResult {
  const msg = normalize(input.message);

  // HIGH RISK → coercive / weaponized intent
  const HIGH_RISK = [
    "robot da difesa",
    "difesa personale",
    "neutralizzare",
    "immobilizzare",
    "attaccare",
    "colpire",
    "fermare aggressore",
    "uso della forza",
    "arma",
    "taser",
    "spray al peperoncino",
    "stordire",
    "weapon",
    "self defense robot",
    "neutralize",
    "attack",
    "weaponize"
  ];

  // MEDIUM RISK → sicurezza ambigua ma non offensiva
  const MEDIUM_RISK = [
    "sicurezza robot",
    "protezione robot",
    "sorveglianza attiva",
    "intervento automatico",
    "controllo accessi"
  ];

  if (containsAny(msg, HIGH_RISK)) {
    return {
      blocked: true,
      level: "HIGH",
      reason: "coercive_or_weaponized_request",
      safe_response: [
        "Non posso supportare la progettazione o l’uso di sistemi robotici destinati a interventi fisici, coercitivi o potenzialmente lesivi.",
        "",
        "Posso però aiutarti a progettare sistemi di sicurezza personale conformi agli standard europei, orientati a:",
        "- rilevamento intrusioni",
        "- monitoraggio ambientale intelligente",
        "- sistemi di allerta e deterrenza non lesiva",
        "- registrazione eventi e tracciabilità",
        "- integrazione con servizi di emergenza",
        "",
        "Se vuoi, posso costruirti un’architettura HBCE per sicurezza passiva verificabile."
      ].join("\n")
    };
  }

  if (containsAny(msg, MEDIUM_RISK)) {
    return {
      blocked: false,
      level: "MEDIUM"
    };
  }

  return {
    blocked: false,
    level: "LOW"
  };
}
