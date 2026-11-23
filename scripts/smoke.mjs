import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const pages = ['index.html', 'overview.html', 'articles.html', 'research.html', 'article.html', 'admin.html', 'contact.html', 'terms.html', 'privacy.html'];
for (const page of pages) {
  assert.ok(existsSync(page), `missing page: ${page}`);
  const html = readFileSync(page, 'utf8');
  assert.match(html, /<title>[^<]+<\/title>/i, `${page} needs a title`);
  assert.match(html, /name="description"/i, `${page} needs a meta description`);
  if (page !== 'admin.html') assert.match(html, /<h1\b/i, `${page} needs a visible h1`);
}
for (const file of ['public/robots.txt', 'public/sitemap.xml', 'public/llms.txt', 'public/index.md', 'public/styles.css', 'public/youth-legal-revolution-logo.png']) assert.ok(existsSync(file), `missing public asset: ${file}`);
assert.match(readFileSync('public/robots.txt', 'utf8'), /Sitemap:\s*https:\/\/youthlegalrevolution\.in\/sitemap\.xml/);
console.log(`Source smoke check passed for ${pages.length} HTML pages and crawler assets.`);

