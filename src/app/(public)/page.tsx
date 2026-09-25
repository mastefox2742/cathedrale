import type { Metadata } from 'next'
import { HomePage } from '../../views/HomePage'

export const metadata: Metadata = { title: 'Accueil', description: 'Évangélisation, médiation, catéchèse et prière — Archidiocèse de Brazzaville.' }

export default function Page() {
  return <HomePage />
}
