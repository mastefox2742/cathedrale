import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getGroupes, type Groupe } from '../services/groupes'

function contactHref(contact: string) {
  return contact.includes('@') ? `mailto:${contact}` : `tel:${contact.replace(/\s/g, '')}`
}

export function GroupesScreen() {
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getGroupes().then(setGroupes).catch(() => setGroupes([])).finally(() => setLoading(false))
  }, [])

  return (
    <Screen>
      <BackHeader title="Groupes & Mouvements" subtitle="Vivre la foi en communauté" />
      <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 12, paddingBottom: 30 }}>
        {loading ? (
          <SkeletonList count={4} />
        ) : groupes.length === 0 ? (
          <Text style={[styles.mutedSm, { textAlign: 'center', paddingVertical: 30 }]}>Les groupes seront bientôt annoncés ici.</Text>
        ) : (
          groupes.map((g) => (
            <View key={g.id} style={styles.card}>
              <View style={styles.iconTile}><Text style={{ fontSize: 22 }}>{g.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.titre}>{g.titre}</Text>
                <Text style={[styles.mutedSm, { marginTop: 4, lineHeight: 17 }]}>{g.description}</Text>
                {g.responsable && <Text style={[styles.mutedSm, { marginTop: 8 }]}>Responsable : {g.responsable}</Text>}
                {g.horaire && (
                  <View style={styles.metaRow}>
                    <Icon name="clock" size={12} color={colors.accent} />
                    <Text style={styles.metaText}>{g.horaire}</Text>
                  </View>
                )}
                {g.contact && (
                  <Pressable onPress={() => Linking.openURL(contactHref(g.contact!))} style={styles.contactBtn}>
                    <Icon name="phone" size={13} color={colors.primary} />
                    <Text style={styles.contactText}>Contacter le responsable</Text>
                  </Pressable>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  card: { flexDirection: 'row', gap: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  iconTile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  titre: { fontFamily: fonts.heading, fontSize: 15, color: colors.foreground },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  metaText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.accent },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  contactText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.primary, textDecorationLine: 'underline' },
})
