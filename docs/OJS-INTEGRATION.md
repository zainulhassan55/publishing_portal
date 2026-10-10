# OJS integration

## Verified state of the live instance

Probed against `https://www.nextgeniqpress.com/ojs` (OJS **3.5.0.5**). Every row
is reproducible with `npm run spike`, which is the point: this section used to be
assertions and is now evidence. Re-run it after any OJS upgrade.

| What | Finding |
| --- | --- |
| Journal contexts | All 10 exist and match `JOURNAL_SLUGS` in `scripts/harvest.ts` exactly. One `ART` section each. |
| Published records | **Zero.** OAI `ListIdentifiers` → `noRecordsMatch`. Every article the portal shows today is a fixture. |
| `api_key_secret` | **Set (2026-10-10).** API tokens can now be validated, so the harvest can run at full REST fidelity once a service key exists. Never rotate it — that invalidates every key ever issued. |
| `/api/v1/users/me` | **Does not exist** — "route could not be found". The original session design was built entirely on it. |
| Reviewer **API** | **Does not exist.** `reviews`, `reviewAssignments`, `submissions/{id}/reviewRounds` all absent. This is the API only — OJS runs peer review perfectly well through its own interface at `{journal}/dashboard/reviewAssignments`. What cannot be built is a *portal-native* reviewer UI, because there is nothing to read review state from. |
| Routes that do exist | `submissions`, `submissions/{id}/{files,publications,participants,decisions}`, `issues`, `sections`, `vocabs`, `index/contexts`, `index/users/{id}`, `temporaryFiles` (POST-only). All 401 unauthenticated. |
| Identity oracle | `GET /index.php/index/user/profile` → **302** signed out, **200** with a prefilled form signed in. This is the substitute for the missing `/users/me`. |
| Session cookie | `OJSSID=…; path=/ojs/; secure; httponly; samesite=lax` — **F-11 closed (2026-10-10)**. `path=/ojs/` still means the browser never sends it to portal routes, which the portal-owned session design accommodates rather than fights. |
| OAI identity | **F-02 closed (2026-10-10).** `repositoryIdentifier` is now `www.nextgeniqpress.com` and the sample identifier `oai:www.nextgeniqpress.com:article/1`. Fixed via `[oai] repository_id` — not `base_url`, which this doc originally blamed — and closed before the first article published, so no re-registration was needed. |
| Login form | Carries a `csrfToken` hidden field. Note OJS 3.5 returns the same credential error with or without it, so a missing token is *not* what blocks the relay — send it regardless. |

### What this means for the code as written

Three independent defects, all now fixed or neutralised:

1. `src/app/api/auth/sign-in/route.ts` could never succeed. It set the cookie on
   its own response, then called `getSession()`, which reads the **inbound**
   request store — which the browser had never populated, because of the cookie
   path above. Every sign-in returned `502 session-not-accepted`.
2. `getSession()` called `/users/me`, which does not exist.
3. `scripts/deploy.sh` runs `npm run harvest` before `npm run build` under
   `set -e`. With `OJS_BASE_URL` set and no usable key, every request 401'd and
   the script exited 1 — so **a production deploy could not complete at all**.

## The division of responsibility

OJS 3.5 is a **standalone service** and the **system of record** for everything
in the editorial workflow. The portal is a read model plus a nicer front door.

| Owned by OJS | Owned by the portal |
| --- | --- |
| Users, passwords, roles | Journal proposals |
| Submissions, revisions, files | Email alert subscriptions |
| Review rounds, reviewer assignments, reports | Contact messages |
| Editorial decisions and letters | Wizard drafts (pre-submission only) |
| Issues, galleys, published articles | Portal-only preferences (interests, alert prefs) |
| DOI deposits to Crossref, OAI-PMH | Public presentation, SEO, search |

Two rules follow, and neither is negotiable:

1. **The portal never writes to the OJS database.** Not a single `UPDATE`. All
   interaction is through the OJS REST API or OAI-PMH. A second writer into that
   schema is how submissions get silently corrupted.
2. **The portal never becomes a second account store.** There is one identity,
   and OJS holds it. `user_prefs` keys on `ojs_user_id` and holds only fields
   OJS has no concept of.

Both run on one origin: nginx serves the portal at `/` and OJS at `/ojs`. That
is not an accident of history — it is the thing that makes the auth design below
possible at all.

## Integration ladder

| Surface | Mechanism | Status |
| --- | --- | --- |
| Article, issue, journal pages | OAI inventory + REST enrichment → `content/harvest.json` → static pages | Built (`scripts/harvest.ts`) |
| Search | Build-time index over the same data | Built (`src/lib/search.ts`) |
| Sign in / session | Link out to the OJS login page | **Built — the current path.** `PORTAL_NATIVE_SIGNIN=0` |
| Sign in / session, in-portal | Portal-owned session over a server-side login relay | **Not built — Phase 3**, gated on spike check 3 |
| Wizard steps 1–6, autosave | Portal-native, drafts in the portal DB | Built; autosave needs a session, so dormant until Phase 3 |
| Final submit | Hand off to the OJS wizard | **Built — the current path**, and the only one until Phase 4 |
| Dashboard reads | OJS REST on behalf of the user | Not built — Phase 4. Shows portal drafts and link-outs today |
| File uploads | Author attaches in OJS | **By design, permanently.** See "Files" below |
| Peer review itself | Runs in OJS — assignment, rounds, forms, reminders, decisions | **Working.** OJS's own feature, untouched by any of this |
| Reviewer workspace in the portal | Link out to `{journal}/dashboard/reviewAssignments` | **By design, permanently** — no reviewer API to build against |
| Editorial back office | Link out to `{journal}/dashboard/editorial` | By design |

## The auth spike (gate for Phase 3)

In-portal sign-in is the one genuinely unknown part of the integration, and it
is unknown for a specific reason: **OJS has no OAuth, and its per-user API keys
have to be generated by hand in the OJS profile.** Neither is usable by an
author. What is left is driving the web login handler server-side, which is
undocumented.

Run `npm run spike`. It replaces the prose checklist this section used to carry
and prints PASS/FAIL/SKIP per check with the raw status and body excerpt, so the
go/no-go is evidence rather than opinion.

```
OJS_BASE_URL=https://www.nextgeniqpress.com/ojs \
OJS_API_KEY=… OJS_SPIKE_USER=… OJS_SPIKE_PASS=… npm run spike
```

| Check | Asserts | Needs | Gates |
| --- | --- | --- | --- |
| 0 | `repository_id` fixed, `api_key_secret` set, cookie carries `Secure` | nothing | Phase 0 |
| 1 | Route map over ~25 paths, via the 401/500 oracle below | nothing | everything |
| 2 | Service key reads contexts and issues | `OJS_API_KEY` | Phase 2 |
| 3 | Login relay → profile page returns **200 not 302**, identity parsed | spike account | **Phase 3** |
| 4 | `POST {ctx}/api/v1/submissions` — records status and body verbatim | spike account + `OJS_SPIKE_MUTATE=1` | Phase 4 |
| 5 | `POST {ctx}/api/v1/temporaryFiles` — settles the multipart field name | as above | reference only |
| 6 | An invalid session redirects to login rather than erroring | nothing | Phase 3 |

Checks 0 and 1 need no credentials. **Run them on a schedule** — F-02 regressed
unnoticed precisely because nothing watched for it, and an OJS upgrade that
moves a route would otherwise surface as a user-visible failure.

Checks 4 and 5 create real state, so they require `OJS_SPIKE_MUTATE=1` and
report rather than fail. Delete what they create from the OJS dashboard.

### The route-existence oracle

OJS answers unauthenticated API requests in three distinguishable ways, which is
what makes a credential-free route inventory possible at all:

| Response | Meaning |
| --- | --- |
| `401` "not authorized" | the route exists and needs auth |
| `500` "could not be found" | no such route in this release |
| `404 api.404.endpointNotFound` | no handler matched |

### Superseded by the probe

- The old check #2 tested `GET …/api/v1/users/me`. **That route does not exist
  in OJS 3.5.** As written it would have failed the entire approach for the
  wrong reason, when the profile-page oracle salvages it.
- The old check #1 expected a missing CSRF token to show up as a form re-render
  with a CSRF complaint. It does not — 3.5 returns an identical credential error
  either way.
- "Do not scope the reviewer workspace until checks 3 and 4 pass" is moot: there
  is no reviewer API to scope against on this version.

### Why the fallback is the current state, not a failure mode

Sign-in links out to OJS, the wizard hands off at the final step, and the
dashboard shows portal drafts plus link-outs. This is deliberate and shipped: it
is honest about what the portal can do, it needs none of the unknowns above, and
every piece of it upgrades in place once check 3 passes. If check 3 fails, this
is the product rather than a stopgap.

## Files

Manuscript bytes never pass through the portal. The wizard records file
*metadata* as a readiness checklist and the author attaches the files themselves
in OJS.

`temporaryFiles` and `submissions/{id}/files` both exist, so this is a choice
rather than a limitation. Three reasons, in order of weight:

1. Relaying files would create a **second place manuscripts live**, inheriting
   backup, retention and disclosure obligations for unscreened and sometimes
   embargoed research data held outside the system of record.
2. `genreId` is required when attaching a file, is per-journal, and has **no
   discovery endpoint** — it would need a hardcoded id table that silently rots.
3. CloudPanel caps PHP uploads at 64 MB (`post_max_size`, `upload_max_filesize`) while the wizard
   advertises 50 MB per file, enforced nowhere.

The file step therefore does not block progress. It used to refuse step 5 until
the author named an anonymised manuscript and a title page — for a manifest no
system reads, which is the same defect class as F-18's dead controls. The
indicators are advisory now; OJS enforces the real requirement at attachment.

## Harvest

```
OJS_BASE_URL=https://www.nextgeniqpress.com/ojs OJS_API_KEY=… npm run harvest
```

Writes `content/harvest.json`. Run it **before `next build`** in CI, and on a
cron afterwards so publishing in OJS reaches the site without a developer.

Two passes, because the two read paths fail differently:

1. **OAI-PMH inventory** — needs no credentials, authoritative on *what exists*.
2. **REST enrichment** — needs `OJS_API_KEY`, authoritative on *detail*. OAI's
   Dublin Core would lose affiliations, ORCIDs and CRediT roles, all of which
   the article page and the Scholar citation tags need.

Notes:

- `status=3` is `STATUS_PUBLISHED`. Anything else is not public and must not be
  harvested.
- **Completeness is decided by comparing the two passes.** The run fails when
  OAI reports more published records than the API returned, and names the
  journals that came up short. A partial harvest would make a journal with
  articles look like a journal without any, so CI must not publish it.
- It previously failed on *any* HTTP error, which meant a missing or unusable
  API key took the whole deploy down — and since OJS requires a token for every
  API read and `api_key_secret` is unset, that was the normal case. An
  unauthenticated OJS is a configuration state, not a reason to refuse to
  publish the site, so the run now warns, diagnoses, and completes at OAI
  fidelity.
- The snapshot is disposable. Deleting it loses nothing a re-run cannot rebuild,
  which is why it is a file and not a database table.

## OJS-side configuration that must be fixed first

From `docs/PLATFORM-AUDIT.md`. These are OJS or DNS changes, not portal code,
and three of them are time-sensitive.

- **F-02 — OAI identity is `localhost:8000`.** Set **`[oai] repository_id`** to
  `www.nextgeniqpress.com`. Note this is *not* `base_url`, which this document
  previously blamed and which has since been corrected independently: `Identify`
  now returns the right `baseURL` while still advertising
  `oai:localhost:8000:article/1`. Every harvester that picks that up caches a
  broken permanent identity. **Fix before the first article is published** —
  afterwards it requires re-registration with each service that already
  harvested. The repository still has zero records, so this is a one-line fix
  today. Spike check 0a.
- **`api_key_secret` is unset.** Until it is, OJS can validate no API token at
  all, so the harvest cannot read anything and the portal cannot make any
  server-side call on a user's behalf. Set it once to 64 random characters and
  never rotate it — rotating invalidates every key ever issued. Spike check 0c.
- **F-11 — session cookie missing `Secure`.** Set `force_ssl = On`. Spike
  check 0d.
- **F-07 — DKIM.** Enable DKIM, SPF and DMARC for the sending domain, then move
  OJS SMTP to a provider that reports delivery.
- **F-04 — DOIs.** Crossref membership, then enable the DOI plugin and configure
  the prefix. The site currently advertises "DOI-ready articles" with no deposit
  workflow behind it.
- **F-10 — preservation.** Enable the PKP Preservation Network plugin. DOAJ
  requires a preservation arrangement.
- **F-16 — the `dmpedia` theme is not in version control.** It exists only as
  files on the server; a rebuild or upgrade loses it with no recovery path. Copy
  it into `ojs/theme-dmpedia/` in this repo and deploy it from there.
