import { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, Image, StyleSheet, Pressable, ScrollView, Alert, Animated } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { Screen } from '../components/Screen'
import { Card } from '../components/ui'
import { Icon, type IconName } from '../components/Icon'
import { SkeletonBlock } from '../components/Skeleton'
import { colors, fonts, radius } from '../theme/colors'
import { getAnnonces, type Annonce } from '../services/annonces'
import { getHomelies, type Homelie } from '../services/homelies'

const QUICK_ACCESS: { icon: IconName; label: string; onPress: (nav: any) => void; color: string }[] = [
  { icon: 'book-bookmark', label: 'Textes du jour', color: colors.accent, onPress: (nav) => nav.navigate('Prier', { screen: 'Liturgie' }) },
  { icon: 'clock', label: 'Horaires', color: colors.primary, onPress: (nav) => nav.navigate('Prier', { screen: 'Horaires' }) },
  { icon: 'article', label: 'Annonces', color: colors.primary, onPress: (nav) => nav.navigate('Annonces') },
  { icon: 'headphones', label: 'Homélies', color: colors.primary, onPress: (nav) => nav.navigate('Prier', { screen: 'Homelies' }) },
  { icon: 'book-open', label: 'Formation', color: colors.primary, onPress: (nav) => nav.navigate('Se former') },
  { icon: 'heart', label: 'Faire un don', color: colors.accent, onPress: () => Alert.alert('Bientôt disponible', "Les dons en ligne arrivent dans une prochaine version.") },
]

const CAROUSEL_INTERVAL = 10000

function AnnoncesCarousel({ annonces, onPress }: { annonces: Annonce[]; onPress: () => void }) {
  const [index, setIndex] = useState(0)
  const fade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (annonces.length < 2) return
    const timer = setInterval(() => {
      Animated.sequence([
        Animated.timing(fade, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start()
      setIndex((i) => (i + 1) % annonces.length)
    }, CAROUSEL_INTERVAL)
    return () => clearInterval(timer)
  }, [annonces.length, fade])

  const a = annonces[index]
  if (!a) return null

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={{ opacity: fade }}>
        <Card style={{ flexDirection: 'row', gap: 12, padding: 0, overflow: 'hidden' }}>
          <Image
            source={a.imageUrl ? { uri: a.imageUrl } : require('../../assets/cathedrale.jpg')}
            style={styles.carouselImg}
          />
          <View style={{ flex: 1, padding: 14, justifyContent: 'center' }}>
            <Text style={styles.carouselTag}>{a.tag}</Text>
            <Text style={styles.strong} numberOfLines={2}>{a.titre}</Text>
            <Text style={[styles.mutedSm, { marginTop: 4 }]} numberOfLines={1}>{a.desc}</Text>
          </View>
        </Card>
        {annonces.length > 1 && (
          <View style={styles.dots}>
            {annonces.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
        )}
      </Animated.View>
    </Pressable>
  )
}

export function HomeScreen() {
  const navigation = useNavigation<any>()
  const [annonces, setAnnonces] = useState<Annonce[]>([])
  const [annoncesLoading, setAnnoncesLoading] = useState(true)
  const [homelie, setHomelie] = useState<Homelie | null>(null)
  const [homelieLoading, setHomelieLoading] = useState(true)

  useEffect(() => {
    getAnnonces().then((list) => setAnnonces(list.slice(0, 5))).catch(() => setAnnonces([])).finally(() => setAnnoncesLoading(false))
    getHomelies().then((list) => setHomelie(list[0] ?? null)).catch(() => setHomelie(null)).finally(() => setHomelieLoading(false))
  }, [])

  const epinglee = useMemo(() => annonces.find((a) => a.epingle) ?? annonces[0], [annonces])

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        <View style={styles.hero}>
          <Image source={require('../../assets/cathedrale.jpg')} style={StyleSheet.absoluteFill} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(18,59,93,0.15)', 'rgba(18,59,93,0.75)']}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroKicker}>Bienvenue</Text>
            <Text style={styles.heroTitle}>Cathédrale Sacré-Cœur</Text>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <View>
              <Text style={styles.eyebrow}>PROCHAINE MESSE</Text>
              <Text style={styles.h2}>Dimanche 16 juin</Text>
            </View>
            <View style={styles.pillSecondary}><Text style={styles.pillSecondaryText}>Dans 2 jours</Text></View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <View style={styles.iconTile}><Icon name="calendar-blank" size={22} color={colors.primary} /></View>
            <View>
              <Text style={styles.strongLg}>09:00</Text>
              <Text style={styles.muted}>Cathédrale Sacré-Cœur · Français</Text>
            </View>
          </View>
          <Pressable style={styles.primaryBtn} onPress={() => navigation.navigate('Prier', { screen: 'Horaires' })}>
            <Text style={styles.primaryBtnText}>Voir les horaires</Text>
            <Icon name="arrow-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        </Card>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.h3}>Aujourd'hui dans la foi</Text>
          <View style={styles.pillAccent}>
            <Icon name="sun-fill" size={12} color={colors.accent} />
            <Text style={styles.pillAccentText}>14 juin</Text>
          </View>
        </View>
        <Pressable onPress={() => navigation.navigate('Prier', { screen: 'Liturgie' })} style={styles.secondaryCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrowPrimary}>TEXTES &amp; LITURGIE DU JOUR</Text>
              <Text style={styles.quote}>« Que votre parole soit vérité »</Text>
              <Text style={styles.mutedSm}>Évangile selon saint Matthieu 5, 33-37</Text>
            </View>
            <View style={styles.roundIcon}><Icon name="book-bookmark-fill" size={16} color={colors.primary} /></View>
          </View>
          <View style={styles.divider} />
          <View style={styles.rowBetween}>
            <Text style={styles.mutedSm}>Lectures de la messe · Laudes · Vêpres</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.linkText}>Lire les textes</Text>
              <Icon name="arrow-right" size={13} color={colors.primary} />
            </View>
          </View>
        </Pressable>
      </View>

      {(annoncesLoading || epinglee) && (
        <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.h3}>À la une</Text>
            <View style={[styles.pillSecondary, { backgroundColor: 'rgba(181,71,71,0.1)' }]}>
              <Text style={[styles.pillSecondaryText, { color: colors.destructive }]}>Important</Text>
            </View>
          </View>
          {annoncesLoading ? (
            <View style={{ flexDirection: 'row', gap: 12, padding: 0 }}>
              <SkeletonBlock style={{ width: 96, height: 96 }} />
              <View style={{ flex: 1, gap: 6, justifyContent: 'center' }}>
                <SkeletonBlock style={{ width: 60, height: 10 }} />
                <SkeletonBlock style={{ width: '90%', height: 14 }} />
                <SkeletonBlock style={{ width: '70%', height: 12 }} />
              </View>
            </View>
          ) : (
            <AnnoncesCarousel annonces={annonces} onPress={() => navigation.navigate('Annonces')} />
          )}
        </View>
      )}

      <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
        <Text style={[styles.h3, { marginBottom: 12 }]}>Prochain rendez-vous</Text>
        <Pressable onPress={() => navigation.navigate('Participer')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={styles.dateTile}>
              <Text style={styles.dateTileMonth}>JUIN</Text>
              <Text style={styles.dateTileDay}>19</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.strong}>Veillée de prière</Text>
              <Text style={styles.mutedSm}>Mercredi · 18:30 · Chapelle Sainte Marie</Text>
            </View>
            <Icon name="caret-right" size={18} color={colors.mutedForeground} />
          </Card>
        </Pressable>
      </View>

      <View style={{ marginTop: 26 }}>
        <Text style={[styles.h3, { paddingHorizontal: 20, marginBottom: 12 }]}>Accès rapide</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10, alignItems: 'flex-start' }}>
          {QUICK_ACCESS.map((item) => (
            <Pressable key={item.label} onPress={() => item.onPress(navigation)} style={styles.quickAccessTile}>
              <Icon name={item.icon} size={24} color={item.color} />
              <Text style={styles.quickAccessLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.h3}>Dernière homélie</Text>
          <Pressable onPress={() => navigation.navigate('Prier', { screen: 'Homelies' })}>
            <Text style={styles.linkText}>Tout voir</Text>
          </Pressable>
        </View>
        {homelieLoading ? (
          <View style={[styles.homelieCard, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }]}>
            <SkeletonBlock style={{ width: 48, height: 48, borderRadius: radius.full }} />
            <View style={{ flex: 1, gap: 6 }}>
              <SkeletonBlock style={{ width: '40%', height: 10 }} />
              <SkeletonBlock style={{ width: '80%', height: 14 }} />
            </View>
          </View>
        ) : homelie ? (
          <Pressable onPress={() => navigation.navigate('Prier', { screen: 'Homelies' })} style={styles.homelieCard}>
            <View style={styles.playCircle}><Icon name="play-fill" size={22} color={colors.accentForeground} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.homelieMeta} numberOfLines={1}>{homelie.pretre}</Text>
              <Text style={styles.homelieTitle} numberOfLines={2}>{homelie.titre}</Text>
            </View>
          </Pressable>
        ) : (
          <Text style={styles.mutedSm}>Aucune homélie disponible pour le moment.</Text>
        )}
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 26 }}>
        <Pressable onPress={() => navigation.navigate('Accueil', { screen: 'Histoire' })}>
          <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Icon name="book-bookmark" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.strong}>Notre Histoire</Text>
              <Text style={[styles.mutedSm, { marginTop: 4 }]}>Depuis 1887 · Fondation, cathédrale, Cardinal</Text>
            </View>
            <Icon name="caret-right" size={18} color={colors.mutedForeground} />
          </Card>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <Pressable onPress={() => navigation.navigate('Accueil', { screen: 'Jeunesse' })}>
          <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Icon name="users-three" size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.strong}>Espace Jeunesse</Text>
              <Text style={[styles.mutedSm, { marginTop: 4 }]}>Formations, groupes et événements pour les ados</Text>
            </View>
            <Icon name="caret-right" size={18} color={colors.mutedForeground} />
          </Card>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
        <Pressable onPress={() => navigation.navigate('Accueil', { screen: 'Paroisse' })}>
          <Card style={{ flexDirection: 'row', gap: 12 }}>
            <Icon name="map-pin" size={22} color={colors.primary} />
            <View>
              <Text style={styles.strong}>Nous trouver</Text>
              <Text style={[styles.mutedSm, { marginTop: 4 }]}>Cathédrale Sacré-Cœur de Brazzaville{'\n'}République du Congo</Text>
              <Text style={[styles.linkText, { marginTop: 6 }]}>+242 06 000 00 00</Text>
            </View>
          </Card>
        </Pressable>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  hero: { height: 230, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.primary },
  heroContent: { flex: 1, justifyContent: 'flex-end', padding: 20 },
  heroKicker: { fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.accent, marginBottom: 4 },
  heroTitle: { fontFamily: fonts.heading, fontSize: 24, color: colors.primaryForeground, lineHeight: 28 },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.mutedForeground, letterSpacing: 0.5 },
  eyebrowPrimary: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.primary, letterSpacing: 0.5, marginBottom: 4 },
  h2: { fontFamily: fonts.heading, fontSize: 20, color: colors.foreground, marginTop: 2 },
  h3: { fontFamily: fonts.heading, fontSize: 17, color: colors.foreground },
  pillSecondary: { backgroundColor: colors.secondary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.full },
  pillSecondaryText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.secondaryForeground },
  pillAccent: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(200,155,60,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  pillAccentText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.accent },
  iconTile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.secondary, alignItems: 'center', justifyContent: 'center' },
  strongLg: { fontFamily: fonts.sansBold, fontSize: 18, color: colors.foreground },
  strong: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.foreground },
  muted: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground },
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, lineHeight: 17 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 14 },
  primaryBtnText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primaryForeground },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  secondaryCard: { backgroundColor: colors.secondary, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: 'rgba(217,224,229,0.6)' },
  quote: { fontFamily: fonts.heading, fontSize: 16, color: colors.primary },
  roundIcon: { width: 32, height: 32, borderRadius: radius.full, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(217,224,229,0.5)', marginVertical: 12 },
  linkText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.primary },
  carouselImg: { width: 96, height: 96 },
  carouselTag: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.primary, width: 14 },
  dateTile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  dateTileMonth: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.primaryForeground },
  dateTileDay: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.primaryForeground, lineHeight: 19 },
  quickAccessTile: { width: 92, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 12, alignItems: 'center' },
  quickAccessLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.foreground, marginTop: 8, textAlign: 'center' },
  homelieCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 16 },
  playCircle: { width: 48, height: 48, borderRadius: radius.full, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  homelieMeta: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  homelieTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.primaryForeground, marginTop: 2 },
})
