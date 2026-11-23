import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const root = resolve(process.cwd(), 'dist');
const port = Number(process.env.PORT || 3000);
const site = 'https://youthlegalrevolution.in';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const types = { '.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.ico':'image/x-icon','.jpg':'image/jpeg','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/markdown; charset=utf-8','.png':'image/png','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8' };
const linkHeader = `<${site}/llms.txt>; rel="describedby", <${site}/index.md>; rel="alternate"; type="text/markdown"`;
const serverCard = {
 '$schema':'https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json', version:'1.0', protocolVersion:'2025-06-18',
 serverInfo:{name:'youth-legal-revolution',title:'Youth Legal Revolution public information',version:'1.0.0'},
 description:'Read-only search of published legal learning articles and reviewed public reports from Youth Legal Revolution. Not legal advice.',
 iconUrl:`${site}/youth-legal-revolution-logo.png`, documentationUrl:`${site}/llms.txt`,
 transport:{type:'streamable-http',endpoint:'/mcp'}, capabilities:{tools:{listChanged:false}}, authentication:{required:false,schemes:[]},
 instructions:'Tools are read-only. Published reports separate allegations, evidence, legal analysis and verified findings. Verify laws using current official sources and seek qualified legal advice for individual matters.',
 tools:[{name:'search_articles',title:'Search public articles',description:'Find published Youth Legal Revolution articles by keyword.'},{name:'get_article',title:'Read a public article',description:'Retrieve a published article by URL slug.'},{name:'search_reviewed_reports',title:'Search reviewed public reports',description:'Find reports explicitly marked published after review.'}]
};
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const jsonSafe = value => JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
const safeHttps = value => { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; } };
const textBlocks = value => String(value || '').split(/\n\s*\n/).filter(Boolean).map(p => `<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');

async function query(table, params) {
  if (!supabaseUrl || !anonKey) return [];
  try {
    const url = new URL(`/rest/v1/${table}`, supabaseUrl);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetch(url, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, Accept: 'application/json' }, signal: AbortSignal.timeout(5000) });
    if (!response.ok) return [];
    const rows = await response.json(); return Array.isArray(rows) ? rows : [];
  } catch { return []; }
}

const mcpTools = [
 { name:'search_articles', title:'Search public articles', description:'Find published Youth Legal Revolution articles by keyword.', inputSchema:{type:'object',properties:{query:{type:'string',maxLength:200}},required:['query']} },
 { name:'get_article', title:'Read a public article', description:'Retrieve a published article by its URL slug.', inputSchema:{type:'object',properties:{slug:{type:'string',pattern:'^[a-z0-9]+(?:-[a-z0-9]+)*$'}},required:['slug']} },
 { name:'search_reviewed_reports', title:'Search reviewed public reports', description:'Find reports that passed the review process and were explicitly published.', inputSchema:{type:'object',properties:{query:{type:'string',maxLength:200}},required:['query']} }
];
serverCard.tools = mcpTools;
async function callMcpTool(name, args = {}) {
 if (name === 'search_articles') {
   const q = String(args.query || '').trim().toLowerCase().slice(0,200);
   const rows = await query('articles',{select:'title,slug,category,excerpt,published_at',status:'eq.published',order:'published_at.desc',limit:'100'});
   return rows.filter(x => !q || `${x.title} ${x.category} ${x.excerpt}`.toLowerCase().includes(q)).slice(0,10);
 }
 if (name === 'get_article') {
   if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(args.slug || '')) throw new Error('Provide a valid article slug.');
   const rows = await query('articles',{select:'title,slug,category,excerpt,body,published_at',slug:`eq.${args.slug}`,status:'eq.published',limit:'1'});
   if (!rows[0]) throw new Error('Published article not found.');
   return rows[0];
 }
 if (name === 'search_reviewed_reports') {
   const q = String(args.query || '').trim().toLowerCase().slice(0,200);
   const rows = await query('reports',{select:'title,summary,jurisdiction,provision_citation,verified_findings,response,reviewer,reviewed_at,sources',review_status:'eq.published',order:'reviewed_at.desc',limit:'100'});
   return rows.filter(x => !q || `${x.title} ${x.summary} ${x.jurisdiction} ${x.provision_citation} ${x.verified_findings}`.toLowerCase().includes(q)).slice(0,10);
 }
 throw new Error('Unknown tool.');
}
function jsonRpc(res, id, result, status=200) {
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(JSON.stringify({jsonrpc:'2.0',id,result}));
}
function jsonRpcError(res,id,code,message) {
 res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});
 res.end(JSON.stringify({jsonrpc:'2.0',id,error:{code,message}}));
}
async function handleMcp(req,res) {
 const origin = req.headers.origin;
 if (origin && !['https://youthlegalrevolution.in','https://www.youthlegalrevolution.in'].includes(origin)) { res.writeHead(403).end('Forbidden origin'); return; }
 if (req.method === 'GET') {
   if (!(req.headers.accept || '').includes('text/event-stream')) { res.writeHead(406).end('Accept text/event-stream'); return; }
   res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform','Connection':'keep-alive','X-Accel-Buffering':'no'});
   res.write('retry: 30000\n\n'); const timer=setInterval(()=>res.write(': keepalive\n\n'),30000); req.on('close',()=>clearInterval(timer)); return;
 }
 if (req.method !== 'POST') { res.writeHead(405,{Allow:'GET, POST'}).end('Method not allowed'); return; }
 const accept=req.headers.accept || '';
 if (!accept.includes('application/json') || !accept.includes('text/event-stream')) { res.writeHead(406).end('Accept application/json and text/event-stream'); return; }
 if (!(req.headers['content-type'] || '').includes('application/json')) { res.writeHead(415).end('Expected application/json'); return; }
 let raw=''; for await (const part of req) { raw += part; if (raw.length > 65536) { res.writeHead(413).end('Request too large'); return; } }
 let message; try { message=JSON.parse(raw); } catch { res.writeHead(400).end('Invalid JSON'); return; }
 const id=message.id;
 if (message.jsonrpc !== '2.0' || typeof message.method !== 'string') { jsonRpcError(res,id,-32600,'Invalid Request'); return; }
 if (!Object.hasOwn(message,'id')) { res.writeHead(202).end(); return; }
 try {
   if (message.method === 'initialize') {
     jsonRpc(res,id,{protocolVersion:'2025-06-18',capabilities:{tools:{listChanged:false}},serverInfo:{name:'youth-legal-revolution',title:'Youth Legal Revolution',version:'1.0.0'},instructions:'Read-only public legal education and reviewed report search. This service does not provide legal advice. Reports distinguish verified findings from allegations.'}); return;
   }
   if (message.method === 'ping') { jsonRpc(res,id,{}); return; }
   if (message.method === 'tools/list') { jsonRpc(res,id,{tools:mcpTools}); return; }
   if (message.method === 'tools/call') {
     const {name,arguments:args}=message.params || {}; const result=await callMcpTool(name,args);
     const structuredContent=Array.isArray(result)?{results:result}:{item:result};
     jsonRpc(res,id,{content:[{type:'text',text:JSON.stringify(result)}],structuredContent,isError:false}); return;
   }
   jsonRpcError(res,id,-32601,'Method not found');
 } catch (error) { jsonRpc(res,id,{content:[{type:'text',text:error.message}],isError:true}); }
}

function shell({title,description,canonical,kind='WebPage',jsonld='',body}) {
 const schema = jsonld || jsonSafe({'@context':'https://schema.org','@type':kind,'name':title,'url':canonical,'description':description,'publisher':{'@type':'Organization','name':'Youth Legal Revolution','url':`${site}/`,'sameAs':['https://www.instagram.com/youthlegalrevolution/','https://www.linkedin.com/company/145294450']}});
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><link rel="icon" type="image/png" href="/youth-legal-revolution-logo.png"><link rel="stylesheet" href="/styles.css"><script type="application/ld+json">${schema}</script></head><body><header class="site-header"><div class="nav-wrap"><a class="brand" href="/"><img class="brand-logo" src="/youth-legal-revolution-logo.png" alt="Youth Legal Revolution logo" width="48" height="48"><span class="brand-copy"><strong>Youth Legal Revolution</strong><small>Knowledge. Justice. Change.</small></span></a><nav class="nav-links"><a href="/">Home</a><a href="/overview.html">Overview</a><a href="/articles.html">Articles</a><a href="/research.html">Research</a><a href="/contact.html">Contact</a></nav></div></header><main>${body}</main><footer class="site-footer"><div class="footer-inner"><a class="footer-brand" href="/">Youth Legal <span>Revolution</span></a><div class="footer-links"><a href="/overview.html">About</a><a href="/articles.html">Articles</a><a href="/research.html">Reviews</a><a href="/contact.html">Contact</a><a href="/terms.html">Terms</a><a href="/privacy.html">Privacy</a></div></div></footer></body></html>`;
}

function articleCard(item) { return `<article class="focus-card"><span class="card-number">${esc(item.category || 'Legal learning')}</span><h2><a href="/article.html?slug=${encodeURIComponent(item.slug)}">${esc(item.title)}</a></h2><p>${esc(item.excerpt || item.summary)}</p><a class="card-link" href="/article.html?slug=${encodeURIComponent(item.slug)}">Read article ↗</a></article>`; }
async function listingPage() {
 const rows = await query('articles', {select:'title,slug,category,excerpt,seo_title,seo_description,published_at',status:'eq.published',order:'published_at.desc',limit:'100'});
 const body = `<section class="page-hero"><div class="page-hero-inner"><p class="eyebrow">Legal knowledge</p><h1>Articles &amp; <em>learning.</em></h1><p class="lede">Educational explainers from Youth Legal Revolution. Confirm current law using official sources.</p></div></section><section class="section"><div class="section-inner"><div class="focus-grid">${rows.map(articleCard).join('') || '<p>Published articles will appear here after editorial review.</p>'}</div><p class="disclaimer">Educational information only, not legal advice.</p></div></section>`;
 return shell({title:'Articles & Legal Learning | Youth Legal Revolution',description:'Legal literacy articles and explainers with links to authoritative sources.',canonical:`${site}/articles.html`,kind:'CollectionPage',body});
}
async function articlePage(slug) {
 if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug || '')) return null;
 const rows = await query('articles', {select:'title,slug,category,excerpt,body,seo_title,seo_description,published_at',slug:`eq.${slug}`,status:'eq.published',limit:'1'});
 const item = rows[0]; if (!item) return null;
 const title = item.seo_title || item.title; const description = item.seo_description || item.excerpt || 'Legal learning article from Youth Legal Revolution.'; const canonical = `${site}/article.html?slug=${encodeURIComponent(item.slug)}`;
 const body = `<section class="page-hero"><div class="page-hero-inner"><p class="eyebrow">${esc(item.category || 'Legal learning')}</p><h1>${esc(item.title)}</h1><p class="lede">${esc(item.excerpt)}</p></div></section><article class="section"><div class="section-inner">${textBlocks(item.body)}<p class="disclaimer">Educational information only; verify current law with official sources and seek qualified advice for individual matters.</p><a class="card-link" href="/articles.html">← All articles</a></div></article>`;
 const jsonld = jsonSafe({'@context':'https://schema.org','@type':'Article','headline':item.title,'description':description,'datePublished':item.published_at,'mainEntityOfPage':canonical,'author':{'@type':'Organization','name':'Youth Legal Revolution','url':`${site}/`},'publisher':{'@type':'Organization','name':'Youth Legal Revolution','sameAs':['https://www.instagram.com/youthlegalrevolution/','https://www.linkedin.com/company/145294450']}});
 return shell({title,description,canonical,kind:'Article',jsonld,body});
}
async function researchPage() {
 const rows = await query('reports', {select:'title,slug,summary,jurisdiction,provision_citation,verified_findings,response,reviewer,reviewed_at,sources',review_status:'eq.published',order:'reviewed_at.desc',limit:'100'});
 const cards = rows.map(r => `<article class="focus-card"><h2>${esc(r.title)}</h2><p>${esc(r.summary)}</p><p><strong>Jurisdiction:</strong> ${esc(r.jurisdiction)} · <strong>Provision:</strong> ${esc(r.provision_citation)}</p><h3>Verified findings</h3>${textBlocks(r.verified_findings)}${r.response ? `<h3>Response</h3>${textBlocks(r.response)}`:''}<p><small>Reviewed by ${esc(r.reviewer)} on ${esc(r.reviewed_at)}</small></p><ul>${(r.sources || []).map(s => { const href = safeHttps(s.url); return href ? `<li><a href="${esc(href)}" rel="nofollow noopener">${esc(s.title || href)}</a></li>` : ''; }).join('')}</ul></article>`).join('');
 const body = `<section class="page-hero"><div class="page-hero-inner"><p class="eyebrow">Evidence before conclusions</p><h1>Legislation &amp; implementation <em>reviews.</em></h1><p class="lede">Published reviews identify their jurisdiction, legal provisions, evidence, limitations and review details. Allegations are not findings.</p></div></section><section class="section"><div class="section-inner"><div class="focus-grid">${cards || '<p>No reviewed reports are currently published.</p>'}</div><p class="disclaimer">Educational information only. A published review is not a court determination or legal advice. Contact us to submit a response or correction.</p></div></section>`;
 return shell({title:'Legislation & Implementation Reviews | Youth Legal Revolution',description:'Evidence-based legal obligation reviews with sources, limitations and response status.',canonical:`${site}/research.html`,kind:'CollectionPage',body});
}

function sendFile(res, pathname, method) {
 let safePath; try { safePath = resolve(root, `.${decodeURIComponent(pathname)}`); } catch { res.writeHead(400).end('Bad request'); return; }
 if (safePath !== root && !safePath.startsWith(root + sep)) { res.writeHead(403).end('Forbidden'); return; }
 let info; try { info = statSync(safePath); if (!info.isFile()) throw new Error(); } catch { res.writeHead(404).end('Not found'); return; }
 res.writeHead(200, {'Content-Type':types[extname(safePath).toLowerCase()] || 'application/octet-stream','Content-Length':info.size,'X-Content-Type-Options':'nosniff'});
 if (method === 'HEAD') res.end(); else createReadStream(safePath).pipe(res);
}

createServer(async (req,res) => {
 const method = req.method || 'GET';
 let url; try { url = new URL(req.url || '/', 'http://localhost'); } catch { res.writeHead(400).end('Bad request'); return; }
 const path = url.pathname; if (path === '/' || path === '/index.html') {
   res.setHeader('Link',linkHeader);
   res.setHeader('Vary','Accept');
   const markdownPreference=(req.headers.accept || '').split(',').some(item => item.trim().startsWith('text/markdown') && !/q\s*=\s*0(?:\.0*)?(?:;|$)/i.test(item));
   if (markdownPreference) { sendFile(res,'/index.md',method); return; }
 }
 if (path === '/mcp') { await handleMcp(req,res); return; }
 if (path === '/.well-known/mcp.json' || path === '/.well-known/mcp/server-card.json') { res.writeHead(200,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=3600','X-Content-Type-Options':'nosniff'}).end(JSON.stringify(serverCard)); return; }
 if (path === '/healthz') { res.writeHead(200,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}).end('ok'); return; }
 if (method !== 'GET' && method !== 'HEAD') { res.writeHead(405,{Allow:'GET, HEAD'}).end('Method not allowed'); return; }
 try {
   if (path === '/articles.html') { const html = await listingPage(); res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'}).end(html); return; }
   if (path === '/research.html') { const html = await researchPage(); res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'}).end(html); return; }
   if ((path === '/article.html' || path.startsWith('/articles/')) && url.searchParams.has('slug')) {
     const html = await articlePage(url.searchParams.get('slug')); if (!html) { res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'}).end('<!doctype html><title>Article not found</title><h1>Article not found</h1><a href="/articles.html">Browse articles</a>'); return; }
     res.writeHead(200,{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff'}).end(html); return;
   }
   if (path === '/sitemap.xml') {
     const articles = await query('articles',{select:'slug,published_at',status:'eq.published',limit:'1000'});
     const fixed=['/','/overview.html','/articles.html','/research.html','/contact.html','/terms.html','/privacy.html'];
     const dynamic=articles.filter(x=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(x.slug || '')).map(x=>`/article.html?slug=${encodeURIComponent(x.slug)}`);
     const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...fixed,...dynamic].map(x=>`<url><loc>${esc(site+x)}</loc></url>`).join('')+'</urlset>';
     res.writeHead(200,{'Content-Type':'application/xml; charset=utf-8','X-Content-Type-Options':'nosniff'}).end(xml); return;
   }
 } catch { res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8'}).end('Temporarily unavailable'); return; }
 sendFile(res,path === '/' ? '/index.html' : path,method);
}).listen(port,'0.0.0.0',()=>console.log(`Youth Legal Revolution listening on ${port}`));

