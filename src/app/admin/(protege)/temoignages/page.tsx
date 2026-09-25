import type { Metadata } from 'next'
import { AdminTemoignagesPage } from '../../../../views/admin/AdminTemoignagesPage'

export const metadata: Metadata = { title: 'Admin — Témoignages' }

export default function Page() {
  return <AdminTemoignagesPage />
}
