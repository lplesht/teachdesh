import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// True only once real project config has been baked in at build time - lets
// the app show a clear setup notice instead of crashing when it hasn't.
export const firebaseReady = !!firebaseConfig.apiKey

let app: FirebaseApp | undefined
let db: Firestore | undefined
let storage: FirebaseStorage | undefined
let auth: Auth | undefined

if (firebaseReady) {
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  storage = getStorage(app)
  auth = getAuth(app)
}

export { db, storage, auth }

// Single fixed class for now - no multi-class picker or real login yet.
export const CLASS_ID = 'g4'

let signInPromise: Promise<void> | null = null

// No login UI yet - every visitor (teacher or parent) is signed in anonymously
// so Firestore/Storage rules can at least require request.auth != null.
// Real per-role accounts are a follow-up phase.
export function ensureSignedIn(): Promise<void> {
  if (!auth) return Promise.resolve()
  if (signInPromise) return signInPromise

  signInPromise = new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth!, (user) => {
      unsubscribe()
      if (user) {
        resolve()
        return
      }
      signInAnonymously(auth!)
        .catch((err) => console.warn('Firebase anonymous sign-in failed', err))
        .finally(resolve)
    })
  })
  return signInPromise
}
