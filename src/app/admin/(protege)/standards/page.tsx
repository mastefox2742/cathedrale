import type { Metadata } from 'next'
import { AdminStandardsPage } from '../../../../views/admin/AdminStandardsPage'

export const metadata: Metadata = { title: 'Admin — Standards & chartes' }

export default function Page() {
  return <AdminStandardsPage />
}
