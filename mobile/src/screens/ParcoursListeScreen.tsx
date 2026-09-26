import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import { Screen } from '../components/Screen'
import { BackHeader, PrimaryButton } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getParcoursPublies, TYPE_PARCOURS, type Parcours, type TypeParcours } from '../services/parcours'

export function ParcoursListeScreen() {
  const navigation = useNavigation<any>()
  const route = useRoute<any>()
  const types: TypeParcours[] = route.params?.types ?? ['decouvrir']
  const principal = TYPE_PARCOURS[types[0]]
  const [parcours, setParcours] = useState<Parcours[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getParcoursPublies(types).then(setParcours).catch(() => setParcours([])).finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types.join(',')])

  return (
    <Screen>
      <BackHeader title={principal.titre} subtitle={principal.accroche} />
      <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 12 }}>
        {loading ? <SkeletonList count={3} /> : parcours.length === 0 ? (
          <Text style={[styles.muted, { textAlign: 'center', paddingVertical: 30 }]}>Les parcours seront disponibles prochainement.</Text>
        ) : parcours.map(p => (
          <Pressable key={p.id} onPress={() => navigation.navigate('ParcoursEtape', { parcours: p })} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}>
            <View style={styles.iconTile}><Text style={{ fontSize: 24 }}>{p.emoji}</Text></View>
            <View style={{ flex: 1 }}>
              {p.duree && <Text style={styles.eyebrow}>{p.duree.toUpperCase()}</Text>}
              <Text style={styles.titre}>{p.titre}</Text>
              <Text style={[styles.muted, { marginTop: 4, lineHeight: 17 }]}>{p.description}</Text>
            </View>
            <Icon name="caret-right" size={16} color={colors.mutedForeground} />
          </Pressable>
        ))}

        {types.includes('conversion') && (
          <View style={[styles.card, { flexDirection: 'column', alignItems: 'stretch', gap: 10, marginTop: 8 }]}>
            <Text style={styles.titre}>Prêt à faire le premier pas ?</Text>
            <Text style={styles.muted}>L'équipe de votre paroisse vous recontactera pour une première rencontre.</Text>
            <PrimaryButton label="Demander le baptême" icon="arrow-right" onPress={() => navigation.navigate('Prier', { screen: 'Demarches' })} />
          </View>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  muted: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  eyebrow: { fontFamily: fonts.sansBold, fontSize: 9, letterSpacing: 1, color: colors.accent, marginBottom: 2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  iconTile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  titre: { fontFamily: fonts.heading, fontSize: 16, color: colors.foreground },
})
