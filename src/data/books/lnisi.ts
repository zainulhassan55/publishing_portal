import type { BookSeries, BookSeriesDetail } from '../../types/content'

export const lnisiSeries: BookSeries = {
  slug: 'lnisi',
  title: 'Lecture Notes in Interdisciplinary Science and Innovation',
  shortTitle: 'LNISI',
  issn: 'ISSN Sample',
  area: 'Interdisciplinary Science',
  access: 'Open Access',
  frequency: 'Irregular',
  reviewType: 'Double-blind peer review',
  summary:
    'Peer-reviewed lecture notes, monographs, and edited volumes that connect scientific fields with innovation practice for teaching and research use.',
}

export const lnisiDetail: BookSeriesDetail = {
  slug: 'lnisi',
  title: 'Lecture Notes in Interdisciplinary Science and Innovation',
  shortTitle: 'LNISI',
  tagline:
    'Lecture notes, monographs, and edited volumes that connect scientific fields with innovation practice.',
  issn: 'ISSN Sample',
  eIssn: 'eISSN Sample',
  area: 'Interdisciplinary Science',
  access: 'Open Access',
  frequency: 'Irregular volumes',
  publisher: 'NextGenIQ Press',
  editor: 'Series Editorial Office',
  reviewType: 'Double-blind peer review',
  license: 'Open access (NextGenIQ Press digital library)',
  scope:
    'The Lecture Notes in Interdisciplinary Science and Innovation (LNISI) is a peer-reviewed international book series that aims to provide a high-quality platform for authored books, edited volumes, lecture notes, and research monographs at the intersection of the sciences, engineering, and innovation practice. The series focuses on emerging theories, methods, teaching-ready syntheses, and applications that address the evolving challenges of knowledge integration and innovation across fields. LNISI welcomes original chapters, tutorial expositions, methodological handbooks, case-based lecture notes, surveys, and practice-oriented volumes that demonstrate genuine cross-field synthesis.',
  metrics: [
    { label: 'Access model', value: 'Full open access' },
    { label: 'Publication fees', value: 'None' },
    { label: 'Review model', value: 'Double-blind' },
    { label: 'Frequency', value: 'Irregular' },
  ],
  board: [
    'The series is guided by a Series Editorial Office with peer review of proposals and, where appropriate, individual chapters.',
    'Volume editors are responsible for scientific coherence; the series office confirms standards before production.',
  ],
  topics: [
    'Frameworks for interdisciplinary and transdisciplinary science',
    'Lecture-ready syntheses of methods that travel across fields',
    'Knowledge integration, shared vocabularies, and coupled models',
    'Innovation processes linking laboratory research to application',
    'Team science, research training, and doctoral-school curricula',
    'Data, computation, and experimental methods used across domains',
    'Socio-technical, environmental, and human-centered innovation',
    'Responsible research, ethics, and governance of convergent work',
    'Case studies of interdisciplinary projects in health, environment, materials, and cities',
    'Open educational resources and reproducible teaching materials',
    'Assessment of interdisciplinary learning and research outcomes',
    'Standards, reporting, and documentation for integrative volumes',
  ],
  quickLinks: ['About the Series', 'Call for Books', 'Contact Editorial Office'],
  pages: [
    {
      id: 'about',
      label: 'About',
      title: 'About the Book Series',
      summary:
        'Aims and scope, topics, book types, open access, peer review, ethics, indexing, and series publication details for LNISI.',
      blocks: [
        {
          title: 'Aims & Scope',
          paragraphs: [
            'Scientific and technological problems increasingly cut across the borders of single laboratories and single curricula. Climate-health systems, intelligent infrastructure, materials-by-design, and socio-technical innovation all require methods that combine measurement, computation, design, and evidence from more than one field. Lecture-style volumes, short monographs, and tightly edited collections have become a practical way to move that knowledge into classrooms, doctoral schools, and research teams faster than a scattered set of papers can. Design-time difficulties remain: vocabularies do not align, data and models live at incompatible scales, and course-ready expositions often omit the integration steps that make an interdisciplinary argument work. At runtime, collaborations stall on toolchains, credit, and results that cannot be taught or reused outside their original group. Open science, responsible innovation, and the demand for usable training materials make isolated disciplinary notes insufficient. The field needs a publication venue for lecture-grade, research-grade accounts of how science and innovation are actually joined.',
            'The Lecture Notes in Interdisciplinary Science and Innovation (LNISI) is a peer-reviewed international book series that aims to provide a high-quality platform for authored books, edited volumes, lecture notes, and research monographs at the intersection of the sciences, engineering, and innovation practice. The series focuses on emerging theories, methods, teaching-ready syntheses, and applications that address the evolving challenges of knowledge integration and innovation across fields. LNISI welcomes original chapters, tutorial expositions, methodological handbooks, case-based lecture notes, surveys, and practice-oriented volumes that demonstrate genuine cross-field synthesis. The series seeks to promote collaboration among researchers, educators, engineers, and practitioners, while fostering interpretable, reusable, and classroom-usable interdisciplinary work. By encouraging both theoretical advancements and practical implementations, LNISI contributes to shaping the future of convergent science and innovation education.',
          ],
        },
        {
          title: 'Topics',
          bullets: [
            'Frameworks for interdisciplinary and transdisciplinary science',
            'Lecture-ready syntheses of methods that travel across fields',
            'Knowledge integration, shared vocabularies, and coupled models',
            'Innovation processes linking laboratory research to application',
            'Team science, research training, and doctoral-school curricula',
            'Data, computation, and experimental methods used across domains',
            'Socio-technical, environmental, and human-centered innovation',
            'Responsible research, ethics, and governance of convergent work',
            'Case studies of interdisciplinary projects in health, environment, materials, and cities',
            'Open educational resources and reproducible teaching materials',
            'Assessment of interdisciplinary learning and research outcomes',
            'Standards, reporting, and documentation for integrative volumes',
          ],
        },
        {
          title: 'Focus and Scope',
          paragraphs: [
            'LNISI welcomes high-quality books and chapters that connect two or more scientific, engineering, or innovation domains. Suitable work includes lecture notes from advanced courses and workshops, methodological handbooks, edited volumes from research programs, and short monographs that explain how methods, models, or evidence are integrated. Each volume should have a clear theme, a coherent chapter structure, and content suitable for postgraduate teaching as well as research use. Conference-derived volumes are considered when they are reworked into a unified book rather than a loose set of papers.',
          ],
        },
        {
          title: 'Book Types',
          paragraphs: [
            'LNISI publishes the following peer-reviewed scholarly book types. Each volume must have a clear theme and a coherent structure.',
          ],
          bullets: [
            'Advanced lecture notes and graduate course companions',
            'Edited volumes with a single integrating theme',
            'Short research monographs on interdisciplinary methods',
            'Workshop or summer-school notes expanded into a unified book',
            'Handbooks that explain how to couple methods across fields',
          ],
        },
        {
          title: 'Audience',
          paragraphs: [
            'The series is intended for postgraduate students, doctoral researchers, faculty who teach advanced interdisciplinary courses, and practitioners who need a compact, citable account of methods that cross field boundaries.',
          ],
        },
        {
          title: 'Open Access Policy',
          paragraphs: [
            'All books published under LNISI are made available online through the NextGenIQ Press digital library. Content is accessible without subscription fees, allowing free reading and academic use. Authors retain the right to share and distribute their published chapters for scholarly purposes. Open access is intended to increase the visibility and citation potential of the work.',
          ],
        },
        {
          title: 'Copyright Notice',
          paragraphs: [
            'Authors retain copyright to their work and grant NextGenIQ Press a non-exclusive license to publish the content in the LNISI series. Chapters may be reused for academic purposes with proper citation. Any commercial reproduction or distribution requires written permission from the publisher.',
          ],
        },
        {
          title: 'Peer Review and Editorial Oversight',
          paragraphs: [
            'LNISI uses editorial screening followed by peer review of book proposals and, where appropriate, of individual chapters. Volume editors are responsible for scientific coherence; the series editor or editorial office confirms that the volume meets series standards before production. Review is double-blind unless a conference or guest-editor workflow is agreed in writing. Final acceptance rests with the series editorial office.',
          ],
        },
        {
          title: 'Ethics and Originality',
          paragraphs: [
            'LNISI requires original work that is not under consideration elsewhere without permission. Plagiarism, redundant publication, and undisclosed conflicts of interest are not accepted. Human-subject, animal, or sensitive-data chapters must include the relevant ethics statements. Suspected misconduct is handled following COPE-aligned practice. Contact for ethics queries: contact@nextgeniqpress.com.',
          ],
        },
        {
          title: 'Indexing, DOI, and Preservation',
          paragraphs: [
            'Completed volumes are prepared with standard bibliographic metadata and are submitted for evaluation to major indexing services where eligible, including Scopus and Web of Science. Each published book and, where applicable, each chapter receives persistent identifiers (DOI) once the official imprint is confirmed. Long-term access is maintained through the NextGenIQ Press digital library. ISSN and series identifiers are currently listed as Sample.',
          ],
        },
        {
          title: 'Sponsorship Disclosure',
          paragraphs: [
            'LNISI does not rely on external sponsorship. There are no publication fees for authors. No external organization influences editorial decisions, content selection, or review processes. If a future volume is supported by a grant or institution, that support will be disclosed in the front matter.',
          ],
        },
        {
          title: 'History of the Series',
          paragraphs: [
            'LNISI was established to give interdisciplinary lecture notes and innovation volumes a consistent editorial home. The series aims to maintain transparent review, coherent book structure, and long-term digital availability. It will expand through collaborations with academic programs, research institutes, and scholarly societies. Imprint details will be updated once the official information is confirmed.',
          ],
        },
        {
          title: 'About Publication',
          bullets: [
            'Starting Year: 2026',
            'Frequency: irregular',
            'Format: Online and Open Access',
            'Subject and Language of Publication: Series-specific subjects, English (other languages by agreement)',
            'Publisher Detail: NextGenIQ Press',
            'Series ISSN: Sample · eISSN: Sample · Series code: LNISI',
          ],
        },
        {
          title: 'Privacy Statement',
          paragraphs: [
            'NextGenIQ Press collects personal data such as names, affiliations, email addresses, and ORCID iDs solely for publication and indexing purposes. This information is not shared with third parties, except for indexing services that require metadata. Data submitted during the publication process is handled confidentially and used only for editorial and academic communication.',
          ],
        },
        {
          title: 'Contact',
          paragraphs: [
            'Editorial Office: contact@nextgeniqpress.com',
            'Email: contact@nextgeniqpress.com',
            'Support: contact@nextgeniqpress.com',
          ],
        },
      ],
    },
    {
      id: 'call-for-books',
      label: 'Call for Books',
      title: 'Call for Book Proposals',
      summary:
        'Invitation to submit book proposals, proposal requirements, AI policy, fees, review timeline, and how to submit to LNISI.',
      blocks: [
        {
          title: 'Publish With Us',
          paragraphs: [
            'LNISI invites authors and volume editors to submit book proposals for lecture notes, edited collections, and monographs in interdisciplinary science and innovation. We welcome researchers, educators, and professionals who can turn cross-field work into a coherent book that can be taught and cited. Proposals are reviewed on scholarly merit, originality, pedagogical clarity, and fit with the series scope.',
          ],
        },
        {
          title: 'Who Should Submit',
          paragraphs: [
            'Proposals may come from individual authors, author teams, or volume editors. For edited books, at least one editor should ideally also contribute a chapter. International contributor teams are encouraged. If the book is focused on one country or region, state that clearly in the proposal.',
          ],
        },
        {
          title: 'Book Types Invited',
          bullets: [
            'Advanced lecture notes and graduate course companions',
            'Edited volumes with a single integrating theme',
            'Short research monographs on interdisciplinary methods',
            'Workshop or summer-school notes expanded into a unified book',
            'Handbooks that explain how to couple methods across fields',
          ],
        },
        {
          title: 'Proposal Requirements',
          paragraphs: [
            'Please submit a concise proposal before sending a full manuscript. A complete proposal typically includes:',
          ],
          bullets: [
            'Working title, subtitle, and intended series (this series)',
            'Aims, scope, and a one-page rationale',
            'Annotated table of contents with chapter abstracts',
            'Author or editor biographies and affiliations',
            'Target audience and competing or related books',
            'Estimated word count, timeline, and language of publication',
            'Statement on originality, permissions, and any prior dissemination',
          ],
          subsections: [
            {
              title: 'Recommended length',
              paragraphs: [
                'The recommended length for each book is 70,000–80,000 words (approximately 280–350 manuscript pages in 11-point font, 1.5 line spacing). Shorter lecture notes may be considered when the theme is tightly focused.',
              ],
            },
          ],
        },
        {
          title: 'Author Compensation',
          paragraphs: [
            'Authors receive complimentary digital copies of the published book for personal use. Additional copies may be requested for promotional or academic purposes. NextGenIQ Press offers a transparent royalty structure and aims to compensate contributors fairly. Final royalty terms will be confirmed when official publisher details are provided.',
          ],
        },
        {
          title: 'Indexing and Abstracting',
          paragraphs: [
            'All NextGenIQ Press books in this series are prepared for evaluation by major indexing databases such as Scopus and Web of Science (WoS). Authors and editors should follow the relevant indexing guidelines when preparing manuscripts to improve the likelihood of inclusion.',
          ],
        },
        {
          title: 'Publication Fees',
          paragraphs: [
            'There are no publication fees for authors. Every proposal is reviewed purely on merit, based on quality, originality, and relevance to the series.',
          ],
        },
        {
          title: 'Originality and Permissions',
          paragraphs: [
            'NextGenIQ Press does not accept material that has been previously published elsewhere without formal permission. Authors must ensure that all content, including text, figures, tables, and images, is original or used with proper authorization. Conference chapters may be expanded only when they include substantial new content and cite the earlier version.',
          ],
        },
        {
          title: 'Policy on the Use of Artificial Intelligence',
          paragraphs: [
            'We uphold academic integrity and authenticity in all published works. Authors and editors must ensure that the content of their books or chapters is not generated by artificial intelligence (AI) tools, including AI-based text generators, paraphrasing tools, or AI-created figures and visuals.',
            'AI tools may be used only to support the research process, such as analyzing data or improving readability through grammar and spelling checks. These technologies should never replace the author’s original thought, interpretation, or contribution.',
            'Any permitted AI use must be disclosed in the preface or a dedicated statement. All authors and editors remain fully responsible for the accuracy, originality, and integrity of the content they submit.',
          ],
        },
        {
          title: 'Important Notes About Book Content',
          paragraphs: [
            'NextGenIQ Press focuses on scholarly books that align with undergraduate and postgraduate teaching and research needs. Books should have a clear and specific theme within a broader subject area. Each chapter must connect logically with the book’s central topic, contributing to a cohesive structure rather than a loose collection of unrelated chapters.',
            'Books are encouraged to have international relevance and appeal. For edited volumes, contributions from multiple countries enhance the publication’s global reach. If your book is focused on a specific region or country, please clarify that in your proposal.',
            'Chapters should be peer-reviewed or carefully vetted by editors to ensure originality, depth, and clarity. The content should be suitable for upper-level students, researchers, faculty, and industry professionals. If chapters undergo peer review, this should be noted in the preface.',
            'Before confirming chapter selections for edited books, authors must share a proposed table of contents with NextGenIQ Press for approval. This ensures proper structure, quality control, and smooth editorial coordination.',
          ],
        },
        {
          title: 'Review Timeline',
          paragraphs: [
            'The editorial office reviews complete proposals for scope and quality and aims to respond within a reasonable timeframe. Shortlisted proposals may be sent to external reviewers. Acceptance is followed by a series agreement (details Sample) and a production schedule agreed with the editor or author team.',
          ],
        },
        {
          title: 'How to Submit',
          paragraphs: [
            'To submit your book idea, complete the NextGenIQ Press Book Proposal Form (to be provided) and send it to the editorial office. You may also contact the publishing manager for questions about proposal submission, book development, or editorial guidance.',
            'Editorial Office: contact@nextgeniqpress.com',
            'Email: contact@nextgeniqpress.com',
            'Questions: contact@nextgeniqpress.com',
          ],
        },
      ],
    },
  ],
}
