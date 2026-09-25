import type { Metadata } from 'next'
import { AdminSignalementsPage } from '../../../../views/admin/AdminSignalementsPage'

export const metadata: Metadata = { title: 'Admin — Signalements' }

export default function Page() {
  return <AdminSignalementsPage />
}
