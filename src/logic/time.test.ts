import { describe, expect, it } from 'vitest'
import { addDays, cphParts, datesBetween, fromMinutes, toMinutes, weekdayOf } from './time'

describe('Copenhagen time', () => {
  it('uses summer time before the 25 Oct 2026 switch', () => {
    // 23:30 UTC on 24 Oct = 01:30 CEST on 25 Oct
    expect(cphParts(new Date('2026-10-24T23:30:00Z'))).toEqual({ date: '2026-10-25', minutes: 90 })
  })

  it('uses winter time after the switch', () => {
    // 01:30 UTC on 25 Oct = 02:30 CET (clocks went back at 01:00 UTC)
    expect(cphParts(new Date('2026-10-25T01:30:00Z'))).toEqual({ date: '2026-10-25', minutes: 150 })
    expect(cphParts(new Date('2026-10-26T11:00:00Z'))).toEqual({ date: '2026-10-26', minutes: 12 * 60 })
  })

  it('handles calendar dates without zone shifts', () => {
    expect(weekdayOf('2026-10-24')).toBe('sat')
    expect(weekdayOf('2026-10-29')).toBe('thu')
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(datesBetween('2026-10-24', '2026-10-29')).toHaveLength(6)
    expect(datesBetween('2026-10-29', '2026-10-24')).toEqual([])
  })

  it('converts clock times', () => {
    expect(toMinutes('09:30')).toBe(570)
    expect(fromMinutes(570)).toBe('09:30')
    expect(fromMinutes(1450)).toBe('00:10')
  })
})
