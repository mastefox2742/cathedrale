import type { Metadata } from 'next'
import { AdminAuditLogPage } from '../../../../views/admin/AdminAuditLogPage'

export const metadata: Metadata = { title: "Admin — Journaux d'audit" }

export default function Page() {
  return <AdminAuditLogPage />
}
