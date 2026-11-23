# Youth Legal Revolution website

This rebuild restores the existing home and organisational overview pages, preserves their main sections and visual system, and adds server-rendered articles, evidence-based legislation reviews, a secure editorial dashboard, and agent/SEO discovery files.

## What it contains

- index.html, overview.html, styles.css and script.js — existing public content and shared styling, updated with working navigation, logo and canonical/structured metadata.
- server.js and views/ — server-rendered article/research pages, sitemap, Markdown negotiation, read-only MCP tools, and admin routes.
- db/schema.sql — MySQL tables for admin accounts, articles, reviews, and a content audit log.
- public/robots.txt, llms.txt, index.md and .well-known/mcp/server-card.json — crawler and agent discovery.
- public/youth-legal-revolution-logo.png — favicon/header logo derived from the uploaded artwork at favicon-friendly dimensions.
- public/contact.html, terms.html and privacy.html — linked contact and legal-information pages.

## Hostinger deployment

This is a Node.js application. Configure Hostinger Node.js deployment to use the repository root, Node.js 22.x or 24.x, build command npm install --include=dev && npm run build, and start command npm start. Hostinger Node.js hosting can connect to a Hostinger MySQL database; use 127.0.0.1 as its host.

1. Create a MySQL database in hPanel and import db/schema.sql with phpMyAdmin.
2. Connect the repository and intended branch in the Node.js deployment settings.
3. Set these environment variables in hPanel; do not commit secrets:
   - NODE_ENV=production
   - SITE_URL=https://youthlegalrevolution.in
   - PORT (Hostinger-provided app port, if required)
   - DB_HOST=127.0.0.1, DB_PORT=3306, DB_USER, DB_PASSWORD, DB_NAME
   - SESSION_SECRET (generate a long random value, e.g. node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
   - TRUST_PROXY=1
4. Build and start the app. Check /healthz, /robots.txt, /sitemap.xml, /llms.txt, /.well-known/mcp/server-card.json, /blog, /research, and /admin/login.
5. Create the first editor from the application terminal after the database schema and environment variables are set: npm run admin:create. The script stores a bcrypt password hash, not the plain password.
6. In Google Search Console, verify the domain property and submit https://youthlegalrevolution.in/sitemap.xml. Search indexing and ranking are decided by Google and cannot be guaranteed by site changes alone.

## Admin and editorial handling

The admin dashboard supports article and review create/edit/delete, draft and publication status, slug management, and database-backed sessions. Admin passwords are bcrypt-hashed; sessions are HTTP-only, same-site cookies; write forms use CSRF tokens; login attempts are rate-limited. Keep SESSION_SECRET and database credentials only in Hostinger environment settings.

Each public legislation review should identify its jurisdiction, exact law and provision, review category, dated evidence, source URLs, reviewer and review date, limitations, and contrary context. Reviews are editorial assessments, not legal or official findings. The site intentionally contains no unsourced allegations or invented findings; editors must add verified research before publication.

Before launch, verify that the contact email and privacy text match the organization's actual practices. After deployment, use Search Console to check crawl/index status and fix any reported canonical, page, or sitemap errors.

## Local verification

Requires Node.js 22.12 or newer and MySQL credentials in .env (copy .env.example and fill in local values). Run npm install, npm run check:templates, and npm run build; then import the schema and run npm start.
