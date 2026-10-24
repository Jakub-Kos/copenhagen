import { describe, expect, it } from 'vitest'
import { placeById } from '@/data/places'
import { newTrip } from '@/state/tripTypes'
import type { CardVerdict } from './costs'
import { reminders, upcoming } from './reminders'
import { type Timeline, buildTimeline } from './timeline'

const trip = {
  ...newTrip('t', '2026-10-24', '2026-10-27'),
  homeBase: { label: 'Hotel', coords: { lat: 55.6895, lng: 12.554 } },
  days: {
    '2026-10-26': {
      startTime: '11:00',
      stops: [
        { id: 'a', placeId: 'national-museum', legMode: 'walk' as const, visitMin: null },
        { id: 'b', placeId: 'schonnemann', legMode: 'walk' as const, visitMin: null },
      ],
    },
  },
}
const timelines = new Map<string, Timeline>(
  ['2026-10-26'].map((d) => [
    d,
    buildTimeline(trip.days[d as '2026-10-26'], (id) => placeById.get(id), {
      date: d,
      speedKmh: 4.5,
      origin: trip.homeBase.coords,
      maxDayHours: 10,
      maxDayKm: 15,
      transitThresholdKm: 3,
    }),
  ]),
)

describe('reminders', () => {
  const all = reminders(trip, timelines, [], [])

  it('reminds to book the day before and to leave on time', () => {
    const book = all.find((r) => r.kind === 'book')
    expect(book).toMatchObject({ key: 'book:2026-10-26:b', due: '2026-10-25', date: '2026-10-26' })
    const leave = all.find((r) => r.kind === 'leave')
    expect(leave).toMatchObject({ key: 'leave:2026-10-26', date: '2026-10-26', at: 11 * 60 })
  })

  it('warns about the clock change inside the trip', () => {
    expect(all.find((r) => r.kind === 'dst')).toMatchObject({ date: '2026-10-24', shift: -60 })
  })

  it('adds the recommended pass, activated at its first use', () => {
    const v = {
      best: { option: { kind: 'card', variant: 'discover', hours: 24, start: 2 * 1440 + 11 * 60 + 30 }, dkk: 0, unknownPaid: 0, covered: [] },
    } as unknown as CardVerdict
    const items = [{ key: 'e', kind: 'entry' as const, date: '2026-10-26', at: 2 * 1440 + 11 * 60 + 30, placeId: 'national-museum', prices: {}, inCard: true }]
    const pass = reminders(trip, timelines, items, [v, v]).find((r) => r.kind === 'pass')
    expect(pass).toMatchObject({ date: '2026-10-26', at: 11 * 60 + 30, travellers: 2 })
    expect(pass && 'place' in pass && pass.place?.id).toBe('national-museum')
  })

  it('shows only what is due by tomorrow and not done', () => {
    const on25 = upcoming(all, {}, '2026-10-25', 9 * 60).map((r) => r.kind)
    expect(on25).toEqual(expect.arrayContaining(['book', 'leave']))
    expect(upcoming(all, { 'book:2026-10-26:b': true }, '2026-10-25', 9 * 60).some((r) => r.kind === 'book')).toBe(false)
    expect(upcoming(all, {}, '2026-10-22', 9 * 60)).toEqual([])
    // After leaving time on the day itself, the leave reminder is gone.
    expect(upcoming(all, {}, '2026-10-26', 12 * 60).some((r) => r.kind === 'leave')).toBe(false)
  })
})
