%% nextgeniq.cls -- manuscript class for NextGenIQ Press journals, magazines
%% and book series.
%%
%% Options
%%   journal     (default) a journal article
%%   magazine    a magazine article: 10pt, two columns,
%%               so the page count matches the magazine's length limit
%%   chapter     a chapter in an edited volume or proceedings
%%   anonymous   hides author names, affiliations and correspondence for
%%               double-blind review
%%   numbered    numbered citations, [1], [2]  (default)
%%   authoryear  author-date citations, (Smith, 2024)
%%   lineno      line numbers, to help reviewers refer to the text
%%
%% Uses only packages included in TeX Live and on Overleaf.
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{nextgeniq}[2026/10/30 v1.1 NextGenIQ Press manuscript class]

\newif\ifngq@anon
\newif\ifngq@chapter
\newif\ifngq@authoryear
\newif\ifngq@lineno
\newif\ifngq@magazine
\DeclareOption{journal}{\ngq@chapterfalse\ngq@magazinefalse}
\DeclareOption{magazine}{\ngq@chapterfalse\ngq@magazinetrue}
\DeclareOption{chapter}{\ngq@chaptertrue\ngq@magazinefalse}
\DeclareOption{anonymous}{\ngq@anontrue}
\DeclareOption{numbered}{\ngq@authoryearfalse}
\DeclareOption{authoryear}{\ngq@authoryeartrue}
\DeclareOption{lineno}{\ngq@linenotrue}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax

\ifngq@magazine
  \LoadClass[10pt,a4paper,twocolumn]{article}
\else
  \LoadClass[11pt,a4paper]{article}
\fi

%% Fonts and page ------------------------------------------------------------
\RequirePackage[T1]{fontenc}
\RequirePackage{amsmath,amssymb}
\RequirePackage{newtxtext,newtxmath}
\RequirePackage{microtype}
\ifngq@magazine
  \RequirePackage[a4paper,top=20mm,bottom=20mm,left=18mm,right=18mm,columnsep=6mm,headheight=14pt]{geometry}
\else
  \RequirePackage[a4paper,top=25mm,bottom=25mm,left=25mm,right=25mm,headheight=14pt]{geometry}
\fi
\RequirePackage{graphicx}
\RequirePackage{xcolor}
\RequirePackage{booktabs}
\RequirePackage{enumitem}
\RequirePackage[font=small,labelfont=bf,labelsep=period]{caption}
\RequirePackage{fancyhdr}
\RequirePackage{titlesec}
\RequirePackage{authblk}
\ifngq@authoryear
  \RequirePackage[authoryear,round]{natbib}
\else
  \RequirePackage[numbers,square,sort&compress]{natbib}
\fi
\ifngq@lineno
  % `switch` numbers the right-hand column in the right margin.
  \ifngq@magazine\RequirePackage[switch]{lineno}\else\RequirePackage{lineno}\fi
  \AtBeginDocument{\linenumbers}
\fi
\RequirePackage[hidelinks]{hyperref}

\definecolor{ngqink}{HTML}{101B27}
\definecolor{ngqaccent}{HTML}{0C8375}
\definecolor{ngqmuted}{HTML}{505C68}

\ifngq@magazine\linespread{1.05}\else\linespread{1.15}\fi
\setlength{\parindent}{1.2em}
\setlength{\parskip}{0pt}
\setlist{itemsep=2pt,topsep=4pt}

%% Front matter -------------------------------------------------------------
\def\ngq@pubname{Publication name}
\def\ngq@pubcode{CODE}
\def\ngq@short{Short title}
\def\ngq@type{\ifngq@chapter Chapter\else\ifngq@magazine Technical Feature\else Research Article\fi\fi}
\def\ngq@keywords{}
\def\ngq@corr{}
\def\ngq@volume{}

%% \publication{Full name}{Code}
\newcommand\publication[2]{\def\ngq@pubname{#1}\def\ngq@pubcode{#2}}
%% Running head, at most about 50 characters.
\newcommand\shorttitle[1]{\def\ngq@short{#1}}
%% Research Article, Review Article, Short Communication, Chapter,
%% Technical Feature, Tutorial, Case Study, Expert Perspective, ...
\newcommand\articletype[1]{\def\ngq@type{#1}}
%% Chapters: title of the volume the chapter is written for.
\newcommand\volumetitle[1]{\def\ngq@volume{#1}}
\newcommand\keywords[1]{\def\ngq@keywords{#1}}
%% Article history. The editorial office fills these in; authors leave them as they are.
\def\ngq@received{DD Month YYYY}\def\ngq@revised{DD Month YYYY}
\def\ngq@accepted{DD Month YYYY}\def\ngq@published{DD Month YYYY}
\newcommand\received[1]{\def\ngq@received{#1}}
\newcommand\revised[1]{\def\ngq@revised{#1}}
\newcommand\accepted[1]{\def\ngq@accepted{#1}}
\newcommand\published[1]{\def\ngq@published{#1}}
\newcommand\correspondence[1]{\def\ngq@corr{#1}}

\renewcommand\Authfont{\normalsize\bfseries}
\renewcommand\Affilfont{\small\normalfont\color{ngqmuted}}
\renewcommand\Authsep{, }
\renewcommand\Authand{ and }
\renewcommand\Authands{, and }
\setlength{\affilsep}{4pt}

%% Magazines set the title block across both columns.
\renewcommand\maketitle{%
  \thispagestyle{ngqfirst}%
  \ifngq@lineno\nolinenumbers\fi
  \ifngq@magazine\twocolumn[{\ngq@titleblock}]\else\ngq@titleblock\fi
  \ngq@history
  \ifngq@lineno\linenumbers\fi
  \let\maketitle\relax
}
\newcommand\ngq@titleblock{%
  \begingroup\raggedright
  \IfFileExists{nextgeniq-logo.png}{%
    \raisebox{-.45\height}{\includegraphics[height=9mm]{nextgeniq-logo.png}}%
  }{{\small\bfseries\color{ngqink}NextGenIQ Press}}%
  \hfill
  \begin{minipage}[c]{.55\linewidth}\raggedleft
    {\small\bfseries\color{ngqink}\ngq@pubname}%
      \ifx\ngq@volume\@empty\else\\[1pt]{\footnotesize\itshape\color{ngqmuted}\ngq@volume}\fi
  \end{minipage}\par
  \vspace{3mm}{\color{ngqaccent}\rule{\linewidth}{1.2pt}}\par
  \vspace{5mm}
  {\footnotesize\bfseries\color{ngqaccent}\MakeUppercase{\ngq@type}}\par
  \vspace{2mm}
  {\LARGE\bfseries\color{ngqink}\@title\par}
  \vspace{5mm}
  \ifngq@anon
    {\small\itshape\color{ngqmuted}Author details removed for double-blind review.\par}
  \else
    {\@author\par}
    \ifx\ngq@corr\@empty\else
      \vspace{2mm}{\small\textbf{Correspondence:} \ngq@corr\par}
    \fi
  \fi
  \vspace{6mm}
  \endgroup
}

%% Article history: an unnumbered note at the foot of the first page, as in IEEE
%% journals, so LaTeX reserves its space. The editorial office fills in the dates.
\newcommand\ngq@history{{%
  \def\ngq@sep{\enspace{\color{ngqmuted}|}\enspace}%
  \renewcommand\thefootnote{}\long\def\@makefntext##1{\noindent##1}%
  \footnotetext{\scriptsize\raggedright
    \textbf{Received:} {\color{ngqmuted}\ngq@received}\ngq@sep
    \textbf{Revised:} {\color{ngqmuted}\ngq@revised}\ngq@sep
    \textbf{Accepted:} {\color{ngqmuted}\ngq@accepted}\ngq@sep
    \textbf{Published:} {\color{ngqmuted}\ngq@published}\par
    {\itshape\color{ngqmuted}Article history: completed by the editorial office. Leave as is.}}%
}}

%% Abstract with keywords underneath.
\renewenvironment{abstract}{%
  \par\noindent{\color{ngqmuted}\rule{\linewidth}{.4pt}}\par\vspace{2mm}
  \noindent{\bfseries\color{ngqink}Abstract}\par\vspace{1mm}
  \small\noindent\ignorespaces
}{%
  \ifx\ngq@keywords\@empty\else
    \par\vspace{2mm}\noindent\textbf{Keywords:} \ngq@keywords
  \fi
  \par\vspace{2mm}\noindent{\color{ngqmuted}\rule{\linewidth}{.4pt}}\par\vspace{4mm}
}

%% Headings -----------------------------------------------------------------
\titleformat{\section}{\large\bfseries\color{ngqink}}{\thesection}{.8em}{}
\titleformat{\subsection}{\normalsize\bfseries\color{ngqink}}{\thesubsection}{.8em}{}
\titleformat{\subsubsection}{\normalsize\itshape}{\thesubsubsection}{.8em}{}
\titlespacing*{\section}{0pt}{14pt}{6pt}
\titlespacing*{\subsection}{0pt}{10pt}{4pt}
\titlespacing*{\subsubsection}{0pt}{8pt}{3pt}

%% Headers and footers ------------------------------------------------------
\fancypagestyle{ngqfirst}{%
  \fancyhf{}%
  \renewcommand\headrulewidth{0pt}%
  \fancyfoot[L]{\footnotesize\color{ngqmuted}Manuscript prepared for \ngq@pubname}%
  \fancyfoot[R]{\footnotesize\thepage}%
}
\fancypagestyle{ngqmain}{%
  \fancyhf{}%
  \renewcommand\headrulewidth{.4pt}%
  \fancyhead[L]{\footnotesize\color{ngqmuted}\ngq@pubcode\ \textperiodcentered\ \ngq@short}%
  \fancyhead[R]{\footnotesize\thepage}%
}
\pagestyle{ngqmain}

%% Bibliography -------------------------------------------------------------
\AtBeginDocument{%
  \ifngq@authoryear\bibliographystyle{apalike}\else\bibliographystyle{unsrtnat}\fi
}
\renewcommand\bibsection{\section*{References}}
\setlength{\bibsep}{3pt}
\renewcommand\bibfont{\small}

%% Declarations, listed before the references.
\newenvironment{declarations}{%
  \section*{Declarations}\small\setlength{\parindent}{0pt}\setlength{\parskip}{4pt}%
}{\par}
\newcommand\declaration[1]{\par\textbf{#1.}\ }

%% Magazines: a boxed sidebar for background specialists can skip.
%%   \begin{sidebar}{Title} ... \end{sidebar}
\newsavebox\ngq@sidebox
\newenvironment{sidebar}[1]{%
  \par\medskip\noindent
  \begin{lrbox}{\ngq@sidebox}%
  \begin{minipage}{\dimexpr\linewidth-2\fboxsep-2\fboxrule\relax}%
  \small\setlength{\parindent}{0pt}\setlength{\parskip}{3pt}%
  {\bfseries\color{ngqaccent}#1}\par
}{%
  \end{minipage}\end{lrbox}%
  \fcolorbox{ngqaccent}{ngqaccent!6}{\usebox\ngq@sidebox}\par\medskip
}

%% A numbered algorithm, set off by rules above the title and below the last step.
%%   \begin{algorithmbox}{Title} \item first step \item ... \end{algorithmbox}
\newcounter{ngqalgorithm}
\newenvironment{algorithmbox}[1]{%
  \par\medskip\refstepcounter{ngqalgorithm}\noindent{\color{ngqink}\rule{\linewidth}{.8pt}}\par\nopagebreak
  \noindent{\small\textbf{Algorithm~\thengqalgorithm.}\ #1}\par\nopagebreak
  \noindent{\color{ngqink}\rule[.5ex]{\linewidth}{.4pt}}\par\nopagebreak\vspace{-1ex}
  \small\begin{enumerate}[label={\color{ngqmuted}\arabic*:},leftmargin=2em,itemsep=0pt,parsep=0pt,topsep=0pt]
}{%
  \end{enumerate}\par\vspace{.5ex}\noindent{\color{ngqink}\rule{\linewidth}{.8pt}}\par\medskip
}

\endinput
