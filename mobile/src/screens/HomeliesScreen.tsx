import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonBlock, SkeletonRowList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getHomelies, type Homelie } from '../services/homelies'

function SkeletonFeatured() {
  return (
    <View style={[styles.playerCard, { gap: 10 }]}>
      <SkeletonBlock style={{ width: 110, height: 20, borderRadius: radius.full, backgroundColor: 'rgba(255,255,255,0.25)' }} />
      <SkeletonBlock style={{ width: '75%', height: 18, backgroundColor: 'rgba(255,255,255,0.25)' }} />
      <SkeletonBlock style={{ width: '50%', height: 12, backgroundColor: 'rgba(255,255,255,0.25)' }} />
    </View>
  )
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function FeaturedPlayer({ homelie }: { homelie: Homelie }) {
  const player = useAudioPlayer(homelie.audioUrl ?? null)
  const status = useAudioPlayerStatus(player)

  return (
    <View style={styles.playerCard}>
      <View style={styles.rowBetween}>
        <View style={styles.badgeAccent}><Text style={styles.badgeAccentText}>Dernière homélie</Text></View>
        {homelie.liturgieRef && <Text style={styles.playerMeta}>{homelie.liturgieRef}</Text>}
      </View>
      <Text style={styles.playerTitle}>{homelie.titre}</Text>
      <Text style={styles.playerMeta}>{homelie.pretre} · {formatDate(homelie.date)}</Text>

      {homelie.audioUrl ? (
        <>
          <View style={styles.playerDivider} />
          <View style={styles.rowBetween}>
            <Text style={styles.playerMeta}>{formatTime(status.currentTime)}</Text>
            <Text style={styles.playerMeta}>{formatTime(status.duration)}</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${status.duration ? (status.currentTime / status.duration) * 100 : 0}%` }]} />
          </View>
          <Pressable onPress={() => (status.playing ? player.pause() : player.play())} style={styles.playBtn}>
            <Icon name={status.playing ? 'pause-fill' : 'play-fill'} size={22} color={colors.accentForeground} />
          </Pressable>
        </>
      ) : (
        <Text style={[styles.mutedSm, { marginTop: 12, color: 'rgba(255,255,255,0.75)' }]} numberOfLines={4}>{homelie.texte}</Text>
      )}
    </View>
  )
}

function HomelieRow({ homelie, onPress }: { homelie: Homelie; onPress: () => void }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={styles.rowIcon}><Icon name={homelie.audioUrl ? 'headphones' : 'file-text'} size={22} color={colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.mutedSm}>{formatDate(homelie.date)}</Text>
        <Text style={styles.rowTitre} numberOfLines={1}>{homelie.titre}</Text>
        <Text style={styles.mutedSm} numberOfLines={1}>{homelie.pretre}</Text>
      </View>
      <Icon name="caret-right" size={16} color={colors.mutedForeground} />
    </Pressable>
  )
}

export function HomeliesScreen() {
  const [search, setSearch] = useState('')
  const [homelies, setHomelies] = useState<Homelie[]>([])
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    getHomelies().then(setHomelies).catch(() => setHomelies([])).finally(() => setLoading(false))
  }, [])

  const filtered = homelies.filter((h) => h.titre.toLowerCase().includes(search.toLowerCase()) || h.pretre.toLowerCase().includes(search.toLowerCase()))
  const [featured, ...rest] = filtered
  const openHomelie = openIndex !== null ? rest[openIndex] : null

  return (
    <Screen>
      <BackHeader title="Médiathèque & Homélies" subtitle="Écoutez ou lisez la Parole expliquée" />

      <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 12 }}>
        <View style={styles.searchBox}>
          <Icon name="magnifying-glass" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher par prédicateur ou thème..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
        </View>

        {loading ? (
          <>
            <SkeletonFeatured />
            <SkeletonRowList count={3} />
          </>
        ) : !featured ? (
          <Text style={[styles.mutedSm, { textAlign: 'center', paddingVertical: 30 }]}>Aucune homélie disponible pour le moment.</Text>
        ) : (
          <>
            <FeaturedPlayer homelie={featured} />

            {rest.length > 0 && <Text style={styles.h3}>Homélies précédentes</Text>}
            {rest.map((h, i) => (
              <HomelieRow key={h.id ?? i} homelie={h} onPress={() => setOpenIndex(openIndex === i ? null : i)} />
            ))}
            {openHomelie && (
              <View style={styles.expanded}>
                <Text style={styles.expandedText}>{openHomelie.texte}</Text>
              </View>
            )}
          </>
        )}
        {!loading && featured && filtered.length === 0 && (
          <Text style={[styles.mutedSm, { textAlign: 'center', paddingVertical: 20 }]}>Aucune homélie ne correspond à cette recherche.</Text>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 42 },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.foreground },
  playerCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badgeAccent: { backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeAccentText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.accentForeground },
  playerMeta: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  playerTitle: { fontFamily: fonts.heading, fontSize: 16, color: colors.primaryForeground, marginTop: 8 },
  playerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 14 },
  progressTrack: { height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: radius.full, marginTop: 8, marginBottom: 14 },
  progressFill: { height: 5, backgroundColor: colors.accent, borderRadius: radius.full },
  playBtn: { alignSelf: 'center', width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  h3: { fontFamily: fonts.heading, fontSize: 16, color: colors.foreground, marginTop: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
  rowIcon: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  rowTitre: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.foreground, marginTop: 2 },
  mutedSm: { fontFamily: fonts.sans, fontSize: 11, color: colors.mutedForeground },
  expanded: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  expandedText: { fontFamily: fonts.sans, fontSize: 13, color: colors.foreground, lineHeight: 20 },
})
