import type { Metadata } from 'next'
import { HistoireArchidiocesePage } from '../../../views/HistoireArchidiocesePage'

export const metadata: Metadata = { title: "Histoire de l'archidiocèse" }

export default function Page() {
  return <HistoireArchidiocesePage />
}
