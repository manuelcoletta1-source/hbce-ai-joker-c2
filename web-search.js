function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function buildMockResults(query) {
  const q = normalizeText(query);

  return [
    {
      title: `Web result placeholder for: ${q}`,
      snippet: `This is a temporary web-search placeholder for the query "${q}". Replace the provider logic with a real search API to activate live internet retrieval.`,
      url: "https://example.com/search-placeholder",
      source: "mock-web"
    }
  ];
}

async function searchWithTavily(query) {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      include_answer: false,
      include_images: false,
      max_results: 5
    })
  });

  if (!response.ok) {
    throw new Error(`Tavily request failed with status ${response.status}`);
  }

  const data = await response.json();

  const results = Array.isArray(data.results)
    ? data.results.map((item) => ({
        title: normalizeText(item.title),
        snippet: normalizeText(item.content),
        url: normalizeText(item.url),
        source: "tavily"
      }))
    : [];

  return results.filter((item) => item.title || item.snippet);
}

export async function runWebSearch(query) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return {
      provider: "none",
      enabled: false,
      results: []
    };
  }

  try {
    const tavilyResults = await searchWithTavily(normalizedQuery);

    if (Array.isArray(tavilyResults)) {
      return {
        provider: "tavily",
        enabled: true,
        results: tavilyResults
      };
    }
  } catch (error) {
    return {
      provider: "tavily",
      enabled: true,
      error: error.message,
      results: []
    };
  }

  return {
    provider: "mock-web",
    enabled: false,
    results: buildMockResults(normalizedQuery)
  };
}
