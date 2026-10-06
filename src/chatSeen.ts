// When this device last looked at a class's chat - the class drawer counts
// messages newer than this as unread for classes that aren't open right now.
function key(classId: string): string {
  return `teachdesh_chat_seen_${classId}`
}

export function getChatSeen(classId: string): number | null {
  try {
    const raw = localStorage.getItem(key(classId))
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

export function setChatSeen(classId: string, ts: number): void {
  try {
    localStorage.setItem(key(classId), String(ts))
  } catch {
    // ignore - private browsing etc.
  }
}
