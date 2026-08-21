import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, ActivityIndicator } from 'react-native'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { Icon } from '../components/Icon'
import { colors, fonts, radius } from '../theme/colors'
import { creerDemande, TYPE_DEMANDE_LABELS, type TypeDemande } from '../services/demandesPastorales'

const TYPES = Object.entries(TYPE_DEMANDE_LABELS) as [TypeDemande, string][]

export function DemarchesScreen() {
  const [type, setType] = useState<TypeDemande>('info_generale')
  const [nom, setNom] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')

  const valide = nom.trim().length > 1 && contact.trim().length > 3 && message.trim().length > 5

  async function submit() {
    if (!valide) { setError('Merci de renseigner votre nom, un contact et votre message.'); return }
    setError('')
    setSubmitting(true)
    try {
      const ref = await creerDemande({ type, nom: nom.trim(), contact: contact.trim(), message: message.trim() })
      setReference(ref)
    } catch {
      setError('Une erreur est survenue. Merci de réessayer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (reference) {
    return (
      <Screen>
        <BackHeader title="Démarches pastorales" subtitle="Demande envoyée" />
        <View style={{ paddingHorizontal: 20, paddingTop: 30, alignItems: 'center' }}>
          <View style={styles.confirmCard}>
            <Text style={{ fontSize: 40, marginBottom: 8 }}>✝️</Text>
            <Text style={styles.confirmTitle}>Demande envoyée</Text>
            <Text style={[styles.mutedSm, { textAlign: 'center', marginTop: 4, marginBottom: 16 }]}>
              Nous avons bien reçu votre demande « {TYPE_DEMANDE_LABELS[type]} ».
            </Text>
            <View style={styles.refBox}>
              <Text style={styles.refLabel}>Votre référence de suivi</Text>
              <Text style={styles.refValue}>{reference}</Text>
            </View>
            <Text style={[styles.mutedSm, { textAlign: 'center', marginTop: 16 }]}>
              Un membre de la paroisse vous recontactera au contact indiqué.
            </Text>
          </View>
        </View>
      </Screen>
    )
  }

  return (
    <Screen scroll={false}>
      <BackHeader title="Démarches pastorales" subtitle="Baptême, mariage, obsèques…" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 }} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Type de demande</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
          {TYPES.map(([key, label]) => {
            const active = type === key
            return (
              <Pressable key={key} onPress={() => setType(key)} style={[styles.chip, active && styles.chipActive]}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <Text style={[styles.label, { marginTop: 18 }]}>Votre nom</Text>
        <TextInput value={nom} onChangeText={setNom} placeholder="Nom et prénom" placeholderTextColor={colors.mutedForeground} style={styles.input} />

        <Text style={[styles.label, { marginTop: 14 }]}>Contact (téléphone ou email)</Text>
        <TextInput value={contact} onChangeText={setContact} placeholder="+242 06 000 00 00" placeholderTextColor={colors.mutedForeground} style={styles.input} />

        <Text style={[styles.label, { marginTop: 14 }]}>Votre message</Text>
        <TextInput
          value={message} onChangeText={setMessage} placeholder="Décrivez votre demande…" placeholderTextColor={colors.mutedForeground}
          multiline numberOfLines={5} style={styles.textarea}
        />

        {!!error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable onPress={submit} disabled={submitting || !valide} style={[styles.submitBtn, (submitting || !valide) && { opacity: 0.5 }]}>
          {submitting ? <ActivityIndicator color={colors.primaryForeground} /> : (
            <>
              <Icon name="paper-plane-tilt-fill" size={15} color={colors.primaryForeground} />
              <Text style={styles.submitText}>Envoyer ma demande</Text>
            </>
          )}
        </Pressable>
        <Text style={[styles.mutedSm, { textAlign: 'center', marginTop: 12 }]}>
          Vos informations sont utilisées uniquement pour traiter votre demande pastorale.
        </Text>
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, lineHeight: 17 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.mutedForeground, marginBottom: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.mutedForeground },
  chipTextActive: { color: colors.primaryForeground, fontFamily: fonts.sansSemiBold },
  input: { fontFamily: fonts.sans, fontSize: 14, color: colors.foreground, backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12 },
  textarea: { fontFamily: fonts.sans, fontSize: 14, color: colors.foreground, minHeight: 110, textAlignVertical: 'top', backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12 },
  errorText: { fontFamily: fonts.sans, fontSize: 12, color: colors.destructive, marginTop: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14, marginTop: 20 },
  submitText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primaryForeground },
  confirmCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 24, alignItems: 'center', width: '100%' },
  confirmTitle: { fontFamily: fonts.heading, fontSize: 19, color: colors.primary },
  refBox: { backgroundColor: 'rgba(56,142,60,0.08)', borderWidth: 1, borderColor: 'rgba(56,142,60,0.3)', borderRadius: radius.md, padding: 14, alignItems: 'center', width: '100%' },
  refLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.mutedForeground, marginBottom: 4 },
  refValue: { fontFamily: fonts.heading, fontSize: 18, color: '#388E3C' },
})
