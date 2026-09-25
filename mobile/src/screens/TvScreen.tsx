import { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Linking, Image, ScrollView } from 'react-native'
import { Screen } from '../components/Screen'
import { BackHeader, Chip } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import {
  getDirectsAVenir, getVideos, getPlaylists, compterVue, PUBLIC_CIBLE_LABELS,
  type Direct, type Video, type Playlist, type PublicCible,
} from '../services/mediation'

function fmtDebut(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function ouvrir(v: Video) {
  compterVue(v.id)
  Linking.openURL(v.url)
}

function CarteVideo({ v }: { v: Video }) {
  return (
    <Pressable onPress={() => ouvrir(v)} style={({ pressed }) => [styles.video, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={styles.thumb}>
        {v.thumbnail ? <Image source={{ uri: v.thumbnail }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
        <View style={styles.play}><Icon name="play-fill" size={16} color={colors.primaryForeground} /></View>
      </View>
      <Text style={styles.videoTitre} numberOfLines={2}>{v.titre}</Text>
      {(v.intervenant || v.theme) && <Text style={styles.mutedXs} numberOfLines={1}>{[v.intervenant, v.theme].filter(Boolean).join(' · ')}</Text>}
    </Pressable>
  )
}

export function TvScreen() {
  const [directs, setDirects] = useState<Direct[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState<PublicCible | 'tous'>('tous')

  useEffect(() => {
    Promise.all([getDirectsAVenir().catch(() => []), getVideos().catch(() => []), getPlaylists().catch(() => [])])
      .then(([d, v, p]) => { setDirects(d); setVideos(v); setPlaylists(p) })
      .finally(() => setLoading(false))
  }, [])

  const parId = useMemo(() => new Map(videos.map(v => [v.id, v])), [videos])
  const sections = playlists
    .filter(p => filtre === 'tous' || p.publicCible === filtre)
    .map(p => ({ ...p, videos: p.evenementIds.map(id => parId.get(id)).filter((v): v is Video => !!v) }))
    .filter(p => p.videos.length > 0)
  const recentes = videos.filter(v => filtre === 'tous' || v.publicCible === filtre).slice(0, 10)

  return (
    <Screen>
      <BackHeader title="Médiation / TV" subtitle="La chaîne de l'archidiocèse" />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 16 }}>
        <Chip label="Tout" active={filtre === 'tous'} onPress={() => setFiltre('tous')} />
        {(Object.keys(PUBLIC_CIBLE_LABELS) as PublicCible[]).map(p => (
          <Chip key={p} label={PUBLIC_CIBLE_LABELS[p]} active={filtre === p} onPress={() => setFiltre(p)} />
        ))}
      </ScrollView>

      <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 12 }}>
        {loading ? <SkeletonList count={3} /> : (
          <>
            {directs.map(d => (
              <Pressable key={d.id} onPress={() => Linking.openURL(d.url)} style={[styles.direct, d.statut === 'en_direct' && styles.directLive]}>
                <Icon name={d.statut === 'en_direct' ? 'video-camera' : 'calendar-blank'} size={18} color={d.statut === 'en_direct' ? colors.destructive : colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eyebrow, d.statut === 'en_direct' && { color: colors.destructive }]}>
                    {d.statut === 'en_direct' ? 'EN DIRECT' : fmtDebut(d.debut)}
                  </Text>
                  <Text style={styles.titre}>{d.titre}</Text>
                  {d.intervenant && <Text style={styles.mutedXs}>{d.intervenant}</Text>}
                </View>
                <Icon name="arrow-up-right" size={16} color={colors.primary} />
              </Pressable>
            ))}

            {sections.map(s => (
              <View key={s.id} style={{ marginTop: 8 }}>
                <Text style={styles.h3}>{s.titre}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 10 }}>
                  {s.videos.map(v => <CarteVideo key={v.id} v={v} />)}
                </ScrollView>
              </View>
            ))}

            <Text style={[styles.h3, { marginTop: 8 }]}>Dernières vidéos</Text>
            {recentes.length === 0 ? (
              <Text style={[styles.mutedXs, { textAlign: 'center', paddingVertical: 20 }]}>Aucune vidéo pour le moment.</Text>
            ) : (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {recentes.map(v => <CarteVideo key={v.id} v={v} />)}
              </View>
            )}
          </>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 1, color: colors.accent },
  titre: { fontFamily: fonts.heading, fontSize: 15, color: colors.foreground, marginTop: 2 },
  h3: { fontFamily: fonts.heading, fontSize: 17, color: colors.primary },
  mutedXs: { fontFamily: fonts.sans, fontSize: 11, color: colors.mutedForeground, marginTop: 3 },
  direct: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
  directLive: { borderColor: colors.destructive, backgroundColor: 'rgba(181,71,71,0.06)' },
  video: { width: 200 },
  thumb: { width: 200, height: 112, borderRadius: radius.md, backgroundColor: colors.secondary, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  play: { width: 38, height: 38, borderRadius: radius.full, backgroundColor: 'rgba(18,59,93,0.85)', alignItems: 'center', justifyContent: 'center' },
  videoTitre: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.foreground, marginTop: 8 },
})
