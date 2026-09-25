import type { Metadata } from 'next'
import { AdminFormationsPage } from '../../../../views/admin/AdminFormationsPage'

export const metadata: Metadata = { title: 'Admin — Formations' }

export default function Page() {
  return <AdminFormationsPage />
}
