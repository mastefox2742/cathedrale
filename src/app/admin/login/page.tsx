import type { Metadata } from 'next'
import { LoginPage } from '../../../views/admin/LoginPage'

export const metadata: Metadata = { title: 'Connexion administration' }

export default function Page() {
  return <LoginPage />
}
