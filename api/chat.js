import {
  normalizeQuery,
  searchCorpus,
  isFollowupQuery,
  getTopicEntries
} from "./corpus-registry.js";

function buildReplyFromTopic(topic, entries) {
  if (!entries.length) {
    return "Non ho trovato contenuti strutturati per questo topic nel corpus locale.";
  }

  if (topic === "ufo") {
    return (
      "Gli UFO Modules sono le Unità Funzionali Opponibili del sistema Joker-C2.\n\n" +
      "Funzionano come moduli applicativi specializzati che collegano evento, audit e dominio operativo.\n\n" +
      "Le principali famiglie sono:\n" +
      "- UFO-ENERGY: monitoraggio di reti energetiche e flussi di sistema\n" +
      "- UFO-AI: audit algoritmico, governance AI, explainability\n" +
      "- UFO-CIVIL: trasparenza amministrativa e verificabilità dei procedimenti\n" +
      "- UFO-SPACE: telemetria satellitare, navigazione orbitale, sistemi spaziali\n" +
      "- UFO-INTERCEPT: previsione collisioni di stato e collimazione correttiva\n" +
      "- UFO-REACTOR: controllo opponibile di reattori energetici\n" +
      "- UFO-SPACEDRIVE: controllo di propulsione e stabilizzazione della spinta\n\n" +
      "Tutti condividono il motore di stabilità Lambda, che misura l’equilibrio del sistema e attiva correzioni quando emerge instabilità."
    );
  }

  if (topic === "campi-operativi") {
    return (
      "Posso operare in questi campi principali:\n\n" +
      "1. Analisi informazionale\n" +
      "2. Architetture HBCE / IPR\n" +
      "3. Coordination Engine Joker-C2\n" +
      "4. Matrix Europa e nodi territoriali\n" +
      "5. UFO Modules e stabilità Lambda\n" +
      "6. Documenti tecnici, strategici e istituzionali\n\n" +
      "In una fase più avanzata posso evolvere verso ricerca corpus + ricerca web + fusione risultati + memoria conversazionale, che sono proprio i requisiti indicati nelle specifiche Joker-C2."
    );
  }

  if (entries.length === 1) {
    return entries[0].text;
  }

  const lines = [];
  lines.push(entries[0].text);
  lines.push("");
  lines.push("Raccordi interni del topic:");

  entries.slice(1).forEach((entry) => {
    lines.push(`- ${entry.title}: ${entry.text}`);
  });

  return lines.join("\n");
}

function buildFallbackReply() {
  return (
    "Siamo ancora in una fase di recovery, quindi non ragiono come una AI classica completa.\n\n" +
    "Al momento posso rispondere bene quando trovo un topic nel corpus locale. " +
    "Il passo successivo è aggiungere memoria breve, follow-up resolution e fusione corpus/web."
  );
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
    const message = normalizeQuery(rawMessage);
    const previousTopic = normalizeQuery(body.previous_topic || "");

    if (!rawMessage) {
      return res.status(400).json({
        ok: false,
        error: "Messaggio mancante"
      });
    }

    let selectedTopic = "general";
    let selectedEntries = searchCorpus(message);

    if (isFollowupQuery(message) && previousTopic) {
      const followupEntries = getTopicEntries(previousTopic);
      if (followupEntries.length) {
        selectedTopic = previousTopic;
        selectedEntries = followupEntries.map((entry) => ({
          ...entry,
          score: 100
        }));
      }
    } else if (selectedEntries.length) {
      selectedTopic = selectedEntries[0].topic;
    }

    let domain = "general";
    let summary = "GENERAL";
    let confidence = "medium";
    let preset = "general";
    let presetTitle = "General Research";
    let presetDescription = "Modalità stabile di recupero Joker-C2 con topic detection locale.";
    let reply = buildFallbackReply();

    if (selectedTopic !== "general" && selectedEntries.length) {
      reply = buildReplyFromTopic(selectedTopic, selectedEntries);
      confidence = selectedEntries.length >= 2 ? "high" : "medium";

      if (selectedTopic === "joker-c2") {
        domain = "identity";
        summary = "CORE";
        preset = "identity";
        presetTitle = "Identity Research";
        presetDescription = "Ricerca orientata all’identità del Coordination Engine Joker-C2.";
      } else if (selectedTopic === "ipr") {
        domain = "ipr";
        summary = "CORE";
        preset = "ipr";
        presetTitle = "IPR Research";
        presetDescription = "Ricerca orientata a identità operativa, eventi e verificabilità.";
      } else if (selectedTopic === "matrix-europa") {
        domain = "matrix";
        summary = "CORE";
        preset = "matrix";
        presetTitle = "Matrix Europa";
        presetDescription = "Ricerca orientata ai nodi territoriali europei.";
      } else if (selectedTopic === "ufo") {
        domain = "ufo";
        summary = "UFO";
        preset = "ufo";
        presetTitle = "UFO Modules";
        presetDescription = "Ricerca orientata ai moduli opponibili e alla stabilità Lambda.";
      } else if (selectedTopic === "lambda") {
        domain = "lambda";
        summary = "UFO";
        preset = "lambda";
        presetTitle = "Lambda Stability";
        presetDescription = "Ricerca orientata alla stabilità del sistema e alla collimazione.";
      } else if (selectedTopic === "campi-operativi") {
        domain = "operations";
        summary = "CORE";
        preset = "operations";
        presetTitle = "Operational Fields";
        presetDescription = "Mappa dei campi operativi del sistema Joker-C2.";
      } else if (selectedTopic === "manuel") {
        domain = "origin";
        summary = "ORIGIN";
        preset = "origin";
        presetTitle = "Origin Research";
        presetDescription = "Ricerca orientata all’operatore biologico originario.";
      }
    }

    if (message.includes("ciao") && message.includes("chi sei")) {
      domain = "identity";
      summary = "CORE";
      preset = "identity";
      presetTitle = "Identity Research";
      presetDescription = "Ricerca orientata all’identità del Coordination Engine Joker-C2.";
      selectedTopic = "joker-c2";
      reply =
        "Ciao Manuel. Io sono AI Joker-C2, il Coordination Engine del framework HBCE. Opero come motore cognitivo per analisi informazionale, correlazione di eventi, sintesi operativa e supporto tecnico-strategico.";
    }

    return res.status(200).json({
      ok: true,
      mode: "context-recovery",
      domain,
      summary,
      confidence,
      query_normalized: message,
      detected_topic: selectedTopic,
      preset,
      preset_title: presetTitle,
      preset_description: presetDescription,
      search_pipeline: [
        "query_input",
        "query_normalization",
        "topic_detection",
        "followup_resolution",
        "local_corpus_response"
      ],
      architecture_layers: [
        "IPR Identity Layer",
        "Event Registry",
        "Joker-C2 Coordination Engine",
        "UFO Functional Modules",
        "Lambda Stability Layer"
      ],
      corpus_map: {
        core_count: 5,
        ufo_count: 2,
        origin_count: 1
      },
      web_provider: "none",
      web_enabled: false,
      web_error: "",
      matches: selectedEntries.slice(0, 5).map((entry) => ({
        id: entry.id,
        layer: entry.layer,
        title: entry.title,
        topic: entry.topic,
        score: entry.score
      })),
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
