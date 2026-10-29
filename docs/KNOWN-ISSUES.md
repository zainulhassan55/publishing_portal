# Known issues and technical debt

Collected while preparing the handover on 2026-10-30. Each item names the file
involved, so a fix can start there. None of these is a current outage.

## High priority

| # | Issue | Where | Fix |
| --- | --- | --- | --- |
| H1 | **The client IP can be spoofed.** `clientIp()` takes the *first* `X-Forwarded-For` entry. nginx uses `$proxy_add_x_forwarded_for`, which appends to whatever the client sent. Any client can therefore choose its "IP", which defeats every rate limit and corrupts `admin_audit.source_ip` | `src/lib/api.ts:125` | Prefer `X-Real-IP` (nginx sets it to `$remote_addr`), or take the last entry of `X-Forwarded-For` |
| H2 | **Backups don't run.** `backup.sh` expects root, `/var/log`, `/etc/ngiq/portal.env` and a copy of itself in `releases/` (`deploy.sh` doesn't ship it). It never backs up `~/portal/.env` | `scripts/backup.sh`, `scripts/deploy.sh` | Adapt it to the home-directory layout, ship it or install it next to `harvest.sh`, schedule it in CloudPanel, and do a test restore. See [OPERATIONS.md §8](OPERATIONS.md#8-backups) |
| H3 | **Expired sessions are never purged.** `purgeExpired()` is never called. Each row holds a live OJS session id | `src/lib/auth/portal-session.ts` | Call it from `harvest.sh`, or add a small cron script |
| H4 | **Register can fail with a 500 after the OJS account already exists.** If MySQL is down, `createSession` throws without a catch | `src/app/api/auth/register/route.ts` | Wrap it in try/catch and tell the user to sign in |

## Security and robustness

- **No CSRF token outside the admin panel.** Member POST routes (forms,
  contact, prefs, uploads, alerts) and sign-out rely only on `SameSite=Lax`. That
  is acceptable, but if you want defence in depth, add the admin `Origin` check
  to them too.
- **Admin rights can outlive revocation.** Admin checks use roles cached for up
  to 15 minutes (`REVALIDATE_AFTER_SECONDS`), so a revoked admin keeps access
  for that long. `requireAdminApi` could force a re-check on mutations.
- **Roles are site-wide, not per journal** (`src/lib/auth/roles.ts`). This is
  fine today: only site-admin gates anything, and OJS re-checks each journal.
- **The rate limiter is in-memory.** It works for one process and resets on
  restart. That is fine for the single PM2 process, but it will need Redis or
  MySQL if the app ever scales out.
- **`/api/health` returns raw database error text** in
  `dependencies.database.reason`. Replace it with a generic message.
- **Pending uploads aren't tied to the uploader.** The `uploads` table has no
  uploader column, so a pending upload UUID works as a bearer reference. The
  risk is low because UUIDs are random, but recording `ojs_user_id` would close
  it.
- **The PDF relay has no fetch timeout.** In `src/app/articles/[slug]/pdf/route.ts`,
  a hung OJS holds the request open. Add an `AbortSignal.timeout`.
- **Register sets `OJSSID` the old way.** It uses `response.cookies.set(...)`
  where sign-in and hand-off use `setOjsSessionCookie`, so stale cookie copies
  aren't evicted (`src/app/api/auth/register/route.ts`).
- **A misleading comment.** The header comment of the sign-in route says the
  OJS session id "never reaches the browser". It does, on purpose, when OJS is
  on the same origin.
- **nodemailer has a moderate advisory.** It is mitigated by strict email
  validation. Upgrade when a fixed release is available.

## Functional gaps

- **No staging environment.** `deploy/build-env.staging` is missing, and the
  `workflow_dispatch` staging option fails.
- **Harvest pagination stops at `count=100`** per journal. A journal with more
  than 100 issues or papers will fail the completeness check and block
  harvests. Add paging in `scripts/harvest.ts`.
- **Every article is labelled "Research Article"** by the harvest, and slugs come
  from titles, so two identical titles would collide.
- **The journal list is hard-coded in several places and must be kept in step:**
  - `src/data/registry.ts`
  - `scripts/harvest.ts` `JOURNAL_SLUGS` (still lists all 10 old journals)
  - `scripts/ojs-spike.ts` `ALL_CONTEXTS`
  - the `deploy/cloudpanel-vhost.conf` journal lists (still 10)
  - the `next.config.ts` regexes
  - `scripts/templates/build.ts`
  - `src/data/subjects.ts`
- **`editorialEmail` is defined twice**, in `src/data/pages.ts` and
  `src/lib/site.ts`.
- **Not built:**
  - an alert unsubscribe endpoint (the token exists);
  - emailing a proposer when an admin decides (the UI text implies it does);
  - admin phases 2, 5 and 6;
  - Crossref deposits for book DOIs;
  - citation export for book volumes;
  - JSON-LD on series home pages.
- **Unused code:**
  - the `submission_drafts` table;
  - `destroyUserSessions()`;
  - `faqJsonLd`;
  - the audit action types `journal.visibility_changed` and
    `cfp.status_changed`.
- **No tests for route handlers or components.** Only `src/lib` pure logic is
  tested.

## Operations

- **`deploy.sh` hard-codes port 3000** for the health gate and revalidate call.
  `harvest.sh` honours `$PORT`.
- **The CI build differs from the deploy build.** CI doesn't use
  `build-env.production`, so the Turnstile and OJS-path assertions only run at
  deploy time.
- **`PORTAL_NATIVE_SIGNIN` is set inconsistently.** It is `1` in `deploy.yml`,
  `0` in `.env.example` and the docs, and absent from `build-env.production`.
  Adding `PORTAL_NATIVE_SIGNIN=1` to `build-env.production` would make laptop
  deploys match CI.
- **`deploy/ngiq-portal.service`** (systemd) is unused on this server. It is kept
  for a host with root, and its comment about `content/harvest.json` is out of
  date.
- **The vhost header comment is stale.** It still says "This was
  `{{varnish_proxy_pass}}`".

## Stale documentation

The older docs predate the October 2026 restructure and the move to PM2. Rely on
the new docs (HANDOVER, ARCHITECTURE, DEVELOPMENT, API, OPERATIONS) and the code.
Known discrepancies:

| Doc | What's out of date |
| --- | --- |
| RUNBOOK.md | Describes systemd, `/etc/ngiq/portal.env` and `sudo systemctl` rollback (production uses PM2 and `~/portal/.env`). "Publishing an article needs a redeploy" is no longer true (there is a cron harvest now). Says staging runs with demo content |
| GO-LIVE.md | Header says the portal "has never been on the server". Steps 6–8 are systemd (Plan B was used instead). The Step 7 env template lacks `HARVEST_PATH`, `PORTAL_REVALIDATE_SECRET`, `S3_*` and Turnstile. "Repeat on all ten journals". The troubleshooting section's `rm -rf` cache advice contradicts Step 3 |
| SITE-ADMIN-GUIDE.md | §5 "The ten journals" and its `ijdh` examples. "Create a new journal" omits the portal-side steps (see [DEVELOPMENT.md](DEVELOPMENT.md#add-a-journal)) |
| PORTING-CONVENTIONS.md, REPLICATION.md | Describe demo fixture content, which was removed. Mention `journalCovers.ts`, `src/components/ui/*` and `/api/drafts*`, none of which exist |
| OJS-INTEGRATION.md | References `src/app/api/drafts/submit/route.ts`, which doesn't exist. The in-portal submission wizard was removed; `/submit` hands off to OJS |
| ojs/README.md | Says the theme is "MISSING" and that F-02 and F-11 are open. All are resolved, and the theme is in `ojs/theme-dmpedia/` |
| CONTENT-RESTRUCTURE-PLAN.md | Says "15 policies" (there are 14). Its journal menu and book-proposal form paths differ slightly from the code. Otherwise the best record of the restructure |
| ADMIN-PANEL-PLAN.md | Its build status omits Editorial forms and Book volumes, which are built. "ten journals" |
| LOCAL-DEV.md | Uses the removed `ijdh` journal in its end-to-end example. Mentions `NEXT_PUBLIC_DEMO_CONTENT` |
| Code comments | `src/app/admin/submissions/page.tsx`, `src/components/admin/AdminSubmissions.tsx` and `src/app/api/submissions/route.ts` say "ten journals" |

`NEXT_PUBLIC_DEMO_CONTENT` is no longer read by any code. It can be removed from
`.env.example`, `build-env.production` and `deploy.yml`.
