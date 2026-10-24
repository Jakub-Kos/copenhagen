import { describe, expect, it } from 'vitest'
import { bestPlan, type MotisPlanResponse } from './transitPlan'

const place = (name: string, lat: number, lon: number) => ({ name, lat, lon })
const walk = (a: string, b: string, start: string, end: string, distance: number) => ({
  mode: 'WALK',
  from: place(a, 55.69, 12.554),
  to: place(b, 55.6902, 12.555),
  startTime: start,
  endTime: end,
  distance,
})
const r: MotisPlanResponse = {
  itineraries: [
    {
      startTime: '2026-10-27T08:16:00Z',
      endTime: '2026-10-27T09:22:00Z',
      transfers: 1,
      legs: [
        walk('START', 'Kapelvej', '2026-10-27T08:16:00Z', '2026-10-27T08:18:00Z', 120),
        {
          mode: 'BUS',
          from: place('Kapelvej', 55.6902, 12.555),
          to: place('Nørreport St.', 55.6837, 12.5714),
          startTime: '2026-10-27T08:18:00Z',
          endTime: '2026-10-27T08:24:00Z',
          routeShortName: '5C',
          headsign: 'Sundbyvester Plads',
        },
        {
          mode: 'REGIONAL_RAIL',
          from: place('Nørreport St.', 55.6837, 12.5714),
          to: place('Humlebæk St.', 55.9637, 12.5357),
          startTime: '2026-10-27T08:30:00Z',
          endTime: '2026-10-27T09:12:00Z',
          routeShortName: 'RE',
          routeColor: 'aa0000',
        },
        walk('Humlebæk St.', 'END', '2026-10-27T09:12:00Z', '2026-10-27T09:22:00Z', 800),
      ],
    },
    // Arrives later: not chosen.
    { startTime: '2026-10-27T08:24:00Z', endTime: '2026-10-27T09:34:00Z', transfers: 1, legs: [walk('START', 'END', '2026-10-27T08:24:00Z', '2026-10-27T09:34:00Z', 5000)] },
  ],
}

describe('Transitous plan', () => {
  // 09:10 Copenhagen summer time is still before 25 Oct; on 27 Oct it is 08:10 UTC.
  const depart = new Date('2026-10-27T08:10:00Z')
  const p = bestPlan(r, depart, 9 * 60 + 10)!

  it('picks the journey that arrives first and counts door to door from the planned departure', () => {
    expect(p.minutes).toBe(72) // 08:10 → 09:22, including the 6 minutes before setting off
    expect(p.start).toBe(9 * 60 + 16) // Copenhagen time (UTC+1 after the DST change)
    expect(p.end).toBe(10 * 60 + 22)
    expect(p.transfers).toBe(1)
    expect(p.walkMetres).toBe(920)
  })

  it('maps modes, lines and colours', () => {
    expect(p.legs.map((l) => [l.mode, l.line])).toEqual([
      ['walk', ''],
      ['bus', '5C'],
      ['train', 'RE'],
      ['walk', ''],
    ])
    expect(p.legs[2].color).toBe('#aa0000')
    expect(p.legs[1].headsign).toBe('Sundbyvester Plads')
    expect(p.legs[1].shape).toHaveLength(2) // no geometry → straight line between the stops
  })

  it('returns null when nothing leaves after the planned time', () => {
    expect(bestPlan(r, new Date('2026-10-27T10:00:00Z'), 11 * 60)).toBeNull()
    expect(bestPlan({}, depart, 600)).toBeNull()
  })
})
