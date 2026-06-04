/**
 * Script one-shot — création du premier compte administrateur
 * Usage : npx tsx src/scripts/createAdmin.ts
 *
 * Remplissez EMAIL, PASSWORD et NOM avant de lancer.
 */

import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Charge .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// ── À REMPLIR ───────────────────────────────────────────────────────────────
const EMAIL    = 'admin@sacrecoeur-brazza.cg'   // ← change ici
const PASSWORD = 'ChangeMe2025!'                // ← change ici (min 8 car.)
const NOM      = 'Administrateur Principal'     // ← change ici
// ────────────────────────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
}

async function main() {
  console.log('\n🔧 Création du compte administrateur...')
  console.log(`   Email : ${EMAIL}`)
  console.log(`   Nom   : ${NOM}\n`)

  const app  = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const db   = getFirestore(app)

  try {
    // 1. Créer le compte dans Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, EMAIL, PASSWORD)
    const uid  = cred.user.uid
    console.log(`✅ Compte Auth créé — UID : ${uid}`)

    // 2. Créer le profil dans Firestore (collection "users")
    await setDoc(doc(db, 'users', uid), {
      email: EMAIL,
      nom:   NOM,
      role:  'admin',
      actif: true,
    })
    console.log('✅ Profil Firestore créé (rôle : admin)')
    console.log('\n🎉 Compte admin prêt !')
    console.log(`   → Connectez-vous sur http://localhost:5173/admin/login`)
    console.log(`   → Email    : ${EMAIL}`)
    console.log(`   → Mot de passe : ${PASSWORD}`)
    console.log('\n⚠️  Pensez à changer le mot de passe après la première connexion.\n')

  } catch (err: unknown) {
    const e = err as { code?: string; message?: string }
    if (e.code === 'auth/email-already-in-use') {
      console.error('❌ Cet email est déjà utilisé. Compte non recréé.')
    } else {
      console.error('❌ Erreur :', e.message || err)
    }
    process.exit(1)
  }

  process.exit(0)
}

main()
