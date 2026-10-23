import { describe, expect, it } from 'vitest'
import { placeById } from '@/data/places'
import { hoursOn, isOpenDuring, isOpenOnDay } from './hours'

const p = (id: string) => placeById.get(id)!.openingHours

describe('opening hours', () => {
  it('returns always for public spaces', () => {
    expect(hoursOn(p('nyhavn'), '2026-10-26')).toBe('always')
  })

  it('treats Monday as closed for museums closed on Mondays', () => {
    expect(isOpenOnDay(p('glyptotek'), '2026-10-26')).toBe(false) // Monday
    expect(isOpenOnDay(p('glyptotek'), '2026-10-27')).toBe(true)
  })

  it('applies seasonal hours, including the season boundary', () => {
    expect(hoursOn(p('rosenborg'), '2026-10-31')).toEqual({ open: '10:00', close: '16:00' })
    expect(hoursOn(p('rosenborg'), '2026-11-02')).toBeNull() // Monday, winter
    expect(isOpenOnDay(p('tivoli'), '2026-10-24')).toBe(true)
    expect(isOpenOnDay(p('tivoli'), '2026-12-01')).toBe(false)
  })

  it('checks a visit fits inside the hours', () => {
    const oh = p('thorvaldsens') // Tue–Sun 10–17
    expect(isOpenDuring(oh, '2026-10-27', 600, 660)).toBe(true)
    expect(isOpenDuring(oh, '2026-10-27', 990, 1050)).toBe(false)
  })
})
