import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../services/supabase'
import { getCoursById, type Cours } from '../services/catechisme'
import { getMesFormations } from '../services/formationProgress'
import { Attestation } from '../components/Attestation'

export function AttestationPage() {
  const { coursId } = useParams<{ coursId: string }>()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [cours, setCours] = useState<Cours | null>(null)
  const [completedAt, setCompletedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
  }, [])

  useEffect(() => {
    if (session === undefined || !coursId) return
    if (!session) { setLoading(false); return }
    Promise.all([getCoursById(coursId), getMesFormations(session.user.id)])
      .then(([c, progress]) => {
        setCours(c)
        const entry = progress.find(p => p.cours_id === coursId && p.statut === 'termine')
        setCompletedAt(entry?.completed_at ?? null)
      })
      .finally(() => setLoading(false))
  }, [session, coursId])

  if (loading || session === undefined) {
    return <div style={{ padding: '80px 20px', textAlign: 'center' }}><div className="page-loader-ring" style={{ margin: '0 auto' }} /></div>
  }

  if (!session) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 20px', textAlign: 'center', fontFamily: 'var(--v2-font-sans)' }}>
        <p style={{ fontSize: 15, color: 'var(--text-light)' }}>Connectez-vous à votre Espace Membre pour accéder à votre attestation.</p>
      </div>
    )
  }

  if (!cours || !completedAt) {
    return (
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 20px', textAlign: 'center', fontFamily: 'var(--v2-font-sans)' }}>
        <p style={{ fontSize: 15, color: 'var(--text-light)' }}>
          Vous n'avez pas encore terminé ce parcours — l'attestation n'est disponible qu'une fois le parcours achevé.
        </p>
      </div>
    )
  }

  return (
    <Attestation
      emetteur="Cathédrale Sacré-Cœur de Brazzaville"
      intitule="a suivi avec succès le parcours de catéchisme"
      titre={`${cours.emoji} ${cours.titre}`}
      completedAt={completedAt}
    />
  )
}
