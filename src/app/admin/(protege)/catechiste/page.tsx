import type { Metadata } from 'next'
import { AdminEspaceCatechistePage } from '../../../../views/admin/AdminEspaceCatechistePage'

export const metadata: Metadata = { title: 'Admin — Espace catéchiste' }

export default function Page() {
  return <AdminEspaceCatechistePage />
}
