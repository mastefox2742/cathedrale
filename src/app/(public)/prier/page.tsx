import type { Metadata } from 'next'
import { PrierPage } from '../../../views/PrierPage'

export const metadata: Metadata = { title: 'Prier', description: 'Évangile du jour, liturgie des heures, chapelet, mur de prière, neuvaines.' }

export default function Page() {
  return <PrierPage />
}
