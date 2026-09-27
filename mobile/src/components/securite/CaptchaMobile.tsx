import { View, Platform } from 'react-native'
import { WebView } from 'react-native-webview'

/**
 * CAPTCHA Cloudflare Turnstile dans l'application : la page /captcha-mobile du
 * site affiche la vérification et renvoie le jeton à l'application. Le jeton
 * est ensuite vérifié par Supabase Auth, comme sur le site.
 *
 * Inactif tant que EXPO_PUBLIC_TURNSTILE_SITE_KEY n'est pas défini.
 */

export const CAPTCHA_ACTIF = !!process.env.EXPO_PUBLIC_TURNSTILE_SITE_KEY
const SITE = process.env.EXPO_PUBLIC_SITE_URL ?? 'https://cathedrale.vercel.app'

/** Changer `cycle` recharge la vérification (un jeton ne sert qu'une fois). */
export function CaptchaMobile({ onJeton, cycle = 0 }: { onJeton: (jeton: string | null) => void; cycle?: number }) {
  if (!CAPTCHA_ACTIF || Platform.OS === 'web') return null
  return (
    <View style={{ height: 80, overflow: 'hidden', borderRadius: 8 }}>
      <WebView
        key={cycle}
        source={{ uri: `${SITE}/captcha-mobile` }}
        originWhitelist={[SITE]}
        onMessage={e => {
          const d = e.nativeEvent.data
          onJeton(d && d !== 'expire' ? d : null)
        }}
        onLoadStart={() => onJeton(null)}
        javaScriptEnabled
        setSupportMultipleWindows={false}
        style={{ backgroundColor: 'transparent' }}
      />
    </View>
  )
}
