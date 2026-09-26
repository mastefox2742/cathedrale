import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { colors } from '../theme/colors'
import { BarreOnglets } from '../components/BarreOnglets'

// Écrans Archidiocèse (maquettes « Médiation & Évangélisation »)
import { AccueilArchidioceseScreen } from '../screens/archidiocese/AccueilArchidioceseScreen'
import { TvArchidioceseScreen } from '../screens/archidiocese/TvArchidioceseScreen'
import { ParcoursArchidioceseScreen } from '../screens/archidiocese/ParcoursArchidioceseScreen'
import { TemoignagesArchidioceseScreen } from '../screens/archidiocese/TemoignagesArchidioceseScreen'
import { PlusScreen } from '../screens/archidiocese/PlusScreen'
import { RechercheScreen } from '../screens/archidiocese/RechercheScreen'

// Écrans conservés
import { AnnoncesScreen } from '../screens/AnnoncesScreen'
import { ParoisseScreen } from '../screens/ParoisseScreen'
import { HistoireScreen } from '../screens/HistoireScreen'
import { JeunesseScreen } from '../screens/JeunesseScreen'
import { PrierHubScreen } from '../screens/PrierHubScreen'
import { LiturgieScreen } from '../screens/LiturgieScreen'
import { HomeliesScreen } from '../screens/HomeliesScreen'
import { HorairesScreen } from '../screens/HorairesScreen'
import { IntentionsScreen } from '../screens/IntentionsScreen'
import { DemarchesScreen } from '../screens/DemarchesScreen'
import { FormationsScreen } from '../screens/FormationsScreen'
import { EvenementsScreen } from '../screens/EvenementsScreen'
import { GroupesScreen } from '../screens/GroupesScreen'
import { SignalerScreen } from '../screens/SignalerScreen'
import { ConnexionScreen } from '../screens/ConnexionScreen'
import { ParcoursListeScreen } from '../screens/ParcoursListeScreen'
import { ParcoursScreen } from '../screens/ParcoursScreen'
import { ParoissesScreen } from '../screens/ParoissesScreen'
import { EspaceStaffScreen } from '../screens/EspaceStaffScreen'
import { ChapeletScreen } from '../screens/ChapeletScreen'

const Tab = createBottomTabNavigator()
const AccueilStack = createNativeStackNavigator()
const TvStack = createNativeStackNavigator()
const ParcoursStack = createNativeStackNavigator()
const PrierStack = createNativeStackNavigator()
const PlusStack = createNativeStackNavigator()

const screenOptions = { headerShown: false } as const

function AccueilNavigator() {
  return (
    <AccueilStack.Navigator screenOptions={screenOptions}>
      <AccueilStack.Screen name="AccueilArchidiocese" component={AccueilArchidioceseScreen} />
    </AccueilStack.Navigator>
  )
}

function TvNavigator() {
  return (
    <TvStack.Navigator screenOptions={screenOptions}>
      <TvStack.Screen name="TvArchidiocese" component={TvArchidioceseScreen} />
    </TvStack.Navigator>
  )
}

function ParcoursNavigator() {
  return (
    <ParcoursStack.Navigator screenOptions={screenOptions}>
      <ParcoursStack.Screen name="ParcoursArchidiocese" component={ParcoursArchidioceseScreen} initialParams={{ type: 'decouvrir' }} />
      <ParcoursStack.Screen name="ParcoursEtape" component={ParcoursScreen} />
    </ParcoursStack.Navigator>
  )
}

function PrierNavigator() {
  return (
    <PrierStack.Navigator screenOptions={screenOptions}>
      <PrierStack.Screen name="PrierHub" component={PrierHubScreen} />
      <PrierStack.Screen name="Liturgie" component={LiturgieScreen} />
      <PrierStack.Screen name="Homelies" component={HomeliesScreen} />
      <PrierStack.Screen name="Horaires" component={HorairesScreen} />
      <PrierStack.Screen name="Intentions" component={IntentionsScreen} />
      <PrierStack.Screen name="Demarches" component={DemarchesScreen} />
      <PrierStack.Screen name="Chapelet" component={ChapeletScreen} />
      <PrierStack.Screen name="ParcoursListe" component={ParcoursListeScreen} />
      <PrierStack.Screen name="ParcoursEtape" component={ParcoursScreen} />
    </PrierStack.Navigator>
  )
}

function PlusNavigator() {
  return (
    <PlusStack.Navigator screenOptions={screenOptions}>
      <PlusStack.Screen name="PlusMenu" component={PlusScreen} />
      <PlusStack.Screen name="Recherche" component={RechercheScreen} />
      <PlusStack.Screen name="Temoignages" component={TemoignagesArchidioceseScreen} />
      <PlusStack.Screen name="Annonces" component={AnnoncesScreen} />
      <PlusStack.Screen name="Paroisses" component={ParoissesScreen} />
      <PlusStack.Screen name="Paroisse" component={ParoisseScreen} />
      <PlusStack.Screen name="Histoire" component={HistoireScreen} />
      <PlusStack.Screen name="Jeunesse" component={JeunesseScreen} />
      <PlusStack.Screen name="Signaler" component={SignalerScreen} />
      <PlusStack.Screen name="Evenements" component={EvenementsScreen} />
      <PlusStack.Screen name="Groupes" component={GroupesScreen} />
      <PlusStack.Screen name="Formations" component={FormationsScreen} />
      <PlusStack.Screen name="Connexion" component={ConnexionScreen} />
      <PlusStack.Screen name="EspaceStaff" component={EspaceStaffScreen} />
    </PlusStack.Navigator>
  )
}

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, card: colors.card, border: colors.border, primary: colors.primary, text: colors.foreground },
}

function AppTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <BarreOnglets {...props} />}>
      <Tab.Screen name="Accueil" component={AccueilNavigator} />
      <Tab.Screen name="TV" component={TvNavigator} />
      <Tab.Screen name="Parcours" component={ParcoursNavigator} />
      <Tab.Screen name="Prier" component={PrierNavigator} />
      <Tab.Screen name="Plus" component={PlusNavigator} />
    </Tab.Navigator>
  )
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <AppTabs />
    </NavigationContainer>
  )
}
