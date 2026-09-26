import { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { DesignIcon } from '../../components/DesignIcon'
import type { DesignIconName } from '../../theme/design-icons'
import { d, r, f, ombre } from '../../theme/design'
import { getParoisses, setParoisseCourante, type Paroisse } from '../../services/paroisses'
import { getVideos, compterVue, type Video } from '../../services/mediation'
import { getParcoursPublies, type Parcours } from '../../services/parcours'
import { getAnnonces, type Annonce } from '../../services/annonces'

/** Recherche globale : paroisses, vidéos, parcours et annonces. */

const normaliser = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

interface Resultat { cle: string; icon: DesignIconName; groupe: string; titre: string; sous: string; ouvrir: () => void }

export function RechercheScreen() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()
  const [q, setQ] = useState('')
  const [paroisses, setParoisses] = useState<Paroisse[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [parcours, setParcours] = useState<Parcours[]>([])
  const [annonces, setAnnonces] = useState<Annonce[]>([])

  useEffect(() => {
    getParoisses().then(setParoisses).catch(() => {})
    getVideos().then(setVideos).catch(() => {})
    getParcoursPublies(['decouvrir', 'conversion', 'approfondir', 'neuvaine', 'retraite']).then(setParcours).catch(() => {})
    getAnnonces().then(setAnnonces).catch(() => {})
  }, [])

  const resultats = useMemo<Resultat[]>(() => {
    const n = normaliser(q.trim())
    if (n.length < 2) return []
    const ok = (...champs: (string | null | undefined)[]) => champs.some(c => c && normaliser(c).includes(n))
    return [
      ...paroisses.filter(p => ok(p.nom, p.quartier, p.adresse, p.cure)).map(p => ({
        cle: 'p' + p.id, icon: 'solar:buildings-bold' as const, groupe: 'Paroisse', titre: p.nom, sous: [p.quartier, p.adresse].filter(Boolean).join(' · '),
        ouvrir: () => { setParoisseCourante(p.id); navigation.navigate('Plus', { screen: 'Paroisse' }) },
      })),
      ...parcours.filter(p => ok(p.titre, p.description)).map(p => ({
        cle: 'c' + p.id, icon: 'solar:compass-bold' as const, groupe: 'Parcours', titre: p.titre, sous: p.description,
        ouvrir: () => navigation.navigate('Parcours', { screen: 'ParcoursArchidiocese', params: { type: p.type } }),
      })),
      ...videos.filter(v => ok(v.titre, v.theme, v.intervenant)).map(v => ({
        cle: 'v' + v.id, icon: 'solar:play-circle-bold' as const, groupe: 'Vidéo', titre: v.titre, sous: [v.theme, v.intervenant].filter(Boolean).join(' · '),
        ouvrir: () => { compterVue(v.id); Linking.openURL(v.url) },
      })),
      ...annonces.filter(a => ok(a.titre, a.desc)).map(a => ({
        cle: 'a' + (a.id ?? a.titre), icon: 'solar:bell-linear' as const, groupe: 'Annonce', titre: a.titre, sous: a.desc,
        ouvrir: () => navigation.navigate('Plus', { screen: 'Annonces' }),
      })),
    ].slice(0, 50)
  }, [q, paroisses, parcours, videos, annonces, navigation])

  return (
    <View style={s.page}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} style={s.rond} accessibilityLabel="Retour">
          <DesignIcon name="solar:arrow-left-linear" size={18} color={d.primary} />
        </Pressable>
        <View style={s.champ}>
          <DesignIcon name="solar:magnifer-linear" size={16} color={d.mutedForeground} />
          <TextInput value={q} onChangeText={setQ} autoFocus placeholder="Paroisse, vidéo, parcours, annonce…"
            placeholderTextColor={d.mutedForeground} style={s.saisie} returnKeyType="search" />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} keyboardShouldPersistTaps="handled">
        {q.trim().length < 2 ? (
          <Text style={s.aide}>Tapez au moins deux lettres pour rechercher dans tout l'archidiocèse.</Text>
        ) : resultats.length === 0 ? (
          <Text style={s.aide}>Aucun résultat pour « {q.trim()} ».</Text>
        ) : resultats.map(res => (
          <Pressable key={res.cle} onPress={res.ouvrir} style={[s.carte, ombre.xs]}>
            <View style={s.icone}><DesignIcon name={res.icon} size={18} color={d.accent} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.groupe}>{res.groupe.toUpperCase()}</Text>
              <Text style={s.titre} numberOfLines={1}>{res.titre}</Text>
              {!!res.sous && <Text style={s.sous} numberOfLines={1}>{res.sous}</Text>}
            </View>
            <DesignIcon name="solar:alt-arrow-right-linear" size={16} color={d.mutedForeground} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: d.background },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: d.alpha(d.card, 0.95), borderBottomWidth: 1, borderBottomColor: d.alpha(d.border, 0.7),
    paddingHorizontal: 16, paddingBottom: 12,
  },
  rond: { width: 36, height: 36, borderRadius: r.full, backgroundColor: d.secondary, alignItems: 'center', justifyContent: 'center' },
  champ: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: d.secondary, borderRadius: r.full, paddingHorizontal: 12, height: 38 },
  saisie: { flex: 1, fontFamily: f.regular, fontSize: 13, color: d.foreground, paddingVertical: 0 },
  aide: { fontFamily: f.regular, fontSize: 12, color: d.mutedForeground, textAlign: 'center', paddingVertical: 24 },
  carte: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: d.card, borderWidth: 1, borderColor: d.border, borderRadius: r.xl, padding: 12 },
  icone: { width: 36, height: 36, borderRadius: r.lg, backgroundColor: d.alpha(d.accent, 0.15), alignItems: 'center', justifyContent: 'center' },
  groupe: { fontFamily: f.bold, fontSize: 9, color: d.accent },
  titre: { fontFamily: f.bold, fontSize: 13, color: d.primary },
  sous: { fontFamily: f.regular, fontSize: 11, color: d.mutedForeground },
})
