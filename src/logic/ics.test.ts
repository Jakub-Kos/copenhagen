import { describe, expect, it } from 'vitest'
import { toIcs } from './ics'

describe('toIcs', () => {
  const ics = toIcs(
    'Kodaň',
    [
      { uid: 'a@x', date: '2026-10-24', start: 9 * 60, minutes: 90, title: 'Národní muzeum; 1, 2', geo: { lat: 55.6746, lng: 12.5751 }, alarmBefore: 15 },
      { uid: 'b@x', date: '2026-10-26', start: 10 * 60, minutes: 30, title: 'x'.repeat(120) },
    ],
    new Date('2026-10-20T10:00:00Z'),
  )
  const lines = ics.split('\r\n')

  it('writes UTC times across the DST change and escapes text', () => {
    expect(lines).toContain('DTSTART:20261024T070000Z')
    expect(lines).toContain('DTEND:20261024T083000Z')
    expect(lines).toContain('DTSTART:20261026T090000Z')
    expect(lines).toContain('SUMMARY:Národní muzeum\\; 1\\, 2')
    expect(lines).toContain('TRIGGER:-PT15M')
    expect(lines).toContain('GEO:55.67460;12.57510')
  })

  it('folds long lines and ends with CRLF', () => {
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
    for (const l of lines) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75)
    expect(lines.some((l) => l.startsWith(' x'))).toBe(true)
  })
})
