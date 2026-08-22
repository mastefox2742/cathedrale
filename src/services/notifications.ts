import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging'
import { firebaseApp } from './firebase'
import { supabase } from './supabase'

export interface NotifPreferences {
  liturgie: boolean      // Évangile du jour à 6h
  annonces: boolean      // Annonces urgentes
  formations: boolean    // Rappels formations
  meditation: boolean    // Méditation du soir à 20h
  dimanche: boolean      // Rappel messe du dimanche
}

const DEFAULT_PREFS: NotifPreferences = {
  liturgie: true,
  annonces: true,
  formations: false,
  meditation: false,
  dimanche: true,
}

export const NOTIF_LABELS: Record<keyof NotifPreferences, { label: string; desc: string; icon: string }> = {
  liturgie:   { label: 'Liturgie du matin',    desc: 'Évangile du jour à 6h00',          icon: 'menu_book' },
  annonces:   { label: 'Annonces urgentes',     desc: 'Informations importantes de la paroisse', icon: 'campaign' },
  formations: { label: 'Rappels formations',    desc: '24h avant chaque session',          icon: 'school' },
  meditation: { label: 'Méditation du soir',    desc: 'Citation spirituelle à 20h00',      icon: 'self_improvement' },
  dimanche:   { label: 'Rappel messe dominicale', desc: 'Rappel le dimanche matin',        icon: 'church' },
}

// Vérifie si les notifications sont supportées
export function isNotificationSupported(): boolean {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window
}

// Demande la permission et retourne le token FCM
export async function requestNotificationPermission(): Promise<string | null> {
  if (!isNotificationSupported()) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  try {
    const messaging = getMessaging(firebaseApp)
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY
    const token = await getToken(messaging, { vapidKey })
    return token
  } catch {
    return null
  }
}

// Sauvegarde le token + préférences dans Supabase
export async function saveNotificationToken(
  token: string,
  prefs: NotifPreferences = DEFAULT_PREFS,
): Promise<void> {
  const { error } = await supabase.from('notification_tokens').upsert({
    token, prefs, platform: 'web', updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

// Met à jour les préférences
export async function updateNotificationPrefs(
  token: string,
  prefs: NotifPreferences,
): Promise<void> {
  const { error } = await supabase.from('notification_tokens')
    .update({ prefs, updated_at: new Date().toISOString() }).eq('token', token)
  if (error) throw error
}

// Désabonnement
export async function unsubscribeNotifications(token: string): Promise<void> {
  const { error } = await supabase.from('notification_tokens').delete().eq('token', token)
  if (error) throw error
}

// Écoute les messages en premier plan
export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
  try {
    const messaging = getMessaging(firebaseApp)
    return onMessage(messaging, callback)
  } catch (_) {
    return () => {}
  }
}

// Stockage local du token
export function getStoredToken(): string | null {
  return localStorage.getItem('fcm_token')
}
export function storeToken(token: string): void {
  localStorage.setItem('fcm_token', token)
}
export function clearStoredToken(): void {
  localStorage.removeItem('fcm_token')
}
export function getStoredPrefs(): NotifPreferences {
  try {
    const raw = localStorage.getItem('notif_prefs')
    return raw ? (JSON.parse(raw) as NotifPreferences) : DEFAULT_PREFS
  } catch { return DEFAULT_PREFS }
}
export function storePrefs(prefs: NotifPreferences): void {
  localStorage.setItem('notif_prefs', JSON.stringify(prefs))
}
