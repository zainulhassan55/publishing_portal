/**
 * Builds the downloadable manuscript templates into public/templates/<slug>/:
 * a Word file (plus a separate title page for the double-blind journals and
 * magazines) and a LaTeX package zipped with a compiled sample PDF. Magazine
 * templates use a shorter two-column layout that carries the length limits.
 *
 *   npm run templates
 *
 * Needs `zip` on the PATH. The sample PDF is added only when `pdflatex` and
 * `bibtex` are installed; the zip is complete without it.
 *
 * The publication list is kept here rather than read from src/data/registry.ts,
 * which this script cannot import (path aliases). Add a journal or series in
 * both places, and its downloads in src/data/templates.ts.
 */
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  HeightRule,
  ImageRun,
  LineNumberRestartFormat,
  LevelFormat,
  Math as WordMath,
  MathRun,
  Packer,
  PageNumber,
  Paragraph,
  SectionType,
  ShadingType,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TabStopType,
  TextRun,
  VerticalAlign,
  WidthType,
  type IBorderOptions,
  type ParagraphChild,
} from 'docx'

type Cite = 'numbered' | 'authoryear'
type Publication = { slug: string; code: string; name: string; kind: 'journal' | 'magazine' | 'series'; cite: Cite }

const publications: Publication[] = [
  { slug: 'ijic', code: 'TICR', name: 'Transactions on Intelligent Computing and Reasoning', kind: 'journal', cite: 'numbered' },
  { slug: 'ijdm', code: 'JDMIE', name: 'Journal of Digital Management and Intelligent Enterprises', kind: 'journal', cite: 'authoryear' },
  { slug: 'jqcs', code: 'TQCIS', name: 'Transactions on Quantum Computing and Information Security', kind: 'journal', cite: 'numbered' },
  { slug: 'jaise', code: 'JAAISE', name: 'Journal of Agentic AI for Sustainable Energy', kind: 'journal', cite: 'numbered' },
  { slug: 'reta', code: 'RETA', name: 'Reviews in Emerging Technology and Applications', kind: 'journal', cite: 'numbered' },
  { slug: 'sst', code: 'DTCR', name: 'Digital Trust & Cyber Resilience Magazine', kind: 'magazine', cite: 'numbered' },
  { slug: 'aiisc', code: 'SISDT', name: 'Studies in Intelligent Systems and Digital Technologies', kind: 'series', cite: 'numbered' },
  { slug: 'lnmr', code: 'LNMRI', name: 'Lecture Notes in Multidisciplinary Research and Innovation', kind: 'series', cite: 'authoryear' },
]

/** RETA publishes reviews only; its templates say so up front. */
const retaScopeNote =
  'RETA accepts review and survey manuscripts only. Explain literature identification and selection, critically synthesise evidence, and identify limitations and research priorities. Standalone original experimental papers are outside the scope.'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const outRoot = join(root, 'public', 'templates')
const logo = readFileSync(join(here, 'assets', 'nextgeniq-logo.png'))

/* -------------------------------------------------------------------------- */
/* Word                                                                       */
/* -------------------------------------------------------------------------- */

const INK = '101B27'
const ACCENT = '0C8375'
const MUTED = '505C68'
const FONT = 'Times New Roman'
const PAGE_W = 11906 // A4, DXA
const MARGIN = 1418 // 2.5 cm
const TEXT_W = PAGE_W - 2 * MARGIN

const none: IBorderOptions = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none }
const rule = (size: number, color = INK): IBorderOptions => ({ style: BorderStyle.SINGLE, size, color })

/** Placeholder guidance: grey italic, meant to be replaced. */
const hint = (text: string) => new TextRun({ text, italics: true, color: MUTED })
const p = (children: ParagraphChild[] | string, style?: string) =>
  new Paragraph({ style, children: typeof children === 'string' ? [new TextRun(children)] : children })
/** Received / Revised / Accepted / Published line for the first-page footer, as in Elsevier and IEEE journals. The editorial office fills in the dates. */
const historyLines = () => [
  new Paragraph({
    spacing: { before: 60, after: 0 },
    border: { top: rule(4, 'B9C1C9') },
    children: ['Received', 'Revised', 'Accepted', 'Published'].flatMap((label, i) => [
      ...(i ? [new TextRun({ text: '  |  ', size: 16, color: 'B9C1C9' })] : []),
      new TextRun({ text: `${label}: `, bold: true, size: 16, color: INK }),
      new TextRun({ text: 'DD Month YYYY', size: 16, color: MUTED }),
    ]),
  }),
  new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: 'Article history: completed by the editorial office. Leave as is.', italics: true, size: 15, color: MUTED })],
  }),
]
const h = (level: 1 | 2, text: string) => new Paragraph({ style: `Heading${level}`, children: [new TextRun(text)] })

/** Segments of a reference; `true` marks italic. */
type Seg = string | [string, true]
const segs = (parts: Seg[]) => parts.map((s) => (typeof s === 'string' ? new TextRun(s) : new TextRun({ text: s[0], italics: true })))

const refs: Record<Cite, Seg[][]> = {
  numbered: [
    ['[1]\tJ. Smith and A. Brown, “An example journal article title,” ', ['Journal Name', true], ', vol. 12, no. 3, pp. 45–67, 2024, doi: 10.0000/example.2024.001.'],
    ['[2]\tM.-J. Lee, ', ['An Example Book Title', true], '. City: Publisher Name, 2023.'],
    ['[3]\tL. García and C. Okafor, “An example conference paper title,” in ', ['Proc. Example Conference', true], ', 2022, pp. 101–110, doi: 10.0000/example.2022.010.'],
  ],
  authoryear: [
    ['García, L., & Okafor, C. (2022). An example conference paper title. In ', ['Proceedings of the Example Conference', true], ' (pp. 101–110). https://doi.org/10.0000/example.2022.010'],
    ['Lee, M.-J. (2023). ', ['An example book title', true], '. Publisher Name.'],
    ['Smith, J., & Brown, A. (2024). An example journal article title. ', ['Journal Name, 12', true], '(3), 45–67. https://doi.org/10.0000/example.2024.001'],
  ],
}

const citeText: Record<Cite, { intro: string; related: string; note: string }> = {
  numbered: {
    intro: 'Cite sources by number in square brackets, in order of first citation: Smith and Brown [1] or [2], [3].',
    related: 'Position the study in the existing literature and identify the gap it addresses [3].',
    note: 'List references in the order they are first cited, numbered to match the citations in the text. Include a DOI wherever one exists.',
  },
  authoryear: {
    intro: 'Cite sources by author and year (APA 7th edition): Smith and Brown (2024) or (Lee, 2023; García & Okafor, 2022).',
    related: 'Position the study in the existing literature and identify the gap it addresses (García & Okafor, 2022).',
    note: 'List references alphabetically by first author, following APA 7th edition. Include a DOI wherever one exists.',
  },
}

const styles = {
  default: {
    document: { run: { font: FONT, size: 22, color: INK }, paragraph: { spacing: { line: 288, after: 120 } } },
  },
  paragraphStyles: [
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 26, bold: true }, paragraph: { spacing: { before: 300, after: 120 }, keepNext: true, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true }, paragraph: { spacing: { before: 200, after: 80 }, keepNext: true, outlineLevel: 1 } },
    { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, italics: true }, paragraph: { spacing: { before: 160, after: 60 }, keepNext: true, outlineLevel: 2 } },
    { id: 'ArticleType', name: 'Article Type', basedOn: 'Normal', next: 'Title', run: { size: 18, bold: true, color: ACCENT, allCaps: true }, paragraph: { spacing: { before: 120, after: 80 } } },
    { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 36, bold: true }, paragraph: { spacing: { line: 252, after: 240 } } },
    { id: 'Authors', name: 'Authors', basedOn: 'Normal', next: 'Affiliation', run: { bold: true }, paragraph: { spacing: { after: 60 } } },
    { id: 'Affiliation', name: 'Affiliation', basedOn: 'Normal', run: { size: 20, color: MUTED }, paragraph: { spacing: { after: 20 } } },
    { id: 'AbstractHeading', name: 'Abstract Heading', basedOn: 'Normal', next: 'Abstract', run: { bold: true }, paragraph: { spacing: { before: 240, after: 60 }, border: { top: rule(4, 'B9C1C9') } } },
    { id: 'Abstract', name: 'Abstract', basedOn: 'Normal', run: { size: 20 }, paragraph: { spacing: { after: 100 } } },
    { id: 'Keywords', name: 'Keywords', basedOn: 'Normal', run: { size: 20 }, paragraph: { spacing: { after: 240 }, border: { bottom: rule(4, 'B9C1C9') } } },
    { id: 'Caption', name: 'Caption', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 20 }, paragraph: { spacing: { before: 60, after: 200 }, alignment: AlignmentType.CENTER } },
    { id: 'TableText', name: 'Table Text', basedOn: 'Normal', run: { size: 20 }, paragraph: { spacing: { before: 40, after: 40, line: 240 } } },
    { id: 'Reference', name: 'Reference', basedOn: 'Normal', run: { size: 20 }, paragraph: { spacing: { after: 80 }, indent: { left: 567, hanging: 567 } } },
    { id: 'Declaration', name: 'Declaration', basedOn: 'Normal', run: { size: 20 }, paragraph: { spacing: { after: 80 } } },
  ],
}

const numbering = {
  config: [
    {
      reference: 'bullets',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 567, hanging: 283 } } } }],
    },
  ],
}

const bullet = (children: ParagraphChild[]) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, children })

/** First-page header: the horizontal logo on the left, the title (and volume line, if any) on the right. */
function firstHeader(pub: Publication, line2?: string, textW = TEXT_W) {
  const LOGO_W = 2700
  const cell = (width: number, children: Paragraph[]) =>
    new TableCell({ width: { size: width, type: WidthType.DXA }, verticalAlign: VerticalAlign.CENTER, borders: { top: none, bottom: none, left: none, right: none }, children })
  return new Header({
    children: [
      new Table({
        width: { size: textW, type: WidthType.DXA },
        columnWidths: [LOGO_W, textW - LOGO_W],
        borders: noBorders,
        rows: [
          new TableRow({
            children: [
              cell(LOGO_W, [new Paragraph({ spacing: { after: 0 }, children: [new ImageRun({ type: 'png', data: logo, transformation: { width: 168, height: 35 } })] })]),
              cell(textW - LOGO_W, [
                new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [new TextRun({ text: pub.name, bold: true, size: 20 })] }),
                ...(line2 ? [new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { after: 0 }, children: [new TextRun({ text: line2, size: 17, color: MUTED })] })] : []),
              ]),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 0 }, border: { bottom: rule(12, ACCENT) }, children: [] }),
    ],
  })
}

const runningHeader = (pub: Publication, textW = TEXT_W) =>
  new Header({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: textW }],
        border: { bottom: rule(4, 'B9C1C9') },
        children: [
          new TextRun({ text: `${pub.code} · `, size: 17, color: MUTED }),
          new TextRun({ text: '[Short running title]', size: 17, color: MUTED, italics: true }),
          new TextRun({ children: ['\t', PageNumber.CURRENT], size: 17, color: MUTED }),
        ],
      }),
    ],
  })

const firstFooter = (pub: Publication, textW = TEXT_W) =>
  new Footer({
    children: [
      ...historyLines(),
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: textW }],
        children: [
          new TextRun({ text: `Manuscript prepared for ${pub.name}`, size: 17, color: MUTED }),
          new TextRun({ children: ['\t', PageNumber.CURRENT], size: 17, color: MUTED }),
        ],
      }),
    ],
  })

const page = { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN, header: 708, footer: 708 } }

function authorBlock(): Paragraph[] {
  const sup = (t: string) => new TextRun({ text: t, superScript: true })
  return [
    new Paragraph({ style: 'Authors', children: [new TextRun('First Author'), sup('1'), new TextRun(', Second Author'), sup('2'), new TextRun(' and Third Author'), sup('1')] }),
    new Paragraph({ style: 'Affiliation', children: [sup('1'), new TextRun('Department, University, City, Country')] }),
    new Paragraph({ style: 'Affiliation', children: [sup('2'), new TextRun('Department, Institution, City, Country')] }),
    new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: 'Correspondence: ', bold: true, size: 20 }), new TextRun({ text: 'First Author, first.author@example.org', size: 20 })] }),
  ]
}

function resultsTable(widths = [3070, 2000, 2000, 2000]) {
  const rows = [
    ['Method', 'Precision', 'Recall', 'F1'],
    ['Baseline', '0.81', '0.77', '0.79'],
    ['Proposed', '0.88', '0.85', '0.86'],
  ]
  return new Table({
    width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
    columnWidths: widths,
    layout: TableLayoutType.FIXED,
    borders: noBorders,
    rows: rows.map(
      (row, r) =>
        new TableRow({
          tableHeader: r === 0,
          children: row.map(
            (text, c) =>
              new TableCell({
                width: { size: widths[c], type: WidthType.DXA },
                borders: {
                  left: none,
                  right: none,
                  top: r === 0 ? rule(12) : none,
                  bottom: r === 0 ? rule(6) : r === rows.length - 1 ? rule(12) : none,
                },
                children: [
                  new Paragraph({
                    style: 'TableText',
                    alignment: c === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                    children: [new TextRun({ text, bold: r === 0 })],
                  }),
                ],
              }),
          ),
        }),
    ),
  })
}

/** A light box marking where the figure goes; captions sit below figures. */
function figurePlaceholder(width = TEXT_W) {
  const line = rule(4, 'B9C1C9')
  return new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths: [width],
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        height: { value: 2600, rule: HeightRule.ATLEAST },
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: width, type: WidthType.DXA },
            borders: { top: line, bottom: line, left: line, right: line },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [hint('[Insert figure here]')] })],
          }),
        ],
      }),
    ],
  })
}

function bodySections(pub: Publication): (Paragraph | Table)[] {
  const chapter = pub.kind === 'series'
  const c = citeText[pub.cite]
  const out: (Paragraph | Table)[] = []
  const add = (...items: (Paragraph | Table)[]) => out.push(...items)

  add(
    h(1, '1 Introduction'),
    p([
      hint(
        chapter
          ? 'Introduce the problem and explain how the chapter contributes to the theme of the volume. Explain specialised terms for readers from other disciplines. '
          : 'Explain the research question, why it matters, and what the article contributes. Close the introduction with a short outline of the sections that follow. ',
      ),
      hint(c.intro),
    ]),
    h(1, chapter ? '2 Background' : '2 Related Work'),
    p([hint(chapter ? c.related.replace('Position the study in the existing literature and identify the gap it addresses', 'Review the work the chapter builds on') : c.related)]),
    h(1, chapter ? '3 Approach' : '3 Methods'),
    p([
      hint(
        chapter
          ? 'Describe and justify the methods. Number displayed equations so they can be referred to, as in Equation (1).'
          : 'Describe the data, materials and procedures in enough detail for the study to be reproduced. Number displayed equations so they can be referred to, as in Equation (1).',
      ),
    ]),
    new Paragraph({
      tabStops: [
        { type: TabStopType.CENTER, position: TEXT_W / 2 },
        { type: TabStopType.RIGHT, position: TEXT_W },
      ],
      children: [new TextRun('\t'), new WordMath({ children: [new MathRun('ŷ = arg max P(y | x; θ)')] }), new TextRun('\t(1)')],
    }),
    h(2, chapter ? '3.1 A subsection' : '3.1 Data collection'),
    p([hint('Use subsections where they help the reader; avoid going deeper than three levels. Apply the built-in Heading 1, 2 and 3 styles so the structure is kept.')]),
    h(1, chapter ? '4 Findings' : '4 Results'),
    p([hint('Present the findings. Refer to every table and figure in the text, for example Table 1 and Figure 1.')]),
    new Paragraph({ style: 'Caption', keepNext: true, children: [new TextRun({ text: 'Table 1. ', bold: true }), new TextRun('Table captions go above the table. Use horizontal rules only.')] }),
    resultsTable(),
    figurePlaceholder(),
    new Paragraph({
      style: 'Caption',
      children: [
        new TextRun({ text: 'Figure 1. ', bold: true }),
        new TextRun(
          chapter
            ? 'Figure captions go below the figure. Supply figures at 300 dpi or as vector graphics. Permission is needed for figures taken from other works.'
            : 'Figure captions go below the figure. Supply figures at 300 dpi or as vector graphics, and make sure text in them is legible at print size.',
        ),
      ],
    }),
  )

  if (chapter) {
    add(h(1, '5 Discussion and Conclusion'), p([hint('Discuss the implications and limitations, and suggest directions for further research.')]))
  } else {
    add(
      h(1, '5 Discussion'),
      p([hint('Interpret the results, compare them with earlier work, and state the limitations of the study and its practical implications.')]),
      h(1, '6 Conclusion'),
      p([hint('Summarise the contribution and suggest directions for future research.')]),
    )
  }

  const decl = (label: string, text: string) =>
    new Paragraph({ style: 'Declaration', children: [new TextRun({ text: `${label}. `, bold: true }), hint(text)] })
  add(new Paragraph({ style: 'Heading1', children: [new TextRun('Declarations')] }))
  if (chapter) add(decl('Acknowledgements', 'Thank people and organisations who helped with the work.'))
  add(
    decl(
      'Funding',
      chapter
        ? 'Name the funders and grant numbers, or state that the research received no external funding.'
        : 'Name the funders and grant numbers, or state that the research received no external funding. Anonymise funder details that would identify the authors during review.',
    ),
    decl('Conflicts of interest', 'Declare any competing interests, or state that there are none.'),
  )
  if (!chapter) add(decl('Data availability', 'State where the data supporting the findings can be found, or why they cannot be shared.'))
  add(
    decl(
      'Ethics approval',
      'Give the approving body and reference for research involving human participants or animals, or state that approval was not required.',
    ),
    decl('Use of generative AI', 'Describe any substantive use of generative AI tools in the research or writing, or state that none was used.'),
  )

  add(
    new Paragraph({ style: 'Heading1', children: [new TextRun('References')] }),
    p([hint(c.note)], 'Reference'),
    ...refs[pub.cite].map((r) => new Paragraph({ style: 'Reference', tabStops: [{ type: TabStopType.LEFT, position: 567 }], children: segs(r) })),
  )
  return out
}

function frontMatter(pub: Publication, opts: { anonymous: boolean }): Paragraph[] {
  const chapter = pub.kind === 'series'
  return [
    new Paragraph({
      style: 'ArticleType',
      children: [new TextRun(chapter ? 'Chapter' : pub.slug === 'reta' ? 'Review Article' : 'Research Article'), ...(chapter ? [] : [hint(pub.slug === 'reta' ? '  [systematic review, scoping review, critical review, umbrella review or meta-analysis]' : '  [or Review Article, Conceptual Paper, Case Study, Short Communication]')])],
    }),
    new Paragraph({ style: 'Title', children: [new TextRun(`Title of the ${chapter ? 'Chapter' : 'Article'}: Concise, Specific and Informative`)] }),
    ...(opts.anonymous
      ? [p([hint('Author details are removed for double-blind review. Give them on the separate title page.')])]
      : authorBlock()),
    new Paragraph({ style: 'AbstractHeading', children: [new TextRun('Abstract')] }),
    new Paragraph({
      style: 'Abstract',
      children: [
        hint(
          chapter
            ? 'Summarise the chapter’s aim, approach and main contribution in 150–250 words. Do not cite references in the abstract.'
            : 'State the problem, the approach, the main findings and their implications in a single paragraph of 150–250 words. Do not cite references, and spell out abbreviations at first use. A structured abstract (Purpose, Design/methodology, Findings, Originality) is also acceptable.',
        ),
      ],
    }),
    new Paragraph({ style: 'Keywords', children: [new TextRun({ text: 'Keywords: ', bold: true }), hint('keyword one; keyword two; keyword three; keyword four; keyword five')] }),
  ]
}

async function manuscriptDocx(pub: Publication) {
  const chapter = pub.kind === 'series'
  const doc = new Document({
    creator: 'NextGenIQ Press',
    title: `${pub.code} ${chapter ? 'chapter' : 'manuscript'} template`,
    styles,
    numbering,
    sections: [
      {
        properties: {
          titlePage: true,
          page,
          // Line numbers help reviewers refer to the text.
          lineNumbers: { countBy: 1, restart: LineNumberRestartFormat.CONTINUOUS },
        },
        headers: { first: firstHeader(pub, chapter ? '[Title of the Volume]' : undefined), default: runningHeader(pub) },
        footers: { first: firstFooter(pub) },
        children: [...frontMatter(pub, { anonymous: !chapter }), ...(pub.slug === 'reta' ? [p([hint(retaScopeNote)])] : []), ...bodySections(pub)],
      },
    ],
  })
  return Packer.toBuffer(doc)
}

async function titlePageDocx(pub: Publication) {
  const decl = (label: string, text: string) =>
    new Paragraph({ style: 'Declaration', children: [new TextRun({ text: `${label}. `, bold: true }), hint(text)] })
  const doc = new Document({
    creator: 'NextGenIQ Press',
    title: `${pub.code} title page`,
    styles,
    numbering,
    sections: [
      {
        properties: { titlePage: true, page },
        headers: { first: firstHeader(pub), default: runningHeader(pub) },
        footers: { first: firstFooter(pub) },
        children: [
          new Paragraph({ style: 'ArticleType', children: [new TextRun('Title Page')] }),
          p([hint('Submit this page separately from the anonymised manuscript. It carries everything removed for double-blind review.')]),
          new Paragraph({ style: 'Title', children: [new TextRun('Title of the Article: Concise, Specific and Informative')] }),
          ...authorBlock(),
          h(1, 'Author information'),
          p([hint('Give each author’s ORCID iD, if they have one.')]),
          bullet([new TextRun('First Author: ORCID 0000-0000-0000-0000')]),
          bullet([new TextRun('Second Author: ORCID 0000-0000-0000-0000')]),
          bullet([new TextRun('Third Author: ORCID 0000-0000-0000-0000')]),
          h(1, 'Declarations'),
          decl('Acknowledgements', 'Thank people and organisations who helped with the work but do not meet the criteria for authorship.'),
          decl('Funding', 'Funders and grant numbers in full.'),
          decl('Author contributions', 'Describe each author’s contribution, for example using the CRediT taxonomy.'),
          ...(pub.kind === 'magazine'
            ? [
                h(1, 'Author biographies'),
                p([hint(`Give a biography of no more than ${MAG.bio} words for each author: current position, research interests and relevant experience. Biographies are published with the article.`)]),
                p([new TextRun({ text: 'First Author ', bold: true }), hint('is a … at …. Their research interests include ….')]),
                p([new TextRun({ text: 'Second Author ', bold: true }), hint('is a … at ….')]),
                p([new TextRun({ text: 'Third Author ', bold: true }), hint('is a … at ….')]),
              ]
            : []),
        ],
      },
    ],
  })
  return Packer.toBuffer(doc)
}

/* -------------------------------------------------------------------------- */
/* Magazine                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Magazine limits, printed in the templates. The author guidelines page states
 * the same limits (src/data/magazines/sst.ts); change both together.
 */
const MAG = { pages: 5, words: '4,500', abstract: 150, visuals: 6, equations: 3, refs: 15, bio: 75, sidebar: 300 }

const MAG_MARGIN = 1134 // 2 cm
const MAG_TEXT_W = PAGE_W - 2 * MAG_MARGIN
const COL_GAP = 340 // 6 mm
const COL_W = Math.floor((MAG_TEXT_W - COL_GAP) / 2)
const magPage = { size: page.size, margin: { top: MAG_MARGIN, bottom: MAG_MARGIN, left: MAG_MARGIN, right: MAG_MARGIN, header: 567, footer: 567 } }

/** 10 pt body in two columns, so 5 template pages hold about 4,500 words with figures. */
const magStyles = {
  default: { document: { run: { font: FONT, size: 20, color: INK }, paragraph: { spacing: { line: 252, after: 100 } } } },
  paragraphStyles: [
    ...styles.paragraphStyles.filter((st) => !['Heading1', 'Heading2', 'Title', 'Reference'].includes(st.id)),
    { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 22, bold: true, color: ACCENT }, paragraph: { spacing: { before: 220, after: 80 }, keepNext: true, outlineLevel: 0 } },
    { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 20, bold: true }, paragraph: { spacing: { before: 160, after: 60 }, keepNext: true, outlineLevel: 1 } },
    { id: 'Title', name: 'Title', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 40, bold: true }, paragraph: { spacing: { line: 252, after: 200 } } },
    { id: 'Reference', name: 'Reference', basedOn: 'Normal', run: { size: 17 }, paragraph: { spacing: { after: 60 }, indent: { left: 397, hanging: 397 } } },
    { id: 'Sidebar', name: 'Sidebar', basedOn: 'Normal', run: { size: 18 }, paragraph: { spacing: { after: 60 } } },
  ],
}

/** A shaded box: the limits on the first page, and the sidebar in the body. */
function box(width: number, children: Paragraph[], fill: string, border = rule(6, ACCENT)) {
  return new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths: [width],
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: width, type: WidthType.DXA },
            borders: { top: border, bottom: border, left: border, right: border },
            shading: { type: ShadingType.CLEAR, color: 'auto', fill },
            margins: { top: 100, bottom: 60, left: 140, right: 140 },
            children,
          }),
        ],
      }),
    ],
  })
}

function limitsBox() {
  const item = (text: string) => new Paragraph({ numbering: { reference: 'bullets', level: 0 }, spacing: { after: 20 }, children: [new TextRun({ text, size: 18 })] })
  return box(
    MAG_TEXT_W,
    [
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Length and content limits', bold: true, size: 18, color: ACCENT }), new TextRun({ text: '  (delete this box before submitting)', italics: true, size: 18, color: MUTED })] }),
      item(`No more than ${MAG.pages} pages in this template, including figures, tables and references: about ${MAG.words} words of main text. Expert Perspectives: no more than 3 pages.`),
      item(`No more than ${MAG.visuals} figures and tables combined, ${MAG.equations} displayed equations and ${MAG.refs} references. No appendices.`),
      item('Present only the key results that support the message. Manuscripts over these limits are returned before review.'),
    ],
    'EEF6F5',
    rule(4, 'B9C1C9'),
  )
}

function magazineFront(): (Paragraph | Table)[] {
  return [
    new Paragraph({ style: 'ArticleType', children: [new TextRun('Technical Feature'), hint('  [or Review Article, Tutorial, Case Study, Expert Perspective]')] }),
    new Paragraph({ style: 'Title', children: [new TextRun('Title of the Article: Short, Clear and Engaging')] }),
    p([hint('Author details are removed for double-blind review. Give them, with short biographies, on the separate title page.')]),
    limitsBox(),
    new Paragraph({ style: 'AbstractHeading', children: [new TextRun('Abstract')] }),
    new Paragraph({
      style: 'Abstract',
      children: [hint(`In no more than ${MAG.abstract} words, say what the article is about, why it matters now, and what readers will take away. Do not cite references or use equations in the abstract.`)],
    }),
    new Paragraph({ style: 'Keywords', children: [new TextRun({ text: 'Keywords: ', bold: true }), hint('keyword one; keyword two; keyword three; keyword four')] }),
  ]
}

/** A numbered algorithm set off by rules above the title and below the last step. */
function algorithmBlock() {
  const steps = [
    'Input: the data set D and the threshold τ',
    'Output: the selected items S',
    'S ← ∅',
    'for each item x in D do',
    '    if score(x) ≥ τ then add x to S',
    'end for',
    'return S',
  ]
  return [
    new Paragraph({
      keepNext: true,
      spacing: { before: 120, after: 40 },
      border: { top: rule(8), bottom: rule(4) },
      children: [new TextRun({ text: 'Algorithm 1. ', bold: true, size: 18 }), new TextRun({ text: 'A short, descriptive title', size: 18 })],
    }),
    ...steps.map(
      (step, i) =>
        new Paragraph({
          keepNext: i < steps.length - 1,
          spacing: { after: 0 },
          tabStops: [{ type: TabStopType.LEFT, position: 340 }],
          border: i === steps.length - 1 ? { bottom: rule(8) } : undefined,
          children: [new TextRun({ text: `${i + 1}:\t`, size: 17, color: MUTED }), new TextRun({ text: step, size: 17 })],
        }),
    ),
    new Paragraph({ spacing: { after: 60 }, children: [] }),
  ]
}

function magazineBody(pub: Publication): (Paragraph | Table)[] {
  const decl = (label: string, text: string) =>
    new Paragraph({ style: 'Declaration', children: [new TextRun({ text: `${label}. `, bold: true }), hint(text)] })
  return [
    h(1, '1 Introduction'),
    p([hint('Open with the problem and why it matters now, before any technical detail. Write for readers outside your specialism: researchers, engineers, practitioners and decision-makers. Close the introduction with what the article offers the reader. Cite sources by number in square brackets, in order of first citation [1].')]),
    p([hint('Define every abbreviation and acronym at first use in the text, even if it is already defined in the abstract, and avoid abbreviations in the title. Use italics for emphasis; do not underline. Apply the built-in Heading 1 and Heading 2 styles, and do not change font sizes or spacing to fit the page limit.')]),
    h(1, '2 Background'),
    p([hint('Give the context a non-specialist reader needs: the state of practice, earlier approaches and the gap this article addresses [2], [3].')]),
    box(
      COL_W,
      [
        new Paragraph({ style: 'Sidebar', children: [new TextRun({ text: 'Sidebar: Key Terms', bold: true, color: ACCENT })] }),
        new Paragraph({ style: 'Sidebar', children: [hint(`Put background that specialists can skip in a sidebar of no more than ${MAG.sidebar} words, and refer to it in the text. A sidebar may hold definitions, a short history, or a summary of a standard.`)] }),
      ],
      'F3F9F8',
    ),
    h(1, '3 Approach'),
    p([hint('Explain each idea in words first, using a figure where it helps (Figure 1). Describe the system, method or framework at the level a practitioner needs to understand and apply it.')]),
    h(2, '3.1 Equations'),
    p([hint(`Keep equations to a minimum: no more than ${MAG.equations} displayed equations, and only where they are essential. Number them consecutively, with the number in parentheses at the right margin, as in Equation (1). Define every symbol before or immediately after the equation, and italicise variables.`)]),
    new Paragraph({
      tabStops: [
        { type: TabStopType.CENTER, position: Math.floor(COL_W / 2) },
        { type: TabStopType.RIGHT, position: COL_W },
      ],
      children: [new TextRun('\t'), new WordMath({ children: [new MathRun('ŷ = arg max P(y | x)')] }), new TextRun('\t(1)')],
    }),
    h(2, '3.2 Algorithms'),
    p([hint('Number algorithms and give each a short title, as in Algorithm 1. Set them off with rules above the title and below the last line, and prefer clear pseudocode to program code.')]),
    ...algorithmBlock(),
    figurePlaceholder(COL_W),
    new Paragraph({
      style: 'Caption',
      children: [
        new TextRun({ text: 'Figure 1. ', bold: true }),
        new TextRun(`Figure captions go below the figure. Use figures to explain ideas, such as architectures, workflows and comparisons. No more than ${MAG.visuals} figures and tables combined.`),
      ],
    }),
    h(1, '4 Results'),
    p([hint('Present only the key results that support the article’s message, usually in one or two figures or a single table such as Table 1. Parameter sweeps, ablations and long result tables belong in a journal article.')]),
    new Paragraph({ style: 'Caption', keepNext: true, children: [new TextRun({ text: 'Table 1. ', bold: true }), new TextRun('Table captions go above the table. Use horizontal rules only.')] }),
    resultsTable([COL_W - 3 * 1000, 1000, 1000, 1000]),
    h(2, '4.1 Preparing figures and tables'),
    bullet([hint('Supply photographs and colour or greyscale figures at 300 dpi or more, and line art at 600 dpi, or use vector graphics (PDF, EPS, SVG). Submit each figure as a separate file as well.')]),
    bullet([hint('Size figures to one column (about 85 mm) or the full page width (about 175 mm). Text in figures should be 8–10 pt at print size, in a standard font such as Times New Roman, Arial or Helvetica.')]),
    bullet([hint('Label axes with words and units in parentheses, such as “Latency (ms)”, not symbols or units alone.')]),
    bullet([hint('Label the parts of a multipart figure (a), (b), (c) beneath each part. Do not draw borders around figures or put captions inside them.')]),
    bullet([hint('Cite every figure and table in the text, and place it near its first mention. Figures in colour appear in colour online.')]),
    h(1, '5 Discussion'),
    p([hint('Explain what the results mean in practice, state the limitations honestly, and describe what remains unsolved and where research and practice should go next.')]),
    h(1, '6 Conclusion'),
    p([hint('Summarise the take-away message in a short paragraph. Do not repeat the abstract; say why the work matters and what readers should do with it.')]),
    new Paragraph({ style: 'Heading1', children: [new TextRun('Acknowledgements')] }),
    p([hint('Leave this section empty for review: acknowledgements can identify the authors. Give them on the separate title page; they are added at acceptance.')]),
    new Paragraph({ style: 'Heading1', children: [new TextRun('Declarations')] }),
    decl('Funding', 'Name the funders and grant numbers, or state that the work received no external funding. Anonymise funder details that would identify the authors during review.'),
    decl('Conflicts of interest', 'Declare any competing interests, or state that there are none.'),
    decl('Data availability', 'Where the article reports data, state where it can be found, or why it cannot be shared.'),
    decl('Ethics approval', 'Give the approving body and reference for work involving human participants, or state that approval was not required.'),
    decl('Use of generative AI', 'Describe any substantive use of generative AI tools, or state that none was used.'),
    new Paragraph({ style: 'Heading1', children: [new TextRun('References')] }),
    p([hint(`No more than ${MAG.refs} references, numbered in the order they are first cited, with each number used once. Prefer recent, peer-reviewed sources, and include a DOI wherever one exists. Do not use Word’s automatic endnotes; type the list in the Reference style.`)], 'Reference'),
    ...refs[pub.cite].map((ref) => new Paragraph({ style: 'Reference', tabStops: [{ type: TabStopType.LEFT, position: 397 }], children: segs(ref) })),
  ]
}

async function magazineDocx(pub: Publication) {
  // Both sections carry the same headers, so the first page looks the same
  // whichever section Word takes them from.
  const headers = { first: firstHeader(pub, undefined, MAG_TEXT_W), default: runningHeader(pub, MAG_TEXT_W) }
  const footers = { first: firstFooter(pub, MAG_TEXT_W) }
  const lineNumbers = { countBy: 1, restart: LineNumberRestartFormat.CONTINUOUS }
  const doc = new Document({
    creator: 'NextGenIQ Press',
    title: `${pub.code} article template`,
    styles: magStyles,
    numbering,
    sections: [
      { properties: { titlePage: true, page: magPage, lineNumbers }, headers, footers, children: magazineFront() },
      {
        properties: { type: SectionType.CONTINUOUS, titlePage: true, page: magPage, lineNumbers, column: { count: 2, space: COL_GAP, equalWidth: true } },
        headers,
        footers,
        children: magazineBody(pub),
      },
    ],
  })
  return Packer.toBuffer(doc)
}

/* -------------------------------------------------------------------------- */
/* LaTeX                                                                      */
/* -------------------------------------------------------------------------- */

const latexDir = join(here, 'latex')

const bios = String.raw`\section*{Author biographies}
Give a biography of no more than 75 words for each author: current position,
research interests and relevant experience. Biographies are published with the
article.

\textbf{First Author} is a \ldots{} at \ldots. Their research interests
include \ldots.

\textbf{Second Author} is a \ldots{} at \ldots.

\textbf{Third Author} is a \ldots{} at \ldots.

`

const fill = (src: string, pub: Publication) =>
  src
    .replaceAll('{{PUBNAME}}', pub.name.replaceAll('&', String.raw`\&`))
    .replaceAll('{{CODE}}', pub.code)
    .replaceAll('{{CITEOPT}}', pub.cite)
    .replaceAll('{{BIOS}}', pub.kind === 'magazine' ? bios : '')
    .replace(/\\articletype\{Research Article\}.*$/m, (line) =>
      pub.slug === 'reta' ? String.raw`\articletype{Review Article} % systematic, scoping, critical or umbrella review, or meta-analysis` : line,
    )
    .replaceAll(String.raw`\begin{abstract}`, pub.slug === 'reta' ? String.raw`\begin{abstract}` + '\n' + retaScopeNote + '\n' : String.raw`\begin{abstract}`)

/** The main file of the LaTeX package, and what the README calls it. */
const mainFile = (pub: Publication) =>
  pub.kind === 'journal'
    ? { src: 'article.tex', name: 'manuscript', what: 'manuscript' }
    : pub.kind === 'magazine'
      ? { src: 'magazine.tex', name: 'article', what: 'magazine article' }
      : { src: 'chapter.tex', name: 'chapter', what: 'chapter' }

function readme(pub: Publication, main: string, extra: string[], tex: boolean) {
  const cite =
    pub.cite === 'numbered'
      ? 'Citations are numbered ([1], [2]) in order of first citation.'
      : 'Citations are author-date, (Smith & Brown, 2024), with references listed alphabetically.'
  return [
    `${pub.name} (${pub.code}) -- LaTeX ${mainFile(pub).what} template`,
    'NextGenIQ Press',
    '',
    'Files',
    `  ${main}.tex             the ${mainFile(pub).what}; start here`,
    ...extra,
    '  references.bib         your references (BibTeX)',
    '  nextgeniq.cls          the class file; do not edit',
    '  nextgeniq-logo.png     used on the first page',
    ...(tex ? [`  ${main}.pdf             the template compiled, for reference`] : []),
    '',
    'Overleaf',
    '  New Project > Upload Project, and choose this zip file. Overleaf compiles',
    '  it with pdfLaTeX and BibTeX without further setup.',
    '',
    'On your own computer',
    `  pdflatex ${main} && bibtex ${main} && pdflatex ${main} && pdflatex ${main}`,
    '',
    'Class options',
    pub.kind === 'series'
      ? '  chapter     chapter layout, with the volume title on the first page'
      : '  anonymous   hides the author block for double-blind review (keep it on for submission)',
    ...(pub.kind === 'magazine'
      ? [
          '  magazine    two columns, 10pt, numbered headings: the magazine page.',
          '              Articles must fit in 5 pages of this layout, with no more',
          '              than 6 figures and tables, 3 displayed equations and 15',
          '              references. The sidebar environment boxes background text,',
          '              and algorithmbox sets a numbered algorithm.',
        ]
      : []),
    '  lineno      line numbers for reviewers',
    `  ${pub.cite.padEnd(10)}  ${cite}`,
    '',
    'Use only standard packages. Submit the .tex, .bib and figure files with the',
    'compiled PDF.',
    '',
  ].join('\n')
}

function hasTex() {
  try {
    execFileSync('pdflatex', ['--version'], { stdio: 'ignore' })
    execFileSync('bibtex', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

function compile(dir: string, name: string) {
  const run = (cmd: string, args: string[]) => execFileSync(cmd, args, { cwd: dir, stdio: 'ignore' })
  run('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', name])
  try {
    run('bibtex', [name])
  } catch {
    // No citations (the title page): nothing for BibTeX to do.
  }
  run('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', name])
  run('pdflatex', ['-interaction=nonstopmode', '-halt-on-error', name])
  for (const ext of ['aux', 'bbl', 'blg', 'log', 'out']) rmSync(join(dir, `${name}.${ext}`), { force: true })
}

function latexZip(pub: Publication, zipPath: string, tex: boolean) {
  // Journals and magazines are reviewed double-blind, so they ship a separate title page.
  const blind = pub.kind !== 'series'
  const folder = `${pub.code}-latex-template`
  const stage = join(tmpdir(), `ngq-templates-${pub.slug}-${process.pid}`)
  const dir = join(stage, folder)
  rmSync(stage, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })

  const main = mainFile(pub).name
  const sources: [string, string][] = [[mainFile(pub).src, `${main}.tex`]]
  if (blind) sources.push(['titlepage.tex', 'titlepage.tex'])
  for (const [from, to] of sources) writeFileSync(join(dir, to), fill(readFileSync(join(latexDir, from), 'utf8'), pub))
  copyFileSync(join(latexDir, 'nextgeniq.cls'), join(dir, 'nextgeniq.cls'))
  copyFileSync(join(latexDir, 'references.bib'), join(dir, 'references.bib'))
  copyFileSync(join(here, 'assets', 'nextgeniq-logo.png'), join(dir, 'nextgeniq-logo.png'))
  writeFileSync(
    join(dir, 'README.txt'),
    readme(pub, main, blind ? ['  titlepage.tex          author details, submitted separately for double-blind review'] : [], tex),
  )
  if (tex) for (const [, to] of sources) compile(dir, to.replace(/\.tex$/, ''))

  rmSync(zipPath, { force: true })
  execFileSync('zip', ['-qrX', zipPath, folder], { cwd: stage })
  rmSync(stage, { recursive: true, force: true })
}

/* -------------------------------------------------------------------------- */

const tex = hasTex()
if (!tex) console.warn('pdflatex/bibtex not found: the LaTeX zips will not include a sample PDF.')

for (const pub of publications) {
  const dir = join(outRoot, pub.slug)
  rmSync(dir, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })
  if (pub.kind === 'journal') {
    writeFileSync(join(dir, `${pub.code}-manuscript-template.docx`), await manuscriptDocx(pub))
    writeFileSync(join(dir, `${pub.code}-title-page.docx`), await titlePageDocx(pub))
  } else if (pub.kind === 'magazine') {
    writeFileSync(join(dir, `${pub.code}-article-template.docx`), await magazineDocx(pub))
    writeFileSync(join(dir, `${pub.code}-title-page.docx`), await titlePageDocx(pub))
  } else {
    writeFileSync(join(dir, `${pub.code}-chapter-template.docx`), await manuscriptDocx(pub))
  }
  latexZip(pub, join(dir, `${pub.code}-latex-template.zip`), tex)
  console.log(`${pub.code}: written to public/templates/${pub.slug}/`)
}
