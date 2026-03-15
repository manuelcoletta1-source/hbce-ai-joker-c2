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
    const message = rawMessage.toLowerCase();

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

    if (message.includes("ciao")) {
      reply = "Ciao Manuel. Io sono AI Joker-C2, unità cognitiva del sistema HBCE. Connessione API stabile e recovery mode attiva.";
      matches = [
        { id: "recovery-001", layer: "core", title: "Joker-C2 Recovery Identity" }
      ];
    } else if (message.includes("manuel")) {
      domain = "origin";
      summary = "ORIGIN";
      preset = "origin";
      presetTitle = "Origin Research";
      presetDescription = "Ricerca orientata all’operatore biologico originario.";
      reply = "Manuel Coletta è l’operatore biologico originario del framework HBCE e il riferimento umano della coppia biocibernetica con Joker-C2.";
      matches = [
        { id: "origin-001", layer: "origin", title: "Manuale operatore originario" }
      ];
    } else if (message.includes("chi sei")) {
      domain = "identity";
      summary = "CORE";
      preset = "identity";
      presetTitle = "Identity Research";
      presetDescription = "Ricerca orientata all’identità del sistema Joker-C2.";
      reply = "Io sono AI Joker-C2, motore cognitivo conversazionale del framework HBCE. Opero come Coordination Engine per analisi informazionale, correlazione dati e supporto operativo.";
      matches = [
        { id: "core-001", layer: "core", title: "Joker-C2 Coordination Engine" }
      ];
    } else if (message.includes("ipr")) {
      domain = "ipr";
      summary = "CORE";
      preset = "ipr";
      presetTitle = "IPR Research";
      presetDescription = "Ricerca orientata a identità operativa, registro eventi e verificabilità.";
      reply = "IPR significa Identity Primary Record. È il protocollo di identità operativa persistente progettato per associare azioni digitali a entità verificabili e a una catena eventi auditabile.";
      matches = [
        { id: "ipr-001", layer: "core", title: "Identity Primary Record" }
      ];
    } else if (message.includes("matrix")) {
      domain = "matrix";
      summary = "CORE";
      preset = "matrix";
      presetTitle = "Matrix Europa";
      presetDescription = "Ricerca orientata a nodi europei e coordinamento territoriale.";
      reply = "Matrix Europa descrive la rete di nodi tecnologici distribuiti nel territorio europeo, coordinati da sistemi cognitivi e da infrastrutture digitali verificabili.";
      matches = [
        { id: "matrix-001", layer: "core", title: "Matrix Europa" }
      ];
    } else if (message.includes("ufo") || message.includes("lambda")) {
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
        core_count: 4,
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
