import { Navigate, useParams } from 'react-router-dom'
import Container from '../components/layout/Container'
import PageHero from '../components/layout/PageHero'
import ActionLink from '../components/shared/ActionLink'
import DetailSection from '../components/shared/DetailSection'
import SidebarPanel from '../components/shared/SidebarPanel'
import { articleDetails } from '../data/siteContent'

function ArticleDetailPage() {
  const { slug } = useParams()
  const article = articleDetails.find((item) => item.slug === slug)

  if (!article) {
    return <Navigate to="/articles" replace />
  }

  return (
    <>
      <PageHero
        eyebrow="Article record"
        title={article.title}
        description={`${article.journal} · ${article.volumeIssue} · Published ${article.published}`}
      />

      <section className="bg-paper py-14 sm:py-16">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <DetailSection title="Authors">
                <p>{article.authors.join(', ')}</p>
              </DetailSection>
              <DetailSection title="Abstract">
                <p>{article.abstract}</p>
              </DetailSection>
              <DetailSection title="Keywords">
                <div className="flex flex-wrap gap-2">
                  {article.keywords.map((keyword) => (
                    <span key={keyword} className="badge">
                      {keyword}
                    </span>
                  ))}
                </div>
              </DetailSection>
            </div>

            <div className="space-y-4">
              <SidebarPanel title="Article metadata">
                <p>{article.doi}</p>
                <p>{article.published}</p>
                <p>{article.volumeIssue}</p>
              </SidebarPanel>
              <SidebarPanel title="Reader actions">
                <p>Download PDF</p>
                <p>Copy citation</p>
                <p>View related articles</p>
              </SidebarPanel>
              <ActionLink href="#" variant="primary" className="w-full">
                Download PDF
              </ActionLink>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}

export default ArticleDetailPage
