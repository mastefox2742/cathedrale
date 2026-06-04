import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminGuard } from './components/admin/AdminGuard'

// ── Chargement paresseux — réduit le bundle initial ────────────────────────
// Pages publiques
const HomePage          = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const LiturgiePage      = lazy(() => import('./pages/LiturgiePage').then(m => ({ default: m.LiturgiePage })))
const AnnoncesPage      = lazy(() => import('./pages/AnnoncesPage').then(m => ({ default: m.AnnoncesPage })))
const EvenementsPage    = lazy(() => import('./pages/EvenementsPage').then(m => ({ default: m.EvenementsPage })))
const CatechesePage     = lazy(() => import('./pages/CatechesePage').then(m => ({ default: m.CatechesePage })))
const CoursPage         = lazy(() => import('./pages/CoursPage').then(m => ({ default: m.CoursPage })))
const VieSpirituellePage = lazy(() => import('./pages/VieSpiritellePage').then(m => ({ default: m.VieSpirituellePage })))
const HorairesPage      = lazy(() => import('./pages/HorairesPage').then(m => ({ default: m.HorairesPage })))
const AbonnementsPage   = lazy(() => import('./pages/AbonnementsPage').then(m => ({ default: m.AbonnementsPage })))
const DonsPage          = lazy(() => import('./pages/DonsPage').then(m => ({ default: m.DonsPage })))

// Pages admin (chunk séparé)
const LoginPage               = lazy(() => import('./pages/admin/LoginPage').then(m => ({ default: m.LoginPage })))
const DashboardPage           = lazy(() => import('./pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage })))
const AdminAnnoncesPage       = lazy(() => import('./pages/admin/AdminAnnoncesPage').then(m => ({ default: m.AdminAnnoncesPage })))
const AdminHomeliesPage       = lazy(() => import('./pages/admin/AdminHomeliesPage').then(m => ({ default: m.AdminHomeliesPage })))
const AdminFormationsPage     = lazy(() => import('./pages/admin/AdminFormationsPage').then(m => ({ default: m.AdminFormationsPage })))
const AdminMediasPage         = lazy(() => import('./pages/admin/AdminMediasPage').then(m => ({ default: m.AdminMediasPage })))
const AdminEvenementsPage     = lazy(() => import('./pages/admin/AdminEvenementsPage').then(m => ({ default: m.AdminEvenementsPage })))
const AdminCatechismePage     = lazy(() => import('./pages/admin/AdminCatechismePage').then(m => ({ default: m.AdminCatechismePage })))
const AdminNotificationsPage  = lazy(() => import('./pages/admin/AdminNotificationsPage').then(m => ({ default: m.AdminNotificationsPage })))

// ── Spinner de chargement ──────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '60vh', flexDirection: 'column', gap: 16,
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        border: '3px solid var(--surface-container)',
        borderTopColor: 'var(--primary)',
        animation: 'spin 0.8s linear infinite',
      }} />
      <p style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>Chargement…</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Site public ── */}
        <Route path="/" element={<Layout><Wrap><HomePage /></Wrap></Layout>} />
        <Route path="/liturgie"           element={<Layout><Wrap><LiturgiePage /></Wrap></Layout>} />
        <Route path="/annonces"           element={<Layout><Wrap><AnnoncesPage /></Wrap></Layout>} />
        <Route path="/evenements"         element={<Layout><Wrap><EvenementsPage /></Wrap></Layout>} />
        <Route path="/catechese"          element={<Layout><Wrap><CatechesePage /></Wrap></Layout>} />
        <Route path="/catechese/:coursId" element={<Layout><Wrap><CoursPage /></Wrap></Layout>} />
        <Route path="/vie-spirituelle"    element={<Layout><Wrap><VieSpirituellePage /></Wrap></Layout>} />
        <Route path="/horaires"            element={<Layout><Wrap><HorairesPage /></Wrap></Layout>} />
        <Route path="/abonnements"         element={<Layout><Wrap><AbonnementsPage /></Wrap></Layout>} />
        <Route path="/dons"                element={<Layout><Wrap><DonsPage /></Wrap></Layout>} />

        {/* ── Admin ── */}
        <Route path="/admin/login" element={<Wrap><LoginPage /></Wrap>} />
        <Route path="/admin" element={
          <AdminGuard>
            <AdminLayout><Wrap><DashboardPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/annonces" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminAnnoncesPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/homelies" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminHomeliesPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/formations" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminFormationsPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/medias" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminMediasPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/evenements" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminEvenementsPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/catechisme" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminCatechismePage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/notifications" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminNotificationsPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />

      </Routes>
    </BrowserRouter>
  )
}
