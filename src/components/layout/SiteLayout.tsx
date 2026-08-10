import { Outlet } from 'react-router-dom'
import SiteFooter from './SiteFooter'
import SiteHeader from './SiteHeader'

function SiteLayout() {
  return (
    <div className="min-h-screen bg-paper text-slate-800">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

export default SiteLayout
