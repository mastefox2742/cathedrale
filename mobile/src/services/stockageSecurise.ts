import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'
import aesjs from 'aes-js'

/**
 * Stockage de la session Supabase (jetons d'accès et de renouvellement).
 *
 * Jamais en clair dans AsyncStorage : la session est chiffrée en AES-256 (CTR)
 * avec une clé aléatoire propre à chaque écriture, gardée dans le Keychain iOS
 * / Keystore Android (expo-secure-store). Seul le texte chiffré va dans
 * AsyncStorage, car SecureStore limite la taille des valeurs à ~2 Ko.
 *
 * Sur le web (aperçu Expo), SecureStore n'existe pas : stockage du navigateur.
 */

const cleSure = (cle: string) => `k_${cle.replace(/[^\w.-]/g, '_')}`

async function chiffrer(cle: string, valeur: string): Promise<string> {
  const octets = Crypto.getRandomBytes(32)
  await SecureStore.setItemAsync(cleSure(cle), aesjs.utils.hex.fromBytes(octets), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  })
  const aes = new aesjs.ModeOfOperation.ctr(octets, new aesjs.Counter(1))
  return aesjs.utils.hex.fromBytes(aes.encrypt(aesjs.utils.utf8.toBytes(valeur)))
}

async function dechiffrer(cle: string, texte: string): Promise<string | null> {
  const hex = await SecureStore.getItemAsync(cleSure(cle))
  if (!hex) return null
  const aes = new aesjs.ModeOfOperation.ctr(aesjs.utils.hex.toBytes(hex), new aesjs.Counter(1))
  return aesjs.utils.utf8.fromBytes(aes.decrypt(aesjs.utils.hex.toBytes(texte)))
}

export const stockageSecurise = {
  async getItem(cle: string): Promise<string | null> {
    if (Platform.OS === 'web') return AsyncStorage.getItem(cle)
    const texte = await AsyncStorage.getItem(cle)
    if (!texte) return null
    try {
      const valeur = await dechiffrer(cle, texte)
      // Ancienne session enregistrée en clair (versions précédentes) : effacée.
      if (valeur === null) await AsyncStorage.removeItem(cle)
      return valeur
    } catch {
      await AsyncStorage.removeItem(cle)
      return null
    }
  },
  async setItem(cle: string, valeur: string): Promise<void> {
    if (Platform.OS === 'web') return AsyncStorage.setItem(cle, valeur)
    await AsyncStorage.setItem(cle, await chiffrer(cle, valeur))
  },
  async removeItem(cle: string): Promise<void> {
    await AsyncStorage.removeItem(cle)
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(cleSure(cle))
  },
}
