import type { Metadata } from 'next'
import { AdminCatechismePage } from '../../../../views/admin/AdminCatechismePage'

export const metadata: Metadata = { title: 'Admin — Catéchisme' }

export default function Page() {
  return <AdminCatechismePage />
}
