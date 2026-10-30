import { contentPageRoute } from '@/components/periodical/routes'

const route = contentPageRoute('journal')

export const generateStaticParams = route.generateStaticParams
export const generateMetadata = route.generateMetadata

/** See src/components/periodical/routes.tsx for why the hour is only a safety net. */
export const revalidate = 3600

export default route.Page
