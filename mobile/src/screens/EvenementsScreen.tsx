import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Screen } from '../components/Screen'
import { Chip } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonBlock } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getEvenements, type Evenement, type EvenementType } from '../services/evenements'

function SkeletonEventCard() {
  return (
    <View style={styles.card}>
      <SkeletonBlock style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 0 }} />
      <View style={{ padding: 16, gap: 8 }}>
        <SkeletonBlock style={{ width: 70, height: 10 }} />
        <SkeletonBlock style={{ width: '80%', height: 16 }} />
        <SkeletonBlock style={{ width: '45%', height: 11 }} />
      </View>
    </View>
  )
}

const FILTERS: { label: string; type: EvenementType | 'tous' }[] = [
  { label: 'Tous', type: 'tous' },
  { label: 'En direct', type: 'live' },
  { label: 'Replays', type: 'replay' },
  { label: 'Événements', type: 'evenement' },
]

const PLATFORM_COLOR = { youtube: '#FF0000', facebook: '#1877F2' } as const

function fmtDate(iso: string, heure?: string) {
  try {
    const d = new Date(iso + 'T12:00:00')
    const date = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    return heure ? `${date} · ${heure}` : date
  } catch {
    return iso
  }
}

function EvenementCard({ ev }: { ev: Evenement }) {
  return (
    <View style={styles.card}>
      {ev.estEnLive && (
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>EN DIRECT</Text>
        </View>
      )}
      <Pressable onPress={() => Linking.openURL(ev.url)} style={styles.thumbWrap}>
        {ev.thumbnail ? (
          <Image source={{ uri: ev.thumbnail }} style={styles.thumb} />
        ) : (
          <View style={[styles.thumb, { backgroundColor: colors.secondary }]} />
        )}
        <View style={styles.playOverlay}>
          <View style={[styles.playCircle, { backgroundColor: PLATFORM_COLOR[ev.platform] }]}>
            <Icon name="play-fill" size={22} color="#fff" />
          </View>
        </View>
        <View style={[styles.platformBadge, { backgroundColor: PLATFORM_COLOR[ev.platform] }]}>
          <Text style={styles.platformBadgeText}>{ev.platform === 'youtube' ? 'YouTube' : 'Facebook'}</Text>
        </View>
      </Pressable>

      <View style={{ padding: 16 }}>
        <Text style={styles.kicker}>{ev.type === 'live' ? 'En direct' : ev.type === 'replay' ? 'Replay' : 'Événement'}</Text>
        <Text style={styles.cardTitre}>{ev.titre}</Text>
        <Text style={styles.mutedSm}>{fmtDate(ev.date, ev.heure)}</Text>
        {ev.description && <Text style={[styles.mutedSm, { marginTop: 6, lineHeight: 17 }]}>{ev.description}</Text>}
        <Pressable onPress={() => Linking.openURL(ev.url)} style={styles.linkRow}>
          <Text style={[styles.linkText, { color: PLATFORM_COLOR[ev.platform] }]}>
            Ouvrir dans {ev.platform === 'youtube' ? 'YouTube' : 'Facebook'}
          </Text>
          <Icon name="arrow-up-right" size={13} color={PLATFORM_COLOR[ev.platform]} />
        </Pressable>
      </View>
    </View>
  )
}

export function EvenementsScreen() {
  const navigation = useNavigation<any>()
  const [filter, setFilter] = useState<EvenementType | 'tous'>('tous')
  const [events, setEvents] = useState<Evenement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getEvenements(filter === 'tous' ? undefined : filter)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [filter])

  const liveCount = events.filter((e) => e.estEnLive).length

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <Text style={styles.title}>Médias & Événements</Text>
        <Text style={styles.mutedSm}>Lives, replays et grands événements de la paroisse</Text>
        {liveCount > 0 && (
          <View style={styles.liveBanner}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBannerText}>
              {liveCount === 1 ? '1 événement en direct maintenant !' : `${liveCount} événements en direct !`}
            </Text>
          </View>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 14, alignItems: 'flex-start' }}>
        {FILTERS.map((f) => (
          <Chip key={f.label} label={f.label} active={filter === f.type} onPress={() => setFilter(f.type)} />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, marginBottom: 4, gap: 10 }}>
        <Pressable onPress={() => navigation.navigate('Groupes')} style={styles.groupesTeaser}>
          <Text style={{ fontSize: 22 }}>🤝</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitre}>Groupes & mouvements</Text>
            <Text style={styles.mutedSm}>Rejoindre un groupe de prière ou un mouvement paroissial</Text>
          </View>
          <Icon name="caret-right" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Temoignages')} style={styles.groupesTeaser}>
          <Text style={{ fontSize: 22 }}>🙏</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitre}>Témoignages de foi</Text>
            <Text style={styles.mutedSm}>Partager ou lire les témoignages de la communauté</Text>
          </View>
          <Icon name="caret-right" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 14, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <>
            <SkeletonEventCard />
            <SkeletonEventCard />
          </>
        ) : events.length === 0 ? (
          <Text style={[styles.mutedSm, { textAlign: 'center', paddingVertical: 30 }]}>Aucun contenu disponible pour le moment.</Text>
        ) : (
          events.map((ev) => <EvenementCard key={ev.id} ev={ev} />)
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.primary },
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  liveBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(181,71,71,0.1)', borderWidth: 1, borderColor: colors.destructive, borderRadius: radius.md, padding: 10, marginTop: 12 },
  liveBannerText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.destructive },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' },
  thumbWrap: { position: 'relative', aspectRatio: 16 / 9 },
  thumb: { width: '100%', height: '100%' },
  playOverlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  playCircle: { width: 48, height: 48, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  platformBadge: { position: 'absolute', top: 10, right: 10, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  platformBadgeText: { fontFamily: fonts.sansBold, fontSize: 9, color: '#fff' },
  liveBadge: { position: 'absolute', top: 10, left: 10, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.destructive, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  liveBadgeText: { fontFamily: fonts.sansBold, fontSize: 9, color: '#fff' },
  kicker: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardTitre: { fontFamily: fonts.heading, fontSize: 15, color: colors.foreground, marginTop: 4 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  linkText: { fontFamily: fonts.sansBold, fontSize: 11 },
  groupesTeaser: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
})
