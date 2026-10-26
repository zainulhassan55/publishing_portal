/**
 * Builds the downloadable manuscript templates into public/templates/<slug>/:
 * a Word file (plus a separate title page for the double-blind journals) and a
 * LaTeX package zipped with a compiled sample PDF.
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
type Publication = { slug: string; code: string; name: string; kind: 'journal' | 'series'; cite: Cite }

const publications: Publication[] = [
  { slug: 'ijic', code: 'IJIC', name: 'International Journal of Intelligent Computing', kind: 'journal', cite: 'numbered' },
  { slug: 'ijdm', code: 'IJDM', name: 'International Journal of Digital Management', kind: 'journal', cite: 'authoryear' },
  { slug: 'aiisc', code: 'AIISC', name: 'Advances in AI, Intelligent Systems and Computing', kind: 'series', cite: 'numbered' },
  { slug: 'lnmr', code: 'LNMR', name: 'Lecture Notes in Multidisciplinary Research', kind: 'series', cite: 'authoryear' },
]

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

function firstHeader(pub: Publication, line2: string) {
  const cell = (width: number, children: Paragraph[]) =>
    new TableCell({ width: { size: width, type: WidthType.DXA }, borders: { top: none, bottom: none, left: none, right: none }, children })
  return new Header({
    children: [
      new Table({
        width: { size: TEXT_W, type: WidthType.DXA },
        columnWidths: [900, TEXT_W - 900],
        borders: noBorders,
        rows: [
          new TableRow({
            children: [
              cell(900, [new Paragraph({ spacing: { after: 0 }, children: [new ImageRun({ type: 'png', data: logo, transformation: { width: 40, height: 42 } })] })]),
              cell(TEXT_W - 900, [
                new Paragraph({ spacing: { before: 40, after: 0 }, children: [new TextRun({ text: pub.name, bold: true, size: 20 })] }),
                new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: line2, size: 17, color: MUTED })] }),
              ]),
            ],
          }),
        ],
      }),
      new Paragraph({ spacing: { after: 0 }, border: { bottom: rule(12, ACCENT) }, children: [] }),
    ],
  })
}

const runningHeader = (pub: Publication) =>
  new Header({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W }],
        border: { bottom: rule(4, 'B9C1C9') },
        children: [
          new TextRun({ text: `${pub.code} · `, size: 17, color: MUTED }),
          new TextRun({ text: '[Short running title]', size: 17, color: MUTED, italics: true }),
          new TextRun({ children: ['\t', PageNumber.CURRENT], size: 17, color: MUTED }),
        ],
      }),
    ],
  })

const firstFooter = (pub: Publication) =>
  new Footer({
    children: [
      new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: TEXT_W }],
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

function resultsTable() {
  const widths = [3070, 2000, 2000, 2000]
  const rows = [
    ['Method', 'Precision', 'Recall', 'F1'],
    ['Baseline', '0.81', '0.77', '0.79'],
    ['Proposed', '0.88', '0.85', '0.86'],
  ]
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
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
function figurePlaceholder() {
  const line = rule(4, 'B9C1C9')
  return new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
    columnWidths: [TEXT_W],
    layout: TableLayoutType.FIXED,
    rows: [
      new TableRow({
        height: { value: 2600, rule: HeightRule.ATLEAST },
        cantSplit: true,
        children: [
          new TableCell({
            width: { size: TEXT_W, type: WidthType.DXA },
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
      children: [new TextRun(chapter ? 'Chapter' : 'Research Article'), ...(chapter ? [] : [hint('  [or Review Article, Conceptual Paper, Case Study, Short Communication]')])],
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
        headers: { first: firstHeader(pub, chapter ? 'NextGenIQ Press · [Title of the Volume]' : 'NextGenIQ Press'), default: runningHeader(pub) },
        footers: { first: firstFooter(pub) },
        children: [...frontMatter(pub, { anonymous: !chapter }), ...bodySections(pub)],
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
        headers: { first: firstHeader(pub, 'NextGenIQ Press'), default: runningHeader(pub) },
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
        ],
      },
    ],
  })
  return Packer.toBuffer(doc)
}

/* -------------------------------------------------------------------------- */
/* LaTeX                                                                      */
/* -------------------------------------------------------------------------- */

const latexDir = join(here, 'latex')

const fill = (src: string, pub: Publication) =>
  src.replaceAll('{{PUBNAME}}', pub.name).replaceAll('{{CODE}}', pub.code).replaceAll('{{CITEOPT}}', pub.cite)

function readme(pub: Publication, main: string, extra: string[]) {
  const cite =
    pub.cite === 'numbered'
      ? 'Citations are numbered ([1], [2]) in order of first citation.'
      : 'Citations are author-date, (Smith & Brown, 2024), with references listed alphabetically.'
  return [
    `${pub.name} (${pub.code}) -- LaTeX ${pub.kind === 'journal' ? 'manuscript' : 'chapter'} template`,
    'NextGenIQ Press',
    '',
    'Files',
    `  ${main}.tex             the ${pub.kind === 'journal' ? 'manuscript' : 'chapter'}; start here`,
    ...extra,
    '  references.bib         your references (BibTeX)',
    '  nextgeniq.cls          the class file; do not edit',
    '  nextgeniq-logo.png     used on the first page',
    `  ${main}.pdf             the template compiled, for reference`,
    '',
    'Overleaf',
    '  New Project > Upload Project, and choose this zip file. Overleaf compiles',
    '  it with pdfLaTeX and BibTeX without further setup.',
    '',
    'On your own computer',
    `  pdflatex ${main} && bibtex ${main} && pdflatex ${main} && pdflatex ${main}`,
    '',
    'Class options',
    pub.kind === 'journal'
      ? '  anonymous   hides the author block for double-blind review (keep it on for submission)'
      : '  chapter     chapter layout, with the volume title on the first page',
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
  const journal = pub.kind === 'journal'
  const folder = `${pub.code}-latex-template`
  const stage = join(tmpdir(), `ngq-templates-${pub.slug}-${process.pid}`)
  const dir = join(stage, folder)
  rmSync(stage, { recursive: true, force: true })
  mkdirSync(dir, { recursive: true })

  const main = journal ? 'manuscript' : 'chapter'
  const sources: [string, string][] = [[journal ? 'article.tex' : 'chapter.tex', `${main}.tex`]]
  if (journal) sources.push(['titlepage.tex', 'titlepage.tex'])
  for (const [from, to] of sources) writeFileSync(join(dir, to), fill(readFileSync(join(latexDir, from), 'utf8'), pub))
  copyFileSync(join(latexDir, 'nextgeniq.cls'), join(dir, 'nextgeniq.cls'))
  copyFileSync(join(latexDir, 'references.bib'), join(dir, 'references.bib'))
  copyFileSync(join(here, 'assets', 'nextgeniq-logo.png'), join(dir, 'nextgeniq-logo.png'))
  writeFileSync(
    join(dir, 'README.txt'),
    readme(pub, main, journal ? ['  titlepage.tex          author details, submitted separately for double-blind review'] : []),
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
  } else {
    writeFileSync(join(dir, `${pub.code}-chapter-template.docx`), await manuscriptDocx(pub))
  }
  latexZip(pub, join(dir, `${pub.code}-latex-template.zip`), tex)
  console.log(`${pub.code}: written to public/templates/${pub.slug}/`)
}
