import { useCallback, useEffect, useState } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, Switch, ActivityIndicator, Alert } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { useNavigation } from '@react-navigation/native'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { supabase } from '../services/supabase'
import { getIntentionsPubliques, deposerIntention, type PrayerIntention } from '../services/prieres'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function IntentionsScreen() {
  const navigation = useNavigation<any>()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [contenu, setContenu] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [estAnonyme, setEstAnonyme] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [intentions, setIntentions] = useState<PrayerIntention[]>([])
  const [loading, setLoading] = useState(true)

  const loadIntentions = useCallback(() => {
    setLoading(true)
    getIntentionsPubliques().then(setIntentions).catch(() => setIntentions([])).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    loadIntentions()
  }, [loadIntentions])

  async function submit() {
    if (!session) return
    if (contenu.trim().length < 3) {
      Alert.alert('Message trop court', 'Écris quelques mots pour ton intention.')
      return
    }
    setSubmitting(true)
    try {
      await deposerIntention(session.user.id, contenu.trim(), isPublic, estAnonyme)
      setContenu('')
      loadIntentions()
      Alert.alert('Merci', 'Ton intention a été confiée à la prière de la communauté.')
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <BackHeader title="Intentions de prière" subtitle="Confiez ce qui vous tient à cœur" />

      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        {session === undefined ? (
          <ActivityIndicator color={colors.primary} />
        ) : session ? (
          <View style={styles.formCard}>
            <TextInput
              value={contenu}
              onChangeText={setContenu}
              placeholder="Écris ton intention de prière..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              maxLength={500}
              style={styles.textarea}
            />
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: colors.primary }} />
                <Text style={styles.mutedSm}>{isPublic ? 'Visible sur le mur communautaire' : 'Visible par moi seul'}</Text>
              </View>
            </View>
            <View style={[styles.rowBetween, { marginTop: 8 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Switch value={estAnonyme} onValueChange={setEstAnonyme} trackColor={{ true: colors.primary }} />
                <Text style={styles.mutedSm}>Rester anonyme, même pour l'équipe pastorale</Text>
              </View>
            </View>
            <Pressable onPress={submit} disabled={submitting} style={[styles.submitBtn, submitting && { opacity: 0.7 }]}>
              {submitting ? <ActivityIndicator color={colors.primaryForeground} /> : (
                <>
                  <Icon name="paper-plane-tilt-fill" size={15} color={colors.primaryForeground} />
                  <Text style={styles.submitText}>Confier cette intention</Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.loginPrompt}>
            <Icon name="lock" size={20} color={colors.mutedForeground} />
            <Text style={[styles.mutedSm, { flex: 1 }]}>Connecte-toi pour déposer une intention de prière.</Text>
            <Pressable onPress={() => navigation.navigate('Profil')} style={styles.loginBtn}>
              <Text style={styles.loginBtnText}>Se connecter</Text>
            </Pressable>
          </View>
        )}

        <Text style={[styles.h3, { marginTop: 26, marginBottom: 12 }]}>Prières de la communauté</Text>
        {loading ? (
          <SkeletonList count={3} />
        ) : intentions.length === 0 ? (
          <Text style={[styles.mutedSm, { textAlign: 'center', paddingVertical: 20 }]}>Aucune intention partagée pour le moment.</Text>
        ) : (
          <View style={{ gap: 10, paddingBottom: 30 }}>
            {intentions.map((it) => (
              <View key={it.id} style={styles.intentionCard}>
                <Text style={styles.intentionText}>{it.contenu}</Text>
                <Text style={styles.intentionDate}>{formatDate(it.created_at)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, lineHeight: 17 },
  h3: { fontFamily: fonts.heading, fontSize: 16, color: colors.primary },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  formCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  textarea: { fontFamily: fonts.sans, fontSize: 13, color: colors.foreground, minHeight: 90, textAlignVertical: 'top', backgroundColor: colors.secondary, borderRadius: radius.md, padding: 12 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 13, marginTop: 14 },
  submitText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primaryForeground },
  loginPrompt: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  loginBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: 12, paddingVertical: 8 },
  loginBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.primaryForeground },
  intentionCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
  intentionText: { fontFamily: fonts.sans, fontSize: 13, color: colors.foreground, lineHeight: 19, fontStyle: 'italic' },
  intentionDate: { fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.mutedForeground, marginTop: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
})
