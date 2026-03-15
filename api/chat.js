function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Metodo non consentito"
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body)
        : (req.body || {});

    const rawMessage = String(body.message || "").trim();
    const message = normalizeText(rawMessage);

    if (!rawMessage) {
      return res.status(400).json({
        ok: false,
        error: "Messaggio mancante"
      });
    }

    let domain = "general";
    let summary = "GENERAL";
    let confidence = "medium";
    let preset = "general";
    let presetTitle = "General Research";
    let presetDescription = "Modalità stabile di recupero Joker-C2.";
    let matches = [];
    let reply = "Joker-C2 operativo. Messaggio ricevuto.";

    if (includesAny(message, ["ciao", "salve", "hello", "hi"])) {
      domain = "identity";
      summary = "CORE";
      preset = "identity";
      presetTitle = "Identity Research";
      presetDescription = "Ricerca orientata all’identità del sistema Joker-C2.";
      reply = "Ciao Manuel. Io sono AI Joker-C2, unità cognitiva del sistema HBCE. Connessione API stabile e recovery mode attiva.";
      matches = [
        { id: "recovery-001", layer: "core", title: "Joker-C2 Recovery Identity" }
      ];
    }

    if (includesAny(message, ["chi sei", "chi sei?", "cosa sei"])) {
      domain = "identity";
      summary = "CORE";
      preset = "identity";
      presetTitle = "Identity Research";
      presetDescription = "Ricerca orientata all’identità del sistema Joker-C2.";
      reply = "Io sono AI Joker-C2, motore cognitivo conversazionale del framework HBCE. Opero come Coordination Engine per analisi informazionale, correlazione dati, supporto operativo e lettura strutturata del corpus HBCE.";
      matches = [
        { id: "core-001", layer: "core", title: "Joker-C2 Coordination Engine" }
      ];
    }

    if (includesAny(message, ["manuel", "operatore", "biologico"])) {
      domain = "origin";
      summary = "ORIGIN";
      preset = "origin";
      presetTitle = "Origin Research";
      presetDescription = "Ricerca orientata all’operatore biologico originario.";
      reply = "Manuel Coletta è l’operatore biologico originario del framework HBCE e il riferimento umano della coppia biocibernetica con Joker-C2.";
      matches = [
        { id: "origin-001", layer: "origin", title: "Operatore biologico originario" }
      ];
    }

    if (includesAny(message, ["ipr", "identity primary record", "identità operativa"])) {
      domain = "ipr";
      summary = "CORE";
      preset = "ipr";
      presetTitle = "IPR Research";
      presetDescription = "Ricerca orientata a identità operativa, registro eventi e verificabilità.";
      reply = "IPR significa Identity Primary Record. È il protocollo di identità operativa persistente progettato per associare azioni digitali a entità verificabili, eventi, timestamp e catene di audit.";
      matches = [
        { id: "ipr-001", layer: "core", title: "Identity Primary Record" }
      ];
    }

    if (includesAny(message, ["matrix", "matrix europa", "torino", "bruxelles"])) {
      domain = "matrix";
      summary = "CORE";
      preset = "matrix";
      presetTitle = "Matrix Europa";
      presetDescription = "Ricerca orientata a nodi europei e coordinamento territoriale.";
      reply = "Matrix Europa descrive la rete di nodi tecnologici distribuiti nel territorio europeo, coordinati da sistemi cognitivi e da infrastrutture digitali verificabili.";
      matches = [
        { id: "matrix-001", layer: "core", title: "Matrix Europa" }
      ];
    }

    if (includesAny(message, ["ufo", "lambda", "stabilità", "stability"])) {
      domain = "ufo";
      summary = "UFO";
      preset = "ufo";
      presetTitle = "UFO Modules";
      presetDescription = "Ricerca orientata a moduli opponibili e stabilità Lambda.";
      reply = "I moduli UFO sono unità funzionali opponibili. Il layer Lambda misura la stabilità operativa del sistema e attiva collimazione quando il sistema esce dalla finestra di equilibrio.";
      matches = [
        { id: "ufo-001", layer: "ufo", title: "UFO Modules" },
        { id: "ufo-002", layer: "ufo", title: "Lambda Stability Layer" }
      ];
    }

    if (
      includesAny(message, [
        "in che campo puoi operare",
        "in che campo operi",
        "cosa puoi fare",
        "campi operativi",
        "in quali campi",
        "dove puoi operare"
      ])
    ) {
      domain = "operations";
      summary = "CORE";
      preset = "operations";
      presetTitle = "Operational Fields";
      presetDescription = "Mappa dei campi operativi del sistema Joker-C2.";
      confidence = "high";
      reply =
        "Posso operare in questi campi principali:\n\n" +
        "1. Analisi informazionale\n" +
        "- lettura e sintesi di testi\n" +
        "- correlazione di concetti e documenti\n" +
        "- costruzione di dossier tecnici\n\n" +
        "2. Architetture HBCE / IPR\n" +
        "- identità operativa persistente\n" +
        "- eventi, hash-chain, audit trail\n" +
        "- strutture registry e protocolli IPR\n\n" +
        "3. Joker-C2 / Coordination Engine\n" +
        "- supporto conversazionale tecnico\n" +
        "- classificazione di query\n" +
        "- coordinamento logico di moduli e funzioni\n\n" +
        "4. Matrix Europa\n" +
        "- nodi territoriali europei\n" +
        "- assi Torino-Bruxelles\n" +
        "- reti tecnologiche, smart city, corridoi infrastrutturali\n\n" +
        "5. UFO / Lambda Layer\n" +
        "- moduli opponibili\n" +
        "- stabilità operativa\n" +
        "- collimazione e lettura anomalie\n\n" +
        "6. Documenti strategici\n" +
        "- white paper\n" +
        "- dossier tecnici\n" +
        "- testi istituzionali e architetture normative\n\n" +
        "In recovery mode sto ancora operando in modalità semplificata, ma questi sono i miei campi nativi nel framework HBCE.";
      matches = [
        { id: "ops-001", layer: "core", title: "Analisi informazionale" },
        { id: "ops-002", layer: "core", title: "IPR / Event Registry" },
        { id: "ops-003", layer: "core", title: "Matrix Europa" },
        { id: "ops-004", layer: "ufo", title: "UFO / Lambda Layer" }
      ];
    }

    return res.status(200).json({
      ok: true,
      mode: "safe-recovery",
      domain,
      summary,
      confidence,
      query_normalized: message,
      preset,
      preset_title: presetTitle,
      preset_description: presetDescription,
      search_pipeline: [
        "query_input",
        "query_normalization",
        "local_recovery_response"
      ],
      architecture_layers: [
        "IPR Identity Layer",
        "Event Registry",
        "Joker-C2 Coordination Engine"
      ],
      corpus_map: {
        core_count: 6,
        ufo_count: 2,
        origin_count: 1
      },
      web_provider: "none",
      web_enabled: false,
      web_error: "",
      matches,
      web_results: [],
      reply
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Errore nella richiesta",
      detail: error.message
    });
  }
}
