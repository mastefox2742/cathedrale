import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { supabase } from './supabase'
import { getParoisseCourante } from './paroisses'

/**
 * Notifications push de l'application (Expo). Le jeton du téléphone est
 * enregistré dans notification_tokens (plateforme « expo ») avec la paroisse
 * choisie et le compte connecté : la fonction Edge send-notification peut
 * alors cibler par paroisse, rôle ou groupe, comme pour le site.
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

const PREFS = { liturgie: true, annonces: true, formations: true, meditation: false, dimanche: true }

let jeton: string | null = null

/**
 * Au démarrage : réactive les notifications SI la personne les a déjà
 * autorisées. Ne demande jamais l'autorisation (elle est demandée seulement
 * quand la personne choisit « Recevoir les notifications »).
 */
export async function reprendreNotifications(): Promise<void> {
  if (Platform.OS === 'web') return
  try {
    const { status } = await Notifications.getPermissionsAsync()
    if (status === 'granted') await activerNotifications()
  } catch { /* facultatif */ }
}

/** Autorisation déjà accordée ? */
export async function notificationsAutorisees(): Promise<boolean> {
  if (Platform.OS === 'web') return false
  try { return (await Notifications.getPermissionsAsync()).status === 'granted' } catch { return false }
}

/** Demande l'autorisation, récupère le jeton Expo et l'enregistre (sans bloquer l'app en cas d'échec). */
export async function activerNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Annonces de la paroisse',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#123B5D',
      })
    }
    const { status: existant } = await Notifications.getPermissionsAsync()
    let statut = existant
    if (existant !== 'granted') statut = (await Notifications.requestPermissionsAsync()).status
    if (statut !== 'granted') return null

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId
    if (!projectId) return null
    jeton = (await Notifications.getExpoPushTokenAsync({ projectId })).data
    await enregistrerJeton()
    return jeton
  } catch {
    return null
  }
}

/** Réenregistre le jeton (après connexion ou changement de paroisse). */
export async function enregistrerJeton(): Promise<void> {
  if (!jeton) return
  await supabase.rpc('enregistrer_jeton', {
    p_token: jeton, p_prefs: PREFS, p_platform: 'expo', p_parish: getParoisseCourante(),
  })
}
