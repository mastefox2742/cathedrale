import type { Metadata } from 'next'
import { ConnexionPage } from '../../../views/ConnexionPage'

export const metadata: Metadata = { title: 'Créer un compte' }

export default function Page() {
  return <ConnexionPage modeInitial="register" />
}
