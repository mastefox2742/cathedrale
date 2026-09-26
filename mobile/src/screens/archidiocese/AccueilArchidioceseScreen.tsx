import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { DesignIcon } from '../../components/DesignIcon'
import { d, r, f, ombre, plein } from '../../theme/design'
import { getDirectsAVenir, getVideos, compterVue, PUBLIC_CIBLE_LABELS, type Direct, type Video } from '../../services/mediation'
import { getEvangileDuJour, type EvangileDuJour } from '../../services/evangile'
import { getParoisses, setParoisseCourante, laPlusProche, type Paroisse } from '../../services/paroisses'
import type { DesignIconName } from '../../theme/design-icons'
import { getAnnonces } from '../../services/annonces'

const IMG_HERO = require('../../../assets/archidiocese/hero.jpeg')
const IMG_MESSE = require('../../../assets/archidiocese/messe.jpeg')
const IMG_PARCOURS = require('../../../assets/archidiocese/parcours.jpeg')

/** Les quatre portes d'entrée, telles que dans la maquette. */
const PORTES: { titre: string; sous: string; icone: DesignIconName; fond: string; teinte: string; action: 'decouvrir' | 'conversion' | 'approfondir' | 'prier' }[] = [
  { titre: 'Je découvre la foi', sous: 'Non-croyants & curieux', icone: 'solar:compass-bold', fond: d.alpha(d.accent, 0.15), teinte: d.accent, action: 'decouvrir' },
  { titre: 'Je veux me convertir', sous: 'Catéchuménat & baptême', icone: 'solar:waterdrops-bold', fond: d.alpha(d.primary, 0.1), teinte: d.primary, action: 'conversion' },
  { titre: "J'approfondis ma foi", sous: 'Pour baptisés & adultes', icone: 'solar:book-bookmark-bold', fond: d.alpha(d.chart3, 0.15), teinte: d.chart3, action: 'approfondir' },
  { titre: 'Je veux prier', sous: 'Liturgie, chapelet & paix', icone: 'solar:heart-bold', fond: d.alpha(d.chart4, 0.15), teinte: d.destructive, action: 'prier' },
]

function fmtDebut(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

export function AccueilArchidioceseScreen() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [direct, setDirect] = useState<Direct | null>(null)
  const [videos, setVideos] = useState<Video[]>([])
  const [evangile, setEvangile] = useState<EvangileDuJour | null>(null)
  const [paroisses, setParoisses] = useState<Paroisse[]>([])
  const [localisation, setLocalisation] = useState(false)
  const [nouveautes, setNouveautes] = useState(false)

  useEffect(() => {
    getDirectsAVenir().then(l => setDirect(l.find(x => x.statut === 'en_direct') ?? l[0] ?? null)).catch(() => {})
    getVideos().then(v => setVideos(v.slice(0, 6))).catch(() => {})
    getEvangileDuJour().then(setEvangile).catch(() => {})
    getParoisses().then(setParoisses).catch(() => {})
    // Pastille rouge seulement s'il y a une annonce de moins de 7 jours.
    getAnnonces().then(a => setNouveautes(a.some(x => Date.now() - new Date(x.date + 'T12:00:00').getTime() < 7 * 864e5))).catch(() => {})
  }, [])

  function ouvrirPorte(action: typeof PORTES[number]['action']) {
    if (action === 'prier') navigation.navigate('Prier')
    else navigation.navigate('Parcours', { screen: 'ParcoursArchidiocese', params: { type: action } })
  }

  async function autourDeMoi() {
    setLocalisation(true)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') { Alert.alert('Position non autorisée', "Vous pouvez choisir votre paroisse dans l'annuaire."); return }
      const pos = await Location.getCurrentPositionAsync({})
      const res = laPlusProche(paroisses, pos.coords.latitude, pos.coords.longitude)
      if (!res) { Alert.alert('Aucune paroisse localisée', "Les paroisses n'ont pas encore de position enregistrée."); return }
      await setParoisseCourante(res.paroisse.id)
      Alert.alert('Votre paroisse', `${res.paroisse.nom} — à environ ${res.km < 1 ? Math.round(res.km * 1000) + ' m' : res.km.toFixed(1) + ' km'}`)
      navigation.navigate('Plus', { screen: 'Paroisses' })
    } catch {
      Alert.alert('Position indisponible', "Vous pouvez choisir votre paroisse dans l'annuaire.")
    } finally {
      setLocalisation(false)
    }
  }

  const enDirect = direct?.statut === 'en_direct'

  return (
    <View style={s.page}>
      {/* ── En-tête ── */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={s.row}>
          <View style={s.logo}><DesignIcon name="mdi:cross" size={20} color={d.accent} /></View>
          <View>
            <Text style={s.surtitre}>ARCHIDIOCÈSE</Text>
            <Text style={s.titreHeader}>Médiation & Évangélisation</Text>
          </View>
        </View>
        <View style={[s.row, { gap: 6 }]}>
          <Pressable style={s.rond} accessibilityLabel="Recherche" onPress={() => navigation.navigate('Plus', { screen: 'Recherche' })}>
            <DesignIcon name="solar:magnifer-linear" size={18} color={d.primary} />
          </Pressable>
          <Pressable style={s.rond} accessibilityLabel="Notifications" onPress={() => navigation.navigate('Plus', { screen: 'Annonces' })}>
            <DesignIcon name="solar:bell-linear" size={18} color={d.primary} />
            {nouveautes && <View style={s.pastille} />}
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* ── Bandeau ── */}
        <View style={{ padding: 16 }}>
          <View style={[s.hero, ombre.sm]}>
            <Image source={IMG_HERO} style={s.heroImg} />
            <LinearGradient colors={[d.navy, d.alpha(d.primary, 0.8), 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={s.heroVoile}>
              <View style={s.badgeOr}>
                <DesignIcon name="ph:sparkle-fill" size={12} color={d.accent} />
                <Text style={s.badgeOrTexte}>Maison diocésaine de la foi</Text>
              </View>
              <Text style={s.heroTitre}>« Venez et vous verrez »</Text>
              <Text style={s.heroTexte} numberOfLines={2}>
                Informer, former, accompagner et rassembler toutes les paroisses et tous les chercheurs de Dieu.
              </Text>
            </LinearGradient>
          </View>

          {/* ── Portes d'entrée ── */}
          <View style={s.grille}>
            {PORTES.map(p => (
              <Pressable key={p.titre} onPress={() => ouvrirPorte(p.action)} style={({ pressed }) => [s.porte, ombre.xs, pressed && { transform: [{ scale: 0.98 }], borderColor: d.alpha(d.accent, 0.6) }]}>
                <View style={[s.porteIcone, { backgroundColor: p.fond }]}><DesignIcon name={p.icone} size={20} color={p.teinte} /></View>
                <View>
                  <Text style={s.porteTitre}>{p.titre}</Text>
                  <Text style={s.porteSous}>{p.sous}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Direct TV ── */}
        {direct && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <View style={[s.direct, ombre.sm]}>
              <View style={[s.row, { marginBottom: 10, gap: 8 }]}>
                <View style={[s.badgeDirect, !enDirect && { backgroundColor: d.alpha(d.white, 0.15) }]}>
                  <View style={s.point} />
                  <Text style={s.badgeDirectTexte}>{enDirect ? 'DIRECT TV' : 'PROCHAIN DIRECT'}</Text>
                </View>
                <Text style={s.directSource}>Archidiocèse Média</Text>
              </View>
              <View style={[s.row, { alignItems: 'flex-start', gap: 12 }]}>
                <View style={s.directVignette}>
                  <Image source={IMG_MESSE} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
                  <View style={s.voileNoir}><DesignIcon name="solar:play-bold" size={20} color={d.accent} /></View>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.directTitre} numberOfLines={1}>{direct.titre}</Text>
                  <Text style={s.directTexte} numberOfLines={1}>{enDirect ? (direct.description || direct.intervenant || 'En direct') : fmtDebut(direct.debut)}</Text>
                  <Pressable onPress={() => enDirect ? Linking.openURL(direct.url) : navigation.navigate('TV')} style={[s.row, { gap: 4, marginTop: 8 }]}>
                    <Text style={s.lienOr}>{enDirect ? 'Regarder le direct' : 'Voir le programme'}</Text>
                    <DesignIcon name="solar:arrow-right-linear" size={14} color={d.accent} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Évangile du jour ── */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Pressable onPress={() => navigation.navigate('Prier', { screen: 'Liturgie' })} style={[s.evangile, ombre.xs]}>
            <View style={[s.row, { gap: 12, flex: 1 }]}>
              <View style={s.evangileIcone}><DesignIcon name="solar:calendar-date-bold" size={22} color={d.primary} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={s.evangileSur}>ÉVANGILE DU JOUR (AELF)</Text>
                <Text style={s.evangileTexte} numberOfLines={1}>
                  {evangile ? `« ${evangile.accroche} »${evangile.reference ? ` (${evangile.reference})` : ''}` : 'Lectures de la messe du jour'}
                </Text>
              </View>
            </View>
            <View style={s.fleche}><DesignIcon name="solar:arrow-right-linear" size={16} color={d.primary} /></View>
          </Pressable>
        </View>

        {/* ── À la une sur Archidiocèse TV ── */}
        <View style={{ paddingTop: 16, paddingBottom: 8 }}>
          <View style={[s.row, { justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 }]}>
            <View>
              <Text style={s.titreSection}>À la une sur Archidiocèse TV</Text>
              <Text style={s.sousSection}>Emissions, enseignements et replays</Text>
            </View>
            <Pressable onPress={() => navigation.navigate('TV')} style={[s.row, { gap: 2 }]}>
              <Text style={s.toutVoir}>Tout voir</Text>
              <DesignIcon name="solar:alt-arrow-right-linear" size={14} color={d.accent} />
            </Pressable>
          </View>
          {videos.length === 0 ? (
            <Text style={[s.sousSection, { paddingHorizontal: 16 }]}>Les vidéos de la chaîne seront bientôt disponibles.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingHorizontal: 16, paddingBottom: 8 }}>
              {videos.map((v, i) => (
                <Pressable key={v.id} onPress={() => { compterVue(v.id); Linking.openURL(v.url) }} style={[s.video, ombre.xs]}>
                  <View style={s.videoImage}>
                    <Image source={v.thumbnail ? { uri: v.thumbnail } : (i % 2 ? IMG_PARCOURS : IMG_MESSE)} style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} />
                    <View style={s.voileLeger}>
                      <View style={[s.boutonLecture, ombre.sm]}><DesignIcon name="solar:play-bold" size={16} color={d.white} /></View>
                    </View>
                  </View>
                  <View style={{ padding: 10 }}>
                    <Text style={s.videoCategorie}>{(v.theme || (v.publicCible ? PUBLIC_CIBLE_LABELS[v.publicCible] : 'Replay')).toUpperCase()}</Text>
                    <Text style={s.videoTitre} numberOfLines={2}>{v.titre}</Text>
                    {v.intervenant && <Text style={s.videoMeta}>{v.intervenant}</Text>}
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Trouver ma paroisse ── */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={s.paroisse}>
            <View style={[s.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
              <View style={[s.row, { gap: 8 }]}>
                <DesignIcon name="solar:buildings-bold" size={18} color={d.primary} />
                <Text style={s.paroisseTitre}>Trouver ma paroisse</Text>
              </View>
              <Text style={s.sousSection}>{paroisses.length} paroisse{paroisses.length > 1 ? 's' : ''}</Text>
            </View>
            <Text style={[s.sousSection, { marginBottom: 12 }]}>Horaires des messes, confessions et contact direct de votre communauté locale.</Text>
            <View style={[s.row, { gap: 8 }]}>
              <Pressable onPress={autourDeMoi} disabled={localisation} style={[s.boutonClair, ombre.xs, localisation && { opacity: 0.6 }]}>
                <DesignIcon name="solar:map-point-linear" size={16} color={d.accent} />
                <Text style={s.boutonClairTexte}>{localisation ? 'Recherche…' : 'Autour de moi'}</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate('Plus', { screen: 'Paroisses' })} style={[s.boutonPlein, ombre.xs]}>
                <DesignIcon name="solar:list-linear" size={16} color={d.white} />
                <Text style={s.boutonPleinTexte}>Annuaire complet</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: d.background },
  row: { flexDirection: 'row', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    backgroundColor: d.alpha(d.card, 0.95), borderBottomWidth: 1, borderBottomColor: d.alpha(d.border, 0.7),
    paddingHorizontal: 16, paddingBottom: 12,
  },
  logo: { width: 40, height: 40, borderRadius: r.lg, backgroundColor: d.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12, ...ombre.xs },
  surtitre: { fontFamily: f.bold, fontSize: 11, letterSpacing: 0.6, color: d.accent },
  titreHeader: { fontFamily: f.bold, fontSize: 16, lineHeight: 20, color: d.primary },
  rond: { width: 36, height: 36, borderRadius: r.full, backgroundColor: d.secondary, alignItems: 'center', justifyContent: 'center' },
  pastille: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: d.destructive },

  hero: { borderRadius: r['2xl'], overflow: 'hidden', backgroundColor: d.primary },
  heroImg: { width: '100%', height: 176, opacity: 0.35 },
  heroVoile: { ...plein, padding: 20, justifyContent: 'flex-end' },
  badgeOr: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: r.full, backgroundColor: d.alpha(d.accent, 0.2), borderWidth: 1, borderColor: d.alpha(d.accent, 0.4), marginBottom: 8,
  },
  badgeOrTexte: { fontFamily: f.semibold, fontSize: 12, color: d.accent },
  heroTitre: { fontFamily: f.bold, fontSize: 20, lineHeight: 26, color: d.white },
  heroTexte: { fontFamily: f.regular, fontSize: 12, lineHeight: 16, color: d.alpha(d.white, 0.85), marginTop: 4 },

  grille: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  porte: { width: '48.5%', flexGrow: 1, flexBasis: '45%', backgroundColor: d.card, borderWidth: 1, borderColor: d.alpha(d.border, 0.8), padding: 14, borderRadius: r.xl, justifyContent: 'space-between' },
  porteIcone: { width: 36, height: 36, borderRadius: r.lg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  porteTitre: { fontFamily: f.bold, fontSize: 12, lineHeight: 15, color: d.primary },
  porteSous: { fontFamily: f.regular, fontSize: 11, color: d.mutedForeground, marginTop: 2 },

  direct: { backgroundColor: d.navy, borderRadius: r['2xl'], padding: 16, borderWidth: 1, borderColor: d.alpha(d.white, 0.1), overflow: 'hidden' },
  badgeDirect: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: d.destructive, paddingHorizontal: 8, paddingVertical: 2, borderRadius: r.full },
  point: { width: 6, height: 6, borderRadius: 3, backgroundColor: d.white },
  badgeDirectTexte: { fontFamily: f.extrabold, fontSize: 10, color: d.white },
  directSource: { fontFamily: f.medium, fontSize: 12, color: d.alpha(d.white, 0.8) },
  directVignette: { width: 64, height: 64, borderRadius: r.xl, overflow: 'hidden', borderWidth: 1, borderColor: d.alpha(d.white, 0.2) },
  voileNoir: { ...plein, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  directTitre: { fontFamily: f.bold, fontSize: 14, color: d.white },
  directTexte: { fontFamily: f.regular, fontSize: 12, color: d.alpha(d.white, 0.7), marginTop: 2 },
  lienOr: { fontFamily: f.bold, fontSize: 12, color: d.accent },

  evangile: { backgroundColor: d.card, borderWidth: 1, borderColor: d.border, borderRadius: r.xl, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  evangileIcone: { width: 40, height: 40, borderRadius: r.lg, backgroundColor: d.secondary, alignItems: 'center', justifyContent: 'center' },
  evangileSur: { fontFamily: f.bold, fontSize: 11, color: d.accent },
  evangileTexte: { fontFamily: f.bold, fontSize: 12, color: d.primary },
  fleche: { width: 32, height: 32, borderRadius: r.full, backgroundColor: d.secondary, alignItems: 'center', justifyContent: 'center' },

  titreSection: { fontFamily: f.bold, fontSize: 16, color: d.primary },
  sousSection: { fontFamily: f.regular, fontSize: 12, color: d.mutedForeground },
  toutVoir: { fontFamily: f.semibold, fontSize: 12, color: d.accent },
  video: { width: 200, backgroundColor: d.card, borderWidth: 1, borderColor: d.alpha(d.border, 0.8), borderRadius: r.xl, overflow: 'hidden' },
  videoImage: { height: 112, backgroundColor: d.muted },
  voileLeger: { ...plein, backgroundColor: 'rgba(0,0,0,0.2)', alignItems: 'center', justifyContent: 'center' },
  boutonLecture: { width: 32, height: 32, borderRadius: 16, backgroundColor: d.alpha(d.accent, 0.9), alignItems: 'center', justifyContent: 'center' },
  videoCategorie: { fontFamily: f.bold, fontSize: 10, color: d.accent },
  videoTitre: { fontFamily: f.bold, fontSize: 12, color: d.primary, marginTop: 2 },
  videoMeta: { fontFamily: f.regular, fontSize: 11, color: d.mutedForeground, marginTop: 4 },

  paroisse: { backgroundColor: d.alpha(d.secondary, 0.6), borderWidth: 1, borderColor: d.alpha(d.border, 0.7), borderRadius: r['2xl'], padding: 16 },
  paroisseTitre: { fontFamily: f.bold, fontSize: 14, color: d.primary },
  boutonClair: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: d.card, borderWidth: 1, borderColor: d.border, borderRadius: r.xl, paddingVertical: 8, paddingHorizontal: 12 },
  boutonClairTexte: { fontFamily: f.semibold, fontSize: 12, color: d.primary },
  boutonPlein: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: d.primary, borderRadius: r.xl, paddingVertical: 8, paddingHorizontal: 12 },
  boutonPleinTexte: { fontFamily: f.semibold, fontSize: 12, color: d.white },
})
