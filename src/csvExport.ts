function escapeCsvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

// A BOM prefix is required for Excel to detect UTF-8 (and render Hebrew
// correctly) instead of guessing a legacy Windows codepage.
export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
  const csv = '﻿' + [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
