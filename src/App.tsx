import { Navigate, Route, Routes } from 'react-router-dom'
import SiteLayout from './components/layout/SiteLayout'
import AboutPage from './pages/AboutPage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import ArticlesPage from './pages/ArticlesPage'
import BooksPage from './pages/BooksPage'
import CfpPage from './pages/CfpPage'
import ContactPage from './pages/ContactPage'
import GuidelinesPage from './pages/GuidelinesPage'
import HomePage from './pages/HomePage'
import IndexingPage from './pages/IndexingPage'
import JournalArchivePage from './pages/JournalArchivePage'
import JournalDetailPage from './pages/JournalDetailPage'
import JournalsPage from './pages/JournalsPage'
import LoginPage from './pages/LoginPage'
import NewsPage from './pages/NewsPage'
import PolicyDetailPage from './pages/PolicyDetailPage'
import PoliciesPage from './pages/PoliciesPage'
import ProceedingsPage from './pages/ProceedingsPage'
import SpecialIssuesPage from './pages/SpecialIssuesPage'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/journals" element={<JournalsPage />} />
        <Route path="/journals/:slug" element={<JournalDetailPage />} />
        <Route path="/journals/:slug/issues" element={<JournalArchivePage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:slug" element={<ArticleDetailPage />} />
        <Route path="/books" element={<BooksPage />} />
        <Route path="/proceedings" element={<ProceedingsPage />} />
        <Route path="/cfp" element={<CfpPage />} />
        <Route path="/special-issues" element={<SpecialIssuesPage />} />
        <Route path="/guidelines" element={<GuidelinesPage />} />
        <Route path="/indexing" element={<IndexingPage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/policies" element={<PoliciesPage />} />
        <Route path="/policies/:slug" element={<PolicyDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
