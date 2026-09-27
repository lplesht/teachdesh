import {
  announcementIcon,
  assignmentIcon,
  cleanLine,
  eventIcon,
  extractSubject,
  finalizeResult,
  resolveDate,
  truncate,
  type AnnouncementMeta,
  type AssignmentMeta,
  type ClassificationResult,
  type EventMeta,
} from './classify'

interface LLMSegment {
  category: 'event' | 'assignment' | 'announcement'
  text: string
  subject?: string
  dateHint?: string
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const MODEL = 'gemini-2.0-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const PROMPT = `את/ה מסווג/ת הודעות עבור אפליקציית כיתה. המורה שולחת הודעה שעשויה לכלול כמה נושאים שונים בבת אחת.
פרקי את ההודעה למקטעים - כל מקטע הוא נושא עצמאי אחד - ותייגי כל מקטע לאחת מהקטגוריות:
- "event": אירוע ביומן - מסיבה, טיול, חופשה/חופש, חג, אסיפה, טקס, אירוע עם תאריך אמיתי. תאריך בלבד בלי הקשר אירועי הוא לא "event".
- "assignment": שיעורי בית, חומר לימודי, תרגול, מבחן/בוחן, עמודים לקריאה - כל מה שקשור ללימודים.
- "announcement": הודעה כללית עם תאריך שהיא לא לימודית ולא אירוע - תזכורת להביא משהו, טופס, ציוד.
התעלמי משורות של ברכות/תודות/חתימה שלא שייכות לאף קטגוריה - אל תכללי אותן בפלט.
בכל מקטע: שמרי על הניסוח המקורי של המורה ככל האפשר (אל תסכמי/תנסחי מחדש), נקי מסימני רשימה (•, *).
אם המקטע קשור ללימודים, ציין/י בשדה subject את המקצוע (למשל: חשבון, שפה, תנ"ך, אנגלית).
אם מוזכר בהודעה תאריך או ביטוי יחסי (כמו "מחר", "היום", "4.10") שרלוונטי למקטע הזה, ציין/י אותו בשדה dateHint בדיוק כפי שנכתב.
החזירי אך ורק מערך JSON תקין, ללא הסבר וללא markdown.`

function buildRequestBody(text: string) {
  return {
    contents: [{ parts: [{ text: `${PROMPT}\n\nהודעת המורה:\n"""\n${text}\n"""` }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            category: { type: 'STRING', enum: ['event', 'assignment', 'announcement'] },
            text: { type: 'STRING' },
            subject: { type: 'STRING' },
            dateHint: { type: 'STRING' },
          },
          required: ['category', 'text'],
        },
      },
    },
  }
}

function buildMetasFromSegments(segments: LLMSegment[], sentAt: Date) {
  const events: EventMeta[] = []
  const assignments: AssignmentMeta[] = []
  const announcements: AnnouncementMeta[] = []

  for (const seg of segments) {
    const cleaned = cleanLine(seg.text ?? '')
    if (!cleaned) continue
    const resolved = resolveDate(seg.dateHint ?? seg.text ?? '', sentAt)

    if (seg.category === 'event') {
      events.push({
        title: truncate(cleaned, 60),
        date: resolved.label,
        dateIso: resolved.iso,
        icon: eventIcon(seg.text ?? ''),
        location: 'בית הספר',
      })
    } else if (seg.category === 'assignment') {
      const iconMatch = extractSubject(seg.subject ?? cleaned)
      assignments.push({
        subject: seg.subject,
        text: truncate(cleaned, 200),
        icon: iconMatch?.icon ?? assignmentIcon(cleaned),
        dateLabel: resolved.label,
        dateIso: resolved.iso,
        weekday: resolved.weekday,
      })
    } else if (seg.category === 'announcement') {
      announcements.push({
        text: cleaned,
        icon: announcementIcon(seg.text ?? ''),
        dateLabel: resolved.label,
      })
    }
  }

  return { events, assignments, announcements }
}

// Tries an LLM-based classification (free-tier Gemini) for better handling of
// long, multi-topic real-world messages than the regex/keyword classifier can
// manage. Returns null on any failure (missing key, network error, bad
// response) so the caller can fall back to the rule-based classifyMessage.
export async function classifyWithLLM(text: string, hasPhoto: boolean, sentAt: Date = new Date()): Promise<ClassificationResult | null> {
  if (!API_KEY) return null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(buildRequestBody(text)),
    })
    clearTimeout(timeout)
    if (!res.ok) return null

    const data = await res.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof raw !== 'string') return null

    const segments = JSON.parse(raw)
    if (!Array.isArray(segments)) return null

    const { events, assignments, announcements } = buildMetasFromSegments(segments, sentAt)
    return finalizeResult(hasPhoto, events, assignments, announcements)
  } catch {
    return null
  }
}
