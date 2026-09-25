import type { Metadata } from 'next'
import { AdminGroupesPage } from '../../../../views/admin/AdminGroupesPage'

export const metadata: Metadata = { title: 'Admin — Groupes & adhésions' }

export default function Page() {
  return <AdminGroupesPage />
}
