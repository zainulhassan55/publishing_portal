# Local development against the live OJS

The whole integration can be built and tested from `localhost` with **no
deployment**. This is not a compromise — it is the natural consequence of the
auth design: the portal reaches OJS server to server and issues its own session
cookie, so the two never need to share an origin. See `docs/OJS-INTEGRATION.md`.

Useful when the production domain is not yours to change, which is the case
today: `www.nextgeniqpress.com` is managed by someone else.

## What works locally

| | |
| --- | --- |
| Every public page, search, SEO, 404s | ✅ |
| Link-outs to OJS | ✅ with `NEXT_PUBLIC_OJS_PATH` set absolute |
| `npm run spike` — all 29 checks | ✅ already does |
| Harvest from live OJS | ✅ needs `OJS_API_KEY` |
| Submission wizard + draft autosave | ✅ needs the local database |
| Contact / proposals / alerts / prefs | ✅ needs the local database |
| Portal-owned sign-in (Phase 3) | ✅ buildable and testable here |
| Per-user dashboard reads (Phase 4) | ✅ buildable and testable here |

## What does not

- **Email delivery.** SMTP is unset locally, so the mailer logs instead of
  sending. The routes still store their rows, which is the part worth testing.
- **A public URL.** Nobody else can see `localhost:3000`.

Nothing in the OJS integration is blocked.

## Setup

### 1. The database

No local MySQL is needed — run it in Docker:

```bash
docker run -d --name ngiq-mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=rootpw \
  -e MYSQL_DATABASE=portal \
  -e MYSQL_USER=portal \
  -e MYSQL_PASSWORD=portalpw \
  mysql:8
```

Give it ~20 seconds to initialise, then apply the schema:

```bash
npm run db:migrate
```

Stop and start it later with `docker stop ngiq-mysql` / `docker start
ngiq-mysql`. The data survives until you `docker rm` it.

### 2. `.env.local`

Gitignored, and read by `next dev` **and** by the scripts (`spike`, `harvest`,
`db:migrate`) via `scripts/env.ts`.

```ini
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DOI_PREFIX=10.63521

# Fixtures are opt-in. Set to 1 to see the designed, populated state; 0 or
# unset to see exactly what a reader gets today, which is the launch state
# because OJS has published nothing yet. Worth flipping both ways.
NEXT_PUBLIC_DEMO_CONTENT=1

# ABSOLUTE, not /ojs — this is what makes link-outs work from localhost.
NEXT_PUBLIC_OJS_PATH=https://www.nextgeniqpress.com/ojs

# Server-side calls: harvest, the login relay, per-user reads.
OJS_BASE_URL=https://www.nextgeniqpress.com/ojs
OJS_API_KEY=<the key from the OJS profile API Key tab>
OJS_SESSION_COOKIE=OJSSID

# Off until spike check 3 passes. See docs/OJS-INTEGRATION.md.
PORTAL_NATIVE_SIGNIN=0

PORTAL_DATABASE_URL=mysql://portal:portalpw@127.0.0.1:3306/portal

# Optional. Unset means the mailer logs instead of sending, which is usually
# what you want locally.
SMTP_HOST=
EDITORIAL_INBOX=contact@nextgeniqpress.com

# For spike checks 3-5 only. A throwaway OJS author account.
OJS_SPIKE_USER=
OJS_SPIKE_PASS=
```

### 3. Run it

```bash
npm run dev          # http://localhost:3000
```

## Things worth doing from here

### Confirm the OJS config is still right

```bash
npm run spike
```

Checks 0 and 1 need no credentials. Run this after any OJS change — it is what
caught the `repository_id` regression and the dead `/reviewer` route.

### A real end-to-end content test, with no deployment

This is the most valuable thing available locally. The API key currently reads
`ijdh` only, and `ijdh` is enough:

1. In OJS, create and **publish** a test submission in `ijdh`
   (`status=3`). Any title will do.
2. Locally:

   ```bash
   npm run harvest        # should report: wrote 1 article(s)
   npm run dev
   ```
3. Visit `http://localhost:3000/journals/ijdh` and the article page. Confirm the
   real title, authors, ORCIDs and DOI render, and that the citation meta tags
   are present (View Source, look for `citation_title`).
4. **Unpublish it in OJS afterwards.**

That exercises the entire read path — OAI inventory, REST enrichment, static
generation, citation metadata — against real OJS data. It is the proof that
publishing in OJS reaches the site.

### Settle the sign-in question

Register a throwaway author at
`https://www.nextgeniqpress.com/ojs/index.php/ijdh/user/register`, put the
credentials in `.env.local`, and run `npm run spike`. Check 3 decides whether
Phase 3 and Phase 4 exist at all.

### Build Phase 3 and 4

Both are ordinary local development once check 3 passes. Neither needs a
deployment, a domain, or the production database.

## When there is a server to deploy to

`docs/GO-LIVE.md` covers it. Nothing in this file has to be undone first — only
two values change:

```ini
NEXT_PUBLIC_SITE_URL=https://<the real domain>
NEXT_PUBLIC_OJS_PATH=/ojs          # relative again, if OJS shares the origin
```

Keep `NEXT_PUBLIC_OJS_PATH` absolute if OJS ends up on a different host. Both
work.
