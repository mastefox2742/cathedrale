import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Image, ActivityIndicator } from 'react-native'
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { DesignIcon } from '../../components/DesignIcon'
import { d, r, f, ombre, plein } from '../../theme/design'
import {
  getParcoursPublies, getEtapes, getProgression, getParcoursEnregistres, basculerEnregistrement,
  TYPE_PARCOURS, type TypeParcours, type Parcours, type Etape,
} from '../../services/parcours'

const IMG_PARCOURS = require('../../../assets/archidiocese/parcours.jpeg')

const NIVEAU: Partial<Record<TypeParcours, string>> = {
  decouvrir: 'Niveau Découverte · Gratuit',
  conversion: 'Catéchuménat · Gratuit',
  approfondir: 'Niveau Approfondissement · Gratuit',
  neuvaine: 'Neuvaine · Gratuit',
  retraite: 'Retraite en ligne · Gratuit',
}

/** Première phrase lisible du contenu (sans titres ni mise en forme). */
function extrait(contenu: string) {
  const ligne = contenu.split('\n').map(l => l.trim()).find(l => l && !l.startsWith('#')) ?? ''
  return ligne.replace(/^[>-]\s*/, '').replace(/\*\*?(.+?)\*\*?/g, '$1')
}

/** Durée estimée : lecture (~200 mots/min) + quiz. */
function minutes(e: Etape) {
  const mots = e.contenu.split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.round(mots / 200) + e.quiz.length + (e.videoUrl ? 4 : 0))
}

export function ParcoursArchidioceseScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const insets = useSafeAreaInsets()
  const type: TypeParcours = route.params?.type ?? 'decouvrir'
  const [liste, setListe] = useState<Parcours[]>([])
  const [choisi, setChoisi] = useState(0)
  const [etapes, setEtapes] = useState<Etape[]>([])
  const [faites, setFaites] = useState<Set<string>>(new Set())
  const [enregistre, setEnregistre] = useState(false)
  const [chargement, setChargement] = useState(true)

  useEffect(() => {
    setChargement(true); setChoisi(0)
    getParcoursPublies([type]).then(setListe).catch(() => setListe([])).finally(() => setChargement(false))
  }, [type])

  const parcours = liste[choisi] ?? null

  useEffect(() => {
    setEtapes([])
    if (!parcours) return
    getEtapes(parcours.id).then(setEtapes).catch(() => {})
    getParcoursEnregistres().then(l => setEnregistre(l.includes(parcours.id)))
  }, [parcours?.id])

  // Rafraîchit la progression au retour d'une étape.
  useFocusEffect(useCallback(() => {
    if (parcours) getProgression(parcours.id).then(setFaites).catch(() => {})
  }, [parcours?.id]))

  const nbFaites = etapes.filter(e => faites.has(e.id)).length
  const pct = etapes.length ? Math.round((nbFaites / etapes.length) * 100) : 0
  const courante = etapes.findIndex(e => !faites.has(e.id))
  const totalMin = etapes.reduce((t, e) => t + minutes(e), 0)

  function ouvrir(index: number) {
    if (parcours) navigation.navigate('ParcoursEtape', { parcours, etapeIndex: index })
  }

  function retour() {
    if (navigation.canGoBack()) navigation.goBack()
    else navigation.navigate('Accueil')
  }

  return (
    <View style={s.page}>
      {/* ── En-tête ── */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={[s.row, { gap: 12, flex: 1 }]}>
          <Pressable onPress={retour} style={s.retour} accessibilityLabel="Retour">
            <DesignIcon name="solar:arrow-left-linear" size={18} color={d.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={s.surTitre}>PARCOURS INTERACTIF</Text>
            <Text style={s.titreHeader} numberOfLines={1}>{TYPE_PARCOURS[type].titre}</Text>
          </View>
        </View>
        {parcours && (
          <Pressable onPress={() => basculerEnregistrement(parcours.id).then(setEnregistre)} style={s.enregistrer}>
            <DesignIcon name={enregistre ? 'solar:book-bookmark-bold' : 'solar:bookmark-linear'} size={14} color={d.primary} />
            <Text style={s.enregistrerTexte}>{enregistre ? 'Enregistré' : 'Enregistrer'}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {chargement ? (
          <ActivityIndicator color={d.primary} style={{ marginTop: 48 }} />
        ) : !parcours ? (
          <View style={{ padding: 16 }}>
            <View style={[s.carte, { alignItems: 'center', gap: 6 }]}>
              <DesignIcon name="solar:compass-bold" size={28} color={d.accent} />
              <Text style={[s.etapeTitre, { textAlign: 'center' }]}>Ce parcours sera bientôt disponible.</Text>
              <Text style={[s.etapeTexte, { textAlign: 'center' }]}>{TYPE_PARCOURS[type].accroche}</Text>
            </View>
          </View>
        ) : (
          <>
            {/* ── Bandeau + progression ── */}
            <View style={{ padding: 16 }}>
              <View style={s.hero}>
                <Image source={IMG_PARCOURS} style={[plein, { width: '100%', height: '100%', opacity: 0.4 }]} />
                <LinearGradient colors={[d.navy, d.alpha(d.primary, 0.75), 'transparent']} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={[plein, s.heroVoile]}>
                  <View style={s.niveau}><Text style={s.niveauTexte}>{(NIVEAU[type] ?? 'Gratuit').toUpperCase()}</Text></View>
                  <Text style={s.heroTitre}>{parcours.titre}</Text>
                  {!!parcours.description && <Text style={s.heroSous} numberOfLines={2}>{parcours.description}</Text>}
                </LinearGradient>
              </View>

              <View style={[s.carte, ombre.xs, { marginTop: 12 }]}>
                <View style={[s.row, { justifyContent: 'space-between', marginBottom: 8 }]}>
                  <Text style={s.progLabel}>Votre progression</Text>
                  <Text style={s.progValeur}>Étape {nbFaites} sur {etapes.length} complétée ({pct}%)</Text>
                </View>
                <View style={s.barre}><View style={[s.barreRemplie, { width: `${pct}%` }]} /></View>
                <View style={s.progPied}>
                  <View style={[s.row, { gap: 4 }]}>
                    <DesignIcon name="solar:clock-circle-linear" size={14} color={d.mutedForeground} />
                    <Text style={s.pied}>{parcours.duree ? `${parcours.duree} au total` : `~${totalMin} min au total`}</Text>
                  </View>
                  <View style={[s.row, { gap: 4 }]}>
                    <DesignIcon name="solar:check-circle-bold" size={14} color={d.chart3} />
                    <Text style={[s.pied, { color: d.chart3, fontFamily: f.semibold }]}>Sans compte requis</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Étapes ── */}
            <View style={{ paddingHorizontal: 16, gap: 12 }}>
              <Text style={s.titreSection}>Les étapes du parcours</Text>
              {etapes.length === 0 && <Text style={s.etapeTexte}>Les étapes de ce parcours arrivent bientôt.</Text>}
              {etapes.map((e, i) => {
                const fait = faites.has(e.id)
                const enCours = i === courante
                const dialogue = e.appelAction === 'parler_pretre'
                const verrou = !fait && !enCours
                return (
                  <Pressable key={e.id} disabled={verrou} onPress={() => ouvrir(i)}
                    style={[s.etape, fait && [s.etapeFaite, ombre.xs], enCours && [s.etapeCourante, ombre.sm], verrou && s.etapeVerrou]}>
                    <View style={[s.pastille, fait && { backgroundColor: d.alpha(d.chart3, 0.15) }, enCours && { backgroundColor: d.accent }, verrou && { backgroundColor: d.muted }]}>
                      {fait ? <DesignIcon name="solar:check-read-bold" size={18} color={d.chart3} />
                        : enCours ? <DesignIcon name="solar:play-bold" size={16} color={d.primary} />
                        : <DesignIcon name={dialogue ? 'solar:chat-round-dots-bold' : 'solar:lock-bold'} size={16} color={d.mutedForeground} />}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <View style={[s.row, { justifyContent: 'space-between' }]}>
                        <Text style={[s.etapeNum, fait && { color: d.chart3 }, enCours && { color: d.accent, fontFamily: f.extrabold }]}>
                          ÉTAPE {i + 1}{fait ? ' · TERMINÉ' : enCours ? ' · EN COURS' : dialogue ? ' · DIALOGUE' : ''}
                        </Text>
                        {!dialogue && <Text style={[s.duree, enCours && { fontFamily: f.semibold }]}>{minutes(e)} min</Text>}
                      </View>
                      <Text style={s.etapeTitre}>{e.titre}</Text>
                      {!!extrait(e.contenu) && <Text style={s.etapeTexte} numberOfLines={2}>{extrait(e.contenu)}</Text>}
                      {enCours && (
                        <Pressable onPress={() => ouvrir(i)} style={[s.continuer, ombre.xs]}>
                          <Text style={s.continuerTexte}>{nbFaites === 0 ? 'Commencer cette étape' : 'Continuer cette étape'}</Text>
                          <DesignIcon name="solar:arrow-right-linear" size={14} color={d.primaryForeground} />
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
                )
              })}

              {liste.length > 1 && (
                <View style={{ gap: 8, marginTop: 4 }}>
                  <Text style={s.titreSection}>Autres parcours</Text>
                  {liste.map((p, i) => i === choisi ? null : (
                    <Pressable key={p.id} onPress={() => setChoisi(i)} style={[s.carte, s.row, { gap: 10, padding: 12 }]}>
                      <DesignIcon name="solar:compass-bold" size={18} color={d.accent} />
                      <Text style={[s.etapeTitre, { flex: 1, marginTop: 0 }]}>{p.titre}</Text>
                      <DesignIcon name="solar:alt-arrow-right-linear" size={16} color={d.mutedForeground} />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </>
        )}

        {/* ── Appel ── */}
        <View style={{ padding: 16, marginTop: 8 }}>
          <View style={s.appel}>
            <Text style={[s.etapeTitre, { textAlign: 'center' }]}>Vous souhaitez rejoindre un groupe en paroisse ?</Text>
            <Text style={[s.etapeTexte, { textAlign: 'center', marginTop: 4 }]}>
              Le catéchuménat diocésain accueille chaque année des centaines d'adultes et de jeunes.
            </Text>
            <Pressable onPress={() => navigation.navigate('Prier', { screen: 'Demarches' })} style={[s.boutonPlein, ombre.xs]}>
              <Text style={s.continuerTexte}>Contacter le service diocésain du catéchuménat</Text>
            </Pressable>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    backgroundColor: d.alpha(d.card, 0.95), borderBottomWidth: 1, borderBottomColor: d.alpha(d.border, 0.7),
    paddingHorizontal: 16, paddingBottom: 12,
  },
  retour: { width: 36, height: 36, borderRadius: r.full, backgroundColor: d.secondary, alignItems: 'center', justifyContent: 'center' },
  surTitre: { fontFamily: f.bold, fontSize: 10, letterSpacing: 0.5, color: d.accent },
  titreHeader: { fontFamily: f.bold, fontSize: 16, lineHeight: 20, color: d.primary },
  enregistrer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: d.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: r.full },
  enregistrerTexte: { fontFamily: f.bold, fontSize: 12, color: d.primary },

  hero: { height: 160, borderRadius: r['2xl'], overflow: 'hidden', backgroundColor: d.primary },
  heroVoile: { padding: 16, justifyContent: 'flex-end' },
  niveau: { alignSelf: 'flex-start', backgroundColor: d.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: r.md - 4, marginBottom: 6 },
  niveauTexte: { fontFamily: f.extrabold, fontSize: 10, color: d.primary },
  heroTitre: { fontFamily: f.bold, fontSize: 18, color: d.white },
  heroSous: { fontFamily: f.regular, fontSize: 12, color: d.alpha(d.white, 0.8), marginTop: 2 },

  carte: { backgroundColor: d.card, borderWidth: 1, borderColor: d.border, borderRadius: r['2xl'], padding: 16 },
  progLabel: { fontFamily: f.semibold, fontSize: 12, color: d.mutedForeground },
  progValeur: { fontFamily: f.bold, fontSize: 12, color: d.primary },
  barre: { height: 8, borderRadius: r.full, backgroundColor: d.muted, overflow: 'hidden' },
  barreRemplie: { height: '100%', borderRadius: r.full, backgroundColor: d.accent },
  progPied: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: d.alpha(d.border, 0.5) },
  pied: { fontFamily: f.regular, fontSize: 12, color: d.mutedForeground },

  titreSection: { fontFamily: f.bold, fontSize: 14, color: d.primary },
  etape: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, borderRadius: r['2xl'], borderWidth: 1, backgroundColor: d.card, borderColor: d.border },
  etapeFaite: { borderColor: d.alpha(d.chart3, 0.4) },
  etapeCourante: { backgroundColor: d.secondary, borderWidth: 2, borderColor: d.accent },
  etapeVerrou: { backgroundColor: d.alpha(d.card, 0.6), borderColor: d.alpha(d.border, 0.6), opacity: 0.8 },
  pastille: { width: 32, height: 32, borderRadius: r.full, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  etapeNum: { fontFamily: f.bold, fontSize: 10, color: d.mutedForeground },
  duree: { fontFamily: f.regular, fontSize: 10, color: d.mutedForeground },
  etapeTitre: { fontFamily: f.bold, fontSize: 12, color: d.primary, marginTop: 2 },
  etapeTexte: { fontFamily: f.regular, fontSize: 11, color: d.mutedForeground, marginTop: 2 },
  continuer: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: d.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: r.lg, marginTop: 10 },
  continuerTexte: { fontFamily: f.bold, fontSize: 12, color: d.primaryForeground, textAlign: 'center' },

  appel: { backgroundColor: d.alpha(d.primary, 0.05), borderWidth: 1, borderColor: d.alpha(d.primary, 0.2), borderRadius: r['2xl'], padding: 16, alignItems: 'center' },
  boutonPlein: { alignSelf: 'stretch', backgroundColor: d.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: r.xl, marginTop: 12 },
})
