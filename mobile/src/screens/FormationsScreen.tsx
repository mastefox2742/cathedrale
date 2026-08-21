import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Screen } from '../components/Screen'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getCours, type Cours, type NiveauType } from '../services/catechisme'
import { supabase } from '../services/supabase'
import { getMesFormations, demarrerFormation, terminerFormation, type StatutFormation } from '../services/formations'

const FILTERS: { label: string; niveau: NiveauType | 'tous' }[] = [
  { label: 'Tous', niveau: 'tous' },
  { label: 'Enfants', niveau: 1 },
  { label: 'Ados', niveau: 3 },
  { label: 'Adultes', niveau: 4 },
]

export function FormationsScreen() {
  const navigation = useNavigation<any>()
  const [filter, setFilter] = useState<NiveauType | 'tous'>('tous')
  const [cours, setCours] = useState<Cours[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [progress, setProgress] = useState<Record<string, StatutFormation>>({})

  useEffect(() => {
    getCours().then(setCours).catch(() => setCours([])).finally(() => setLoading(false))
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null
      setUserId(uid)
      if (uid) {
        getMesFormations(uid)
          .then((rows) => setProgress(Object.fromEntries(rows.map((r) => [r.cours_id, r.statut]))))
          .catch(() => {})
      }
    })
  }, [])

  function handleCta(coursId: string | undefined) {
    if (!coursId) return
    if (!userId) {
      Alert.alert('Connexion requise', 'Connecte-toi pour suivre ta progression sur ce parcours.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se connecter', onPress: () => navigation.navigate('Profil') },
      ])
      return
    }
    const statut = progress[coursId]
    if (!statut) {
      setProgress((p) => ({ ...p, [coursId]: 'en_cours' }))
      demarrerFormation(userId, coursId).catch(() => setProgress((p) => ({ ...p, [coursId]: undefined as any })))
    } else if (statut === 'en_cours') {
      setProgress((p) => ({ ...p, [coursId]: 'termine' }))
      terminerFormation(userId, coursId).catch(() => setProgress((p) => ({ ...p, [coursId]: 'en_cours' })))
    }
  }

  const visible = filter === 'tous' ? cours : cours.filter((c) => c.niveau === filter)

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.title}>Formations & Parcours</Text>
            <Text style={styles.mutedSm}>Grandir dans la foi à chaque étape de la vie</Text>
          </View>
          <View style={styles.iconTile}><Icon name="graduation-cap" size={20} color={colors.primary} /></View>
        </View>
        <Pressable onPress={() => navigation.navigate('Accueil', { screen: 'Jeunesse' })} style={styles.jeunesseLink}>
          <Icon name="users-three" size={14} color={colors.accent} />
          <Text style={styles.jeunesseLinkText}>Découvrir l'Espace Jeunesse</Text>
          <Icon name="caret-right" size={13} color={colors.accent} />
        </Pressable>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 6, paddingVertical: 14, alignItems: 'flex-start' }}>
        {FILTERS.map((f) => {
          const active = filter === f.niveau
          return (
            <Pressable key={f.label} onPress={() => setFilter(f.niveau)} style={[styles.tag, active && styles.tagActive]}>
              <Text style={[styles.tagText, active && styles.tagTextActive]}>{f.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <SkeletonList count={3} />
        ) : visible.length === 0 ? (
          <Text style={[styles.mutedSm, { textAlign: 'center', paddingVertical: 30 }]}>Les parcours seront disponibles prochainement.</Text>
        ) : (
          visible.map((p) => {
            const statut = p.id ? progress[p.id] : undefined
            const ctaLabel = statut === 'termine' ? 'Terminé' : statut === 'en_cours' ? 'Marquer terminé' : 'Commencer'
            return (
              <Pressable key={p.id} style={styles.card} onPress={() => handleCta(p.id)} disabled={statut === 'termine'}>
                <View style={styles.rowBetween}>
                  <View style={[styles.badge, { backgroundColor: `${p.couleur}22` }]}>
                    <Text style={[styles.badgeText, { color: p.couleur }]}>{p.tranche}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    {statut === 'termine' ? (
                      <>
                        <Icon name="check-circle" size={13} color={colors.chart3} />
                        <Text style={[styles.mutedSm, { color: colors.chart3 }]}>Terminé</Text>
                      </>
                    ) : statut === 'en_cours' ? (
                      <>
                        <Icon name="clock" size={13} color={colors.accent} />
                        <Text style={[styles.mutedSm, { color: colors.accent }]}>En cours</Text>
                      </>
                    ) : (
                      <>
                        <Icon name="clock" size={13} color={colors.mutedForeground} />
                        <Text style={styles.mutedSm}>{p.totalModules} modules</Text>
                      </>
                    )}
                  </View>
                </View>
                <Text style={styles.cardTitre}>{p.emoji} {p.titre}</Text>
                <Text style={[styles.mutedSm, { lineHeight: 17 }]}>{p.description}</Text>
                <View style={styles.divider} />
                <View style={styles.rowBetween}>
                  <Text style={styles.freeText}>Accès libre</Text>
                  {statut !== 'termine' && (
                    <View style={[styles.ctaBtn, { backgroundColor: p.couleur }]}>
                      <Text style={[styles.ctaText, { color: '#fff' }]}>{ctaLabel}</Text>
                      <Icon name="arrow-right" size={12} color="#fff" />
                    </View>
                  )}
                </View>
              </Pressable>
            )
          })
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  jeunesseLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, alignSelf: 'flex-start' },
  jeunesseLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.accent },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontFamily: fonts.heading, fontSize: 21, color: colors.primary },
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  iconTile: { width: 40, height: 40, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tagActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tagText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.mutedForeground },
  tagTextActive: { color: colors.primaryForeground, fontFamily: fonts.sansSemiBold },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18, gap: 6 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 10, textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardTitre: { fontFamily: fonts.heading, fontSize: 16, color: colors.foreground, marginTop: 4 },
  divider: { height: 1, backgroundColor: 'rgba(217,224,229,0.5)', marginVertical: 4 },
  freeText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.chart3 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
})
