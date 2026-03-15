import { CORPUS_CORE, searchCorpusEntries } from "./corpus-core.js";
import { ALIEN_CODE_CORE, searchAlienCodeEntries } from "./corpus-alien-code.js";

function normalizeQuery(message) {
  return String(message || "").trim();
}

function buildIntro() {
  return {
    ok: true,
    mode: "local-corpus-search",
    source: "hbce-corpus-core + alien-code-core"
  };
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

  const combined = [...coreMatches, ...alienMatches];

  const unique = [];
  const seen = new Set();

  for (const item of combined) {
    const key = `${item.layer}:${item.entry.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique.slice(0, 5);
}

function buildReplyFromMatches(query, matches) {
  const input = query.toLowerCase();

  if (["ciao", "salve", "hello", "hi"].includes(input)) {
    return {
      reply: "Joker-C2 operativo. Modalità ricerca attiva. Corpus locale e layer alieno caricati correttamente.",
      matches: []
    };
  }

  if (["help", "aiuto"].includes(input)) {
    return {
      reply:
        "Parole chiave disponibili: ipr, hbce, joker, manuel, ipr-b, ipr-c, matrix europa, enterprise space, event registry, lambda, ufo, phiomega, ethic token, safe halt, deny and log, codice madre, esper-simento, psi, lambda fenomenica, kappa, sigma, tau, omega, pi star, xiomega, qt_d, qt_l, unebdo, slq, inrim.",
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
    const item = matches[0];
    return {
      reply: item.entry.text,
      matches: [
        {
          id: item.entry.id,
          title: item.entry.title,
          layer: item.layer
        }
      ]
    };
  }

  const primary = matches[0];
  const secondary = matches.slice(1, 3);

  const replyParts = [];
  replyParts.push(primary.entry.text);

  if (secondary.length) {
    replyParts.push("");
    replyParts.push("Raccordi utili nel corpus:");

    for (const item of secondary) {
      replyParts.push(`- ${item.entry.title}: ${item.entry.text}`);
    }
  }

  return {
    reply: replyParts.join("\n"),
    matches: matches.map((item) => ({
      id: item.entry.id,
      title: item.entry.title,
      layer: item.layer
    }))
  };
}

function detectDomain(matches) {
  if (!matches.length) {
    return "general";
  }

  const layers = new Set(matches.map((item) => item.layer));

  if (layers.has("core") && layers.has("alien")) {
    return "hybrid";
  }

  if (layers.has("alien")) {
    return "alien-code";
  }

  return "hbce-core";
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
    const message = normalizeQuery(body?.message);

    if (!message) {
      return res.status(400).json({
        ok: false,
        error: "Messaggio mancante"
      });
    }

    const matches = rankCombinedResults(message);
    const result = buildReplyFromMatches(message, matches);
    const domain = detectDomain(matches);

    return res.status(200).json({
      ...buildIntro(),
      domain,
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
