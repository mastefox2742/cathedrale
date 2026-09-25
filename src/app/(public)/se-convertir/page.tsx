import type { Metadata } from 'next'
import { ParcoursListePage } from '../../../views/ParcoursListePage'

export const metadata: Metadata = { title: 'Je veux me convertir', description: 'Devenir chrétien : étapes du catéchuménat, témoignages, accompagnement.' }

export default function Page() {
  return <ParcoursListePage type="conversion" />
}
