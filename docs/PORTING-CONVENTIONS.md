# Code conventions

> Page **markup and styling** are governed by [REPLICATION.md](REPLICATION.md):
> every page is a verbatim copy of its mockup, inline styles included. This
> document covers the rest — data, dates, metadata, accessibility, images.

## Stack

- Next.js 16 App Router, routes under `src/app/`. React 19.
- Tailwind v4 is present but used only for the `<body>` defaults and a few
  motion/utility classes in `src/app/globals.css`. Page styling is inline.
- TypeScript strict, `noUnusedLocals` and `noUnusedParameters` on. Alias `@/` → `src/`.
- House style: no semicolons, single quotes, 2-space indent, 120 col.

## Server vs client components

Public pages must be statically generated — that is the point of the rebuild
(audit F-01: the old SPA was invisible to Google Scholar). The pattern:

- `src/app/<route>/page.tsx` is a **server component**: exports `metadata` /
  `generateMetadata` and `generateStaticParams`, reads `src/data/*`, passes
  plain serialisable props down.
- `src/components/mockup/<Page>.tsx` is the `'use client'` replica holding the
  markup and interaction logic.
- Client components still server-render their HTML, so content stays in the
  static output. Wrap in `<Suspense>` wherever `useSearchParams` is used.
- `params` and `searchParams` are Promises: `const { slug } = await params`.

## Theme

One theme: Ink and teal. Tokens are fixed values in `globals.css`
(`--accent:#0C8375`, `--brand:#0B1416`, `--warm:#C2410C`, plus the neutral
ramp). There is no palette picker and no dim mode.

Never write a raw hex except as a `var(--token, #fallback)` fallback, and never
a `slate-*` / `gray-*` utility — those bypass the token layer, and the old
site's `text-slate-400` on white was an AA contrast failure the audit flagged.

## Reuse before writing

- `src/lib/format.ts` — `formatDate` `formatDateShort` `formatNumber` `daysUntil`
  `deadlineState` `deadlineLabel` `authorsShort` `initials` `wordCount`
  `pluralise` `formatFileSize` `citationAuthor`
- `src/lib/hooks/client-state.ts` — `useHydrated` `useToday` `useMediaQuery`
  `usePrefersReducedMotion`. Hydration-safe; use these rather than a mount
  effect that calls `setState`.
- `src/lib/citation.ts` — `buildCitation` for BibTeX/RIS/EndNote/plain
- `src/lib/search.ts` (server index builder) and `src/lib/search-core.ts`
  (pure matching/facet/sort, safe to import from a client component)
- `src/lib/site.ts` — site constants, nav, footer groups, `doiUrl`, `absoluteUrl`
- `src/lib/validate.ts` — `isEmail` `isOrcid` (real MOD 11-2 checksum) `isRor`
  `isDoi` `Validator`
- `src/components/nav/SectionToc.tsx` — scroll-spy table of contents
- `src/components/submit/validation.ts` — wizard step validation, ORCID state
- `src/components/auth/SessionProvider.tsx` — `useSession`

## Data

- `registry.ts` — `journals` `getJournal` `journalCode` `journalSubject`
  `getJournalPage` `journalPageNeighbours` `journalMenuGroups` `series`
- `subjects.ts` — `subjects` `subjectList` `subjectFor`
- `content/index.ts` — `getArticles` `getArticle` `articleHrefById`
  `articlesForJournal` `latestArticles` `mostDownloaded` `mostCited`
  `currentIssue` `issueArchive` `getCalls` `callsForJournal` `getNews`
  `portfolioStats`
- `policies.ts` — publisher-level policies, the single source for that text
- `issn.ts` — `issnLabel` `electronicIssn`. ISSNs are **not yet assigned**;
  surfaces render "Not yet assigned". Never invent one (audit F-03).
- `journalCovers.ts` / `bookCovers.ts` — `/images/...` paths

### Content is populated

The fixture articles, issues and calls render by default; harvested OJS content
takes precedence once it exists. `NEXT_PUBLIC_DEMO_CONTENT=0` previews the empty
state, which every listing surface still supports.

## Dates

Stored ISO 8601, formatted at render with `formatDate` / `formatDateShort`.
Never store a formatted date, and never derive page content from the current
date in a server component — a static page would bake in the build date.
Anything date-relative (a "14 days left" countdown) uses `useToday()` and
renders nothing until hydration.

## Accessibility

The mockups wired this; replication preserves it.

- `aria-pressed` on toggles, `aria-selected` + `role="tab"` on tabs,
  `aria-expanded` + `aria-controls` on disclosures, `aria-current` on the
  active nav item.
- Every control has an accessible name; icon-only buttons get an `sr-only` span.
- Full keyboard support on anything with arrow-key navigation.
- An auto-advancing carousel needs a visible pause control (WCAG 2.2.2) and
  must not animate under `prefers-reduced-motion`.
- Decorative glyphs get `aria-hidden`.
- No dead controls. A button with nothing behind it is worse than no button —
  the audit found `href="#"` on "Download PDF" and on the contact form in
  production. If a feature is not wired, say so in the UI or omit it.

## Images

`next/image` where the mockup used a sized box; a plain `<img>` is acceptable
inside a replicated block that sets its own dimensions. Always pass `alt`
(empty string for decorative). Hero images get `priority`.

## Metadata

Every route exports `metadata` or `generateMetadata` with a distinct title and
description (audit F-09: the old site had neither). Article routes additionally
emit `citation_*` and Dublin Core tags via `src/lib/citation-meta.ts` and
`ScholarlyArticle` JSON-LD via `src/lib/jsonld.ts`. **Do not remove these** —
they are the entire reason article pages are statically generated.

## Comments

Comment only what the code cannot say: a constraint, a non-obvious reason, an
audit finding being addressed. Do not narrate what the next line does, and do
not leave notes addressed to a reviewer.
