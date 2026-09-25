import type { Metadata } from 'next'
import { ParcoursListePage } from '../../../views/ParcoursListePage'

export const metadata: Metadata = { title: 'Approfondir ma foi' }

export default function Page() {
  return <ParcoursListePage type="approfondir" />
}
