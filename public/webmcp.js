(() => {
  const context = navigator.modelContext;
  if (!context || typeof context.registerTool !== 'function') return;
  context.registerTool({
    name: 'ylr_list_published_resources',
    description: 'List published Youth Legal Revolution legal explainers and legislation reviews.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    execute: async () => {
      const response = await fetch('/api/agents/resources', { headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('Public resources are temporarily unavailable.');
      return response.json();
    }
  });
})();
