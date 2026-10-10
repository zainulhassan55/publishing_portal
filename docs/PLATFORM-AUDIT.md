# NextGenIQ Press — Platform Audit & Build-Out Plan

**Audited:** 6 October 2026
**Scope:** `publishing_portal` @ branch `update_frontend` (`61dea15`) + the live installation at `www.nextgeniqpress.com`
**OJS version:** 3.5.0.5 (confirmed live)
**Journals:** 10 · **Articles published:** 0

> Findings carry the evidence they were derived from. Severity reflects impact on
> publishing credibility and operational risk, **not** implementation effort.

---

## Contents

1. [Verdict](#1-verdict)
2. [Findings register](#2-findings-register)
3. [Target architecture](#3-target-architecture)
4. ["What database should we use?"](#4-what-database-should-we-use)
5. [Recommended services](#5-recommended-services)
6. [Roadmap](#6-roadmap)
7. [What I could not verify](#7-what-i-could-not-verify)

---

## 1. Verdict

**A good brochure site and a stock OJS install, joined by hyperlinks.**

The engineering that exists is genuinely clean. The content model is well factored — one
template (`src/data/journalTemplate.ts`) generates ~27 pages per journal from a ~90-line
spec, so adding journal #11 is cheap. The build works, the OJS install is live, and all ten
journal paths match between the two systems.

But what exists is a *brochure*. It renders text that was typed into TypeScript files. It
does not know anything about the journals it advertises, and it cannot currently be found by
the one search engine that matters most to academic publishing.

| Severity | Count |
| --- | --- |
| Critical | 7 |
| High | 9 |
| Medium | 6 |

### The single most consequential finding

Every portal URL returns the same 983-byte empty HTML shell. **Google Scholar does not
execute JavaScript.** It cannot see a single word of your journal pages. For an academic
publisher, being indexed *is* the product — authors choose journals they can find, and
indexers evaluate what they can crawl. This is architectural, not a settings toggle.

---

## 2. Findings register

### Critical

#### F-01 — The portal is invisible to Google Scholar and most crawlers

**Evidence**

```
$ curl -s https://www.nextgeniqpress.com/journals/ijdm | wc -c
983
# identical shell for every route; no journal text, no per-page title
```

The site is a client-rendered SPA with no server rendering or prerendering. Crawlers receive
an empty `<div id="root">`. Google Scholar never runs JS and additionally requires
`citation_*` meta tags it cannot find. Google Search renders JS inconsistently and with long
delay.

**Fix:** prerender all routes at build time. Because your content is already compile-time
constants, static generation is a contained change — not a rewrite.

---

#### F-02 — OJS is publishing a permanent identity of `localhost:8000`

**Evidence** — OAI-PMH `Identify` on the live site

```xml
<repositoryIdentifier>localhost:8000</repositoryIdentifier>
<sampleIdentifier>oai:localhost:8000:article/1</sampleIdentifier>
```

A development value survived into production. Every article OAI ever emits will carry an
identifier like `oai:localhost:8000:article/1`. OAI identifiers are meant to be globally
unique and permanent; harvesters (DOAJ, BASE, Scholar, Crossref workflows) key off them.

**This has a closing window.** Fixing it before the first article is published costs one
config line. Fixing it afterwards changes every identifier at once, which harvesters read as
mass deletion and re-insertion.

---

#### F-03 — Placeholder ISSNs are live on all ten journals

**Evidence** — `src/data/journalTemplate.ts:918`

```ts
issn:  'ISSN Sample',
eIssn: 'eISSN Sample',
```

Hardcoded in the shared factory, so it renders on every journal page publicly. An author
doing due diligence reads "ISSN Sample" as evidence of a predatory or unserious operation.
No indexer will accept a journal without a real ISSN.

**Fix:** register real ISSNs through your national ISSN centre (one per journal, print and
electronic), then make the field per-journal rather than template-level. Until they exist,
omit the field rather than print a placeholder.

---

#### F-04 — No DOI infrastructure, while the site advertises DOIs

The homepage promises "DOI-ready articles" and every journal page lists DOI metadata. There
is no Crossref membership evident, no DOI prefix configured, and no deposit workflow. DOIs
cannot be self-issued — they require membership in a registration agency and an automated
deposit pipeline.

**Fix:** join Crossref, obtain a DOI prefix, enable the OJS Crossref plugin for automatic
deposit on publication.

---

#### F-05 — No verified backup or disaster recovery for the system of record

Everything irreplaceable — user accounts, submissions, peer reviews, editorial decisions,
uploaded manuscripts — lives in one MySQL database and one directory on a single VPS. The
operations guide describes backups as a manual weekly task. Manual weekly backups are, in
practice, backups that stop happening.

There is no second server, no tested restore, and no offsite copy guarantee. A disk failure
or a bad OJS upgrade loses the peer-review history of ten journals permanently.

**Fix:** nightly automated `mysqldump` plus `ojs_files` sync to offsite object storage with
retention, and — critically — a *scheduled restore drill*. An untested backup is a hypothesis.

---

#### F-06 — Production deploys are manual file surgery next to the live database app

**Evidence** — current documented procedure

```
npm run build:vps  →  zip dist-vps  →  CloudPanel File Manager
→  delete assets/, index.html, favicon.svg, icons.svg
→  upload + extract into htdocs/www.nextgeniqpress.com
   (the same directory that contains ojs/ and its live data)
```

CI exists but only publishes a GitHub Pages preview — it never touches production. Every
real release is hand-performed deletion inside the directory containing the live journal
system. One mis-click on `ojs/` destroys the platform. There is also no staging environment,
so nothing is ever verified before it is live.

**Fix:** automated deploy on tag via SSH/rsync to a versioned release directory with an
atomic symlink swap, so rollback is instant and `ojs/` is never in the blast radius.

---

#### F-07 — Peer review depends on email that is configured to land in spam

OJS sends through a Hostinger mailbox over SMTP, and the operations guide records DKIM as
*not yet enabled*. Review invitations, revision requests, and decision letters are the
mechanism by which peer review functions. If reviewers never see invitations, the editorial
process silently stalls and authors blame the journal.

Shared-hosting mailboxes are also rate-limited and share sender reputation with unrelated
tenants — unsuitable for transactional volume.

**Fix:** enable DKIM immediately, then move OJS SMTP to a dedicated transactional provider
with SPF, DKIM, DMARC aligned and bounce/complaint monitoring.

---

### High

#### F-08 — Every unknown URL returns HTTP 200, including `/robots.txt`

**Evidence**

```
/this-page-does-not-exist-xyz  →  200  (HTML shell)
/robots.txt                    →  200  (HTML, not robots)
/sitemap.xml                   →  200  (HTML, not a sitemap)
```

The SPA catch-all serves `index.html` for everything, and the React router then redirects
unknown paths to home. Search engines treat this as soft-404s and will index unlimited junk
URLs. There is no real `robots.txt` and no sitemap, so crawlers get no guidance at all.

---

#### F-09 — No per-page titles, descriptions, or social metadata

There is no head management anywhere in the app — no `document.title` updates, no helmet
library. All ~150 routes share the single title `NextGenIQ Press` and one generic description
from `index.html`. Open Graph and Twitter card tags are entirely absent, so every shared link
renders identically and anonymously.

---

#### F-10 — No digital preservation, and DOAJ requires it

Nothing archives published content outside your own server. Scholarly publishing expects a
declared preservation strategy so the record survives the publisher; DOAJ asks for it
directly, and libraries treat its absence as disqualifying.

**Fix:** enable the PKP Preservation Network plugin — free, purpose-built for OJS, and the
lowest-effort way to satisfy the requirement. Larger operations add CLOCKSS or Portico.

---

#### F-11 — OJS session cookie is missing the `Secure` flag

**Evidence** — live response header

```
set-cookie: OJSSID=...; path=/ojs/; httponly; samesite=lax
                                    ^ no Secure attribute
```

`HttpOnly` and `SameSite=Lax` are set, which is good, but without `Secure` the editor/admin
session cookie may be transmitted over plaintext HTTP. This typically means `force_ssl` is
off in `config.inc.php`. Neither host sends HSTS either, so there is no browser-enforced
HTTPS.

---

#### F-12 — No article pipeline, and nothing to pipe yet

**Evidence**

```
src/data/siteContent.ts:148   latestArticles: Article[] = []
src/data/siteContent.ts:404   articleDetails: ArticleDetail[] = []
OAI ListRecords               <error code="noRecordsMatch">
```

The portal has no mechanism to learn about published articles, and OJS currently holds none.
The `/articles` route renders an empty state and `/articles/:slug` always redirects away.
Issue archives are hardcoded "Volume 1 · Issue 1 · 2026" placeholders unconnected to OJS
reality.

The good news: OAI-PMH is open and working (verified), so the harvest path needs no
credentials.

---

#### F-13 — Editorial boards are empty and the admin account is the editor of record

Board pages carry generated filler ("profiles will be published as appointments are
confirmed") with no named people. The operations guide further records that, after test
accounts were removed, `admin` remains the assigned editor on *all ten* journals — so every
new submission routes to a shared administrative account rather than a responsible editor.

Indexers verify editorial boards as an anti-predatory signal. An unnamed board on ten
simultaneous journals is the single strongest negative indicator a reviewer looks for.

---

#### F-14 — Policy text has two sources of truth, and the sync tool is missing from the repo

Every policy exists twice — portal TypeScript and the OJS database. The operations guide
references `tools/ojs-setup/export-journal-settings.mjs` and `apply-journal-content.php` to
reconcile them. **Neither file exists in this repository** and there is no `tools/` directory.

So the only automation bridging the two systems is unversioned and effectively lost. Policies
will drift, and drifting ethics statements are an audit failure during indexing review.

---

#### F-15 — No tests, no lint gate, no staging

Zero test files. `npm run lint` is defined but never invoked by CI. The deploy workflow builds
and ships without any quality gate. For a site that will eventually render scholarly metadata,
a broken render is a correctness problem, not a cosmetic one.

---

#### F-16 — The OJS theme is not under version control

The guide names a custom theme (`dmpedia`) providing NextGenIQ branding inside OJS. It appears
nowhere in this repository — it exists only as files on the server. An OJS upgrade or server
rebuild loses it with no recovery path.

---

#### F-17 — No monitoring; you will learn about outages from authors

No uptime checks, no error tracking, no log aggregation, no alerting on failed cron runs. OJS
depends on a scheduled task for review reminders and the email queue; if that cron silently
fails, reminders stop and nobody finds out until a reviewer deadline is missed.

---

### Medium

#### F-18 — Dead UI controls shipped to production

"Download PDF" is `href="#"` (`src/pages/ArticleDetailPage.tsx:68`) and the contact form's
submit button is `href="#"` (`src/pages/ContactPage.tsx:61`) — there is no form backend at
all. The contact page is the documented route for book proposals and proceedings enquiries,
so this silently drops business correspondence.

---

#### F-19 — Three high-severity dependency advisories

**Evidence** — `npm audit`

```
brace-expansion  high  quadratic-time expansion → CPU DoS
nanoid           high  infinite loop when size is zero
source-map-js    high  event-loop DoS via section offsets
```

All three are build-chain transitives rather than runtime code shipped to visitors, so
real-world exposure is low — but they are unpatched and there is no automated dependency
update process.

---

#### F-20 — Node version is off the supported matrix

The dev machine runs Node v23.6.1; Vite 8 requires `^20.19 || ^22.13 || >=24`, producing
`EBADENGINE`. Builds currently succeed, but v23 is a non-LTS release at end of life. CI uses
`lts/*`, so local and CI can diverge. No `.nvmrc` pins the version.

---

#### F-21 — No CSP, no HSTS

Baseline headers are present and correct (`X-Frame-Options`, `X-Content-Type-Options`,
`Referrer-Policy`), but neither Content-Security-Policy nor Strict-Transport-Security is set
on either host. `config.inc.php` correctly returns 403 — that part is right.

---

#### F-22 — Single 443 kB JavaScript bundle, no code splitting

All content for ten journals plus every policy page compiles into one chunk (443 kB raw,
119 kB gzipped) that every visitor downloads to read any single page. This scales linearly
with journal count — at thirty journals it becomes a genuine mobile problem. Prerendering
(F-01) largely resolves this as a side effect.

---

#### F-23 — Repository hygiene

`README.md` is still the stock Vite template — no setup, architecture, or deploy documentation
for a system someone else now inherits. Dead fields exist in the data model (`quickLinks` is
always `[]` for journals). No `.env` is provided, so a fresh clone silently points at
`http://localhost:8000` for every OJS link.

---

## 3. Target architecture

Items marked **(new)** do not exist today.

### Presentation

| Component | Status | Notes |
| --- | --- | --- |
| Portal (React) | exists | Keep. The content model is sound. |
| Static prerendering | **new** | Real HTML per route. Fixes crawlability at the root. |
| Head + schema layer | **new** | Per-page title, OG, `citation_*`, JSON-LD. |
| CDN + WAF | **new** | Caching, DDoS absorption, bot control. |

### Editorial core

| Component | Status | Notes |
| --- | --- | --- |
| OJS 3.5 | exists | System of record. Keep — it is the right choice. |
| MySQL | exists | Owned by OJS. Do not write to it yourself. |
| Transactional email | **new** | Dedicated sender with SPF/DKIM/DMARC. |
| Automated backup + restore drill | **new** | Nightly, offsite, tested. |

### Data plane between them

| Component | Status | Notes |
| --- | --- | --- |
| OAI-PMH harvester | **new** | Build-time job: OJS → generated data files. |
| Search index | **new** | Only once article volume justifies it. |
| Scheduled rebuild | **new** | Publish in OJS → portal refreshes itself. |

### Scholarly infrastructure (mostly not code)

| Component | Status | Notes |
| --- | --- | --- |
| ISSN per journal | **new** | National ISSN centre. Blocks everything downstream. |
| Crossref membership | **new** | DOI prefix + automated deposit. |
| Preservation network | **new** | PKP PN plugin. Free. |
| ORCID integration | **new** | Authenticated author identity. |
| Similarity screening | **new** | Plagiarism check before review. |
| Ethics membership (COPE) | **new** | Credibility signal for indexers. |

### Operations

| Component | Status | Notes |
| --- | --- | --- |
| Staging environment | **new** | Mirrors production. Nothing ships unverified. |
| CI/CD to production | **new** | Atomic release + instant rollback. |
| Uptime + error monitoring | **new** | Including cron-failure alerts. |
| Secret management | **new** | Credentials out of plaintext config. |

---

## 4. "What database should we use?"

**Today: none. Adding one now would make the system worse.**

The portal has no database and does not need one — its content is compile-time constants,
which is why it is fast and nearly unbreakable. Meanwhile OJS already owns a perfectly good
MySQL database holding every fact that matters.

Introducing a second database that duplicates article and issue data creates two systems that
disagree about what was published. In scholarly publishing, that is not a bug — it is a
correction notice.

Reach for a database only when a requirement genuinely cannot be served from OJS or from
build-time data. Realistically that means:

- cross-journal full-text search
- author profile pages aggregating work across journals
- usage analytics and metrics dashboards
- editorially-managed news that non-developers must publish without a deploy

When that day comes, the rule is **one source of truth, many read models**: PostgreSQL as a
derived projection fed from OJS, never written to directly by humans, always rebuildable from
scratch. If it is only search you need, a search engine alone is the better answer — and it is
not a database.

---

## 5. Recommended services

Costs are order-of-magnitude for ten low-volume journals and **must be confirmed against
current published rates** before you budget.

| Need | Recommendation | Why this one | Rough cost |
| --- | --- | --- | --- |
| **DOI registration** | Crossref | The default for journals; OJS has a first-party deposit plugin. DataCite only if you are data-led. | Annual fee + per-DOI |
| **ISSN** | National ISSN centre | Only legitimate issuer. One per journal, per format. | Free–low, one-off |
| **Preservation** | PKP Preservation Network | Free, built for OJS, satisfies DOAJ's requirement. CLOCKSS/Portico later. | Free |
| **Transactional email** | Amazon SES, or Postmark | SES is cheapest at volume; Postmark has the best deliverability and clearer diagnostics. Either beats shared hosting. | Low monthly |
| **CDN / WAF / DNS** | Cloudflare | Absorbs traffic spikes and bots in front of a single fragile VPS. Free tier is genuinely sufficient here. | Free to start |
| **Backups** | Backblaze B2 or AWS S3 | Offsite object storage with lifecycle retention and object lock. | Negligible |
| **Uptime monitoring** | UptimeRobot or Better Stack | Must watch OJS, the portal, *and* the OJS cron heartbeat. | Free–low |
| **Error tracking** | Sentry | Frontend and PHP in one place; free tier covers this scale. | Free tier |
| **Plagiarism screening** | Crossref Similarity Check | Bundles with Crossref membership; OJS plugin exists. | Per-document |
| **Author identity** | ORCID (public API) | Free tier is enough for login and profile linking. Member API only if you need write-back. | Free |
| **Search** *(later)* | Typesense or Meilisearch | Self-hostable, typo-tolerant, cheap. Defer until articles exist. | Low / self-host |
| **Ethics standing** | COPE membership | Directly strengthens DOAJ application and author trust. | Annual |

### One recommendation I'd push back on

**Do not move off OJS.** It is the correct platform — it is what serious open-access publishers
run, indexers already know how to harvest it, and replacing it with something custom would
take years and lose you every integration that already works. The gaps in this report are
*around* OJS, not in it.

---

## 6. Roadmap

Ordered by irreversibility, not by effort. Some of these get permanently more expensive once
the first article is published.

### Phase 0 — Stop the bleeding (before you publish anything) · days

- [ ] Fix the `localhost:8000` OAI identifier and OJS `base_url` — **F-02**
- [ ] Enable `force_ssl` so session cookies carry `Secure`; add HSTS — **F-11**
- [ ] Enable DKIM, then move SMTP to a real transactional provider — **F-07**
- [ ] Automated nightly offsite backups, and perform one full restore drill — **F-05**
- [ ] Remove the placeholder ISSN strings from public pages — **F-03**
- [ ] Real `robots.txt`, a sitemap, and a genuine 404 status — **F-08**
- [ ] Commit the OJS theme and recreate the missing sync scripts — **F-14, F-16**

**Gate:** a restore has actually been performed from backup, and a test email reaches an
external inbox's primary tab.

### Phase 1 — Become findable and credible · weeks

- [ ] Prerender all routes to real HTML — **F-01**
- [ ] Per-page titles, descriptions, Open Graph, and `citation_*` tags — **F-09**
- [ ] Register real ISSNs for all ten journals — **F-03**
- [ ] Join Crossref; configure the DOI plugin and deposit workflow — **F-04**
- [ ] Enable PKP Preservation Network — **F-10**
- [ ] Appoint and publish named editorial boards; remove `admin` as editor of record — **F-13**
- [ ] Staging environment plus automated deploy with rollback — **F-06**
- [ ] Uptime, error, and cron-failure monitoring — **F-17**

**Gate:** a published test article is retrievable in Google Scholar and resolves through its
DOI.

### Phase 2 — Connect the two systems · 1–2 months

- [ ] OAI-PMH harvester generating article and issue data at build time — **F-12**
- [ ] Scheduled rebuild so publishing in OJS updates the portal automatically
- [ ] Working contact form; remove dead controls — **F-18**
- [ ] Lint and test gates in CI; `.nvmrc`; automated dependency updates — **F-15**
- [ ] Cloudflare in front of both systems; add CSP — **F-21**
- [ ] Write the real README and an operations runbook — **F-23**

**Gate:** publishing an issue in OJS requires no developer involvement for it to appear on the
portal.

### Phase 3 — Earn the indexing · ongoing

- [ ] DOAJ application once each journal meets its publishing-history threshold
- [ ] ORCID login and author profile linking
- [ ] Similarity screening in the editorial workflow
- [ ] Cross-journal search once article volume justifies an index
- [ ] Usage metrics and author-facing dashboards
- [ ] Scopus / Web of Science evaluation — realistically several years of consistent
      publishing away

---

## 7. What I could not verify

- **Server configuration.** No SSH access, so `config.inc.php`, nginx vhosts, cron entries,
  and PHP version were inferred from HTTP responses and the operations guide. The
  `localhost:8000` and `Secure`-flag findings are confirmed from live responses; their exact
  remedies need the config file in hand.
- **Backup reality.** I verified no automation exists in the repository. Whether CloudPanel's
  own scheduled backups are enabled, and whether a restore has ever succeeded, I cannot see.
- **Crossref / ISSN status.** Nothing in the codebase or live responses indicates membership
  or registration. If either is already in progress, F-03 and F-04 downgrade accordingly.
- **OJS internal configuration.** Role setup, email templates, and workflow settings live in
  the database behind authentication. Statements about editor assignment come from the
  operations guide, not direct observation.
- **Pricing.** Every figure is order-of-magnitude. Confirm current published rates before
  committing budget.

---

*Audit performed 6 October 2026 against branch `update_frontend` (`61dea15`) and the live
installation at www.nextgeniqpress.com.*
