# Formora development roadmap

## Product direction

Help schools, training providers, NGOs and small businesses create forms and manage responses, with a fast mobile experience. Launch a narrow pilot in Liberia, then expand according to customer demand.

## Milestone 1 — Browser prototype (this release)

Homepage, templates, editing, local test submissions, response management and exports. No live accounts or payments.

## Milestone 2 — Shared registration pilot

- Choose hosting, database and identity providers with the founder.
- Add account creation, verified sign-in, password recovery and organization ownership.
- Persist forms and submissions on the server with authorization enforced for each request.
- Add draft/published form versions and public submission links that do not require applicant accounts.
- Validate answers on the server, impose resource limits, rate-limit submissions and provide spam controls.
- Add reliable database backups and test restoration.
- Add applicant-facing privacy details, collection notices and retention/deletion controls.
- Separate demo data from pilot records and import reviewed data only.
- Verify that one organization cannot read or modify another organization’s records.
- Test form creation → publishing → submission from another device → dashboard → export.

## Milestone 3 — Institutional workflows

Team permissions, review statuses, searchable responses, email confirmations, safe file uploads, consent fields, PDF summaries and accessibility review. Version question schemas so old submissions retain their original meaning. Add backup import with schema validation.

## Milestone 4 — Payments and broader access

Select providers based on supported countries, currencies, merchant requirements, settlements and refunds. Confirm payments through signed webhooks with idempotency and reconciliation; never treat a screenshot as confirmation. Consider mobile money through supported providers. Add language support and save-and-resume based on pilot demand.

## Milestone 5 — Scale from evidence

AI-assisted draft forms with creator review, developer integrations, advanced workflows and offline field collection. Introduce paid plans after measuring usage, operating costs and willingness to pay. Do not promise unlimited resources.

## Pilot measures

Track first-form publishing, applicant completion, repeat institutional use, support needs, reliability, and willingness to pay. Establish baseline results before setting growth targets.
