import type { Metadata } from 'next'
import { AdminUtilisateursPage } from '../../../../views/admin/AdminUtilisateursPage'

export const metadata: Metadata = { title: 'Admin — Utilisateurs & Rôles' }

export default function Page() {
  return <AdminUtilisateursPage />
}
