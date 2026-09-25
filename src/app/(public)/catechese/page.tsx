import type { Metadata } from 'next'
import { CatechesePage } from '../../../views/CatechesePage'

export const metadata: Metadata = { title: 'Catéchèse' }

export default function Page() {
  return <CatechesePage />
}
