import FeaturedJournalsSection from '../components/home/FeaturedJournalsSection'
import HomeHero from '../components/home/HomeHero'
import LatestArticlesSection from '../components/home/LatestArticlesSection'
import TrustHighlightsSection from '../components/home/TrustHighlightsSection'

function HomePage() {
  return (
    <>
      <HomeHero />
      <FeaturedJournalsSection />
      <LatestArticlesSection />
      <TrustHighlightsSection />
    </>
  )
}

export default HomePage
