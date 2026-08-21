// Supabase Edge Function — envoie une notification push à tous les abonnés
// (ou un sous-groupe) via l'API FCM HTTP v1, à partir des tokens stockés dans
// public.notification_tokens. Appelée depuis AdminNotificationsPage.tsx via
// supabase.functions.invoke('send-notification', { body: { titre, corps, url, type } }).
//
// Secret requis (à définir soi-même, jamais dans ce fichier ni dans le repo) :
//   FCM_SERVICE_ACCOUNT — le JSON complet d'un compte de service Firebase
//   (Firebase Console → Paramètres du projet → Comptes de service → Générer
//   une nouvelle clé privée), avec le rôle "Firebase Cloud Messaging API Admin".
//   À définir via Dashboard Supabase → Edge Functions → send-notification → Secrets,
//   ou `supabase secrets set FCM_SERVICE_ACCOUNT='{...}'`.

import { createClient } from 'npm:@supabase/supabase-js@2'

const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'

interface ServiceAccount {
  project_id: string
  client_email: string
  private_key: string
}

function base64url(bytes: Uint8Array): string {
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64urlFromString(input: string): string {
  return base64url(new TextEncoder().encode(input))
}

async function getAccessToken(serviceAccount: ServiceAccount): Promise<string> {
  const header = { alg: 'RS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const claim = {
    iss: serviceAccount.client_email,
    scope: FCM_SCOPE,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }
  const signingInput = `${base64urlFromString(JSON.stringify(header))}.${base64urlFromString(JSON.stringify(claim))}`

  const pemBody = serviceAccount.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '')
  const binaryDer = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  const key = await crypto.subtle.importKey(
    'pkcs8', binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false, ['sign'],
  )
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput))
  const jwt = `${signingInput}.${base64url(new Uint8Array(signature))}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`Erreur OAuth Google : ${await res.text()}`)
  const data = await res.json()
  return data.access_token as string
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Méthode non autorisée' }), { status: 405 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const authHeader = req.headers.get('Authorization') ?? ''
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData.user) {
    return new Response(JSON.stringify({ error: 'Non authentifié' }), { status: 401 })
  }

  const { data: isStaff, error: staffErr } = await userClient.rpc('is_staff')
  if (staffErr || !isStaff) {
    return new Response(JSON.stringify({ error: 'Accès réservé au personnel autorisé' }), { status: 403 })
  }

  let body: { titre?: string; corps?: string; url?: string; type?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Corps de requête invalide' }), { status: 400 })
  }
  const { titre, corps, url, type } = body
  if (!titre?.trim() || !corps?.trim()) {
    return new Response(JSON.stringify({ error: 'Titre et message requis' }), { status: 400 })
  }
  const cible = type ?? 'tous'

  const admin = createClient(supabaseUrl, serviceRoleKey)
  const { data: tokenRows, error: tokensErr } = await admin
    .from('notification_tokens')
    .select('token, prefs')
  if (tokensErr) {
    return new Response(JSON.stringify({ error: tokensErr.message }), { status: 500 })
  }

  const targets = (tokenRows ?? []).filter(r => cible === 'tous' || r.prefs?.[cible] === true)
  if (targets.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  }

  const serviceAccountRaw = Deno.env.get('FCM_SERVICE_ACCOUNT')
  if (!serviceAccountRaw) {
    return new Response(JSON.stringify({ error: 'FCM_SERVICE_ACCOUNT non configuré côté Edge Function' }), { status: 500 })
  }
  const serviceAccount: ServiceAccount = JSON.parse(serviceAccountRaw)
  const accessToken = await getAccessToken(serviceAccount)

  const results = await Promise.all(targets.map(async (row) => {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: row.token,
          notification: { title: titre, body: corps },
          webpush: { fcm_options: { link: url || '/' } },
        },
      }),
    })
    if (res.ok) return { ok: true, token: row.token }
    const errBody = await res.json().catch(() => null)
    const errorCode = errBody?.error?.details?.find((d: { errorCode?: string }) => d.errorCode)?.errorCode
    const invalid = res.status === 404 || errorCode === 'UNREGISTERED' || errorCode === 'INVALID_ARGUMENT'
    return { ok: false, token: row.token, invalid }
  }))

  const sent = results.filter(r => r.ok).length
  const invalidTokens = results.filter(r => !r.ok && r.invalid).map(r => r.token)
  if (invalidTokens.length > 0) {
    await admin.from('notification_tokens').delete().in('token', invalidTokens)
  }

  await admin.from('notifications_log').insert({
    titre, corps, url: url || '/', type: cible, envoye: sent, created_by: userData.user.id,
  })

  return new Response(JSON.stringify({ sent }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
