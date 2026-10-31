# Developer handover

This guide is for the developer taking over the NextGenIQ Press portal. Its
claims were checked against the code on 2026-10-30, and the docs it links to
were written at the same time.

## 1. The system in one paragraph

NextGenIQ Press publishes two open-access journals (IJIC, IJDM) and two book
series (AIISC, LNMR). Peer review and journal publishing happen in **OJS 3.5**,
hosted at `www.nextgeniqpress.com/ojs`. This repo is the **portal** at
`www.nextgeniqpress.com`, a Next.js 16 app that:

- presents journals, series, policies and articles;
- pulls published articles from OJS every 15 minutes;
- signs users in by driving OJS's own login, so one account works on both;
- runs editorial forms with uploads to Cloudflare R2;
- publishes book volumes, which have no OJS equivalent;
- gives site administrators an admin panel at `/admin`.

The portal and OJS share one VPS managed by CloudPanel. The portal runs under
PM2, and a push to `main` deploys it automatically.

## 2. Reading order

1. [README.md](../README.md): what the repo is, and the commands.
2. [ARCHITECTURE.md](ARCHITECTURE.md): the OJS boundary, how content and sign-in
   flow, and the database. Read this before you change anything in
   `src/lib/auth` or `scripts/harvest.ts`.
3. [DEVELOPMENT.md](DEVELOPMENT.md): get it running locally, and the how-tos for
   day-to-day content changes.
4. [OPERATIONS.md](OPERATIONS.md): how production works, how to deploy, roll back
   and read logs.
5. [KNOWN-ISSUES.md](KNOWN-ISSUES.md): what is broken, risky or unfinished.
6. [API.md](API.md): reference, for when you need it.
7. [REPLICATION.md](REPLICATION.md): binding rules for page markup. Read it
   before your first UI change.

## 3. Access checklist

Ask the current owner for each of these. Tick them off as you receive them.

| # | Access | Why you need it |
| --- | --- | --- |
| 1 | GitHub: write access to `zainulhassan55/publishing_portal`, and admin rights to its Actions secrets and environments | Code, CI and deploys. Secrets: `DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS`, `DEPLOY_PRODUCTION_HOST`, `OJS_API_KEY`. Variable: `OJS_BASE_URL` |
| 2 | SSH as `nextgeniqpress` on the VPS (your own key added to `~/.ssh/authorized_keys`) | Logs, `.env`, PM2, manual rollback |
| 3 | CloudPanel login (port 8443) | Vhost, cron jobs, databases, nginx and PHP logs |
| 4 | OJS **Site Administrator** account | The portal admin panel is open only to OJS site admins |
| 5 | Cloudflare account: the R2 buckets `ngiq-submissions` and `ngiq-publications`, and Turnstile | Uploads, captcha, API tokens |
| 6 | DNS registrar / DNS host for `nextgeniqpress.com` | SPF, DKIM, DMARC, domain changes |
| 7 | SMTP credentials (the mailbox behind `SMTP_FROM`) and the `contact@` inbox | Portal email |
| 8 | Crossref account (DOI prefix `10.63521`) | DOI deposits (OJS does articles; book DOIs are manual) |
| 9 | Backblaze B2 (if backups are set up) | Off-site backups; see [OPERATIONS.md §8](OPERATIONS.md#8-backups) |
| 10 | A copy of production `~/portal/.env`, sent over a secure channel and never committed | To understand the production config |

Once you have access, **rotate the shared credentials**: the CloudPanel
password, the OJS admin password, the R2 token, the deploy SSH key and
`PORTAL_REVALIDATE_SECRET`. Revoke the previous developer's SSH key and GitHub
access.

## 4. Current state (as of 2026-10-30)

**Healthy**
- `npm run verify` passes: typecheck, lint, and 144 of 144 tests.
- Production is live. The latest release tag is `v1.3.13`.
- The harvest cron script, `/api/revalidate`, and the admin show/hide control are
  built. Once the cron is installed on the server (see below), anything published
  in OJS reaches the site within about 15 minutes, with no deploy needed.

**Uncommitted work — read before cloning.** The previous developer's working
tree on branch `frontend-redesign` has about 60 modified files and several new
ones (for example `src/lib/metadata.ts` and `src/app/opengraph-image.tsx`). They
cover the October 2026 restructure follow-ups, the forms and the redesign. Make
sure all of it is committed and pushed before the handover, or you will be
missing work. Then merge `frontend-redesign` into `main` through a PR. Merging
deploys it.

**Waiting on server setup** (needs confirming on the box; see
[OPERATIONS.md §10](OPERATIONS.md#10-one-time-setup-still-to-confirm)):
- the `S3_*` R2 variables in `~/portal/.env` (forms answer 503 without them)
- `HARVEST_PATH`, `PORTAL_REVALIDATE_SECRET` and the `*/15` harvest cron
  (GO-LIVE B10)
- migrations 004–006 (`article_display`, editorial forms, book volumes), which
  apply automatically on the next deploy

**Waiting on the publisher**
- ISSNs for all four titles. `src/data/issn.ts` is empty, so the site shows
  "Not yet assigned".
- House citation styles for the manuscript templates. The current choice is
  numbered for IJIC and AIISC and APA 7 for IJDM and LNMR; this was a guess.
- The open questions in
  [CONTENT-RESTRUCTURE-PLAN.md](CONTENT-RESTRUCTURE-PLAN.md).
- The only real published paper (OJS submission 21) sits in the removed journal
  IJDH, so it does not appear on the portal.

**Not built yet**
- Admin panel phases 2 (portfolio control), 5 (calls for papers) and 6 (users).
  See [ADMIN-PANEL-PLAN.md](ADMIN-PANEL-PLAN.md).
- An unsubscribe endpoint for email alerts.
- Emailing proposers when an admin decides on a journal proposal.
- Crossref deposits for book DOIs.
- A staging environment. `deploy/build-env.staging` does not exist.

## 5. Suggested first week

1. Get local dev running with MySQL in Docker, then run `npm run verify`.
2. Read the production `.env` and `pm2 logs ngiq-portal`, and check
   `https://www.nextgeniqpress.com/api/health`. It should report `status: ok`, a
   recent `harvest.at`, and the database up.
3. Work through [OPERATIONS.md §10](OPERATIONS.md#10-one-time-setup-still-to-confirm)
   and confirm each item on the server.
4. Fix the high-priority items in [KNOWN-ISSUES.md](KNOWN-ISSUES.md#high-priority),
   starting with the spoofable client IP. Each one is small.
5. Make a trivial change on a branch, open a PR, watch CI, merge, and watch the
   deploy. That shows you the whole pipeline end to end.

## 6. Who to ask

| Topic | Contact |
| --- | --- |
| Code history and decisions | The previous developer (fill in) |
| Editorial content, policies, editors | The publisher / editorial office, `contact@nextgeniqpress.com` |
| Server and hosting account | The owner of the CloudPanel / VPS account (fill in) |
