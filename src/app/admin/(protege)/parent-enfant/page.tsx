import type { Metadata } from 'next'
import { AdminParentEnfantPage } from '../../../../views/admin/AdminParentEnfantPage'

export const metadata: Metadata = { title: 'Admin — Suivi Parent-Enfant' }

export default function Page() {
  return <AdminParentEnfantPage />
}
