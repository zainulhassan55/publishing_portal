# Operations

This document describes how production actually runs. Where it disagrees with
[RUNBOOK.md](RUNBOOK.md) or [GO-LIVE.md](GO-LIVE.md), this document is correct:
production uses **PM2 and `~/portal/.env`**, not systemd and
`/etc/ngiq/portal.env`.

## 1. The server

| | |
| --- | --- |
| Host | One VPS managed by **CloudPanel**. Its address is in the GitHub secret `DEPLOY_PRODUCTION_HOST` and in [GO-LIVE.md](GO-LIVE.md) |
| CloudPanel | `https://<server>:8443`. Restrict this port to known IPs |
| Site user | `nextgeniqpress`, home `/home/nextgeniqpress`. **No root**: `sudo` allows only `clpctlWrapper` |
| Domain | `www.nextgeniqpress.com` (the apex 301-redirects to `www`) |
| OJS | `~/htdocs/www.nextgeniqpress.com/ojs`, config `…/ojs/config.inc.php`, files `~/ojs_files` |
| MySQL | One instance with two databases, `ojs` and `portal` (separate users) |
| Node | Installed per user through nvm; version 22.13.x |
| Process manager | **PM2**, process name `ngiq-portal`, started from `~/portal/start.sh` |

### Portal directory layout

```
~/portal/
  .env                     runtime secrets (chmod 600); start.sh, deploy.sh and harvest.sh source it
  start.sh                 PM2 entry: sources .env, sets NODE_ENV=production PORT=3000 HOSTNAME=127.0.0.1, runs node server.js
  current -> releases/…    symlink to the live release
  releases/<UTC>-<sha>/    the last 5 releases (standalone build, scripts, migrations, deploy/harvest.sh)
  shared/harvest.json      the harvest snapshot (HARVEST_PATH); survives deploys
  harvest.sh               copy of deploy/harvest.sh that cron runs
  harvest.log, harvest.lock
```

The portal sits outside `htdocs` on purpose, so nginx can never serve its
source.

### nginx

The vhost is **`deploy/cloudpanel-vhost.conf`**, which is pasted by hand into
CloudPanel → Sites → Vhost. A deploy never changes it, so after editing the file
you have to paste it again.

What the vhost does:

- Proxies `/` to `127.0.0.1:3000`, bypassing Varnish.
- Sends `/ojs/index.php/` directly to nginx on port 8080, **not through
  Varnish**. Varnish was stripping the `OJSSID` cookie.
- Redirects public OJS pages to the portal (see
  [ARCHITECTURE.md §1](ARCHITECTURE.md#1-the-big-picture)).
- Caches `/_next/static/` for a year.

**Don't enable CloudPanel PageSpeed.** It breaks React hydration.

## 2. Deploying

### Normal path: merge to `main`

`.github/workflows/deploy.yml` runs on every push to `main`. It:

1. Cuts the next `v*` patch tag and pushes it.
2. Loads the deploy SSH key from secrets.
3. Runs `./scripts/deploy.sh production` on the GitHub runner, with
   `OJS_BASE_URL`, `OJS_API_KEY` and `PORTAL_NATIVE_SIGNIN=1`.

Pushing a `v*` tag by hand deploys that tag. Use this for a hotfix or a rollback
to an older version.

### What `scripts/deploy.sh <staging|production>` does

1. **Guards:** in production, the working tree must be clean and HEAD must carry
   an exact tag.
2. **Checks:** `npm ci`, typecheck, lint, tests, then `npm run harvest`, which
   bakes a snapshot into the build.
3. **Build:** loads `deploy/build-env.<target>` and runs `next build`, which
   produces standalone output.
4. **Post-build assertions.** The deploy fails if any of these is true:
   - a `localhost:` URL was compiled in;
   - an absolute `/ojs` URL was compiled in;
   - the Turnstile site key is missing.
5. **Package:** assembles the standalone server, static files, `public/`,
   migrations and the scripts it needs. It installs `mysql2` and `aws4fetch` for
   the scripts.
6. **Upload:** `rsync`s the package to `~/portal/releases/<stamp>-<sha>/`.
7. **Activate, on the server:**
   1. source `~/portal/.env`;
   2. **run migrations**. If one fails, the old release stays live;
   3. seed `HARVEST_PATH` if it doesn't exist yet;
   4. flip the `current` symlink atomically;
   5. `pm2 restart ngiq-portal --update-env`.
8. **Health gate:** polls `http://127.0.0.1:3000/api/health` for 30 seconds.
   - On success it calls `/api/revalidate` and prunes old releases down to 5.
   - On failure it **rolls back automatically** to the previous release and
     exits 1. Migrations are **not** rolled back.

### Deploying from a laptop

This is only an emergency path; normally CI deploys. You need SSH access, a
clean tree and a tagged HEAD:

```bash
git tag v1.3.14 && git push origin v1.3.14       # or let CI tag
export DEPLOY_PRODUCTION_HOST=nextgeniqpress@<server>
export OJS_BASE_URL=https://www.nextgeniqpress.com/ojs OJS_API_KEY=… PORTAL_NATIVE_SIGNIN=1
./scripts/deploy.sh production
```

Set `PORTAL_NATIVE_SIGNIN=1` explicitly. It isn't in `build-env.production`, so
otherwise a laptop build inherits whatever your `.env.local` holds.

### Manual rollback

```bash
ssh nextgeniqpress@<server>
cd ~/portal && ls -1dt releases/*          # newest first
ln -sfn releases/<previous> current.new && mv -Tf current.new current
pm2 restart ngiq-portal --update-env
curl -s http://127.0.0.1:3000/api/health
```

If the bad release ran a migration, check whether the old code still works with
the new schema. Migrations only ever add tables and columns, so so far it always
has.

### Staging

Staging is **not set up**. `deploy/build-env.staging` doesn't exist and there's
no staging directory or PM2 process, so `deploy.sh staging` exits immediately.

## 3. CI

`.github/workflows/ci.yml` runs on PRs into `main` and on pushes to `main` and
`frontend-redesign`. It has two jobs:

- **`verify`:** `npm ci`, typecheck, lint, test, an empty harvest, `next build`,
  then `scripts/check-ssr.mjs`. The SSR check requires 8 key routes to return
  200 with real HTML of at least 8 KB each, and an unknown URL to return 404.
- **`audit`:** `npm audit --omit=dev --audit-level=high`.

CI doesn't build with `build-env.production`, so the production-only build
assertions run only in `deploy.sh`.

## 4. Environment variables

### Build time

These values are inlined into the bundle, so changing one needs a rebuild. Set
them in `deploy/build-env.production`, which is committed and must contain no
secrets:

| Variable | Production value | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.nextgeniqpress.com` | Canonicals, sitemap, JSON-LD, admin Origin check |
| `NEXT_PUBLIC_OJS_PATH` | `/ojs` | **Must be relative** in production, or the `OJSSID` hand-off fails |
| `NEXT_PUBLIC_DOI_PREFIX` | `10.63521` | |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | (public key) | The deploy fails without it |
| `NEXT_PUBLIC_DEMO_CONTENT` | `0` | No longer read by code (the fixtures were removed) |
| `PORTAL_NATIVE_SIGNIN` | `1` (set by `deploy.yml`) | Also read at build time, because the sign-in page is prerendered |

### Runtime

These live in `~/portal/.env` on the server. `.env.example` documents each one:

| Variable | Purpose |
| --- | --- |
| `OJS_BASE_URL` | `https://www.nextgeniqpress.com/ojs`, used for server-side OJS calls |
| `OJS_API_KEY` | OJS API token of the service account. **Never rotate OJS's `api_key_secret`**: doing so invalidates every token |
| `OJS_SESSION_COOKIE` | `OJSSID` |
| `PORTAL_NATIVE_SIGNIN` | `1`. Gates the sign-in relay endpoint |
| `PORTAL_DATABASE_URL` | `mysql://portal:…@127.0.0.1:3306/portal` |
| `HARVEST_PATH` | `/home/nextgeniqpress/portal/shared/harvest.json` |
| `PORTAL_REVALIDATE_SECRET` | Long random string (`openssl rand -hex 32`) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Portal email |
| `EDITORIAL_INBOX` | Where form and contact notifications go |
| `S3_ENDPOINT`, `S3_REGION=auto`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` | R2 API token (Object Read & Write on the two buckets only) |
| `S3_BUCKET_SUBMISSIONS`, `S3_BUCKET_PUBLICATIONS` | `ngiq-submissions`, `ngiq-publications` |
| `TURNSTILE_SECRET_KEY` | Pair of the public site key |
| The `NEXT_PUBLIC_*` values above | Keep them identical to the build values |

After changing `.env`, run `pm2 restart ngiq-portal --update-env`.

## 5. Publishing pipeline: harvest

The harvest runs from a CloudPanel cron, every 15 minutes:

```
*/15 * * * *   /home/nextgeniqpress/portal/harvest.sh >> /home/nextgeniqpress/portal/harvest.log 2>&1
```

`harvest.sh` locates Node through nvm, takes a lock, runs `scripts/harvest.ts`
from `current/`, and then POSTs `/api/revalidate`. When a release changes
`deploy/harvest.sh`, update the cron's copy with
`cp ~/portal/current/deploy/harvest.sh ~/portal/harvest.sh`.

A refused write (OAI down, or an incomplete REST result) leaves the old snapshot
in place and exits 1. Look in `harvest.log` for the reason.

## 6. Logs and monitoring

| What | Where |
| --- | --- |
| Portal app | `pm2 logs ngiq-portal --lines 200 --nostream`, or `~/.pm2/logs/ngiq-portal-{out,error}.log`. Route lines are prefixed `[sign-in]`, `[register]`, `[session]`, … |
| Process state | `pm2 status`, `pm2 restart ngiq-portal --update-env` |
| Harvest | `tail -100 ~/portal/harvest.log` |
| nginx, PHP, OJS | CloudPanel → Logs (there's no root, so `/var/log` isn't readable) |
| Health | `https://www.nextgeniqpress.com/api/health` |

`journalctl` shows nothing for this user, because the app isn't under systemd.

PM2 survives a reboot through a CloudPanel cron entry,
`@reboot <nvm path>/pm2 resurrect`. Run `pm2 save` after any change to the
process list.

Set an uptime monitor, such as UptimeRobot, to watch `/api/health` for a
`"status":"ok"` keyword. It isn't confirmed whether one is configured.

## 7. OJS

| Task | How |
| --- | --- |
| Admin cache clear | `/ojs/index.php/index/admin/clearDataCache` and `clearTemplateCache`. Never delete the cache by hand |
| Required settings in `config.inc.php` | `api_key_secret` (set once, never rotate), `restful_urls`, `force_ssl`, `session_cookie_name = OJSSID`, reCAPTCHA **off**, `require_validation = Off` |
| Redacted reference copy | `ojs/config/config.inc.php.example` |
| Theme | `ojs/theme-dmpedia/`, a child of the default theme whose links point back to the portal. Install it by copying into `plugins/themes/` |
| Diagnose the integration | `npm run spike` with `OJS_BASE_URL` set (see [LOCAL-DEV.md](LOCAL-DEV.md)) |
| After an OJS upgrade | See [DEVELOPMENT.md](DEVELOPMENT.md#upgrade-ojs) |

## 8. Backups

`scripts/backup.sh` is written, but **it doesn't work on this server as it
stands**. See [KNOWN-ISSUES.md](KNOWN-ISSUES.md#operations). It assumes root, a
log in `/var/log`, the systemd env file, and a copy of itself inside the release,
none of which hold here. Treat backups as **not in place** until they are
verified.

A working backup needs to cover:

1. A `mysqldump --single-transaction` of `ojs` and `portal`.
2. A tar of `~/ojs_files`. These are the manuscripts and are irreplaceable.
3. `config.inc.php`, `~/portal/.env` and the CloudPanel vhost.
4. The R2 buckets, through `rclone` (optional, since R2 is already durable).

Ship it off-box (the script targets Backblaze B2), keep 30 days, and **run a test
restore**. The restore drill in RUNBOOK.md has never been done. CloudPanel's own
backup feature is an alternative worth checking.

## 9. Common problems

| Symptom | Check |
| --- | --- |
| New OJS paper not on the site | `harvest.log`, `/api/health` → `harvest.at`. Is the journal in the registry? Is the paper hidden in Admin → Published papers? |
| Forms answer "unavailable" (503) | The `S3_*` variables are missing from `.env`. Run `node --experimental-strip-types scripts/storage-check.ts` from `~/portal/current` |
| Sign-in fails or loops | `pm2 logs` (look for `[sign-in]`). Is OJS up? Is `PORTAL_NATIVE_SIGNIN=1`? Is `NEXT_PUBLIC_OJS_PATH=/ojs` relative? Clear the browser's `OJSSID` cookies |
| Asked to sign in twice in OJS | Stale `OJSSID` cookies. Sign out on the portal and back in. Varnish must stay bypassed for `/ojs/index.php/` |
| Registration fails | reCAPTCHA or email validation was switched on in OJS, or OJS HTML changed after an upgrade (`npm run spike`) |
| Deploy rolled back | The GitHub Actions log shows the health output. Start the release by hand to see the error: `cd ~/portal/releases/<new> && node server.js` |
| Migration failed during deploy | The old release is still live. Fix the SQL, then check for and undo any partly applied statements by hand (migrations don't run in a transaction) |
| Emails not arriving | `SMTP_*` set? SPF, DKIM and DMARC for the sending domain (audit F-07) |

## 10. One-time setup still to confirm

The code for each of these is done. Confirm the server side on the box:

- [ ] `~/portal/.env` has `HARVEST_PATH`, `PORTAL_REVALIDATE_SECRET`, all `S3_*`
      variables and `TURNSTILE_SECRET_KEY`, and the deploy ran
      `pm2 restart --update-env` after they were added.
- [ ] The harvest cron is present in CloudPanel and `harvest.log` shows runs
      every 15 minutes.
- [ ] Migrations 004, 005 and 006 are applied: `SELECT * FROM schema_migrations`.
- [ ] R2: CORS allows `https://www.nextgeniqpress.com` for PUT, and the 1-day
      lifecycle rule is set on `pending/`. See
      [CONTENT-RESTRUCTURE-PLAN.md](CONTENT-RESTRUCTURE-PLAN.md).
- [ ] An uptime monitor is set on `/api/health`.
- [ ] Working nightly backups, with one test restore done.
- [ ] SPF, DKIM and DMARC pass for the sending domain.
- [ ] CloudPanel port 8443 is restricted, and the panel password has been
      rotated.
- [ ] OJS `repository_id` is set to the real host. RUNBOOK lists it as
      `localhost:8000`.
- [ ] The `spike-author` test account in OJS has been deleted.
