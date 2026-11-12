# Self-hosted fonts

The site's three typefaces, stored here and loaded with `next/font/local` in
`src/app/layout.tsx`. They used to be fetched from Google Fonts during every
`next build`; that download began failing in Turbopack ("next/font/google
queries have exactly one entry", November 2026), which broke deploys, so the
files now live in the repository and the build needs no network for fonts.

These are the exact latin-subset files Google Fonts served for the weights the
site uses (fetched 12 November 2026):

| File | Family | Weights |
| --- | --- | --- |
| `ibm-plex-sans-latin-400-700-variable.woff2` | IBM Plex Sans | 400–700 (variable) |
| `source-serif-4-latin-400-700-variable.woff2` | Source Serif 4 | 400–700 (variable) |
| `ibm-plex-mono-latin-400.woff2` | IBM Plex Mono | 400 |
| `ibm-plex-mono-latin-500.woff2` | IBM Plex Mono | 500 |

Licence: SIL Open Font License 1.1, which permits bundling and redistribution
with the licence text — see `OFL-IBM-Plex.txt` and `OFL-Source-Serif-4.txt`.

To add a weight or a subset, download the matching woff2 from Google Fonts (or
the families' upstream repositories), add it here, and list it in the
`localFont` call in `layout.tsx`.
