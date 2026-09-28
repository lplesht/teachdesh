import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// Firebase's web config isn't a secret (it only identifies the project;
// real security comes from firestore.rules/storage.rules) - safe to embed
// directly, with env vars able to override it for local dev if needed.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBETN0Ym4ZY7PznVjIvJ8pOMyYr0bAxuYo',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'teachdash-6b39d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'teachdash-6b39d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'teachdash-6b39d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '500972301497',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:500972301497:web:22b90307ae6bff97403f68',
}

// True once project config is available - lets the app show a clear setup
// notice instead of crashing if it's ever missing.
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
