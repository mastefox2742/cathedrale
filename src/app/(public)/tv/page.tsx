import type { Metadata } from 'next'
import { TvPage } from '../../../views/TvPage'

export const metadata: Metadata = { title: 'Médiation / TV', description: "Directs, replays et playlists de la chaîne de l'archidiocèse." }

export default function Page() {
  return <TvPage />
}
