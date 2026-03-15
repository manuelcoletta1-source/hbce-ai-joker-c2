import { CORPUS_CORE, searchCorpusEntries } from "./corpus-core.js";
import { ALIEN_CODE_CORE, searchAlienCodeEntries } from "./corpus-alien-code.js";
import { normalizeQuery, isGreeting, isHelp } from "./query-utils.js";
import { detectDomain, detectConfidence, formatMatches } from "./response-utils.js";
import { detectPreset } from "./session-presets.js";
import { getCorpusMapSummary } from "./corpus-map.js";
import { buildInterfaceState } from "./interface-state.js";
import { mergeUniqueMatches } from "./match-utils.js";
import { runWebSearch } from "./web-search.js";

function buildIntro() {
  return {
    ok: true,
    mode: "hybrid-corpus-web-search",
    source: "hbce-corpus-core + alien-code-core + web-search"
  };
}

function summarizeLayer(domain, matches, webResults) {
  if (Array.isArray(webResults) && webResults.length > 0 && (!matches || !matches.length)) {
    return "WEB";
  }

  if (domain === "hybrid") return "HYBRID";
  if (domain === "alien-code") return "ALIEN";
  if (domain === "hbce-core") return "CORE";

  if (Array.isArray(matches) && matches.length) {
    const layers = new Set(matches.map((item) => item.layer));
    if (layers.has("core") && layers.has("alien")) return "HYBRID";
    if (layers.has("alien")) return "ALIEN";
    if (layers.has("core")) return "CORE";
  }

  return "GENERAL";
}

function rankCombinedResults(query) {
  const coreMatches = searchCorpusEntries(query).map((entry) => ({
    layer: "core",
    entry
  }));

  const alienMatches = searchAlienCodeEntries(query).map((entry) => ({
    layer: "alien",
    entry
  }));

  return mergeUniqueMatches(coreMatches, alienMatches, 5);
}

function formatWebResults(results = []) {
  return results.slice(0, 3).map((item) => ({
    title: item.title || "Untitled result",
    snippet: item.snippet || "",
    url: item.url || "",
    source: item.source || "web"
  }));
}

function buildReplyFromMatches(query, matches, webPayload) {
  if (isGreeting(query)) {
    return {
      reply: "Joker-C2 operativo. Modalità ibrida attiva. Corpus locale e layer web caricati correttamente.",
      matches: [],
      web_results: []
    };
  }

  if (isHelp(query)) {
    return {
      reply:
        "Parole chiave disponibili: ipr, hbce, joker, manuel, ipr-b, ipr-c, matrix europa, enterprise space, event registry, lambda, ufo, phiomega, ethic token, safe halt, deny and log, codice madre, esper-simento, psi, lambda fenomenica, kappa, sigma, tau, omega, pi star, xiomega, qt_d, qt_l, unebdo, inrim.",
      matches: [],
      web_results: []
    };
  }

  const webResults = formatWebResults(webPayload?.results || []);

  if (!matches.length && webResults.length) {
    const first = webResults[0];

    const lines = [
      "Joker-C2 non ha trovato un allineamento forte nel corpus locale, quindi ha aperto il layer web.",
      "",
      `Risultato principale: ${first.title}`,
      first.snippet ? `Sintesi: ${first.snippet}` : "",
      first.url ? `URL: ${first.url}` : ""
    ].filter(Boolean);

    return {
      reply: lines.join("\n"),
      matches: [],
      web_results: webResults
    };
  }

  if (!matches.length) {
    return {
      reply:
        "Joker-C2 ha ricevuto il messaggio, ma non ha trovato un allineamento forte nel corpus locale e il layer web non ha restituito risultati utili.",
      matches: [],
      web_results: webResults
    };
  }

  if (matches.length === 1) {
    const replyParts = [matches[0].entry.text];

    if (webResults.length) {
      replyParts.push("");
      replyParts.push("Segnali dal layer web:");
      webResults.forEach((item) => {
        replyParts.push(`- ${item.title}: ${item.snippet}`);
      });
    }

    return {
      reply: replyParts.join("\n"),
      matches: formatMatches([matches[0]]),
      web_results: webResults
    };
  }

  const primary = matches[0];
  const secondary = matches.slice(1, 3);
  const replyParts = [primary.entry.text];

  if (secondary.length) {
    replyParts.push("");
    replyParts.push("Raccordi utili nel corpus:");
    for (const item of secondary) {
      replyParts.push(`- ${item.entry.title}: ${item.entry.text}`);
    }
  }

  if (webResults.length) {
    replyParts.push("");
    replyParts.push("Segnali dal layer web:");
    webResults.forEach((item) => {
      replyParts.push(`- ${item.title}: ${item.snippet}`);
    });
  }

  return {
    reply: replyParts.join("\n"),
    matches: formatMatches(matches),
    web_results: webResults
  };
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
    const normalizedMessage = normalizeQuery(originalMessage);

    if (!normalizedMessage) {
      return res.status(400).json({
        ok: false,
        error: "Messaggio mancante"
      });
    }

    const matches = rankCombinedResults(normalizedMessage);
    const preset = detectPreset(normalizedMessage);
    const domain = detectDomain(matches);
    const confidence = detectConfidence(normalizedMessage, matches);
    const webPayload = await runWebSearch(normalizedMessage);
    const summary = summarizeLayer(domain, matches, webPayload.results || []);
    const corpusMap = getCorpusMapSummary();
    const result = buildReplyFromMatches(normalizedMessage, matches, webPayload);

    return res.status(200).json({
      ...buildIntro(),
      ...buildInterfaceState({
        mode: "hybrid-corpus-web-search",
        domain,
        summary,
        confidence,
        query_normalized: normalizedMessage,
        preset: preset.id,
        preset_title: preset.title,
        preset_description: preset.description,
        corpus_map: corpusMap
      }),
      assistant: CORPUS_CORE.identity.assistant,
      doctrine: CORPUS_CORE.identity.doctrine,
      alien_mode: ALIEN_CODE_CORE.meta.mode,
      web_provider: webPayload.provider || "none",
      web_enabled: Boolean(webPayload.enabled),
      web_error: webPayload.error || "",
      reply: result.reply,
      matches: result.matches,
      web_results: result.web_results
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Errore nella richiesta"
    });
  }
}
