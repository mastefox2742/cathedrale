import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { Session } from '@supabase/supabase-js'
import { Screen } from '../components/Screen'
import { BackHeader, PrimaryButton } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { supabase } from '../services/supabase'
import { getEtapes, getEtapesTerminees, terminerEtape, type Etape, type Parcours, type QuizQuestion } from '../services/parcours'

/** Rendu texte simple : titres, citations, listes et gras (** **) retirés proprement. */
function Contenu({ texte }: { texte: string }) {
  const net = (s: string) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1')
  return (
    <View style={{ gap: 8 }}>
      {texte.split('\n').filter(l => l.trim()).map((l, i) => {
        if (l.startsWith('## ')) return <Text key={i} style={styles.h3}>{net(l.slice(3))}</Text>
        if (l.startsWith('> ')) return <Text key={i} style={styles.citation}>{net(l.slice(2))}</Text>
        if (l.startsWith('- ')) return <Text key={i} style={styles.corps}>•  {net(l.slice(2))}</Text>
        return <Text key={i} style={styles.corps}>{net(l)}</Text>
      })}
    </View>
  )
}

function Question({ q }: { q: QuizQuestion }) {
  const [choix, setChoix] = useState<number | null>(null)
  return (
    <View style={styles.quiz}>
      <Text style={styles.quizQ}>{q.question}</Text>
      {q.reponses.map((r, i) => {
        const bonne = choix !== null && i === q.bonneReponse
        const fausse = choix === i && i !== q.bonneReponse
        return (
          <Pressable key={i} disabled={choix !== null} onPress={() => setChoix(i)}
            style={[styles.reponse, bonne && { borderColor: colors.chart3, backgroundColor: 'rgba(46,125,91,0.08)' }, fausse && { borderColor: colors.destructive }]}>
            <Text style={[styles.corps, bonne && { color: colors.chart3 }, fausse && { color: colors.destructive }]}>{r}</Text>
          </Pressable>
        )
      })}
      {choix !== null && q.explication ? <Text style={styles.muted}>{q.explication}</Text> : null}
    </View>
  )
}

export function ParcoursScreen() {
  const route = useRoute<any>()
  const navigation = useNavigation<any>()
  const parcours: Parcours = route.params.parcours
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [faites, setFaites] = useState<Set<string>>(new Set())
  const [active, setActive] = useState(0)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    getEtapes(parcours.id).then(setEtapes).catch(() => setEtapes([])).finally(() => setLoading(false))
  }, [parcours.id])

  useEffect(() => {
    if (!session || etapes.length === 0) return
    getEtapesTerminees(session.user.id, parcours.id).then(t => {
      setFaites(t)
      const idx = etapes.findIndex(e => !t.has(e.id))
      setActive(idx === -1 ? 0 : idx)
    }).catch(() => {})
  }, [session, etapes, parcours.id])

  const etape = etapes[active]

  async function suivant() {
    if (!etape) return
    if (session) {
      try {
        await terminerEtape(session.user.id, etape)
        setFaites(f => new Set(f).add(etape.id))
      } catch { /* réessayé à l'étape suivante */ }
    }
    if (active + 1 < etapes.length) setActive(active + 1)
  }

  function appelAction() {
    if (!etape) return
    if (etape.appelAction === 'parler_pretre' || etape.appelAction === 'demarche') navigation.navigate('Prier', { screen: 'Demarches' })
    else if (etape.appelAction === 'prier') navigation.navigate('Prier', { screen: 'Intentions' })
    else if (etape.appelAction === 'commencer_parcours') navigation.navigate('ParcoursListe', { types: ['approfondir'] })
  }

  return (
    <Screen>
      <BackHeader title={`${parcours.emoji} ${parcours.titre}`} subtitle={`${faites.size}/${etapes.length} étape${etapes.length > 1 ? 's' : ''}`} />
      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 14 }}>
        {loading ? <SkeletonList count={3} /> : !etape ? (
          <Text style={[styles.muted, { textAlign: 'center', paddingVertical: 30 }]}>Ce parcours ne contient pas encore d'étape.</Text>
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {etapes.map((e, i) => (
                <Pressable key={e.id} onPress={() => setActive(i)} style={[styles.pastille, i === active && { backgroundColor: colors.primary }, faites.has(e.id) && i !== active && { backgroundColor: colors.chart3 }]}>
                  <Text style={[styles.pastilleTxt, (i === active || faites.has(e.id)) && { color: colors.primaryForeground }]}>{i + 1}</Text>
                </Pressable>
              ))}
            </View>

            {!session && (
              <View style={styles.info}>
                <Icon name="lock" size={14} color={colors.primary} />
                <Text style={[styles.muted, { flex: 1 }]}>Connectez-vous (onglet Profil) pour enregistrer votre progression.</Text>
              </View>
            )}

            <Text style={styles.titre}>{etape.titre}</Text>
            {etape.videoUrl && (
              <Pressable onPress={() => Linking.openURL(etape.videoUrl!)} style={styles.info}>
                <Icon name="play-fill" size={14} color={colors.primary} />
                <Text style={[styles.corps, { color: colors.primary }]}>Regarder la vidéo</Text>
              </Pressable>
            )}
            <Contenu texte={etape.contenu} />
            {etape.quiz.map((q, i) => <Question key={`${etape.id}-${i}`} q={q} />)}

            {etape.appelAction !== 'aucun' && (
              <Pressable onPress={appelAction} style={styles.info}>
                <Icon name="arrow-right" size={14} color={colors.accent} />
                <Text style={[styles.corps, { color: colors.accent, fontFamily: fonts.sansBold }]}>Et maintenant ? Passer à l'action</Text>
              </Pressable>
            )}

            <PrimaryButton
              label={active + 1 < etapes.length ? 'Étape suivante' : (faites.size >= etapes.length ? 'Parcours terminé ✓' : 'Terminer le parcours')}
              icon={active + 1 < etapes.length ? 'arrow-right' : 'check-circle'}
              onPress={suivant}
            />
          </>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  titre: { fontFamily: fonts.heading, fontSize: 21, color: colors.primary },
  h3: { fontFamily: fonts.heading, fontSize: 16, color: colors.primary, marginTop: 6 },
  corps: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, color: colors.foreground },
  citation: { fontFamily: fonts.headingSemiBold, fontSize: 14, lineHeight: 22, color: colors.mutedForeground, borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 12 },
  muted: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12 },
  pastille: { width: 30, height: 30, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  pastilleTxt: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.primary },
  quiz: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14, gap: 8 },
  quizQ: { fontFamily: fonts.heading, fontSize: 15, color: colors.foreground },
  reponse: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
})
