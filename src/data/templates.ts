import type { ContentBlock } from '@/types/content'

/**
 * Manuscript templates under public/templates/<slug>/, built by
 * `npm run templates` (scripts/templates/build.ts). The file names here must
 * match what that script writes.
 */
const base = (slug: string) => `/templates/${slug}`

const latexNote = 'Class file and sample references. Upload the zip to Overleaf as a new project, or compile with pdfLaTeX and BibTeX.'

/** Journals: an anonymised manuscript for double-blind review, plus a separate title page. */
export const journalTemplates = (slug: string, code: string): ContentBlock => ({
  title: 'Manuscript templates',
  paragraphs: [
    `Prepare your manuscript with the ${code} template in Word or LaTeX. Both set out the required sections and declarations, and the reference style used by the journal. The manuscript template is anonymised for double-blind review; give author names, affiliations and acknowledgements on the separate title page.`,
  ],
  downloads: [
    {
      label: 'Manuscript template',
      href: `${base(slug)}/${code}-manuscript-template.docx`,
      format: 'Word (.docx)',
      note: 'Anonymised manuscript with line numbers, headings, table, figure and reference styles.',
    },
    {
      label: 'Title page',
      href: `${base(slug)}/${code}-title-page.docx`,
      format: 'Word (.docx)',
      note: 'Author details, ORCID iDs, acknowledgements, funding and author contributions.',
    },
    {
      label: 'LaTeX template',
      href: `${base(slug)}/${code}-latex-template.zip`,
      format: 'LaTeX (.zip)',
      note: `${latexNote} Includes the title page.`,
    },
  ],
})

/** Magazines: a short two-column article, anonymised, plus a title page carrying the author biographies. */
export const magazineTemplates = (slug: string, code: string): ContentBlock => ({
  title: 'Article templates',
  paragraphs: [
    `Prepare your article with the ${code} Magazine template in Word or LaTeX. The template uses the magazine’s two-column page, so an article that fits in 5 template pages meets the length limit. It is anonymised for double-blind review; give author names, affiliations, biographies and acknowledgements on the separate title page.`,
  ],
  downloads: [
    {
      label: 'Article template',
      href: `${base(slug)}/${code}-article-template.docx`,
      format: 'Word (.docx)',
      note: 'Two-column magazine layout with the length limits, a sidebar, figure, table and reference styles.',
    },
    {
      label: 'Title page',
      href: `${base(slug)}/${code}-title-page.docx`,
      format: 'Word (.docx)',
      note: 'Author details, ORCID iDs, short biographies, acknowledgements and funding.',
    },
    {
      label: 'LaTeX template',
      href: `${base(slug)}/${code}-latex-template.zip`,
      format: 'LaTeX (.zip)',
      note: `${latexNote} Includes the title page.`,
    },
  ],
})

/** Book series: a chapter template for edited volumes and proceedings. */
export const seriesTemplates = (slug: string, code: string): ContentBlock => ({
  title: 'Chapter templates',
  paragraphs: [
    `Contributors to ${code} volumes should prepare chapters and proceedings papers with the series template in Word or LaTeX. Both set out the required sections and declarations, and the reference style used by the series. Monograph authors receive formatting instructions during the proposal process.`,
  ],
  downloads: [
    {
      label: 'Chapter template',
      href: `${base(slug)}/${code}-chapter-template.docx`,
      format: 'Word (.docx)',
      note: 'Headings, author block, table, figure and reference styles.',
    },
    {
      label: 'LaTeX template',
      href: `${base(slug)}/${code}-latex-template.zip`,
      format: 'LaTeX (.zip)',
      note: latexNote,
    },
  ],
})
