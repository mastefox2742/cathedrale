import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import { Screen } from '../components/Screen'
import { BackHeader, PrimaryButton } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { supabase } from '../services/supabase'
import { getMesRoles, getAlertes, marquerLue, ROLE_LABELS, type MesRoles, type Alerte } from '../services/staff'

/**
 * Espace staff : rôles de la personne et alertes à traiter (démarches,
 * intentions, adhésions, dons, signalements…). La base ne renvoie que les
 * alertes que la personne a le droit de voir. La gestion complète se fait
 * dans l'administration du site.
 */
export function EspaceStaffScreen() {
  const [session, setSession] = useState<Session | null>(null)
  const [roles, setRoles] = useState<MesRoles | null>(null)
  const [alertes, setAlertes] = useState<Alerte[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (!data.session) { setLoading(false); return }
      const r = await getMesRoles(data.session.user.id).catch(() => null)
      setRoles(r)
      if (r?.estStaff) setAlertes(await getAlertes(data.session.user.id).catch(() => []))
      setLoading(false)
    })
  }, [])

  function ouvrir(a: Alerte) {
    if (session) marquerLue(session.user.id, a.id).catch(() => {})
    setAlertes(l => l.map(x => x.id === a.id ? { ...x, lue: true } : x))
    Linking.openURL(`${process.env.EXPO_PUBLIC_SITE_URL}${a.lien}`)
  }

  const nonLues = alertes.filter(a => !a.lue).length

  return (
    <Screen>
      <BackHeader title="Espace staff" subtitle="Rôles et alertes à traiter" />
      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
        {loading ? <SkeletonList count={3} /> : !roles?.estStaff ? (
          <Text style={styles.muted}>Cet espace est réservé aux personnes ayant un rôle dans l&apos;archidiocèse ou une paroisse.</Text>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.h3}>Mes rôles</Text>
              {roles.global && <Text style={styles.corps}>• {ROLE_LABELS[roles.global] ?? roles.global} (archidiocèse)</Text>}
              {roles.paroisses.map((p, i) => <Text key={i} style={styles.corps}>• {ROLE_LABELS[p.role] ?? p.role} — {p.paroisse}</Text>)}
            </View>

            <Text style={styles.h3}>Alertes {nonLues > 0 ? `(${nonLues} non lue${nonLues > 1 ? 's' : ''})` : ''}</Text>
            {alertes.length === 0 ? <Text style={styles.muted}>Aucune alerte.</Text> : alertes.map(a => (
              <Pressable key={a.id} onPress={() => ouvrir(a)} style={[styles.alerte, !a.lue && { borderColor: colors.accent }]}>
                <Icon name={a.type === 'signalement' ? 'shield-check-fill' : 'bell-ringing'} size={18} color={a.type === 'signalement' ? colors.destructive : colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.corps, !a.lue && { fontFamily: fonts.sansBold }]}>{a.titre}</Text>
                  <Text style={styles.muted}>{new Date(a.createdAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Icon name="arrow-up-right" size={14} color={colors.mutedForeground} />
              </Pressable>
            ))}

            <PrimaryButton label="Ouvrir l'administration" icon="arrow-up-right" onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_SITE_URL}/admin`)} />
          </>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  h3: { fontFamily: fonts.heading, fontSize: 16, color: colors.primary, marginBottom: 4 },
  corps: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, color: colors.foreground },
  muted: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16, gap: 4 },
  alerte: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12 },
})
