import type { Metadata } from 'next'
import { NeuvainesPage } from '../../../../views/prier/NeuvainesPage'

export const metadata: Metadata = { title: 'Neuvaines et retraites', description: 'Neuvaines et retraites spirituelles en ligne.' }

export default function Page() {
  return <NeuvainesPage />
}
