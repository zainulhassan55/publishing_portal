# Mockup replication rules

**This document supersedes PORTING-CONVENTIONS.md for all page markup.** The
first port re-interpreted the mockups into Tailwind components and the result
did not look like the mockups. The requirement is now exact replication: the
rendered page must be visually identical to its `*.dc.html` file in
`/Users/krishnayadav/Downloads/UI mockups project/`.

## The one rule

**Copy the mockup markup verbatim.** Do not redesign, do not substitute
utility classes, do not reuse `src/components/ui/*` primitives, do not "improve"
spacing, sizes, colours or copy. If the mockup has

```html
<div style="display:flex;gap:10px;padding:18px 20px;border:1px solid var(--line,#DCE1E6);border-radius:10px;background:var(--surface,#fff)">
```

the JSX is

```tsx
<div style={{ display: 'flex', gap: 10, padding: '18px 20px', border: '1px solid var(--line, #DCE1E6)', borderRadius: 10, background: 'var(--surface, #fff)' }}>
```

Every inline style attribute survives, with its `var(--token, #fallback)` form
intact. Text content is copied word for word.

## Mechanical conversion table

| Mockup | JSX |
| --- | --- |
| `style="a:b;c:d"` | `style={{ a: 'b', c: 'd' }}` (camelCase properties) |
| `{{ expr }}` | `{expr}` |
| `<sc-for list="{{ xs }}" as="x">…</sc-for>` | `{xs.map((x) => (…))}` with a key |
| `<sc-if value="{{ cond }}">…</sc-if>` | `{cond ? (…) : null}` |
| `<dc-import name="Header" …>` | import the replicated component |
| `class Component extends DCLogic { renderVals() {...} }` | the component body: state → `useState`, computed vals → consts, handlers → functions |
| `onclick`/bindings from renderVals | React `onClick` etc. |
| `<image-slot …>` (Home only) | `<img>` / `next/image` with the matching `/images/thumb-N.png` or hero file, same dimensions/object-fit |
| per-page `<style>…</style>` block | copy into the component as `<style>{`…`}</style>` (keyframes and all) |
| `data-rv` / `data-stagger` scroll-reveal | optional: `className="reveal"` (RevealObserver handles it) or omit — never block on it |
| `data-count` count-up | keep the number static; the animation is optional |

Fonts: inline `font-family` values map to the loaded fonts —
`"IBM Plex Sans"...` → `var(--font-sans)`, `"Source Serif 4"...` →
`var(--font-serif)`, `"IBM Plex Mono"...` → `var(--font-mono)`. Everything else
in the style stays as-is.

## Theme

Ink and teal only. The tokens are already fixed in `globals.css`
(`--brand:#0B1416; --accent:#0C8375; --accent-dark:#0A685C;
--accent-soft:#CDF0E7; --accent-tint:#EDFAF5; --warm:#C2410C`), matching
`theme.js`'s `teal` entry, so copied `var(--token, fallback)` styles render
exactly as the mockups do on the default theme.

**Do not port the mockup control panel**: the 12-swatch theme picker, the dim
switch, the hero-image selector and the launch/mature toggle in Header.dc.html
are design-review scaffolding. They are the ONLY parts of any mockup that must
not be replicated. Where `isMature()` branched content, use the populated
branch (the site runs populated).

## URLs

| Mockup href | Route |
| --- | --- |
| `Home.dc.html` | `/` |
| `Journals.dc.html` | `/journals` |
| `Journal.dc.html?j=SLUG` | `/journals/SLUG` |
| `JournalPage.dc.html?j=SLUG&p=ID` | `/journals/SLUG/ID` |
| `Issue.dc.html?j=SLUG` | `/journals/SLUG/current-issue` |
| `Article.dc.html?id=aN` | `articleHrefById('aN')` from `@/data/content` |
| `Search.dc.html?q=…&scope=…&j=…` | `/search?q=…&tab=…&journal=…` |
| `Authors.dc.html` | `/authors` |
| `SignIn.dc.html` | `/sign-in` |
| `Dashboard.dc.html` | `/dashboard` |
| `Profile.dc.html` | `/profile` |
| `Submit.dc.html?j=SLUG&step=N` | `/submit?journal=SLUG&step=N` |
| `ProposeJournal.dc.html` | `/propose-journal` |
| `JournalMasthead` (dc-import) | component `src/components/mockup/JournalMasthead.tsx` |

Internal navigation uses `next/link`; plain `<a>` only for external/OJS links.

## Data mapping (`window.NGIQ` → `src/data`)

The portal data layer carries the same records as `data.js`. The site runs
**populated** — articles, issues and thematic calls all render.

| `NGIQ.*` | Portal equivalent |
| --- | --- |
| `journals` | `journals` from `@/data/registry` — `code` → `journalCode(j)`, `title`, `slug`; `subject`/colour → `subjectFor(slug).label` / `.color`; `scope` → `j.scope` |
| `SUBJ` | `subjects` from `@/data/subjects` (same oklch colours) |
| `articles` | `getArticles()` from `@/data/content` — same 12 records; `authors` are objects, use `.map(a => a.name)` where the mockup used strings; `date` → `formatDate(a.publishedIso)`; `j` → `a.journalSlug` |
| `cfps` | `getCalls()` — thematic calls have `guestEditor`, `deadlineIso`; status/days-left derive via `deadlineState`/`deadlineLabel` (client-side for countdowns) |
| `news` | `getNews()` |
| `pageGroups` | `journalMenuGroups(slug)` from `@/data/registry` |
| `pages` / `pageBlocks(id, j)` | `getJournalPage(slug, id).blocks` — shape `{title, paragraphs, bullets, table, subsections}`; render with the mockup's numbered-section markup |
| `typesTable` | copy the table literal from data.js into the page that uses it |
| `journal(slug)` | `getJournal(slug)` |
| `authorsShort(a)` | `authorsShort(names)` from `@/lib/format` |
| `param(k)` | `useSearchParams()` in a client component |
| `isMature()` | always treat as populated |

## Server/client split (the only structural liberty)

Visual fidelity does not require abandoning static rendering. The pattern:

- `src/app/<route>/page.tsx` — tiny server wrapper: `metadata` /
  `generateMetadata` (+ citation tags and JSON-LD on article routes — these
  MUST be preserved exactly as they are today), data fetched from `@/data/*`,
  passed as props.
- `src/components/mockup/<Page>.tsx` — `'use client'` component holding the
  replicated markup and the ported `renderVals` logic.

Client components still server-render their HTML, so the content stays in the
static output. Wrap in `<Suspense>` when `useSearchParams` is used.

## Behaviour wiring

Where a mockup form or action has a real endpoint, wire it; the UI stays the
mockup's. Contracts (unchanged):

- Sign-in → `POST /api/auth/sign-in` `{email,password}`; 200 → refresh session + redirect; 401 → the mockup's inline error; 503 → show the OJS login link
- Session → `useSession()` from `@/components/auth/SessionProvider` (never localStorage)
- Wizard autosave → `POST /api/drafts`; final submit → `POST /api/drafts/submit` (`mode:'api'|'handoff'`)
- Proposals → `POST /api/proposals`; alerts → `POST /api/alerts`; contact → `POST /api/contact`; prefs → `POST /api/profile/prefs`; ROR → `GET /api/ror?q=`
- Citation export → `buildCitation` from `@/lib/citation`
- Search matching/facets → `@/lib/search-core` (presentation = Search.dc.html markup)

A control with no backend keeps the mockup's visual but must not pretend
(no fake uploads claiming storage, no dead `href="#"`).

## Placement

All replicated page/section components live under `src/components/mockup/`
(one file per mockup page, plus shared pieces like `JournalMasthead.tsx`).
The old interpreted components under `src/components/{home,journals,authors,
article,search,dashboard,profile,submit,propose,layout,publishing,ui}` are
dead once routes point at the replicas — do not import from them.
