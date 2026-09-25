import type { Metadata } from 'next'
import { AdminHomeliesPage } from '../../../../views/admin/AdminHomeliesPage'

export const metadata: Metadata = { title: 'Admin — Homélies' }

export default function Page() {
  return <AdminHomeliesPage />
}
