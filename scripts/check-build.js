import fs from 'node:fs';
import path from 'node:path';

const required=[
  'index.html','overview.html','styles.css','youth-legal-revolution-logo.png',
  'robots.txt','llms.txt','index.md','contact.html','terms.html','privacy.html',
  '.well-known/mcp/server-card.json','webmcp.js'
];
for(const file of required){
  if(!fs.existsSync(path.join('dist',file)))throw new Error('Build output is missing '+file);
}
for(const file of ['index.html','overview.html']){
  const html=fs.readFileSync(path.join('dist',file),'utf8');
  if(!/<h1\b/i.test(html)||!/<link[^>]+rel=["']canonical["']/i.test(html)||!/<meta[^>]+name=["']description["']/i.test(html))throw new Error('Build output metadata is incomplete: '+file);
}
console.log('Required pages and agent assets are present in dist/.');
