import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Platform } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon } from '../../components/Icon'
import { DesignIcon } from '../../components/DesignIcon'
import { d, r, f, ombre } from '../../theme/design'
import { activerNotifications, notificationsAutorisees } from '../../services/notifications'

/**
 * Onglet « Plus » : regroupe les rubriques existantes de l'application
 * (paroisses, horaires, démarches, communauté, compte…), présentées avec
 * les codes visuels des écrans Archidiocèse.
 */

interface Lien { icon: string; titre: string; sous: string; aller: (nav: any) => void }

/** L'autorisation n'est demandée qu'ici, à la demande de la personne, avec une explication. */
async function proposerNotifications() {
  if (Platform.OS === 'web') { Alert.alert('Notifications', "Disponibles dans l'application installée sur le téléphone."); return }
  if (await notificationsAutorisees()) { Alert.alert('Notifications', 'Les notifications sont déjà activées. Vous pouvez les couper dans les réglages du téléphone.'); return }
  Alert.alert(
    'Recevoir les notifications ?',
    "Liturgie du jour, annonces de votre paroisse et directs de la chaîne. Rien d'autre, et vous pouvez les couper à tout moment.",
    [
      { text: 'Plus tard', style: 'cancel' },
      { text: 'Activer', onPress: async () => {
        const jeton = await activerNotifications()
        Alert.alert('Notifications', jeton ? 'Notifications activées.' : "Autorisation refusée : vous pourrez l'accorder dans les réglages du téléphone.")
      } },
    ],
  )
}

const SECTIONS: { titre: string; liens: Lien[] }[] = [
  {
    titre: 'Ma paroisse',
    liens: [
      { icon: 'church', titre: 'Ma paroisse', sous: 'Présentation, contacts, horaires', aller: n => n.navigate('Paroisse') },
      { icon: 'map-pin', titre: 'Annuaire des paroisses', sous: 'Trouver une paroisse près de chez moi', aller: n => n.navigate('Paroisses') },
      { icon: 'clock', titre: 'Messes & confessions', sous: 'Horaires de la semaine', aller: n => n.navigate('Prier', { screen: 'Horaires' }) },
      { icon: 'megaphone', titre: 'Annonces', sous: 'Vie de la paroisse et du diocèse', aller: n => n.navigate('Annonces') },
      { icon: 'calendar', titre: 'Agenda', sous: 'Événements, rencontres, célébrations', aller: n => n.navigate('Evenements') },
    ],
  },
  {
    titre: 'Communauté',
    liens: [
      { icon: 'heart', titre: 'Témoignages de Foi', sous: "Des vies transformées par l'Évangile", aller: n => n.navigate('Temoignages') },
      { icon: 'users-three', titre: 'Groupes & mouvements', sous: 'Rejoindre un groupe', aller: n => n.navigate('Groupes') },
      { icon: 'sparkle-fill', titre: 'Jeunesse', sous: 'Activités et rendez-vous des jeunes', aller: n => n.navigate('Jeunesse') },
      { icon: 'graduation-cap', titre: 'Formations', sous: 'Catéchèse et formations en ligne', aller: n => n.navigate('Formations') },
    ],
  },
  {
    titre: 'Démarches',
    liens: [
      { icon: 'file-text', titre: 'Sacrements & démarches', sous: 'Baptême, mariage, messe, rencontre', aller: n => n.navigate('Prier', { screen: 'Demarches' }) },
      { icon: 'shield-check', titre: 'Signaler une situation', sous: 'Protection des mineurs, confidentiel', aller: n => n.navigate('Signaler') },
    ],
  },
  {
    titre: 'Découvrir',
    liens: [
      { icon: 'book-open', titre: 'Histoire de la cathédrale', sous: 'Le Sacré-Cœur et le Cardinal Biayenda', aller: n => n.navigate('Histoire') },
    ],
  },
  {
    titre: 'Mon compte',
    liens: [
      { icon: 'user-circle', titre: 'Mon espace', sous: 'Connexion, progression, espace staff', aller: n => n.navigate('Connexion') },
      { icon: 'bell', titre: 'Recevoir les notifications', sous: 'Liturgie, annonces, directs — sur demande uniquement', aller: () => { proposerNotifications() } },
    ],
  },
]

export function PlusScreen() {
  const navigation = useNavigation<any>()
  const insets = useSafeAreaInsets()

  return (
    <View style={s.page}>
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <View style={[s.row, { gap: 12, flex: 1 }]}>
          <View style={s.tuile}><DesignIcon name="solar:menu-dots-bold" size={20} color={d.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.titreHeader}>Plus</Text>
            <Text style={s.sousHeader}>Tous les services de l'archidiocèse</Text>
          </View>
        </View>
        <Pressable onPress={() => navigation.navigate('Recherche')} style={s.rond} accessibilityLabel="Rechercher">
          <DesignIcon name="solar:magnifer-linear" size={18} color={d.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 20 }} showsVerticalScrollIndicator={false}>
        {SECTIONS.map(section => (
          <View key={section.titre} style={{ gap: 8 }}>
            <Text style={s.titreSection}>{section.titre}</Text>
            <View style={[s.carte, ombre.xs]}>
              {section.liens.map((l, i) => (
                <Pressable key={l.titre} onPress={() => l.aller(navigation)}
                  style={({ pressed }) => [s.ligne, i > 0 && s.separateur, pressed && { backgroundColor: d.secondary }]}>
                  <View style={s.icone}><Icon name={l.icon} size={18} color={d.primary} /></View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={s.lienTitre}>{l.titre}</Text>
                    <Text style={s.lienSous} numberOfLines={1}>{l.sous}</Text>
                  </View>
                  <DesignIcon name="solar:alt-arrow-right-linear" size={16} color={d.mutedForeground} />
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: d.background },
  row: { flexDirection: 'row', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    backgroundColor: d.alpha(d.card, 0.95), borderBottomWidth: 1, borderBottomColor: d.alpha(d.border, 0.7),
    paddingHorizontal: 16, paddingBottom: 12,
  },
  tuile: { width: 36, height: 36, borderRadius: r.xl, backgroundColor: d.alpha(d.accent, 0.2), alignItems: 'center', justifyContent: 'center' },
  titreHeader: { fontFamily: f.bold, fontSize: 16, lineHeight: 20, color: d.primary },
  sousHeader: { fontFamily: f.regular, fontSize: 10, color: d.mutedForeground },
  rond: { width: 36, height: 36, borderRadius: r.full, backgroundColor: d.secondary, alignItems: 'center', justifyContent: 'center' },
  titreSection: { fontFamily: f.bold, fontSize: 14, color: d.primary },
  carte: { backgroundColor: d.card, borderWidth: 1, borderColor: d.border, borderRadius: r['2xl'], overflow: 'hidden' },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  separateur: { borderTopWidth: 1, borderTopColor: d.alpha(d.border, 0.6) },
  icone: { width: 36, height: 36, borderRadius: r.lg, backgroundColor: d.secondary, alignItems: 'center', justifyContent: 'center' },
  lienTitre: { fontFamily: f.bold, fontSize: 13, color: d.primary },
  lienSous: { fontFamily: f.regular, fontSize: 11, color: d.mutedForeground, marginTop: 1 },
})
