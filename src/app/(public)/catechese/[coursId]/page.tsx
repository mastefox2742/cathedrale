import type { Metadata } from 'next'
import { CoursPage } from '../../../../views/CoursPage'

export const metadata: Metadata = { title: 'Cours de catéchèse' }

export default function Page() {
  return <CoursPage />
}
