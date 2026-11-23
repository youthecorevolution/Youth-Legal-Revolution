// Optional early-preview WebMCP tool. It only searches public, pre-rendered
// legal-library cards; it never submits forms or navigates to external links.
(async function registerYlrResourceSearch() {
  const modelContext = document.modelContext;
  if (!modelContext || typeof modelContext.registerTool !== "function") return;

  await modelContext.registerTool({
    name: "search_legal_resources",
    description: "Search the public Youth Legal Revolution legal-learning resource cards by topic or keyword.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "A legal topic or keyword to find in the resource titles and descriptions."
        }
      },
      required: ["query"]
    },
    annotations: {
      readOnlyHint: true,
      untrustedContentHint: true
    },
    execute: async ({ query }) => {
      const normalizedQuery = String(query || "").trim().toLowerCase().slice(0, 200);
      if (!normalizedQuery) return { results: [] };

      const results = Array.from(document.querySelectorAll(".resource-card"))
        .map((card) => {
          const title = card.querySelector("h3")?.textContent?.trim() || "";
          const description = card.querySelector("p")?.textContent?.trim() || "";
          const category = card.dataset.category || "";
          const link = card.querySelector("a[href]")?.href || "";
          return { title, description, category, url: link };
        })
        .filter((item) => `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(normalizedQuery))
        .slice(0, 10);

      return { query: normalizedQuery, results };
    }
  });
})().catch(() => {
  // The feature is experimental and may be unavailable or disabled in a browser.
});

