import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const port = 41000 + Math.floor(Math.random() * 15000);
const child = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
const base = `http://127.0.0.1:${port}`;
async function fetchReady(path, options) {
  for (let i = 0; i < 60; i++) {
    try { return await fetch(`${base}${path}`, options); } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  throw new Error('Runtime server did not become ready.');
}
try {
  const home = await fetchReady('/');
  assert.equal(home.status, 200);
  assert.match(home.headers.get('link') || '', /llms\.txt/);
  assert.match(await home.text(), /Know your rights/i);

  const markdown = await fetchReady('/', { headers: { accept: 'text/markdown' } });
  assert.match(markdown.headers.get('content-type') || '', /text\/markdown/);
  assert.match(await markdown.text(), /Youth Legal Revolution/);

  for (const path of ['/.well-known/mcp.json', '/.well-known/mcp/server-card.json']) {
    const card = await fetchReady(path);
    assert.equal(card.status, 200);
    assert.equal((await card.json()).transport.endpoint, '/mcp');
  }

  const rpc = async (id, method, params = {}) => {
    const response = await fetchReady('/mcp', {
      method: 'POST',
      headers: { accept: 'application/json, text/event-stream', 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id, method, params })
    });
    assert.equal(response.status, 200);
    return response.json();
  };
  const initialized = await rpc(1, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'smoke', version: '1' } });
  assert.equal(initialized.result.protocolVersion, '2025-06-18');
  const tools = await rpc(2, 'tools/list');
  assert.deepEqual(tools.result.tools.map(x => x.name), ['search_articles', 'get_article', 'search_reviewed_reports']);
  const search = await rpc(3, 'tools/call', { name: 'search_articles', arguments: { query: 'test' } });
  assert.equal(search.result.isError, false);
  assert.ok(Array.isArray(search.result.structuredContent.results));
  console.log('Runtime smoke check passed for HTML, Markdown, Link headers and read-only MCP tools.');
} finally {
  child.kill();
}

