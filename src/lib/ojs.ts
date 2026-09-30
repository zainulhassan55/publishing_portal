const ojsBase = String(import.meta.env.VITE_OJS_URL || 'http://localhost:8000').replace(/\/$/, '')

const ojsPath = (context: string, path = '') => `${ojsBase}/index.php/${context}${path}`

export const ojsLoginUrl = ojsPath('index', '/login')
export const ojsRegisterUrl = ojsPath('index', '/user/register')

export const ojsJournalUrl = (slug: string) => ojsPath(slug)
export const ojsSubmitUrl = (slug: string) => ojsPath(slug, '/submission')
export const ojsJournalRegisterUrl = (slug: string) => ojsPath(slug, '/user/register')
