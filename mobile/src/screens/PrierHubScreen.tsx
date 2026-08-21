import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Screen } from '../components/Screen'
import { Icon, type IconName } from '../components/Icon'
import { colors, fonts, radius } from '../theme/colors'

interface Rubrique {
  icon: IconName
  titre: string
  badge: string
  badgeBg: string
  badgeColor: string
  texte: string
  meta: string
  cta: string
  primary?: boolean
  screen: string
}

const RUBRIQUES: Rubrique[] = [
  { icon: 'book-bookmark-fill', titre: 'Liturgie du Jour', badge: "Aujourd'hui", badgeBg: 'rgba(200,155,60,0.1)', badgeColor: colors.accent, texte: 'Lectures complètes de la messe, psaume responsorial, évangile et méditation.', meta: 'Textes officiels AELF', cta: 'Ouvrir', primary: true, screen: 'Liturgie' },
  { icon: 'clock-clockwise-fill', titre: 'Liturgie des Heures', badge: 'Offices', badgeBg: colors.secondary, badgeColor: colors.mutedForeground, texte: "Priez la prière de l'Église : Laudes, Milieu du jour, Vêpres et Complies.", meta: 'Laudes · Vêpres · Complies', cta: "Prier l'Office", screen: 'Liturgie' },
  { icon: 'headphones-fill', titre: 'Médiathèque & Homélies', badge: 'Audio', badgeBg: 'rgba(18,59,93,0.1)', badgeColor: colors.primary, texte: 'Réécoutez les homélies dominicales et enseignements des prêtres.', meta: 'Dernière : Dimanche 9 juin', cta: 'Écouter', screen: 'Homelies' },
  { icon: 'church-fill', titre: 'Messes & Confessions', badge: 'Horaires', badgeBg: 'rgba(46,125,91,0.1)', badgeColor: colors.chart3, texte: 'Messes du dimanche (07h, 09h, 11h, 18h) et permanences de confessions.', meta: 'Prochaine : Dim. 09:00', cta: 'Voir horaires', screen: 'Horaires' },
]

const PRIERES: { icon: IconName; titre: string; sous: string }[] = [
  { icon: 'shield-check-fill', titre: 'Prière à Saint Michel', sous: 'Archange protecteur' },
  { icon: 'sparkle-fill', titre: 'Le Saint Rosaire', sous: 'Mystères douloureux (Ven)' },
  { icon: 'sun-horizon-fill', titre: "L'Angélus", sous: 'À 6h, 12h et 18h' },
  { icon: 'cross-fill', titre: 'Chemin de Croix', sous: 'Méditation des 14 stations' },
]

export function PrierHubScreen() {
  const navigation = useNavigation<any>()

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <Text style={styles.eyebrow}>VIE SPIRITUELLE &amp; CÉLÉBRATIONS</Text>
        <Text style={styles.title}>Prier &amp; Méditer</Text>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 18 }}>
        <View style={styles.heroCard}>
          <View style={styles.rowBetween}>
            <View style={styles.badgeAccent}><Text style={styles.badgeAccentText}>Parole du jour</Text></View>
            <Text style={styles.heroMeta}>Matthieu 5, 33-37</Text>
          </View>
          <Text style={styles.heroQuote}>« Que votre parole soit "oui" si c'est "oui", "non" si c'est "non". »</Text>
          <View style={styles.heroDivider} />
          <Pressable onPress={() => navigation.navigate('Liturgie')}>
            <Text style={styles.heroLink}>Lire la suite</Text>
          </Pressable>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24, gap: 12 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.h3}>Accès aux célébrations &amp; textes</Text>
          <Text style={styles.mutedSm}>{RUBRIQUES.length} rubriques</Text>
        </View>
        {RUBRIQUES.map((r) => (
          <Pressable key={r.titre} onPress={() => navigation.navigate(r.screen)} style={[styles.rubriqueCard, r.primary && styles.rubriquePrimary]}>
            <View style={styles.rubriqueIcon}><Icon name={r.icon} size={26} color={colors.primary} /></View>
            <View style={{ flex: 1 }}>
              <View style={styles.rowBetween}>
                <Text style={styles.rubriqueTitre}>{r.titre}</Text>
                <View style={[styles.badge, { backgroundColor: r.badgeBg }]}><Text style={[styles.badgeText, { color: r.badgeColor }]}>{r.badge}</Text></View>
              </View>
              <Text style={[styles.mutedSm, { marginTop: 4 }]}>{r.texte}</Text>
              <View style={[styles.rowBetween, { marginTop: 10, marginBottom: 0 }]}>
                <Text style={styles.mutedSm}>{r.meta}</Text>
                <View style={[styles.ctaBtn, r.primary ? { backgroundColor: colors.primary } : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
                  <Text style={[styles.ctaText, { color: r.primary ? colors.primaryForeground : colors.foreground }]}>{r.cta}</Text>
                  <Icon name="arrow-right" size={12} color={r.primary ? colors.primaryForeground : colors.foreground} />
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <View style={styles.intentionCard}>
          <View style={styles.intentionIcon}><Icon name="heart-straight-fill" size={22} color={colors.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.h3}>Déposer une intention de prière</Text>
            <Text style={[styles.mutedSm, { marginTop: 4 }]}>Confiez une épreuve, une action de grâce ou un proche à la prière de la communauté.</Text>
            <Pressable style={styles.intentionBtn} onPress={() => navigation.navigate('Intentions')}>
              <Icon name="paper-plane-tilt-fill" size={15} color={colors.primaryForeground} />
              <Text style={styles.intentionBtnText}>Demander une prière</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24, marginBottom: 8 }}>
        <Text style={[styles.h3, { marginBottom: 12 }]}>Prières de la communauté</Text>
        <View style={styles.grid2}>
          {PRIERES.map((p) => (
            <View key={p.titre} style={styles.prayerTile}>
              <View style={styles.prayerIcon}><Icon name={p.icon} size={17} color={colors.primary} /></View>
              <Text style={styles.prayerTitre}>{p.titre}</Text>
              <Text style={styles.mutedXs}>{p.sous}</Text>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.accent, letterSpacing: 0.5 },
  title: { fontFamily: fonts.heading, fontSize: 24, color: colors.primary, marginTop: 4 },
  h3: { fontFamily: fonts.heading, fontSize: 15, color: colors.primary },
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, lineHeight: 17 },
  mutedXs: { fontFamily: fonts.sans, fontSize: 10, color: colors.mutedForeground, marginTop: 2 },
  rowBetween: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  heroCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 18 },
  badgeAccent: { backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.full },
  badgeAccentText: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.accentForeground, textTransform: 'uppercase' },
  heroMeta: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  heroQuote: { fontFamily: fonts.heading, fontSize: 16, color: colors.primaryForeground, lineHeight: 22, marginTop: 4 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 12 },
  heroLink: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.accent, textAlign: 'right', textDecorationLine: 'underline' },
  rubriqueCard: { flexDirection: 'row', gap: 14, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14 },
  rubriquePrimary: { borderWidth: 2, borderColor: 'rgba(18,59,93,0.15)' },
  rubriqueIcon: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  rubriqueTitre: { fontFamily: fonts.heading, fontSize: 15, color: colors.primary, flex: 1 },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: radius.full },
  badgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
  intentionCard: { flexDirection: 'row', gap: 12, backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 18 },
  intentionIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: 'rgba(200,155,60,0.2)', alignItems: 'center', justifyContent: 'center' },
  intentionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 11, marginTop: 12 },
  intentionBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.primaryForeground },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  prayerTile: { width: '47%', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
  prayerIcon: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  prayerTitre: { fontFamily: fonts.heading, fontSize: 12, color: colors.primary },
})
