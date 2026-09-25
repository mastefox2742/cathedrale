import type { Metadata } from 'next'
import { JeunessePage } from '../../../views/JeunessePage'

export const metadata: Metadata = { title: 'Espace Jeunesse' }

export default function Page() {
  return <JeunessePage />
}
