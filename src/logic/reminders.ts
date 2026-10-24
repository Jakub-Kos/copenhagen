// Reminders computed from a trip (pure): bookings, when to set off, the Copenhagen Card /
// City Pass recommendation and the clock change. Shown in Today and exported to a calendar.

import { placeById } from '@/data/places'
import type { Place } from '@/data/types'
import type { Trip } from '@/state/tripTypes'
import type { CardVerdict, CostItem, PassOption } from './costs'
import { addDays, datesBetween, dstShiftAfter, type IsoDate } from './time'
import type { Timeline } from './timeline'

export type Reminder =
  | { key: string; kind: 'book'; due: IsoDate; dueMin: number; date: IsoDate; at: number; place: Place }
  | { key: string; kind: 'leave'; due: IsoDate; dueMin: number; date: IsoDate; at: number; place: Place; transit: boolean }
  | { key: string; kind: 'pass'; due: IsoDate; dueMin: number; date: IsoDate; at: number; option: Exclude<PassOption, { kind: 'none' }>; place: Place | null; travellers: number }
  | { key: string; kind: 'dst'; due: IsoDate; dueMin: number; date: IsoDate; shift: number }

/** Bookings are due the day before, at this time. */
const BOOK_AT = 10 * 60
/** Remind about leaving this long before. */
export const LEAVE_EARLY_MIN = 15

export function reminders(
  trip: Trip,
  timelines: ReadonlyMap<IsoDate, Timeline>,
  items: CostItem[],
  verdicts: CardVerdict[],
): Reminder[] {
  const out: Reminder[] = []
  const dates = datesBetween(trip.start, trip.end)

  for (const date of dates) {
    const tl = timelines.get(date)
    if (!tl?.stops.length) continue
    for (const s of tl.stops) {
      if (s.place.bookingNeeded) {
        out.push({ key: `book:${date}:${s.stopId}`, kind: 'book', due: addDays(date, -1), dueMin: BOOK_AT, date, at: s.arrive, place: s.place })
      }
    }
    const first = tl.stops[0]
    const depart = first.arrive - (first.leg?.minutes ?? 0)
    out.push({
      key: `leave:${date}`,
      kind: 'leave',
      due: date,
      dueMin: depart - LEAVE_EARLY_MIN,
      date,
      at: depart,
      place: first.place,
      transit: first.leg?.mode === 'transit',
    })
  }

  // The pass most travellers are best off with (cards are bought per person).
  const passes = verdicts.map((v) => v.best.option).filter((o): o is Exclude<PassOption, { kind: 'none' }> => o.kind !== 'none')
  if (passes.length) {
    const o = passes[0]
    const day = Math.floor(o.start / 1440)
    const date = addDays(trip.start, day)
    const firstItem = items.find((i) => i.at === o.start)
    out.push({
      key: `pass:${o.kind}:${o.start}`,
      kind: 'pass',
      due: date,
      dueMin: o.start % 1440 - 30,
      date,
      at: o.start % 1440,
      option: o,
      place: firstItem ? (placeById.get(firstItem.placeId) ?? null) : null,
      travellers: passes.filter((p) => p.kind === o.kind && p.start === o.start).length,
    })
  }

  for (const date of dates) {
    const shift = dstShiftAfter(date)
    if (shift) out.push({ key: `dst:${date}`, kind: 'dst', due: date, dueMin: 18 * 60, date, shift })
  }

  return out.sort((a, b) => a.due.localeCompare(b.due) || a.dueMin - b.dueMin)
}

/** Reminders worth showing now: not done, and due by the end of tomorrow; leave/pass/dst only until they happen. */
export function upcoming(all: Reminder[], done: Record<string, boolean>, today: IsoDate, nowMin: number): Reminder[] {
  const tomorrow = addDays(today, 1)
  return all.filter((r) => {
    if (done[r.key]) return false
    if (r.kind === 'book') return r.due <= tomorrow && r.date >= today
    if (r.kind === 'dst') return r.date === today || r.date === tomorrow
    // leave / pass: from the evening before until the moment itself
    const past = r.date < today || (r.date === today && 'at' in r && r.at < nowMin)
    return !past && r.date <= tomorrow
  })
}

