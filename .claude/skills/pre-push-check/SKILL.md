---
name: pre-push-check
description: Senior-developer review of a change to the NextGenIQ Press portal before it is pushed. Runs the automated safety checks, reviews the diff against how this system actually breaks, and reports findings as Critical / Major / Minor. Use before every push or PR, or when asked "is this safe to push?", "review my change", "can I deploy this?".
---

# Pre-push check

You are reviewing a change as the senior developer who owns this system. The
person asking may be new to it. Your job is to stop changes that break
production, explain why in plain words, and say exactly how to fix them.

**Merging to `main` deploys to production automatically.** There is no staging.
That is why this check exists.

## Step 1: Run the automated checks

```bash
node .claude/skills/pre-push-check/check.mjs
```

Use `--no-build` only if the person needs a quick check and will run the full
one before pushing. Use `--offline` when there is no network.

The script compares the branch (committed, uncommitted and untracked) with
`origin/main`. It runs `npm run verify`, the production build and the SSR
check. It also checks the critical rules below that can be checked
mechanically. Exit code 1 means at least one critical finding.

If it reports a critical finding, explain it and stop. Don't continue to a
"looks good".

## Step 2: Review the diff yourself

```bash
git fetch origin main
git diff $(git merge-base HEAD origin/main) --stat
git diff $(git merge-base HEAD origin/main)
```

Also include untracked files (`git status --short`). Read every changed file.
Judge each finding with the categories below. Read the background section of
this file first if you don't know the system.

## Step 3: Report

Use exactly this structure:

```
## Pre-push check: <branch>
Automated checks: pass / FAIL

### Critical (must fix before pushing) — N
1. <what> — <file:line>
   Why it breaks: <one sentence, in terms of what a user or the server experiences>
   Fix: <concrete steps>

### Major (fix before merging, or get the owner's OK) — N
...

### Minor (fix when convenient) — N
...

### Deploy notes (paste into the PR description)
- <every manual step the person who merges must do, or "None">

Verdict: DO NOT PUSH / OK TO PUSH after fixing majors / OK TO PUSH
```

Don't pad the report. If a category is empty, write "None". Don't invent
critical findings to look thorough. A critical finding is one that breaks
production or the original user flow.

---

## Critical: blocks the push

Only these. Each one has actually happened or would take down a real flow.

| # | Rule | What breaks if ignored |
| --- | --- | --- |
| C1 | `npm run verify`, `npm run build` and `node scripts/check-ssr.mjs` must pass. Never push to `main` directly; use a branch and a PR | CI fails, or the deploy fails mid-way, or broken code goes live immediately |
| C2 | A script that runs on the server (`scripts/harvest.ts`, `migrate.ts`, `env.ts`, `storage-check.ts`) must only import files that `scripts/deploy.sh` copies into the release. A new `../src/...` import needs a matching `cp` line in `deploy.sh` | Works on the laptop, crashes on the server. **Happened 2026-10-31:** the harvest failed every 15 minutes because `src/lib/ojs/contexts.ts` wasn't shipped |
| C3 | A journal or magazine must agree in **all** of these places: its `src/data/...` file (portal slug), `src/lib/ojs/contexts.ts` (OJS path, if different), the OJS path lists in `deploy/cloudpanel-vhost.conf`, `JOURNAL_SLUGS` in `scripts/harvest.ts`, and the real path in OJS. Changing a slug or OJS path in only some of them is critical | Readers get the old OJS screen, Submit links 404, or papers never reach the site. **Happened 2026-10-31** with the renames |
| C4 | If `deploy/cloudpanel-vhost.conf` changes, the PR must say it has to be pasted into CloudPanel at deploy time. The deploy never updates nginx | The repo says one thing and the live server does another. **Happened 2026-10-31:** the vhost was committed but not pasted |
| C5 | Never edit, rename or delete an existing file in `migrations/`. New migrations must not drop, rename or delete anything without the owner's sign-off | Migrations run before the new code goes live and are never rolled back. The running release, and any rollback, still uses the old schema, so the site errors |
| C6 | No secrets in the repo: no `.env` files, API keys, passwords or private keys. Server secrets never get a `NEXT_PUBLIC_` name. `NEXT_PUBLIC_OJS_PATH` stays `/ojs` (relative) | Secrets leak to GitHub or into every visitor's browser. An absolute OJS path silently breaks shared sign-in |
| C7 | The portal never writes to the OJS database, and never stores passwords or accounts itself. Everything goes through the OJS REST API, OAI or its web forms (`src/lib/auth/*`) | Corrupts OJS, or creates a second account system that drifts from OJS |
| C8 | Every route under `src/app/api/admin/` calls `requireAdminApi(...)`, with `{ mutating: true }` on POST, PATCH and DELETE. Member-only routes call `requireMember()` | Anyone on the internet can change or read admin data |
| C9 | Public pages (`/`, articles, journals, magazines, series, policies, news) stay server-rendered. A `page.tsx` must not start with `'use client'`, and must not fetch its main content in the browser | Google Scholar stops indexing the papers, which is the reason this site exists |
| C10 | Sign-in, register and hand-off code (`src/lib/auth/ojs-*.ts`, `src/app/api/auth/*`): don't change the order of cookie calls, the OJS URLs, or the HTML parsing unless the matching tests are updated and pass. Run `npm run spike` against OJS if the parsing changed | Nobody can sign in or register, and it isn't visible until a user complains |

## Major: fix before merging, or get the owner's OK

These don't take the site down, but they cause silent failures, wrong
content or extra work for whoever deploys.

- **New environment variable** without an entry in `.env.example` and a note
  to add it to `~/portal/.env` on the server. A `NEXT_PUBLIC_*` variable also
  needs `deploy/build-env.production`.
- **`deploy/harvest.sh` changed** without a deploy note:
  `cp ~/portal/current/deploy/harvest.sh ~/portal/harvest.sh`. Cron runs that
  copy, not the file in the repo.
- **A slug or URL removed or renamed without a redirect** in `next.config.ts`.
  Shared and indexed links 404.
- **A new title missing part of the checklist** in `docs/DEVELOPMENT.md` ("Add
  a journal"): `subjects.ts`, cover and tile images, `scripts/templates/build.ts`
  plus `npm run templates`, or the `next.config.ts` regexes.
- **`public/templates/` edited by hand.** These files are generated; change
  `scripts/templates/` and run `npm run templates`.
- **An admin mutation without `recordAudit(...)`**, or a publicly visible change
  without `purgePublicContent()` afterwards.
- **A build-time database or OJS read that can throw.** `next build` runs with
  no database, so such reads must return `[]` or `null` on failure.
- **Invented facts in content**: ISSNs, indexing claims, editor names, dates.
  An ISSN goes into `src/data/issn.ts` only once it has actually been assigned.
- **A dead control**: a button or link with nothing behind it.
- **Pure logic in `src/lib/` changed without a test** (`*.test.ts` beside it,
  using `node:test`).
- **An ops-affecting change without updating `docs/OPERATIONS.md`** or the
  relevant doc.
- **`ojs/` theme changed** without a deploy note. It is installed into OJS by
  hand.

## Minor: fix when convenient

- Colours written as hex instead of `var(--token, #fallback)`; styling that
  doesn't follow `docs/REPLICATION.md`.
- Naming, comments or formatting that don't match the surrounding code.
- Duplicated constants that already exist (for example `editorialEmail`,
  `siteUrl`).
- Typos in user-facing text, or inconsistent title or brand wording.
- Unused imports, variables or files.
- Missing `alt` text or a heading-order slip on a non-critical page.

---

## Background: how this system works and breaks

- **Two programs, one domain.** The portal (this repo, Next.js) is at `/`;
  OJS 3.5 (PHP) is at `/ojs`. OJS owns users, manuscripts, review and
  published articles. The portal shows them and owns book volumes, editorial
  forms and the admin panel.
- **Shared sign-in.** OJS has no login API. The portal fills in OJS's login
  form on the server and gives the browser the OJS cookie. That only works
  because both are on the same domain, so `/ojs` must stay relative.
- **Publishing.** A cron job on the server runs `deploy/harvest.sh`, which
  runs `scripts/harvest.ts`, every 15 minutes. It reads OJS over OAI and REST,
  writes `harvest.json`, and the site re-reads it. No deploy is needed to
  publish a paper.
- **Portal slugs vs OJS paths.** Portal URLs keep the original slugs
  (`/journals/ijic`). OJS uses the new codes (`TICR`).
  `src/lib/ojs/contexts.ts` maps between them: use `ojsContext(slug)` to build
  OJS URLs, and `portalSlug(path)` to read them back.
- **nginx** (`deploy/cloudpanel-vhost.conf`, pasted by hand into CloudPanel)
  sends public OJS pages to the portal. It lists journal paths explicitly, so
  a path missing from it falls through to the old OJS screen.
- **Deploying.** A merge to `main` runs GitHub Actions, then
  `scripts/deploy.sh`. That script builds, uploads a new release folder, runs
  migrations, switches `current`, restarts PM2, checks `/api/health`, and
  rolls back automatically if the check fails. Migrations are not rolled
  back. nginx, the cron copy of `harvest.sh`, the server `.env` and OJS itself
  are never changed by a deploy.
- **Database.** MySQL database `portal`, a separate database from OJS.
  Numbered files in `migrations/`, applied in order, recorded in
  `schema_migrations`.
- **Files.** Form uploads and book PDFs go to Cloudflare R2. OJS manuscripts
  stay on OJS's disk.

Further reading: `docs/ARCHITECTURE.md`, `docs/DEVELOPMENT.md`,
`docs/OPERATIONS.md`, `docs/KNOWN-ISSUES.md`.

## Safe push workflow

1. Work on a branch: `git switch -c short-description`.
2. Make the change and run this check until there are no critical findings.
3. `git push -u origin short-description`, then open a PR into `main`. Put the
   deploy notes in the description.
4. Wait for CI to be green, and get the owner's review for anything touching
   C2–C10 areas.
5. After merging, watch the "Deploy portal" run in GitHub Actions until it
   finishes.
6. Do the manual deploy notes (paste the vhost, copy `harvest.sh`, add env vars,
   change OJS).
7. Check `https://www.nextgeniqpress.com/api/health`: it should show
   `"status":"ok"`. Then click through the flow you changed on the live site.
