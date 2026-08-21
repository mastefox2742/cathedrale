import { View, Text, StyleSheet } from 'react-native'
import { Screen } from '../components/Screen'
import { BackHeader } from '../components/ui'
import { Icon } from '../components/Icon'
import { colors, fonts, radius } from '../theme/colors'

const HISTOIRE = [
  { annee: '1887', titre: 'Fondation de la mission', texte: "Le père Hippolyte Carrié obtient une concession de cent hectares autour d'une colline pour y installer la Mission du Saint-Esprit, d'abord placée sous le nom de Saint-Hippolyte." },
  { annee: '1892', titre: 'Première pierre', texte: "Le père Prosper Augouard pose la première pierre de l'édifice. Entre 700 000 et 800 000 briques seront fabriquées, cuites et transportées en dix-huit mois pour sa construction." },
  { annee: '1894', titre: 'Consécration de la cathédrale', texte: "La cathédrale est consacrée. Elle reste aujourd'hui considérée comme la plus ancienne cathédrale d'Afrique centrale encore conservée." },
  { annee: '1898', titre: 'La mission prend le nom de Sacré-Cœur', texte: 'Le nom Saint-Hippolyte laisse place à celui de Sacré-Cœur.' },
  { annee: '1938', titre: 'Premiers prêtres noirs ordonnés', texte: 'Ordination des tout premiers prêtres noirs du diocèse, Auguste Roch Nkounkou et Eugène Nkakou.' },
  { annee: '1955', titre: 'Érection en archidiocèse', texte: 'Le vicariat apostolique de Brazzaville devient archidiocèse le 14 septembre.' },
  { annee: '1977', titre: 'Sépulture du Cardinal Émile Biayenda', texte: 'Assassiné le 22 mars, le cardinal Émile Biayenda, premier cardinal congolais, est inhumé dans la cathédrale.' },
  { annee: '1980', titre: 'Visite du pape Jean-Paul II', texte: 'Le pape Jean-Paul II se rend à la cathédrale, moment marquant de son histoire récente.' },
]

export function HistoireScreen() {
  return (
    <Screen>
      <BackHeader title="Notre Histoire" subtitle="Depuis 1887" />

      <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
        <Text style={styles.intro}>
          Fondée en pleine forêt équatoriale en 1887, la Cathédrale Sacré-Cœur reste aujourd'hui considérée
          comme la plus ancienne cathédrale d'Afrique centrale encore conservée — un patrimoine que la
          paroisse porte avec fierté.
        </Text>

        <View style={{ marginTop: 20, gap: 2 }}>
          {HISTOIRE.map((h) => (
            <View key={h.annee} style={styles.row}>
              <Text style={styles.annee}>{h.annee}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.titre}>{h.titre}</Text>
                <Text style={styles.texte}>{h.texte}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.verse}>
          <Text style={styles.verseText}>« Où laisserais-je ce peuple qui m'a été confié ? »</Text>
          <Text style={styles.verseRef}>CARDINAL ÉMILE BIAYENDA, QUELQUES JOURS AVANT SON ASSASSINAT, MARS 1977</Text>
        </View>

        <View style={styles.cardinalCard}>
          <View style={styles.cardinalPhoto}>
            <Icon name="user-circle" size={40} color="rgba(255,255,255,0.4)" />
            <Text style={styles.cardinalPhotoText}>Photo officielle à venir</Text>
          </View>
          <Text style={styles.cardinalKicker}>NOTRE PASTEUR · 1927-1977</Text>
          <Text style={styles.cardinalTitre}>Le Cardinal Émile Biayenda</Text>
          <View style={styles.cardinalBox}>
            <Text style={[styles.cardinalText, { marginBottom: 10 }]}>
              Né en 1927 à Mpangala, dans la région du Pool, Émile Biayenda est ordonné prêtre en 1958.
              Devenu archevêque de Brazzaville en 1971, il est créé cardinal par le pape Paul VI le 5 mars
              1973 — le premier cardinal congolais de l'histoire.
            </Text>
            <Text style={[styles.cardinalText, { marginBottom: 10 }]}>
              Le 22 mars 1977, quelques jours après l'assassinat du président Marien Ngouabi, il est enlevé
              à son domicile, juste à côté de la cathédrale, puis tué dans la nuit par un groupe de
              militaires — il avait 50 ans. Sa dépouille repose à la Cathédrale Sacré-Cœur de Brazzaville.
            </Text>
            <Text style={styles.cardinalText}>
              En 1995, sa cause de béatification est officiellement ouverte à la demande du pape Jean-Paul
              II. Le dossier, validé par Rome en 2015, continue d'être activement soutenu par l'Église et
              les autorités congolaises.
            </Text>
          </View>
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  intro: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  annee: { fontFamily: fonts.heading, fontSize: 24, color: colors.chart2, minWidth: 64 },
  titre: { fontFamily: fonts.heading, fontSize: 15, color: colors.foreground, marginBottom: 4 },
  texte: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, lineHeight: 18 },
  verse: { alignItems: 'center', paddingVertical: 24, marginTop: 8 },
  verseText: { fontFamily: fonts.heading, fontSize: 15, color: colors.primary, fontStyle: 'italic', textAlign: 'center' },
  verseRef: { fontFamily: fonts.sansBold, fontSize: 9, color: colors.accent, letterSpacing: 1, marginTop: 8 },
  cardinalCard: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: 20, marginTop: 8, marginBottom: 30 },
  cardinalPhoto: { aspectRatio: 3 / 2, borderRadius: radius.md, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 },
  cardinalPhotoText: { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  cardinalKicker: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.accent, letterSpacing: 1.5 },
  cardinalTitre: { fontFamily: fonts.heading, fontSize: 20, color: '#fff', marginTop: 4, marginBottom: 12 },
  cardinalBox: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, padding: 14 },
  cardinalText: { fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 19 },
})
