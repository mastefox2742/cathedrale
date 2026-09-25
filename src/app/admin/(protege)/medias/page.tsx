import type { Metadata } from 'next'
import { AdminMediasPage } from '../../../../views/admin/AdminMediasPage'

export const metadata: Metadata = { title: 'Admin — Médiathèque' }

export default function Page() {
  return <AdminMediasPage />
}
