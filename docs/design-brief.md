# Design Brief — NextGenIQ Press Academic Publishing Portal

**How to use this file:** paste the whole thing into a new Claude conversation (claude.ai, with Artifacts enabled). It is written as a direct instruction to the designer. The requested output format at the end (§13) is deliberately specified so the result can be handed straight to Claude Code in this repo via `docs/rebuild-plan.md`.

---

## 1. Your role

You are a senior product designer with 10+ years designing scholarly publishing platforms. You have worked on article pages, journal micro-sites, discovery/search, and manuscript submission systems. You know why publisher interfaces look the way they do: researchers scan, they trust density and typography over decoration, they arrive from Google Scholar on a deep article URL, and librarians and indexing services audit the site for policy transparency.

Design the complete frontend for an independent open-access academic publisher. The output is a **design specification**, not code.

---

## 2. The product

**NextGenIQ Press** — an independent academic publisher. Public portal + author/reviewer submission experience.

**Portfolio (real, fixed):**

- **10 open-access journals**, all continuous publication, double-blind peer review, CC BY 4.0, no submission fee:
  | Code | Title | Subject area |
  |---|---|---|
  | IJDH | International Journal of Digital Health | Digital Health |
  | IJDM | International Journal of Digital Management | Digital Management |
  | IJDS | International Journal of Digital Society | Digital Society |
  | IJEI | International Journal of Entrepreneurship and Innovation | Entrepreneurship & Innovation |
  | IJIC | International Journal of Intelligent Computing | Intelligent Computing |
  | IJIS | International Journal of Interdisciplinary Science | Interdisciplinary Science |
  | IJMC | International Journal of Mathematical Computing | Mathematical Computing |
  | IJMR | International Journal of Multidisciplinary Research | Multidisciplinary Research |
  | IJQT | International Journal of Quantum Technologies | Quantum Technologies |
  | IJSE | International Journal of Smart Electronics | Smart Electronics |
- **2 book series:** ISRI (International Series in Research and Innovation), LNISI (Lecture Notes in Interdisciplinary Science and Innovation)
- **2 proceedings series:** NGIQ-LNCSE (Computer Science & Engineering), NGIQ-LNMR (Multidisciplinary Research)
- Each journal has **22 standardised content pages** (listed in §8.3) generated from one template — the design must make 22 pages per journal navigable without feeling like a sitemap.

**Backend reality:** manuscript workflow runs on OJS (Open Journal Systems). The portal will call the OJS REST API. Design the submission experience as a native part of the portal, not as a link out.

---

## 3. The single most important constraint: the publisher has not published any articles yet

The journals are new and open for submissions. There are **zero published articles and zero real issues** today.

This changes the design problem fundamentally. Elsevier's and Springer's homepages are article-density machines; copying their composition here produces a ghost town. The current site fails exactly this way — it says "No articles published yet", "Articles coming soon" and "Articles will appear here" in three different places on two pages.

**Requirement:** design every content surface in **two states**, and make the empty state look *deliberate and credible*, never apologetic:

- **State A — Launch (today, 0 articles):** credibility comes from scope, editorial standards, named policies, the editorial-board structure, open calls for papers, and the portfolio itself. The homepage leads with *what we publish and how we publish it*, not *what we published this week*. No "coming soon" copy anywhere.
- **State B — Mature (50+ articles, issues per journal):** the same layouts fill with latest articles, issue TOCs, most-read lists, metrics. The transition must require no redesign — only data.

Show both states for: homepage, journal home, article listing, issue archive, current issue, search results.

---

## 4. Audiences and their jobs

Design decisions must be traceable to these. Rank the homepage and nav around them.

| Audience | Primary jobs | Arrives via |
|---|---|---|
| **Author** (largest, highest value) | Is my work in scope? What are the article types and length limits? Is there an APC? What's the review turnaround? How do I submit? Where is my submission now? | Google, journal CFP, colleague |
| **Reader / researcher** | Find a specific article; browse an issue; read full text; export the citation; check the license | **Google Scholar, deep-linked to an article URL** |
| **Reviewer** | Accept/decline an invitation; read the blinded manuscript; submit a structured review | Email invitation link |
| **Editor / guest editor** | Propose a special issue; understand editorial responsibilities | Direct |
| **Librarian / indexing service** | Audit: ISSN, policies, ethics, peer-review model, licensing, preservation, archiving, COPE alignment | Direct, auditing |

---

## 5. Reference set — what to borrow, what to avoid

Study these and say in your output which pattern you took from where.

| Reference | Borrow |
|---|---|
| **ScienceDirect (Elsevier)** | Article page: sticky left TOC with scrollspy, figure/table viewer, references with links, right-hand action rail (PDF, cite, share), declarations block |
| **Springer Link** | Journal micro-site structure; light masthead with cover + ISSN + metrics; "Submit manuscript" as a persistent primary action; search-first header |
| **Wiley Online Library** | Issue TOC grouped by section (Editorial / Research Article / Review); clean metadata typography |
| **Taylor & Francis Online** | Faceted search results; the "For Authors / For Editors / For Librarians" audience split in the top nav |
| **MDPI** | Working well with *new* journals: scope-led journal pages, prominent special issues, explicit review-turnaround and APC transparency. Closest analogue to our launch state |
| **Frontiers** | Transparent peer-review presentation; editorial-board presentation with photos and roles |

**Explicitly avoid:**
- Dark full-bleed gradient heroes on content pages (the current site's biggest problem — a navy `#07131f` hero with a teal radial glow and a grid overlay on *every* page, including Policies and Indexing)
- Hover lifts, shadow growth, grain overlays, slow image drift/zoom, auto-advancing carousels
- Pastel gradient chrome used to colour-code items with no semantic meaning (the current site has 12 such gradients keyed to journal slug)
- Justified body text
- Large corner radii (current site uses 16–20px on content panels)
- Marketing-style "feature card" grids standing in for real content
- Any control that doesn't work, any placeholder string visible to users

---

## 6. Design principles to work to

1. **Typographic hierarchy over decoration.** Structure comes from type scale, weight, rules and whitespace. One accent colour, used almost exclusively for interactive elements.
2. **1px rules before shadows.** Maximum two elevation levels, reserved for overlays (dropdown, modal, toast). Content cards get borders, not shadows.
3. **Stillness.** Transitions 120–200ms, opacity and transform only, no motion on content cards. Full `prefers-reduced-motion` support.
4. **Density is a feature.** Researchers scan. Prefer compact metadata rows and tables over roomy cards. Comfortable for long-form reading, compact for lists and tables.
5. **Reading measure 66–75ch** for all long-form prose (author instructions, policies, article full text).
6. **Light, institutional surfaces.** White and near-white page surfaces. Dark is used sparingly — footer, and at most one deliberate accent band per page.
7. **Credible while empty.** See §3.
8. **WCAG 2.2 AA minimum.** 4.5:1 for text under 24px, 3:1 for large text and UI boundaries, visible focus rings on everything interactive, full keyboard operability.
9. **Mobile-first for readers, desktop-dense for authors and reviewers.** The article page and search must be excellent on a phone; the submission wizard and dashboard may be desktop-optimised with a usable mobile fallback.

---

## 7. Design system to specify

### 7.1 Colour

Deliver a complete token set, with every value's contrast ratio against its intended background stated.

- **Neutral ramp:** 11 steps (0/50/100/200/300/400/500/600/700/800/900/950). This is the backbone — the current site has a 6-step "ink" ramp with a hole in the middle and falls back to Tailwind `slate-*`, producing two competing greyscales. One ramp only.
- **Brand primary:** institutional, used for the brand bar, primary buttons, links. Propose 2 options — one deep navy/ink lineage (continuity with today's `#07131f`) and one that reads more distinctly as a publisher mark. Recommend one.
- **Accent / interactive:** link colour, focus ring, active states. Must pass 4.5:1 on white.
- **Semantic:** success, warning, danger, info — each with a surface, border and text value.
- **Publishing-specific semantic tokens** (this is where a generic system fails a publisher):
  - Open-access status: Gold OA, Green OA, Free access
  - Submission state: Open / Closing soon / Closed (for CFPs and special issues)
  - Manuscript status: Submitted, Under review, Revisions requested, Accepted, In production, Published, Rejected, Withdrawn
  - Article type: Research Article, Review, Editorial, Short Communication, Case Study, Perspective, Erratum/Correction, Retraction
- **Subject-area palette:** 8 fixed, documented hues mapped to subject areas (health, management, society, entrepreneurship, computing, interdisciplinary, mathematics, electronics/quantum). Use for subject tags and thin accents only — never as large decorative fills.
- **Dark mode:** provide the full token mapping. Mark it as phase 2 but specify it now.

### 7.2 Typography

- **Font pairing:** propose 2 options, recommend 1. Must include a licensable/self-hostable serif for headings and article titles, plus a neutral sans for UI, metadata and body. The current pairing is Figtree + Newsreader — Newsreader is appropriate and may be kept; Figtree reads as consumer-fintech and should be reconsidered (candidates: Inter, Source Sans 3, IBM Plex Sans, Libre Franklin). State the rationale.
- **Modular type scale** with named roles. No arbitrary values — the current site uses `1.85rem`, `2.1rem`, `2.65rem`, `2.45rem`, `1.65rem`, `1.15rem`, `1.05rem`, `1.02rem`, `0.98rem` and seven px values. Specify: display, h1, h2, h3, h4, h5, body-lg, body, body-sm, caption, overline/meta, mono. For each: size, line-height, weight, letter-spacing, and whether it's serif or sans.
- **Long-form prose spec separately:** article full text and policy pages — base size, line-height, paragraph spacing, measure, heading spacing above/below, list indentation, blockquote, figure caption, table caption, footnote, equation display.
- **Specify the metadata voice.** Publisher UIs live or die on how `Vol. 1, Issue 2, pp. 45–67 · DOI: 10.xxxx/xxxx · Published 12 March 2026` is set. Give it a dedicated spec: size, colour, separator glyph, wrapping behaviour.

### 7.3 Space, grid, layout

- 4px base. Full scale.
- **Container widths:** marketing/landing (max 1320px), standard content (1200px), content + facet rail (1280px with a 280px rail), long-form reading (720–760px / 66–75ch), article page (three-zone: 240px TOC rail + 720px text + 280px action rail, with documented collapse behaviour at tablet and mobile).
- 12-column grid, gutters, breakpoints (name them, give pixel values).
- Vertical rhythm: section spacing scale for landing pages vs. content pages.

### 7.4 Other foundations

- **Radii:** 2–8px maximum. Specify per component class.
- **Borders:** hairline, default, strong. Default to 1px.
- **Elevation:** two levels only (dropdown/popover, modal/drawer). Specify values.
- **Focus ring:** single spec used everywhere — colour, width, offset, and how it behaves on dark surfaces.
- **Icon system:** name a library (Lucide / Phosphor / Heroicons), sizes (16/20/24), stroke weight, and the publishing-specific icons needed: PDF, HTML, open-access padlock/unlock, DOI, ORCID, CrossMark, citation/quote, download, share, email alert, figure, table, supplementary file, peer review, Creative Commons.
- **Motion:** durations, easings, and the list of what is allowed to animate.

---

## 8. Pages to design

For each page below, specify: page purpose, the section stack in order, the grid/container used, which components appear, the content hierarchy, responsive behaviour at desktop/tablet/mobile, and the **empty / loading / error** states where applicable. Mark each page **P0 / P1 / P2**.

### 8.1 Publisher level

| # | Page | Must contain | Pri |
|---|---|---|---|
| 1 | **Home** | Design for State A (0 articles) *and* State B. Search-first; portfolio browse by subject; editorial standards; open calls; announcements; author CTA | P0 |
| 2 | **Search results** | Query bar with scope selector; facet rail (journal, subject, year range, article type, access, author); result rows with title/authors/journal/DOI/abstract snippet/PDF link; sort; result count; pagination; active-filter chips; zero-results state with suggestions | P0 |
| 3 | **Journals** (browse) | A–Z list view *and* subject-grouped card view; filter by subject; each entry shows cover, title, code, ISSN, subject, access badge, submit link | P0 |
| 4 | **Articles** (browse all) | Same row component as search results, with sort + facets; State A empty design | P0 |
| 5 | **Article detail** | See §8.4 — the most important page on the site | P0 |
| 6 | **Book series** (browse) + **series detail** + **series sub-page** | Mirror the journal pattern; series detail needs "Propose a volume" | P1 |
| 7 | **Proceedings** (series list + series detail) | Volume listing, ISBN, event mode, organiser pathway | P1 |
| 8 | **For Authors** hub | Entry point for: guidelines, article types, templates (Word/LaTeX download), submission checklist, APC & waivers, ethics requirements, AI-use policy, preprint policy, "submit now" | P0 |
| 9 | **For Reviewers** hub | Become a reviewer (form), reviewer guidelines, review criteria, recognition/ORCID, FAQ | P1 |
| 10 | **For Editors** hub | Editorial responsibilities, guest-editor / special-issue proposal form | P2 |
| 11 | **Policies & Ethics** hub + **policy detail** | Hub index with grouping; detail page with sticky TOC. Existing publisher policies: Publication Ethics, Peer Review, Open Access & Licensing, Archiving & Preservation. Add: Complaints & Appeals, Privacy, Advertising, Accessibility Statement | P0 |
| 12 | **Open Access & APC** | What OA means here; APC table per journal (today: none/to be announced); waiver and discount policy; licensing explainer with CC BY graphic | P1 |
| 13 | **Call for Papers** | Card/row list with journal, theme, deadline, status chip (Open / Closing soon / Closed), submit link; filter by journal; sort by deadline | P1 |
| 14 | **Special Issues** | Same, plus guest editors (names, affiliations, photos) and a "propose a special issue" CTA | P1 |
| 15 | **Indexing & Abstracting** | Honest presentation of status (applied/indexed/planned) per service; DOI/metadata infrastructure | P1 |
| 16 | **News / Announcements** + **detail** | Dated list with type chips; detail page | P1 |
| 17 | **About** | Mission, vision, values, editorial governance, publisher facts, team, contact | P1 |
| 18 | **Contact** | Working form with routing categories, validation, success/error states; office channels; response-time expectation | P0 |
| 19 | **404 / 500 / maintenance** | Search box + top destinations; never a silent redirect | P0 |
| 20 | **Legal set** | Privacy, Terms, Cookie policy, Accessibility statement | P1 |
| 21 | **Email alerts signup** | TOC alerts per journal, CFP alerts; modal + standalone page | P2 |

### 8.2 Journal micro-site

| # | Page | Must contain | Pri |
|---|---|---|---|
| 22 | **Journal masthead + navigation shell** | Shared across all 24 journal URLs. **Light, institutional** — not the current dark gradient. Cover image, full title, code, ISSN/eISSN, subject, access + review + license badges, 4 metric tiles, primary "Submit manuscript" + secondary actions. Plus the navigation solution for 22 sub-pages: recommend either a persistent left sidebar on sub-pages or a grouped mega-panel, and justify the choice. Must include journal-scoped search and breadcrumbs | P0 |
| 23 | **Journal home** | Aims & scope summary; latest articles (State A: open calls + scope + standards instead); editorial board preview; announcements; metrics; information index to the 22 pages; submit CTA | P0 |
| 24 | **Journal content page** (×22 per journal) | Long-form template: page header, sticky TOC with scrollspy, block renderer (paragraphs / bullet lists / nested subsections), prev-next page navigation, persistent submit CTA, "last updated" | P0 |
| 25 | **Editorial board** | A real board page: role-grouped (EIC, Co-EIC, Senior Editors, Associate Editors, Advisory, Reviewers), with photo, name, affiliation, country, ORCID link; and a credible State A version for when appointments are pending | P1 |
| 26 | **Current issue** | Issue header (cover, Vol/Issue/Year/date) + TOC grouped by section with article rows (type badge, title, authors, pages, DOI, PDF/HTML links) | P0 |
| 27 | **Archive** | Year → volume → issue drill-down; issue cards with cover and article count; State A design | P0 |
| 28 | **Articles in press / Online first** | Accepted-but-unissued list with accepted date and DOI | P1 |
| 29 | **Peer review process** | A visual flow diagram (submission → desk check → review → decision → production → publication) with turnaround expectations | P1 |

### 8.3 The 22 journal sub-pages (content already exists for all of these)

Design one long-form template that handles all of them, then show how the three structurally distinct ones differ.

- **About (6):** About the Journal · Aims & Scope · Editorial Board · Indexing & Abstracting · News · Editorial Office
- **Authors (6):** Author Instructions · Article Types · Peer Review Process · APC · Reviewer Guidelines · Special Issue Guidelines
- **Policies (6):** Publication Ethics · Open Access · Copyright & Licensing · Generative AI Policy · Research Data Policy · Corrections & Retractions
- **Content (4):** Current Issue · Articles in Press · Special Issues · Call for Papers

Structurally distinct and needing their own treatment: **Author Instructions** (longest, needs the full sticky-TOC treatment and a downloadable-template block), **Article Types** (comparison table: type, word limit, abstract, structure, review model), **APC** (price/waiver table).

### 8.4 Article detail — design this most carefully

The page readers land on from Google Scholar. Three zones at desktop: TOC rail / content / action rail.

**Header block:** article-type badge · OA badge + CC BY licence · title (serif, the largest type on the page) · author list with superscript affiliation markers, corresponding-author marker, ORCID icons · expandable affiliations block · journal name linked, Vol/Issue/pages · DOI as a resolvable link · received / revised / accepted / published dates · CrossMark.

**Action rail (sticky):** View PDF · Download PDF · Cite (dropdown → BibTeX, RIS, EndNote, plain text, copy-to-clipboard with confirmation) · Share · Rights & permissions · Print · Metrics summary (views, downloads, citations, Altmetric placeholder).

**TOC rail (sticky, scrollspy):** Abstract · Keywords · numbered sections · Declarations · References · Figures · Tables.

**Body:** Highlights (bulleted) · Graphical abstract · Abstract · Keywords as linked chips · numbered full text with heading levels · **figures** (inline thumbnail → lightbox, numbered caption, download figure, cross-reference links) · **tables** (horizontally scrollable, numbered caption, download) · display equations · in-text citation links that open a reference popover.

**Tail blocks:** Declarations (funding, conflicts of interest, ethics approval, consent, data availability, author contributions/CRediT, generative-AI use) · Supplementary material list with file type and size · **How to cite** (formatted, copyable) · References (numbered, with DOI/Crossref links and Google Scholar links) · Related articles · Cited by · More from this author.

**Also design:** the mobile layout (both rails collapse — specify how), the PDF-not-available state, and a "retracted article" treatment (banner, strikethrough title, link to retraction notice) — publishers need this and it is always forgotten.

### 8.5 Submission system (author-facing, in-portal)

Visually continuous with the portal. This is what makes it feel like Editorial Manager / SNAPP rather than a bolt-on.

| # | Screen | Must contain | Pri |
|---|---|---|---|
| 30 | **Auth** | Sign in, register (author/reviewer), forgot password, email verification, ORCID sign-in button | P0 |
| 31 | **Submission wizard shell** | 7-step stepper, step validity indicators, save-and-exit, autosave indicator, "resume draft", exit confirmation. Specify desktop + mobile stepper | P0 |
| 32 | **Step 1 — Journal & section** | Journal picker (pre-filled from journal context), section, special-issue selector, scope confirmation | P0 |
| 33 | **Step 2 — Requirements checklist** | Checkbox list, all required, link-outs to guidelines | P0 |
| 34 | **Step 3 — Metadata** | Title, running title, abstract with word counter, keywords chip input (3–8), language, subject categories | P0 |
| 35 | **Step 4 — Authors** | Repeatable author rows (name, email, affiliation with ROR lookup, country, ORCID with validation, corresponding-author radio, CRediT roles), drag-to-reorder, add/remove, "add me as author" | P0 |
| 36 | **Step 5 — Files** | Drag-and-drop zone, per-file type tag (manuscript / anonymised manuscript / title page / figures / tables / supplementary / cover letter), format + size validation, upload progress, reorder, delete, required-file warnings | P0 |
| 37 | **Step 6 — Declarations** | Funding (funder lookup + grant number), COI, ethics approval + consent, data availability statement, generative-AI use disclosure, preprint status, suggested & opposed reviewers | P0 |
| 38 | **Step 7 — Review & submit** | Full read-back with per-section edit links, final confirmation, submit button with loading state | P0 |
| 39 | **Submission confirmation** | Submission ID, what-happens-next timeline, expected first-decision window, link to dashboard, email-receipt note | P0 |
| 40 | **Author dashboard** | Submissions table with status chips, filters, per-submission detail with status timeline, decision letters, co-authors, messages | P0 |
| 41 | **Revision submission** | Decision letter display, point-by-point response-to-reviewers editor, revised-file upload, tracked-changes file, resubmit | P1 |
| 42 | **Proof approval** | Proof PDF viewer, annotation/correction form, approve | P2 |
| 43 | **Reviewer workspace** | Invitation (accept/decline + due date), blinded manuscript access, structured review form (recommendation, per-criterion scores, comments to author, confidential comments to editor, file upload), draft save, submitted-review history, reviewer profile with subject interests and availability toggle | P1 |

---

## 9. Components to specify

For each: anatomy, all variants, all sizes, every state (default / hover / focus-visible / active / disabled / loading / error / read-only), spacing, and accessibility notes (role, labelling, keyboard behaviour).

**Primitives:** Button (primary, secondary, tertiary/ghost, danger, link; sm/md/lg; icon-only; loading; with leading/trailing icon) · IconButton · Link (inline, standalone, external with affordance) · Input · Textarea (with counter) · Select · Combobox/Autocomplete · Checkbox · Radio · Switch · ChipInput/TagInput · FileUpload/Dropzone · FormField (label, hint, error, required marker) · Fieldset · Badge · Tag/Chip (removable) · Avatar · Tooltip · Popover · Dropdown menu · Dialog/Modal · Drawer/Sheet · Toast · Alert/Callout (4 semantic) · Skeleton · Spinner · ProgressBar · Breadcrumb · Pagination · Tabs · Accordion · Table (sortable, sticky header, responsive strategy) · Stepper · Timeline · EmptyState · ErrorState · CopyButton · VisuallyHidden · SkipLink.

**Publishing-domain components (these are the ones that make it feel like a publisher):**
- `SearchBar` — with scope selector and typeahead
- `FacetGroup` / `FacetPanel` — checkbox facets with counts, show-more, year-range slider
- `ActiveFilters` — removable chips + clear-all
- `ArticleResultRow` — type badge, title, author list, journal/vol/issue/pages, DOI, abstract snippet, PDF/HTML actions, access badge. **The single most reused component on the site; design it with great care.**
- `ArticleCard` — compact variant for related/most-read lists
- `JournalCard` — cover, title, code, ISSN, subject, badges, submit link. Two densities
- `JournalMasthead`
- `IssueCard` + `IssueTocSection`
- `CoverImage` — fixed aspect ratio, consistent frame, fallback for missing cover
- `AuthorByline` — names, affiliation markers, corresponding-author marker, ORCID, truncation with "+ N more"
- `AffiliationList`
- `MetadataRow` — the `Vol · Issue · pp · DOI · date` line
- `DoiLink`, `OrcidLink`, `CrossmarkBadge`
- `AccessBadge` (Gold OA / Green OA / Free)
- `LicenseBadge` (CC BY 4.0, with icon)
- `ArticleTypeBadge`
- `StatusChip` (CFP open/closing/closed; manuscript status)
- `CitationExport` — dropdown + copy confirmation
- `HowToCite`
- `ReferenceList` + `ReferenceItem` + citation popover
- `FigureBlock` + `FigureLightbox`
- `TableBlock`
- `EquationBlock`
- `SupplementaryFileList`
- `DeclarationsBlock`
- `MetricsPanel`
- `TocRail` — sticky, scrollspy, nested
- `ContentBlockRenderer` — renders the existing `ContentBlock` shape: `{ title, paragraphs[], bullets[], subsections[] }`. Specify how bullets are set — the current site puts every bullet in its own bordered box, which is wrong for 20-item lists
- `PrevNextPager` — for moving through the 22 journal pages
- `SubmitCta` — persistent journal-scoped call to action
- `EditorialBoardMember`
- `PeerReviewFlowDiagram`
- `AlertSignupForm`
- `WizardShell` + `WizardStep` + `WizardReview`
- `SubmissionStatusTimeline`
- `ReviewForm`

---

## 10. Content and copy direction

- Voice: precise, institutional, factual. No marketing adjectives ("cutting-edge", "world-class", "groundbreaking"). Publishers state facts; researchers verify them.
- Never show placeholder data to users. The current site renders the literal string **"ISSN Sample"** on every journal card and masthead — specify how an unassigned ISSN is presented instead (e.g. "ISSN: applied for", or omit the field entirely).
- Give exact microcopy for: empty states (per surface), form validation messages, submission-step help text, status chip labels, and the what-happens-next confirmation copy.
- Date format: one convention, stated (recommend `12 March 2026`).
- Specify author-list truncation rules and how 20+ author lists behave.

---

## 11. Accessibility requirements

WCAG 2.2 AA. In your output, state explicitly:
- Contrast ratio for every text/background token pair
- Focus-ring spec and how it renders on dark surfaces
- Keyboard interaction for: navigation mega-menu/sidebar, journal subnav dropdowns, search facets, article TOC, figure lightbox, citation-export dropdown, wizard stepper, file dropzone, tables
- Heading-level outline per page template (one `h1`, no skipped levels)
- Skip-to-content placement
- Required ARIA roles/labels per interactive component
- Reduced-motion behaviour

---

## 12. Technical constraints to design within

- React 19 + TypeScript + **Tailwind CSS v4** (tokens go in a `@theme` block as CSS custom properties). Express colour, spacing, radius, type and shadow tokens so they map 1:1 to Tailwind v4 theme variables.
- Fonts must be self-hostable (name the exact families/weights; keep it to ≤4 font files).
- Icons from one open library.
- Content comes from a typed data layer, not a CMS. Existing shapes to design against: `JournalDetail`, `JournalPage`, `ContentBlock`, `ArticleDetail`, `IssueArchive`, `Policy`, `InfoCard`, `BookSeriesDetail`.
- Articles, issues and submissions will come from the **OJS REST API** — so every data-backed surface needs loading, empty and error states.
- The site will be prerendered/SSR'd for SEO — avoid designs that depend on client-only measurement for first paint.
- No heavy chart or animation libraries.

---

## 13. Required output format

Produce the following, in this order. Be specific and exhaustive — this is going to a developer agent, not a human who can fill gaps.

1. **Design rationale** (≤600 words) — the positioning decision, the font and colour recommendation with reasoning, how you solved the zero-articles problem, how you solved 22-pages-per-journal navigation, and which reference pattern you took from where.
2. **`tokens.css`** — a complete Tailwind v4 `@theme` block: every colour (with contrast ratios in comments), font family, font size + line-height + weight + letter-spacing, spacing step, radius, border width, shadow, duration, easing, z-index, container width. Include the dark-mode mapping.
3. **Token reference table** — token name → value → where it's used → contrast ratio where applicable.
4. **Component specifications** — one block per component from §9: anatomy, variants, sizes, all states, spacing values in tokens, accessibility notes. Include an ASCII/text wireframe for the 10 most structurally complex (`ArticleResultRow`, `JournalMasthead`, `ArticleCard`, `TocRail`, `FacetPanel`, `IssueTocSection`, `WizardShell`, `SubmissionStatusTimeline`, `AuthorByline`, `FigureBlock`).
5. **Page specifications** — one block per page from §8: purpose, container, section stack in order, components used, grid, responsive behaviour at ≥1280 / 768–1279 / <768, and empty/loading/error states. Include a text wireframe for every **P0** page.
6. **Visual mockups as Artifacts** — self-contained HTML+CSS pages (inline styles only, no external requests), light and dark where specified, for: **Home (State A and State B)**, **Search results**, **Journal home**, **Journal content page with sticky TOC**, **Article detail (desktop + mobile)**, **Issue TOC**, **Submission wizard step 4 (Authors) and step 5 (Files)**, **Author dashboard**. These are the reference renderings the developer will match.
7. **Interaction specifications** — for search + facets, article TOC scrollspy, figure lightbox, citation export, journal navigation, and the wizard (validation timing, autosave, error recovery).
8. **Content/microcopy appendix** — all empty-state copy, validation messages, status labels, badge labels, confirmation copy.
9. **Implementation notes for the developer** — build order, what to build once and reuse, known hard parts, what to defer to phase 2.
10. **Open questions** — anything you needed to decide without information, with the assumption you made.

Design quality bar: a researcher landing on the article page should not be able to tell this isn't a major publisher. Start with the design rationale, then work through in order.
