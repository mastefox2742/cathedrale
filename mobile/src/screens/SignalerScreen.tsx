import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { Icon } from '../components/Icon'
import { colors, fonts, radius } from '../theme/colors'
import { creerSignalement } from '../services/signalements'

export function SignalerScreen() {
  const [concerne, setConcerne] = useState('')
  const [description, setDescription] = useState('')
  const [reporterNom, setReporterNom] = useState('')
  const [reporterContact, setReporterContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [envoye, setEnvoye] = useState(false)

  const valide = description.trim().length > 9

  async function submit() {
    if (!valide) { setError('Merci de décrire votre préoccupation (au moins quelques mots).'); return }
    setError('')
    setSubmitting(true)
    try {
      await creerSignalement({
        concerne: concerne.trim() || undefined,
        description: description.trim(),
        reporterNom: reporterNom.trim() || undefined,
        reporterContact: reporterContact.trim() || undefined,
      })
      setEnvoye(true)
    } catch {
      setError('Une erreur est survenue. Merci de réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (envoye) {
    return (
      <Screen>
        <BackHeader title="Signaler une préoccupation" subtitle="Protection des mineurs" />
        <View style={{ paddingHorizontal: 20, paddingTop: 30, alignItems: 'center' }}>
          <View style={styles.confirmCard}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>🛡️</Text>
            <Text style={styles.confirmTitle}>Signalement reçu</Text>
            <Text style={[styles.mutedSm, { textAlign: 'center', marginTop: 4 }]}>
              Merci d'avoir pris le temps de signaler cette préoccupation. Elle a été transmise en
              toute confidentialité au/à la responsable sécurité de la paroisse.
            </Text>
          </View>
        </View>
      </Screen>
    )
  }

  return (
    <Screen scroll={false}>
      <BackHeader title="Signaler une préoccupation" subtitle="Protection des mineurs" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">

        <Text style={[styles.mutedSm, { marginBottom: 16 }]}>
          Vous avez une inquiétude concernant la sécurité ou le bien-être d'un enfant ou d'un jeune
          dans le cadre d'une activité paroissiale ? Ce formulaire est confidentiel et lu
          uniquement par le/la responsable sécurité et l'administrateur de la paroisse. Vous
          pouvez le remplir de manière anonyme.
        </Text>

        <Text style={styles.label}>Qui ou quoi est concerné ? (optionnel)</Text>
        <TextInput value={concerne} onChangeText={setConcerne} placeholder="Ex : un enfant, un encadrant, une situation…" placeholderTextColor={colors.mutedForeground} style={styles.input} />

        <Text style={[styles.label, { marginTop: 14 }]}>Décrivez votre préoccupation *</Text>
        <TextInput
          value={description} onChangeText={setDescription} placeholder="Décrivez ce qui vous inquiète, avec le plus de détails utiles…"
          placeholderTextColor={colors.mutedForeground} multiline numberOfLines={6} style={styles.textarea}
        />

        <Text style={[styles.mutedSm, { marginTop: 14, marginBottom: 4 }]}>
          Les champs ci-dessous sont facultatifs. Laissés vides, votre signalement sera anonyme.
        </Text>

        <Text style={[styles.label, { marginTop: 10 }]}>Votre nom (optionnel)</Text>
        <TextInput value={reporterNom} onChangeText={setReporterNom} placeholder="Laisser vide pour rester anonyme" placeholderTextColor={colors.mutedForeground} style={styles.input} />

        <Text style={[styles.label, { marginTop: 14 }]}>Un contact pour vous recontacter (optionnel)</Text>
        <TextInput value={reporterContact} onChangeText={setReporterContact} placeholder="Téléphone ou email" placeholderTextColor={colors.mutedForeground} style={styles.input} />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable onPress={submit} disabled={submitting || !valide} style={[styles.submitBtn, (submitting || !valide) && { opacity: 0.5 }]}>
          {submitting ? <ActivityIndicator color={colors.primaryForeground} /> : (
            <>
              <Icon name="paper-plane-tilt-fill" size={15} color={colors.primaryForeground} />
              <Text style={styles.submitText}>Envoyer le signalement</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, lineHeight: 17 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, marginBottom: 8 },
  input: { fontFamily: fonts.sans, fontSize: 14, color: colors.foreground, backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12 },
  textarea: { fontFamily: fonts.sans, fontSize: 14, color: colors.foreground, minHeight: 120, textAlignVertical: 'top', backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12 },
  errorText: { fontFamily: fonts.sans, fontSize: 12, color: colors.destructive, marginTop: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, marginTop: 20 },
  submitText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primaryForeground },
  confirmCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 24, alignItems: 'center', width: '100%' },
  confirmTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.primary },
})
