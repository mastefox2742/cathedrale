import type { Metadata } from 'next'
import { DemarchesPage } from '../../../views/DemarchesPage'

export const metadata: Metadata = { title: 'Démarches pastorales' }

export default function Page() {
  return <DemarchesPage />
}
