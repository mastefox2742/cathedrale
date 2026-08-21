import { View, Text, StyleSheet, Linking } from 'react-native'
import { Screen } from '../components/Screen'
import { BackHeader, PrimaryButton } from '../components/ui'
import { Icon } from '../components/Icon'
import { colors, fonts, radius } from '../theme/colors'

export function ParoisseScreen() {
  return (
    <Screen>
      <BackHeader title="Informations & Contact" subtitle="Tout savoir sur la Cathédrale Sacré-Cœur" />

      <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 14 }}>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.iconTile}><Icon name="church" size={22} color={colors.primaryForeground} /></View>
            <View>
              <Text style={styles.h2}>Cathédrale Sacré-Cœur de Brazzaville</Text>
              <Text style={styles.mutedSm}>Archidiocèse de Brazzaville · Fondée en 1887</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={{ gap: 8 }}>
            <View style={styles.infoRow}><Icon name="map-pin" size={15} color={colors.primary} /><Text style={styles.infoText}>Avenue de la Paix, Centre-ville, Brazzaville, République du Congo</Text></View>
            <View style={styles.infoRow}><Icon name="phone" size={15} color={colors.primary} /><Text style={[styles.infoText, { fontFamily: fonts.sansSemiBold }]}>+242 06 000 00 00</Text></View>
            <View style={styles.infoRow}><Icon name="envelope-simple" size={15} color={colors.primary} /><Text style={styles.infoText}>contact@sacrecoeur-brazza.cg</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.h3Row}><Icon name="clock" size={15} color={colors.accent} /><Text style={styles.h3}>Horaires du Secrétariat</Text></View>
          <View style={styles.scheduleRow}><Text style={styles.mutedSm}>Mardi au Vendredi</Text><Text style={styles.scheduleValue}>08:00–12:30 | 15:00–18:00</Text></View>
          <View style={styles.scheduleRow}><Text style={styles.mutedSm}>Samedi</Text><Text style={styles.scheduleValue}>08:30 – 12:00</Text></View>
          <View style={[styles.scheduleRow, { borderBottomWidth: 0 }]}><Text style={{ color: colors.destructive, fontFamily: fonts.sansMedium, fontSize: 12 }}>Lundi & Dimanche</Text><Text style={{ color: colors.destructive, fontFamily: fonts.sansMedium, fontSize: 12 }}>Fermé au public</Text></View>
        </View>

        <View style={styles.card}>
          <View style={styles.h3Row}><Icon name="buildings" size={15} color={colors.accent} /><Text style={styles.h3}>Chapelles rattachées</Text></View>
          <View style={styles.chapelle}>
            <Text style={styles.chapelleTitre}>Chapelle Notre-Dame des Victoires</Text>
            <Text style={styles.mutedXs}>Messe dimanche à 08:00</Text>
          </View>
          <View style={styles.chapelle}>
            <Text style={styles.chapelleTitre}>Chapelle Saint Joseph Artisan</Text>
            <Text style={styles.mutedXs}>Messe samedi à 18:00</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.h3Row}><Icon name="users-four" size={15} color={colors.accent} /><Text style={styles.h3}>Équipe pastorale</Text></View>
          <View style={styles.rowBetween}>
            <View>
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.foreground }}>Abbé Pierre N.</Text>
              <Text style={styles.mutedXs}>Curé & Aumônier diocésain</Text>
            </View>
            <View style={styles.rdvBadge}><Text style={styles.rdvBadgeText}>Rdv Jeudi matin</Text></View>
          </View>
        </View>

        <View style={{ marginBottom: 24 }}>
          <PrimaryButton
            label="Obtenir l'itinéraire"
            icon="map-pin"
            onPress={() => Linking.openURL('https://maps.google.com/?q=Cathédrale+Sacré-Coeur+Brazzaville')}
          />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 16 },
  iconTile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  h2: { fontFamily: fonts.heading, fontSize: 14, color: colors.foreground },
  h3: { fontFamily: fonts.heading, fontSize: 13, color: colors.primary },
  h3Row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  mutedXs: { fontFamily: fonts.sans, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  divider: { height: 1, backgroundColor: 'rgba(217,224,229,0.6)', marginVertical: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoText: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, lineHeight: 18 },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(217,224,229,0.4)' },
  scheduleValue: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.foreground },
  chapelle: { backgroundColor: colors.secondary, borderRadius: radius.md, padding: 10, marginBottom: 8 },
  chapelleTitre: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.primary },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rdvBadge: { backgroundColor: colors.secondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  rdvBadgeText: { fontFamily: fonts.sansMedium, fontSize: 10, color: colors.primary },
})
