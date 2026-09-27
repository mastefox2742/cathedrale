import type { Metadata } from 'next'
import { ChapeletPage } from '../../../../views/prier/ChapeletPage'

export const metadata: Metadata = { title: 'Chapelet du jour', description: 'Les mystères du jour et la manière de prier le chapelet.' }

export default function Page() {
  return <ChapeletPage />
}
