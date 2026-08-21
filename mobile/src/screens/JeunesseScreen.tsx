import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getCours, type Cours } from '../services/catechisme'
import { getGroupes, type Groupe } from '../services/groupes'

const NIVEAU_JEUNESSE = 3 // Confirmation — deja utilise comme "Ados"

function contactHref(contact: string) {
  return contact.includes('@') ? `mailto:${contact}` : `tel:${contact.replace(/\s/g, '')}`
}

export function JeunesseScreen() {
  const navigation = useNavigation<any>()
  const [cours, setCours] = useState<Cours[]>([])
  const [groupes, setGroupes] = useState<Groupe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getCours(), getGroupes()])
      .then(([c, g]) => {
        setCours(c.filter(x => x.niveau === NIVEAU_JEUNESSE))
        setGroupes(g.filter(x => x.categorie === 'jeunesse'))
      })
      .catch(() => { setCours([]); setGroupes([]) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <Screen>
      <BackHeader title="Espace Jeunesse" subtitle="Maison numérique des jeunes" />
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <View style={styles.verse}>
          <Text style={styles.verseText}>« Une jeunesse capable de vivre sa foi et de servir la société. »</Text>
        </View>

        <Text style={[styles.h3, { marginTop: 22, marginBottom: 12 }]}>Formations</Text>
        {loading ? (
          <SkeletonList count={2} />
        ) : cours.length === 0 ? (
          <Text style={styles.mutedSm}>Aucun parcours dédié aux adolescents pour le moment.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {cours.map((c) => (
              <View key={c.id} style={styles.card}>
                <Text style={{ fontSize: 26 }}>{c.emoji}</Text>
                <Text style={styles.cardTitre}>{c.titre}</Text>
                <Text style={styles.mutedSm}>{c.tranche} · {c.totalModules} modules</Text>
                <Text style={[styles.mutedSm, { marginTop: 4, lineHeight: 17 }]}>{c.description}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.h3, { marginTop: 26, marginBottom: 12 }]}>Groupes & mouvements</Text>
        {loading ? null : groupes.length === 0 ? (
          <Text style={styles.mutedSm}>Les groupes jeunesse seront bientôt annoncés ici.</Text>
        ) : (
          <View style={{ gap: 12 }}>
            {groupes.map((g) => (
              <View key={g.id} style={styles.card}>
                <Text style={{ fontSize: 26 }}>{g.icon}</Text>
                <Text style={styles.cardTitre}>{g.titre}</Text>
                <Text style={[styles.mutedSm, { marginTop: 4, lineHeight: 17 }]}>{g.description}</Text>
                {g.horaire && <Text style={[styles.mutedSm, { marginTop: 6, color: colors.accent, fontFamily: fonts.sansSemiBold }]}>{g.horaire}</Text>}
                {g.contact && (
                  <Pressable onPress={() => Linking.openURL(contactHref(g.contact!))} style={styles.contactBtn}>
                    <Icon name="phone" size={13} color={colors.primary} />
                    <Text style={styles.contactText}>Contacter le responsable</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}

        <Pressable onPress={() => navigation.navigate('Participer')} style={styles.ctaCard}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitre, { color: colors.primaryForeground }]}>Retraites, veillées, événements</Text>
            <Text style={[styles.mutedSm, { color: 'rgba(255,255,255,0.75)', marginTop: 2 }]}>Voir tous les événements de la paroisse</Text>
          </View>
          <Icon name="arrow-right" size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  h3: { fontFamily: fonts.heading, fontSize: 17, color: colors.primary },
  verse: { backgroundColor: colors.secondary, borderRadius: radius.lg, padding: 18 },
  verseText: { fontFamily: fonts.heading, fontSize: 15, color: colors.primary, fontStyle: 'italic', lineHeight: 21 },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  cardTitre: { fontFamily: fonts.heading, fontSize: 15, color: colors.foreground, marginTop: 6 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  contactText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.primary, textDecorationLine: 'underline' },
  ctaCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 18, marginTop: 26, marginBottom: 30 },
})
