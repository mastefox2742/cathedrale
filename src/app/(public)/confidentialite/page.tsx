import type { Metadata } from 'next'
import { ConfidentialitePage } from '../../../views/ConfidentialitePage'

export const metadata: Metadata = { title: 'Politique de confidentialité', description: 'Données personnelles : ce que nous collectons, pourquoi, combien de temps, et vos droits.' }

export default function Page() {
  return <ConfidentialitePage />
}
