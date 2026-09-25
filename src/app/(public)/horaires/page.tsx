import type { Metadata } from 'next'
import { HorairesPage } from '../../../views/HorairesPage'

export const metadata: Metadata = { title: 'Horaires & Contact' }

export default function Page() {
  return <HorairesPage />
}
