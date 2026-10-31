# NextGenIQ Press — publishing portal

The public website of NextGenIQ Press, an independent open-access publisher, at
**https://www.nextgeniqpress.com**. It is a Next.js 16 (App Router) application,
written in React 19 and TypeScript, styled with Tailwind v4, and backed by MySQL
and Cloudflare R2.

It runs side by side with **OJS 3.5** (Open Journal Systems), served at `/ojs` on
the same domain. OJS is the system of record for users, manuscripts, peer review
and published articles. The portal is the public face: it reads published
content from OJS, signs users in through OJS, and owns the things OJS has no
place for (book series, editorial forms, the admin panel).

> **New to this repo?** Start with [docs/HANDOVER.md](docs/HANDOVER.md). It
> gives the reading order, the accounts and access you need, the current state of
> the system and the open work.

## What is published

| Code | Title | Kind | Slug | Spec |
| --- | --- | --- | --- | --- |
| TICR | Transactions on Intelligent Computing and Reasoning | Journal | `ijic` | [src/data/journals/ijic.ts](src/data/journals/ijic.ts) |
| JDMIE | Journal of Digital Management and Intelligent Enterprises | Journal | `ijdm` | [src/data/journals/ijdm.ts](src/data/journals/ijdm.ts) |
| SISDT | Studies in Intelligent Systems and Digital Technologies | Book series | `aiisc` | [src/data/series/aiisc.ts](src/data/series/aiisc.ts) |
| LNMRI | Lecture Notes in Multidisciplinary Research and Innovation | Book series | `lnmr` | [src/data/series/lnmr.ts](src/data/series/lnmr.ts) |
| TQCIS | Transactions on Quantum Computing and Information Security | Journal | `jqcs` | [spec](src/data/journals/jqcs.ts) |
| JAAISE | Journal of Agentic AI for Sustainable Energy | Journal | `jaise` | [spec](src/data/journals/jaise.ts) |
| DTCR | Digital Trust & Cyber Resilience Magazine | Magazine | `sst` | [spec](src/data/magazines/sst.ts) |
| RETA | Reviews in Emerging Technology and Applications | Review-only journal | `reta` | [spec](src/data/journals/reta.ts) |

The public titles and acronyms were updated in October 2026. Existing URL slugs
and OJS context identifiers are intentionally retained to preserve links and integrations.


RETA requires a matching OJS context before live harvesting and submissions can work.
Its ISSN is not yet assigned; no editorial appointments have been supplied.

Eight older journals and three older series were removed in October 2026. They
308-redirect (see `next.config.ts`), but OJS still hosts them.

## Quick start

```bash
nvm use                  # Node 22.13 (pinned in .nvmrc)
npm ci
cp .env.example .env.local
npm run harvest          # writes content/harvest.json (empty without OJS)
npm run dev              # http://localhost:3000
```

You don't need a database, OJS, R2 or SMTP to run the site locally. Anything
that depends on them degrades to a link-out or an "unavailable" message instead
of crashing. To work on forms, sign-in or the admin panel, follow
[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) to add MySQL (Docker) and the other
services.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build (`output: 'standalone'`) and serve |
| `npm run verify` | Typecheck, lint and unit tests; the gate CI and the deploy run |
| `npm test` | Unit tests (`node:test`; files are `src/lib/**/*.test.ts`) |
| `npm run harvest` | Pull published content from OJS into the harvest snapshot |
| `npm run db:migrate` | Apply `migrations/*.sql` to `PORTAL_DATABASE_URL` |
| `npm run storage:check` | Upload, read back and delete a test file in R2 |
| `npm run spike` | Live OJS diagnostic (config, API key, sign-in relay) |
| `npm run templates` | Rebuild the Word and LaTeX manuscript templates in `public/templates/` |
| `./scripts/deploy.sh production` | Atomic deploy with health gate and auto-rollback (CI normally runs this) |
| `node scripts/check-ssr.mjs` | Assert key routes serve real HTML, not a JS shell |

## Repository layout

```
src/
  app/                 routes (public pages are statically generated + ISR)
    admin/             site-admin panel (OJS site-admin role only)
    api/               route handlers: auth relay, forms, uploads, admin, health
    go/                resolvers that map OJS article and issue URLs to portal URLs
  components/
    mockup/            page components copied verbatim from the UI mockups
    admin/ forms/      admin screens and editorial form UI
    content/ series/   publisher pages, series pages, cards
  data/                CONTENT LAYER: journals, series, policies, news, publisher text
  lib/                 auth, OJS client, db, storage, search, citations, SEO, validation
  types/               content and publishing models
migrations/            portal MySQL schema (001–006)
scripts/               harvest, migrate, deploy, backup, diagnostics, template builder
deploy/                nginx vhost, harvest cron script, build env, systemd unit (unused)
ojs/                   OJS child theme (dmpedia) and a redacted config example
public/                brand, covers and tiles, generated manuscript templates
docs/                  documentation (index below)
```

## Rules that keep the site working

- **Public pages must be server-rendered.** Google Scholar can't index a
  client-rendered article page. CI runs `check-ssr.mjs` to enforce this.
- **The portal never writes to the OJS database.** It talks to OJS only over the
  REST API, OAI-PMH, and OJS's own web forms (for sign-in and registration).
- **OJS stays on the same origin, at `/ojs`.** Shared sign-in depends on this,
  because the portal hands its `OJSSID` session cookie to the browser.
- **Page markup follows the mockups.** Use inline styles over `var(--token)`
  colours only. There are no dead controls. See
  [docs/REPLICATION.md](docs/REPLICATION.md).
- **A push to `main` deploys to production.** GitHub Actions tags the release and
  runs `scripts/deploy.sh`. Do your work on a branch and merge to `main` only when
  it is ready to ship.

## Documentation

**Current. Read these first:**

| Document | What it covers |
| --- | --- |
| [docs/HANDOVER.md](docs/HANDOVER.md) | Start here: reading order, access checklist, current state, open work |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the system fits together: OJS boundary, data flow, auth, database |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Local setup, conventions, how to add a journal, series, policy or news item |
| [docs/API.md](docs/API.md) | Every route handler: method, auth, tables |
| [docs/OPERATIONS.md](docs/OPERATIONS.md) | Production: server, deploy, environment, harvest, logs, backups, rollback |
| [docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md) | Technical debt, security follow-ups, stale documentation |

**Reference. Still accurate in most places:**

| Document | What it covers |
| --- | --- |
| [docs/REPLICATION.md](docs/REPLICATION.md) | How to write page markup (binding) |
| [docs/PORTING-CONVENTIONS.md](docs/PORTING-CONVENTIONS.md) | Data, dates, metadata and accessibility conventions |
| [docs/OJS-INTEGRATION.md](docs/OJS-INTEGRATION.md) | The OJS boundary in depth, and the history of the auth spike |
| [docs/CONTENT-RESTRUCTURE-PLAN.md](docs/CONTENT-RESTRUCTURE-PLAN.md) | The October 2026 portfolio change, R2 setup, open publisher questions |
| [docs/ADMIN-PANEL-PLAN.md](docs/ADMIN-PANEL-PLAN.md) | Admin panel design and which phases are still unbuilt |
| [docs/SITE-ADMIN-GUIDE.md](docs/SITE-ADMIN-GUIDE.md) | Non-technical guide for the publisher's site administrator |
| [docs/GO-LIVE.md](docs/GO-LIVE.md) | The original server setup, step by step (Plan B is what was used) |
| [docs/LOCAL-DEV.md](docs/LOCAL-DEV.md) | Detailed local setup, including against a live OJS |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Older ops runbook. Its systemd parts are superseded by OPERATIONS.md |

**Historical. Background only:** [PLATFORM-AUDIT](docs/PLATFORM-AUDIT.md),
[AUDIT-RESPONSE](docs/AUDIT-RESPONSE.md), [rebuild-plan](docs/rebuild-plan.md),
[frontend-audit](docs/frontend-audit.md), [design-brief](docs/design-brief.md).

[docs/KNOWN-ISSUES.md](docs/KNOWN-ISSUES.md#stale-documentation) lists where the
older documents disagree with the code.
