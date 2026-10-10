/** Cover art per book series. */
export const bookCovers: Record<string, string> = {
  isri: '/images/books/cover-isri.jpg',
  lnisi: '/images/books/cover-lnisi.jpg',
}

export const bookCover = (slug: string) => bookCovers[slug]
