import { useEffect, useState } from 'react'
import { View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Linking } from 'react-native'
import { supabase } from '../../services/supabase'
import { colors, fonts, radius } from '../../theme/colors'

/**
 * Code de double authentification (TOTP) : demandé après le mot de passe
 * quand le compte en est équipé, et obligatoire pour l'espace staff.
 * L'enrôlement (QR code) se fait sur le site : Espace membre › Sécurité du compte.
 */
export function CodeMfa({ onSucces, onAnnuler, obligatoire = false }: { onSucces: () => void; onAnnuler?: () => void; obligatoire?: boolean }) {
  const [factorId, setFactorId] = useState<string | null | undefined>(undefined)
  const [code, setCode] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.mfa.listFactors().then(({ data }) => {
      setFactorId(data?.totp.find(f => f.status === 'verified')?.id ?? null)
    })
  }, [])

  async function valider() {
    if (!factorId || !/^\d{6}$/.test(code)) { setErreur('Saisissez les 6 chiffres de votre application.'); return }
    setEnvoi(true)
    setErreur(null)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    setEnvoi(false)
    if (error) { setErreur('Code incorrect ou expiré.'); setCode(''); return }
    onSucces()
  }

  if (factorId === undefined) return <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />

  if (!factorId) {
    return (
      <View style={s.carte}>
        <Text style={s.titre}>Double authentification requise</Text>
        <Text style={s.texte}>
          {obligatoire
            ? "L'espace staff exige une double authentification. Activez-la une première fois sur le site (Espace membre › Sécurité du compte), puis revenez ici."
            : 'Aucune application d\'authentification n\'est associée à ce compte.'}
        </Text>
        <Pressable onPress={() => Linking.openURL(`${process.env.EXPO_PUBLIC_SITE_URL ?? 'https://cathedrale.vercel.app'}/connexion`)} style={s.bouton}>
          <Text style={s.boutonTexte}>Ouvrir le site</Text>
        </Pressable>
        {onAnnuler && <Pressable onPress={onAnnuler}><Text style={s.lien}>Retour</Text></Pressable>}
      </View>
    )
  }

  return (
    <View style={s.carte}>
      <Text style={s.titre}>Code de sécurité</Text>
      <Text style={s.texte}>Ouvrez votre application d'authentification et saisissez le code à 6 chiffres.</Text>
      <TextInput
        value={code} onChangeText={t => setCode(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" autoFocus
        placeholder="000000" placeholderTextColor={colors.mutedForeground} style={s.champ}
      />
      {erreur && <Text style={s.erreur}>{erreur}</Text>}
      <Pressable onPress={valider} disabled={envoi} style={[s.bouton, envoi && { opacity: 0.7 }]}>
        {envoi ? <ActivityIndicator color={colors.primaryForeground} /> : <Text style={s.boutonTexte}>Valider</Text>}
      </Pressable>
      {onAnnuler && <Pressable onPress={onAnnuler}><Text style={s.lien}>Annuler</Text></Pressable>}
    </View>
  )
}

const s = StyleSheet.create({
  carte: { margin: 20, marginTop: 60, padding: 22, backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, gap: 14 },
  titre: { fontFamily: fonts.heading, fontSize: 20, color: colors.primary },
  texte: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.mutedForeground },
  champ: { fontSize: 24, letterSpacing: 8, textAlign: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingVertical: 12, color: colors.foreground },
  erreur: { fontFamily: fonts.sans, fontSize: 12, color: colors.destructive },
  bouton: { backgroundColor: colors.primary, borderRadius: radius.md, paddingVertical: 13, alignItems: 'center' },
  boutonTexte: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.primaryForeground },
  lien: { fontFamily: fonts.sans, fontSize: 12, color: colors.mutedForeground, textAlign: 'center', textDecorationLine: 'underline' },
})
