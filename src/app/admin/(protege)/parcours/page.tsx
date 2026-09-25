import type { Metadata } from 'next'
import { AdminParcoursPage } from '../../../../views/admin/AdminParcoursPage'

export const metadata: Metadata = { title: 'Admin — Parcours de foi' }

export default function Page() {
  return <AdminParcoursPage />
}
