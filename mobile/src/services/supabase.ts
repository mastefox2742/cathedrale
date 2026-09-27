import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import { stockageSecurise } from './stockageSecurise'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Session chiffrée, clé dans le Keychain / Keystore (jamais en clair).
    storage: stockageSecurise,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
