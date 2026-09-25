import type { Metadata } from 'next'
import { ConnexionPage } from '../../../views/ConnexionPage'

export const metadata: Metadata = { title: 'Mon profil' }

export default function Page() {
  return <ConnexionPage />
}
