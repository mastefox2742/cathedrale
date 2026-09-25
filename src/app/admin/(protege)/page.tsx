import type { Metadata } from 'next'
import { DashboardPage } from '../../../views/admin/DashboardPage'

export const metadata: Metadata = { title: 'Admin — Tableau de bord' }

export default function Page() {
  return <DashboardPage />
}
