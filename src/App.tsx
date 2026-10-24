import { HashRouter, Route, Routes } from 'react-router-dom'
import { BottomNav } from '@/components/BottomNav'
import { Header } from '@/components/Header'
import { OpenToday } from '@/components/OpenToday'
import { StoreProvider } from '@/state/StoreProvider'
import Costs from '@/pages/Costs'
import Guide from '@/pages/Guide'
import Plan from '@/pages/Plan'
import ShareImport from '@/pages/ShareImport'
import Today from '@/pages/Today'

// HashRouter: GitHub Pages serves only index.html, so routes live after "#".
// That keeps deep links and refreshes working without the 404.html trick, and
// share links (#/share/…) never reach a server.
export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <OpenToday />
        <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Guide />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/today" element={<Today />} />
              <Route path="/costs" element={<Costs />} />
              <Route path="/share/:data" element={<ShareImport />} />
              <Route path="*" element={<Guide />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </HashRouter>
    </StoreProvider>
  )
}
