import { CORPUS_CORE } from "./corpus-core.js";
import { ALIEN_CODE_CORE } from "./corpus-alien-code.js";
import { getCorpusMapSummary } from "./corpus-map.js";
import { IPR_EVENT_FORMAT } from "./ipr-format.js";

export default async function handler(req, res) {
  return res.status(200).json({
    ok: true,
    service: "joker-c2-health",
    mode: "hybrid-corpus-web-search",
    assistant: CORPUS_CORE.identity.assistant,
    doctrine: CORPUS_CORE.identity.doctrine,
    alien_mode: ALIEN_CODE_CORE.meta.mode,
    web_layer: {
      tavily_configured: Boolean(process.env.TAVILY_API_KEY)
    },
    ipr_layer: {
      format_name: IPR_EVENT_FORMAT.name,
      format_version: IPR_EVENT_FORMAT.version,
      hash_algorithm: IPR_EVENT_FORMAT.hash_algorithm
    },
    corpus_map: getCorpusMapSummary()
  });
}
