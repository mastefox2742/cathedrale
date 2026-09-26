import { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Share, Modal, TextInput, Switch, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DesignIcon } from '../../components/DesignIcon'
import { d, r, f, ombre } from '../../theme/design'
import { getTemoignagesApprouves, getCategories, deposerTemoignage, rendreGloire, type Temoignage, type Categorie } from '../../services/temoignages'

const IMG_TEMOIGNAGE = require('../../../assets/archidiocese/temoignage.jpeg')
const CLE_GLOIRE = 'temoignages-gloire'

/** Filtres de la maquette, regroupant les catégories de la base. */
const FILTRES: { label: string; slugs: string[] }[] = [
  { label: 'Conversions', slugs: ['conversion'] },
  { label: 'Familles & Couples', slugs: ['famille'] },
  { label: 'Jeunesse & Vocation', slugs: ['jeunes', 'vocation'] },
  { label: 'Guérison & Épreuves', slugs: ['guerison', 'priere-exaucee'] },
]

function ilYa(iso: string) {
  const jours = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (jours <= 0) return "Aujourd'hui"
  if (jours === 1) return 'Hier'
  if (jours < 7) return `Il y a ${jours} jours`
  if (jours < 14) return 'Il y a 1 semaine'
  if (jours < 31) return `Il y a ${Math.floor(jours / 7)} semaines`
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

function initiales(nom: string | null) {
  if (!nom) return '✝'
  return nom.split(/[\s&-]+/).filter(Boolean).slice(0, 2).map(m => m[0].toUpperCase()).join('')
}

/** Première phrase, utilisée comme citation du témoignage à la une. */
function phrase(texte: string) {
  const m = texte.match(/^.{20,160}?[.!?»](\s|$)/)
  return (m ? m[0] : texte.slice(0, 140)).trim()
}

export function TemoignagesArchidioceseScreen() {
  const insets = useSafeAreaInsets()
  const [temoignages, setTemoignages] = useState<Temoignage[]>([])
  const [categories, setCategories] = useState<Categorie[]>([])
  const [filtre, setFiltre] = useState<number | null>(null)
  const [chargement, setChargement] = useState(true)
  const [dejaRendus, setDejaRendus] = useState<Set<string>>(new Set())
  const [ouvert, setOuvert] = useState<string | null>(null)
  const [formulaire, setFormulaire] = useState(false)

  useEffect(() => {
    getTemoignagesApprouves().then(setTemoignages).catch(() => setTemoignages([])).finally(() => setChargement(false))
    getCategories().then(setCategories).catch(() => {})
    AsyncStorage.getItem(CLE_GLOIRE).then(v => setDejaRendus(new Set(JSON.parse(v ?? '[]')))).catch(() => {})
  }, [])

  const slugDe = useMemo(() => new Map(categories.map(c => [c.id, c.slug])), [categories])
  const libelleDe = useMemo(() => new Map(categories.map(c => [c.id, c.libelle])), [categories])
  const visibles = filtre === null ? temoignages
    : temoignages.filter(t => t.category_id && FILTRES[filtre].slugs.includes(slugDe.get(t.category_id) ?? ''))
  const une = visibles.find(t => t.mis_en_avant) ?? null
  const liste = visibles.filter(t => t !== une)

  async function gloire(t: Temoignage) {
    if (dejaRendus.has(t.id)) return
    const suivants = new Set(dejaRendus).add(t.id)
    setDejaRendus(suivants)
    setTemoignages(ts => ts.map(x => x.id === t.id ? { ...x, nb_gloire: x.nb_gloire + 1 } : x))
    AsyncStorage.setItem(CLE_GLOIRE, JSON.stringify([...suivants])).catch(() => {})
    try {
      const total = await rendreGloire(t.id)
      if (total != null) setTemoignages(ts => ts.map(x => x.id === t.id ? { ...x, nb_gloire: total } : x))
    } catch { /* compteur local conservé */ }
  }

  function partager(t: Temoignage) {
    Share.share({ message: `« ${phrase(t.contenu)} »${t.auteur_nom ? ` — ${t.auteur_nom}` : ''}` }).catch(() => {})
  }

  return (
    <View style={s.page}>
      {/* ── En-tête ── */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={[s.row, { gap: 12, flex: 1 }]}>
          <View style={s.tuile}><DesignIcon name="solar:chat-square-like-bold" size={20} color={d.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.titreHeader}>Témoignages de Foi</Text>
            <Text style={s.sousHeader}>Des vies transformées par l'Évangile</Text>
          </View>
        </View>
        <Pressable onPress={() => setFormulaire(true)} style={[s.temoigner, ombre.xs]}>
          <DesignIcon name="solar:pen-new-square-linear" size={14} color={d.primaryForeground} />
          <Text style={s.temoignerTexte}>Témoigner</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* ── Filtres ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.bandeFiltres} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
          <Pressable onPress={() => setFiltre(null)} style={[s.puce, filtre === null && s.puceActive]}>
            <Text style={[s.puceTexte, filtre === null && s.puceTexteActive]}>Tous ({temoignages.length})</Text>
          </Pressable>
          {FILTRES.map((fl, i) => (
            <Pressable key={fl.label} onPress={() => setFiltre(i)} style={[s.puce, filtre === i && s.puceActive]}>
              <Text style={[s.puceTexte, filtre === i && s.puceTexteActive]}>{fl.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {chargement && <ActivityIndicator color={d.primary} style={{ marginTop: 32 }} />}

        {/* ── Témoignage du mois ── */}
        {une && (
          <View style={{ padding: 16 }}>
            <View style={[s.carteUne, ombre.xs]}>
              <View style={{ height: 176 }}>
                <Image source={IMG_TEMOIGNAGE} style={{ width: '100%', height: '100%' }} />
                <View style={[s.badgeMois, ombre.xs]}><Text style={s.badgeMoisTexte}>TÉMOIGNAGE DU MOIS</Text></View>
              </View>
              <View style={{ padding: 16 }}>
                <View style={[s.row, { gap: 8, marginBottom: 8, flexWrap: 'wrap' }]}>
                  <Text style={s.nom}>{une.auteur_nom || 'Anonyme'}</Text>
                  {!!une.paroisse && <Text style={s.meta}>· {une.paroisse}</Text>}
                </View>
                <Text style={s.citationUne}>« {phrase(une.contenu)} »</Text>
                <Text style={s.extrait} numberOfLines={ouvert === une.id ? undefined : 2}>{une.contenu}</Text>
                <View style={s.piedUne}>
                  <Pressable onPress={() => gloire(une)} style={[s.row, { gap: 4 }]}>
                    <DesignIcon name="solar:heart-bold" size={14} color={d.destructive} />
                    <Text style={s.compteur}>{une.nb_gloire} prière{une.nb_gloire > 1 ? 's' : ''} partagée{une.nb_gloire > 1 ? 's' : ''}</Text>
                  </Pressable>
                  <Pressable onPress={() => setOuvert(ouvert === une.id ? null : une.id)} style={[s.row, { gap: 4 }]}>
                    <Text style={s.lire}>{ouvert === une.id ? 'Réduire' : 'Lire le témoignage'}</Text>
                    <DesignIcon name="solar:arrow-right-linear" size={14} color={d.primary} />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Liste ── */}
        <View style={{ paddingHorizontal: 16, gap: 12, paddingTop: une ? 0 : 16 }}>
          {!chargement && visibles.length === 0 && (
            <Text style={[s.meta, { textAlign: 'center', paddingVertical: 16 }]}>Aucun témoignage publié pour le moment.</Text>
          )}
          {liste.map(t => {
            const rendu = dejaRendus.has(t.id)
            return (
              <Pressable key={t.id} onPress={() => setOuvert(ouvert === t.id ? null : t.id)} style={[s.carte, ombre.xs]}>
                <View style={[s.row, { alignItems: 'flex-start', gap: 12 }]}>
                  <View style={s.avatar}><Text style={s.avatarTexte}>{initiales(t.auteur_nom)}</Text></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={[s.row, { justifyContent: 'space-between', gap: 8 }]}>
                      <Text style={[s.nom, { flex: 1 }]} numberOfLines={1}>{t.auteur_nom || 'Anonyme'}</Text>
                      <Text style={s.date}>{ilYa(t.created_at)}</Text>
                    </View>
                    {!!(t.category_id && libelleDe.get(t.category_id)) && (
                      <Text style={s.categorie}>{libelleDe.get(t.category_id)!.toUpperCase()}{t.paroisse ? ` · ${t.paroisse.toUpperCase()}` : ''}</Text>
                    )}
                    <Text style={s.texte} numberOfLines={ouvert === t.id ? undefined : 4}>« {t.contenu} »</Text>
                    <View style={s.pied}>
                      <Pressable onPress={() => gloire(t)} style={[s.row, { gap: 4 }]} accessibilityLabel="Gloire à Dieu">
                        <DesignIcon name={rendu ? 'solar:heart-bold' : 'solar:heart-linear'} size={16} color={rendu ? d.destructive : d.mutedForeground} />
                        <Text style={[s.action, { fontFamily: f.semibold }]}>{t.nb_gloire} « Gloire à Dieu »</Text>
                      </Pressable>
                      <Pressable onPress={() => partager(t)} style={[s.row, { gap: 4 }]}>
                        <DesignIcon name="solar:share-linear" size={16} color={d.mutedForeground} />
                        <Text style={s.action}>Partager</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>

        {/* ── Appel à témoigner ── */}
        <View style={{ padding: 16, marginTop: 8 }}>
          <View style={s.appel}>
            <View style={s.appelIcone}><DesignIcon name="solar:chat-round-line-bold" size={22} color={d.primary} /></View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.nom}>Dieu a agi dans votre vie ?</Text>
              <Text style={[s.meta, { fontSize: 11, marginTop: 2 }]}>Partagez votre témoignage pour fortifier la foi de la communauté.</Text>
              <Pressable onPress={() => setFormulaire(true)} style={[s.row, { gap: 4, marginTop: 8 }]}>
                <Text style={[s.lire, { color: d.accent }]}>Raconter mon histoire</Text>
                <DesignIcon name="solar:arrow-right-linear" size={14} color={d.accent} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <FormulaireTemoignage visible={formulaire} categories={categories} onClose={() => setFormulaire(false)} />
    </View>
  )
}

function FormulaireTemoignage({ visible, categories, onClose }: { visible: boolean; categories: Categorie[]; onClose: () => void }) {
  const insets = useSafeAreaInsets()
  const [contenu, setContenu] = useState('')
  const [nom, setNom] = useState('')
  const [anonyme, setAnonyme] = useState(false)
  const [categorieId, setCategorieId] = useState<string | null>(null)
  const [envoi, setEnvoi] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [envoye, setEnvoye] = useState(false)

  function fermer() {
    onClose()
    if (envoye) { setContenu(''); setNom(''); setAnonyme(false); setCategorieId(null); setEnvoye(false); setMessage(null) }
  }

  async function envoyer() {
    if (contenu.trim().length < 10) { setMessage('Écrivez au moins quelques mots (10 caractères minimum).'); return }
    setEnvoi(true); setMessage(null)
    try {
      await deposerTemoignage(contenu.trim(), anonyme ? undefined : (nom.trim() || undefined), categorieId ?? undefined)
      setEnvoye(true)
      setMessage("Merci ! Votre témoignage sera publié après relecture par l'équipe pastorale.")
    } catch {
      setMessage('Une erreur est survenue. Réessayez.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={fermer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.fond}>
        <Pressable style={{ flex: 1 }} onPress={fermer} />
        <View style={[s.feuille, { paddingBottom: insets.bottom + 16 }]}>
          <View style={[s.row, { justifyContent: 'space-between', marginBottom: 4 }]}>
            <Text style={[s.titreHeader, { fontSize: 16 }]}>Raconter mon histoire</Text>
            <Pressable onPress={fermer}><Text style={s.lire}>Fermer</Text></Pressable>
          </View>
          <Text style={[s.meta, { marginBottom: 12 }]}>Une grâce reçue, une prière exaucée… Votre témoignage sera relu avant publication.</Text>
          {envoye ? (
            <View style={[s.appel, { marginBottom: 8 }]}>
              <DesignIcon name="solar:check-circle-bold" size={22} color={d.chart3} />
              <Text style={[s.texte, { flex: 1, marginTop: 0 }]}>{message}</Text>
            </View>
          ) : (
            <>
              {categories.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 10 }}>
                  {categories.map(c => (
                    <Pressable key={c.id} onPress={() => setCategorieId(categorieId === c.id ? null : c.id)} style={[s.puce, categorieId === c.id && s.puceActive]}>
                      <Text style={[s.puceTexte, categorieId === c.id && s.puceTexteActive]}>{c.libelle}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}
              <TextInput value={contenu} onChangeText={setContenu} placeholder="Écrivez votre témoignage…" placeholderTextColor={d.mutedForeground}
                multiline maxLength={2000} style={[s.champ, { minHeight: 110, textAlignVertical: 'top' }]} />
              <View style={[s.row, { gap: 8, marginTop: 10 }]}>
                <Switch value={anonyme} onValueChange={setAnonyme} trackColor={{ true: d.primary }} />
                <Text style={s.meta}>Publier anonymement</Text>
              </View>
              {!anonyme && (
                <TextInput value={nom} onChangeText={setNom} placeholder="Votre nom (facultatif)" placeholderTextColor={d.mutedForeground} style={[s.champ, { marginTop: 10 }]} />
              )}
              {!!message && <Text style={[s.meta, { color: d.destructive, marginTop: 8 }]}>{message}</Text>}
              <Pressable onPress={envoyer} disabled={envoi} style={[s.envoyer, envoi && { opacity: 0.7 }]}>
                {envoi ? <ActivityIndicator color={d.primaryForeground} /> : <Text style={s.temoignerTexte}>Envoyer mon témoignage</Text>}
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  tuile: { width: 36, height: 36, borderRadius: r.xl, backgroundColor: d.alpha(d.accent, 0.2), alignItems: 'center', justifyContent: 'center' },
  titreHeader: { fontFamily: f.bold, fontSize: 16, lineHeight: 20, color: d.primary },
  sousHeader: { fontFamily: f.regular, fontSize: 10, color: d.mutedForeground },
  temoigner: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: d.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: r.full },
  temoignerTexte: { fontFamily: f.bold, fontSize: 12, color: d.primaryForeground },

  bandeFiltres: { flexGrow: 0, backgroundColor: d.card, borderBottomWidth: 1, borderBottomColor: d.alpha(d.border, 0.6) },
  puce: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: r.full, backgroundColor: d.secondary },
  puceActive: { backgroundColor: d.primary },
  puceTexte: { fontFamily: f.medium, fontSize: 12, color: d.primary },
  puceTexteActive: { fontFamily: f.bold, color: d.primaryForeground },

  carteUne: { backgroundColor: d.card, borderWidth: 1, borderColor: d.border, borderRadius: r['2xl'], overflow: 'hidden' },
  badgeMois: { position: 'absolute', top: 12, left: 12, backgroundColor: d.accent, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeMoisTexte: { fontFamily: f.extrabold, fontSize: 10, color: d.primary },
  nom: { fontFamily: f.bold, fontSize: 12, color: d.primary },
  meta: { fontFamily: f.regular, fontSize: 12, color: d.mutedForeground },
  citationUne: { fontFamily: f.bold, fontSize: 14, lineHeight: 19, color: d.primary },
  extrait: { fontFamily: f.regular, fontSize: 12, lineHeight: 17, color: d.mutedForeground, marginTop: 8 },
  piedUne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: d.alpha(d.border, 0.6) },
  compteur: { fontFamily: f.regular, fontSize: 11, color: d.mutedForeground },
  lire: { fontFamily: f.bold, fontSize: 12, color: d.primary },

  carte: { backgroundColor: d.card, borderWidth: 1, borderColor: d.border, borderRadius: r['2xl'], padding: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: d.secondary, borderWidth: 1, borderColor: d.border, alignItems: 'center', justifyContent: 'center' },
  avatarTexte: { fontFamily: f.bold, fontSize: 13, color: d.primary },
  date: { fontFamily: f.regular, fontSize: 10, color: d.mutedForeground },
  categorie: { fontFamily: f.bold, fontSize: 10, color: d.accent, marginTop: 2 },
  texte: { fontFamily: f.medium, fontSize: 12, lineHeight: 17, color: d.foreground, marginTop: 8 },
  pied: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: d.alpha(d.border, 0.5) },
  action: { fontFamily: f.regular, fontSize: 12, color: d.mutedForeground },

  appel: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: d.secondary, borderWidth: 1, borderColor: d.border, borderRadius: r['2xl'], padding: 16 },
  appelIcone: { width: 44, height: 44, borderRadius: r.xl, backgroundColor: d.accent, alignItems: 'center', justifyContent: 'center' },

  fond: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  feuille: { backgroundColor: d.card, borderTopLeftRadius: r['2xl'], borderTopRightRadius: r['2xl'], padding: 16 },
  champ: { fontFamily: f.regular, fontSize: 13, color: d.foreground, backgroundColor: d.secondary, borderRadius: r.lg, padding: 12 },
  envoyer: { backgroundColor: d.primary, borderRadius: r.xl, paddingVertical: 12, alignItems: 'center', marginTop: 14 },
})
