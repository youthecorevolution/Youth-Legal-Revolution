# Youth Legal Revolution website

Responsive static website package with a homepage and a dedicated organisational overview page.

## Requirements
- Node.js 20 or later (recommended)
- npm

## Run locally
```bash
npm install
npm run dev
```
Vite prints a local preview URL, usually `http://localhost:5173`.

## Build for deployment
```bash
npm run build
npm run preview
```
The production site is generated in `dist/`.

## GitHub / Hostinger
Upload the project files to the repository root and commit. If Hostinger uses a Node.js build deployment, use `npm install` as the install step and `npm run build` as the build command; publish the `dist` directory if the deployment interface asks for an output directory. For a static-file deployment, `index.html`, `overview.html`, `styles.css`, `script.js` and `assets/` can be served directly from the repository root.

## Included
- `index.html`: homepage, focus areas, resource library, updates and get-involved section.
- `overview.html`: organisational overview with vision, mission, objectives, constitutional foundation, focus areas, methodology, ethics and proposed programmes.
- `styles.css`: responsive shared styles.
- `script.js`: legal library search and category filters.
- `assets/`: supplied Youth Legal Revolution logo in JPG and PNG formats.
- `package.json`: development, build and preview scripts powered by Vite.

The contact email displayed in the homepage should be verified before launch. Proposed programmes are labelled as proposed, not already operational. Legal information is educational and should be verified against current official sources.
