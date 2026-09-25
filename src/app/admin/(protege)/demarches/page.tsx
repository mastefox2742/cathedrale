import type { Metadata } from 'next'
import { AdminDemarchesPage } from '../../../../views/admin/AdminDemarchesPage'

export const metadata: Metadata = { title: 'Admin — Démarches pastorales' }

export default function Page() {
  return <AdminDemarchesPage />
}
