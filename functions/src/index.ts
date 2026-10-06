import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getMessaging } from 'firebase-admin/messaging'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'

initializeApp()

// Every chat message a parent sees is written by the teacher (create on
// classes/{classId}/messages is teacher-only per firestore.rules), so this
// one trigger covers every kind of update - plain chat, an assignment, an
// announcement, an event - since they all start life as the same message.
export const notifyOnNewMessage = onDocumentCreated('classes/{classId}/messages/{messageId}', async (event) => {
  const message = event.data?.data()
  if (!message) return

  const { classId } = event.params
  const db = getFirestore()

  const tokensSnap = await db.collection('classes').doc(classId).collection('pushTokens').get()
  const senderPhone = message.fromPhone as string | undefined

  const tokens = tokensSnap.docs
    .filter((d) => d.id !== senderPhone)
    .map((d) => d.data().token as string | undefined)
    .filter((token): token is string => !!token)

  if (tokens.length === 0) return

  const authorName = (message.authorName as string | undefined) ?? 'כיתת ענן'
  const text = (message.text as string | undefined) ?? ''
  const body = text.length > 120 ? `${text.slice(0, 120)}…` : text

  await getMessaging().sendEachForMulticast({
    tokens,
    notification: {
      title: authorName,
      body: body || 'עדכון חדש',
    },
    webpush: {
      fcmOptions: { link: '/teachdesh/' },
    },
  })
})
