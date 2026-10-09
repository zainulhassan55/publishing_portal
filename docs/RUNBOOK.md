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

Same-origin is load-bearing, not incidental: it is what allows the OJS session
cookie to authenticate portal API calls. Do not move OJS to a subdomain without
reading `OJS-INTEGRATION.md` first.

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
ssh $HOST 'ls -1dt /home/nextgeniq/portal/releases/*/'   # pick one
ssh $HOST 'ln -sfn <release> /home/nextgeniq/portal/current.new && \
           mv -Tf /home/nextgeniq/portal/current.new /home/nextgeniq/portal/current && \
           sudo systemctl restart ngiq-portal'
```

This replaces what the audit found (F-06): zip the build, upload through the
CloudPanel file manager, delete the old directory, unzip — performed by hand in
the same parent directory as the live `ojs/` install, with no staging and no way
back. **Nothing in the deploy path may ever touch a path outside
`releases/`.** The old process was one mis-click away from destroying the
editorial system.

## Publishing an article (no developer required)

1. Publish it in OJS as normal.
2. The harvest cron picks it up within the hour, or force it:
   `cd /home/nextgeniq/portal/current && npm run harvest`
3. The article page, its journal's listing, the issue TOC, the search index and
   the sitemap all pick it up on the next revalidation.

If a published article is not appearing, check in this order: is it
`status=3` (published) in OJS; did the last harvest exit zero
(`/api/health` reports `harvest.at` and counts); did the revalidation run.

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
- **OAI identity.** If `base_url` in `config.inc.php` is still a development
  value, harvesters cache a broken repository identity (F-02). Fix it before the
  first article is published; afterwards it requires re-registration with every
  service that already harvested.
- **ISSNs.** `src/data/issn.ts` is empty and every surface shows "Applied for".
  Add numbers only once assigned. An invented ISSN is checkable, and it fails.
