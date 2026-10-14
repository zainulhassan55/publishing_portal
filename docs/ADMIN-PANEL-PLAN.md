# The admin panel — scope, architecture and phased plan

Written 2026-10-13 after probing the live OJS 3.5.0.5 install for what its API
can and cannot do. Every capability claim below is marked verified or assumed;
the assumed ones must be settled before the phase that depends on them starts.

## Build status (2026-10-13)

| Phase | State |
|---|---|
| **0 — Foundations** | **Built.** `admin_audit` + proposal decision columns (migration `003`), `isSiteAdmin`, `requireAdminPage`/`requireAdminApi`, derived-token CSRF, `/admin` shell |
| **1 — Journal proposals** | **Built.** `/admin/proposals`, list + decide API, audited. Decision email deferred — SMTP is unconfigured |
| **3 — Cross-journal submissions** | **Built.** `/admin/submissions` over `?scope=all`, filter + staleness sort, read-only |
| **6 — Activity log** | **Built** (the audit-reading half). `/admin/activity` |
| **4 — Publish-to-public gate** | **Built (2026-10-14).** `/admin/publishing`, `article_display` (migration `004`), show/hide API, audited. P3a resolved by option B: scheduled harvest on the server + `POST /api/revalidate` purge + hourly ISR safety net. Default is mirror OJS (D2) |
| 2 — Journal portfolio control | **Not built.** Blocked on D1. P3a no longer blocks it |
| 5 — Calls for papers | **Not built.** Blocked on D3 |
| 6 — Users | **Not built** |

**Migration `003` has not been applied anywhere** — there is no local MySQL on
the development machine. `scripts/deploy.sh` applies migrations on deploy; until
it runs, every admin screen that reads the database will error. Decisions
D1–D3 in §6 were taken as the recommended defaults (hybrid registry, mirror
OJS, portal CFPs) so the built phases could proceed; none of the built code
depends on them.

P3a — the finding that blocked Phases 2 and 4 — is resolved: the content layer
is no longer fixed at build time. The route taken was option B below rather
than C (harvest into the database): the snapshot stays a file, but the server
re-reads it when it changes, a cron rewrites it every fifteen minutes, and a
purge route makes the pages re-render on the next request. Option C remains
the right move if the snapshot ever outgrows a file; nothing built here
prevents it, because the pages read through `getArticles()` either way.

---

## 1. The principle this plan is built on

> **OJS owns the editorial process. The portal owns the public shop window.**

This is not a style preference, it is the thing that keeps the project
finishable. OJS has fifteen years of peer-review workflow in it — reviewer
assignment, review rounds, decision letters, copyediting, production, DOI
deposit — with mature UIs that editors are trained on. Rebuilding any of that in
the portal means reimplementing an editorial system badly, and the portal would
become a second writer into OJS's schema, which
[src/lib/db/index.ts](../src/lib/db/index.ts) already names as "how data
corruption starts".

So the admin panel gets three jobs, and refuses the fourth:

| Job | Why it belongs in the portal |
|---|---|
| **Things OJS has no concept of** | Journal proposals, public-site curation, CFP approval. OJS has no model for "a journal that does not exist yet". |
| **Cross-journal oversight** | OJS is per-journal by design. There is no site-wide submission queue in OJS, and an administrator of ten journals currently opens ten dashboards. |
| **The publish-to-public gate** | A reviewed, accepted paper becoming visible on the website is a publisher decision, and the portal is the website. |
| ~~Peer review, decisions, reviewer assignment, copyediting~~ | **Link out to OJS.** Already the documented decision — see [DashboardPage.tsx:965-981](../src/components/mockup/DashboardPage.tsx#L965-L981). |

---

## 2. What the live OJS API actually gives us

Probed credential-free against `https://www.nextgeniqpress.com/ojs`, OJS
3.5.0.5. A `401` means the route exists and needs authentication; `404`/`500`
means there is nothing there. Same technique as
[scripts/ojs-spike.ts](../scripts/ojs-spike.ts) check 1.

### Verified present

| Route | What it unlocks |
|---|---|
| `index/api/v1/contexts`, `{j}/api/v1/contexts/{id}` | Journal create / read / update — the journal portfolio |
| `{j}/api/v1/announcements`, `index/api/v1/announcements` | **Announcements — OJS's native home for a call for papers** |
| `{j}/api/v1/issues` | Issues, and whether an issue is published |
| `{j}/api/v1/sections` | Section → article-type mapping |
| `{j}/api/v1/submissions`, `{j}/api/v1/_submissions` | Submission lists, role-scoped (see §3) |
| `{j}/api/v1/submissions/{id}/publications` | The publication record: title, abstract, authors, galleys |
| `{j}/api/v1/submissions/{id}/publications/{pid}/publish` | **The publish gate.** POST-only — a GET answers `500 "The GET method is not supported for route …"`, which is how we know it is there |
| `{j}/api/v1/submissions/{id}/decisions` | **Editorial decisions.** See the correction in §2.1 |
| `index/api/v1/users`, `{j}/api/v1/users` | User and role administration |
| `{j}/api/v1/stats/publications` | Usage statistics per article |
| `{j}/api/v1/dois` | DOI registration state |
| `{j}/api/v1/emailTemplates` | Notification wording |

### Verified absent

| Route | Consequence |
|---|---|
| `index/api/v1/users/me` | Identity cannot be resolved from a cookie. Already designed around — see [docs/OJS-INTEGRATION.md](OJS-INTEGRATION.md) |
| `{j}/api/v1/reviews`, `{j}/api/v1/reviewAssignments` | No reviewer workspace in the portal. Link out |
| `{j}/api/v1/submissions/{id}/reviewRounds` | Review history cannot be shown. Link out |
| `{j}/api/v1/categories` | 404. No category tree |

### 2.1 A correction to a documented assumption

[docs/OJS-INTEGRATION.md](OJS-INTEGRATION.md) and the dashboard comments state
that OJS 3.5 "exposes no editorial resource". That is right about review rounds
and reviewer assignments, and **wrong about decisions** —
`{j}/api/v1/submissions/{id}/decisions` exists. OJS 3.4 added it for recording
an editorial decision.

This does not change the recommendation to link out for decision-*making*
(recording a decision correctly means notification templates, file visibility
and stage transitions, all of which OJS's own UI handles). It does mean a
**read** of the decision history is probably achievable, which is worth a spike
before Phase 3 because it is the difference between "this paper is at review
stage" and "this paper was accepted on 3 March by Dr X".

**Action:** extend `scripts/ojs-spike.ts` with an authenticated GET on
`/decisions` and record the payload shape.

---

## 3. Four hard problems to solve before any UI

These are the reason this is a plan and not a pull request. Each one changes the
shape of everything downstream.

### P1 — The journal registry is source code, not data

This is the biggest one. "What journals are shown on the site" is currently ten
hand-written TypeScript modules:

```
src/data/journals/{ijdh,ijdm,ijds,ijei,ijic,ijis,ijmc,ijmr,ijqt,ijse}.ts
        ↓  imported into a static array
src/data/registry.ts  →  routes, sitemap, search index, nav menus, journal picker
```

An admin cannot add, hide or reorder a journal without a code change and a
deploy. Every feature you described — "what journals are shown to the site, what
can be added, deleted, they can decide" — is blocked on this.

Three options:

| Option | How it works | Cost | Verdict |
|---|---|---|---|
| **A. Portal DB registry** | Move the ten modules into a `journals` table; registry reads the DB | Full rewrite of the content layer; loses static generation; journal pages go dynamic | Highest cost, most control |
| **B. Derive from OJS `contexts`** | Journals are created in OJS; the harvest pulls `contexts` into `content/harvest.json`; the portal renders what it finds | One source of truth, no duplicate data entry, admin uses OJS's own journal-setup UI | **Recommended** |
| **C. Hybrid — OJS owns existence, portal owns presentation** | B, plus a small `journal_display` table for portal-only fields: `visible`, `sort_order`, `featured`, hero copy | Adds one table and one admin screen; keeps editorial data in OJS | **Recommended as the actual build** |

**Recommendation: C.** A journal exists because it exists in OJS. Whether, where
and how prominently it appears on the public site is a publishing decision the
portal should own, because those fields have no OJS equivalent and inventing
them as OJS custom settings would be abuse of the contexts API. The rich
editorial copy in `src/data/journals/*.ts` (aims, scope, board, policy pages)
can migrate gradually — Phase 2 only needs `visible` and `sort_order` to deliver
real value.

**Note the trap:** `contexts` is site-level and the harvest currently runs on a
service key whose account has roles in **only `ijdh` and `ijdm`** — spike check
2a fails on the other eight. Fix the key's roles before relying on a
contexts-driven registry, or the site will silently lose eight journals.

### P2 — Roles are flat and site-wide, but OJS grants them per journal

`portal_sessions.roles` is one JSON array —
[migrations/002_portal_sessions.sql:34](../migrations/002_portal_sessions.sql#L34).
So `"manager"` means *manager somewhere*, never *manager of IJDH*.
[src/lib/auth/access.ts](../src/lib/auth/access.ts) says so explicitly and
treats itself as a coarse gate only.

An admin panel that acts per journal needs the finer answer. Phase 0 must add
per-journal roles to the session:

```sql
ALTER TABLE portal_sessions ADD COLUMN journal_roles JSON NULL;
-- {"ijdh": ["manager"], "ijqt": ["editor"]}
```

Populated at sign-in from the `currentUser` blob if it carries context roles, or
from `{j}/api/v1/users/{id}` per journal otherwise — **spike this first**, it is
not yet known which.

### P3 — There is no audit log

The panel you described can hide a journal, unpublish a paper and approve a
proposal. Those are consequential, contested, and someone will eventually ask
*who did that and when*. An audit table is not optional for this feature set,
and retrofitting one after the fact means the first months of decisions are
unexplainable.

### P3a — Published content reaches the public site only via a deploy

Discovered while specifying Phase 4, and it is the prerequisite that phase
actually turns on. Three facts, all verified:

1. Article and journal pages are **statically generated** —
   `generateStaticParams()` in
   [src/app/articles/[slug]/page.tsx](../src/app/articles/[slug]/page.tsx#L27)
   and the four journal routes.
2. [src/lib/ojs/harvest-cache.ts](../src/lib/ojs/harvest-cache.ts#L16) reads
   `content/harvest.json` into a module-level `cached` variable that is never
   invalidated while the process lives.
3. [scripts/deploy.sh](../scripts/deploy.sh#L70-L71) runs `npm run harvest`
   immediately followed by `npm run build`. There is no scheduled harvest — the
   systemd unit even notes that `harvest.json` is written by the harvest job and
   not by the server, and `ProtectSystem=strict` means the running service
   could not write it anyway.

**Therefore a paper published in OJS appears on the website at the next deploy,
and not before.** For a build-time static site fed by a snapshot that is
correct and fast; for an admin panel with an *approve and display* button it is
fatal, because the button would set a flag that nothing reads until someone
ships a release.

So Phase 4 cannot be "add a gate". It is "make the publication pipeline
dynamic, then add a gate". Options:

| Option | Shape | Verdict |
|---|---|---|
| **A. Revalidate on approve** | Keep `harvest.json`; call `revalidatePath()` on approve | **Insufficient alone.** Revalidation re-renders the page from the *same stale snapshot*. The new paper is not in it |
| **B. Scheduled harvest + revalidate** | Cron the harvest, then revalidate affected paths | Needs the harvest writable on the server and `resetHarvestCache()` wired to it. Narrows the delay to the cron interval but keeps two sources of truth |
| **C. Harvest into the portal DB** | Harvest writes an `articles` table; pages read it with ISR; `article_display` joins in the gate; approve → revalidate → live | **Recommended.** The display gate and the content then live in the same store, so "approve" is one transaction and one revalidation |

C is real work — it moves the content layer off the static snapshot — which is
why Phase 4 sits late in the sequence and why Phase 3 (read-only, no pipeline
change) should land first.

### P4 — No admin-specific login, and no second credential path

You asked for "a page called /admin where you can log on as admin." **Do not
build a separate admin login.** A second credential path is a second thing to
phish, a second session model to get wrong, and a second place for a password
policy to drift. OJS is already the identity provider and the portal already has
a session.

`/admin` should instead:

- use the existing `ngiq_session` cookie,
- resolve the session **server-side** in the route, not in the browser,
- refuse anyone without `site-admin` with a 404-equivalent (not a 403 — do not
  confirm the page exists to someone who may not know),
- be `robots: { index: false, follow: false }`.

The existing role checks are client-side and cosmetic
([Header.tsx:168](../src/components/mockup/Header.tsx#L168),
[DashboardPage.tsx:347](../src/components/mockup/DashboardPage.tsx#L347)). The
admin panel must not follow that pattern — a hidden control is not an absent
permission.

**Also required:** every mutating admin route needs CSRF protection. The portal
cookie is `SameSite=Lax`, which stops cross-site *form* POSTs but is not a
substitute for a token on a state-changing endpoint reachable from a browser.

---

## 4. Where each thing lives

| Capability | Record of truth | Admin UI | Why |
|---|---|---|---|
| Journal exists | OJS `contexts` | Link out to OJS journal setup | OJS needs a context to hold submissions at all |
| Journal shown on site, order, featured | **Portal** `journal_display` | `/admin/journals` | No OJS equivalent; a publishing decision |
| Journal deleted | OJS | **Never from the portal** | Deleting a context destroys submissions and DOIs. Portal offers *hide*, which is reversible and always the right answer |
| Submissions and stages | OJS | `/admin/submissions` — read-only, cross-journal | OJS has no site-wide queue; this is the real gap |
| Peer review, decisions, reviewer assignment | OJS | Link out | Mature UI exists; see §1 |
| Paper published in OJS | OJS `publications/{id}/publish` | `/admin/submissions` action | Verified POST route |
| Paper visible on the public site | **Portal** `article_display` | `/admin/publishing` | The second gate you described |
| Journal proposals | **Portal** `journal_proposals` *(table already exists)* | `/admin/proposals` | Already modelled, no UI |
| Calls for papers | **Decision needed — see §6** | `/admin/cfps` | Currently hardcoded |
| Users and roles | OJS | Link out, read-only list | Role editing is OJS's job |
| Audit trail | **Portal** `admin_audit` | `/admin/activity` | P3 |

---

## 5. Phases

Ordered so each one ships something usable and nothing is blocked on a decision
not yet made.

### Phase 0 — Foundations (no user-visible feature)

The unglamorous prerequisites. Everything else is unsafe without them.

1. Per-journal roles in the session (P2) — spike the source, then migration `003`.
2. `admin_audit` table (P3): actor `ojs_user_id`, action, target type/id, before/after JSON, `created_at`, source IP.
3. `requireAdmin()` server-side guard, extending
   [src/lib/auth/access.ts](../src/lib/auth/access.ts).
4. CSRF token issue + verify for admin mutations (P4).
5. `/admin` shell: server-rendered, `site-admin` only, noindex, empty.

**Ships:** a locked door with nothing behind it. Correct, and the right place to stop Phase 0.

### Phase 1 — Journal proposals (quick win, zero new architecture)

`journal_proposals` already exists with `status ENUM('received','under_review','accepted','declined')` and a verbatim `payload` column. There is simply no UI.

- `/admin/proposals`: list, filter by status, detail view of the full payload.
- Status transitions, each one audited.
- Acknowledgement email to the proposer on decision — reuses
  [src/lib/email.ts](../src/lib/email.ts). **Blocked on SMTP**, which
  `.env.example` flags as unconfigured with a DKIM warning (audit finding F-07).
  Ship the status change without email; wire email when SMTP is real.
- On *accept*, the next step is "create the context in OJS" — Phase 2. Until
  then, link out and record the decision.

**Ships:** proposals stop sitting in a table nobody reads. No new dependency on any unsettled decision.

### Phase 2 — Journal portfolio control

Depends on P1 decision C.

- Migration: `journal_display` — `journal_slug` PK, `visible`, `sort_order`, `featured`, `hero_copy`, `updated_by`, `updated_at`.
- Harvest extended to pull `index/api/v1/contexts` into `content/harvest.json`.
- `registry.ts` reads harvested contexts joined to `journal_display`, falling back to the existing static modules for any journal not yet migrated — so this lands without a big-bang rewrite.
- `/admin/journals`: toggle visibility, reorder, mark featured, link out to OJS setup. No delete.
- **Fix the service key's roles in all ten journals first** (spike 2a).

**Ships:** "what journals are shown to the site" becomes an admin decision instead of a deploy.

### Phase 3 — Cross-journal submission oversight

The thing OJS genuinely cannot do.

- `/admin/submissions`: one table across all ten journals, using `?scope=all`, which [src/app/api/submissions/route.ts](../src/app/api/submissions/route.ts) now supports and gates.
- Columns: journal, id, title, status, stage, submitted, last activity, days-in-stage.
- Filter by journal, status, stage; sort by staleness — "what has been sitting in review for 90 days" is the question an administrator actually has.
- Every row links to its OJS editorial workflow via the sign-on hand-off.
- Read-only. No decisions here.
- Spike `/decisions` first (§2.1); if the read works, add a decision-history column.

**Ships:** the ten-dashboards problem solved. Highest value per unit of work in this plan.

### Phase 4 — The publish-to-public gate

The subtlest part, and worth being precise about, because "approve whether to display" means two different things:

1. **Publish in OJS** — the paper becomes public *in OJS*, gets its DOI deposited, enters an issue. Verified POST route: `publications/{pid}/publish`.
2. **Display on the portal** — the paper appears on the public website, which is what a reader sees.

These are not the same gate and should not be collapsed. Recommendation:

- OJS publication stays in OJS (`/admin/submissions` offers a link out, not a button — publishing from the portal with an admin's session would bypass OJS's own pre-publication checks on galleys, issue assignment and DOI state).
- The portal adds its own `article_display` gate, defaulting to **mirror OJS**: published in OJS → shown on the site. An admin can override to hold a paper back.
- `/admin/publishing`: queue of newly-harvested publications awaiting display, with approve / hold, audited.

**Prerequisite: P3a.** The gate itself is the easy half. Making an approval
visible on the public site without a deploy means moving the content layer off
the build-time snapshot — option C in P3a. Budget that as the bulk of this
phase; the approve/hold UI on top of it is small.

**Decision needed:** should display default to *shown* (mirror OJS, admin holds back exceptionally) or *held* (every paper needs explicit portal approval)? Mirror is far less work and matches how a journal normally operates; held is stricter and slower. See §6, D2.

### Phase 5 — Calls for papers

Currently [src/data/content/cfps.ts](../src/data/content/cfps.ts): standing calls generated from `journalSlugs`, plus fictional thematic calls behind `NEXT_PUBLIC_DEMO_CONTENT`. No table, no submission form, no approval.

You asked for a propose → approve → display flow mirroring journal proposals. That needs three things, and the storage decision in §6 D3 first:

- `cfp_proposals` table, same shape as `journal_proposals` (payload JSON + status enum).
- A public `/propose-call` form, mirroring `/propose-journal` — which already exists and is the pattern to copy.
- `/admin/cfps`: review, approve, set display window, audited. Approved calls render on the journal page and `/authors`.

**Ships:** guest editors can propose special issues without email, and the fictional demo calls can finally be deleted.

### Phase 6 — Activity and users

- `/admin/activity`: the audit log, readable and filterable. Cheap once Phase 0 exists.
- `/admin/users`: read-only list from `index/api/v1/users` with roles per journal; role editing links out to OJS.

---

## 6. Decisions I need from you

These three change the build and I should not pick them silently.

| # | Decision | Options | My recommendation |
|---|---|---|---|
| **D1** | Where the journal registry lives | A: portal DB · B: derived from OJS · C: hybrid | **C.** OJS owns existence, portal owns presentation |
| **D2** | Default for public display of a published paper | Mirror OJS · Require explicit portal approval | **Mirror**, with an admin hold. Less work, matches normal practice |
| **D3** | Where calls for papers live | OJS `announcements` (verified to exist) · Portal `cfp_proposals` table | **Portal.** You want a propose-and-approve workflow, and OJS announcements have no proposal state. Portal CFPs can still be mirrored into OJS announcements later if editors want them inside OJS |

---

## 7. Sequencing recommendation

Phase 0 → **Phase 1** → **Phase 3** → Phase 2 → Phase 4 → Phase 5 → Phase 6.

Phases 1 and 3 before 2 deliberately: proposals and cross-journal oversight are
pure additions that depend on no unsettled decision, so they ship real value
while D1 is still being decided. Phase 2 is the one that touches the content
layer, and it is better done with the admin shell already proven.

---

## 8. What this plan deliberately does not include

Saying so explicitly, so it reads as a decision rather than an omission:

- **No reviewer or review-round UI.** The APIs do not exist (§2).
- **No decision recording.** Reads may be possible; writing a decision correctly is OJS's job.
- **No journal deletion.** Hide instead. Destroying a context destroys submissions and DOIs.
- **No copyediting or production workflow.** OJS.
- **No role editing.** OJS is the identity provider.
- **No separate admin login.** P4.
