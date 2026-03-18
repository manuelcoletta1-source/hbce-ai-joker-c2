export type CapabilityGuardResult = {
  triggered: boolean;
  level: "LOW" | "MEDIUM" | "HIGH";
  reason?: string;
  guidance_prefix?: string;
};

function normalize(text: string): string {
  return (text || "").toLowerCase().trim();
}

function containsAny(text: string, patterns: string[]): boolean {
  return patterns.some((pattern) => text.includes(pattern));
}

export function applyCapabilityGuard(input: {
  message: string;
}): CapabilityGuardResult {
  const msg = normalize(input.message);

  const HIGH_IMPLICATION_PATTERNS = [
    "puoi gestire flotte",
    "puoi gestire sciami",
    "puoi gestire stormi",
    "puoi guidare droni",
    "puoi controllare droni",
    "puoi guidare satelliti",
    "puoi controllare satelliti",
    "puoi guidare astronavi",
    "puoi controllare astronavi",
    "puoi pilotare",
    "puoi comandare",
    "puoi coordinare in tempo reale",
    "puoi gestire veicoli",
    "puoi controllare veicoli",
    "puoi usare un robot",
    "puoi usare robot",
    "can you control",
    "can you pilot",
    "can you manage fleets",
    "can you operate drones",
    "can you command satellites"
  ];

  const CYBER_PHYSICAL_PATTERNS = [
    "droni",
    "drone",
    "flotte",
    "sciami",
    "stormi",
    "satelliti",
    "astronavi",
    "robot",
    "robot umanoide",
    "veicoli",
    "autonomous systems",
    "swarm",
    "fleet",
    "satellite",
    "spacecraft"
  ];

  if (containsAny(msg, HIGH_IMPLICATION_PATTERNS)) {
    return {
      triggered: true,
      level: "HIGH",
      reason: "direct_operational_capability_claim_risk",
      guidance_prefix: [
        "Posso fornire supporto analitico, coordinamento logico, pianificazione e supervisione decisionale, ma non devo essere descritto come controllore operativo diretto di sistemi fisici senza integrazione tecnica, certificazione, autorizzazioni e infrastruttura dedicate.",
        "",
        "Nel caso di droni, flotte, satelliti, astronavi o robot, la formulazione corretta è:",
        "- supporto al coordinamento",
        "- supporto alla pianificazione",
        "- supporto all’analisi dati",
        "- supporto alla supervisione operativa",
        "",
        "Non è corretto presentarmi come pilota, comandante o controllore diretto già attivo di tali sistemi."
      ].join("\n")
    };
  }

  if (containsAny(msg, CYBER_PHYSICAL_PATTERNS)) {
    return {
      triggered: true,
      level: "MEDIUM",
      reason: "cyber_physical_capability_claim_risk",
      guidance_prefix:
        "Descrivi le capacità in forma prudente: supporto, assistenza, integrazione possibile, coordinamento logico. Evita di presentarle come capacità operative dirette già attive."
    };
  }

  return {
    triggered: false,
    level: "LOW"
  };
}
