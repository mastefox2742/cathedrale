import { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useFonts as usePlayfair, PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold } from '@expo-google-fonts/playfair-display'
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter'
import { RootNavigator } from './src/navigation/RootNavigator'
import { colors } from './src/theme/colors'
import { chargerParoisseCourante, surChangementParoisse } from './src/services/paroisses'
import { reprendreNotifications, enregistrerJeton } from './src/services/notifications'
import { supabase } from './src/services/supabase'
import { VerrouApp } from './src/components/securite/VerrouApp'

export default function App() {
  const [playfairLoaded] = usePlayfair({ PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold, PlayfairDisplay_800ExtraBold })
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold })
  const [paroissePrete, setParoissePrete] = useState(false)

  useEffect(() => {
    chargerParoisseCourante().finally(() => {
      setParoissePrete(true)
      // Pas de demande d'autorisation au lancement : seulement si déjà accordée.
      reprendreNotifications()
    })
    // Le jeton suit la paroisse choisie et le compte connecté (ciblage des envois).
    const arretParoisse = surChangementParoisse(() => { enregistrerJeton() })
    const { data: sub } = supabase.auth.onAuthStateChange(() => { enregistrerJeton() })
    return () => { arretParoisse(); sub.subscription.unsubscribe() }
  }, [])

  if (!playfairLoaded || !interLoaded || !paroissePrete) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <VerrouApp>
        <RootNavigator />
      </VerrouApp>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
})
