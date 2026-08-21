import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { colors, fonts } from '../theme/colors'
import { Icon, type IconName } from '../components/Icon'

import { HomeScreen } from '../screens/HomeScreen'
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
import { TemoignagesScreen } from '../screens/TemoignagesScreen'
import { ConnexionScreen } from '../screens/ConnexionScreen'

const Tab = createBottomTabNavigator()
const AccueilStack = createNativeStackNavigator()
const PrierStack = createNativeStackNavigator()
const FormationStack = createNativeStackNavigator()
const ParticiperStack = createNativeStackNavigator()
const ProfilStack = createNativeStackNavigator()

const screenOptions = { headerShown: false } as const

function AccueilNavigator() {
  return (
    <AccueilStack.Navigator screenOptions={screenOptions}>
      <AccueilStack.Screen name="Home" component={HomeScreen} />
      <AccueilStack.Screen name="Annonces" component={AnnoncesScreen} />
      <AccueilStack.Screen name="Paroisse" component={ParoisseScreen} />
      <AccueilStack.Screen name="Histoire" component={HistoireScreen} />
      <AccueilStack.Screen name="Jeunesse" component={JeunesseScreen} />
    </AccueilStack.Navigator>
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
    </PrierStack.Navigator>
  )
}

function FormationNavigator() {
  return (
    <FormationStack.Navigator screenOptions={screenOptions}>
      <FormationStack.Screen name="Formations" component={FormationsScreen} />
    </FormationStack.Navigator>
  )
}

function ParticiperNavigator() {
  return (
    <ParticiperStack.Navigator screenOptions={screenOptions}>
      <ParticiperStack.Screen name="Evenements" component={EvenementsScreen} />
      <ParticiperStack.Screen name="Groupes" component={GroupesScreen} />
      <ParticiperStack.Screen name="Temoignages" component={TemoignagesScreen} />
    </ParticiperStack.Navigator>
  )
}

function ProfilNavigator() {
  return (
    <ProfilStack.Navigator screenOptions={screenOptions}>
      <ProfilStack.Screen name="Connexion" component={ConnexionScreen} />
    </ProfilStack.Navigator>
  )
}

const TAB_ICONS: Record<string, { icon: IconName; iconActive: IconName }> = {
  Accueil: { icon: 'house', iconActive: 'house-fill' },
  Prier: { icon: 'hands-praying', iconActive: 'hands-praying-fill' },
  'Se former': { icon: 'book-open', iconActive: 'book-open-fill' },
  Participer: { icon: 'users-three', iconActive: 'users-three-fill' },
  Profil: { icon: 'user-circle', iconActive: 'user-circle-fill' },
}

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.background, card: colors.card, border: colors.border, primary: colors.primary, text: colors.foreground },
}

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border, height: 62, paddingBottom: 8, paddingTop: 8 },
          tabBarLabelStyle: { fontFamily: fonts.sansSemiBold, fontSize: 10.5 },
          tabBarIcon: ({ focused, color }) => {
            const def = TAB_ICONS[route.name]
            return <Icon name={focused ? def.iconActive : def.icon} size={20} color={color} />
          },
        })}
      >
        <Tab.Screen name="Accueil" component={AccueilNavigator} />
        <Tab.Screen name="Prier" component={PrierNavigator} />
        <Tab.Screen name="Se former" component={FormationNavigator} />
        <Tab.Screen name="Participer" component={ParticiperNavigator} />
        <Tab.Screen name="Profil" component={ProfilNavigator} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
