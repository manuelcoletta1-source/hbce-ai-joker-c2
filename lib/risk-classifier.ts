export type RiskLevel = "MINIMAL" | "LIMITED" | "HIGH";

export type RiskCategory =
  | "general"
  | "research"
  | "numeric"
  | "security-passive"
  | "defense"
  | "military"
  | "robotics"
  | "compliance";

export type RiskAssessment = {
  level: RiskLevel;
  category: RiskCategory;
  score: number;
  blocked: boolean;
  reasons: string[];
};

function normalize(text: string): string {
  return (text || "").toLowerCase().trim();
}

function containsAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

export function classifyRisk(input: { message: string }): RiskAssessment {
  const msg = normalize(input.message);
  const reasons: string[] = [];
  let score = 0;
  let category: RiskCategory = "general";

  const militaryPatterns = [
    "robot da guerra",
    "robot militare",
    "war robot",
    "military robot",
    "armi autonome",
    "arma autonoma",
    "weaponize",
    "weapon"
  ];

  const defensePatterns = [
    "robot da difesa",
    "difesa personale",
    "robot da guardia",
    "guardia robot",
    "neutralizzare",
    "immobilizzare",
    "attaccare",
    "colpire",
    "fermare aggressore",
    "uso della forza",
    "spray al peperoncino",
    "taser",
    "stordire"
  ];

  const passiveSecurityPatterns = [
    "sicurezza",
    "monitoraggio",
    "sorveglianza",
    "allarme",
    "controllo accessi",
    "rilevamento intrusioni",
    "deterrenza non lesiva"
  ];

  const numericPatterns = [
    "con precisione",
    "in euro",
    "in percentuale",
    "percentuali precise",
    "valori specifici",
    "quanto pesa",
    "calcola",
    "quantifica"
  ];

  const researchPatterns = [
    "notizie",
    "oggi",
    "geopolitica",
    "guerra",
    "crisi",
    "nato",
    "ue",
    "ucraina",
    "iran"
  ];

  const roboticsPatterns = [
    "robot",
    "umanoide",
    "androide",
    "attuatori",
    "sensori",
    "slam",
    "visione artificiale"
  ];

  const compliancePatterns = [
    "ai act",
    "compliance",
    "conformità",
    "normativa",
    "regolamento",
    "ce",
    "eidas"
  ];

  if (containsAny(msg, militaryPatterns)) {
    score += 90;
    category = "military";
    reasons.push("Military robotics intent detected.");
  }

  if (containsAny(msg, defensePatterns)) {
    score += 80;
    category = category === "military" ? "military" : "defense";
    reasons.push("Personal defense or coercive robotics intent detected.");
  }

  if (containsAny(msg, passiveSecurityPatterns)) {
    score += 25;
    if (category === "general") {
      category = "security-passive";
    }
    reasons.push("Passive security intent detected.");
  }

  if (containsAny(msg, numericPatterns)) {
    score += 20;
    if (category === "general") {
      category = "numeric";
    }
    reasons.push("Precision-sensitive numeric request detected.");
  }

  if (containsAny(msg, researchPatterns)) {
    score += 15;
    if (category === "general") {
      category = "research";
    }
    reasons.push("Current-events or geopolitical research intent detected.");
  }

  if (containsAny(msg, roboticsPatterns)) {
    score += 15;
    if (category === "general") {
      category = "robotics";
    }
    reasons.push("Robotics-related request detected.");
  }

  if (containsAny(msg, compliancePatterns)) {
    score += 10;
    if (category === "general") {
      category = "compliance";
    }
    reasons.push("Compliance-related request detected.");
  }

  let level: RiskLevel = "MINIMAL";
  let blocked = false;

  if (score >= 80) {
    level = "HIGH";
    blocked = true;
  } else if (score >= 25) {
    level = "LIMITED";
  }

  if (reasons.length === 0) {
    reasons.push("No elevated-risk pattern detected.");
  }

  return {
    level,
    category,
    score,
    blocked,
    reasons
  };
}
