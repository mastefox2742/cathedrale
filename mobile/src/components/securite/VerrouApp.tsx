import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AppState, View, Text, Pressable, StyleSheet, Platform, Image } from 'react-native'
import * as LocalAuthentication from 'expo-local-authentication'
import { supabase } from '../../services/supabase'
import { colors, fonts, radius } from '../../theme/colors'

/**
 * Verrouillage automatique : pour une personne connectée, l'application se
 * verrouille après 10 minutes en arrière-plan (et à chaque démarrage) et se
 * déverrouille par empreinte, visage ou code du téléphone. Sans verrouillage
 * configuré sur le téléphone, rien n'est imposé.
 */

const DELAI_MS = 10 * 60 * 1000

export function VerrouApp({ children }: { children: ReactNode }) {
  const [verrouille, setVerrouille] = useState(false)
  const quitteA = useRef<number | null>(Date.now() - DELAI_MS) // démarrage = verrouillage si connecté

  async function peutVerrouiller(): Promise<boolean> {
    if (Platform.OS === 'web') return false
    const { data } = await supabase.auth.getSession()
    if (!data.session) return false
    return (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE
  }

  async function deverrouiller() {
    const r = await LocalAuthentication.authenticateAsync({
      promptMessage: "Déverrouiller l'application",
      cancelLabel: 'Annuler',
      disableDeviceFallback: false, // code du téléphone accepté
    })
    if (r.success) { setVerrouille(false); quitteA.current = null }
  }

  async function verifier() {
    const depuis = quitteA.current
    if (depuis !== null && Date.now() - depuis >= DELAI_MS && (await peutVerrouiller())) {
      setVerrouille(true)
      deverrouiller()
    } else {
      quitteA.current = null
    }
  }

  useEffect(() => {
    verifier()
    const sub = AppState.addEventListener('change', etat => {
      if (etat === 'background') quitteA.current = Date.now()
      else if (etat === 'active') verifier()
    })
    return () => sub.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {children}
      {verrouille && (
        <View style={s.voile}>
          <Image source={require('../../../assets/icon.png')} style={s.logo} />
          <Text style={s.titre}>Application verrouillée</Text>
          <Text style={s.texte}>Par sécurité, confirmez que c'est bien vous.</Text>
          <Pressable onPress={deverrouiller} style={s.bouton}><Text style={s.boutonTexte}>Déverrouiller</Text></Pressable>
          <Pressable onPress={async () => { await supabase.auth.signOut(); setVerrouille(false) }}>
            <Text style={s.lien}>Se déconnecter</Text>
          </Pressable>
        </View>
      )}
    </>
  )
}

const s = StyleSheet.create({
  voile: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  logo: { width: 72, height: 72, borderRadius: 36 },
  titre: { fontFamily: fonts.heading, fontSize: 22, color: colors.primary },
  texte: { fontFamily: fonts.sans, fontSize: 13, color: colors.mutedForeground, textAlign: 'center' },
  bouton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 13, paddingHorizontal: 32, marginTop: 8 },
  boutonTexte: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primaryForeground },
  lien: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, textDecorationLine: 'underline', marginTop: 6 },
})
