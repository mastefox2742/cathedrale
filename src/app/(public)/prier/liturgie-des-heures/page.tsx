import type { Metadata } from 'next'
import { LiturgieHeuresPage } from '../../../../views/prier/LiturgieHeuresPage'

export const metadata: Metadata = { title: 'Liturgie des heures', description: 'Laudes, milieu du jour, vêpres et complies du jour (textes AELF).' }

export default function Page() {
  return <LiturgieHeuresPage />
}
