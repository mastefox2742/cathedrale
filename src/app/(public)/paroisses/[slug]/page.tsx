import type { Metadata } from 'next'
import { ParoissePage } from '../../../../views/ParoissePage'

export const metadata: Metadata = { title: 'Paroisse' }

export default function Page() {
  return <ParoissePage />
}
