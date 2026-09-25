import type { Metadata } from 'next'
import { AdminAbonnesPage } from '../../../../views/admin/AdminAbonnesPage'

export const metadata: Metadata = { title: 'Admin — Abonnés' }

export default function Page() {
  return <AdminAbonnesPage />
}
