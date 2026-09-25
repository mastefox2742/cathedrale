import type { Metadata } from 'next'
import { AbonnementsPage } from '../../../views/AbonnementsPage'

export const metadata: Metadata = { title: "S'abonner" }

export default function Page() {
  return <AbonnementsPage />
}
