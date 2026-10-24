// iCalendar (.ics) export: the planned stops as events plus reminders with alarms, so the
// phone's own calendar rings even when the app is closed (pure; the download is in the UI).

import { type IsoDate, cphToUtc } from './time'

export interface IcsEvent {
  uid: string
  date: IsoDate
  /** Copenhagen local minutes since midnight. */
  start: number
  minutes: number
  title: string
  description?: string
  location?: string
  geo?: { lat: number; lng: number }
  /** Alarm this many minutes before the start. */
  alarmBefore?: number
}

const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** Escapes TEXT values (RFC 5545 §3.3.11). */
const text = (s: string) => s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')

/** Folds lines longer than 75 octets (RFC 5545 §3.1), without splitting UTF-8 characters. */
function fold(line: string): string {
  const out: string[] = []
  let cur = ''
  let bytes = 0
  for (const ch of line) {
    const n = new TextEncoder().encode(ch).length
    if (bytes + n > (out.length ? 74 : 75)) {
      out.push(cur)
      cur = ''
      bytes = 0
    }
    cur += ch
    bytes += n
  }
  out.push(cur)
  return out.join('\r\n ')
}

export function toIcs(name: string, events: IcsEvent[], now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//copenhagen-guide//EN', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${text(name)}`]
  for (const e of events) {
    const start = cphToUtc(e.date, e.start)
    const end = new Date(start.getTime() + e.minutes * 60_000)
    lines.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, `SUMMARY:${text(e.title)}`)
    if (e.description) lines.push(`DESCRIPTION:${text(e.description)}`)
    if (e.location) lines.push(`LOCATION:${text(e.location)}`)
    if (e.geo) lines.push(`GEO:${e.geo.lat.toFixed(5)};${e.geo.lng.toFixed(5)}`)
    if (e.alarmBefore !== undefined) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${text(e.title)}`, `TRIGGER:-PT${e.alarmBefore}M`, 'END:VALARM')
    }
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.map(fold).join('\r\n') + '\r\n'
}
