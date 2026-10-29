# Development guide

## 1. Local setup

### Minimum: no services

```bash
nvm use                  # Node 22.13.0 (.nvmrc). package.json requires >= 22.13
npm ci
cp .env.example .env.local
npm run harvest          # with no OJS_BASE_URL this writes an empty content/harvest.json
npm run dev
```

Every public page renders. Article lists are empty and forms answer
"unavailable". The scripts run TypeScript through
`node --experimental-strip-types`, so an `ExperimentalWarning` in the output is
expected.

### Adding services one at a time

Each service is optional. Set its variables in `.env.local`; `.env.example`
documents every one of them.

| You want to work on | Add |
| --- | --- |
| Forms, admin panel, sessions, book volumes | MySQL (below) and `PORTAL_DATABASE_URL` |
| File uploads in forms or admin | R2 credentials `S3_*`. Ask for a dev token, then run `npm run storage:check` |
| Real articles, sign-in | `OJS_BASE_URL` (+ `OJS_API_KEY`), `PORTAL_NATIVE_SIGNIN=1`, an absolute `NEXT_PUBLIC_OJS_PATH`. See [LOCAL-DEV.md](LOCAL-DEV.md) |
| Email | `SMTP_*`. Without it, sends are logged and skipped |
| Captcha | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY` (set both or neither) |

**MySQL in Docker:**

```bash
docker run -d --name ngiq-mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpw -e MYSQL_DATABASE=portal \
  -e MYSQL_USER=portal -e MYSQL_PASSWORD=portalpw mysql:8
# wait about 20 s, then:
echo 'PORTAL_DATABASE_URL=mysql://portal:portalpw@127.0.0.1:3306/portal' >> .env.local
npm run db:migrate
```

**Getting into `/admin` locally:** you need a portal session whose roles include
`site-admin`. That means signing in through a real OJS as a site administrator,
with `OJS_BASE_URL` set and `PORTAL_NATIVE_SIGNIN=1`. There is no local admin
bypass, by design.

### Environment files

- **`.env.local`:** read by `next dev`, and by the scripts through
  `scripts/env.ts`. Gitignored.
- **`deploy/build-env.production`:** committed, non-secret build-time
  `NEXT_PUBLIC_*` values for production builds.
- **Production runtime secrets:** they live only on the server, in
  `~/portal/.env`. See [OPERATIONS.md](OPERATIONS.md#4-environment-variables).
- **`NEXT_PUBLIC_*` values are inlined at build time.** Changing one in
  production needs a rebuild, not just a restart.

## 2. Day-to-day workflow

```bash
git checkout -b feature/my-change        # never commit straight to main
# … work …
npm run verify                           # typecheck + lint + tests (what CI runs)
npm run build && node scripts/check-ssr.mjs   # if you touched routes or rendering
git push -u origin feature/my-change     # open a PR into main
```

- **CI** (`.github/workflows/ci.yml`) runs on PRs into `main` and on pushes to
  `main` and `frontend-redesign`. It runs verify, harvest, build, the SSR check,
  and `npm audit --omit=dev --audit-level=high`.
- **Merging into `main` deploys to production**
  (`.github/workflows/deploy.yml`). The workflow tags the next patch version
  automatically.
- **Tests:** they use `node:test`, with no test runner dependency. Put a test
  next to the code as `src/lib/**/name.test.ts`. Tests cover pure logic:
  validation, citation, search, auth parsers, upload policy and harvest cache.
  Route handlers and components have no tests.

### Next.js 16 note

This repo uses Next 16. Its APIs and conventions differ from older versions; for
example `params` and `searchParams` are Promises. Before using an API you are
unsure of, read the guides in `node_modules/next/dist/docs/`. `AGENTS.md`
contains the same warning for AI assistants, and `next dev` re-adds that block,
so leave it in place.

## 3. Code conventions

- **Page markup:** follow [REPLICATION.md](REPLICATION.md), which is binding.
  - Pages are a thin server `page.tsx` plus a client component in
    `src/components/mockup/`.
  - Styles are inline `style={{}}`, with colours only as `var(--token, #fallback)`.
  - The tokens are in `src/app/globals.css` (the "Ink and teal" palette). There is
    no theme picker and no dark mode.
- **No dead controls.** Never ship a button with nothing behind it.
- **Public pages must stay server-rendered.** Don't make an article, journal or
  series page client-only.
- **Fail soft.** Database, OJS, storage and email helpers return empty values or
  explained 503s; they don't throw at the user. Build-time reads must work with
  no database.
- **API routes:** wrap handlers in `handler()` from `src/lib/api.ts`. It maps
  `ValidationError` → 422, rate limits → 429, missing services → 503.
  - Validate input with `Validator` (`src/lib/validate.ts`).
  - Gate with `requireMember()` or `requireAdminApi()`.
  - Call `recordAudit()` on every admin mutation, and `purgePublicContent()`
    after any change that is visible to the public.
- **SQL:** parameterised `query()` only. For a schema change, add a new numbered
  file to `migrations/` and never edit an applied one.
- **Data and dates:** see [PORTING-CONVENTIONS.md](PORTING-CONVENTIONS.md). Ignore
  its parts about demo fixtures, which were removed.
- **Never invent facts in content files.** ISSNs, indexing claims, editor names
  and dates must be real. See audit F-03 in
  [PLATFORM-AUDIT.md](PLATFORM-AUDIT.md).

## 4. How to…

### Change text on a journal or series page

Edit the page's `blocks` in `src/data/journals/<slug>.ts` or
`src/data/series/<slug>.ts`. The page ids are fixed:

- **Journals:** `aims-scope`, `editorial-board`, `author-guidelines`,
  `peer-review-ethics`, `open-access-fees`, `special-issue-guidelines`,
  `contact`.
- **Series:** the journal set, minus `author-guidelines` and
  `special-issue-guidelines`, plus `propose-volume`, `author-editor-guidelines`,
  `indexing-abstracting` and `volumes`.

The helpers in `src/data/pages.ts` build blocks, tables and facts.

### Add a journal

1. Copy `src/data/journals/ijdm.ts` to `<slug>.ts` and fill in the slug, title,
   code (`shortTitle`), intro, topics, editors, profile and the seven pages. Use
   `journalTemplates(slug, CODE)` on the author-guidelines page.
2. Import it and add it to `journals` in `src/data/registry.ts`.
3. Add `<slug>: '<subjectKey>'` to `journalSubjectKey` in `src/data/subjects.ts`.
4. Add `public/images/journals/cover-<slug>.jpg` (987×392) and `tile-<slug>.jpg`
   (3:4).
5. Add it to the `publications` list in `scripts/templates/build.ts`, then run
   `npm run templates` and commit `public/templates/<slug>/`.
6. In `next.config.ts`, add the slug to the `(ijic|ijdm)` regexes for renamed
   pages.
7. Ops side:
   - Create the journal in OJS with **the same path** as the slug.
   - Add the slug to `JOURNAL_SLUGS` in `scripts/harvest.ts`.
   - Add it to the journal lists in `deploy/cloudpanel-vhost.conf`, then re-paste
     the vhost into CloudPanel.
8. Once an ISSN is assigned, add it to `journalIssn` in `src/data/issn.ts`.

### Add a book series

1. Copy `src/data/series/lnmr.ts` to `<slug>.ts`. Keep all nine page ids:
   `volumes` and `propose-volume` are special-cased.
2. Add it to `series` in `src/data/registry.ts`.
3. Add the cover and tile images under `public/images/series/`.
4. Add it to `scripts/templates/build.ts`, then run `npm run templates`.
5. Volumes and chapters are created in **Admin → Book volumes**, with no code
   needed.

### Remove or rename a title

Remove it from the registry, then add a 308 redirect in `next.config.ts`. See
`removedJournals` and `removedSeries` there for how the October 2026 removals
were done.

### Add a policy page

Add an object to `policies` in `src/data/policies.ts`: `slug`, `title`, `group`
(one of `policyGroups`), `summary`, `updatedIso` and `blocks`. The listing, the
detail page and the sitemap pick it up automatically.

### Add a news item

Prepend a `NewsItem` (`slug`, `dateIso`, `type`, `title`, `body[]`, optional
`journalSlug`) to `src/data/content/news.ts`.

### Publish an article

**Not a code task.** It is published in OJS, and the cron harvest brings it to
the portal within about 15 minutes. To keep a paper off the portal, use Admin →
Published papers → Hide. If it doesn't appear:

1. Check `/api/health`: the harvest time and article count.
2. Check `~/portal/harvest.log` on the server.
3. Check that the paper's journal is in the registry. Papers from journals
   outside the portfolio are filtered out on purpose.

### Publish a book volume

Admin → Book volumes → New volume. Fill in the metadata, upload the PDF and
cover, add chapters, then set a publication date. To collect chapters before
publication, open a call for chapters.

### Change the manuscript templates

Edit `scripts/templates/build.ts` (for example the `cite` style per publication)
or the files in `scripts/templates/latex/`. Then run `npm run templates`. It
needs `zip`, and optionally `pdflatex` for the sample PDFs. **Never hand-edit
`public/templates/`.** The download links are in `src/data/templates.ts`, and the
filenames there must match.

### Add a form field or a new form

- **Server side:** `src/lib/forms/server.ts` (helpers),
  `src/app/api/forms/<form>/route.ts` (validation and storage), and
  `src/lib/uploads/policy.ts` for new upload purposes and their limits.
- **Client side:** `src/components/forms/` (`FormKit.tsx` holds the field
  primitives).
- **Admin:** list it in `src/lib/forms/admin.ts` so it shows in Admin → Editorial
  forms.
- **Schema:** add a migration if new columns are needed.

### Add a database table or column

Create `migrations/00N_description.sql` with one statement per `;` line. Run
`npm run db:migrate` locally. In production it applies on the next deploy,
before the new release goes live.

### Upgrade OJS

The sign-in and registration relays parse OJS HTML. After any OJS upgrade:

1. Run `npm test`.
2. Run `npm run spike` against the upgraded OJS.
3. Sign in and register manually on the live site.

Also check that reCAPTCHA is still off and `require_validation` is still off in
`config.inc.php`.

## 5. Where to find things

| Looking for | Go to |
| --- | --- |
| Lineup, menus | `src/data/registry.ts` |
| Publisher-wide text (home, about, audiences) | `src/data/publisher.ts` |
| Site URL, emails, DOI prefix | `src/lib/site.ts` |
| Colour tokens | `src/app/globals.css` |
| Header and footer | `src/components/mockup/Header.tsx`, `Footer.tsx` |
| Redirects and security headers | `next.config.ts` |
| OJS URL builders | `src/lib/ojs/config.ts` |
| Sessions and roles | `src/lib/auth/` |
| Admin guard and audit | `src/lib/admin/` |
| R2 / S3 | `src/lib/storage.ts`, `src/lib/uploads/` |
| Email | `src/lib/email.ts` |
| Scholar meta and JSON-LD | `src/lib/citation-meta.ts`, `src/lib/jsonld.ts`, `src/lib/books/meta.ts` |
| OJS theme (header and footer inside OJS) | `ojs/theme-dmpedia/`, installed by hand into OJS `plugins/themes/` |
