'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { getParcoursBySlug, getEtapes, getEtapesTerminees, type Parcours } from '../services/parcours'
import { getParoisseById } from '../services/paroisses'
import { Attestation } from '../components/Attestation'

const INTITULES: Record<Parcours['type'], string> = {
  decouvrir: 'a suivi avec succès le parcours de découverte de la foi',
  conversion: 'a suivi avec succès le parcours',
  approfondir: 'a suivi avec succès le parcours de formation chrétienne',
  neuvaine: 'a prié la neuvaine',
  retraite: 'a suivi la retraite en ligne',
  formation_staff: 'a suivi avec succès la formation obligatoire',
}

export function ParcoursAttestationPage() {
  const { slug } = useParams<{ slug: string }>()
  const { user, loading: authLoading } = useAuth()
  const [parcours, setParcours] = useState<Parcours | null>(null)
  const [emetteur, setEmetteur] = useState('Archidiocèse de Brazzaville')
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || !slug) { setLoading(false); return }
    getParcoursBySlug(slug).then(async p => {
      setParcours(p)
      if (!p) return
      const [etapes, faites] = await Promise.all([getEtapes(p.id), getEtapesTerminees(user.id, p.id)])
      if (etapes.length > 0 && etapes.every(e => faites.has(e.id))) {
        setCompletedAt([...faites.values()].sort().at(-1) ?? null)
      }
      if (p.parishId) {
        const par = await getParoisseById(p.parishId).catch(() => null)
        if (par) setEmetteur(`${par.nom} · Brazzaville`)
      }
    }).finally(() => setLoading(false))
  }, [slug, user, authLoading])

  if (loading || authLoading) {
    return <div style={{ padding: '80px 20px', textAlign: 'center' }}><div className="page-loader-ring" style={{ margin: '0 auto' }} /></div>
  }

  if (!user || !parcours || !completedAt) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 20px', textAlign: 'center', fontFamily: 'var(--v2-font-sans)' }}>
        <p style={{ fontSize: 15, color: 'var(--text-light)', marginBottom: 20 }}>
          {!user
            ? 'Connectez-vous à votre Espace Membre pour accéder à votre attestation.'
            : "L'attestation n'est disponible qu'une fois toutes les étapes du parcours terminées."}
        </p>
        <Link href={user ? `/parcours/${slug}` : '/connexion'} className="btn-gold">{user ? 'Reprendre le parcours' : 'Se connecter'}</Link>
      </div>
    )
  }

  return (
    <Attestation
      emetteur={emetteur}
      intitule={INTITULES[parcours.type]}
      titre={`${parcours.emoji} ${parcours.titre}`}
      completedAt={completedAt}
      signataire={parcours.type === 'formation_staff' ? 'Le responsable' : "L'accompagnateur"}
    />
  )
}
