import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Linking, TextInput } from 'react-native'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getParoisses, getParoisseCourante, setParoisseCourante, type Paroisse } from '../services/paroisses'

export function ParoissesScreen() {
  const [paroisses, setParoisses] = useState<Paroisse[]>([])
  const [loading, setLoading] = useState(true)
  const [recherche, setRecherche] = useState('')
  const [courante, setCourante] = useState(getParoisseCourante())
  const [ouverte, setOuverte] = useState<string | null>(null)

  useEffect(() => {
    getParoisses().then(setParoisses).catch(() => setParoisses([])).finally(() => setLoading(false))
  }, [])

  async function choisir(id: string) {
    await setParoisseCourante(id)
    setCourante(id)
  }

  const q = recherche.trim().toLowerCase()
  const liste = paroisses.filter(p => !q || `${p.nom} ${p.quartier ?? ''} ${p.cure ?? ''}`.toLowerCase().includes(q))

  return (
    <Screen>
      <BackHeader title="Paroisses" subtitle="Annuaire de l'archidiocèse de Brazzaville" />
      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 12 }}>
        <View style={styles.search}>
          <Icon name="magnifying-glass" size={16} color={colors.mutedForeground} />
          <TextInput value={recherche} onChangeText={setRecherche} placeholder="Nom, quartier, curé…" placeholderTextColor={colors.mutedForeground} style={styles.input} />
        </View>

        {loading ? <SkeletonList count={4} /> : liste.length === 0 ? (
          <Text style={[styles.muted, { textAlign: 'center', paddingVertical: 30 }]}>Aucune paroisse trouvée.</Text>
        ) : liste.map(p => {
          const estCourante = p.id === courante
          const dimanche = p.horaires.messes?.find(m => /dimanche/i.test(m.jour))
          return (
            <View key={p.id} style={[styles.card, estCourante && { borderColor: colors.accent }]}>
              <Pressable onPress={() => setOuverte(ouverte === p.id ? null : p.id)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.iconTile}><Icon name="church" size={20} color={colors.primaryForeground} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.titre}>{p.nom}</Text>
                  {p.quartier && <Text style={styles.muted}>{p.quartier}</Text>}
                  {dimanche && <Text style={styles.meta}>Dimanche : {dimanche.horaires.join(' · ')}</Text>}
                </View>
                <Icon name="caret-right" size={16} color={colors.mutedForeground} />
              </Pressable>

              {ouverte === p.id && (
                <View style={{ marginTop: 12, gap: 8 }}>
                  {p.description && <Text style={styles.corps}>{p.description}</Text>}
                  {p.cure && <Text style={styles.corps}>Curé : {p.cure}</Text>}
                  {(p.horaires.messes ?? []).map(m => (
                    <View key={m.jour} style={styles.row}><Text style={styles.muted}>{m.jour}</Text><Text style={styles.meta}>{m.horaires.join(' · ')}</Text></View>
                  ))}
                  {p.adresse && <Text style={styles.corps}>📍 {p.adresse}</Text>}
                  {p.telephone && (
                    <Pressable onPress={() => Linking.openURL(`tel:${p.telephone!.replace(/\s/g, '')}`)} style={styles.lien}>
                      <Icon name="phone" size={14} color={colors.primary} /><Text style={styles.lienTxt}>{p.telephone}</Text>
                    </Pressable>
                  )}
                  {p.latitude != null && p.longitude != null && (
                    <Pressable onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${p.latitude}&mlon=${p.longitude}#map=17/${p.latitude}/${p.longitude}`)} style={styles.lien}>
                      <Icon name="map-pin" size={14} color={colors.primary} /><Text style={styles.lienTxt}>Voir le plan</Text>
                    </Pressable>
                  )}
                </View>
              )}

              {estCourante ? (
                <Text style={[styles.meta, { marginTop: 10 }]}>✓ Ma paroisse</Text>
              ) : (
                <Pressable onPress={() => choisir(p.id)} style={styles.choisir}><Text style={styles.choisirTxt}>Choisir cette paroisse</Text></Pressable>
              )}
            </View>
          )
        })}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12 },
  input: { flex: 1, paddingVertical: 10, fontFamily: fonts.sans, fontSize: 14, color: colors.foreground },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  iconTile: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  titre: { fontFamily: fonts.heading, fontSize: 15, color: colors.foreground },
  muted: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  meta: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.accent, marginTop: 2 },
  corps: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.foreground },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  lien: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lienTxt: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.primary, textDecorationLine: 'underline' },
  choisir: { marginTop: 12, alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full, backgroundColor: colors.primary },
  choisirTxt: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.primaryForeground },
})
