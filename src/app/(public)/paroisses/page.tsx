import type { Metadata } from 'next'
import { ParoissesPage } from '../../../views/ParoissesPage'

export const metadata: Metadata = { title: 'Annuaire des paroisses' }

export default function Page() {
  return <ParoissesPage />
}
