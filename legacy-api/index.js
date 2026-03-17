import { CORPUS_CORE } from "./corpus-core.js";
import { ALIEN_CODE_CORE } from "./corpus-alien-code.js";
import { SESSION_PRESETS } from "./session-presets.js";
import { getCorpusMapSummary } from "./corpus-map.js";

export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    service: "joker-c2-api-root",
    assistant: CORPUS_CORE.identity.assistant,
    doctrine: CORPUS_CORE.identity.doctrine,
    mode: "hybrid-corpus-web-search",
    source: "hbce-corpus-core + alien-code-core + web-search + ipr-core",
    alien_mode: ALIEN_CODE_CORE.meta.mode,
    web_layer: {
      configured_provider: process.env.TAVILY_API_KEY ? "tavily" : "mock-web",
      live_web_enabled: Boolean(process.env.TAVILY_API_KEY)
    },
    presets: Object.values(SESSION_PRESETS),
    corpus_map: getCorpusMapSummary(),
    endpoints: [
      "/api",
      "/api/chat",
      "/api/health",
      "/api/glossary",
      "/api/docs",
      "/api/ipr"
    ]
  });
}
