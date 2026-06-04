/**
 * Script one-shot — crée uniquement le profil Firestore pour un UID existant
 * Usage : npx tsx src/scripts/createAdminProfile.ts
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const UID   = 'NiaLMzLBNBdDjv5spocDZRgDcCq1'
const EMAIL = 'admin@sacrecoeur-brazza.cg'
const NOM   = 'Administrateur Principal'

const app = initializeApp({
  apiKey:            process.env.VITE_FIREBASE_API_KEY,
  authDomain:        process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.VITE_FIREBASE_APP_ID,
})

const db = getFirestore(app)

console.log(`\n📝 Création du profil Firestore pour UID : ${UID}`)

setDoc(doc(db, 'users', UID), {
  email: EMAIL,
  nom:   NOM,
  role:  'admin',
  actif: true,
})
.then(() => {
  console.log('✅ Profil créé dans Firestore !')
  console.log('\n🎉 Compte admin 100% opérationnel.')
  console.log(`   → http://localhost:5173/admin/login`)
  console.log(`   → Email : ${EMAIL}`)
  console.log(`   → Mot de passe : ChangeMe2025!\n`)
  process.exit(0)
})
.catch(err => {
  console.error('❌ Erreur Firestore :', err.message)
  process.exit(1)
})
