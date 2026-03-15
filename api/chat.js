import { detectSearchPreset, JOKER_SEARCH_SPEC } from "./search-spec.js";

function normalizeQuery(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function buildCorpus() {
  return [
    {
      id: "core-001",
      layer: "core",
      title: "IPR — Identity Primary Record",
      keywords: ["ipr", "identity primary record", "identità operativa", "event registry"],
      text:
        "IPR è il protocollo di identità operativa persistente progettato per associare azioni digitali a entità verificabili, registrare eventi e consentire verifica cronologica e auditabilità."
    },
    {
      id: "core-002",
      layer: "core",
      title: "Joker-C2 Coordination Engine",
      keywords: ["joker-c2", "coordination engine", "correlazione", "orchestrazione"],
      text:
        "Joker-C2 Coordination Engine è il motore di correlazione e orchestrazione. Le sue funzioni principali sono la correlazione eventi multi-infrastruttura, l’analisi anomalie e il coordinamento operativo."
    },
    {
      id: "core-003",
      layer: "core",
      title: "Matrix Europa",
      keywords: ["matrix europa", "nodi", "europa", "torino", "bruxelles"],
      text:
        "Matrix Europa descrive una rete di nodi tecnologici distribuiti sul territorio europeo, coordinati da sistemi di analisi cognitiva e collegati a infrastrutture digitali condivise."
    },
    {
      id: "core-004",
      layer: "core",
      title: "Pipeline Joker-C2",
      keywords: ["pipeline", "rag", "ricerca", "query", "web"],
      text:
        "La pipeline operativa Joker-C2 segue una sequenza deterministica: query utente, analisi linguistica, ricerca corpus, ricerca web, fusione risultati, ragionamento AI, risposta."
    },
    {
      id: "ufo-001",
      layer: "ufo",
      title: "UFO Modules",
      keywords: ["ufo", "unità funzionale opponibile", "opponibile", "moduli"],
      text:
        "I moduli UFO sono unità funzionali opponibili che collegano mondo fisico, mondo digitale e mondo legale. Rendono un processo misurabile, verificabile, auditabile, certificabile e opponibile nel tempo."
    },
    {
      id: "ufo-002",
      layer: "ufo",
      title: "Lambda Stability Layer",
      keywords: ["lambda", "stability", "stabilità", "collimazione"],
      text:
        "La metrica Lambda rappresenta lo stato di equilibrio di un sistema complesso. Quando Lambda esce dalla finestra operativa, Joker-C2 attiva meccanismi di collimazione e stabilizzazione."
    },
    {
      id: "origin-001",
      layer: "origin",
      title: "Torino Technical Hub",
      keywords: ["torino", "hub tecnico", "laboratorio", "pilot"],
      text:
        "Torino è il nodo tecnico ideale del progetto Joker-C2 grazie a robotica, aerospazio, AI, modellazione di sistemi complessi e test dei moduli opponibili."
    },
    {
      id: "origin-002",
      layer: "origin",
      title: "Bruxelles Strategic Coordination",
      keywords: ["bruxelles", "commissione", "coordinamento", "europa"],
      text:
        "Bruxelles è l’hub istituzionale per il coordinamento europeo, l’integrazione normativa e la governance transnazionale dell’architettura Joker-C2."
    }
  ];
}

async function runWebSearch(query) {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return {
      provider: "none",
      enabled: false,
      results: []
    };
  }

  if (!process.env.TAVILY_API_KEY) {
    return {
      provider: "mock-web",
      enabled: false,
      results: [
        {
          title: `Mock result for "${normalized}"`,
          snippet: "Web layer non ancora configurato. Aggiungere una API key reale per attivare la ricerca Internet.",
          url: "https://example.com/mock-web-result"
        }
      ]
    };
  }

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: normalized,
        search_depth: "advanced",
        include_answer: false,
        include_images: false,
        max_results: 3
      })
    });

    if (!response.ok) {
      throw new Error(`Web provider failed with status ${response.status}`);
    }

    const data = await response.json();
    const results = Array.isArray(data.results)
      ? data.results.map((item) => ({
          title: String(item.title || "").trim(),
          snippet: String(item.content || "").trim(),
          url: String(item.url || "").trim()
        }))
      : [];

    return {
      provider: "tavily",
      enabled: true,
      results
    };
  } catch (error) {
    return {
      provider: "tavily",
      enabled: true,
      error: error.message,
      results: []
    };
  }
}

function scoreEntry(query, entry) {
  const q = normalizeQuery(query);
  const title = normalizeQuery(entry.title);
  const text = normalizeQuery(entry.text);
  const keywords = Array.isArray(entry.keywords)
    ? entry.keywords.map((item) => normalizeQuery(item))
    : [];

  let score = 0;

  if (title.includes(q) && q) score += 5;
  if (keywords.includes(q) && q) score += 5;

  const tokens = q.split(" ").filter(Boolean);

  for (const token of tokens) {
    if (title.includes(token)) score += 3;
    if (text.includes(token)) score += 2;
    if (keywords.some((keyword) => keyword.includes(token))) score += 2;
  }

  return score;
}

function searchCorpus(query) {
  const corpus = buildCorpus();

  return corpus
    .map((entry) => ({
      ...entry,
      score: scoreEntry(query, entry)
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

function buildSummary(matches, webResults) {
  if (matches.length && webResults.length) return "HYBRID";
  if (matches.length) return "CORE";
  if (webResults.length) return "WEB";
  return "GENERAL";
}

function buildConfidence(matches, webResults) {
  if (matches.length >= 3) return "high";
  if (matches.length >= 1 || webResults.length >= 1) return "medium";
  return "low";
}

function buildReply(query, preset, matches, webResults) {
  const q = normalizeQuery(query);

  if (q === "ciao") {
    return "Joker-C2 online. Modalità di ricerca ibrida attiva. Corpus locale e pipeline di ricerca inizializzati.";
  }

  if (!matches.length && !webResults.length) {
    return "Joker-C2 non ha trovato corrispondenze né nel corpus locale né nel layer web. Riformula la query con termini più tecnici.";
  }

  const lines = [];
  lines.push(`Preset attivo: ${preset.title}.`);

  if (matches.length) {
    lines.push("");
    lines.push("Risultati corpus:");
    matches.slice(0, 3).forEach((item) => {
      lines.push(`- ${item.title}: ${item.text}`);
    });
  }

  if (webResults.length) {
    lines.push("");
    lines.push("Segnali layer web:");
    webResults.slice(0, 2).forEach((item) => {
      lines.push(`- ${item.title}: ${item.snippet}`);
    });
  }

  return lines.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Metodo non consentito"
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const originalMessage = String(body?.message || "").trim();
    const query = normalizeQuery(originalMessage);

    if (!query) {
      return res.status(400).json({
        ok: false,
        error: "Messaggio mancante"
      });
    }

    const preset = detectSearchPreset(query);
    const corpusMatches = searchCorpus(query);
    const webPayload = await runWebSearch(query);
    const webResults = Array.isArray(webPayload.results) ? webPayload.results : [];

    const summary = buildSummary(corpusMatches, webResults);
    const confidence = buildConfidence(corpusMatches, webResults);
    const reply = buildReply(query, preset, corpusMatches, webResults);

    return res.status(200).json({
      ok: true,
      mode: JOKER_SEARCH_SPEC.mode,
      domain: preset.id,
      summary,
      confidence,
      query_normalized: query,
      preset: preset.id,
      preset_title: preset.title,
      preset_description: preset.description,
      search_pipeline: JOKER_SEARCH_SPEC.architecture.pipeline,
      architecture_layers: JOKER_SEARCH_SPEC.architecture.layers,
      corpus_map: {
        core_count: buildCorpus().filter((item) => item.layer === "core").length,
        ufo_count: buildCorpus().filter((item) => item.layer === "ufo").length,
        origin_count: buildCorpus().filter((item) => item.layer === "origin").length
      },
      web_provider: webPayload.provider || "none",
      web_enabled: Boolean(webPayload.enabled),
      web_error: webPayload.error || "",
      matches: corpusMatches.map((item) => ({
        id: item.id,
        layer: item.layer,
        title: item.title,
        score: item.score
      })),
      web_results: webResults,
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
