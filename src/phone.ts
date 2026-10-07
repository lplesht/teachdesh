// Israeli phone numbers only. Accepts what people actually type (spaces,
// dashes, +972 / 972 prefix, a missing leading 0 on mobiles) and reduces it to
// the digits-only form with a leading 0 that is used as the user's id. Must
// stay in sync with validPhone() in firestore.rules.
export function normalizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, '')
  if (digits.startsWith('972')) digits = '0' + digits.slice(3)
  else if (/^5\d{8}$/.test(digits)) digits = '0' + digits
  return digits
}

// Mobile (05X-XXXXXXX), VoIP (07X-XXXXXXX) or landline (0[2-4,8,9]-XXXXXXX).
export function isValidIsraeliPhone(normalized: string): boolean {
  return /^(05\d{8}|07\d{8}|0[23489]\d{7})$/.test(normalized)
}

export const INVALID_PHONE_MESSAGE = 'מספר טלפון לא תקין - נדרש מספר ישראלי (למשל 0501234567)'
