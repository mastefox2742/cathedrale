import type { Metadata } from 'next'
import { MurPrierePage } from '../../../../views/prier/MurPrierePage'

export const metadata: Metadata = { title: 'Mur de prière', description: 'Confiez une intention et priez pour celles des autres.' }

export default function Page() {
  return <MurPrierePage />
}
