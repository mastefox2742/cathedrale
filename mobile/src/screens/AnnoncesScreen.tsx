import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native'
import { Screen } from '../components/Screen'
import { Chip } from '../components/ui'
import { Icon } from '../components/Icon'
import { SkeletonList } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getAnnonces, type Annonce, type TagType } from '../services/annonces'

const FILTERS: ('Toutes' | TagType)[] = ['Toutes', 'Liturgie', 'Formation', 'Prière', 'Événement']

const TAG_STYLE: Record<TagType, { color: string; bg: string }> = {
  Liturgie: { color: colors.primary, bg: colors.secondary },
  Formation: { color: colors.chart3, bg: 'rgba(46,125,91,0.12)' },
  Prière: { color: colors.accent, bg: 'rgba(200,155,60,0.15)' },
  Événement: { color: colors.foreground, bg: 'rgba(103,112,133,0.12)' },
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

export function AnnoncesScreen() {
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'Toutes' | TagType>('Toutes')
  const [search, setSearch] = useState('')

  useEffect(() => {
    getAnnonces().then(setAnnonces).catch(() => setAnnonces([])).finally(() => setLoading(false))
  }, [])

  const visible = annonces.filter((a) => {
    if (search && !a.titre.toLowerCase().includes(search.toLowerCase())) return false
    if (filter === 'Toutes') return true
    return a.tag === filter
  })

  return (
    <Screen scroll={false}>
      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <Text style={styles.title}>Annonces paroissiales</Text>
        <View style={styles.searchBox}>
          <Icon name="magnifying-glass" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher une annonce..."
            placeholderTextColor={colors.mutedForeground}
            style={styles.searchInput}
          />
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 14, alignItems: 'flex-start' }}>
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {loading ? (
          <SkeletonList count={4} />
        ) : (
          <>
            {visible.map((a) => {
              const tagStyle = TAG_STYLE[a.tag]
              return (
                <View key={a.id} style={[styles.card, a.epingle && styles.cardEpingle]}>
                  <View style={styles.rowBetween}>
                    <View style={[styles.badge, { backgroundColor: tagStyle.bg }]}>
                      <Text style={[styles.badgeText, { color: tagStyle.color }]}>{a.tag}</Text>
                    </View>
                    <Text style={styles.mutedSm}>{formatDate(a.date)}</Text>
                  </View>
                  <Text style={styles.cardTitre}>{a.titre}</Text>
                  <Text style={[styles.mutedSm, { marginTop: 4, lineHeight: 17 }]}>{a.desc}</Text>
                </View>
              )
            })}
            {visible.length === 0 && <Text style={[styles.mutedSm, { textAlign: 'center', paddingVertical: 20 }]}>Aucune annonce ne correspond à ce filtre.</Text>}
          </>
        )}
      </ScrollView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontFamily: fonts.heading, fontSize: 22, color: colors.primary },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 12, height: 42, marginTop: 14 },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.foreground },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14, borderLeftWidth: 4, borderLeftColor: 'transparent' },
  cardEpingle: { borderLeftColor: colors.accent },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 10, textTransform: 'uppercase' },
  cardTitre: { fontFamily: fonts.heading, fontSize: 15, color: colors.foreground, marginTop: 8 },
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
})
