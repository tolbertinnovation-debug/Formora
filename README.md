# Formora

**Turn information into action.** Built in Africa. Designed for the world.

Formora is a form-building product by [Tolbert Innovation Hub](https://tolbertinnovationhub.org). This first release is a working, browser-local prototype of its core experience.

## Run

Requires Python 3 for the local server and Node.js 20+ for model tests. No package installation or build step is needed.

```sh
npm start
```

Open http://localhost:3000. Serve over HTTP rather than opening `index.html` directly, because the app uses ES modules.

```sh
npm test
```

## Included

- Responsive homepage and six filterable templates.
- Visual form editor: title, description, accent color, and seven question types.
- Required questions, dropdown options, question ordering and removal.
- Modal form preview, answer validation, and test submissions.
- Searchable form workspace and response table.
- Browser-local autosave, CSV response exports, and JSON backups.
- CSV formula protection and HTML escaping for user-entered content.
- Accessible labels, keyboard focus indicators, native dialog behavior, and reduced-motion styling.

## Current boundaries

There is no backend, authentication, public form publishing, email sending, file upload, payment integration, or AI generation. Forms and responses exist only in this browser’s localStorage. Another person or device cannot submit to your workspace. Clearing browser data deletes saved work. Download backups for retention; backup import is not yet implemented. Do not collect sensitive or real applicant data in this prototype.

The workspace detects storage changes in another tab and asks for a reload rather than silently overwriting them. If storage is unavailable or malformed, work can continue in memory and be downloaded as a JSON backup. Exports and response tables follow current questions; removed question answers are retained only in JSON backups.

Fonts are optionally loaded from Google Fonts; system fonts provide a fallback. All other runtime assets are local. No analytics or third-party scripts are included.

## Static hosting

The root directory can be served by any static HTTP host. For GitHub Pages, select **Deploy from a branch → main → / (root)** in repository Settings → Pages. This repository does not automatically configure or claim a deployment. A GitHub Pages deployment is still a local-data demo, not a shared service.

## Next production milestone

See [ROADMAP.md](./ROADMAP.md). The next milestone is an authenticated, shared-storage pilot for training registrations, followed by public submission links. Payment providers must be evaluated for the chosen country before integration.
