import type { Metadata } from 'next'
import { ParcoursListePage } from '../../../views/ParcoursListePage'

export const metadata: Metadata = { title: 'Je découvre la foi', description: 'Premiers pas dans la foi chrétienne : parcours simples et sans engagement.' }

export default function Page() {
  return <ParcoursListePage type="decouvrir" />
}
