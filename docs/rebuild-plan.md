# Rebuild Plan — instructions for Claude Code

**How to use this file:** once the design spec comes back from the design conversation, save it into this repo (see §1), then work through the phases below. Each phase has a **ready-to-paste prompt**. Run them one at a time, in order, and review the diff before moving on. Do not paste more than one phase at once — the phases have dependencies and a single mega-prompt produces worse results than eight scoped ones.

---

## 1. Before you start — put the design spec in the repo

Save the design output as files so Claude Code can read them rather than being told about them:

```
docs/design/
  rationale.md            # §1 of the design output
  tokens.css              # §2 — the Tailwind v4 @theme block
  tokens-reference.md     # §3
  components.md           # §4
  pages.md                # §5
  interactions.md         # §7
  microcopy.md            # §8
  notes.md                # §9 + §10
  mockups/                # §6 — save each Artifact as .html here
    home-launch.html
    home-mature.html
    search-results.html
    journal-home.html
    journal-content-page.html
    article-detail.html
    article-detail-mobile.html
    issue-toc.html
    wizard-authors.html
    wizard-files.html
    author-dashboard.html
```

The mockup HTML files matter more than any prose: Claude Code can read them directly and match the rendering.

Then create a working branch:

```bash
git checkout -b frontend-redesign
```

---

## 2. Ground rules to state in every prompt

Paste this block at the top of each phase prompt. It prevents the most common failure modes.

```
GROUND RULES
- Read docs/frontend-audit.md and docs/design/*.md before changing anything.
- Design authority: docs/design/tokens.css and docs/design/mockups/*.html are the source of
  truth for visual output. Where prose and mockup disagree, the mockup wins. Where the design
  spec is silent, ask rather than invent.
- Keep the existing data layer and content: src/data/journalTemplate.ts, src/data/journals/*,
  src/data/books/*, src/data/siteContent.ts, src/types/content.ts. Extend these types; do not
  rewrite the content. The 22-page-per-journal template is the most valuable asset in the repo.
- Keep the route shape in src/App.tsx (layout routes + outlet context). Add routes; don't
  restructure the existing ones unless the phase says to.
- Tailwind v4 only. All design values come from the @theme block in src/index.css. No arbitrary
  values (no text-[1.85rem], no shadow-[0_8px_22px_...]). If a value isn't in the token set,
  add a token.
- One greyscale. Use the project's neutral ramp; never Tailwind's slate-*/gray-*/zinc-*.
- Accessibility is not optional: visible focus-visible on every interactive element, one h1 per
  page, no skipped heading levels, 4.5:1 contrast for text under 24px, full keyboard operability.
- No new dependencies without asking first. State the package, why, and its size.
- Run `npm run build` and `npm run lint` before reporting a phase complete. Both must pass clean.
- Report honestly: list what you did NOT finish and why.
```

---

## 3. Phase 0 — Clean-up and safety net

Small, independent, zero design dependency. Do this first; it removes the credibility blockers from `frontend-audit.md` §6.1 immediately, even before any design lands.

```
GROUND RULES
<paste §2>

TASK — Phase 0: remove credibility blockers and dead code.

1. ISSN placeholders. The literal string "ISSN Sample" / "eISSN Sample" is rendered to users in
   src/data/journalTemplate.ts (lines ~918, 934-935), src/data/books/isri.ts, src/data/books/lnisi.ts,
   and hardcoded in src/components/shared/PortfolioCard.tsx:69. Make ISSN optional in the
   JournalDetail / BookSeriesDetail / Journal / BookSeries types, set it to undefined in the data,
   and make every consumer render "ISSN: applied for" when it is absent. Remove the hardcoded
   string in PortfolioCard entirely.

2. Dead controls. Either make them work or remove them:
   - src/components/shared/FilterBar.tsx is decorative (no state, no handler) and appears on
     /articles, /news, /proceedings, /special-issues. Make it a real controlled filter: lift state
     into each page, filter the item list, show an active state, make it keyboard-operable with
     aria-pressed. Where a page has nothing meaningful to filter, remove the FilterBar from it.
   - src/pages/ContactPage.tsx: the form has no onSubmit and "submits" via <a href="#">. Convert to
     a real <form> with a submit <button type="submit">, required-field validation, inline error
     messages, and submitting/success/error states. Wire it to a mailto: fallback for now and leave
     a clearly marked TODO for the endpoint.
   - src/pages/ArticleDetailPage.tsx:274-281: the "Reader actions" panel lists "Download PDF",
     "Copy citation", "View related articles" as plain <p> text, and the Download PDF button points
     to "#". Remove the fake panel and disable the download action when no PDF URL exists.

3. 404. src/App.tsx:56 redirects unknown paths to "/". Replace with a real NotFoundPage: h1,
   explanation, a search box placeholder, and links to Journals / Articles / For Authors / Contact.
   Same for an unknown journal slug (JournalLayout) and unknown book slug (BookSeriesLayout) —
   those currently redirect silently too.

4. Dead code: delete src/components/shared/StatCard.tsx (0 usages) and public/icons.svg (unused
   template leftover containing a Bluesky icon). Confirm with a grep before deleting.

5. Accessibility quick wins:
   - Add a skip-to-content link in SiteLayout and id="main-content" + tabIndex={-1} on <main>.
   - Add a global :focus-visible ring in src/index.css that applies to links, buttons, and
     interactive cards — not just .btn.
   - Remove the .prose-justify justified-text rules (src/index.css:85-101) and all 7 usages of
     the class, plus the inline `text-justify` classes in PageHero.tsx and JournalLayout.tsx.
     Body copy is left-aligned.
   - The home hero auto-advances every 7s with no pause control (WCAG 2.2.2). Add a pause/play
     control, or stop auto-advancing.

Do not change any visual design beyond what these fixes require. Report what you changed per item.
```

---

## 4. Phase 1 — Token layer and foundations

```
GROUND RULES
<paste §2>

TASK — Phase 1: replace the design-token layer.

Read docs/design/tokens.css and docs/design/tokens-reference.md.

1. Rewrite the @theme block in src/index.css from docs/design/tokens.css: the full neutral ramp,
   brand/accent, semantic colours, publishing-semantic colours (access status, submission status,
   manuscript status, article type), subject-area palette, the modular type scale (size +
   line-height + weight + letter-spacing per role), the spacing scale, radii, border widths, the
   two elevation levels, durations, easings, z-index scale, and container widths.

2. Self-host the fonts named in the design spec. Add them to src/assets/fonts/, declare @font-face
   with font-display: swap, and remove the Google Fonts <link> tags from index.html. Keep it to
   four font files or fewer.

3. Replace the hand-written CSS utility classes in src/index.css. Today there are ~700 lines
   including .btn + 6 variants, .card, .card-quiet, .card-cover, 12 .portfolio-tone-* pastel
   gradients, .badge, .meta, .section-y, .metric-strip, .field, .surface, .hero-panel,
   .section-rule, .site-nav-link, .series-tab, .article-row, .service-tile, the .home-hero-*
   family and 3 keyframe animations. Anything that becomes a React component in Phase 2 should
   leave src/index.css. What remains should be: resets, @font-face, the @theme block, base
   element styles, the focus-visible ring, prose styles for long-form content, and the reduced-
   motion block. Delete the 12 .portfolio-tone-* gradients.

4. Add a src/lib/tokens.ts exporting the subject-area → token mapping and the status → token
   mappings, so components don't hardcode colour decisions.

5. The site must still build and every route must still render after this phase, even if it looks
   half-migrated. Do not start component work here.

Deliverable: a diff of src/index.css, index.html, the new font assets, and src/lib/tokens.ts, plus
a list of every utility class you removed and which component will own it in Phase 2.
```

---

## 5. Phase 2 — Primitive component library

```
GROUND RULES
<paste §2>

TASK — Phase 2: build the primitive component library in src/components/ui/.

Read docs/design/components.md. Build the primitives only — no publishing-domain components, no
page work. One component per file, named exports, full TypeScript props, forwardRef where it
matters.

Build: Button, IconButton, Link, Input, Textarea (with character counter), Select, Combobox,
Checkbox, Radio, Switch, ChipInput, FileDropzone, FormField, Fieldset, Badge, Tag, Avatar, Tooltip,
Popover, DropdownMenu, Dialog, Drawer, Toast (with a provider), Alert, Skeleton, Spinner,
ProgressBar, Breadcrumb, Pagination, Tabs, Accordion, Table, Stepper, Timeline, EmptyState,
ErrorState, CopyButton, VisuallyHidden, SkipLink, Icon.

Requirements:
- Every variant, size and state from the spec: default, hover, focus-visible, active, disabled,
  loading, error, read-only. Nothing styled with arbitrary Tailwind values.
- Accessibility per the spec: correct roles, labelling, and keyboard behaviour. DropdownMenu and
  Combobox need arrow-key/Home/End/Escape handling and focus return on close. Dialog and Drawer
  need focus trap, Escape to close, and scroll lock. Tabs need arrow-key navigation.
- Replace ActionLink with the new Button/Link pair. ActionLink is used in 22 files and conflates
  react-router Link, <a> and <button>; the replacement must distinguish them and must render an
  external-link affordance for off-site targets (the OJS links).
- For icons, use the library named in the design spec. If it needs a dependency, ask first.
- Add src/components/ui/index.ts barrel exports.

Deliverable: the component files, plus a single route at /_dev/ui (dev-only, not in the nav) that
renders every component in every variant and state so I can review them visually in one place.
```

---

## 6. Phase 3 — Shell: header, footer, navigation, SEO

```
GROUND RULES
<paste §2>

TASK — Phase 3: rebuild the application shell.

Read the Home, Journal and navigation sections of docs/design/pages.md and the matching mockups.

1. SiteHeader. Replace src/components/layout/SiteHeader.tsx. The current header buries the
   author-critical pages (Guidelines, Policies, CFP, Indexing, News) in an 11px dark utility strip
   that only shows 4 of 7 links on desktop. Build the design's audience-based navigation
   (For Authors / For Reviewers / For Editors as first-class entries) with the mega-menu or
   dropdown pattern the design specifies, a prominent global search entry, and the Login/Submit
   actions. Full keyboard support; mobile drawer; sticky behaviour per the spec.

2. SiteFooter. Rebuild per the design, including the legal link group (Privacy, Terms, Cookies,
   Accessibility statement) which does not exist today.

3. Breadcrumbs. Add a Breadcrumb component driven by the route tree and render it on every page
   except Home. The site has 263 URLs nested up to three levels deep (/journals/ijdh/
   author-instructions) and currently has no breadcrumbs at all.

4. Containers. Replace the single max-w-7xl Container (used in 27 files) with the container
   variants from the design spec: marketing, content, content-with-rail, long-form reading
   (66-75ch), and the article three-zone layout. Keep the component name and add a `width` prop so
   the migration is mechanical.

5. SEO. This is a P0 item from the audit — all 263 URLs currently serve one static <title> and
   <meta description> from index.html, and there are no Google Scholar citation meta tags.
   - Add a <Seo> component (react-helmet-async or React 19 native document metadata — propose
     which and why) setting per-page title, description, canonical, and Open Graph tags.
   - Add a JSON-LD helper emitting Organization (publisher), Periodical (journal), and
     ScholarlyArticle (article) structured data.
   - Add Highwire Press citation meta tags on the article page: citation_title, citation_author
     (repeated), citation_journal_title, citation_issn, citation_volume, citation_issue,
     citation_firstpage, citation_lastpage, citation_doi, citation_publication_date,
     citation_pdf_url, citation_abstract_html_url. Without these, Google Scholar will not index
     the articles.
   - Add a build-time generated sitemap.xml covering all journal and content routes, plus robots.txt.
   - Tell me what prerendering/SSR option you recommend for this Vite SPA (vite-plugin-ssr,
     vite-prerender-plugin, or migrating to a framework) and the trade-offs. Do not migrate
     frameworks in this phase.

6. Route-level code splitting with React.lazy + Suspense, with a route-level loading skeleton. The
   960-line journal template and all 10 journal specs are currently in the initial bundle.

Deliverable: new shell components, the Seo/JsonLd utilities, the sitemap generator, and a report on
bundle size before and after.
```

---

## 7. Phase 4 — Publishing-domain components

```
GROUND RULES
<paste §2>

TASK — Phase 4: build the publishing-domain components in src/components/publishing/.

Read docs/design/components.md and the mockups. Build these on top of the Phase 2 primitives:

SearchBar, FacetGroup, FacetPanel, ActiveFilters, ArticleResultRow, ArticleCard, JournalCard,
JournalMasthead, IssueCard, IssueTocSection, CoverImage, AuthorByline, AffiliationList,
MetadataRow, DoiLink, OrcidLink, CrossmarkBadge, AccessBadge, LicenseBadge, ArticleTypeBadge,
StatusChip, CitationExport, HowToCite, ReferenceList, ReferenceItem, FigureBlock, FigureLightbox,
TableBlock, EquationBlock, SupplementaryFileList, DeclarationsBlock, MetricsPanel, TocRail,
ContentBlockRenderer, PrevNextPager, SubmitCta, EditorialBoardMember, PeerReviewFlowDiagram,
AlertSignupForm.

Notes on the hard ones:
- ArticleResultRow is the most reused component on the site. Get its metadata typography, author
  truncation and action affordances exactly right against the mockup.
- TocRail needs IntersectionObserver scrollspy, nested heading levels, smooth scroll with
  scroll-margin offset for the sticky header, keyboard navigation, and a mobile collapse. It
  replaces the current flat anchor-chip cloud that only appears when a page has more than 3 blocks.
- ContentBlockRenderer renders the existing ContentBlock shape
  { title, paragraphs?, bullets?, subsections? } used by all 220 journal content pages. The current
  implementation wraps every single bullet in its own bordered box, which looks wrong for the
  20-30 item topic lists. Follow the design spec's list treatment.
- CoverImage must enforce one aspect ratio and frame for all 12 covers, with a typographic fallback
  for a missing cover. Add width/height, loading="lazy", decoding="async", and a responsive srcset.
- CitationExport must generate real BibTeX, RIS, EndNote and plain-text output from ArticleDetail,
  with copy-to-clipboard and a confirmation. Put the formatters in src/lib/citation.ts with unit
  tests (ask before adding a test runner).
- Delete src/components/shared/* as each component is superseded. Report anything left over.

Deliverable: the components, src/lib/citation.ts, and these added to the /_dev/ui gallery.
```

---

## 8. Phase 5 — Content types and data layer

```
GROUND RULES
<paste §2>

TASK — Phase 5: extend the data layer for real publishing data.

1. Extend src/types/content.ts. The current ArticleDetail is far too thin for a real article page
   (slug, title, authors as string[], journal, doi, published, volumeIssue, abstract, keywords,
   type). Model properly:
   - Author: givenName, familyName, affiliationIds[], orcid?, isCorresponding, email?,
     creditRoles[]
   - Affiliation: id, name, department?, city?, country?, rorId?
   - ArticleDetail: + articleType, sections (structured full text), figures[], tables[], equations[],
     references[], supplementaryFiles[], declarations (funding, conflicts, ethics, consent,
     dataAvailability, authorContributions, aiUse), dates (received, revised, accepted, published,
     online), pageRange, license, pdfUrl, htmlUrl, metrics?, isRetracted?, retractionNoticeUrl?
   - Reference: ordinal, rawText, doi?, url?, authors?, year?, title?, source?
   - Figure / Table: id, label, caption, src/html, downloadUrl?, altText
   - Issue: journalSlug, volume, number, year, publishedDate, coverUrl?, sections[] of
     { name, articleSlugs[] }
   - Replace the IssueArchive stub, which has one fake issue per journal.
   - EditorialBoardMember: name, role, affiliation, country, orcid?, photoUrl?
   - SpecialIssue: + guestEditors[], deadline, status
   - CallForPapers: + journalSlug, deadline, status

2. Keep every existing journal/book spec compiling. Make new fields optional where the content
   doesn't exist yet.

3. Build the OJS data layer in src/lib/ojs/:
   - A typed client for the OJS REST API (/api/v1/contexts, /issues, /submissions, /users)
   - Mappers from OJS payloads to the types above
   - Env config for base URL and API token (extend .env.example)
   - Propose the fetching library (TanStack Query is the obvious choice — ask before adding) and
     implement loading / empty / error states as reusable hooks
   - A mock/fixture mode so the UI can be built and reviewed before OJS is populated: 3 realistic
     fixture articles, 2 fixture issues, and a fixture editorial board, behind a VITE_USE_FIXTURES
     flag. These must never ship enabled in production.

4. Document the data flow in docs/data-layer.md: what is static TypeScript content, what comes from
   OJS, and how the two are joined.

Deliverable: the extended types, the OJS client and mappers, the fixtures, and docs/data-layer.md.
Report which API endpoints you could not verify and need checking against the live OJS install.
```

---

## 9. Phase 6 — Page rebuild

Run this as several smaller prompts, in this order, not as one. Each sub-step ends with a working, reviewable site.

**6a — Journal micro-site** (biggest win: 240 of 263 URLs)
```
GROUND RULES
<paste §2>

TASK — Phase 6a: rebuild the journal micro-site.

Read the journal page specs in docs/design/pages.md plus mockups/journal-home.html and
mockups/journal-content-page.html.

1. JournalMasthead: replace the dark #07131f gradient hero (JournalLayout.tsx:20-91) with the
   light institutional masthead from the design: cover, title, code, ISSN/eISSN, subject, access +
   review + license badges, metric tiles, primary submit CTA, journal-scoped search, breadcrumbs.
2. Journal navigation: implement the design's solution for the 22 sub-pages, replacing
   JournalSubnav's four click-to-open dropdowns triggered by a "▼" text glyph. Full keyboard
   support and correct ARIA.
3. Journal home (JournalDetailPage): per spec, in both State A (0 articles — scope, standards,
   open calls, board) and State B (latest articles, current issue, most read). The state must be
   driven by data presence, not a flag.
4. Journal content page (JournalPageDetailPage): the long-form template with sticky TocRail,
   ContentBlockRenderer, PrevNextPager through the 22 pages, persistent SubmitCta, 66-75ch measure.
5. Three special cases get their own treatment per the spec: Author Instructions (full TOC +
   template downloads), Article Types (comparison table), APC (price/waiver table).
6. Editorial board page: real EditorialBoardMember grid, with the credible State A version for
   pending appointments.
7. Current issue + Archive (year → volume → issue drill-down), both with State A designs. Replace
   JournalArchivePage, which currently shows one fake issue per journal as generic FeatureCards.
8. Apply the same treatment to the book series micro-site, and extract the shared parts:
   BookSeriesLayout duplicates JournalLayout almost line for line (162 vs 167 lines). Create one
   PublicationLayout used by both.

Verify all 240 journal URLs render. Report any that break.
```

**6b — Search and discovery** (the single biggest missing capability)
```
GROUND RULES
<paste §2>

TASK — Phase 6b: build search and discovery.

Read the search specs in docs/design/pages.md + docs/design/interactions.md +
mockups/search-results.html. There is no search anywhere on the site today.

1. A /search route: query input with scope selector, facet rail (journal, subject, year range,
   article type, access, author) with counts, ActiveFilters chips with clear-all, sort control,
   result count, pagination, and a zero-results state with suggestions.
2. Facet and query state in URL search params so results are shareable and back/forward works.
3. The search index: for now, build a client-side index over the static content (journals, the 220
   journal pages, policies, CFPs, special issues, news, book series) plus any articles from the
   data layer. Use the library the design/notes recommend, or propose one (MiniSearch/FlexSearch) —
   ask before adding. Design the module boundary so the index can later be swapped for a
   server-side search without touching the UI.
4. Header search: typeahead with grouped suggestions (journals / articles / pages), keyboard
   navigation, and Enter → full results.
5. Journal-scoped search from the journal masthead, pre-filtering by journal.
6. /articles browse: the same ArticleResultRow + facets + sort, with the State A empty design.
   This replaces a page that currently renders "No articles published yet".
```

**6c — Article page**
```
GROUND RULES
<paste §2>

TASK — Phase 6c: build the article detail page.

Read the article spec in docs/design/pages.md + mockups/article-detail.html +
mockups/article-detail-mobile.html. This is the page readers land on from Google Scholar and it is
currently an 82-line stub that is unreachable (articleDetails is an empty array).

Build the full three-zone layout: TocRail, content, sticky action rail.
- Header: type badge, access + licence badges, serif title, AuthorByline with affiliation markers
  and ORCID, expandable affiliations, journal/volume/issue/pages, resolvable DOI link, the four
  dates, CrossMark.
- Actions: View PDF, Download PDF, CitationExport (BibTeX/RIS/EndNote/plain + copy confirmation),
  Share, Rights & permissions, Print, MetricsPanel.
- Body: Highlights, graphical abstract, Abstract, linked keyword chips, numbered full text,
  FigureBlock with lightbox and per-figure download, TableBlock with download, EquationBlock,
  in-text citation links opening a reference popover.
- Tail: DeclarationsBlock, SupplementaryFileList, HowToCite, ReferenceList with DOI links, related
  articles, cited-by, more-from-author.
- The retracted-article treatment (banner, title treatment, link to the notice) and the
  PDF-unavailable state.
- Highwire citation meta tags + ScholarlyArticle JSON-LD (from Phase 3).
- The mobile layout with both rails collapsed per the mockup.

Verify against the fixture articles from Phase 5.
```

**6d — Publisher pages**
```
GROUND RULES
<paste §2>

TASK — Phase 6d: rebuild the publisher-level pages.

Per docs/design/pages.md and the mockups:
- Home, in both State A and State B, from mockups/home-launch.html and mockups/home-mature.html.
  Remove the HomeHero image carousel with its grain overlay and 18s drift animation.
- Journals browse: A-Z list view + subject-grouped view with a subject filter.
- New hub pages that don't exist today: For Authors, For Reviewers, For Editors, Open Access & APC.
- Policies hub + policy detail with sticky TOC. Add the missing policies: Complaints & Appeals,
  Privacy, Terms, Cookies, Accessibility statement.
- Call for Papers and Special Issues with real status chips and deadline sorting; special issues
  with guest editors.
- Books, Proceedings, Indexing, News (+ news detail), About, Contact (working form), 404/500.
- Delete src/components/shared/CatalogPage.tsx and the five pages built on it
  (Guidelines, Indexing, News, Proceedings, SpecialIssues) in favour of the designed layouts;
  keep the data-driven idea if the design has an equivalent template.
- Delete the five src/components/home/* sections and src/components/layout/PageHero.tsx once their
  replacements are in.

Then remove every remaining usage of the old shared components and confirm
src/components/shared/ is empty.
```

---

## 10. Phase 7 — Submission system

Largest phase. Needs an OJS decision first — see `frontend-audit.md` §8. Confirm the approach before building.

```
GROUND RULES
<paste §2>

TASK — Phase 7: build the author-facing submission experience.

Approach: portal-native React UI on the OJS REST API (option C in docs/frontend-audit.md §8).
OJS stays the system of record. Read the submission specs in docs/design/pages.md +
mockups/wizard-authors.html, mockups/wizard-files.html, mockups/author-dashboard.html.

Before writing code, report: which OJS REST endpoints you will use for each step, which ones you
could not verify, and where you expect gaps (file upload and the review workflow are the known
risk areas). Wait for my confirmation.

Then build, in this order:

1. Auth: sign in, register (author / reviewer), forgot password, email verification, ORCID
   sign-in. Session handling against OJS. Protected routes with redirect-back.
2. WizardShell: 7 steps, per-step validity, autosave with an indicator, save-and-exit, resume
   draft, exit confirmation, desktop + mobile stepper.
3. The 7 steps: (1) journal & section, (2) requirements checklist, (3) metadata with abstract word
   counter and keyword chips, (4) authors — repeatable rows with ROR affiliation lookup, ORCID
   validation, corresponding-author selection, CRediT roles, drag to reorder, (5) files — dropzone
   with per-file type tagging, format/size validation, upload progress, reorder, required-file
   warnings, (6) declarations — funding lookup, COI, ethics, consent, data availability,
   generative-AI disclosure, preprint status, suggested/opposed reviewers, (7) review & submit with
   per-section edit links.
4. Confirmation screen: submission ID, what-happens-next timeline, expected decision window.
5. Author dashboard: submissions table with StatusChip, filters, per-submission detail with
   SubmissionStatusTimeline, decision letters, co-authors.
6. Revision flow: decision letter, point-by-point response editor, revised-file upload, resubmit.
7. Reviewer workspace: invitation accept/decline, blinded manuscript access, structured review
   form (recommendation, per-criterion scores, comments to author, confidential comments to editor,
   file upload), draft save, history.

Validation rules and error recovery per docs/design/interactions.md. Every form field needs a
label, hint, inline error and correct ARIA wiring. Every network call needs loading, success and
error handling — never a silent failure.
```

---

## 11. Phase 8 — Hardening

```
GROUND RULES
<paste §2>

TASK — Phase 8: harden before launch.

1. Accessibility audit. Fix everything: contrast (the old design had text-slate-400 at 2.8:1 and
   .meta at 4.4:1 on small text — verify the new tokens genuinely pass), heading outlines, focus
   order, keyboard traps, screen-reader labels, reduced-motion. Run axe on every page template and
   report the results per page.
2. Performance. Convert all images to AVIF/WebP with responsive srcset and explicit dimensions;
   lazy-load everything below the fold (there is currently no loading="lazy" anywhere); set
   fetchpriority on the hero; verify font loading; check the route-split bundle sizes. Report
   Lighthouse scores for Home, Journal home, Journal content page, Article detail, Search.
3. SEO verification. Every route emits a unique title, description, canonical and OG tags. Validate
   the JSON-LD. Verify the Highwire citation tags against Google Scholar's inclusion guidelines.
   Confirm the sitemap covers every route. Implement the prerender/SSR approach agreed in Phase 3.
4. Error handling. A route-level ErrorBoundary, a data-fetch error state on every data-backed
   surface, and 404 handling for unknown journal slugs, book slugs, page IDs, article slugs and
   issue IDs.
5. Content sweep. Grep for every remaining placeholder: "Sample", "coming soon", "TODO", "Lorem",
   href="#", and any empty-array-driven apologetic copy. Report every hit.
6. Cross-browser and responsive check at 320 / 768 / 1024 / 1280 / 1920 px. Report issues found.
```

---

## 12. Suggested sequencing

| Phase | Depends on | Reviewable output |
|---|---|---|
| 0 — Clean-up | nothing | Dead controls and placeholder strings gone; real 404 |
| 1 — Tokens | design spec | Site builds on the new token layer |
| 2 — Primitives | 1 | `/_dev/ui` gallery |
| 3 — Shell + SEO | 1, 2 | New header/footer/breadcrumbs; per-page meta |
| 4 — Domain components | 2 | Expanded `/_dev/ui` gallery |
| 5 — Data layer | nothing (parallel with 2–4) | Types, OJS client, fixtures |
| 6a — Journal micro-site | 3, 4, 5 | 240 URLs redesigned |
| 6b — Search | 4, 5 | Working faceted search |
| 6c — Article page | 4, 5 | Article page on fixtures |
| 6d — Publisher pages | 3, 4 | All remaining pages |
| 7 — Submission | 2, 3, 5 + OJS decision | Wizard, dashboard, reviewer workspace |
| 8 — Hardening | all | Audit reports |

Phase 0 is worth running today. Phases 1–4 can start the moment the design spec lands. Phase 5 can run in parallel with 2–4 since it touches different files.

---

## 13. Review checklist per phase

Before accepting any phase:

- [ ] `npm run build` passes, `npm run lint` passes clean
- [ ] Every affected route renders; nothing silently redirects
- [ ] No arbitrary Tailwind values introduced (grep for `-[`)
- [ ] No `slate-`/`gray-`/`zinc-` outside the token definitions
- [ ] Keyboard-only pass over every new interactive element
- [ ] No new dependency added without being asked
- [ ] The existing content in `src/data/` still compiles and renders
- [ ] The agent's report says explicitly what it did *not* finish
