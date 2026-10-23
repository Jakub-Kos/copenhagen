import { describe, expect, it } from 'vitest'
import { CITY_CENTRE } from './geo'
import { sunTimes } from './sun'

const hm = (h: number, m: number) => h * 60 + m

describe('sunTimes in Copenhagen', () => {
  it('matches published solstice times', () => {
    // Copenhagen: midsummer ≈ 04:25 / 21:57 CEST, midwinter ≈ 08:37 / 15:38 CET.
    const summer = sunTimes('2026-06-21', CITY_CENTRE)!
    const winter = sunTimes('2026-12-21', CITY_CENTRE)!
    expect(Math.abs(summer.sunrise - hm(4, 25))).toBeLessThanOrEqual(3)
    expect(Math.abs(summer.sunset - hm(21, 57))).toBeLessThanOrEqual(3)
    expect(Math.abs(winter.sunrise - hm(8, 37))).toBeLessThanOrEqual(3)
    expect(Math.abs(winter.sunset - hm(15, 38))).toBeLessThanOrEqual(3)
  })

  it('moves sunset back an hour across the 25 Oct 2026 clock change', () => {
    const before = sunTimes('2026-10-24', CITY_CENTRE)!
    const after = sunTimes('2026-10-26', CITY_CENTRE)!
    // ~4 min of real change over two days plus the 60 min clock shift.
    expect(before.sunset - after.sunset).toBeGreaterThan(60)
    expect(before.sunset - after.sunset).toBeLessThan(70)
    expect(after.sunset).toBeGreaterThan(hm(16, 30))
    expect(after.sunset).toBeLessThan(hm(17, 0))
  })
})
