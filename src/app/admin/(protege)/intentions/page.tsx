import type { Metadata } from 'next'
import { AdminIntentionsPage } from '../../../../views/admin/AdminIntentionsPage'

export const metadata: Metadata = { title: 'Admin — Intentions de prière' }

export default function Page() {
  return <AdminIntentionsPage />
}
