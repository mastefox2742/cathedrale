import type { Metadata } from 'next'
import { HistoirePage } from '../../../views/HistoirePage'

export const metadata: Metadata = { title: 'Notre Histoire' }

export default function Page() {
  return <HistoirePage />
}
