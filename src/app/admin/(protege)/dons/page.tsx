import type { Metadata } from 'next'
import { AdminDonsPage } from '../../../../views/admin/AdminDonsPage'

export const metadata: Metadata = { title: 'Admin — Dons reçus' }

export default function Page() {
  return <AdminDonsPage />
}
