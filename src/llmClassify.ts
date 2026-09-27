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
  category: string
  text: string
  subject?: string
  dateHint?: string
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const MODEL = 'gemini-2.0-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const PROMPT = `את/ה מסווג/ת הודעות עבור אפליקציית כיתה. המורה שולחת הודעה אחת שיכולה להכיל כמה נושאים שונים, ולעיתים מידע על אותו נושא (בעיקר מקצוע לימודי) מפוזר בכמה מקומות לא-רצופים בהודעה - לא רק בפסקה אחת.

שלבי העבודה:
1. קראי את ההודעה כולה מתחילתה ועד סופה לפני שאת מחליטה על החלוקה.
2. זהי את כל המקצועות הלימודיים המוזכרים (למשל חשבון, שפה, תנ"ך) וכל שאר הנושאים (אירועים, הודעות כלליות).
3. עבור כל מקצוע לימודי, אחדי למקטע "assignment" אחד את *כל* המידע הרלוונטי מכל ההודעה - גם אם הוא כתוב בפסקאות נפרדות ולא רצופות. לדוגמה: אם בפתיחת ההודעה נכתב "הכנו משימות בשפה ובחשבון", ובהמשך יש כותרת "שפה" עם תוכן, ובסוף ההודעה יש הערה כללית ("יש להחזיר את החוברות עד 4.10") שחלה על כל המקצועות - ההערה הכללית עם התאריך צריכה להצטרף (משוכפלת אם צריך) לכל אחד ממקטעי ה-assignment של המקצועות הרלוונטיים, לא להישאר מקטע נפרד בלי מקצוע.
4. תייגי כל מקטע לאחת מהקטגוריות:
   - "event": אירוע ביומן - מסיבה, טיול, חופשה/חופש, חג, אסיפה, טקס, אירוע עם תאריך אמיתי. תאריך בלבד בלי הקשר אירועי הוא לא "event".
   - "assignment": כל מה שקשור ללימודים - שיעורי בית, חומר לימודי, תרגול, מבחן/בוחן, עמודים לקריאה.
   - "announcement": הודעה כללית עם תאריך שאינה לימודית ואינה אירוע - תזכורת להביא משהו, טופס, ציוד.

חשוב מאוד:
- אם נושא מסוים (למשל חופשה, טיול, אירוע) מוזכר יותר מפעם אחת בהודעה (בפתיחה, בהמשך, בסיום, בברכה) - הוא חייב להפוך למקטע אחד בלבד, לא כמה מקטעים. בחרי את הניסוח המלא/המידעי ביותר שמכיל את התאריך.
- אל תכללי בשדה text את שורת הכותרת/הכתובת של המקטע (כמו "🔢 2. חשבון" או "📖 1. שפה" או מספור/אמוג'י פתיחה) - המקצוע כבר מצוין בשדה subject, אין צורך לחזור עליו בטקסט.
- אל תכללי בפלט שורות של ברכת פתיחה/סיום, תודות, חתימות, או איחולים כלליים (כמו "חופשה נעימה") שאינן מידע חדש.
- שמרי על ניסוח המורה המקורי במידת האפשר, אבל כשאת מאחדת מידע ממקומות שונים בהודעה למקטע אחד - את יכולה לחבר בין המשפטים בצורה קוהרנטית. נקי מסימני רשימה (•) וכוכביות הדגשה (*).
- אם המקטע קשור ללימודים, ציין/י בשדה subject את המקצוע (למשל: חשבון, שפה, תנ"ך, אנגלית).
- אם מוזכר תאריך או ביטוי יחסי (כמו "מחר", "היום", "4.10") שרלוונטי למקטע, ציין/י אותו בשדה dateHint בדיוק כפי שנכתב.

החזירי אך ורק מערך JSON תקין במבנה [{ "category": "...", "text": "...", "subject": "...", "dateHint": "..." }], ללא הסבר וללא markdown.`

function buildRequestBody(text: string) {
  return {
    contents: [{ parts: [{ text: `${PROMPT}\n\nהודעת המורה:\n"""\n${text}\n"""` }] }],
    generationConfig: {
      temperature: 0.1,
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

// Gemini sometimes wraps JSON in a ```json fence even with responseMimeType set,
// and can occasionally add stray text around it - extract the array robustly.
function extractJsonArray(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : raw
  const start = candidate.indexOf('[')
  const end = candidate.lastIndexOf(']')
  const sliced = start !== -1 && end !== -1 ? candidate.slice(start, end + 1) : candidate
  return JSON.parse(sliced)
}

function isValidSegment(seg: unknown): seg is LLMSegment {
  if (!seg || typeof seg !== 'object') return false
  const s = seg as Record<string, unknown>
  return (
    typeof s.category === 'string' &&
    ['event', 'assignment', 'announcement'].includes(s.category) &&
    typeof s.text === 'string' &&
    s.text.trim().length > 0
  )
}

// Cheap safety net against the model still emitting near-duplicate segments
// for the same topic (e.g. a vacation mentioned in both the opening and the
// closing of a message) despite the prompt telling it not to.
function dedupeKey(text: string): string {
  return cleanLine(text).slice(0, 18)
}

function buildMetasFromSegments(segments: LLMSegment[], sentAt: Date) {
  const events: EventMeta[] = []
  const assignments: AssignmentMeta[] = []
  const announcements: AnnouncementMeta[] = []
  const seenKeys = new Set<string>()

  for (const seg of segments) {
    const cleaned = cleanLine(seg.text)
    if (!cleaned) continue

    const key = `${seg.category}:${seg.subject ?? ''}:${dedupeKey(seg.text)}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)

    const resolved = resolveDate(seg.dateHint ?? seg.text, sentAt)

    if (seg.category === 'event') {
      events.push({
        title: truncate(cleaned, 60),
        date: resolved.label,
        dateIso: resolved.iso,
        icon: eventIcon(seg.text),
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
        icon: announcementIcon(seg.text),
        dateLabel: resolved.label,
      })
    }
  }

  return { events, assignments, announcements }
}

// Tries an LLM-based classification (free-tier Gemini) for better handling of
// long, multi-topic real-world messages than the regex/keyword classifier can
// manage. Returns null on any failure (missing key, network error, bad
// response, or a response that yields nothing usable) so the caller falls
// back to the rule-based classifyMessage instead of showing a broken result.
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
    if (!res.ok) {
      console.warn('Gemini classification request failed', res.status, await res.text().catch(() => ''))
      return null
    }

    const data = await res.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof raw !== 'string') return null

    const parsed = extractJsonArray(raw)
    if (!Array.isArray(parsed)) return null

    const segments = parsed.filter(isValidSegment)
    const { events, assignments, announcements } = buildMetasFromSegments(segments, sentAt)

    if (events.length === 0 && assignments.length === 0 && announcements.length === 0) {
      // A rich message that came back with nothing usable is more likely a
      // parsing/prompt miss than a genuine "nothing to categorize" - prefer
      // the deterministic fallback over showing an empty result.
      return null
    }

    return finalizeResult(hasPhoto, events, assignments, announcements)
  } catch (err) {
    console.warn('Gemini classification failed, falling back', err)
    return null
  }
}
