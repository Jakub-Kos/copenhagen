import { Suspense, lazy } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { Header } from '@/components/Header'
import { OfflineBanner } from '@/components/OfflineBanner'
import { OpenToday } from '@/components/OpenToday'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { StoreProvider } from '@/state/StoreProvider'
import Guide from '@/pages/Guide'
import Today from '@/pages/Today'

// Guide and Today are the usual entry points; the other pages load when first opened.
const Plan = lazy(() => import('@/pages/Plan'))
const Costs = lazy(() => import('@/pages/Costs'))
const Info = lazy(() => import('@/pages/Info'))
const Print = lazy(() => import('@/pages/Print'))
const ShareImport = lazy(() => import('@/pages/ShareImport'))

// HashRouter: GitHub Pages serves only index.html, so routes live after "#".
// That keeps deep links and refreshes working without the 404.html trick, and
// share links (#/share/…) never reach a server.
export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <OpenToday />
        <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))] print:pb-0">
          <Header />
          <OfflineBanner />
          <main>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Guide />} />
                <Route path="/plan" element={<Plan />} />
                <Route path="/today" element={<Today />} />
                <Route path="/costs" element={<Costs />} />
                <Route path="/info" element={<Info />} />
                <Route path="/print" element={<Print />} />
                <Route path="/share/:data" element={<ShareImport />} />
                <Route path="*" element={<Guide />} />
              </Routes>
            </Suspense>
          </main>
          <UpdatePrompt />
          <BottomNav />
        </div>
      </HashRouter>
    </StoreProvider>
  )
}
