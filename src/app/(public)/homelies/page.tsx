import type { Metadata } from 'next'
import { HomeliesPage } from '../../../views/HomeliesPage'

export const metadata: Metadata = { title: 'Homélies' }

export default function Page() {
  return <HomeliesPage />
}
