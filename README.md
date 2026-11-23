# Youth Legal Revolution

Responsive legal literacy and civic accountability website with article management, administrator sign-in and a private evidence-review workflow.

## Important content note

The conversation reference supplied the exact logo attachment but did not include the original website source files or complete organisational overview. This rebuild includes clearly labelled starter copy and draft articles; verify and replace them with approved organisational text and primary legal citations before launch. No allegation in the report workflow is treated as fact automatically.

## Stack and routes

- Vite multi-page frontend: `/`, `/overview.html`, `/articles.html`, `/article.html?slug=...`, `/admin.html`.
- Supabase Auth, Postgres with row-level security, and Storage for administrator content and media.
- Public SEO metadata, canonical URLs, NGO JSON-LD, sitemap and robots rules.

## Configure Supabase

1. Create a Supabase project and configure the desired sign-in method. Disable public signups; invite named administrators.
2. Apply `supabase/migrations/001_initial.sql` in the SQL editor. Run `supabase/seed.sql` for draft starter content.
3. Add an authenticated user to `public.admin_users`: `insert into public.admin_users(user_id) values ('AUTH_USER_UUID');` Run this as project owner only after creating the user.
4. Copy `.env.example` to `.env.local` and enter the project URL and public anon key. Never expose a service-role key in the website.
5. Install dependencies and run `npm run dev`.

## Hostinger Git deployment

Push this folder's contents to the root of the new repository. In Hostinger Git deployment set branch `main`, root `.`, build command `npm install && npm run build`, output directory `dist`, and Node 20 or newer. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment variables. Deploy and confirm the output includes all five HTML files and `robots.txt`/`sitemap.xml`.

Use the matching domain in canonical tags and structured data if the production domain differs. Submit `https://youthlegalrevolution.in/sitemap.xml` in Google Search Console after DNS/domain ownership verification. Indexing and rankings are controlled by Google and are not guaranteed.

## Research review workflow

Reports store allegation, evidence (JSON source records), legal analysis, obligation, responsible authority, review status, verified findings, response and disclaimer separately. RLS keeps all reports private to administrators by default. Implement an editorial approval and publication policy before making reports public. Obtain legal review, cite primary sources, redact personal data, invite response and maintain corrections. Avoid asserting misconduct as established without verified evidence and review.

## Current limitations / launch checklist

- The supplied conversation did not expose the original source content; approved existing text still needs to be added.
- Seed articles are drafts and must be checked against current law and populated with authoritative citations.
- The current frontend reads published articles through Supabase from the browser. For fully server-rendered, per-article SEO, move to an SSR-capable deployment or generate static pages from a trusted publishing pipeline; client-rendered content may be indexed less consistently.
- Admin form supports page/article editing and report listing, but report-specific evidence entry/review, version history, audit log, rich text, user roles, account recovery and notification workflow need a production iteration. Reports are deliberately private.
- Configure and secure Supabase, domain DNS/TLS, backups, rate limits, privacy/retention policy, contact channels and Search Console independently.
- Uploaded image MIME types and 5 MB limit are enforced by storage bucket settings.
