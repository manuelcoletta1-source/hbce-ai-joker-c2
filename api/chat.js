import {
  normalizeQuery,
  searchCorpus,
  isFollowupQuery,
  getTopicEntries
} from "./corpus-registry.js";

function parseRequestBody(req) {
  if (!req || req.body == null) return {};
  return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
}

function sendJson(res, status, payload) {
  return res.status(status).json(payload);
}

function sendMethodNotAllowed(res) {
  return sendJson(res, 405, {
    ok: false,
    error: "Metodo non consentito"
  });
}

function sendBadRequest(res, error) {
  return sendJson(res, 400, {
    ok: false,
    error
  });
}

function sendInternalError(res, error) {
  return sendJson(res, 500, {
    ok: false,
    error: "Errore nella richiesta",
    detail: error instanceof Error ? error.message : String(error)
  });
}

function getDefaultMeta() {
  return {
    domain: "general",
    summary: "GENERAL",
    preset: "general",
    presetTitle: "General Research",
    presetDescription:
      "Modalità legacy di recupero Joker-C2 con topic detection locale."
  };
}

function buildFallbackReply() {
  return (
    "Questo endpoint legacy opera ancora in modalità corpus locale.\n\n" +
    "Per la chat conversazionale GPT-style di Joker-C2 usare il nuovo endpoint Next.js in app/api/chat/route.ts."
  );
}

function buildUfoReply() {
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

function buildOperationalFieldsReply() {
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

function buildReplyFromTopic(topic, entries) {
  if (!entries.length) {
    return "Non ho trovato contenuti strutturati per questo topic nel corpus locale.";
  }

  if (topic === "ufo") {
    return buildUfoReply();
  }

  if (topic === "campi-operativi") {
    return buildOperationalFieldsReply();
  }

  if (entries.length === 1) {
    return entries[0].text;
  }

  const lines = [entries[0].text, "", "Raccordi interni del topic:"];

  for (const entry of entries.slice(1)) {
    lines.push(`- ${entry.title}: ${entry.text}`);
  }

  return lines.join("\n");
}

function getTopicMeta(topic) {
  switch (topic) {
    case "joker-c2":
      return {
        domain: "identity",
        summary: "CORE",
        preset: "identity",
        presetTitle: "Identity Research",
        presetDescription:
          "Ricerca legacy orientata all’identità del Coordination Engine Joker-C2."
      };

    case "ipr":
      return {
        domain: "ipr",
        summary: "CORE",
        preset: "ipr",
        presetTitle: "IPR Research",
        presetDescription:
          "Ricerca legacy orientata a identità operativa, eventi e verificabilità."
      };

    case "matrix-europa":
      return {
        domain: "matrix",
        summary: "CORE",
        preset: "matrix",
        presetTitle: "Matrix Europa",
        presetDescription:
          "Ricerca legacy orientata ai nodi territoriali europei."
      };

    case "ufo":
      return {
        domain: "ufo",
        summary: "UFO",
        preset: "ufo",
        presetTitle: "UFO Modules",
        presetDescription:
          "Ricerca legacy orientata ai moduli opponibili e alla stabilità Lambda."
      };

    case "lambda":
      return {
        domain: "lambda",
        summary: "UFO",
        preset: "lambda",
        presetTitle: "Lambda Stability",
        presetDescription:
          "Ricerca legacy orientata alla stabilità del sistema e alla collimazione."
      };

    case "campi-operativi":
      return {
        domain: "operations",
        summary: "CORE",
        preset: "operations",
        presetTitle: "Operational Fields",
        presetDescription:
          "Mappa legacy dei campi operativi del sistema Joker-C2."
      };

    case "manuel":
      return {
        domain: "origin",
        summary: "ORIGIN",
        preset: "origin",
        presetTitle: "Origin Research",
        presetDescription:
          "Ricerca legacy orientata all’operatore biologico originario."
      };

    default:
      return getDefaultMeta();
  }
}

function resolveTopic(message, previousTopic) {
  let selectedTopic = "general";
  let selectedEntries = searchCorpus(message);

  if (isFollowupQuery(message) && previousTopic) {
    const followupEntries = getTopicEntries(previousTopic);

    if (followupEntries.length) {
      return {
        selectedTopic: previousTopic,
        selectedEntries: followupEntries.map((entry) => ({
          ...entry,
          score: 100
        }))
      };
    }
  }

  if (selectedEntries.length) {
    selectedTopic = selectedEntries[0].topic;
  }

  return { selectedTopic, selectedEntries };
}

function resolveSpecialReply(message) {
  if (message.includes("ciao") && message.includes("chi sei")) {
    return {
      topic: "joker-c2",
      reply:
        "Ciao Manuel. Io sono AI Joker-C2, il Coordination Engine del framework HBCE. Questo endpoint legacy risponde ancora tramite corpus locale.",
      meta: {
        domain: "identity",
        summary: "CORE",
        preset: "identity",
        presetTitle: "Identity Research",
        presetDescription:
          "Ricerca legacy orientata all’identità del Coordination Engine Joker-C2."
      }
    };
  }

  return null;
}

function buildMatches(entries) {
  return entries.slice(0, 5).map((entry) => ({
    id: entry.id,
    layer: entry.layer,
    title: entry.title,
    topic: entry.topic,
    score: entry.score
  }));
}

function buildResponsePayload(message, topic, entries, meta, confidence, reply) {
  return {
    ok: true,
    mode: "context-recovery-legacy",
    domain: meta.domain,
    summary: meta.summary,
    confidence,
    query_normalized: message,
    detected_topic: topic,
    preset: meta.preset,
    preset_title: meta.presetTitle,
    preset_description: meta.presetDescription,
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
    matches: buildMatches(entries),
    web_results: [],
    reply
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendMethodNotAllowed(res);
  }

  try {
    const body = parseRequestBody(req);
    const rawMessage = String(body.message || "").trim();
    const message = normalizeQuery(rawMessage);
    const previousTopic = normalizeQuery(body.previous_topic || "");

    if (!rawMessage) {
      return sendBadRequest(res, "Messaggio mancante");
    }

    const { selectedTopic, selectedEntries } = resolveTopic(
      message,
      previousTopic
    );

    let topic = selectedTopic;
    let entries = selectedEntries;
    let meta = topic !== "general" && entries.length
      ? getTopicMeta(topic)
      : getDefaultMeta();
    let confidence = topic !== "general" && entries.length >= 2
      ? "high"
      : "medium";
    let reply = topic !== "general" && entries.length
      ? buildReplyFromTopic(topic, entries)
      : buildFallbackReply();

    const special = resolveSpecialReply(message);

    if (special) {
      topic = special.topic;
      entries = entries.length ? entries : getTopicEntries(topic);
      meta = special.meta;
      confidence = "medium";
      reply = special.reply;
    }

    return sendJson(
      res,
      200,
      buildResponsePayload(message, topic, entries, meta, confidence, reply)
    );
  } catch (error) {
    return sendInternalError(res, error);
  }
}
