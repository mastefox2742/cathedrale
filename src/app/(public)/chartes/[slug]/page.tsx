import type { Metadata } from 'next'
import { ChartePage } from '../../../../views/ChartePage'

export const metadata: Metadata = { title: 'Charte' }

export default function Page() {
  return <ChartePage />
}
