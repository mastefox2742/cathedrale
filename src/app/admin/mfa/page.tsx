import { Suspense } from 'react'
import type { Metadata } from 'next'
import { MfaPage } from '../../../views/admin/MfaPage'

export const metadata: Metadata = { title: 'Double authentification', robots: { index: false } }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <MfaPage />
    </Suspense>
  )
}
