import type { Metadata } from 'next'
import { AdminTvPage } from '../../../../views/admin/AdminTvPage'

export const metadata: Metadata = { title: 'Admin — Médiation / TV' }

export default function Page() {
  return <AdminTvPage />
}
