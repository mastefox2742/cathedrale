import type { Metadata } from 'next'
import { ParcoursPage } from '../../../../views/ParcoursPage'

export const metadata: Metadata = { title: 'Parcours de foi' }

export default function Page() {
  return <ParcoursPage />
}
