import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { Icon, type IconName } from '../components/Icon'
import { colors, fonts, radius } from '../theme/colors'
import { getServicesParoissiaux, type ServiceParoissial } from '../services/servicesParoissiaux'

function contactHref(contact: string) {
  return contact.includes('@') ? `mailto:${contact}` : `tel:${contact.replace(/\s/g, '')}`
}

const DIMANCHE = [
  { heure: '07:00', label: 'Français', desc: "Messe de l'Aurore · Cathédrale", icon: 'check-circle' as IconName, iconColor: colors.chart3 },
  { heure: '09:00', label: 'Messe paroissiale', desc: 'Avec la chorale · Retransmise', highlight: true },
  { heure: '11:00', label: 'Messe des familles', desc: 'Animée par les jeunes & catéchisme', icon: 'users-three' as IconName, iconColor: colors.mutedForeground },
  { heure: '18:00', label: 'Messe du soir', desc: 'Cathédrale Sacré-Cœur', icon: 'moon' as IconName, iconColor: colors.mutedForeground },
]

const SEMAINE = [
  { label: 'Matin (Lun - Ven)', lieu: 'Chapelle du Saint-Sacrement', heure: '06:30' },
  { label: 'Midi (Mercredi & Vendredi)', lieu: 'Cathédrale Sacré-Cœur', heure: '12:15' },
  { label: 'Samedi soir (Anticipée)', lieu: 'Cathédrale Sacré-Cœur', heure: '18:30' },
]

export function HorairesScreen() {
  const navigation = useNavigation<any>()
  const [services, setServices] = useState<ServiceParoissial[]>([])

  useEffect(() => {
    getServicesParoissiaux().then(setServices).catch(() => setServices([]))
  }, [])

  return (
    <Screen>
      <BackHeader title="Horaires des messes" subtitle="Cathédrale Sacré-Cœur & Chapelles" />

      <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 14 }}>
        <Pressable onPress={() => navigation.navigate('Demarches')} style={styles.demarcheBanner}>
          <View style={styles.demarcheIcon}><Icon name="file-text" size={18} color={colors.accentForeground} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.demarcheTitle}>Baptême, mariage, obsèques…</Text>
            <Text style={styles.demarcheSub}>Faire une demande pastorale</Text>
          </View>
          <Icon name="caret-right" size={16} color={colors.mutedForeground} />
        </Pressable>

        <View style={styles.banner}>
          <View style={styles.bannerIcon}><Icon name="bell-ringing" size={18} color={colors.accentForeground} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Horaires réguliers à jour</Text>
            <Text style={styles.bannerSub}>Aucune modification cette semaine</Text>
          </View>
        </View>

        <View style={styles.h2Row}>
          <Icon name="sun" size={16} color={colors.accent} />
          <Text style={styles.h2}>Dimanche &amp; Solennités</Text>
        </View>
        <View style={{ gap: 10 }}>
          {DIMANCHE.map((m) => (
            <View key={m.label} style={[styles.messeCard, m.highlight && styles.messeCardHighlight]}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.messeHeure}>{m.heure}</Text>
                  <View style={[styles.tag, m.highlight && { backgroundColor: 'rgba(200,155,60,0.2)' }]}>
                    <Text style={styles.tagText}>{m.label}</Text>
                  </View>
                </View>
                <Text style={[styles.mutedSm, { marginTop: 4 }]}>{m.desc}</Text>
              </View>
              {m.highlight ? (
                <View style={styles.badgePrincipale}><Text style={styles.badgePrincipaleText}>Principale</Text></View>
              ) : (
                <Icon name={m.icon!} size={18} color={m.iconColor} />
              )}
            </View>
          ))}
        </View>

        <View style={styles.h2Row}>
          <Icon name="calendar" size={16} color={colors.primary} />
          <Text style={styles.h2}>En semaine</Text>
        </View>
        <View style={styles.weekCard}>
          {SEMAINE.map((s, i) => (
            <View key={s.label} style={[styles.weekRow, i < SEMAINE.length - 1 && styles.weekRowBorder]}>
              <View>
                <Text style={styles.weekLabel}>{s.label}</Text>
                <Text style={styles.mutedSm}>{s.lieu}</Text>
              </View>
              <Text style={styles.weekHeure}>{s.heure}</Text>
            </View>
          ))}
        </View>

        <View style={styles.h2Row}>
          <Icon name="heart-straight" size={16} color={colors.destructive} />
          <Text style={styles.h2}>Confessions</Text>
        </View>
        <View style={styles.confessions}>
          <Text style={styles.confessionsLine}><Text style={styles.confessionsStrong}>Mercredi & Vendredi : </Text>17:00 – 18:15</Text>
          <Text style={styles.confessionsLine}><Text style={styles.confessionsStrong}>Samedi : </Text>16:30 – 18:00</Text>
          <Text style={[styles.mutedSm, { marginTop: 6 }]}>Sur rendez-vous avec un prêtre à l'accueil paroissial pour toute autre demande.</Text>
        </View>

        {services.length > 0 && (
          <>
            <View style={styles.h2Row}>
              <Icon name="buildings" size={16} color={colors.primary} />
              <Text style={styles.h2}>Services paroissiaux</Text>
            </View>
            <View style={{ gap: 10, marginBottom: 20 }}>
              {services.map((s) => (
                <View key={s.id} style={styles.serviceCard}>
                  <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.serviceCategorie}>{s.categorie}</Text>
                    <Text style={styles.serviceNom}>{s.nom}</Text>
                    <Text style={[styles.mutedSm, { marginTop: 2, lineHeight: 17 }]}>{s.description}</Text>
                    {s.horaire && <Text style={[styles.mutedSm, { marginTop: 4, color: colors.accent, fontFamily: fonts.sansSemiBold }]}>{s.horaire}</Text>}
                    {s.contact && (
                      <Pressable onPress={() => Linking.openURL(contactHref(s.contact!))} style={{ marginTop: 6 }}>
                        <Text style={styles.contactLink}>Contacter →</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  h2Row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  h2: { fontFamily: fonts.heading, fontSize: 16, color: colors.foreground },
  mutedSm: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground },
  demarcheBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
  demarcheIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  demarcheTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.foreground },
  demarcheSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primary, borderRadius: radius.lg, padding: 14 },
  bannerIcon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.primaryForeground },
  bannerSub: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  messeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
  messeCardHighlight: { borderWidth: 2, borderColor: 'rgba(200,155,60,0.4)' },
  messeHeure: { fontFamily: fonts.sansBold, fontSize: 17, color: colors.primary },
  tag: { backgroundColor: colors.muted, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.foreground },
  badgePrincipale: { backgroundColor: 'rgba(200,155,60,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  badgePrincipaleText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.accent },
  weekCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  weekRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(217,224,229,0.5)' },
  weekLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.foreground },
  weekHeure: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primary },
  confessions: { backgroundColor: colors.secondary, borderRadius: radius.lg, padding: 14, marginBottom: 20 },
  confessionsLine: { fontFamily: fonts.sans, fontSize: 12, color: colors.foreground, marginTop: 2 },
  confessionsStrong: { fontFamily: fonts.sansSemiBold },
  serviceCard: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, padding: 14 },
  serviceCategorie: { fontFamily: fonts.sansSemiBold, fontSize: 9, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.accent },
  serviceNom: { fontFamily: fonts.heading, fontSize: 14, color: colors.foreground, marginTop: 2 },
  contactLink: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.primary, textDecorationLine: 'underline' },
})
