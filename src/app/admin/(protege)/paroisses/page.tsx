import type { Metadata } from 'next'
import { AdminParoissesPage } from '../../../../views/admin/AdminParoissesPage'

export const metadata: Metadata = { title: 'Admin — Paroisses' }

export default function Page() {
  return <AdminParoissesPage />
}
