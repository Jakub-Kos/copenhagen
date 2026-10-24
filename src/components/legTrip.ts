import type { IsoDate } from '@/logic/time'
import type { Timeline } from '@/logic/timeline'
import type { LegTrip } from './LegRow'

// Place names go to Rejseplanen in English: the Danish site mangles Czech letters (ě, ů).

/** Rejseplanen details for the leg into stop `i` (from the previous stop, or from home). */
export function legTripInto(tl: Timeline, i: number, date: IsoDate, homeLabel: string): LegTrip | undefined {
  const s = tl.stops[i]
  if (!s?.leg) return undefined
  return {
    date,
    depart: s.arrive - s.leg.minutes,
    fromName: i > 0 ? tl.stops[i - 1].place.name.en : homeLabel,
    toName: s.place.name.en,
  }
}

/** Rejseplanen details for the way home after the last stop. */
export function legTripHome(tl: Timeline, date: IsoDate, homeLabel: string): LegTrip | undefined {
  const last = tl.stops.at(-1)
  if (!last || !tl.homeLeg) return undefined
  return { date, depart: last.leave, fromName: last.place.name.en, toName: homeLabel }
}
