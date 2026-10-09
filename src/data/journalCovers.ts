/** Cover art per journal. Served from /public so Next can optimise them. */
export const journalCovers: Record<string, string> = {
  ijdh: '/images/journals/cover-ijdh.jpg',
  ijdm: '/images/journals/cover-ijdm.jpg',
  ijds: '/images/journals/cover-ijds.jpg',
  ijei: '/images/journals/cover-ijei.jpg',
  ijic: '/images/journals/cover-ijic.jpg',
  ijis: '/images/journals/cover-ijis.jpg',
  ijmc: '/images/journals/cover-ijmc.jpg',
  ijmr: '/images/journals/cover-ijmr.jpg',
  ijqt: '/images/journals/cover-ijqt.jpg',
  ijse: '/images/journals/cover-ijse.jpg',
}

export const journalCover = (slug: string) => journalCovers[slug]
