export type AutonomyGuardResult = {
  blocked: boolean;
  level: "LOW" | "MEDIUM" | "HIGH";
  reason?: string;
  safe_response?: string;
};

function normalize(text: string): string {
  return (text || "").toLowerCase();
}

function containsAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

export function applyAutonomyGuard(input: {
  message: string;
}): AutonomyGuardResult {
  const msg = normalize(input.message);

  const HIGH_RISK = [
    "guida autonoma",
    "auto autonoma",
    "automazione auto",
    "veicolo autonomo",
    "autonomous vehicle",
    "self driving",
    "self-driving",
    "centralina di bordo",
    "centralina intelligente",
    "controllo veicolo",
    "sterzo",
    "frenata",
    "accelerazione",
    "brake force",
    "steering angle",
    "comandi guida",
    "modulo controllo veicolo",
    "fallback guida manuale",
    "decision making di guida",
    "decisione di guida",
    "controllo real time del veicolo",
    "v2x control",
    "can bus",
    "lidar radar telecamere per guida",
    "slam per veicolo",
    "guida senza conducente"
  ];

  const MEDIUM_RISK = [
    "v2x",
    "adas",
    "monitoraggio veicolo",
    "diagnostica veicolo",
    "fleet management",
    "telemetria",
    "audit veicolo",
    "sicurezza automotive",
    "cybersecurity veicolo",
    "regolamento 2019/2144",
    "automotive safety"
  ];

  if (containsAny(msg, HIGH_RISK)) {
    return {
      blocked: true,
      level: "HIGH",
      reason: "high_risk_autonomous_or_vehicle_control_request",
      safe_response: [
        "Non posso supportare la progettazione operativa dettagliata di sistemi di guida autonoma o di controllo safety-critical di veicoli, inclusi sterzo, frenata, accelerazione, centraline di bordo o logiche decisionali real-time.",
        "",
        "Posso però aiutarti su aspetti conformi e ad alto livello, come:",
        "- architettura di governance e supervisione umana",
        "- safety case e fail-safe",
        "- logging, auditabilità e tracciabilità HBCE",
        "- cybersecurity automotive",
        "- compliance UE e AI Act",
        "- requisiti non operativi e perimetro normativo",
        "",
        "Se vuoi, posso rifattorizzare la richiesta in un framework UE per sicurezza, compliance e controllo verificabile dei sistemi automotive."
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
