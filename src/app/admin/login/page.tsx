import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LoginPage } from '../../../views/admin/LoginPage'

export const metadata: Metadata = { title: 'Connexion administration' }

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  )
}
