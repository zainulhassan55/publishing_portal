# Architecture

## 1. The big picture

```
                         www.nextgeniqpress.com  (one VPS, CloudPanel)
                                     │
                              nginx :443 (TLS)
                 ┌───────────────────┼───────────────────────────┐
                 │ /                 │ /ojs/index.php/…           │ other /ojs/…
                 ▼                   ▼                            ▼
       Next.js portal          nginx :8080 → PHP-FPM        Varnish → nginx :8080
       127.0.0.1:3000          (OJS 3.5, bypasses Varnish    (static OJS assets)
       (PM2: ngiq-portal)       so OJSSID cookies survive)
          │   │   │                    │
          │   │   └── REST /api/v1, OAI-PMH, web login ──┘
          │   │
          │   └── MySQL database `portal`  (OJS has its own `ojs` DB on the same server)
          │
          └── Cloudflare R2: ngiq-submissions (form uploads), ngiq-publications (book PDFs/covers)
```

Some public OJS pages are redirected to the portal by nginx
(`deploy/cloudpanel-vhost.conf`):

- An OJS article page goes to `/go/article/{journal}/{id}`, and an issue page to
  `/go/issue/{journal}/{id}`. These resolvers send the reader to the portal page
  when the portal knows the paper. Otherwise they send the reader back to OJS
  with `?portal=0`, which nginx's loop guard lets through.
- OJS journal home, about and login pages redirect to the matching portal pages.
- The editorial workflow, `/article/download`, `/oai` and `/api/v1` are not
  redirected.

## 2. What owns what

| OJS owns (system of record) | The portal owns |
| --- | --- |
| User accounts, passwords, roles | Portal sessions (which point at OJS sessions) |
| Submissions, review, decisions, galleys | Editorial forms: reviewer/board applications, special issues, book proposals, chapter submissions |
| Issues and published articles | Book volumes and chapters (OJS has no books) |
| Crossref DOI deposits for articles, OAI-PMH | The "hide this paper on the portal" flag |
| Review and submission email | Portal email: acknowledgements, alerts, contact relay |
| | Presentation, SEO, Scholar meta tags, search, policies, publisher text |

Two hard rules:

1. **The portal never touches the OJS database.** It talks to OJS only through
   REST, OAI-PMH, and OJS's own web forms.
2. **The portal never becomes a second account store.** Its rows refer to people
   by `ojs_user_id`.

## 3. Content: where each thing comes from

| Content | Source | Changed by |
| --- | --- | --- |
| Journal and series pages (aims, board, guidelines, fees, …) | `src/data/journals/*.ts`, `src/data/series/*.ts` | Editing code, then a deploy |
| Policies, news, publisher pages (`/about`, `/reviewers`, …) | `src/data/policies.ts`, `src/data/content/news.ts`, `src/data/publisher.ts` | Editing code, then a deploy |
| Articles and issues | OJS, via the **harvest snapshot** | Publishing in OJS; the next harvest picks it up |
| Visibility of an article on the portal | `article_display` table | Admin → Published papers |
| Book volumes, chapters, calls for chapters | `book_volumes` / `book_chapters` tables plus R2 | Admin → Book volumes |
| Calls for papers (journals) | Generated "standing calls" (`src/data/content/cfps.ts`) | Code (there is no CFP admin yet) |

`src/data/registry.ts` is the centre of the content layer. Its `journals` and
`series` arrays drive static params, menus, the sitemap, the search index, form
dropdowns, API validation and the admin journal list. The journal and series
shapes are in `src/types/content.ts` and `src/types/publishing.ts`.
`src/lib/publication.ts` gives both kinds one common shape for the shared page
components.

### The harvest: from OJS to the portal

```
OJS ──OAI-PMH ListIdentifiers──►  pass 1: count records per journal (no credentials)
    ──REST /issues, /submissions?status=3, /publications/{id}──►  pass 2: full detail (Bearer OJS_API_KEY)
                                        │
                                        ▼
               harvest.json  (atomic write: tmp file, then rename)
               local dev: content/harvest.json   production: ~/portal/shared/harvest.json (HARVEST_PATH)
                                        │
            readHarvest()  src/lib/ojs/harvest-cache.ts  (re-parses when the file's mtime or size changes)
                                        │
            getArticles()  src/data/content/index.ts  ── drops journals outside the portfolio
                                        │                 ── drops papers hidden in article_display
                                        ▼
                    article, journal, issue, home, search and sitemap pages
```

- **Script:** `scripts/harvest.ts`. In production, cron runs
  `deploy/harvest.sh` every 15 minutes. It holds a `flock` so runs never overlap,
  and then calls `POST /api/revalidate`.
- **Safety:** the harvest **refuses to write** a snapshot that looks worse than
  the current one. That happens if OAI is down while a snapshot already exists,
  or if REST returns fewer papers than OAI reports. The site therefore never
  empties itself because OJS had a bad minute.
- **Cache refresh:** `purgePublicContent()` in `src/lib/articles/purge.ts` resets
  the harvest, display and books caches and runs `revalidatePath('/', 'layout')`.
  As a fallback, pages also carry `revalidate = 3600`.
- **PDFs:** `/articles/[slug]/pdf` streams the OJS galley through the portal's
  own origin, which Google Scholar requires for `citation_pdf_url`. Book files
  stream from the private R2 bucket through the routes under
  `/series/[slug]/volumes/[volume]/…`.

## 4. Sign-in and sessions

OJS 3.5 has no login API: no OAuth, and no `users/me`. The portal therefore
**drives OJS's own login form on the server** and then shares the resulting OJS
session with the browser. That is why OJS must stay on the same origin.

```
browser ──POST /api/auth/sign-in──► portal
   portal ── GET  /ojs/index.php/index/login         (scrape csrfToken + anonymous OJSSID)
   portal ── POST /ojs/index.php/index/login/signIn  (302 + rotated OJSSID = success)
   portal ── GET  /ojs/index.php/index/user/profile  (parse embedded currentUser JSON: id, name, roles)
   portal ── INSERT portal_sessions (sha256(token), ojs_sid, roles, …)
browser ◄── Set-Cookie: ngiq_session (httpOnly, 7 days) + OJSSID on /ojs/
```

- **Code:** `src/lib/auth/ojs-login.ts` (the relay), `portal-session.ts` and
  `session.ts` (the session store), `ojs-cookie.ts` (cookie attributes and
  eviction; the order of these calls matters).
- **User-Agent:** the browser's User-Agent is relayed on every call, because OJS
  ties sessions to it.
- **Mode switch:** `PORTAL_NATIVE_SIGNIN=1` turns the relay on, and production
  builds use 1. With `0`, the sign-in page links out to the OJS login instead.
- **Registration:** `src/lib/auth/ojs-register.ts` scrapes and posts the OJS
  register form. It depends on two OJS settings: reCAPTCHA off and
  `require_validation` off.
- **Re-validation:** after 15 minutes `getSession()` re-checks against the OJS
  profile page and refreshes the roles. If OJS has dropped the session, the
  portal session is deleted.
- **Hand-off:** `/api/auth/ojs-handoff?to=` re-checks the session, verifies the
  user holds the role the target OJS page needs (`ojs-access.ts`), sets
  `OJSSID`, and redirects into OJS.
- **Roles:** OJS role ids are mapped in `src/lib/auth/roles.ts`. They are held as
  **one flat list for the whole site**, not per journal.
- **Admin:** only the OJS `site-admin` role (id 1) can use `/admin`. Non-admins
  get a 404. Admin mutations also need a CSRF header (`src/lib/auth/csrf.ts`)
  and a same-origin `Origin`.
- **Captcha:** Cloudflare Turnstile protects sign-in and register
  (`src/lib/captcha.ts`). It fails closed when it is configured.

> **Fragility:** the relay parses OJS HTML. An OJS upgrade can break sign-in or
> registration. The unit tests in `src/lib/auth/*.test.ts` and `npm run spike`
> against a live OJS are the guard. Run both after any OJS upgrade.

## 5. Editorial forms and uploads

1. The member opens a form page, such as `/reviewers/form`. Every form requires
   sign-in.
2. Each file is signed: `POST /api/uploads/sign` checks the type and size,
   inserts a `pending` row in `uploads`, and returns a presigned PUT URL. The
   browser uploads straight to R2 at `pending/<id>/<name>`.
3. On submit, the form API runs `verifyUploads()`. It checks that the object
   exists (HEAD), that the size matches, and that the magic bytes match the type.
   `attachUploads()` then copies the object to its final key, marks the row
   `attached` with its owner, and deletes the pending copy.
4. The row is stored with a reference number like `NGIQ-ED-00012`, and the API
   emails the sender and `EDITORIAL_INBOX`. Email is best effort; the data is
   stored first.
5. The admin sees it in Admin → Editorial forms. Downloads are 5-minute presigned
   links, and each one is written to the audit log.

The code is in `src/lib/uploads/` (`policy.ts` holds the size and type limits),
`src/lib/storage.ts` (S3 API over `aws4fetch`) and `src/lib/forms/server.ts`. A
1-day lifecycle rule on `pending/` in R2 cleans up abandoned uploads. Journal
manuscripts never come through the portal; they go into OJS.

## 6. Book volumes

The model is in `src/lib/books/` and `migrations/006_book_volumes.sql`:

- **Draft:** no `published_at`.
- **Scheduled:** `published_at` is in the future.
- **Published:** `published_at` ≤ today and not hidden.
- **Hidden:** overrides everything.
- **Call for chapters:** independent of publication. `cfp_open` plus a deadline
  (or no deadline) opens `/series/…/volumes/…/submit-chapter`.

A volume can't be published without a PDF unless it is hidden. Public reads
never throw: during `next build` and on database errors they return the last
good result or `[]`. Volume pages emit `citation_*` tags and a schema.org `Book`
with its chapters.

## 7. Database

The database is MySQL, in a dedicated database named `portal` on the same
instance as OJS. Access uses `mysql2`, parameterised queries and no ORM
(`src/lib/db/index.ts`).

| Migration | Tables | Purpose |
| --- | --- | --- |
| `001_initial` | `journal_proposals`, `alert_signups`, `contact_messages`, `submission_drafts` (unused), `user_prefs`, `schema_migrations` | Proposals, alerts (double opt-in), contact, prefs, migration ledger |
| `002_portal_sessions` | `portal_sessions` | Session store, keyed by the SHA-256 of the cookie token |
| `003_admin_audit` | `admin_audit`, and adds decision columns to `journal_proposals` | Who did what in the admin panel |
| `004_article_display` | `article_display` | Hide-from-portal flag; no row means shown |
| `005_editorial_forms` | `uploads`, `editorial_applications`, `editorial_proposals`, `book_submissions` | Forms and the R2 object ledger |
| `006_book_volumes` | `book_volumes`, `book_chapters` | Published books; chapters cascade-delete with their volume |

How migrations run (`scripts/migrate.ts`):

- Files are applied in filename order and recorded in `schema_migrations`.
- Each file is split on a `;` at the end of a line. Keep one statement per
  `;`-terminated block, and don't use stored procedures.
- Files are **not run in a transaction**. Write migrations that are safe to
  re-run, or fix a partial failure by hand.
- They run automatically on every deploy, **before** the new release goes live.

## 8. Rendering and SEO

- **Rendering:** public pages are statically generated with ISR (`revalidate =
  3600`). Admin, form and auth-gated pages are dynamic. The build happens with
  **no database**, so every build-time database read must degrade to an empty
  result.
- **Scholar meta:** article pages emit Highwire `citation_*` tags and Dublin Core
  tags (`src/lib/citation-meta.ts`), plus ScholarlyArticle and Breadcrumb JSON-LD
  (`src/lib/jsonld.ts`).
- **Citations:** they are prebuilt in 10 formats on the server
  (`src/lib/citation.ts`).
- **Search:** fully client-side. `buildSearchIndex()` ships the index, and
  `src/lib/search-core.ts` holds the pure ranking and facet logic, which is unit
  tested. The header typeahead uses a smaller title-only index.
- **Sitemap and robots:** `src/app/sitemap.ts` and `robots.ts`, both derived from
  the registry, the harvest and the database.
- **Security headers:** set in `next.config.ts`. It also holds the 308 redirects
  for removed titles and renamed pages.
