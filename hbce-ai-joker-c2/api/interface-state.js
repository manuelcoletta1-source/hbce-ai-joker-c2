export function buildInterfaceState({
  mode = "local-corpus-search",
  domain = "general",
  summary = "GENERAL",
  confidence = "low",
  query_normalized = "",
  preset = "research",
  preset_title = "Research",
  preset_description = "Ricerca generale sul corpus locale HBCE e layer alieno.",
  corpus_map = null
} = {}) {
  return {
    mode,
    domain,
    summary,
    confidence,
    query_normalized,
    preset,
    preset_title,
    preset_description,
    corpus_map
  };
}
