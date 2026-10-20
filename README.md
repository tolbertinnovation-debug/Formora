# Formora

**Turn information into action.** Built in Africa. Designed for the world.

Formora is a form-building platform by [Tolbert Innovation Hub](https://tolbertinnovationhub.org). This branch adds a cloud pilot to the existing browser demo. It is not a completed production release.

## Run locally

Use Node.js 24. Install dependencies with `npm ci`. Copy `.env.example` to `.env.local` and set development-only credentials. Never commit credentials. Run `npm run dev` and open http://localhost:4173.

- `npm test`: model, server validation, authentication and handler authorization tests.
- `npm run build`: Vite production frontend in `dist/`.
- `npm run migrate`: apply the tracked, idempotent SQL migration using a direct database URL. Use a database branch for development and a separate production database branch.

## Features

- Responsive homepage, six templates and seven question types.
- Browser demo with local storage, previews, test responses and exports.
- Account creation, sign-in, sign-out, email verification and recovery screens using Neon managed authentication.
- Same-origin authentication proxy: session cookies remain HTTP-only; server handlers verify sessions with the managed authentication service.
- Cloud form editing and autosave with optimistic versions and conflict handling.
- Explicit publishing creates a public snapshot and an unguessable link. Later draft edits stay private until republished.
- Public submissions without applicant accounts, validated on the server against the published snapshot.
- Published version checks, submission retry keys, a honeypot, per-form/IP submission throttling and pilot resource limits.
- Private response tables, CSV exports and JSON backups including original question snapshots.

Pilot limits: 100 active forms per account, 50 questions per form, 1,000 responses per form, and 30 submissions per form/IP per hour. Current CSV/table columns follow current questions; the JSON backup preserves original question snapshots and removed answers. Backup import is not implemented. Public link holders can access the published form. Form removal is a soft deletion; it stops new submissions and retains records for recovery by the operator.

## Deployment and environment

Vercel runs the server endpoints under `/api` and serves the Vite frontend. `vercel.json` defines installation, build, output and region. A static-only host cannot run the cloud features.

Set two **server-side** variables in the exact Vercel project:

| Variable | Value | Handling |
| --- | --- | --- |
| `DATABASE_URL` | Formora application database connection string | Secret, separate values for Preview and Production |
| `NEON_AUTH_BASE_URL` | The matching branch’s managed Auth base URL | Server config, separate branch-specific values |

Do not expose credentials through a `VITE_` variable. Use a restricted runtime database role with grants only for Formora application tables when connecting the pilot. Keep migration/owner credentials separate. Apply `migrations/001_cloud_workspace.sql` before starting the API. Configure exact app origins in Neon's trusted domains. Do not use production database credentials in previews.

The Formora Neon project and managed auth are provisioned. The tracked schema is applied only on the isolated `development` database branch. Production schema and Vercel secret installation remain pending. The database credential transfer to Vercel preview was blocked by automatic approval review; no workaround was attempted. The existing live browser demo remains unchanged.

## Verification status

Automated tests cover model behavior, server-side validation, request guards, unauthenticated access, denied cross-owner edits/response reads, unverified publishing, and published-only public reads. Database inspection confirmed all three application tables on the development branch. Frontend production build passes and account screens render in the browser preview.

Live managed sign-up/sign-in/sign-out, email code delivery, password recovery, cloud autosave, cross-device submissions, transaction concurrency and production deployment are **not yet verified**. The workspace cannot connect directly to the database host; database checks used the Neon connector. After the Vercel secret connection is approved, deploy and verify these flows in Preview before merging/releasing.

## Before a broader launch

Configure production SMTP in managed Auth, verify recovery and email delivery, add creator privacy/contact details and a privacy policy, define retention/deletion workflows, test database recovery, and provide an abuse-report channel. Payments, uploads, team permissions, AI generation and offline collection remain future work. The public pilot has basic spam controls, not comprehensive abuse prevention.

Fonts are optionally loaded from Google Fonts; system fonts provide a fallback. No analytics scripts are included.
