# Runbook

Operating the platform. Written for whoever is on the hook at the time, which
today is one person.

## What runs where

One VPS, nginx in front, two applications on one origin:

```
www.nextgeniqpress.com
  /          → Next.js portal       (Node, systemd: ngiq-portal, :3000)
  /ojs       → OJS 3.5              (PHP-FPM)

MySQL
  ojs        → OJS owns it. The portal never writes here.
  portal     → the portal's six tables (migrations/)

Cron
  OJS scheduled tasks
  nightly backup → Backblaze B2
  harvest + revalidate
```

Same-origin is a **preference**, not a requirement. The portal reaches OJS
server to server and issues its own session cookie, so the OJS cookie never
reaches the browser and the two need not share an origin. What one origin buys
is unified URLs and no CORS surface. Read `OJS-INTEGRATION.md` before changing
it, but it is not the constraint an earlier version of this runbook claimed.

A practical consequence: the integration can be developed and tested entirely
from `localhost` against the live OJS, with no deployment.

## Deploying

```bash
./scripts/deploy.sh staging       # any commit
git tag -a v1.2.0 -m "…" && git push --tags
./scripts/deploy.sh production    # refuses an untagged or dirty tree
```

The script builds locally, runs the full gate (typecheck, lint, test, harvest,
build), uploads to a new timestamped release directory, flips the `current`
symlink, restarts the service, and **rolls back automatically** if
`/api/health` does not answer within 30 seconds. Five releases are kept.

Rollback by hand:

```bash
ssh $HOST 'ls -1dt /home/nextgeniqpress/portal/releases/*/'   # pick one
ssh $HOST 'ln -sfn <release> /home/nextgeniqpress/portal/current.new && \
           mv -Tf /home/nextgeniqpress/portal/current.new /home/nextgeniqpress/portal/current && \
           sudo systemctl restart ngiq-portal'
```

This replaces what the audit found (F-06): zip the build, upload through the
CloudPanel file manager, delete the old directory, unzip — performed by hand in
the same parent directory as the live `ojs/` install, with no staging and no way
back. **Nothing in the deploy path may ever touch a path outside
`releases/`.** The old process was one mis-click away from destroying the
editorial system.

## Publishing an article

**Today this needs a redeploy.** The section below described an hourly cron and
an on-server `npm run harvest`; neither works yet, and the steps are kept here
only so the gap is not rediscovered the hard way:

- `deploy.sh` stages the standalone output, `.next/static`, `public` and
  `content` — **not `scripts/`** — so `npm run harvest` on the server cannot
  find `scripts/harvest.ts`.
- `readHarvest()` caches the snapshot per process, so rewriting
  `content/harvest.json` under a running server has no effect until restart.
- Listing pages, the search index and the sitemap are built statically with no
  `revalidate`, so they would not show a new article even with a fresh
  snapshot. Only `/articles/[slug]` (`dynamicParams = true`) renders on demand.

### The working procedure

1. Publish it in OJS as normal (`status=3`).
2. Redeploy: `./scripts/deploy.sh production`. The script harvests immediately
   before building, so the new article is included.
3. Confirm with `/api/health` — `harvest.articles` should have incremented and
   `harvest.ageHours` should be near zero.

### Making it developer-free (Phase 2)

Add `scripts/` to the deploy stage, restart the unit after a successful harvest,
and set a `revalidate` on the listing pages. Gated on `OJS_API_KEY` existing,
which needs `api_key_secret` set in OJS — see `docs/GO-LIVE.md` step 1.

If a published article is not appearing, check in this order: is it `status=3`
in OJS; did the last harvest exit zero (`/api/health` reports `harvest.at`,
counts and `ageHours`); was there a deploy after it was published.

## Backups and restore

**An untested backup is a hypothesis.** Audit finding F-05 was that everything —
accounts, submissions, peer reviews, manuscript files — sat on one MySQL
instance on one VPS with manual, unverified weekly backups.

Nightly, to Backblaze B2:

- `mysqldump` of both `ojs` and `portal`
- the OJS files directory (manuscripts, galleys — these are not in the database
  and are not reproducible)
- `/etc/nginx`, the systemd units, `config.inc.php`

Not backed up, by design: `content/harvest.json` (regenerate with
`npm run harvest`), `node_modules`, build output.

### Restore drill — run quarterly, and before trusting any of the above

```bash
# 1. Fetch last night's artefacts
# 2. Restore into a scratch database, never over the live one
mysql -e 'CREATE DATABASE restore_test'
gunzip -c ojs-YYYY-MM-DD.sql.gz | mysql restore_test
# 3. Verify row counts against production
mysql restore_test -e 'SELECT COUNT(*) FROM submissions; SELECT COUNT(*) FROM users'
# 4. Restore the files directory to a scratch path and spot-check that a
#    manuscript file opens
# 5. Drop the scratch database
```

Record the date and outcome below. An undated drill is the same as no drill.

| Date | Outcome | Notes |
| --- | --- | --- |
| _not yet run_ | — | Run this before the first real submission arrives |

## Monitoring

Audit finding F-17: there was no uptime, error or cron alerting at all.

- `GET /api/health` — returns 200 whenever the portal can serve pages, with
  `status: ok | degraded` and per-dependency detail. Point uptime monitoring at
  it and alert on **non-200 or no response**, which means the site is down.
- Alert on `status: degraded` separately and at lower urgency. Degraded means
  the database or OJS is unreachable: forms and sign-in break, but every public
  page still renders because they are statically generated. That is not a
  2 a.m. problem.
- Watch the harvest cron. A harvest that stops silently looks exactly like a
  journal that stopped publishing.
- Error tracking on both the portal and PHP.

## Email

Audit finding F-07: DKIM was not enabled, so peer-review invitations were
filtered as spam and the editorial process stalled with no visible error.

Two senders, and both must pass SPF, DKIM and DMARC:

- **OJS** sends all peer-review and submission mail. Configured in
  `config.inc.php`.
- **The portal** sends only its own mail — proposal acknowledgements, alert
  confirmations, contact relays — via the SMTP settings in the environment file.

Verify with a message to a Gmail address and read the raw headers: all three of
`spf=pass`, `dkim=pass`, `dmarc=pass`. "It arrived" is not verification; it may
have arrived for you and been filtered for a reviewer.

## Secrets

Production values live in the systemd unit's `EnvironmentFile` on the VPS,
readable only by root. Nothing in `.env*` is committed except `.env.example`.
`OJS_API_KEY` and `PORTAL_DATABASE_URL` are the two that matter: the first is
admin-scoped on OJS, the second has write access to the portal database.
Neither may ever be prefixed `NEXT_PUBLIC_`, which would publish it in the
browser bundle.

## Things that will bite

- **Demo content.** `NEXT_PUBLIC_DEMO_CONTENT=1` serves fictional articles.
  Staging runs with it; production must not. If invented articles ever appear on
  the live site, this is why.
- **Node version.** Pinned in `.nvmrc`. The audit found the server running a
  version outside the supported matrix with no pin at all.
- **The OJS theme.** Until `dmpedia` is committed to this repo (F-16) it exists
  only as files on the server, and a rebuild loses it with no recovery path.
- **OAI identity.** `[oai] repository_id` in `config.inc.php` — **not
  `base_url`**, which is already correct and which this note previously blamed.
  It is still `localhost:8000`, so records are advertised as
  `oai:localhost:8000:article/1` and every harvester that reads one caches a
  broken permanent identity (F-02). Fix it before the first article is
  published; afterwards it requires re-registration with every service that
  already harvested. `npm run spike` check 0a asserts it.
- **ISSNs.** `src/data/issn.ts` is empty and every surface shows "Applied for".
  Add numbers only once assigned. An invented ISSN is checkable, and it fails.
