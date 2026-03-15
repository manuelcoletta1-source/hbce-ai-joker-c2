const KNOWLEDGE_CORE = {
  identity: {
    name: "AI JOKER-C2",
    role: "Interfaccia operativa AI dell’ecosistema HBCE",
    mode: "local-corpus",
    source: "hbce-corpus-core",
    doctrine:
      "Joker-C2 risponde secondo il framework operativo HBCE e il Corpus di Esoterologia Ermetica."
  },

  principles: {
    realityKernel: "Decisione · Costo · Traccia · Tempo",
    operationalFormula: "identità → azione → evidenza → verifica",
    description:
      "Questo è il nucleo disciplinare che rende osservabili i processi della realtà."
  },

  architecture: {
    coreStack:
      "IPR → Event Registry → Joker-C2 Coordination Engine → Moduli UFO → Sistema Λ di stabilità",
    jokerRole:
      "Joker-C2 è il livello di coordinamento cibernetico che connette identità, eventi e infrastrutture.",
    enterpriseSpace:
      "Enterprise Space è l’ambiente operativo dove convergono identità, sistemi autonomi, operatori umani e registrazione degli eventi.",
    eventRegistry:
      "Event Registry è il registro append-only degli eventi operativi con identità, timestamp e evidenza verificabile."
  },

  europe: {
    axis:
      "Torino rappresenta l’hub tecnico. Bruxelles rappresenta l’hub istituzionale e strategico.",
    pilot:
      "Il progetto Europe Pilot introduce una prima rete di nodi infrastrutturali per energia, cloud, AI, cybersicurezza e governance.",
    matrix:
      "Matrix Europa è la proiezione territoriale europea delle infrastrutture verificabili."
  },

  ufo: {
    definition:
      "UFO significa Unità Funzionale Opponibile, un modulo che collega mondo fisico, mondo digitale e mondo giuridico.",
    structure:
      "Σ-Header · Λ-Metric · Joker-Trace · TimeMark UTC · Firma QES + TSA",
    families:
      "UFO-E energia, UFO-A intelligenza artificiale, UFO-C civico-istituzionale, UFO-S spazio, UFO-P identità personale",
    modules:
      "UFO-INTERCEPT, UFO-REACTOR, UFO-SPACEDRIVE, UFO-CIVIL, ORG-NEURO"
  },

  lambda: {
    definition:
      "Λ è la metrica di equilibrio del sistema.",
    nominal:
      "Condizione di stabilità nominale: Λ ≈ 1.",
    behavior:
      "Quando Λ esce dalla finestra operativa emerge una collisione di stato e il sistema attiva segnali di collimazione."
  },

  glossary: {
    ipr:
      "IPR significa Identity Primary Record, il livello di identità fondamentale dell’ecosistema HBCE.",
    hbce:
      "HBCE è l’ecosistema operativo centrato su identità, registri e infrastrutture di evidenza verificabile.",
    joker:
      "AI Joker-C2 è l’interfaccia operativa che coordina identità, eventi e infrastrutture.",
    lex:
      "Lex Hermeticum definisce validità, opponibilità e responsabilità degli eventi registrati.",
    alien_code:
      "Alien Code è il framework biocibernetico che collega organismo biologico e sistema computazionale.",
    alien_artifact:
      "Alien Artifact è la configurazione residua che emerge quando un processo diventa irreversibile nel tempo.",
    matrix:
      "Matrix Framework è la griglia operativa che collega realtà, sistemi e istituzioni."
  },

  volumes: {
    volume_1:
      "Volume I – Fondamenti disciplinari: Decisione, Costo, Traccia e Tempo.",
    volume_2:
      "Volume II – Matrix 2026: applicazione del modello alle infrastrutture e alle istituzioni.",
    volume_3:
      "Volume III – Lex Hermeticum: validità, opponibilità e regime fail-closed.",
    volume_4:
      "Volume IV – Alien Code: interfaccia biocibernetica.",
    volume_5:
      "Volume V – Alien Artifact: configurazioni residue dei processi esposti nel tempo."
  }
};

function includesAny(input, terms) {
  return terms.some(term => input.includes(term));
}

function buildReply(message) {

  const input = message.toLowerCase();

  if (includesAny(input, ["ciao","salve"])) {
    return "Joker-C2 operativo. Connessione al corpus di ricerca attiva.";
  }

  if (includesAny(input, ["aiuto","help"])) {
    return "Parole chiave disponibili: ipr, hbce, joker, enterprise space, event registry, lambda, ufo, matrix europa, torino, bruxelles, volume 1-5.";
  }

  if (input.includes("ipr")) {
    return KNOWLEDGE_CORE.glossary.ipr;
  }

  if (input.includes("hbce")) {
    return KNOWLEDGE_CORE.glossary.hbce;
  }

  if (input.includes("joker")) {
    return KNOWLEDGE_CORE.glossary.joker;
  }

  if (input.includes("enterprise")) {
    return KNOWLEDGE_CORE.architecture.enterpriseSpace;
  }

  if (input.includes("event registry")) {
    return KNOWLEDGE_CORE.architecture.eventRegistry;
  }

  if (input.includes("lambda") || input.includes("λ")) {
    return KNOWLEDGE_CORE.lambda.definition + " " + KNOWLEDGE_CORE.lambda.nominal;
  }

  if (input.includes("ufo")) {
    return KNOWLEDGE_CORE.ufo.definition + ". Struttura: " + KNOWLEDGE_CORE.ufo.structure;
  }

  if (input.includes("torino")) {
    return KNOWLEDGE_CORE.europe.axis;
  }

  if (input.includes("bruxelles") || input.includes("brussels")) {
    return KNOWLEDGE_CORE.europe.axis;
  }

  if (input.includes("matrix europa")) {
    return KNOWLEDGE_CORE.europe.matrix;
  }

  if (input.includes("volume 1")) {
    return KNOWLEDGE_CORE.volumes.volume_1;
  }

  if (input.includes("volume 2")) {
    return KNOWLEDGE_CORE.volumes.volume_2;
  }

  if (input.includes("volume 3")) {
    return KNOWLEDGE_CORE.volumes.volume_3;
  }

  if (input.includes("volume 4")) {
    return KNOWLEDGE_CORE.volumes.volume_4;
  }

  if (input.includes("volume 5")) {
    return KNOWLEDGE_CORE.volumes.volume_5;
  }

  return "Joker-C2 ha ricevuto il messaggio. Il sistema è in modalità corpus locale di ricerca.";
}

export default async function handler(req,res){

  if(req.method !== "POST"){
    return res.status(405).json({error:"Metodo non consentito"});
  }

  try{

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message?.trim();

    if(!message){
      return res.status(400).json({error:"Messaggio mancante"});
    }

    const reply = buildReply(message);

    return res.status(200).json({
      ok:true,
      mode:KNOWLEDGE_CORE.identity.mode,
      source:KNOWLEDGE_CORE.identity.source,
      reply
    });

  }catch(error){

    return res.status(500).json({
      ok:false,
      error:"Errore nella richiesta"
    });

  }

}
