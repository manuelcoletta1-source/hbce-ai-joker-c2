const KNOWLEDGE_CORE = {
  identity: {
    name: "AI JOKER-C2",
    role: "Operational AI interface of the HBCE ecosystem",
    mode: "local-corpus",
    source: "hbce-corpus-core",
    doctrine:
      "Joker-C2 responds according to the HBCE operational framework and the Corpus Esoterologia Ermetica."
  },

  principles: {
    realityKernel: "Decision · Cost · Trace · Time",
    operationalFormula: "identity → action → evidence → verification",
    style: "clear, structural, operational, identity-bound, evidence-oriented"
  },

  architecture: {
    coreStack:
      "IPR Identity Layer → Event Registry → Joker-C2 Coordination Engine → UFO Functional Modules → Λ Stability & Intercept System",
    jokerRole:
      "Joker-C2 is the cybernetic coordination layer that connects identities, events and infrastructure evidence.",
    enterpriseSpace:
      "Enterprise Space is the operational environment where identities, autonomous systems, human operators, infrastructures and event registration converge.",
    eventRegistry:
      "Event Registry is an append-only registry of operational events with identity, timestamp, verifiable hash and operational metadata."
  },

  europe: {
    axis:
      "Torino is the technical hub. Brussels is the institutional and strategic coordination hub.",
    pilot:
      "The Europe Pilot introduces a first strategic network of nodes for energy, cloud, AI, cybersecurity, governance and infrastructure resilience.",
    matrix:
      "Matrix Europa is the territorial projection of the Joker-C2 architecture across a distributed European node network."
  },

  ufo: {
    definition:
      "UFO means Unità Funzionale Opponibile, a modular component connecting physical world, digital world and legal world.",
    structure:
      "Σ-Header · Λ-Metric · AI JOKER Trace · TimeMark UTC(IT) · QES + TSA INRiM · functional payload",
    families:
      "UFO-E energy, UFO-A AI and digital systems, UFO-C civic-institutional, UFO-S space, UFO-P personal identity",
    mainModules:
      "UFO-INTERCEPT, UFO-REACTOR, UFO-SPACEDRIVE, UFO-CIVIL, ORG-NEURO"
  },

  lambda: {
    definition:
      "Λ is the system equilibrium metric.",
    nominal:
      "Nominal stability condition: Λ ≈ 1.",
    behavior:
      "When Λ exits the operating window, a state collision emerges and the system activates collimation signals."
  },

  labs: {
    frameworks:
      "UNEBDO, MetaExchange, CyberGlobal, OPC, IOSpace, NeuroLoop",
    purpose:
      "These frameworks operate as infrastructure laboratories for observing identities, autonomous interactions, global networks, operational processes, integration spaces and AI decision loops."
  },

  mobility: {
    summary:
      "Joker-C2 can also coordinate mobility infrastructures, robotaxi fleets, autonomous logistics vehicles and urban mobility systems through vehicle identity, events, evidence and verification."
  },

  volumes: {
    volume_1:
      "Corpus of Hermetic Esoterology: foundational disciplinary layer. Reality becomes observable through Decision, Cost, Trace and Time.",
    volume_2:
      "Matrix 2026: application of the framework to institutional systems, infrastructures and operational responsibility.",
    volume_3:
      "Lex Hermeticum: regime of validity, opposability, decay, integration and fail-closed logic.",
    volume_4:
      "Alien Code: biocybernetic interface between biological decision and computable system recording.",
    volume_5:
      "Alien Artifact: residual configuration produced when a process reaches irreversible exposure in time.",
    matrix_europa:
      "Matrix Europa: European technological and infrastructural projection of verifiable digital systems."
  },

  glossary: {
    ipr:
      "IPR means Identity Primary Record, the foundational identity layer of the HBCE ecosystem.",
    hbce:
      "HBCE is the operational ecosystem centered on identity, registry and evidence-oriented infrastructure logic.",
    joker:
      "AI JOKER-C2 is the operational interface and cybernetic coordination layer designed for identity-bound interaction flows.",
    lex:
      "Lex Hermeticum defines validity, opposability, responsibility and trace across time.",
    alien_code:
      "Alien Code is the biocybernetic framework where organism, system and trace become operationally observable.",
    alien_artifact:
      "Alien Artifact is the residual irreversible configuration that remains after full exposure to Decision, Cost, Trace and Time.",
    matrix:
      "Matrix Framework is the operational grid connecting reality, systems, institutions and traceable events.",
    enterprise_space:
      "Enterprise Space is the operational environment where infrastructure events become observable and reconstructable.",
    event_registry:
      "Event Registry is the append-only operational registry of the infrastructure.",
    lambda:
      "Λ is the equilibrium metric used to measure system stability.",
    ufo:
      "UFO modules are modular opposable units used to make processes measurable, auditable, certifiable and verifiable over time."
  }
};

function includesAny(input, terms) {
  return terms.some((term) => input.includes(term));
}

function buildCorpusReply(message) {
  const input = message.toLowerCase();

  if (includesAny(input, ["ciao", "hello", "hi"])) {
    return "Joker-C2 online. Corpus connection active. Local doctrinal and infrastructural layer loaded correctly.";
  }

  if (includesAny(input, ["help", "aiuto"])) {
    return "Available corpus keywords: ipr, hbce, joker, lex, alien code, alien artifact, matrix, matrix europa, enterprise space, event registry, lambda, ufo, ufo-intercept, ufo-reactor, ufo-civil, org-neuro, torino, brussels, labs, mobility, volume 1, volume 2, volume 3, volume 4, volume 5.";
  }

  if (includesAny(input, ["principle", "principio", "reality kernel"])) {
    return "Foundational principle: " + KNOWLEDGE_CORE.principles.realityKernel + ".";
  }

  if (includesAny(input, ["formula", "evidence", "verification"])) {
    return "Operational formula: " + KNOWLEDGE_CORE.principles.operationalFormula + ".";
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

  if (input.includes("lex")) {
    return KNOWLEDGE_CORE.glossary.lex;
  }

  if (input.includes("alien code")) {
    return KNOWLEDGE_CORE.glossary.alien_code;
  }

  if (input.includes("alien artifact")) {
    return KNOWLEDGE_CORE.glossary.alien_artifact;
  }

  if (input.includes("matrix europa")) {
    return KNOWLEDGE_CORE.volumes.matrix_europa + " " + KNOWLEDGE_CORE.europe.axis;
  }

  if (input.includes("matrix")) {
    return KNOWLEDGE_CORE.glossary.matrix;
  }

  if (includesAny(input, ["enterprise space", "space operativo"])) {
    return KNOWLEDGE_CORE.architecture.enterpriseSpace;
  }

  if (includesAny(input, ["event registry", "registry", "registro eventi"])) {
    return KNOWLEDGE_CORE.architecture.eventRegistry;
  }

  if (includesAny(input, ["lambda", "λ"])) {
    return KNOWLEDGE_CORE.lambda.definition + " " + KNOWLEDGE_CORE.lambda.nominal + " " + KNOWLEDGE_CORE.lambda.behavior;
  }

  if (input.includes("ufo")) {
    return KNOWLEDGE_CORE.ufo.definition + " Internal structure: " + KNOWLEDGE_CORE.ufo.structure + ". Families: " + KNOWLEDGE_CORE.ufo.families + ".";
  }

  if (input.includes("ufo-intercept")) {
    return "UFO-INTERCEPT detects state collisions, predicts deviations and generates corrective collimation trajectories.";
  }

  if (input.includes("ufo-reactor")) {
    return "UFO-REACTOR provides opposable control of energy reactors through flow measurement, Lambda-equilibrium stabilization and verifiable energy audit.";
  }

  if (input.includes("ufo-civil")) {
    return "UFO-CIVIL is the civic-administrative module for procedural audit, public transparency and verifiable public decisions.";
  }

  if (input.includes("org-neuro")) {
    return "ORG-NEURO is the biocybernetic module for neural interfaces, clinical audit and neuro-digital stability.";
  }

  if (includesAny(input, ["torino", "turin"])) {
    return "Torino is the technical hub of the Joker-C2 architecture, oriented to robotics, AI, aerospace, complex systems modeling and UFO module testing.";
  }

  if (includesAny(input, ["brussels", "bruxelles", "bruxelles"])) {
    return "Brussels is the institutional and strategic coordination hub of the European Joker-C2 architecture.";
  }

  if (includesAny(input, ["pilot", "europe pilot"])) {
    return KNOWLEDGE_CORE.europe.pilot;
  }

  if (includesAny(input, ["labs", "laboratories", "frameworks"])) {
    return "Infrastructure laboratories: " + KNOWLEDGE_CORE.labs.frameworks + ". " + KNOWLEDGE_CORE.labs.purpose;
  }

  if (includesAny(input, ["mobility", "vehicle", "robotaxi", "automotive"])) {
    return KNOWLEDGE_CORE.mobility.summary;
  }

  if (input.includes("architecture")) {
    return "Core architecture: " + KNOWLEDGE_CORE.architecture.coreStack;
  }

  if (input.includes("volume 1") || input.includes("vol 1")) {
    return KNOWLEDGE_CORE.volumes.volume_1;
  }

  if (input.includes("volume 2") || input.includes("vol 2")) {
    return KNOWLEDGE_CORE.volumes.volume_2;
  }

  if (input.includes("volume 3") || input.includes("vol 3")) {
    return KNOWLEDGE_CORE.volumes.volume_3;
  }

  if (input.includes("volume 4") || input.includes("vol 4")) {
    return KNOWLEDGE_CORE.volumes.volume_4;
  }

  if (input.includes("volume 5") || input.includes("vol 5")) {
    return KNOWLEDGE_CORE.volumes.volume_5;
  }

  return (
    "Joker-C2 received your message. Local corpus mode is active. " +
    "Use corpus terms such as IPR, Event Registry, Enterprise Space, UFO, Lambda, Torino, Brussels, Matrix Europa, Lex, Alien Code or volume numbers."
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed"
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const message = body?.message?.trim();

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "Missing message"
      });
    }

    const reply = buildCorpusReply(message);

    return res.status(200).json({
      ok: true,
      mode: KNOWLEDGE_CORE.identity.mode,
      source: KNOWLEDGE_CORE.identity.source,
      reply
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Invalid request body"
    });
  }
}
