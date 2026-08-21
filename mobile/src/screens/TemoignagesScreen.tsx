import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, Switch, ActivityIndicator } from 'react-native'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getTemoignagesApprouves, deposerTemoignage, type Temoignage } from '../services/temoignages'

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

  function load() {
    setLoading(true)
    getTemoignagesApprouves().then(setTemoignages).catch(() => setTemoignages([])).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function submit() {
    if (contenu.trim().length < 10) { setNotice('Écris au moins quelques mots (10 caractères minimum).'); return }
    setSubmitting(true)
    setNotice(null)
    try {
      await deposerTemoignage(contenu.trim(), anonyme ? undefined : (nom.trim() || undefined))
      setContenu(''); setNom(''); setAnonyme(false)
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
        {loading ? (
          <SkeletonList count={3} />
        ) : temoignages.length === 0 ? (
          <Text style={[styles.mutedSm, { textAlign: 'center', paddingVertical: 20 }]}>Aucun témoignage publié pour le moment.</Text>
        ) : (
          <View style={{ gap: 10, paddingBottom: 30 }}>
            {temoignages.map((t) => (
              <View key={t.id} style={styles.card}>
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
