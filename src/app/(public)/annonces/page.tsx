import type { Metadata } from 'next'
import { AnnoncesPage } from '../../../views/AnnoncesPage'

export const metadata: Metadata = { title: 'Annonces & Agenda' }

export default function Page() {
  return <AnnoncesPage />
}
