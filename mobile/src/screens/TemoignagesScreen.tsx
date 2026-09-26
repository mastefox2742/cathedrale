import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, Switch, ActivityIndicator, ScrollView } from 'react-native'
import { Screen } from '../components/Screen'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getTemoignagesApprouves, deposerTemoignage, getCategories, type Temoignage, type Categorie } from '../services/temoignages'
import { BackHeader, Chip } from '../components/ui'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function TemoignagesScreen() {
  const [contenu, setContenu] = useState('')
  const [nom, setNom] = useState('')
  const [anonyme, setAnonyme] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [temoignages, setTemoignages] = useState<Temoignage[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Categorie[]>([])
  const [categorieId, setCategorieId] = useState<string | null>(null)
  const [filtre, setFiltre] = useState<string | null>(null)

  function load() {
    setLoading(true)
    getTemoignagesApprouves().then(setTemoignages).catch(() => setTemoignages([])).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getCategories().then(setCategories).catch(() => setCategories([]))
  }, [])

  const parId = new Map(categories.map(c => [c.id, c]))
  const visibles = filtre ? temoignages.filter(t => t.category_id === filtre) : temoignages

  async function submit() {
    if (contenu.trim().length < 10) { setNotice('Écris au moins quelques mots (10 caractères minimum).'); return }
    setSubmitting(true)
    setNotice(null)
    try {
      await deposerTemoignage(contenu.trim(), anonyme ? undefined : (nom.trim() || undefined), categorieId ?? undefined)
      setContenu(''); setNom(''); setAnonyme(false); setCategorieId(null)
      setNotice("Merci ! Ton témoignage sera publié après vérification par l'équipe pastorale.")
    } catch {
      setNotice('Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <BackHeader title="Témoignages de foi" subtitle="Vie de la communauté" />

      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <View style={styles.formCard}>
          <Text style={[styles.mutedSm, { marginBottom: 12, lineHeight: 17 }]}>
            Une grâce reçue, une prière exaucée… Partage ce que Dieu a fait dans ta vie. Ton témoignage sera relu avant publication.
          </Text>
          {categories.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
              {categories.map(c => (
                <Chip key={c.id} label={`${c.emoji} ${c.libelle}`} active={categorieId === c.id} onPress={() => setCategorieId(categorieId === c.id ? null : c.id)} />
              ))}
            </ScrollView>
          )}
          <TextInput
            value={contenu} onChangeText={setContenu} placeholder="Écris ton témoignage..."
            placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} maxLength={2000}
            style={styles.textarea}
          />
          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Switch value={anonyme} onValueChange={setAnonyme} trackColor={{ true: colors.primary }} />
              <Text style={styles.mutedSm}>Publier anonymement</Text>
            </View>
          </View>
          {!anonyme && (
            <TextInput
              value={nom} onChangeText={setNom} placeholder="Ton nom (facultatif)"
              placeholderTextColor={colors.mutedForeground} style={[styles.input, { marginTop: 10 }]}
            />
          )}
          {notice && <Text style={[styles.mutedSm, { color: colors.primary, marginTop: 10 }]}>{notice}</Text>}
          <Pressable onPress={submit} disabled={submitting} style={[styles.submitBtn, submitting && { opacity: 0.7 }]}>
            {submitting ? <ActivityIndicator color={colors.primaryForeground} /> : (
              <>
                <Icon name="paper-plane-tilt-fill" size={15} color={colors.primaryForeground} />
                <Text style={styles.submitText}>Envoyer mon témoignage</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={[styles.h3, { marginTop: 26, marginBottom: 12 }]}>Témoignages publiés</Text>
        {categories.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
            <Chip label="Tous" active={filtre === null} onPress={() => setFiltre(null)} />
            {categories.map(c => <Chip key={c.id} label={`${c.emoji} ${c.libelle}`} active={filtre === c.id} onPress={() => setFiltre(c.id)} />)}
          </ScrollView>
        )}
        {loading ? (
          <SkeletonList count={3} />
        ) : visibles.length === 0 ? (
          <Text style={[styles.mutedSm, { textAlign: 'center', paddingVertical: 20 }]}>Aucun témoignage publié pour le moment.</Text>
        ) : (
          <View style={{ gap: 10, paddingBottom: 30 }}>
            {visibles.map((t) => (
              <View key={t.id} style={[styles.card, t.mis_en_avant && { borderColor: colors.accent }]}>
                {(t.mis_en_avant || (t.category_id && parId.get(t.category_id))) && (
                  <Text style={[styles.auteurText, { marginBottom: 6, color: colors.accent }]}>
                    {t.mis_en_avant ? '★ À la une ' : ''}{t.category_id && parId.get(t.category_id) ? `${parId.get(t.category_id)!.emoji} ${parId.get(t.category_id)!.libelle}` : ''}
                  </Text>
                )}
                <Text style={styles.contenuText}>{t.contenu}</Text>
                <Text style={styles.auteurText}>— {t.auteur_nom || 'Anonyme'} · {formatDate(t.created_at)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  h3: { fontFamily: fonts.heading, fontSize: 16, color: colors.primary },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  formCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  textarea: { fontFamily: fonts.sans, fontSize: 13, color: colors.foreground, minHeight: 90, textAlignVertical: 'top', backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12 },
  input: { fontFamily: fonts.sans, fontSize: 13, color: colors.foreground, backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 13, marginTop: 14 },
  submitText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primaryForeground },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
  contenuText: { fontFamily: fonts.sans, fontSize: 13, color: colors.foreground, lineHeight: 19, fontStyle: 'italic' },
  auteurText: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.mutedForeground, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
})
