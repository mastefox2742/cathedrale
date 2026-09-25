import type { Metadata } from 'next'
import { TemoignagesPage } from '../../../views/TemoignagesPage'

export const metadata: Metadata = { title: 'Témoignages' }

export default function Page() {
  return <TemoignagesPage />
}
