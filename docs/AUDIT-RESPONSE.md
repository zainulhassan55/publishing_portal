# Audit response

Status of every finding in `PLATFORM-AUDIT.md` after the Next.js rebuild.

Three honest categories:

- **Fixed** — done and verifiable in this repo.
- **Enabled** — the code side is done; the remaining work is a configuration,
  DNS, registration or procurement step outside the codebase. Named so nobody
  mistakes "the code is ready" for "the problem is gone".
- **Open** — not addressed.

## Critical

| # | Finding | Status | Where |
| --- | --- | --- | --- |
| F-01 | Client-rendered SPA is invisible to Google Scholar | **Fixed** | Every public route is statically generated. Article pages emit `citation_*` tags server-side (`src/lib/citation-meta.ts`) plus `ScholarlyArticle` JSON-LD (`src/lib/jsonld.ts`). `scripts/check-ssr.mjs` asserts real HTML on every push and fails CI if a route returns a shell. |
| F-02 | OJS OAI identity is `localhost:8000` | **Fixed (2026-10-10)** | Fixed via `[oai] repository_id`, **not** `base_url` as originally recorded here. `verb=Identify` now reports `repositoryIdentifier = www.nextgeniqpress.com` and `oai:www.nextgeniqpress.com:article/1`. Closed while the repository still had zero published records, so no harvester had cached the broken identity and no re-registration was needed. `npm run spike` check 0a guards it. |
| F-03 | Placeholder ISSNs live on all ten journals | **Fixed** | `src/data/issn.ts` is the single registry; empty today, so every surface renders "Applied for". The literal `ISSN Sample` strings are gone from the codebase. Adding a real number is one line. |
| F-04 | "DOI-ready articles" advertised with no Crossref workflow | **Enabled** | `/indexing` now states the real status of every service instead of implying coverage. DOI fields flow through the harvest, article metadata, citation export and JSON-LD. Remaining: Crossref membership and enabling the OJS DOI plugin. |
| F-05 | No verified backup or disaster recovery | **Enabled** | `RUNBOOK.md` specifies what is backed up, what deliberately is not, and a quarterly restore drill with a dated results table. The drill is unrun — that table is empty on purpose, because an undated drill is the same as no drill. |
| F-06 | Manual deploys by file manager into the live OJS directory | **Fixed** | `scripts/deploy.sh`: timestamped release directories, atomic symlink swap, health gate with automatic rollback, five releases retained, production refuses an untagged or dirty tree, and nothing in the path can touch anything outside `releases/`. |
| F-07 | DKIM not enabled; review invitations filtered as spam | **Enabled** | Portal mail goes through a configurable SMTP sender (`src/lib/email.ts`) and degrades without claiming delivery. The actual fix is DNS: SPF, DKIM and DMARC, with the verification procedure in `RUNBOOK.md`. OJS mail is configured separately. |

## High

| # | Finding | Status | Where |
| --- | --- | --- | --- |
| F-08 | All unknown URLs return 200, including `/robots.txt` | **Fixed** | Real `robots.ts` and `sitemap.ts`; unknown routes call `notFound()` and return 404. `check-ssr.mjs` asserts the 404 so it cannot regress. |
| F-09 | No per-page titles, descriptions or social metadata | **Fixed** | Every route exports `metadata`/`generateMetadata` with a distinct title, description and canonical. Article pages add OpenGraph, Dublin Core and Scholar tags. |
| F-10 | No digital preservation (DOAJ requires it) | **Open — OJS plugin** | PKP Preservation Network plugin. Listed on `/indexing` as in progress rather than claimed. |
| F-11 | OJS session cookie missing `Secure` | **Fixed (2026-10-10)** | `force_ssl = On` in `config.inc.php`. Verified: `OJSSID` now carries `secure; httponly; samesite=lax`. No redirect loop through the Varnish hop — the vhost already passes `fastcgi_param HTTPS "on"`. `npm run spike` check 0d guards it. |
| F-12 | No article pipeline from OJS to the site | **Fixed** | `scripts/harvest.ts` → `content/harvest.json` → static pages, search index and sitemap. Publishing in OJS no longer needs a developer. Completeness is now decided against the credential-free OAI-PMH inventory — the run fails when OAI reports more published records than the API returned. It previously counted HTTP failures, which made a missing API key fatal to the whole deploy even though OJS requires a token for *every* API read. Remaining: generate the `portal-service` API key (`api_key_secret` is now set, so keys can be validated). |
| F-13 | Editorial boards empty, admin account as editor of record | **Fixed in presentation** | Journal pages state plainly that appointments are being confirmed and that the editorial office handles manuscripts meanwhile. No invented names anywhere. The appointments themselves are editorial work. |
| F-14 | Policy text has two sources of truth; sync tool missing | **Fixed on the portal side** | `src/data/policies.ts` is the single publisher-level source, with that rule written into the file. Journal-level pages are journal-scoped by design, not duplicates. The OJS copies should become links to these pages. |
| F-15 | No tests, no lint gate, no staging | **Fixed** | `npm run verify` (typecheck + lint + test); CI runs it on every push plus a build, a harvest and the SSR check; `deploy.sh staging` gives a real staging target. 21 unit tests on the pure logic — including the ORCID checksum, which caught an invalid identifier in the fixtures. |
| F-16 | Custom OJS theme not in version control | **Open — needs the files** | Cannot be fixed from here: the theme exists only on the server. `ojs/theme-dmpedia/` is the agreed home; flagged in the runbook as an unrecoverable single point of failure until then. |
| F-17 | No monitoring, uptime, error tracking or cron alerting | **Enabled** | `/api/health` reports status plus per-dependency detail and harvest freshness, and distinguishes "down" from "degraded" so a database blip does not page anyone about a site that is serving fine. Needs an uptime monitor and error tracking pointed at it. |

## Medium

| # | Finding | Status | Where |
| --- | --- | --- | --- |
| F-18 | Dead controls in production: `href="#"` PDF link, contact form that drops mail | **Fixed** | The contact form posts to `/api/contact`, stores the message before attempting the relay, and every failure path names a human to reach. "Download PDF" only renders when a galley actually exists. "No dead controls" is now a stated rule in the porting conventions. |
| F-19 | Three high-severity npm advisories, no update process | **Fixed** | Production dependencies audit clean (`npm audit --omit=dev` → 0). Achieved partly by removing dependencies rather than upgrading them: no ORM (one carried an open SQL-injection advisory), no migration CLI. CI gates on production advisories only, so a lint-toolchain advisory cannot block a release. |
| F-20 | Node version off the supported matrix, no `.nvmrc` | **Fixed** | `.nvmrc` pins 22.13.0; `engines` declares it; CI uses it. |
| F-21 | No CSP, no HSTS | **Fixed** | Both in `next.config.ts`, with `nosniff`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy`. `style-src` allows inline because the design system drives per-subject colours through inline styles; `script-src` does not get that latitude. |
| F-22 | Single 443 kB bundle, no code splitting | **Partly fixed, with a real trade-off** | Code splitting is done: the homepage now loads 5 route-specific chunks instead of one monolith, and fonts are self-hosted via `next/font` instead of fetched from Google. But measured honestly, **first-load JavaScript went up**, not down: ~166 kB gzipped against the ~119 kB the audit measured. The increase is the React 19 + Next 16 runtime plus the new client features (typeahead, theme switching, session). What did improve decisively is the HTML: 21 kB gzipped of real, readable content per page against the old 983-byte empty shell. That was the trade accepted to fix F-01, and it is the right one for a publisher — but it is a trade, not a free win. If first-load JS needs to come down later, the lever is the header: it is a client component on every route, and making the typeahead fetch its index on first focus instead of shipping it inline would be the first cut. |
| F-23 | Repo hygiene: stock README, dead fields, no `.env` | **Fixed** | Real README, `.env.example` documenting every variable with its failure mode, `docs/` committed, the dead `quickLinks` field gone with the legacy components. |

## Findings from the frontend audit

| Finding | Status |
| --- | --- |
| No search anywhere — "the biggest functional gap" | **Fixed.** Faceted search with live counts over articles, journals and all guidance pages. Build-time index, no search service to operate. |
| Contrast failures (`text-slate-400` on white ≈ 2.6:1) | **Fixed.** Token layer only; `--muted` is `#505C68` on white. No `slate-*` utility survives. |
| Justified body text, 80–95ch measure | **Fixed.** Left-aligned with `text-wrap: pretty`; `.prose-measure` caps at 68ch. |
| No skip link, `aria-haspopup` without `role="menu"` | **Fixed.** Skip link in the root layout; menus, tabs and disclosures follow the ARIA patterns with arrow-key navigation. |
| Auto-advancing carousel with no pause (WCAG 2.2.2) | **Fixed.** Pause control required by the conventions; also pauses when the tab is hidden and does not run under `prefers-reduced-motion`. |
| No `loading="lazy"`, no `srcset`, eager full-size JPEGs | **Fixed.** `next/image` throughout, AVIF/WebP enabled. |
| Author pages buried in an 11px utility strip; no breadcrumbs | **Fixed.** Author hub is top-level nav; breadcrumbs on every nested page. |
| `BookSeriesLayout` duplicating `JournalLayout` line for line | **Fixed.** Both legacy components deleted; series render from the shared registry. |
| Stub article page | **Fixed.** Full article view: sections, figures, tables, equations, reference popovers, declarations, four-format citation export, metrics. |
| Soft-redirect 404s | **Fixed.** Real 404s, asserted in CI. |

## Deliberately not done

- **Acceptance rates and decision-time medians** are not displayed. They need
  rejected-submission data the harvest does not carry, and computing them from
  published articles alone would show 100%. The journal insights block says
  these are published once a full year of decisions exists.
- **Fictional content is not shipped.** The article, issue and metrics surfaces
  are fully built and exercised against fixtures behind
  `NEXT_PUBLIC_DEMO_CONTENT=1`; production reads the OJS harvest, which is
  empty. Publishing invented articles would be the same class of credibility
  failure as F-03.

  This claim was false when written. The flag was `!== '0'`, so fixtures were
  **on** unless an environment explicitly opted out, and `.env.example` set `1`.
  Any deploy that simply omitted the variable would have published invented
  articles. It is now `=== '1'` — opt-in — so the failure mode is an empty site
  rather than a fictional one. CI builds without the flag and greps the output
  for a fixture title, which is what makes the claim checkable rather than
  aspirational.
- **A portal-native reviewer workspace** is not built and **cannot be**: OJS
  3.5.0.5 exposes no reviewer resource on its REST API. `reviews`,
  `reviewAssignments` and `submissions/{id}/reviewRounds` all answer "route
  could not be found" (probed; `npm run spike` check 1 asserts it).

  To be unambiguous: **peer review works.** Reviewer assignment, review rounds,
  blinding, review forms, reminders and editorial decisions are all OJS features
  and all function normally. What is absent is the API to read that state from
  outside, so reviewers do their work in OJS's own interface and the portal
  links to it at `{journal}/dashboard/reviewAssignments` rather than
  reimplementing it.

  This was previously recorded as blocked on the auth spike, which was the wrong
  diagnosis — no session would have unblocked an API that does not exist.
