import type { Metadata } from 'next'
import { AdminAnnoncesPage } from '../../../../views/admin/AdminAnnoncesPage'

export const metadata: Metadata = { title: 'Admin — Annonces' }

export default function Page() {
  return <AdminAnnoncesPage />
}
