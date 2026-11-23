# Youth Legal Revolution

The site preserves the organisation's homepage and full organisational overview, and adds public article and legislation-review pages with a restricted Supabase editor.

## Included

- Multi-page Vite build with visible HTML content, canonical URLs, page titles, descriptions and structured data.
- Supabase Auth and row-level security for invited editors. The browser uses only the Supabase public anon key; never put a service-role key in this site.
- Separate content fields for articles, pages and evidence-based reports. Reports stay private unless marked published and pass review requirements.
- Node server renders published articles and reviewed reports into HTML, generates a data-aware sitemap, serves Markdown when the homepage receives `Accept: text/markdown`, and adds `Link` response headers.
- `robots.txt`, `sitemap.xml`, `llms.txt`, homepage Markdown, social profile links and the uploaded favicon.
- When the Node server is running, a read-only MCP Streamable HTTP endpoint at `/mcp` and matching discovery cards at `/.well-known/mcp.json` and `/.well-known/mcp/server-card.json`. It exposes search and fetch tools only for already-published articles and reviewed reports. Static-only hosting does not advertise this endpoint.

## Supabase setup

1. In Supabase SQL Editor, apply the repository's existing `001_initial.sql` only if the tables do not already exist.
2. Apply `supabase/migrations/002_reviewed_public_reports.sql` after the reports table exists. It adds publication fields and allows public reads only for reviewed reports marked `published`.
3. Disable public signups. Invite editor accounts, then add each invited user's Auth UUID to `public.admin_users` using the Supabase SQL Editor.
4. Use the anon/public key only. The RLS policies enforce editor access; the dashboard also checks membership before showing content controls.

If this Supabase project already has the original schema, do not re-run `001_initial.sql`; apply only the additive migration after checking the table state.

## Hostinger deployment

Deploy this GitHub branch/reviewed merge as a **Node.js application** (the custom server is needed for live Supabase-rendered articles, report pages, dynamic sitemap, Markdown negotiation and response headers):

1. Select Node.js 22 or later compatible with Hostinger's supported versions.
2. Set the app root to the repository root. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as application environment variables. They are public browser configuration, not secrets; never add a service-role key.
3. Set the install command to `npm install`, build command to `npm run build`, and start command to `npm start`.
4. Apply the Supabase migration steps above, then redeploy so Vite receives its public environment variables during the build.
5. Check `/`, `/overview.html`, `/articles.html`, `/research.html`, `/robots.txt`, `/sitemap.xml`, `/llms.txt`, `/index.md`, `/.well-known/mcp/server-card.json`, and `/admin.html`. Submit the sitemap in Google Search Console.

For static-only hosting, Vite still builds the original public pages and agent files, but the custom editor, database-rendered article/report listings, dynamic sitemap, Markdown negotiation and HTTP `Link` header require a running Node application. Sitemaps help discovery; Google controls indexing and rankings.

## Local checks

```sh
npm install
npm run build
npm test
node scripts/runtime-smoke.mjs
```

`npm start` serves the `dist/` build. Without Supabase values, public article and report lists show an empty-state message and the editor stays disabled.

## Editorial safeguards

Do not publish allegations as established fact. A report needs verified findings, evidence, HTTPS source links, jurisdiction, legal provision, reviewer and review date. Give affected people a fair opportunity to respond, correct errors promptly, and do not upload confidential case material. Obtain legal and privacy review of organisational policies before relying on this site for case handling.

