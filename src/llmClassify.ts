import {
  GENERAL_SUBJECT,
  announcementIcon,
  assignmentIcon,
  cleanLine,
  eventIcon,
  extractSource,
  extractSubject,
  finalizeResult,
  resolveDate,
  type AnnouncementMeta,
  type AssignmentMeta,
  type ClassificationResult,
  type EventMeta,
} from './classify'

// The model never retypes message content - it only picks which line
// NUMBERS (from the numbered list we send it) belong to each segment. The
// app then builds the segment's text by slicing those exact original lines,
// so it is byte-for-byte identical to what the teacher wrote: no word can be
// dropped, reworded, or "cleaned up" by the model.
interface LLMSegment {
  category: string
  lines: number[]
  subject?: string
  source?: string
}

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const MODEL = 'gemini-2.0-flash'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const PROMPT = `למטה מופיעה הודעת מורה לאפליקציית כיתה, כרשימת שורות ממוספרות (כל שורה מתחילה במספר ואחריו נקודתיים). ההודעה יכולה להכיל כמה נושאים, ולעיתים מידע על אותו נושא (בעיקר מקצוע לימודי) מפוזר בכמה שורות לא-רצופות.

חשוב מאוד: את/ה *לא* כותב/ת או מעתיק/ה טקסט בעצמך. המשימה שלך היחידה היא לבחור אילו *מספרי שורות* משתייכים לאיזה מקטע. האפליקציה תשלוף את הטקסט המדויק לפי המספרים שתבחרי, כדי שאף מילה מההודעה המקורית לא תשונה או תושמט.

שלבי העבודה:
1. קראי את כל השורות הממוספרות מתחילתן ועד סופן.
2. זהי את כל המקצועות הלימודיים המוזכרים (למשל חשבון, שפה, תנ"ך) וכל שאר הנושאים (אירועים, הודעות כלליות).
3. עבור כל נושא/מקצוע, אספי לתוכו את *כל* מספרי השורות הרלוונטיים מכל ההודעה - גם אם הן לא רצופות. לדוגמה: שורת פתיחה שמזכירה את המקצוע, כל שורות הכותרת/התוכן שלו, וגם שורה נפרדת בהמשך שחלה על כמה מקצועות (כמו תאריך החזרה משותף) - שורה כזו צריכה להצטרף לכמה מקטעים אם היא רלוונטית לכולם.
4. תייגי כל מקטע לאחת מהקטגוריות:
   - "event": אירוע ביומן - מסיבה, טיול, חופשה/חופש, חג, אסיפה, טקס, אירוע עם תאריך אמיתי. תאריך בלבד בלי הקשר אירועי הוא לא "event".
   - "assignment": כל מה שקשור ללימודים - שיעורי בית, חומר לימודי, תרגול, מבחן/בוחן, עמודים לקריאה.
   - "announcement": הודעה כללית עם תאריך שאינה לימודית ואינה אירוע - תזכורת להביא משהו, טופס, ציוד.
5. שורות של ברכת פתיחה/סיום, תודות, חתימות, או איחולים כלליים שאין להן קטגוריה - פשוט אל תכללי את מספרן באף מקטע.
6. אם נושא (כמו חופשה) מוזכר בכמה שורות נפרדות בהודעה - כללי את כל השורות הרלוונטיות במקטע אחד בלבד, לא כמה מקטעים.

עבור כל מקטע ציין/י:
- category: אחת משלוש הקטגוריות.
- lines: מערך של מספרי השורות (מספרים שלמים בלבד) ששייכים למקטע הזה.
- subject: (רק למקטעי assignment) שם המקצוע, למשל: חשבון, שפה, תנ"ך, אנגלית. אם המטלה אינה קשורה למקצוע ספציפי, כתבי "${GENERAL_SUBJECT}".
- source: (רק למקטעי assignment, אם רלוונטי) איפה המשימה נמצאת בפועל - שם הטקסט/הסיפור שחולק לתלמידים, שם החוברת, או שם האתר. השאירי ריק אם לא מוזכר מקור ספציפי (למשל עמודים בספר לימוד רגיל).

החזירי אך ורק מערך JSON תקין במבנה [{ "category": "...", "lines": [0, 3, 7], "subject": "...", "source": "..." }], ללא הסבר וללא markdown.`

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
}

function buildRequestBody(lines: string[]) {
  const numbered = lines.map((l, i) => `${i}: ${l}`).join('\n')
  return {
    contents: [{ parts: [{ text: `${PROMPT}\n\nשורות ההודעה:\n${numbered}` }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            category: { type: 'STRING', enum: ['event', 'assignment', 'announcement'] },
            lines: { type: 'ARRAY', items: { type: 'INTEGER' } },
            subject: { type: 'STRING' },
            source: { type: 'STRING' },
          },
          required: ['category', 'lines'],
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

function isValidSegment(seg: unknown, lineCount: number): seg is LLMSegment {
  if (!seg || typeof seg !== 'object') return false
  const s = seg as Record<string, unknown>
  if (typeof s.category !== 'string' || !['event', 'assignment', 'announcement'].includes(s.category)) return false
  if (!Array.isArray(s.lines) || s.lines.length === 0) return false
  return s.lines.every((n) => Number.isInteger(n) && n >= 0 && n < lineCount)
}

// Builds the segment's text verbatim from the original lines it references -
// the model only ever supplies line numbers, never the words themselves.
function textForSegment(seg: LLMSegment, lines: string[]): string {
  const indices = [...new Set(seg.lines)].sort((a, b) => a - b)
  return indices
    .map((i) => cleanLine(lines[i]))
    .filter(Boolean)
    .join(' · ')
}

function dedupeKey(text: string): string {
  return text.slice(0, 18)
}

function buildMetasFromSegments(segments: LLMSegment[], lines: string[], sentAt: Date) {
  const events: EventMeta[] = []
  const assignments: AssignmentMeta[] = []
  const announcements: AnnouncementMeta[] = []
  const seenKeys = new Set<string>()

  for (const seg of segments) {
    const text = textForSegment(seg, lines)
    if (!text) continue

    const key = `${seg.category}:${seg.subject ?? ''}:${dedupeKey(text)}`
    if (seenKeys.has(key)) continue
    seenKeys.add(key)

    const resolved = resolveDate(text, sentAt)

    if (seg.category === 'event') {
      events.push({
        title: text,
        date: resolved.label,
        dateIso: resolved.iso,
        icon: eventIcon(text),
        location: 'בית הספר',
      })
    } else if (seg.category === 'assignment') {
      const iconMatch = extractSubject(seg.subject ?? text)
      assignments.push({
        subject: seg.subject?.trim() || GENERAL_SUBJECT,
        source: seg.source?.trim() || extractSource(text),
        content: text,
        icon: iconMatch?.icon ?? assignmentIcon(text),
        dateLabel: resolved.label,
        dateIso: resolved.iso,
        weekday: resolved.weekday,
      })
    } else if (seg.category === 'announcement') {
      announcements.push({
        text,
        icon: announcementIcon(text),
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

  const lines = splitLines(text)
  if (lines.length === 0) return null

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)

    const res = await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(buildRequestBody(lines)),
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

    const segments = parsed.filter((s): s is LLMSegment => isValidSegment(s, lines.length))
    const { events, assignments, announcements } = buildMetasFromSegments(segments, lines, sentAt)

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
