import { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Linking, Share, Alert, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Notifications from 'expo-notifications'
import { DesignIcon } from '../../components/DesignIcon'
import { d, r, f, ombre, plein } from '../../theme/design'
import { getDirectsAVenir, getVideos, getPlaylists, compterVue, type Direct, type Video, type Playlist } from '../../services/mediation'

const IMG_MESSE = require('../../../assets/archidiocese/messe.jpeg')
const IMG_PARCOURS = require('../../../assets/archidiocese/parcours.jpeg')
const IMG_TEMOIGNAGE = require('../../../assets/archidiocese/temoignage.jpeg')
const IMG_HERO = require('../../../assets/archidiocese/hero.jpeg')
const IMAGES = [IMG_PARCOURS, IMG_TEMOIGNAGE, IMG_HERO]

/** Filtres de la maquette ; une vidéo correspond si son thème, son public ou son titre contient un de ces mots. */
const FILTRES: { label: string; mots: RegExp | null }[] = [
  { label: 'Tous', mots: null },
  { label: 'Messes & Liturgie', mots: /messe|liturg|eucharist|célébration|celebration/i },
  { label: 'Enseignements', mots: /enseign|catéch|catech|formation|conférence/i },
  { label: 'Témoignages', mots: /témoign|temoign|conversion/i },
  { label: 'Jeunesse', mots: /jeun/i },
  { label: 'Chapelet', mots: /chapelet|rosaire/i },
]

function correspond(v: Video, mots: RegExp | null) {
  return !mots || mots.test(`${v.theme ?? ''} ${v.publicCible ?? ''} ${v.titre}`)
}

function heure(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h')
}

export function TvArchidioceseScreen() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [directs, setDirects] = useState<Direct[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [filtre, setFiltre] = useState(0)

  useEffect(() => {
    getDirectsAVenir().then(setDirects).catch(() => {})
    getVideos().then(setVideos).catch(() => {})
    getPlaylists().then(setPlaylists).catch(() => {})
  }, [])

  const enCours = directs.find(x => x.statut === 'en_direct') ?? null
  const prochain = directs.find(x => x.statut === 'programme') ?? null
  const mots = FILTRES[filtre].mots
  const parId = useMemo(() => new Map(videos.map(v => [v.id, v])), [videos])
  const liste = (cible: Playlist['publicCible']) => playlists
    .filter(p => p.publicCible === cible)
    .flatMap(p => p.evenementIds.map(id => parId.get(id)).filter((v): v is Video => !!v))
    .filter(v => correspond(v, mots))
  const decouvrir = liste('decouvre')
  const conversion = liste('conversion')
  const replays = videos.filter(v => correspond(v, mots))

  // Bandeau : le direct en cours, sinon la dernière vidéo publiée.
  const aLaUne = enCours
    ? { titre: enCours.titre, sous: enCours.description || enCours.intervenant || '', categorie: 'Célébration eucharistique', url: enCours.url, image: null as string | null, id: null as string | null }
    : videos[0] ? { titre: videos[0].titre, sous: videos[0].intervenant || '', categorie: videos[0].theme || 'Replay', url: videos[0].url, image: videos[0].thumbnail, id: videos[0].id } : null

  function regarder(url: string, id?: string | null) {
    if (id) compterVue(id)
    Linking.openURL(url)
  }

  async function partager() {
    if (!aLaUne) return
    await Share.share({ message: `${aLaUne.titre} — ${aLaUne.url}` }).catch(() => {})
  }

  async function rappel(dct: Direct) {
    if (Platform.OS === 'web') { Alert.alert('Rappel', 'Les rappels sont disponibles dans l’application mobile.'); return }
    const moment = new Date(new Date(dct.debut).getTime() - 10 * 60 * 1000)
    if (moment.getTime() <= Date.now()) { Alert.alert('Rappel', 'Ce direct commence bientôt !'); return }
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') { Alert.alert('Notifications désactivées', 'Autorisez les notifications pour recevoir le rappel.'); return }
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Direct dans 10 minutes', body: dct.titre, data: { url: dct.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: moment },
    })
    Alert.alert('Rappel programmé', `Vous serez prévenu 10 minutes avant : ${dct.titre}`)
  }

  return (
    <View style={s.page}>
      {/* ── En-tête ── */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={[s.row, { gap: 10 }]}>
          <View style={s.logo}><DesignIcon name="solar:play-bold" size={16} color={d.white} /></View>
          <View>
            <Text style={s.titreHeader}>Archidiocèse TV</Text>
            <Text style={s.sousHeader}>La chaîne catholique diocésaine</Text>
          </View>
        </View>
        <View style={[s.row, { gap: 8 }]}>
          <Pressable style={s.rond} accessibilityLabel="Rechercher" onPress={() => navigation.navigate('Plus', { screen: 'Recherche' })}>
            <DesignIcon name="solar:magnifer-linear" size={16} color={d.white} />
          </Pressable>
          <Pressable style={s.rond} accessibilityLabel="Diffuser sur la TV" onPress={() => aLaUne && regarder(aLaUne.url, aLaUne.id)}>
            <DesignIcon name="solar:screencast-2-linear" size={16} color={d.accent} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* ── Direct / à la une ── */}
        {aLaUne ? (
          <View style={s.hero}>
            <Image source={aLaUne.image ? { uri: aLaUne.image } : IMG_MESSE} style={s.image} />
            <LinearGradient colors={[d.ink, 'transparent', 'rgba(0,0,0,0.6)']} locations={[0, 0.5, 1]} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={[plein, s.heroVoile]}>
              <View style={[s.row, { justifyContent: 'space-between' }]}>
                <View style={[s.badgeDirect, !enCours && { backgroundColor: d.accent }]}>
                  <View style={s.point} />
                  <Text style={[s.badgeDirectTexte, !enCours && { color: d.ink }]}>{enCours ? 'DIRECT EN COURS' : 'À LA UNE'}</Text>
                </View>
              </View>
              <View>
                <Text style={s.categorie}>{aLaUne.categorie.toUpperCase()}</Text>
                <Text style={s.heroTitre} numberOfLines={2}>{aLaUne.titre}</Text>
                {!!aLaUne.sous && <Text style={s.heroSous} numberOfLines={1}>{aLaUne.sous}</Text>}
                <View style={[s.row, { gap: 12, marginTop: 12 }]}>
                  <Pressable onPress={() => regarder(aLaUne.url, aLaUne.id)} style={[s.boutonOr, ombre.sm]}>
                    <DesignIcon name="solar:play-bold" size={16} color={d.primary} />
                    <Text style={s.boutonOrTexte}>{enCours ? 'Regarder le direct' : 'Regarder'}</Text>
                  </Pressable>
                  <Pressable onPress={partager} style={s.boutonVerre}>
                    <DesignIcon name="solar:share-linear" size={16} color={d.white} />
                    <Text style={s.boutonVerreTexte}>Partager</Text>
                  </Pressable>
                  <Pressable onPress={() => regarder(aLaUne.url, aLaUne.id)} style={[s.carreVerre, { marginLeft: 'auto' }]} accessibilityLabel="Plein écran">
                    <DesignIcon name="solar:maximize-square-3-linear" size={16} color={d.white} />
                  </Pressable>
                </View>
              </View>
            </LinearGradient>
          </View>
        ) : (
          <View style={[s.hero, { alignItems: 'center', justifyContent: 'center' }]}>
            <Image source={IMG_MESSE} style={[s.image, { opacity: 0.35 }]} />
            <Text style={s.heroSous}>La chaîne sera bientôt en ligne.</Text>
          </View>
        )}

        {/* ── Filtres ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.bandeFiltres} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
          {FILTRES.map((fl, i) => (
            <Pressable key={fl.label} onPress={() => setFiltre(i)} style={[s.puce, i === filtre && { backgroundColor: d.accent }]}>
              <Text style={[s.puceTexte, i === filtre && { color: d.ink, fontFamily: f.bold }]}>{fl.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Prochain direct ── */}
        {prochain && (
          <View style={{ padding: 16 }}>
            <View style={s.prochain}>
              <View style={[s.row, { gap: 12, flex: 1 }]}>
                <View style={s.prochainIcone}><DesignIcon name="solar:calendar-date-bold" size={22} color={d.accent} /></View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.prochainSur}>PROCHAIN DIRECT · {heure(prochain.debut)}</Text>
                  <Text style={s.prochainTitre} numberOfLines={2}>{prochain.titre}</Text>
                </View>
              </View>
              <Pressable onPress={() => rappel(prochain)} style={s.rappel}>
                <DesignIcon name="solar:bell-linear" size={14} color={d.white} />
                <Text style={s.rappelTexte}>Rappel</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Parcours vidéo : Découvrir la foi ── */}
        {decouvrir.length > 0 && (
          <View style={{ paddingVertical: 8 }}>
            <View style={s.entete}>
              <Text style={s.titreSection}>Parcours vidéo : Découvrir la foi</Text>
              <Pressable onPress={() => navigation.navigate('Parcours', { screen: 'ParcoursArchidiocese', params: { type: 'decouvrir' } })}><Text style={s.voirTout}>Voir tout</Text></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 8 }}>
              {decouvrir.map((v, i) => (
                <Pressable key={v.id} onPress={() => regarder(v.url, v.id)} style={s.episode}>
                  <View style={s.episodeImage}><Image source={v.thumbnail ? { uri: v.thumbnail } : IMAGES[i % 3]} style={s.image} /></View>
                  <View style={{ padding: 8 }}>
                    <Text style={s.episodeNum}>ÉPISODE {i + 1}</Text>
                    <Text style={s.episodeTitre} numberOfLines={2}>{v.titre}</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Témoignages de conversion ── */}
        {conversion.length > 0 && (
          <View style={{ paddingVertical: 8 }}>
            <View style={s.entete}>
              <Text style={s.titreSection}>Témoignages de conversion</Text>
              <Pressable onPress={() => navigation.navigate('Plus', { screen: 'Temoignages' })}><Text style={s.voirTout}>Voir tout</Text></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 8 }}>
              {conversion.map((v, i) => (
                <Pressable key={v.id} onPress={() => regarder(v.url, v.id)} style={s.temoignage}>
                  <Image source={v.thumbnail ? { uri: v.thumbnail } : IMAGES[(i + 1) % 3]} style={s.temoignageImage} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.temoignageTitre} numberOfLines={2}>{v.titre}</Text>
                    {!!v.intervenant && <Text style={s.temoignageMeta}>{v.intervenant}</Text>}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Replays (selon le filtre) ── */}
        <View style={{ paddingVertical: 8 }}>
          <View style={s.entete}><Text style={s.titreSection}>{filtre === 0 ? 'Tous les replays' : FILTRES[filtre].label}</Text></View>
          {replays.length === 0 ? (
            <Text style={[s.temoignageMeta, { paddingHorizontal: 16 }]}>Aucune vidéo pour le moment.</Text>
          ) : (
            <View style={{ paddingHorizontal: 16, gap: 10 }}>
              {replays.slice(0, 20).map((v, i) => (
                <Pressable key={v.id} onPress={() => regarder(v.url, v.id)} style={s.temoignage}>
                  <Image source={v.thumbnail ? { uri: v.thumbnail } : IMAGES[i % 3]} style={s.temoignageImage} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    {!!v.theme && <Text style={s.episodeNum}>{v.theme.toUpperCase()}</Text>}
                    <Text style={s.temoignageTitre} numberOfLines={2}>{v.titre}</Text>
                    <Text style={s.temoignageMeta}>{[v.intervenant, new Date(v.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })].filter(Boolean).join(' · ')}</Text>
                  </View>
                  <DesignIcon name="solar:play-circle-bold" size={22} color={d.accent} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: d.ink },
  row: { flexDirection: 'row', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: d.alpha(d.ink, 0.95), borderBottomWidth: 1, borderBottomColor: d.alpha(d.white, 0.1),
    paddingHorizontal: 16, paddingBottom: 12,
  },
  logo: { width: 32, height: 32, borderRadius: r.lg, backgroundColor: d.destructive, alignItems: 'center', justifyContent: 'center' },
  titreHeader: { fontFamily: f.bold, fontSize: 14, color: d.white },
  sousHeader: { fontFamily: f.regular, fontSize: 10, color: d.alpha(d.white, 0.6) },
  rond: { width: 32, height: 32, borderRadius: r.full, backgroundColor: d.alpha(d.white, 0.1), alignItems: 'center', justifyContent: 'center' },

  hero: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', overflow: 'hidden' },
  image: { ...plein, width: '100%', height: '100%' },
  heroVoile: { padding: 16, justifyContent: 'space-between' },
  badgeDirect: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: d.destructive, paddingHorizontal: 10, paddingVertical: 4, borderRadius: r.full },
  point: { width: 6, height: 6, borderRadius: 3, backgroundColor: d.white },
  badgeDirectTexte: { fontFamily: f.extrabold, fontSize: 10, color: d.white },
  categorie: { fontFamily: f.semibold, fontSize: 11, letterSpacing: 0.6, color: d.accent },
  heroTitre: { fontFamily: f.bold, fontSize: 16, color: d.white, marginTop: 2 },
  heroSous: { fontFamily: f.regular, fontSize: 12, color: d.alpha(d.white, 0.75), marginTop: 2 },
  boutonOr: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: d.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: r.xl },
  boutonOrTexte: { fontFamily: f.bold, fontSize: 12, color: d.primary },
  boutonVerre: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: d.alpha(d.white, 0.15), paddingHorizontal: 12, paddingVertical: 8, borderRadius: r.xl },
  boutonVerreTexte: { fontFamily: f.semibold, fontSize: 12, color: d.white },
  carreVerre: { width: 32, height: 32, borderRadius: r.xl, backgroundColor: d.alpha(d.white, 0.15), alignItems: 'center', justifyContent: 'center' },

  bandeFiltres: { borderBottomWidth: 1, borderBottomColor: d.alpha(d.white, 0.1), flexGrow: 0 },
  puce: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: r.full, backgroundColor: d.alpha(d.white, 0.1) },
  puceTexte: { fontFamily: f.medium, fontSize: 12, color: d.alpha(d.white, 0.85) },

  prochain: { backgroundColor: d.alpha(d.white, 0.05), borderWidth: 1, borderColor: d.alpha(d.white, 0.1), borderRadius: r['2xl'], padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  prochainIcone: { width: 40, height: 40, borderRadius: r.xl, backgroundColor: d.alpha(d.accent, 0.2), alignItems: 'center', justifyContent: 'center' },
  prochainSur: { fontFamily: f.bold, fontSize: 10, color: d.accent },
  prochainTitre: { fontFamily: f.bold, fontSize: 12, lineHeight: 15, color: d.white },
  rappel: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: d.alpha(d.white, 0.1), paddingHorizontal: 12, paddingVertical: 6, borderRadius: r.lg },
  rappelTexte: { fontFamily: f.semibold, fontSize: 12, color: d.white },

  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 10 },
  titreSection: { fontFamily: f.bold, fontSize: 14, color: d.white },
  voirTout: { fontFamily: f.medium, fontSize: 12, color: d.accent },
  episode: { width: 170, backgroundColor: d.alpha(d.white, 0.05), borderWidth: 1, borderColor: d.alpha(d.white, 0.1), borderRadius: r.xl, overflow: 'hidden' },
  episodeImage: { height: 96, backgroundColor: 'rgba(0,0,0,0.4)', overflow: 'hidden' },
  episodeNum: { fontFamily: f.bold, fontSize: 9, color: d.accent },
  episodeTitre: { fontFamily: f.semibold, fontSize: 12, color: d.white, marginTop: 2 },
  temoignage: { minWidth: 220, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, backgroundColor: d.alpha(d.white, 0.05), borderWidth: 1, borderColor: d.alpha(d.white, 0.1), borderRadius: r.xl },
  temoignageImage: { width: 64, height: 64, borderRadius: r.lg },
  temoignageTitre: { fontFamily: f.bold, fontSize: 12, color: d.white },
  temoignageMeta: { fontFamily: f.regular, fontSize: 10, color: d.alpha(d.white, 0.6), marginTop: 4 },
})
