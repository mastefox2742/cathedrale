import type { Metadata } from 'next'
import { SignalerPage } from '../../../views/SignalerPage'

export const metadata: Metadata = { title: 'Signaler une préoccupation' }

export default function Page() {
  return <SignalerPage />
}
