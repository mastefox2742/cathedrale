import type { Metadata } from 'next'
import { AttestationPage } from '../../../../views/AttestationPage'

export const metadata: Metadata = { title: 'Attestation' }

export default function Page() {
  return <AttestationPage />
}
