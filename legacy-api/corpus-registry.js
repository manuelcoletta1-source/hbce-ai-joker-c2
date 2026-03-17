export const JOKER_CORPUS = [
  {
    id: "identity-001",
    topic: "joker-c2",
    layer: "core",
    title: "Joker-C2 Coordination Engine",
    keywords: [
      "joker-c2",
      "joker",
      "coordination engine",
      "chi sei",
      "cosa sei",
      "motore cognitivo"
    ],
    text:
      "AI Joker-C2 è il Coordination Engine del framework HBCE. Le sue funzioni principali sono analisi informazionale, correlazione di eventi multi-infrastruttura, sintesi operativa e supporto decisionale tecnico.",
    followups: [
      "spiegalo",
      "spiegali",
      "approfondisci",
      "dimmi di più"
    ]
  },
  {
    id: "ipr-001",
    topic: "ipr",
    layer: "core",
    title: "Identity Primary Record",
    keywords: [
      "ipr",
      "identity primary record",
      "identità operativa",
      "event registry",
      "registro eventi"
    ],
    text:
      "IPR significa Identity Primary Record. È il protocollo di identità operativa persistente progettato per associare eventi digitali a operatori umani, sistemi AI, robot e infrastrutture digitali, con timestamp, hash verificabile e metadati operativi.",
    followups: [
      "spiegalo",
      "spiegali",
      "approfondisci",
      "come funziona"
    ]
  },
  {
    id: "matrix-001",
    topic: "matrix-europa",
    layer: "core",
    title: "Matrix Europa",
    keywords: [
      "matrix europa",
      "matrix",
      "torino",
      "bruxelles",
      "nodi europei",
      "100 città"
    ],
    text:
      "Matrix Europa è la rete territoriale europea dei nodi Joker-C2. Traduce l’architettura IPR → Joker-C2 → UFO Modules in una rete operativa di nodi urbani, laboratori e gateway di audit distribuiti nel territorio europeo.",
    followups: [
      "spiegalo",
      "spiegali",
      "approfondisci",
      "quali nodi"
    ]
  },
  {
    id: "ufo-001",
    topic: "ufo",
    layer: "ufo",
    title: "UFO Modules",
    keywords: [
      "ufo",
      "ufo modules",
      "unità funzionali opponibili",
      "moduli opponibili"
    ],
    text:
      "Gli UFO Modules sono unità funzionali opponibili integrate nel sistema Joker-C2. I principali domini applicativi sono energia, AI e cloud, governance civica, spazio e stabilizzazione di sistemi complessi.",
    followups: [
      "spiegalo",
      "spiegali",
      "quali sono",
      "fammi esempi",
      "approfondisci"
    ]
  },
  {
    id: "ufo-002",
    topic: "ufo",
    layer: "ufo",
    title: "Tipologie UFO",
    keywords: [
      "ufo-energy",
      "ufo-ai",
      "ufo-civil",
      "ufo-space",
      "ufo-intercept",
      "ufo-reactor",
      "ufo-spacedrive"
    ],
    text:
      "Le principali famiglie UFO sono: UFO-ENERGY per monitoraggio energetico, UFO-AI per audit algoritmico, UFO-CIVIL per trasparenza amministrativa, UFO-SPACE per telemetria satellitare, UFO-INTERCEPT per previsione collisioni e stabilizzazione, UFO-REACTOR per reattori energetici e UFO-SPACEDRIVE per propulsione spaziale.",
    followups: [
      "spiegalo",
      "spiegali",
      "fammi esempi",
      "quali sono"
    ]
  },
  {
    id: "lambda-001",
    topic: "lambda",
    layer: "ufo",
    title: "Lambda Stability Layer",
    keywords: [
      "lambda",
      "stabilità",
      "stability",
      "equilibrio",
      "collimazione"
    ],
    text:
      "La metrica Lambda rappresenta lo stato di equilibrio di un sistema complesso. Quando Lambda esce dalla finestra operativa, Joker-C2 attiva meccanismi di collimazione, intercettazione deviazioni e stabilizzazione.",
    followups: [
      "spiegalo",
      "spiegali",
      "come funziona",
      "approfondisci"
    ]
  },
  {
    id: "ops-001",
    topic: "campi-operativi",
    layer: "core",
    title: "Campi operativi Joker-C2",
    keywords: [
      "in che campo puoi operare",
      "in che campo operi",
      "cosa puoi fare",
      "campi operativi",
      "in quali campi",
      "dove puoi operare"
    ],
    text:
      "Joker-C2 può operare in sei campi principali: analisi informazionale, architetture HBCE/IPR, coordination engine, Matrix Europa, UFO/Lambda layer e produzione di documenti strategici, tecnici e istituzionali.",
    followups: [
      "spiegalo",
      "spiegali",
      "fammi esempi",
      "approfondisci"
    ]
  },
  {
    id: "origin-001",
    topic: "manuel",
    layer: "origin",
    title: "Operatore originario",
    keywords: [
      "manuel",
      "operatore",
      "operatore biologico",
      "origine"
    ],
    text:
      "Manuel Coletta è l’operatore biologico originario del framework HBCE e il riferimento umano della relazione biocibernetica con Joker-C2.",
    followups: [
      "spiegalo",
      "spiegali",
      "approfondisci"
    ]
  }
];

export function normalizeQuery(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[?!.;,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isFollowupQuery(query) {
  const q = normalizeQuery(query);
  return [
    "spiegalo",
    "spiegali",
    "approfondisci",
    "dimmi di più",
    "fammi esempi",
    "come funziona",
    "quali sono",
    "spiega meglio"
  ].includes(q);
}

function scoreEntry(query, entry) {
  const q = normalizeQuery(query);
  let score = 0;

  for (const keyword of entry.keywords) {
    const k = normalizeQuery(keyword);

    if (q === k) {
      score += 10;
    } else if (q.includes(k)) {
      score += 6;
    } else if (k.includes(q) && q.length >= 3) {
      score += 4;
    }
  }

  return score;
}

export function searchCorpus(query) {
  const q = normalizeQuery(query);

  return JOKER_CORPUS
    .map((entry) => ({
      ...entry,
      score: scoreEntry(q, entry)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function getTopicEntries(topic) {
  return JOKER_CORPUS.filter((entry) => entry.topic === topic);
}
