%% nextgeniq.cls -- manuscript class for NextGenIQ Press journals and book series.
%%
%% Options
%%   journal     (default) a journal article
%%   chapter     a chapter in an edited volume or proceedings
%%   anonymous   hides author names, affiliations and correspondence for
%%               double-blind review
%%   numbered    numbered citations, [1], [2]  (default)
%%   authoryear  author-date citations, (Smith, 2024)
%%   lineno      line numbers, to help reviewers refer to the text
%%
%% Uses only packages included in TeX Live and on Overleaf.
\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{nextgeniq}[2026/10/26 v1.0 NextGenIQ Press manuscript class]

\newif\ifngq@anon
\newif\ifngq@chapter
\newif\ifngq@authoryear
\newif\ifngq@lineno
\DeclareOption{journal}{\ngq@chapterfalse}
\DeclareOption{chapter}{\ngq@chaptertrue}
\DeclareOption{anonymous}{\ngq@anontrue}
\DeclareOption{numbered}{\ngq@authoryearfalse}
\DeclareOption{authoryear}{\ngq@authoryeartrue}
\DeclareOption{lineno}{\ngq@linenotrue}
\DeclareOption*{\PassOptionsToClass{\CurrentOption}{article}}
\ProcessOptions\relax

\LoadClass[11pt,a4paper]{article}

%% Fonts and page ------------------------------------------------------------
\RequirePackage[T1]{fontenc}
\RequirePackage{amsmath,amssymb}
\RequirePackage{newtxtext,newtxmath}
\RequirePackage{microtype}
\RequirePackage[a4paper,top=25mm,bottom=25mm,left=25mm,right=25mm,headheight=14pt]{geometry}
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
  \RequirePackage{lineno}
  \AtBeginDocument{\linenumbers}
\fi
\RequirePackage[hidelinks]{hyperref}

\definecolor{ngqink}{HTML}{101B27}
\definecolor{ngqaccent}{HTML}{0C8375}
\definecolor{ngqmuted}{HTML}{505C68}

\linespread{1.15}
\setlength{\parindent}{1.2em}
\setlength{\parskip}{0pt}
\setlist{itemsep=2pt,topsep=4pt}

%% Front matter -------------------------------------------------------------
\def\ngq@pubname{Publication name}
\def\ngq@pubcode{CODE}
\def\ngq@short{Short title}
\def\ngq@type{\ifngq@chapter Chapter\else Research Article\fi}
\def\ngq@keywords{}
\def\ngq@corr{}
\def\ngq@volume{}

%% \publication{Full name}{Code}
\newcommand\publication[2]{\def\ngq@pubname{#1}\def\ngq@pubcode{#2}}
%% Running head, at most about 50 characters.
\newcommand\shorttitle[1]{\def\ngq@short{#1}}
%% Research Article, Review Article, Short Communication, Chapter, ...
\newcommand\articletype[1]{\def\ngq@type{#1}}
%% Chapters: title of the volume the chapter is written for.
\newcommand\volumetitle[1]{\def\ngq@volume{#1}}
\newcommand\keywords[1]{\def\ngq@keywords{#1}}
\newcommand\correspondence[1]{\def\ngq@corr{#1}}

\renewcommand\Authfont{\normalsize\bfseries}
\renewcommand\Affilfont{\small\normalfont\color{ngqmuted}}
\renewcommand\Authsep{, }
\renewcommand\Authand{ and }
\renewcommand\Authands{, and }
\setlength{\affilsep}{4pt}

\renewcommand\maketitle{%
  \thispagestyle{ngqfirst}%
  \ifngq@lineno\nolinenumbers\fi
  \begingroup\raggedright
  \IfFileExists{nextgeniq-logo.png}{%
    \raisebox{-.35\height}{\includegraphics[height=11mm]{nextgeniq-logo.png}}\hspace{3mm}%
  }{}%
  \begin{minipage}[c]{.8\linewidth}
    {\small\bfseries\color{ngqink}\ngq@pubname}\\[1pt]
    {\footnotesize\color{ngqmuted}NextGenIQ Press%
      \ifx\ngq@volume\@empty\else\ \textperiodcentered\ \textit{\ngq@volume}\fi}
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
  \ifngq@lineno\linenumbers\fi
  \let\maketitle\relax
}

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

\endinput
