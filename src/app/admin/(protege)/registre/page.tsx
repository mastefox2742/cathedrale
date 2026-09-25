import type { Metadata } from 'next'
import { AdminRegistrePage } from '../../../../views/admin/AdminRegistrePage'

export const metadata: Metadata = { title: 'Admin — Registre du staff' }

export default function Page() {
  return <AdminRegistrePage />
}
