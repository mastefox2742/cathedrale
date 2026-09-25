import { Suspense, type ReactNode } from 'react'
import { AdminGuard } from '../../../components/admin/AdminGuard'
import { AdminLayout } from '../../../components/admin/AdminLayout'

/**
 * Double protection : src/proxy.ts (middleware Next.js) refuse l'accès côté
 * serveur sans session de staff ; AdminGuard revérifie côté navigateur et
 * gère l'affichage pendant le chargement du profil.
 */
export default function AdminProtegeLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <AdminLayout>
        <Suspense fallback={null}>{children}</Suspense>
      </AdminLayout>
    </AdminGuard>
  )
}
