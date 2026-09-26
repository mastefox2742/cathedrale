import { View, Text, StyleSheet } from 'react-native'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { colors, fonts, radius } from '../theme/colors'

const MYSTERES = {
  joyeux: { nom: 'Mystères joyeux', liste: ["L'Annonciation", 'La Visitation', 'La Nativité', 'La Présentation de Jésus au Temple', 'Le Recouvrement de Jésus au Temple'] },
  lumineux: { nom: 'Mystères lumineux', liste: ['Le Baptême de Jésus', 'Les Noces de Cana', "L'Annonce du Royaume", 'La Transfiguration', "L'Institution de l'Eucharistie"] },
  douloureux: { nom: 'Mystères douloureux', liste: ["L'Agonie au jardin des Oliviers", 'La Flagellation', "Le Couronnement d'épines", 'Le Portement de la Croix', 'La Crucifixion'] },
  glorieux: { nom: 'Mystères glorieux', liste: ['La Résurrection', "L'Ascension", 'La Pentecôte', "L'Assomption de la Vierge Marie", 'Le Couronnement de la Vierge Marie'] },
}

/** Répartition traditionnelle : lundi/samedi joyeux, mardi/vendredi douloureux, mercredi/dimanche glorieux, jeudi lumineux. */
function mysteresDuJour(jour: number) {
  if (jour === 1 || jour === 6) return MYSTERES.joyeux
  if (jour === 2 || jour === 5) return MYSTERES.douloureux
  if (jour === 4) return MYSTERES.lumineux
  return MYSTERES.glorieux
}

const ETAPES = [
  'Signe de croix et Credo',
  'Un Notre Père, trois Je vous salue Marie, un Gloire au Père',
  'Pour chaque mystère : annoncer le mystère, un Notre Père, dix Je vous salue Marie, un Gloire au Père',
  'Terminer par le Salve Regina',
]

export function ChapeletScreen() {
  const m = mysteresDuJour(new Date().getDay())
  return (
    <Screen>
      <BackHeader title="Le chapelet du jour" subtitle={m.nom} />
      <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 10 }}>
        {m.liste.map((x, i) => (
          <View key={x} style={styles.ligne}>
            <Text style={styles.num}>{i + 1}</Text>
            <Text style={styles.corps}>{x}</Text>
          </View>
        ))}
        <View style={[styles.carte, { marginTop: 10 }]}>
          <Text style={styles.h3}>Comment prier le chapelet</Text>
          {ETAPES.map((e, i) => <Text key={i} style={styles.corps}>{i + 1}. {e}</Text>)}
        </View>
        <Text style={styles.citation}>
          Je vous salue Marie, pleine de grâce ; le Seigneur est avec vous. Vous êtes bénie entre toutes les femmes, et Jésus, le fruit de vos entrailles, est béni. Sainte Marie, Mère de Dieu, priez pour nous, pauvres pécheurs, maintenant et à l&apos;heure de notre mort. Amen.
        </Text>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14 },
  num: { fontFamily: fonts.heading, fontSize: 20, color: colors.accent, minWidth: 20 },
  carte: { backgroundColor: colors.secondary, borderRadius: radius.lg, padding: 16, gap: 6 },
  h3: { fontFamily: fonts.heading, fontSize: 16, color: colors.primary, marginBottom: 4 },
  corps: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.foreground, flex: 1 },
  citation: { fontFamily: fonts.headingSemiBold, fontSize: 14, lineHeight: 22, color: colors.mutedForeground, borderLeftWidth: 3, borderLeftColor: colors.accent, paddingLeft: 12, marginTop: 6, marginBottom: 20 },
})
