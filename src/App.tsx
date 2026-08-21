import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout2 } from './components/layout/Layout2'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminGuard } from './components/admin/AdminGuard'

// ── Chargement paresseux — réduit le bundle initial ────────────────────────
// Pages publiques (design éditorial "Sombre & Doré", porté de cathedrale-v2)
const HomePage          = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const LiturgiePage      = lazy(() => import('./pages/LiturgiePage').then(m => ({ default: m.LiturgiePage })))
const AnnoncesPage      = lazy(() => import('./pages/AnnoncesPage').then(m => ({ default: m.AnnoncesPage })))
const EvenementsPage    = lazy(() => import('./pages/EvenementsPage').then(m => ({ default: m.EvenementsPage })))
const CatechesePage     = lazy(() => import('./pages/CatechesePage').then(m => ({ default: m.CatechesePage })))
const CoursPage         = lazy(() => import('./pages/CoursPage').then(m => ({ default: m.CoursPage })))
const VieSpirituellePage = lazy(() => import('./pages/VieSpirituellePage').then(m => ({ default: m.VieSpirituellePage })))
const JeunessePage        = lazy(() => import('./pages/JeunessePage').then(m => ({ default: m.JeunessePage })))
const HorairesPage      = lazy(() => import('./pages/HorairesPage').then(m => ({ default: m.HorairesPage })))
const DemarchesPage     = lazy(() => import('./pages/DemarchesPage').then(m => ({ default: m.DemarchesPage })))
const DonsPage          = lazy(() => import('./pages/DonsPage').then(m => ({ default: m.DonsPage })))
const HomeliesPage      = lazy(() => import('./pages/HomeliesPage').then(m => ({ default: m.HomeliesPage })))
const HistoirePage      = lazy(() => import('./pages/HistoirePage').then(m => ({ default: m.HistoirePage })))
const AbonnementsPage   = lazy(() => import('./pages/AbonnementsPage').then(m => ({ default: m.AbonnementsPage })))
const ConnexionPage     = lazy(() => import('./pages/ConnexionPage').then(m => ({ default: m.ConnexionPage })))
const AttestationPage   = lazy(() => import('./pages/AttestationPage').then(m => ({ default: m.AttestationPage })))
const TemoignagesPage   = lazy(() => import('./pages/TemoignagesPage').then(m => ({ default: m.TemoignagesPage })))
const SignalerPage      = lazy(() => import('./pages/SignalerPage').then(m => ({ default: m.SignalerPage })))

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
const AdminAuditLogPage       = lazy(() => import('./pages/admin/AdminAuditLogPage').then(m => ({ default: m.AdminAuditLogPage })))
const AdminGroupesPage        = lazy(() => import('./pages/admin/AdminGroupesPage').then(m => ({ default: m.AdminGroupesPage })))
const AdminDemarchesPage      = lazy(() => import('./pages/admin/AdminDemarchesPage').then(m => ({ default: m.AdminDemarchesPage })))
const AdminIntentionsPage     = lazy(() => import('./pages/admin/AdminIntentionsPage').then(m => ({ default: m.AdminIntentionsPage })))
const AdminProjetsDonsPage    = lazy(() => import('./pages/admin/AdminProjetsDonsPage').then(m => ({ default: m.AdminProjetsDonsPage })))
const AdminEspaceCatechistePage = lazy(() => import('./pages/admin/AdminEspaceCatechistePage').then(m => ({ default: m.AdminEspaceCatechistePage })))
const AdminParentEnfantPage   = lazy(() => import('./pages/admin/AdminParentEnfantPage').then(m => ({ default: m.AdminParentEnfantPage })))
const AdminUtilisateursPage   = lazy(() => import('./pages/admin/AdminUtilisateursPage').then(m => ({ default: m.AdminUtilisateursPage })))
const AdminTemoignagesPage    = lazy(() => import('./pages/admin/AdminTemoignagesPage').then(m => ({ default: m.AdminTemoignagesPage })))
const AdminServicesParoissiauxPage = lazy(() => import('./pages/admin/AdminServicesParoissiauxPage').then(m => ({ default: m.AdminServicesParoissiauxPage })))
const AdminSignalementsPage   = lazy(() => import('./pages/admin/AdminSignalementsPage').then(m => ({ default: m.AdminSignalementsPage })))

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

        {/* ── Site public — design éditorial (Layout2 / cathedrale-v2) ── */}
        <Route path="/" element={<Layout2 transparent><Wrap><HomePage /></Wrap></Layout2>} />
        <Route path="/liturgie"           element={<Layout2><Wrap><LiturgiePage /></Wrap></Layout2>} />
        <Route path="/annonces"           element={<Layout2><Wrap><AnnoncesPage /></Wrap></Layout2>} />
        <Route path="/evenements"         element={<Layout2><Wrap><EvenementsPage /></Wrap></Layout2>} />
        <Route path="/catechese"          element={<Layout2><Wrap><CatechesePage /></Wrap></Layout2>} />
        <Route path="/catechese/:coursId" element={<Layout2><Wrap><CoursPage /></Wrap></Layout2>} />
        <Route path="/vie-spirituelle"    element={<Layout2><Wrap><VieSpirituellePage /></Wrap></Layout2>} />
        <Route path="/jeunesse"           element={<Layout2><Wrap><JeunessePage /></Wrap></Layout2>} />
        <Route path="/horaires"           element={<Layout2><Wrap><HorairesPage /></Wrap></Layout2>} />
        <Route path="/demarches"          element={<Layout2><Wrap><DemarchesPage /></Wrap></Layout2>} />
        <Route path="/dons"               element={<Layout2><Wrap><DonsPage /></Wrap></Layout2>} />
        <Route path="/homelies"           element={<Layout2><Wrap><HomeliesPage /></Wrap></Layout2>} />
        <Route path="/histoire"           element={<Layout2><Wrap><HistoirePage /></Wrap></Layout2>} />
        <Route path="/abonnements"        element={<Layout2><Wrap><AbonnementsPage /></Wrap></Layout2>} />
        <Route path="/connexion"          element={<Layout2><Wrap><ConnexionPage /></Wrap></Layout2>} />
        <Route path="/attestation/:coursId" element={<Wrap><AttestationPage /></Wrap>} />
        <Route path="/temoignages"        element={<Layout2><Wrap><TemoignagesPage /></Wrap></Layout2>} />
        <Route path="/signaler"           element={<Layout2><Wrap><SignalerPage /></Wrap></Layout2>} />

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
        <Route path="/admin/audit" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminAuditLogPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/groupes" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminGroupesPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/demarches" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminDemarchesPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/intentions" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminIntentionsPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/projets-dons" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminProjetsDonsPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/catechiste" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminEspaceCatechistePage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/parent-enfant" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminParentEnfantPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/utilisateurs" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminUtilisateursPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/temoignages" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminTemoignagesPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/services-paroissiaux" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminServicesParoissiauxPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />
        <Route path="/admin/signalements" element={
          <AdminGuard>
            <AdminLayout><Wrap><AdminSignalementsPage /></Wrap></AdminLayout>
          </AdminGuard>
        } />

      </Routes>
    </BrowserRouter>
  )
}
