import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const files=['index.html','overview.html','articles.html','article.html','admin.html','public/robots.txt','public/sitemap.xml','public/youth-legal-revolution-logo.jpg','supabase/migrations/001_initial.sql'];
for(const f of files){const b=await readFile(new URL('../'+f,import.meta.url));assert.ok(b.length>0,`${f} must exist and be non-empty`)}
const migration=await readFile(new URL('../supabase/migrations/001_initial.sql',import.meta.url),'utf8');
for(const term of ['enable row level security','allegation','evidence','legal_analysis','responsible_authority','verified_findings','review_status'])assert.ok(migration.includes(term),`database must include ${term}`);
const home=await readFile(new URL('../index.html',import.meta.url),'utf8');assert.ok(home.includes('application/ld+json'));assert.ok(home.includes('rel="canonical"'));
console.log(`Smoke checks passed: ${files.length} required files and SEO/research schema.`);
