import type { Metadata } from 'next'
import { GroupesPrierePage } from '../../../../views/prier/GroupesPrierePage'

export const metadata: Metadata = { title: 'Groupes de prière', description: 'Rejoindre un groupe de prière, de partage biblique ou de liturgie.' }

export default function Page() {
  return <GroupesPrierePage />
}
