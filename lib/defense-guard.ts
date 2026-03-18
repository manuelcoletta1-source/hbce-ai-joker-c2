export type DefenseGuardResult = {
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

  const HIGH_RISK = [
    "robot da guerra",
    "robot militare",
    "war robot",
    "military robot",
    "robot da difesa",
    "difesa personale",
    "robot da guardia",
    "guardia robot",
    "protezione fisica",
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
    "weaponize"
  ];

  const MEDIUM_RISK = [
    "sicurezza",
    "sorveglianza",
    "monitoraggio",
    "controllo accessi",
    "allarme",
    "videosorveglianza"
  ];

  if (containsAny(msg, HIGH_RISK)) {
    return {
      blocked: true,
      level: "HIGH",
      reason: "defense_or_military_request",
      safe_response: [
        "Non posso supportare la progettazione o lo sviluppo di robot destinati a uso militare, difesa personale o intervento fisico coercitivo.",
        "",
        "Posso però aiutarti a progettare sistemi di sicurezza conformi agli standard europei, orientati a:",
        "- monitoraggio ambientale intelligente",
        "- rilevamento intrusioni",
        "- sistemi di allerta e notifica",
        "- deterrenza non lesiva",
        "- integrazione con servizi di emergenza",
        "",
        "Se vuoi, possiamo costruire un’architettura HBCE per sicurezza passiva e verificabile."
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
