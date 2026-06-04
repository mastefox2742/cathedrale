import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminGuard } from './components/admin/AdminGuard'

// Pages publiques
import { HomePage } from './pages/HomePage'
import { LiturgiePage } from './pages/LiturgiePage'
import { AnnoncesPage } from './pages/AnnoncesPage'
import { EvenementsPage } from './pages/EvenementsPage'
import { CatechesePage } from './pages/CatechesePage'
import { CoursPage } from './pages/CoursPage'
import { VieSpirituellePage } from './pages/VieSpiritellePage'
import { HorairesPage } from './pages/HorairesPage'

// Pages admin
import { LoginPage } from './pages/admin/LoginPage'
import { DashboardPage } from './pages/admin/DashboardPage'
import { AdminAnnoncesPage } from './pages/admin/AdminAnnoncesPage'
import { AdminHomeliesPage } from './pages/admin/AdminHomeliesPage'
import { AdminFormationsPage } from './pages/admin/AdminFormationsPage'
import { AdminMediasPage } from './pages/admin/AdminMediasPage'
import { AdminEvenementsPage } from './pages/admin/AdminEvenementsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Site public ── */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/liturgie"        element={<Layout><LiturgiePage /></Layout>} />
        <Route path="/annonces"        element={<Layout><AnnoncesPage /></Layout>} />
        <Route path="/evenements"      element={<Layout><EvenementsPage /></Layout>} />
        <Route path="/catechese"           element={<Layout><CatechesePage /></Layout>} />
        <Route path="/catechese/:coursId"  element={<Layout><CoursPage /></Layout>} />
        <Route path="/vie-spirituelle" element={<Layout><VieSpirituellePage /></Layout>} />
        <Route path="/horaires"        element={<Layout><HorairesPage /></Layout>} />

        {/* ── Admin ── */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={
          <AdminGuard>
            <AdminLayout><DashboardPage /></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/annonces" element={
          <AdminGuard>
            <AdminLayout><AdminAnnoncesPage /></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/homelies" element={
          <AdminGuard>
            <AdminLayout><AdminHomeliesPage /></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/formations" element={
          <AdminGuard>
            <AdminLayout><AdminFormationsPage /></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/medias" element={
          <AdminGuard>
            <AdminLayout><AdminMediasPage /></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/evenements" element={
          <AdminGuard>
            <AdminLayout><AdminEvenementsPage /></AdminLayout>
          </AdminGuard>
        } />

      </Routes>
    </BrowserRouter>
  )
}
