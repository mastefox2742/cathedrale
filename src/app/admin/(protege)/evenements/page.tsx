import type { Metadata } from 'next'
import { AdminEvenementsPage } from '../../../../views/admin/AdminEvenementsPage'

export const metadata: Metadata = { title: 'Admin — Vidéos & Replays' }

export default function Page() {
  return <AdminEvenementsPage />
}
