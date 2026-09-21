import type { BookSeries, BookSeriesDetail } from '../../types/content'

export const isriSeries: BookSeries = {
  slug: 'isri',
  title: 'International Series in Research and Innovation',
  shortTitle: 'ISRI',
  issn: 'ISSN Sample',
  area: 'Research & Innovation',
  access: 'Open Access',
  frequency: 'Irregular',
  reviewType: 'Single-blind peer review',
  summary:
    'Peer-reviewed international book series on research systems, innovation management, knowledge transfer, and the translation of discovery into practice.',
}

export const isriDetail: BookSeriesDetail = {
  slug: 'isri',
  title: 'International Series in Research and Innovation',
  shortTitle: 'ISRI',
  tagline:
    'International research monographs and edited books on discovery, innovation, and their use in practice.',
  issn: 'ISSN Sample',
  eIssn: 'eISSN Sample',
  area: 'Research & Innovation',
  access: 'Open Access',
  frequency: 'Irregular volumes',
  publisher: 'Sample',
  editor: 'Series Editorial Office',
  reviewType: 'Single-blind peer review',
  license: 'Open access (Sample digital library)',
  scope:
    'The International Series in Research and Innovation (ISRI) is a peer-reviewed international book series that aims to provide a high-quality platform for authored books, edited volumes, and research monographs on how research is organized, how innovation is generated, and how both are translated across sectors and regions. The series focuses on emerging theories, methods, evidence, and applications that address the evolving challenges of research systems, innovation management, and international knowledge exchange. ISRI welcomes theoretical work, empirical studies, comparative volumes, industrial and policy case collections, surveys, and practice handbooks.',
  metrics: [
    { label: 'Access model', value: 'Full open access' },
    { label: 'Publication fees', value: 'None' },
    { label: 'Review model', value: 'Single-blind' },
    { label: 'Frequency', value: 'Irregular' },
  ],
  board: [
    'The series is guided by a Series Editorial Office with peer review of proposals and, where appropriate, individual chapters.',
    'Volume editors are responsible for scientific coherence; the series office confirms standards before production.',
  ],
  topics: [
    'Research systems, laboratories, and the organization of discovery',
    'Innovation management, processes, and capability building',
    'International collaboration, knowledge transfer, and research mobility',
    'Science, technology, and innovation policy',
    'University-industry-government partnerships and technology commercialization',
    'Open science, intellectual property, and data governance for innovation',
    'Entrepreneurial research, ventures, and innovation ecosystems',
    'Responsible, inclusive, and sustainable innovation',
    'Digital tools, platforms, and infrastructures for research and innovation',
    'Evaluation, metrics, and evidence of research and innovation impact',
    'Comparative and regional studies of research and innovation practice',
    'Methods, datasets, and reporting standards for innovation research',
  ],
  quickLinks: ['About the Series', 'Call for Books', 'Contact Editorial Office'],
  pages: [
    {
      id: 'about',
      label: 'About',
      title: 'About the Book Series',
      summary:
        'Aims and scope, topics, book types, open access, peer review, ethics, indexing, and series publication details for ISRI.',
      blocks: [
        {
          title: 'Aims & Scope',
          paragraphs: [
            'Research and innovation now move through global networks of laboratories, firms, universities, and public agencies. New knowledge is produced not only as papers, but as prototypes, standards, data products, ventures, and policy instruments that have to travel across countries and sectors. Digital platforms, mission-oriented programs, open science, and industrial R&D alliances have expanded what can be attempted, yet they have also exposed persistent design problems: how to organize research portfolios, how to protect and share intellectual assets, how to evaluate innovation beyond simple counts of patents or papers, and how to transfer results into settings with different capabilities and regulations. At runtime, international projects face broken data and legal interoperability, uneven infrastructure, and incentives that reward local output over reusable innovation. Geopolitical fragmentation, sustainability constraints, and questions of inclusion further shape who can participate. The field needs book-length treatments that connect research practice with innovation outcomes, not isolated case anecdotes.',
            'The International Series in Research and Innovation (ISRI) is a peer-reviewed international book series that aims to provide a high-quality platform for authored books, edited volumes, and research monographs on how research is organized, how innovation is generated, and how both are translated across sectors and regions. The series focuses on emerging theories, methods, evidence, and applications that address the evolving challenges of research systems, innovation management, and international knowledge exchange. ISRI welcomes theoretical work, empirical studies, comparative volumes, industrial and policy case collections, surveys, and practice handbooks. The series seeks to promote collaboration among researchers, engineers, managers, and practitioners, while fostering rigorous, internationally relevant, and usable accounts of research and innovation. By encouraging both theoretical advancements and practical implementations, ISRI contributes to shaping the future of global research and innovation practice.',
          ],
        },
        {
          title: 'Topics',
          bullets: [
            'Research systems, laboratories, and the organization of discovery',
            'Innovation management, processes, and capability building',
            'International collaboration, knowledge transfer, and research mobility',
            'Science, technology, and innovation policy',
            'University-industry-government partnerships and technology commercialization',
            'Open science, intellectual property, and data governance for innovation',
            'Entrepreneurial research, ventures, and innovation ecosystems',
            'Responsible, inclusive, and sustainable innovation',
            'Digital tools, platforms, and infrastructures for research and innovation',
            'Evaluation, metrics, and evidence of research and innovation impact',
            'Comparative and regional studies of research and innovation practice',
            'Methods, datasets, and reporting standards for innovation research',
          ],
        },
        {
          title: 'Focus and Scope',
          paragraphs: [
            'ISRI welcomes high-quality books on research practice, innovation processes, and their international dimensions. Suitable work includes research monographs, edited collections, comparative studies, policy-oriented volumes, and handbooks for doctoral and professional readers. Each book should have a clear theme, international relevance or an explicit regional framing, and chapters that form a coherent argument rather than a disconnected set of papers.',
          ],
        },
        {
          title: 'Book Types',
          paragraphs: [
            'ISRI publishes the following peer-reviewed scholarly book types. Each volume must have a clear theme and a coherent structure.',
          ],
          bullets: [
            'Authored research monographs',
            'Edited volumes with international contributor teams',
            'Comparative and policy-oriented collections',
            'Handbooks for research and innovation practice',
            'Thematic volumes from research programs or consortia',
          ],
        },
        {
          title: 'Audience',
          paragraphs: [
            'The series is intended for researchers, postgraduate students, innovation managers, policy analysts, and professionals in universities, firms, and public agencies who need book-length analysis of research and innovation.',
          ],
        },
        {
          title: 'Open Access Policy',
          paragraphs: [
            'All books published under ISRI are made available online through the Sample digital library. Content is accessible without subscription fees, allowing free reading and academic use. Authors retain the right to share and distribute their published chapters for scholarly purposes. Open access is intended to increase the visibility and citation potential of the work.',
          ],
        },
        {
          title: 'Copyright Notice',
          paragraphs: [
            'Authors retain copyright to their work and grant Sample a non-exclusive license to publish the content in the ISRI series. Chapters may be reused for academic purposes with proper citation. Any commercial reproduction or distribution requires written permission from the publisher.',
          ],
        },
        {
          title: 'Peer Review and Editorial Oversight',
          paragraphs: [
            'ISRI uses editorial screening followed by peer review of book proposals and, where appropriate, of individual chapters. Volume editors are responsible for scientific coherence; the series editor or editorial office confirms that the volume meets series standards before production. Review is single-blind unless a conference or guest-editor workflow is agreed in writing. Final acceptance rests with the series editorial office.',
          ],
        },
        {
          title: 'Ethics and Originality',
          paragraphs: [
            'ISRI requires original work that is not under consideration elsewhere without permission. Plagiarism, redundant publication, and undisclosed conflicts of interest are not accepted. Human-subject, animal, or sensitive-data chapters must include the relevant ethics statements. Suspected misconduct is handled following COPE-aligned practice. Contact for ethics queries: ethics@sample.org.',
          ],
        },
        {
          title: 'Indexing, DOI, and Preservation',
          paragraphs: [
            'Completed volumes are prepared with standard bibliographic metadata and are submitted for evaluation to major indexing services where eligible, including Scopus and Web of Science. Each published book and, where applicable, each chapter receives persistent identifiers (DOI) once the official imprint is confirmed. Long-term access is maintained through the Sample digital library. ISSN and series identifiers are currently listed as Sample.',
          ],
        },
        {
          title: 'Sponsorship Disclosure',
          paragraphs: [
            'ISRI does not rely on external sponsorship. There are no publication fees for authors. No external organization influences editorial decisions, content selection, or review processes. If a future volume is supported by a grant or institution, that support will be disclosed in the front matter.',
          ],
        },
        {
          title: 'History of the Series',
          paragraphs: [
            'ISRI was established to provide a dedicated international venue for book-length work on research and innovation. The series aims to keep editorial standards consistent, review processes transparent, and published volumes available in the long term. Collaborations with institutions and research networks will be added as the series develops. Publisher and imprint details are listed as Sample until the official information is confirmed.',
          ],
        },
        {
          title: 'About Publication',
          bullets: [
            'Starting Year: 2026',
            'Frequency: irregular',
            'Format: Online and Open Access',
            'Subject and Language of Publication: Series-specific subjects, English (other languages by agreement)',
            'Publisher Detail: Sample',
            'Series ISSN: Sample · eISSN: Sample · Series code: ISRI',
          ],
        },
        {
          title: 'Privacy Statement',
          paragraphs: [
            'Sample collects personal data such as names, affiliations, email addresses, and ORCID iDs solely for publication and indexing purposes. This information is not shared with third parties, except for indexing services that require metadata. Data submitted during the publication process is handled confidentially and used only for editorial and academic communication.',
          ],
        },
        {
          title: 'Contact',
          paragraphs: [
            'Editorial Office: Sample',
            'Email: ebooks@sample.org',
            'Support: support@sample.org',
          ],
        },
      ],
    },
    {
      id: 'call-for-books',
      label: 'Call for Books',
      title: 'Call for Book Proposals',
      summary:
        'Invitation to submit book proposals, proposal requirements, AI policy, fees, review timeline, and how to submit to ISRI.',
      blocks: [
        {
          title: 'Publish With Us',
          paragraphs: [
            'ISRI invites authors and volume editors to submit book proposals on research systems, innovation practice, and international knowledge exchange. We welcome researchers, academicians, and professionals who can develop a focused, internationally relevant book. Proposals are reviewed on scholarly merit, originality, coherence, and fit with the series scope.',
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
            'Authored research monographs',
            'Edited volumes with international contributor teams',
            'Comparative and policy-oriented collections',
            'Handbooks for research and innovation practice',
            'Thematic volumes from research programs or consortia',
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
            'Authors receive complimentary digital copies of the published book for personal use. Additional copies may be requested for promotional or academic purposes. Sample offers a transparent royalty structure and aims to compensate contributors fairly. Final royalty terms will be confirmed when official publisher details are provided.',
          ],
        },
        {
          title: 'Indexing and Abstracting',
          paragraphs: [
            'All Sample books in this series are prepared for evaluation by major indexing databases such as Scopus and Web of Science (WoS). Authors and editors should follow the relevant indexing guidelines when preparing manuscripts to improve the likelihood of inclusion.',
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
            'Sample does not accept material that has been previously published elsewhere without formal permission. Authors must ensure that all content, including text, figures, tables, and images, is original or used with proper authorization. Conference chapters may be expanded only when they include substantial new content and cite the earlier version.',
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
            'Sample focuses on scholarly books that align with undergraduate and postgraduate teaching and research needs. Books should have a clear and specific theme within a broader subject area. Each chapter must connect logically with the book’s central topic, contributing to a cohesive structure rather than a loose collection of unrelated chapters.',
            'Books are encouraged to have international relevance and appeal. For edited volumes, contributions from multiple countries enhance the publication’s global reach. If your book is focused on a specific region or country, please clarify that in your proposal.',
            'Chapters should be peer-reviewed or carefully vetted by editors to ensure originality, depth, and clarity. The content should be suitable for upper-level students, researchers, faculty, and industry professionals. If chapters undergo peer review, this should be noted in the preface.',
            'Before confirming chapter selections for edited books, authors must share a proposed table of contents with Sample for approval. This ensures proper structure, quality control, and smooth editorial coordination.',
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
            'To submit your book idea, complete the Sample Book Proposal Form (to be provided) and send it to the editorial office. You may also contact the publishing manager for questions about proposal submission, book development, or editorial guidance.',
            'Editorial Office: Sample',
            'Email: ebooks@sample.org',
            'Questions: support@sample.org',
          ],
        },
      ],
    },
  ],
}
