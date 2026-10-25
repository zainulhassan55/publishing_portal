# Content restructure (October 2026)

The publisher narrowed the portfolio and supplied new text for the site. This
records what changed in the code, how book-series files are stored, and what is
still open.

## Portfolio

| Kept | Type | Path |
|---|---|---|
| International Journal of Intelligent Computing (IJIC) | Journal | `/journals/ijic` |
| International Journal of Digital Management (IJDM) | Journal | `/journals/ijdm` |
| Advances in AI, Intelligent Systems and Computing (AIISC) | Book series | `/series/aiisc` |
| Lecture Notes in Multidisciplinary Research (LNMR) | Book series | `/series/lnmr` |

Removed: journals IJDH, IJDS, IJEI, IJIS, IJMC, IJMR, IJQT, IJSE; series ISRI,
LNISI, NGIQ-LNCSE (NGIQ-LNMR became LNMR). Their URLs redirect (308) to
`/journals` or `/series`; renamed journal page ids redirect to their new names
(`next.config.ts`, `renamedJournalPages`).

OJS still hosts the removed journals. The harvest still reads them and the
admin screen still lists their papers, but `getArticles()` serves only papers
from journals in the registry, so nothing links to a 404.

## Where the text lives

| Content | File |
|---|---|
| Journal pages (aims, board, guidelines, …) | `src/data/journals/{ijic,ijdm}.ts` |
| Series pages | `src/data/series/{aiisc,lnmr}.ts` |
| Home hero, About, reviewer / editor / librarian text | `src/data/publisher.ts` |
| The 15 policies, in three groups | `src/data/policies.ts` |
| Sub-navigation for journals and series | `src/data/registry.ts` |

All of it is the publisher's wording. Change it only on their instruction.

## Navigation

- Utility bar: For reviewers · For editors · For librarians · Contact
- Main: Journals · Book series · Articles · For authors · Policies · About
- Journal menu: About (aims, board, indexing, archiving, contact) · Authors
  (guidelines, submit, peer review & ethics, open access & fees, special issues)
  · Articles
- Series menu: About · Contributors (propose a volume, guidelines, peer review,
  fees) · Volumes

## Files: journals through OJS, books through the portal

Journal manuscripts and PDFs stay in OJS. Files sent through the portal's
forms go to Cloudflare R2 (S3-compatible, private buckets, free egress):

1. The form asks `POST /api/uploads/sign`; the server checks type and size
   (`src/lib/uploads/policy.ts`) and writes a `pending` row in `uploads`.
2. The browser PUTs the file straight to R2 under `pending/`.
3. On submit the server checks the object exists, has the signed size and
   starts with the right bytes, then moves it under its owner
   (`applications/NGIQ-ED-…`, `proposals/NGIQ-SI-…`).
4. Admins open files from **Admin → Editorial forms** through a five-minute
   signed link; each download is recorded in **Activity**.

Forms: reviewer and board applications (`/reviewers`, `/editors`), special
issue proposals (`/editors/special-issues`), book volume proposals
(`/series/{slug}/propose-volume`), and chapter submissions to volumes with an
open call (`/series/{slug}/volumes/{volume}/submit-chapter`). Data: migration
`005_editorial_forms.sql`.

## Book volumes

**Admin → Book volumes** creates a volume (series, format, contributors,
abstract, ISBNs, DOI, licence), uploads its PDF and cover to the publications
bucket, adds chapters with their own PDFs, and publishes by setting a
publication date (a future date schedules it). Opening the call for chapters
lists the volume under *Calls for chapters* with a submission form. Data:
migration `006_book_volumes.sql`.

Public pages: `/series/{slug}/volumes` (list and open calls) and
`/series/{slug}/volumes/{volume}` (details, chapters, PDF viewer, Google Scholar
`citation_*` tags, schema.org `Book`). PDFs and covers are relayed from R2 on
the site's own domain (`…/pdf`, `…/chapters/{n}/pdf`, `…/cover`).

### R2 setup (one-off)

1. Cloudflare dashboard → R2 → enable (card required; free under 10 GB).
2. Create buckets `ngiq-submissions` and `ngiq-publications`, location
   Automatic, Standard class, public access off.
3. On each bucket, Settings → CORS policy:
   ```json
   [{ "AllowedOrigins": ["https://www.nextgeniqpress.com", "http://localhost:3000"],
      "AllowedMethods": ["PUT", "GET", "HEAD"], "AllowedHeaders": ["Content-Type"],
      "ExposeHeaders": ["ETag"], "MaxAgeSeconds": 3600 }]
   ```
4. On **both** buckets, a lifecycle rule deleting prefix `pending/` after 1 day
   (admin uploads of volume PDFs and covers start in `ngiq-publications/pending/`).
5. R2 → Manage API tokens → **Account** API token, Object Read & Write, scoped
   to the two buckets.
6. Put the `S3_*` values (see `.env.example`) in `.env.local` and
   `~/portal/.env`, then `npm run storage:check` on each machine and
   `pm2 restart ngiq-portal` on the server.
7. For backups, configure an rclone remote for R2 on the server and set
   `R2_RCLONE_REMOTE` for `scripts/backup.sh`.

Until step 6, the forms answer with the editorial email address instead of
accepting files.

## Not built yet

- A form for the expanded new-journal proposal; `/propose-journal` keeps its
  current form.
- Crossref deposits for book and chapter DOIs: register them through Crossref's
  web deposit form and enter the DOI on the volume.

## Open questions for the publisher

1. IJIC editor Surya Prakash is listed at "Institute of Technology Indore";
   another editor is at "Indian Institute of Technology Indore". Same
   institution? The site shows the text as supplied.
2. The About text read "addWrittenress"; the site says "address".
3. Journal fee pages say "current charges and waiver arrangements are disclosed
   on the fees page" and cite "the publisher's published waiver policy". The
   fees page is `/authors#apc` (no APC during the launch period); a waiver
   policy page does not exist yet.
4. The only published paper ("AI in cybersecurity") is in IJDH, which was
   removed. It is no longer shown on the portal; OJS links still resolve to
   OJS. Should it move to IJIC, or stay as an archived IJDH paper?
5. Both journal boards are listed as "Editors", with no Editor-in-Chief, while
   the Special Issue Guidelines refer to the Editor-in-Chief.
