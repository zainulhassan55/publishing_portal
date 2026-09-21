import type { Journal, JournalDetail } from '../../types/content'

export const ijicJournal: Journal = {
  slug: 'ijic',
  title: 'International Journal of Intelligent Computing',
  shortTitle: 'IJIC',
  issn: 'ISSN Sample',
  area: 'Intelligent Computing',
  access: 'Open Access',
  frequency: 'Continuous',
  editor: 'Editorial Board',
  reviewType: 'Single-blind peer review',
  summary:
    'Peer-reviewed research on neural and evolutionary computing, hybrid intelligent systems, trustworthy AI, resource-aware inference, and autonomous decision-making.',
}

export const ijicDetail: JournalDetail = {
  slug: 'ijic',
  title: 'International Journal of Intelligent Computing',
  shortTitle: 'IJIC',
  tagline: 'Theories, algorithms, and applications for learning, reasoning, and autonomous systems.',
  issn: 'ISSN Sample',
  eIssn: 'eISSN Sample',
  area: 'Intelligent Computing',
  access: 'Open Access',
  frequency: 'Continuous publication',
  publisher: 'Sample',
  ownership: 'The journal is owned by Sample.',
  editor: 'Editorial Board',
  reviewType: 'Single-blind peer review',
  license: 'CC BY 4.0',
  scope:
    'The International Journal of Intelligent Computing (IJIC) is a peer-reviewed international journal that aims to provide a high-quality platform for the dissemination of innovative research in intelligent computing. The journal focuses on emerging theories, algorithms, architectures, and applications that address the evolving challenges of learning, reasoning, optimization, and autonomous decision-making in complex systems. IJIC welcomes original theoretical work, algorithmic advances, system implementations, benchmarks, surveys, and industrial case studies that demonstrate reliable, resource-aware, and trustworthy intelligent computing.',
  metrics: [
    { label: 'Access model', value: 'Full open access' },
    { label: 'License', value: 'CC BY 4.0' },
    { label: 'Review model', value: 'Single-blind' },
    { label: 'APC status', value: 'Waived until Sep 2026' },
  ],
  board: [
    'The Journal is guided by an Editorial Board consisting of recognized experts in the field.',
    'Complete Editorial Board member listings will be published on this page as appointments are finalized.',
  ],
  topics: [
    'Neural, fuzzy, and evolutionary computing methods',
    'Hybrid and neuro-symbolic intelligent systems',
    'Machine learning, deep learning, and representation learning',
    'Swarm intelligence and nature-inspired optimization',
    'Knowledge representation, reasoning, and decision support',
    'Multi-agent systems and distributed intelligent computing',
    'Interpretable, robust, and trustworthy intelligent models',
    'Edge, embedded, and resource-aware intelligent computing',
    'Intelligent sensing, perception, and multimodal data fusion',
    'Intelligent control, robotics, and autonomous systems',
    'Applications of intelligent computing in healthcare, industry, energy, and smart infrastructure',
    'Benchmarks, reproducibility, and evaluation standards for intelligent computing',
  ],
  quickLinks: [
    'About the Journal',
    'Author Instructions',
    'Article Processing Charge',
    'Publication Ethics',
    'Editorial Process',
    'Issue Archive',
  ],
  pages: [
    {
      id: 'about',
      label: 'About',
      title: 'About the Journal',
      summary:
        'Aims and scope, topics, ownership, licensing, access policy, peer review, and publication ethics for IJIC.',
      blocks: [
        {
          title: 'Aims & Scope',
          paragraphs: [
            'Intelligent computing now sits at the center of how complex systems sense, decide, and act. Across healthcare, manufacturing, energy, transportation, and digital infrastructure, organizations depend on methods that can learn from heterogeneous data, reason under uncertainty, and optimize decisions at a scale no hand-crafted rule set can sustain. Neural architectures, evolutionary and swarm search, fuzzy and probabilistic inference, and hybrid neuro-symbolic pipelines have expanded what machines can perceive and plan, yet the same growth has exposed hard design problems: how to allocate compute across edge and cloud, how to fuse multimodal signals without brittle pipelines, and how to search high-dimensional hypothesis spaces when labels are scarce or noisy. At runtime, intelligent systems must remain interoperable with legacy controllers, stay synchronized as data and environments drift, and fail safely when sensors, models, or communication links degrade. Opacity, data leakage, adversarial inputs, and unsustainable training cost now constrain deployment as much as accuracy does. The field therefore needs computing methods that are not only capable, but also interpretable, resource-aware, and reliable enough for high-stakes, continuously operating environments.',
            'The International Journal of Intelligent Computing (IJIC) is a peer-reviewed international journal that aims to provide a high-quality platform for the dissemination of innovative research in intelligent computing. The journal focuses on emerging theories, algorithms, architectures, and applications that address the evolving challenges of learning, reasoning, optimization, and autonomous decision-making in complex systems. IJIC welcomes original theoretical work, algorithmic advances, system implementations, benchmarks, surveys, and industrial case studies that demonstrate reliable, resource-aware, and trustworthy intelligent computing. The journal seeks to promote interdisciplinary collaboration among researchers, engineers, and practitioners in computer science, control, data science, and domain engineering, while fostering the development of interpretable, scalable, and efficient intelligent computing solutions. By encouraging both theoretical advancements and practical implementations, the journal contributes to shaping the future of adaptive, trustworthy, and autonomous technologies.',
          ],
        },
        {
          title: 'Topics',
          bullets: [
            'Neural, fuzzy, and evolutionary computing methods',
            'Hybrid and neuro-symbolic intelligent systems',
            'Machine learning, deep learning, and representation learning',
            'Swarm intelligence and nature-inspired optimization',
            'Knowledge representation, reasoning, and decision support',
            'Multi-agent systems and distributed intelligent computing',
            'Interpretable, robust, and trustworthy intelligent models',
            'Edge, embedded, and resource-aware intelligent computing',
            'Intelligent sensing, perception, and multimodal data fusion',
            'Intelligent control, robotics, and autonomous systems',
            'Applications of intelligent computing in healthcare, industry, energy, and smart infrastructure',
            'Benchmarks, reproducibility, and evaluation standards for intelligent computing',
          ],
        },
        {
          title: 'Publication Frequency',
          paragraphs: [
            'IJIC is published continuously throughout the year, with articles appearing online immediately after acceptance and production.',
          ],
        },
        {
          title: 'Ownership',
          paragraphs: ['The journal is owned by Sample.'],
        },
        {
          title: 'Author Fees',
          paragraphs: [
            'For information regarding publication fees and waiver policies, please refer to Article Processing Charge (APC).',
          ],
        },
        {
          title: 'Copyright & Licensing',
          paragraphs: [
            'Articles published in IJIC will be Open-Access articles distributed under the terms and conditions of the Creative Commons Attribution 4.0 International (CC BY). Under this license, author(s) retain ownership of the copyright for their article, but authors allow anyone to download, reuse, reprint, distribute, and/or copy articles published in IJIC, so long as the original author(s) and source are cited.',
          ],
        },
        {
          title: 'Access Policy',
          paragraphs: [
            'All articles published in this journal are freely available to readers worldwide immediately upon publication. There are no subscription charges or pay-per-view fees. Readers may read, download, copy, distribute, print, search, or link to the full texts of the articles, or use them for any other lawful purpose, without asking prior permission from the publisher or the author.',
          ],
        },
        {
          title: 'Editorial Board',
          paragraphs: [
            'The Journal is guided by an Editorial Board consisting of recognized experts in the field. For the complete list of Editorial Board members, please refer to Editorial Board.',
          ],
        },
        {
          title: 'Peer Review',
          paragraphs: [
            'The journal adheres to rigorous peer review and undergoes single-blind peer review. For more details, please refer to Editorial Process and Peer Review Policy.',
          ],
        },
        {
          title: 'Editorial Process',
          paragraphs: [
            'All manuscripts submitted to IJIC should adhere to the journal’s Editorial Process.',
          ],
        },
        {
          title: 'Plagiarism',
          paragraphs: [
            'Plagiarism detection is performed at the Journal using the Turnitin tool. This web-based tool is employed in the editorial process to identify potential text plagiarism. It is important to note that while Turnitin can identify matching text, it cannot independently determine whether plagiarism has occurred. Manual examination of the matching text is still necessary, and judgment must be exercised to ascertain the presence or absence of plagiarism. The similarity report might be sent to the author for revision whenever needed.',
          ],
        },
        {
          title: 'Publication Ethics Statement',
          paragraphs: [
            'IJIC is responsible for implementing rigorous peer review and strict ethical policies and standards to ensure that high quality scientific work is added to the field of scholarly publishing. IJIC takes such publishing ethics issues very seriously, and our editors are trained to enforce COPE’s Core Practices and Guidelines, with a zero-tolerance policy for plagiarism, data falsification, and other behaviours. To verify the originality of content submitted to our journals, we use Turnitin tool Similarity Check to check submissions against previous publications.',
          ],
        },
        {
          title: 'Advertising',
          paragraphs: [
            'The journal does not accept any commercial product advertisements until policy changes otherwise.',
          ],
        },
        {
          title: 'Direct Marketing',
          paragraphs: [
            'Journal propagation has been done through the journal website and distribution of an introduction pamphlet. Invitations to submit a manuscript are usually targeted towards presenters at conferences, seminars, or workshops related to the journal’s aims and scope.',
          ],
        },
        {
          title: 'Contact',
          paragraphs: [
            'Please visit Editorial Office for details about different queries.',
            'Publication ethics contact: ethics@sample.org',
            'Editorial Office contact: office@sample.org',
          ],
        },
      ],
    },
    {
      id: 'author-instructions',
      label: 'Author Instructions',
      title: 'Author Instructions',
      summary:
        'Manuscript suitability, article types, formatting requirements, declarations, references, and related preparation guidance for IJIC.',
      blocks: [
        {
          title: 'Manuscript Suitability',
          paragraphs: [
            'All submitted manuscripts must be within the scope of the journal. Authors are strongly encouraged to review the Aims and Scope before submission to ensure suitability.',
          ],
        },
        {
          title: 'Templates',
          paragraphs: [
            'International Journal of Intelligent Computing (IJIC) accepts submissions in any format, and also recommends the use of the following templates, though it is not mandatory.',
            'Template in LaTeX, Template in MS Word, and Author Biography Template will be linked here when files are provided.',
          ],
        },
        {
          title: 'Article Types',
          paragraphs: [
            'The journal publishes Research Articles, Reviews, Editorials, Communications, Perspectives, Commentaries, Letters, and Reports. All papers must be written in English and must follow a clear concise style. The language editors may have to check the language and grammar of your submitted manuscript and make editorial changes if deemed necessary.',
          ],
          subsections: [
            {
              title: 'Research Article',
              paragraphs: [
                'A Research article is a detailed technical report of an original study that is likely to impact its field. It is a primary report where authors collect and analyze data and draw conclusions from the results leading to an original study in the literature. Research articles incorporate a comprehensive list of elements i.e., Title, Keywords, Authors and Affiliations, Abstract, a substantive Introduction, Material and Methods, Results, Discussion and Conclusion. There is no specific word count limitation; however, manuscripts must be as concise as possible.',
              ],
            },
            {
              title: 'Review Article',
              paragraphs: [
                'A Review article is a paper based on other published research. It is a secondary source. It does not report original research but rather critically evaluate previously published material. Typically, a review article analyzes or synthesizes existing literature on a subject with the aim of expanding on its current understanding or sums up the already existing work to relate it to its present status and suggest new research directions. Structured reviews and meta-analyses should use the same structure as research articles and adhere to the PRISMA guidelines, and authors should also include a completed PRISMA checklist and flow diagram as supporting files.',
              ],
            },
            {
              title: 'Editorial',
              paragraphs: [
                'Editorials are short personal perspectives about topics relevant to the journal’s aims and gateways. Editorials are not formally Peer-reviewed and must not include new research and data. They are evaluated by the editorial team in-house, if necessary in consultation with advisory board members.',
              ],
            },
            {
              title: 'Communication',
              paragraphs: [
                'Communications are short and rapid reports of novel findings of immediate significance. They prioritize speed and concision, typically with limited word count, figures and references. Methods should be sufficient for replication; extended details may be placed in Supplementary Materials.',
              ],
            },
            {
              title: 'Perspective',
              paragraphs: [
                'Perspectives are expert, forward-looking viewpoints that contextualize a field, synthesize emerging trends, and outline future research directions. They do not present substantial new datasets but may include conceptual frameworks or illustrative analyses.',
              ],
            },
            {
              title: 'Commentary',
              paragraphs: [
                'Commentaries provide focused scholarly opinions, critiques, or discussions on specific publications, policies, methods, or timely issues relevant to the journal’s scope. They generally do not include new primary data and may be invited or considered at the editor’s discretion.',
              ],
            },
            {
              title: 'Letter',
              paragraphs: [
                'Letters are concise communications to the editor, often addressing or clarifying issues raised by recently published articles in IJIC, or briefly reporting noteworthy observations. They should be succinct and well-referenced.',
              ],
            },
            {
              title: 'Report',
              paragraphs: [
                'Reports present technical advances, datasets, field results, case studies, benchmarks, or protocols with clear utility to the research community. They should include sufficient methodological detail and availability statements to ensure reproducibility and reuse.',
              ],
            },
          ],
        },
        {
          title: 'Manuscript Requirements',
          paragraphs: [
            'All manuscripts must be submitted via the online system. Manuscripts submitted for publication must be prepared according to the guideline given below. This guideline is intended to assist authors in preparing their manuscripts. To prevent avoidable delays in the review and typesetting process, IJIC asks and encourages authors to read carefully the guidelines before writing the manuscript.',
          ],
          subsections: [
            {
              title: '1. Title and Author Information',
              bullets: [
                'The title of the paper should be in bold, at the top of the page. Capitalize the first letter of each notional word of the title (title case format).',
                'Provide full names of all authors and their affiliations. The author line should be centered.',
                'Authors should be numbered according to their affiliations. There should be no space between the author’s name and the number.',
                'Use a comma “,” to separate each author, use “and” to separate the last two authors.',
                'If there are only two authors in the author line, use “and” to separate them.',
                'Authors should provide their full names in the author line.',
                'Affiliations should include the authors’ Departments, Institutes, Cities, Zipcodes and Countries.',
                'Corresponding author should be marked with the superscript *.',
              ],
            },
            {
              title: '2. Abstract',
              bullets: [
                'Abstract of a paper is typically 200 to 500 words in length, and 150 to 300 words for other types.',
                'Abstract should be one continuous (not structured) paragraph and should not include reference citations.',
                'Abbreviations should be defined in full the first time they appear. They could be then used, quoted in-between parentheses.',
              ],
            },
            {
              title: '3. Keywords',
              bullets: [
                'Three keywords are the minimum required. Use a comma “,” between each keyword.',
                'Unless it is a proper noun or there are special requirements, all keywords should be in lowercase.',
              ],
            },
            {
              title: '4. Structure',
              paragraphs: [
                'A paper for publication should be divided into multiple sections: a Title, Full names of all the authors including their affiliations, a concise Abstract, a list of Keywords, Main text (including figures, equations, and tables), Data Availability Statement, Funding Statement, Conflict of Interests, Ethical Approval and Consent to Participate, References, and Appendix.',
                'If AI tools were used in the manuscript preparation process, an AI usage statement should also be included.',
              ],
            },
            {
              title: '5. Equations and Mathematical Expressions',
              bullets: [
                'Equations and mathematical expressions must be inserted into the main text.',
                'Two different types of styles can be used: In-Line style, and Display style.',
                'Use either the Microsoft Equation Editor or the MathType add-on. Math equations should be editable text, and not images.',
              ],
            },
            {
              title: '6. Figures and Tables',
              bullets: [
                'Figures and tables should be inserted in the text of the manuscript.',
                'Figures should have relevant legends and should not contain the same information already covered in the main text.',
                'Figures (diagrams and pictures) should be numbered consecutively using Arabic numbers.',
                'They should be placed in the text soon after the point where they are referenced.',
                'Figures must be submitted in digital format, with resolution higher than 300 dpi.',
                'All figures and tables must be cited/referenced in the body of the text.',
              ],
            },
            {
              title: '7. Citations',
              bullets: [
                'All references should be cited in the main text, sequentially.',
                'For citations of references, please use square brackets and consecutive numbers, e.g., [1], [2,3], [4–6].',
                'Only the first author is cited, such as Frank [1]. If the cited reference has more than one author, please omit the rest of the authors using et al., such as Frank et al. [7], Wang et al. [4–6]. Do not use “Ref.” or “reference” except at the beginning of a sentence: “Reference [3] shows ...”.',
                'If the cited reference contains more than 2 consecutive references, the format should be: [1–3], [4–6]. It is better not to cite more than 5 consecutive references.',
                'No citation to the page number should be used.',
                'Please do not use automatic endnotes in Word; type the reference list at the end of the paper using the “References” style.',
                'All references must be relevant to the content of the manuscript.',
              ],
            },
            {
              title: '8. Declarations',
              paragraphs: [
                'Submitted manuscripts should, where appropriate, contain the following parts right before the list of references: Data Availability Statement; Funding Statement; Conflicts of Interest; Ethical Approval and Consent to Participate (not required for non-biological or non-medical manuscripts); and Supplementary Materials guidance as applicable.',
              ],
              bullets: [
                'Data Availability Statement: make clear how readers can access the data used in the study and explain why any unavailable data cannot be released.',
                'Funding Statement: describe sources of funding, including grant numbers, initials of authors who received the grant, and sponsor URLs. If there is no funding support, write “This work was supported without any funding”.',
                'Conflicts of Interest: declare all conflicts of interest. If none, write “The authors declare no conflicts of interest”.',
                'Ethical Approval and Consent to Participate: state whether human or animal subjects were included, the approving committee, compliance documents, and approval/reference number where applicable.',
                'Supplementary Materials: upload separately on submission; keep files clean; use at least 300 dpi for figures; cite as Fig. S1, Eq. (S2), Table S1, etc.',
              ],
            },
            {
              title: '9. References',
              paragraphs: [
                'All reference numbers are set flush left and form a column of their own, hanging out beyond the body of the reference. References must use APA format.',
              ],
            },
            {
              title: '10. Appendix',
              paragraphs: [
                'Authors that need to include an appendix section should place it after the References section. Multiple appendices should all have headings in the style used above. They will be ordered A, B, and C etc.',
              ],
            },
            {
              title: '11. Units and Symbols',
              bullets: [
                'There should be a space between the unit and Arabic number: 5 mm NOT 5mm.',
                'There should be a space before and after the operator: 3 cm × 5 cm NOT 3cm × 5cm.',
                'Please use Arabic number and relevant unit in the manuscript: 5 kg NOT five kilograms or 5 kilograms or five kg.',
                'Do not use hyphen/dash or any connector symbol between the value and its unit: 5 kg NOT 5–kg.',
                'Please clarify all units during a calculation or a mathematical relationship: 3 cm × 5 cm NOT 3 × 5 cm, 123 g ± 2 g or (123 ± 2) g NOT 123 ± 2 g, 70%–85% NOT 70–85%.',
                'Greek letters must be inserted using the correct Greek symbol (using Times, Helvetica or Symbol font), NOT written in full.',
              ],
            },
            {
              title: '12. Chemical Compounds',
              paragraphs: [
                'Where applicable, authors should provide exact chemical structures, preferred IUPAC nomenclature, spectroscopic characterization, crystallographic data, and authentication details for biomolecular materials, biological constructs, polymers, and nanomaterials according to the journal’s chemical compound guidance.',
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'apc',
      label: 'APC',
      title: 'Article Processing Charge',
      summary:
        'Open access publishing fees, waiver period, and discount policy for IJIC.',
      blocks: [
        {
          title: 'Article Processing Charge',
          paragraphs: [
            'The International Journal of Intelligent Computing is published under a full open access model, allowing readers to access, read, download, and reuse the full text of all articles immediately upon publication without restriction.',
            'The Article Processing Charge (APC) is completely waived for authors until September 2026.',
            'Starting from October 2026, an Article Processing Charge of USD 1,500 will be applied to each accepted article to cover the costs associated with editorial management, peer review, online publication, and long-term digital preservation.',
            'A waiver and discount policy will be implemented after October 2026. Authors affiliated with institutions in low-income countries will be eligible for a 50% discount on the APC.',
          ],
        },
      ],
    },
    {
      id: 'publication-ethics',
      label: 'Publication Ethics',
      title: 'Publication Ethics',
      summary:
        'COPE- and ICMJE-aligned ethics covering authorship, conflicts, data sharing, misconduct, AI use, and peer review integrity.',
      blocks: [
        {
          title: 'Overview',
          paragraphs: [
            'The International Journal of Intelligent Computing (IJIC) is committed to upholding the highest standards of publication ethics, adhering to the Core Practices of the Committee on Publication Ethics (COPE), the International Committee of Medical Journal Editors (ICMJE) guidelines, and other international standards. This policy governs all authors, editors, reviewers, and readers, ensuring integrity, transparency, and quality in scholarly publishing.',
          ],
        },
        {
          title: '1. Authorship and Contributorship',
          paragraphs: [
            'Authorship is based on the ICMJE criteria, requiring substantial contributions to conception, design, data acquisition, analysis, or interpretation; drafting or critically revising the manuscript; final approval of the version to be published; and agreement to be accountable for all aspects of the work.',
            'Gift, guest, or ghost authorship is strictly prohibited. Changes to authorship post-submission require written justification and consent from all co-authors, submitted to the Editorial Office at office@sample.org. Disputes over authorship will be resolved transparently, following COPE guidelines.',
          ],
        },
        {
          title: '2. Complaints and Appeals',
          paragraphs: [
            'Complaints regarding editorial processes, publication ethics, or journal operations should be submitted in writing to ethics@sample.org. The Editorial Board will investigate promptly, typically within 30 days, ensuring confidentiality and fairness.',
            'Authors may appeal editorial decisions by submitting a detailed rationale to the Editor-in-Chief within 30 days of the decision. Appeals are reviewed by an independent editorial panel, and outcomes are communicated typically within 14 days.',
          ],
        },
        {
          title: '3. Conflicts of Interest',
          paragraphs: [
            'All individuals involved in the publication process—authors, editors, and reviewers—must disclose any financial, personal, or professional relationships that could influence the research, its evaluation, or publication. Authors must include a conflict of interest statement in their manuscript, even if no conflicts exist.',
            'Guest Editors are subject to the same conflict of interest requirements as handling editors and must not make editorial decisions on manuscripts where impartiality could be compromised. Such manuscripts must be transferred to an independent editor.',
          ],
        },
        {
          title: '4. Data Sharing and Reproducibility',
          paragraphs: [
            'IJIC promotes transparency and reproducibility through adherence to the FAIR principles (Findable, Accessible, Interoperable, Reusable). Manuscripts must describe methods and data in sufficient detail to enable replication.',
            'Authors are encouraged to deposit raw data in public repositories (e.g., Dryad, Zenodo) prior to submission, unless restricted by ethical or legal considerations. A Data Availability Statement must be included. Authors must retain raw data and associated metadata for at least five years post-publication.',
            'Fabrication, falsification, or manipulation of data is strictly prohibited and will result in rejection, retraction, or sanctions.',
          ],
        },
        {
          title: '5. Ethical Oversight',
          paragraphs: [
            'Human research must comply with the Declaration of Helsinki and include ethics committee details, informed consent statements, and exemption details where applicable. IJIC prioritizes patient privacy.',
            'Animal research must adhere to international, national, and institutional guidelines and include ethics approval details and measures consistent with ARRIVE guidelines.',
            'Research involving cell lines must specify origin and authentication status, with ethics approval and consent for novel or human-derived cell lines.',
          ],
        },
        {
          title: '6. Intellectual Property',
          paragraphs: [
            'IJIC is a fully open access journal. All published articles are made freely available under the Creative Commons Attribution (CC-BY 4.0) license. Authors retain copyright while granting readers the right to freely read, download, share, adapt, and reuse the content with appropriate credit.',
            'Authors are responsible for originality, proper citation, third-party permissions, and avoiding simultaneous or duplicate submission.',
          ],
        },
        {
          title: '7. Plagiarism and Redundant Publication',
          paragraphs: [
            'Plagiarism, including text recycling, image duplication, or unattributed use of others’ ideas, is strictly prohibited. All submissions are screened using Crossref Similarity Check (iThenticate).',
            'Redundant or duplicate publications are not accepted. Extensions of conference papers are acceptable only if they include substantial new contributions and are properly cited.',
            'IJIC welcomes manuscripts previously posted to recognized preprint servers. Preprint posting does not constitute prior publication.',
          ],
        },
        {
          title: '8. Post-Publication Discussions and Corrections',
          paragraphs: [
            'Authors must promptly notify office@sample.org of errors or inaccuracies. Minor errors may be addressed via errata; significant errors may warrant a corrigendum.',
            'Articles may be retracted due to major errors, ethical breaches, or research misconduct, following COPE guidelines. Retracted articles remain accessible with a prominent “RETRACTED” watermark and a linked retraction notice.',
            'Complete removal of published content occurs only in exceptional circumstances such as court or government order, privacy/legal threats, unlawful publication, or ongoing public risk.',
          ],
        },
        {
          title: '9. Misconduct and Investigations',
          paragraphs: [
            'IJIC strictly prohibits research and publication misconduct, including data fabrication or falsification, plagiarism, improper authorship, ethical violations, and duplicate or simultaneous submissions.',
            'Suspected misconduct triggers investigation following COPE guidelines. Outcomes may include rejection, retraction, temporary submission bans (1–3 years), and prohibition from serving as editor or reviewer.',
          ],
        },
        {
          title: '10. Use of Generative AI',
          paragraphs: [
            'This policy is effective as of January 1, 2026, and applies to all manuscripts submitted on or after that date.',
            'Generative AI may be used to enhance clarity and language quality under strict human oversight, with disclosure in Acknowledgements or an AI Use Statement. AI tools cannot be listed as authors. Authors must not rely on AI to generate or verify bibliographic references.',
            'Use of generative AI to create, modify, or manipulate figures, images, or artwork is prohibited except where AI use is integral to the research design or methods and fully disclosed.',
            'Reviewers and editors must not input confidential manuscript content into generative AI systems. Editorial decisions must be made exclusively by human editors.',
          ],
        },
        {
          title: '11. Peer Review Ethics',
          paragraphs: [
            'IJIC employs a rigorous, fair, and confidential peer review process. Reviewers must provide objective, constructive, and timely feedback; maintain confidentiality; declare conflicts of interest; and alert the Editorial Office to potential ethical issues.',
          ],
        },
        {
          title: '12. Editorial Independence',
          paragraphs: [
            'IJIC upholds editorial independence, ensuring that editorial decisions are based solely on the quality, originality, and scientific merit of the manuscript, free from commercial, political, or external influences.',
          ],
        },
        {
          title: '13. Process for Identification and Handling of Research Misconduct Allegations',
          paragraphs: [
            'Allegations are received confidentially, assessed for credibility, and investigated formally where warranted. Confirmed misconduct may lead to correction, expression of concern, retraction, institutional notification, and submission restrictions. Authors may appeal within 30 days.',
            'For questions, concerns, or reports regarding publication ethics, please contact the Editorial Office at ethics@sample.org.',
          ],
        },
      ],
    },
    {
      id: 'editorial-process',
      label: 'Editorial Process',
      title: 'Editorial Process',
      summary:
        'Single-blind peer review workflow from initial checks through production and open access publication.',
      blocks: [
        {
          title: 'Overview',
          paragraphs: [
            'The International Journal of Intelligent Computing (IJIC) implements a rigorous peer review process. In most cases, this is a single-blind assessment involving at least two independent reviewers, followed by a final acceptance or rejection decision by the Editor-in-Chief. The Editor-in-Chief holds ultimate responsibility for the academic quality of the publication process, including approving or rejecting recommendations from the Academic Editor or Associate Editor. The journal’s publication ethics and malpractice policies follow the Committee on Publication Ethics (COPE) Best Practice Guidelines and are supplemented by Sample’s Instructions for Authors.',
          ],
        },
        {
          title: 'Initial Checks',
          paragraphs: [
            'All manuscripts submitted to the Editorial Office undergo an initial screening by a Managing Editor before being forwarded to the Editor-in-Chief. This screening verifies proper formatting, compliance with the journal’s ethical policies, and alignment with the journal’s aims and scope. Manuscripts that do not meet these basic requirements may be rejected outright or returned to the authors for revision and resubmission. No assessment of scientific significance or potential impact is made at this stage. Rejection decisions during initial checks are confirmed by the Managing Editor.',
          ],
        },
        {
          title: 'Assignment to Editor-in-Chief',
          paragraphs: [
            'Manuscripts passing the initial checks are forwarded to the Editor-in-Chief, who may assign the manuscript to a responsible Academic Editor for peer review. If the manuscript does not meet the journal’s quality standards, the Editor-in-Chief may reject it directly (desk rejection). The Editor-in-Chief may also request minor revisions before proceeding to peer review.',
          ],
        },
        {
          title: 'Assignment to Academic Editor',
          paragraphs: [
            'The Academic Editor evaluates the academic merit of the manuscript and selects at least two independent reviewers with relevant expertise. All reviews follow a single-blind model. The Academic Editor may recommend direct rejection to the Editor-in-Chief or request revisions from the authors before or during review.',
          ],
        },
        {
          title: 'Peer Review and Evaluation',
          paragraphs: [
            'Reviewers assess the manuscript for originality, scientific rigor, methodological soundness, clarity, relevance to the field, and overall contribution to the research community. They provide detailed comments and a recommendation: Accept, Minor Revision, Major Revision, or Reject.',
          ],
        },
        {
          title: 'Editorial Decision',
          paragraphs: [
            'Based on at least two independent review reports, the Academic Editor makes a recommendation to the Editor-in-Chief, who renders the final decision (Accept, Revise, or Reject).',
          ],
        },
        {
          title: 'Revision and Re-review',
          paragraphs: [
            'Authors invited to revise must respond to all reviewer and editor comments point-by-point in a detailed response letter. Revised manuscripts (especially those requiring major revisions) may be sent back to the original reviewers for re-evaluation. Authors are generally expected to submit revisions within 30 days (extensions may be granted upon request).',
          ],
        },
        {
          title: 'Final Check',
          paragraphs: [
            'Accepted manuscripts undergo a final technical and ethical review by the Editorial Office (including language, formatting, data availability, ethics statements, etc.). Upon successful completion, authors receive an official acceptance letter. Manuscripts failing to meet standards at this stage are returned to the Editor-in-Chief for further action.',
          ],
        },
        {
          title: 'Production and Publishing',
          paragraphs: [
            'Once accepted, the manuscript proceeds to copyediting, typesetting, proofreading, and online publication as soon as possible under the journal’s open access model.',
          ],
        },
      ],
    },
  ],
}
