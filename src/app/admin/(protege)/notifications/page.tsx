import type { Metadata } from 'next'
import { AdminNotificationsPage } from '../../../../views/admin/AdminNotificationsPage'

export const metadata: Metadata = { title: 'Admin — Notifications' }

export default function Page() {
  return <AdminNotificationsPage />
}
