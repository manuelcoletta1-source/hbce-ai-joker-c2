export const JOKER_SEARCH_SPEC = {
  system_name: "AI JOKER-C2",
  mode: "hybrid-corpus-web-search",
  doctrine: "HBCE Research",
  architecture: {
    pipeline: [
      "query_input",
      "query_normalization",
      "local_corpus_search",
      "web_search",
      "result_fusion",
      "response_generation"
    ],
    layers: [
      "IPR Identity Layer",
      "Event Registry",
      "Joker-C2 Coordination Engine",
      "UFO Modules",
      "Lambda Stability Layer"
    ]
  },
  presets: {
    general: {
      id: "general",
      title: "General Research",
      description: "Ricerca generale nel corpus Joker-C2 con eventuale supporto web."
    },
    ipr: {
      id: "ipr",
      title: "IPR Research",
      description: "Ricerca orientata a identità operative, eventi, verificabilità e registro append-only."
    },
    matrix: {
      id: "matrix",
      title: "Matrix Europa",
      description: "Ricerca orientata a nodi territoriali europei, coordinamento infrastrutturale e reti tecnologiche."
    },
    ufo: {
      id: "ufo",
      title: "UFO Modules",
      description: "Ricerca orientata ai moduli opponibili, ai domini applicativi e alla stabilità Lambda."
    }
  }
};

export function detectSearchPreset(query) {
  const q = String(query || "").toLowerCase();

  if (
    q.includes("ipr") ||
    q.includes("identity primary record") ||
    q.includes("event registry") ||
    q.includes("identità")
  ) {
    return JOKER_SEARCH_SPEC.presets.ipr;
  }

  if (
    q.includes("matrix europa") ||
    q.includes("bruxelles") ||
    q.includes("torino") ||
    q.includes("100 città") ||
    q.includes("nodi")
  ) {
    return JOKER_SEARCH_SPEC.presets.matrix;
  }

  if (
    q.includes("ufo") ||
    q.includes("lambda") ||
    q.includes("intercept") ||
    q.includes("reactor") ||
    q.includes("spacedrive")
  ) {
    return JOKER_SEARCH_SPEC.presets.ufo;
  }

  return JOKER_SEARCH_SPEC.presets.general;
}
