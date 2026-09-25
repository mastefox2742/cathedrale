import type { Metadata } from 'next'
import { AdminProjetsDonsPage } from '../../../../views/admin/AdminProjetsDonsPage'

export const metadata: Metadata = { title: 'Admin — Projets de dons' }

export default function Page() {
  return <AdminProjetsDonsPage />
}
