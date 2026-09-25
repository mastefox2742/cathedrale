import type { Metadata } from 'next'
import { LiturgiePage } from '../../../views/LiturgiePage'

export const metadata: Metadata = { title: 'Liturgie du jour' }

export default function Page() {
  return <LiturgiePage />
}
