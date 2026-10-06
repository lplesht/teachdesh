import { doc, deleteDoc, setDoc } from 'firebase/firestore'
import { getToken, getMessaging, isSupported, onMessage, type Messaging } from 'firebase/messaging'
import { app, db, ensureSignedIn } from './firebase'

// Not a secret (same as the rest of firebaseConfig) - just identifies which
// Web Push certificate the browser should subscribe through.
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined

function pushTokenDoc(classId: string, phone: string) {
  return doc(db!, 'classes', classId, 'pushTokens', phone)
}

export type EnablePushResult = { ok: true } | { ok: false; error: string }

// Asks for notification permission, subscribes this browser to Web Push via
// FCM, and stores the resulting token so the notifyOnNewMessage Cloud
// Function (functions/src/index.ts) can find it. Each viewer only ever
// writes their own classes/{classId}/pushTokens/{phone} doc - see
// firestore.rules.
export async function enablePushNotifications(classId: string, phone: string, displayName: string): Promise<EnablePushResult> {
  if (!db || !app) return { ok: false, error: 'האפליקציה לא מחוברת למסד נתונים' }
  if (!VAPID_KEY) return { ok: false, error: 'התראות עדיין לא הוגדרו באפליקציה' }
  if (typeof Notification === 'undefined' || !(await isSupported())) {
    return { ok: false, error: 'הדפדפן הזה לא תומך בהתראות' }
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return { ok: false, error: 'לא ניתנה הרשאה להתראות' }

  try {
    await ensureSignedIn()
    const registration = await navigator.serviceWorker.ready
    const messaging = getMessaging(app)
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
    if (!token) return { ok: false, error: 'לא התקבל טוקן התראות, נסי שוב' }

    await setDoc(pushTokenDoc(classId, phone), { token, displayName })
    return { ok: true }
  } catch {
    return { ok: false, error: 'שגיאה בהפעלת התראות, נסי שוב' }
  }
}

export async function disablePushNotifications(classId: string, phone: string): Promise<void> {
  if (!db) return
  await deleteDoc(pushTokenDoc(classId, phone))
}

// Fires while the app is open and in the foreground - the service worker's
// 'push' handler (src/sw.js) only takes over when it's backgrounded/closed.
export async function onForegroundPush(callback: (title: string, body: string) => void): Promise<() => void> {
  if (!app || !(await isSupported())) return () => {}
  const messaging: Messaging = getMessaging(app)
  return onMessage(messaging, (payload) => {
    const notification = payload.notification
    if (!notification) return
    callback(notification.title ?? 'כיתת ענן', notification.body ?? '')
  })
}
