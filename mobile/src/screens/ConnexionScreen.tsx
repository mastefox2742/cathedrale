import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { Session } from '@supabase/supabase-js'
import { Screen } from '../components/Screen'
import { Icon } from '../components/Icon'
import { colors, fonts, radius } from '../theme/colors'
import { supabase } from '../services/supabase'
import { getMesFormations, type FormationProgress } from '../services/formations'
import { getCours, getModules, type Cours, type Module } from '../services/catechisme'
import { getModulesTermines } from '../services/moduleProgress'

type Mode = 'login' | 'register'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function formatMemberSince(iso: string | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function ConnexionScreen() {
  const navigation = useNavigation<any>()
  const [session, setSession] = useState<Session | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 }}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </Screen>
    )
  }

  return session ? <ProfilView session={session} /> : <ConnexionForm />
}

function ProfilView({ session }: { session: Session }) {
  const navigation = useNavigation<any>()
  const [signingOut, setSigningOut] = useState(false)
  const [mesFormations, setMesFormations] = useState<FormationProgress[]>([])
  const [coursMap, setCoursMap] = useState<Record<string, Cours>>({})
  const [loadingFormations, setLoadingFormations] = useState(true)
  const [prochaineLecon, setProchaineLecon] = useState<{ cours: Cours; module: Module } | null>(null)
  const email = session.user.email ?? ''
  const memberSince = formatMemberSince(session.user.created_at)
  const initial = email.charAt(0).toUpperCase() || '?'

  useEffect(() => {
    Promise.all([getMesFormations(session.user.id), getCours()])
      .then(([progress, cours]) => {
        setMesFormations(progress)
        setCoursMap(Object.fromEntries(cours.filter((c) => c.id).map((c) => [c.id as string, c])))
      })
      .catch(() => {})
      .finally(() => setLoadingFormations(false))
  }, [session.user.id])

  useEffect(() => {
    const enCours = mesFormations.find((f) => f.statut === 'en_cours')
    const cours = enCours ? coursMap[enCours.cours_id] : undefined
    if (!enCours || !cours?.id) { setProchaineLecon(null); return }
    Promise.all([getModules(cours.id), getModulesTermines(session.user.id, cours.id)])
      .then(([modules, termines]) => {
        const suivant = modules.find((m) => m.id && !termines.has(m.id))
        setProchaineLecon(suivant ? { cours, module: suivant } : null)
      })
      .catch(() => setProchaineLecon(null))
  }, [mesFormations, coursMap, session.user.id])

  async function handleSignOut() {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    setSigningOut(false)
    if (error) Alert.alert('Erreur', error.message)
  }

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={styles.mutedSm}>Espace Membre</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Bonjour</Text>
            <Text style={[styles.mutedSm, { marginTop: 2 }]} numberOfLines={1}>{email}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Icon name="envelope" size={16} color={colors.primary} />
            <View>
              <Text style={styles.infoLabel}>Adresse email</Text>
              <Text style={styles.infoValue}>{email}</Text>
            </View>
          </View>
          {memberSince && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Icon name="calendar-blank" size={16} color={colors.primary} />
                <View>
                  <Text style={styles.infoLabel}>Membre depuis</Text>
                  <Text style={styles.infoValue}>{memberSince}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <Text style={[styles.mutedSm, { marginTop: 22, marginBottom: 10 }]}>Mes formations</Text>
        {loadingFormations ? (
          <ActivityIndicator color={colors.primary} />
        ) : mesFormations.length === 0 ? (
          <View style={styles.emptyFormations}>
            <Icon name="book-open" size={20} color={colors.mutedForeground} />
            <Text style={[styles.mutedSm, { flex: 1 }]}>Aucune formation commencée pour l'instant.</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {mesFormations.map((f) => {
              const c = coursMap[f.cours_id]
              return (
                <View key={f.id} style={styles.formationRow}>
                  <Text style={{ fontSize: 18 }}>{c?.emoji ?? '📘'}</Text>
                  <Text style={[styles.quickRowText, { flex: 1 }]} numberOfLines={1}>{c?.titre ?? 'Formation'}</Text>
                  {f.statut === 'termine' ? (
                    <>
                      <View style={[styles.statutPill, { backgroundColor: 'rgba(46,125,91,0.1)' }]}>
                        <Icon name="check-circle" size={12} color={colors.chart3} />
                        <Text style={[styles.statutPillText, { color: colors.chart3 }]}>Terminé</Text>
                      </View>
                      <Pressable onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_SITE_URL}/attestation/${f.cours_id}`)}>
                        <Text style={styles.attestationLink}>Attestation</Text>
                      </Pressable>
                    </>
                  ) : (
                    <View style={[styles.statutPill, { backgroundColor: 'rgba(200,155,60,0.1)' }]}>
                      <Icon name="clock" size={12} color={colors.accent} />
                      <Text style={[styles.statutPillText, { color: colors.accent }]}>En cours</Text>
                    </View>
                  )}
                </View>
              )
            })}
          </View>
        )}

        {prochaineLecon && (
          <Pressable onPress={() => navigation.navigate('Se former')} style={styles.prochaineLeconCard}>
            <Text style={{ fontSize: 24 }}>{prochaineLecon.module.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.prochaineLeconLabel}>Prochaine leçon · {prochaineLecon.cours.titre}</Text>
              <Text style={styles.prochaineLeconTitre} numberOfLines={1}>{prochaineLecon.module.titre}</Text>
            </View>
            <Icon name="caret-right" size={16} color={colors.primaryForeground} />
          </Pressable>
        )}

        <Text style={[styles.mutedSm, { marginTop: 22, marginBottom: 10 }]}>Accès rapide</Text>
        <View style={{ gap: 10 }}>
          <Pressable onPress={() => navigation.navigate('Prier', { screen: 'Horaires' })} style={styles.quickRow}>
            <Icon name="clock" size={18} color={colors.primary} />
            <Text style={styles.quickRowText}>Horaires des messes</Text>
            <Icon name="caret-right" size={16} color={colors.mutedForeground} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Se former')} style={styles.quickRow}>
            <Icon name="book-open" size={18} color={colors.primary} />
            <Text style={styles.quickRowText}>Mes formations</Text>
            <Icon name="caret-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <Pressable onPress={handleSignOut} disabled={signingOut} style={[styles.signOutBtn, signingOut && { opacity: 0.7 }]}>
          {signingOut ? (
            <ActivityIndicator color={colors.destructive} />
          ) : (
            <>
              <Icon name="arrow-left" size={16} color={colors.destructive} />
              <Text style={styles.signOutText}>Se déconnecter</Text>
            </>
          )}
        </Pressable>
      </View>
    </Screen>
  )
}

function ConnexionForm() {
  const navigation = useNavigation<any>()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (!EMAIL_RE.test(email)) {
      Alert.alert('Adresse invalide', 'Merci de saisir une adresse email valide.')
      return
    }
    setSubmitting(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (!data.session) {
          Alert.alert('Compte créé !', 'Vérifiez votre boîte mail pour confirmer votre adresse avant de vous connecter.')
          setMode('login')
        }
      }
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <View style={styles.topRow}>
          <View style={styles.closeBtn}><Icon name="x" size={18} color={colors.primary} /></View>
          <Text style={styles.mutedSm}>Espace Membre</Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <View style={styles.shieldTile}><Icon name="shield-check" size={22} color={colors.accent} /></View>
          <Text style={styles.title}>Connexion à votre espace paroissial</Text>
          <Text style={[styles.mutedSm, { marginTop: 6, lineHeight: 17 }]}>
            Connectez-vous pour suivre votre parcours, rejoindre un groupe de prière ou suivre le catéchisme de vos enfants.
          </Text>
        </View>

        <View style={styles.tabs}>
          <Pressable onPress={() => setMode('login')} style={[styles.tab, mode === 'login' && styles.tabActive]}>
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Se connecter</Text>
          </Pressable>
          <Pressable onPress={() => setMode('register')} style={[styles.tab, mode === 'register' && styles.tabActive]}>
            <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Créer un compte</Text>
          </Pressable>
        </View>

        <View style={{ marginTop: 18, gap: 14 }}>
          <View>
            <Text style={styles.label}>Adresse email</Text>
            <View style={styles.inputRow}>
              <Icon name="envelope" size={15} color={colors.mutedForeground} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="ex: prenom.nom@email.com"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
            </View>
          </View>
          <View>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.inputRow}>
              <Icon name="lock-key" size={15} color={colors.mutedForeground} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                style={styles.input}
              />
              <Pressable onPress={() => setShowPassword((v) => !v)}>
                <Icon name={showPassword ? 'eye' : 'eye-slash'} size={15} color={colors.mutedForeground} />
              </Pressable>
            </View>
          </View>

          <Pressable onPress={submit} disabled={submitting} style={[styles.submitBtn, submitting && { opacity: 0.7 }]}>
            {submitting ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={styles.submitText}>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</Text>
            )}
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingBottom: 24, alignItems: 'center' }}>
        <View style={styles.lockRow}>
          <Icon name="lock" size={13} color={colors.chart3} />
          <Text style={styles.lockText}>Vos données sont strictement réservées aux activités pastorales.</Text>
        </View>
        <Pressable onPress={() => navigation.navigate('Prier', { screen: 'Horaires' })} style={{ marginTop: 6 }}>
          <Text style={styles.linkUnderline}>Consulter les horaires publics sans compte</Text>
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  closeBtn: { width: 38, height: 38, borderRadius: radius.full, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  shieldTile: { width: 46, height: 46, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  title: { fontFamily: fonts.heading, fontSize: 21, color: colors.primary },
  tabs: { flexDirection: 'row', backgroundColor: colors.muted, borderRadius: radius.md, padding: 4, marginTop: 20 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: radius.sm },
  tabActive: { backgroundColor: colors.card },
  tabText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.mutedForeground },
  tabTextActive: { color: colors.foreground },
  label: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.foreground, marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, height: 46 },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.foreground },
  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center', marginTop: 6 },
  submitText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primaryForeground },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockText: { fontFamily: fonts.sans, fontSize: 10, color: colors.mutedForeground, textAlign: 'center' },
  linkUnderline: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.primary, textDecorationLine: 'underline' },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 16 },
  avatar: { width: 56, height: 56, borderRadius: radius.full, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.heading, fontSize: 22, color: colors.primaryForeground },
  infoCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, marginTop: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.mutedForeground },
  infoValue: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.foreground, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  quickRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 14 },
  quickRowText: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.foreground },
  signOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: colors.destructive, borderRadius: radius.md, paddingVertical: 14, marginTop: 26, marginBottom: 10 },
  signOutText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.destructive },
  emptyFormations: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14 },
  formationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12 },
  prochaineLeconCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primary, borderRadius: radius.md, padding: 14, marginTop: 22 },
  prochaineLeconLabel: { fontFamily: fonts.sansSemiBold, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.65)' },
  prochaineLeconTitre: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.primaryForeground, marginTop: 2 },
  statutPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.full },
  statutPillText: { fontFamily: fonts.sansSemiBold, fontSize: 10 },
  attestationLink: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.primary, textDecorationLine: 'underline' },
})
