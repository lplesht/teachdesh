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
// Both "gemini-flash-latest" and "gemini-flash-lite-latest" came back with
// the identical "high demand" 503 even after retries - suspicious enough to
// suggest this may not be per-model capacity at all (could be an
// account/project-level quota warm-up on a brand new API key). Trying a
// separately-served stable snapshot instead of another alias, as a more
// meaningful test of that theory.
const MODEL = 'gemini-2.5-flash-lite'
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

const PROMPT = `זהו החלק הכי חשוב במערכת הזו - הניתוב הזה הוא הלב של האפליקציה, וההורים סומכים עליו כדי לא לפספס אף מטלה. תעבדי לאט, בקפידה, ותקראי את ההודעה *כולה* מתחילתה ועד סופה לפני שאת מחליטה משהו.

למטה מופיעה הודעת מורה לאפליקציית כיתה, כרשימת שורות ממוספרות (כל שורה מתחילה במספר ואחריו נקודתיים). שימי לב: שורות ריקות הוסרו לפני המספור - כלומר רצף מספרים עוקב לא אומר שאין ביניהם מעבר פסקה, וריווח חזותי בהודעה המקורית *לא* מופיע כאן. לכן אסור לך להתבסס על מרחק/ריווח כדי להחליט אם שורה שייכת לנושא הקודם או לא - תמיד תשפטי לפי התוכן והמשמעות בלבד.

מורות שונות כותבות בסגנונות שונים לגמרי, ואת חייבת להתמודד עם כולם:
- חלק כותבות עם כותרות ברורות לכל מקצוע (למשל "📖 1. תנ״ך" ואז שורות בולטים מתחתיה).
- חלק כותבות בלי שום כותרת או בולט - פשוט משפט או פסקה רציפה, והמקצוע מובן רק מההקשר (למשל "עברנו היום על מחזור המים" = מדעים, גם בלי שהמילה "מדעים" מופיעה בכלל).
- חלק כותבות בפורמט "מקצוע: תוכן" בשורה אחת.
- חלק כותבות כמה משפטים על אותו מקצוע במקומות שונים בהודעה, לא ברצף - למשל שורה שמזכירה מקצוע בתחילת ההודעה, ואז אחרי הודעה על אירוע אחר, שורה נוספת שממשיכה את אותו נושא לימודי בלי לחזור על שם המקצוע. את חייבת לזהות שזו המשך לאותו מקצוע ולצרף אותה לאותו מקטע, ולא להתייחס אליה כנושא נפרד או להשמיט אותה.
- חלק מערבבות כמה מקצועות ברצף בלי הפרדה ברורה - את חייבת להבחין בגבול בין מקצוע למקצוע לפי התוכן (מילות מפתח, סוג המשימה), גם כשאין רמז עיצובי (כותרת/בולט/שורה ריקה) שמסמן את המעבר.
- כותרת מקצוע יכולה להיראות בכל צורה - עם אימוג'י בהתחלה, עם אימוג'י בסוף השורה (למשל "שחמט ♟️"), בלי שום אימוג'י, עם או בלי "✅"/מספר/נקודתיים. אל תסתמכי על מיקום קבוע של האימוג'י או על סימן ניקוד מסוים - כל שורה קצרה שהיא בעיקרה שם של מקצוע היא כותרת פוטנציאלית, ללא קשר לעיצוב שלה.

שני מוקשים נפוצים שאת חייבת להיזהר מהם:
א. שורה שנראית כמו המשך של המקטע הקודם (לדוגמה שורה בתוך כוכביות כמו "*איתור מידע מהטקסט*" שמופיעה ממש אחרי פסקה על מקצוע מסוים) היא המשך של אותו מקצוע - לא כותרת נפרדת ולא נושא חדש.
ב. הודעות רבות מכילות בסוף רשימת "מערכת" ליום המחר - למשל רשימת שמות מקצועות רצופה כמו "אנגלית / שפה - ספר,מחברת,תיקייה / הנדסה / כ.חיים" בלי תיאור אמיתי של מה שנעשה או ילמד. זו *לא* רשימת מטלות! אלה רק שמות המקצועות שיתקיימו למחר (מערכת שעות), לא תוכן לימודי בפועל. אל תיצרי מקטע "assignment" עבור שם מקצוע בודד שאין לו שום תוכן ממשי מלווה (מה נלמד/מה יש להכין/מה קרה בשיעור) - אם כל מה שיש זה שם מקצוע ריק בתוך רשימה כזו, זה שייך למקטע "announcement" אחד שמכיל את כל הרשימה (מערכת יום המחר), ולא לכמה מקטעי assignment שקריים ומיותרים.

חשוב מאוד: את/ה *לא* כותב/ת או מעתיק/ה טקסט בעצמך. המשימה שלך היחידה היא לבחור אילו *מספרי שורות* משתייכים לאיזה מקטע. האפליקציה תשלוף את הטקסט המדויק לפי המספרים שתבחרי, כדי שאף מילה מההודעה המקורית לא תשונה, לא תושמט ולא תסוכם.

שלבי העבודה:
1. קראי את כל השורות הממוספרות מתחילתן ועד סופן, פעם שלמה, לפני שאת מתחילה לסווג.
2. זהי את כל המקצועות הלימודיים המוזכרים או המשתמעים (למשל חשבון, שפה, תנ"ך, מדעים) וכל שאר הנושאים (אירועים, הודעות כלליות).
3. עבור כל נושא/מקצוע, אספי לתוכו את *כל* מספרי השורות הרלוונטיים מכל ההודעה - גם אם הן לא רצופות ומפוזרות בהודעה. לדוגמה: שורת פתיחה שמזכירה את המקצוע, כל שורות הכותרת/התוכן שלו, וגם שורה נפרדת בהמשך שחלה על כמה מקצועות (כמו תאריך החזרה משותף) - שורה כזו צריכה להצטרף לכמה מקטעים אם היא רלוונטית לכולם.
4. תייגי כל מקטע לאחת מהקטגוריות:
   - "event": אירוע ביומן - מסיבה, טיול, חופשה/חופש, חג, אסיפה, טקס, אירוע עם תאריך אמיתי. תאריך בלבד בלי הקשר אירועי הוא לא "event".
   - "assignment": כל מה שקשור ללימודים ויש לו תוכן ממשי - מה נלמד, מה תורגל, מבחן/בוחן, עמודים לקריאה - גם אם זה רק משפט אחד קצר בלי כותרת. שם מקצוע בודד בלי שום תיאור של מה נעשה/ילמד (כמו פריט ברשימת "מערכת" ליום המחר) אינו assignment.
   - "announcement": הודעה כללית שאינה לימודית ואינה אירוע - תזכורת להביא משהו, טופס, ציוד, מערכת/רשימת מקצועות ליום המחר, שעת סיום לימודים.
5. שורות של ברכת פתיחה/סיום, תודות, חתימות, או איחולים כלליים שאין להן קטגוריה - פשוט אל תכללי את מספרן באף מקטע. חוץ מזה, כל שורה שיש בה תוכן ממשי צריכה להופיע באיזשהו מקטע - אל תשמיטי שורה רק כי היא לא ברורה מיד, תשפטי לפי ההקשר הכולל של ההודעה.
6. אם נושא (כמו חופשה) מוזכר בכמה שורות נפרדות בהודעה - כללי את כל השורות הרלוונטיות במקטע אחד בלבד, לא כמה מקטעים.
7. אל תמזגי שני מקצועות שונים למקטע אחד גם אם הם צמודים בהודעה בלי מעבר שורה - כל מקצוע מקבל מקטע נפרד משלו.

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

    if (seg.category === 'event') {
      const resolved = resolveDate(text, sentAt)
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
      })
    } else if (seg.category === 'announcement') {
      announcements.push({
        text,
        icon: announcementIcon(text),
      })
    }
  }

  return { events, assignments, announcements }
}

export interface LLMClassifyOutcome {
  result: ClassificationResult | null
  // Set whenever result is null, so the caller can surface *why* it fell
  // back to the rule-based engine - important since the teacher testing this
  // on her phone has no way to open devtools and read the console herself.
  failReason?: string
}

// Tries an LLM-based classification (free-tier Gemini) for better handling of
// long, multi-topic real-world messages than the regex/keyword classifier can
// manage. Returns result: null on any failure (missing key, network error,
// bad response, or a response that yields nothing usable) so the caller
// falls back to the rule-based classifyMessage instead of showing a broken
// result - failReason says which of those it was.
//
// The free-tier flash model occasionally answers with a transient 503
// ("currently experiencing high demand") or 429 (rate limit) - those are
// worth a couple of quick retries before giving up on the real thing and
// falling back to rules, unlike a 404 (wrong model) or 400 (bad request),
// which won't fix themselves by asking again.
const RETRYABLE_STATUSES = new Set([429, 500, 503])
const MAX_ATTEMPTS = 3

async function fetchOnce(lines: string[]): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000)
  try {
    return await fetch(`${ENDPOINT}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify(buildRequestBody(lines)),
    })
  } finally {
    clearTimeout(timeout)
  }
}

export async function classifyWithLLM(text: string, hasPhoto: boolean, sentAt: Date = new Date()): Promise<LLMClassifyOutcome> {
  if (!API_KEY) return { result: null, failReason: 'אין מפתח API' }

  const lines = splitLines(text)
  if (lines.length === 0) return { result: null, failReason: 'הודעה ריקה' }

  try {
    let res = await fetchOnce(lines)
    for (let attempt = 1; !res.ok && RETRYABLE_STATUSES.has(res.status) && attempt < MAX_ATTEMPTS; attempt++) {
      console.warn(`Gemini classification got HTTP ${res.status}, retrying (attempt ${attempt + 1}/${MAX_ATTEMPTS})`)
      await new Promise((r) => setTimeout(r, 700 * attempt))
      res = await fetchOnce(lines)
    }
    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      console.warn('Gemini classification request failed', res.status, bodyText)
      return { result: null, failReason: `HTTP ${res.status}${bodyText ? ` - ${bodyText.slice(0, 120)}` : ''}` }
    }

    const data = await res.json()
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (typeof raw !== 'string') {
      console.warn('Gemini response had no text part', data)
      return { result: null, failReason: 'תשובה ללא טקסט' }
    }

    let parsed: unknown
    try {
      parsed = extractJsonArray(raw)
    } catch (err) {
      console.warn('Gemini response was not valid JSON', raw, err)
      return { result: null, failReason: 'תשובה לא תקינה (JSON)' }
    }
    if (!Array.isArray(parsed)) return { result: null, failReason: 'תשובה לא תקינה (לא מערך)' }

    const segments = parsed.filter((s): s is LLMSegment => isValidSegment(s, lines.length))
    const { events, assignments, announcements } = buildMetasFromSegments(segments, lines, sentAt)

    if (events.length === 0 && assignments.length === 0 && announcements.length === 0) {
      // A rich message that came back with nothing usable is more likely a
      // parsing/prompt miss than a genuine "nothing to categorize" - prefer
      // the deterministic fallback over showing an empty result.
      console.warn('Gemini returned nothing usable, falling back', segments)
      return { result: null, failReason: 'לא הוחזר תוכן שמיש' }
    }

    console.info('Gemini classification used', { segments })
    return { result: finalizeResult(hasPhoto, events, assignments, announcements, 'gemini') }
  } catch (err) {
    console.warn('Gemini classification failed, falling back', err)
    const isAbort = err instanceof Error && err.name === 'AbortError'
    return { result: null, failReason: isAbort ? 'תם הזמן (timeout)' : `שגיאת רשת: ${String(err)}`.slice(0, 140) }
  }
}
