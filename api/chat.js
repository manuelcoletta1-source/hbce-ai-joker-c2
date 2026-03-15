import { CORPUS_CORE, searchCorpusEntries } from "./corpus-core.js";
import { ALIEN_CODE_CORE, searchAlienCodeEntries } from "./corpus-alien-code.js";
import { normalizeQuery, isGreeting, isHelp } from "./query-utils.js";
import { detectDomain, detectConfidence, formatMatches } from "./response-utils.js";
import { detectPreset } from "./session-presets.js";
import { getCorpusMapSummary } from "./corpus-map.js";
import { buildInterfaceState } from "./interface-state.js";
import { mergeUniqueMatches } from "./match-utils.js";

function buildIntro() {
  return {
    ok: true,
    mode: "local-corpus-search",
    source: "hbce-corpus-core + alien-code-core"
  };
}

function summarizeLayer(domain, matches) {
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

function buildReplyFromMatches(query, matches) {
  if (isGreeting(query)) {
    return {
      reply: "Joker-C2 operativo. Modalità ricerca attiva. Corpus locale e layer alieno caricati correttamente.",
      matches: []
    };
  }

  if (isHelp(query)) {
    return {
      reply:
        "Parole chiave disponibili: ipr, hbce, joker, manuel, ipr-b, ipr-c, matrix europa, enterprise space, event registry, lambda, ufo, phiomega, ethic token, safe halt, deny and log, codice madre, esper-simento, psi, lambda fenomenica, kappa, sigma, tau, omega, pi star, xiomega, qt_d, qt_l, unebdo, inrim.",
      matches: []
    };
  }

  if (!matches.length) {
    return {
      reply:
        "Joker-C2 ha ricevuto il messaggio, ma non ha trovato un allineamento forte nel corpus locale. Prova con termini più canonici del sistema.",
      matches: []
    };
  }

  if (matches.length === 1) {
    return {
      reply: matches[0].entry.text,
      matches: formatMatches([matches[0]])
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

  return {
    reply: replyParts.join("\n"),
    matches: formatMatches(matches)
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
    const summary = summarizeLayer(domain, matches);
    const corpusMap = getCorpusMapSummary();
    const result = buildReplyFromMatches(normalizedMessage, matches);

    return res.status(200).json({
      ...buildIntro(),
      ...buildInterfaceState({
        mode: "local-corpus-search",
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
      reply: result.reply,
      matches: result.matches
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: "Errore nella richiesta"
    });
  }
}
