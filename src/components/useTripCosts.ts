import { useMemo } from 'react'
import { placeById } from '@/data/places'
import { type CardVerdict, type CostItem, cardVerdicts, costItems } from '@/logic/costs'
import { type Timeline, buildTimeline } from '@/logic/timeline'
import type { IsoDate } from '@/logic/time'
import { dayOf, tripDates } from '@/state/tripOps'
import type { Trip } from '@/state/tripTypes'

export interface TripCosts {
  dates: IsoDate[]
  items: CostItem[]
  verdicts: CardVerdict[]
}

/** Cost items for every planned day (estimated timelines are precise enough for pass windows). */
export function useTripCosts(trip: Trip): TripCosts {
  return useMemo(() => {
    const dates = tripDates(trip)
    const timelines = new Map<IsoDate, Timeline>()
    for (const d of dates) {
      timelines.set(
        d,
        buildTimeline(dayOf(trip, d), (id) => placeById.get(id), {
          date: d,
          speedKmh: trip.walkingSpeedKmh,
          origin: trip.homeBase?.coords ?? null,
          maxDayHours: trip.maxDayHours,
          maxDayKm: trip.maxDayKm,
          transitThresholdKm: trip.transitThresholdKm,
        }),
      )
    }
    const items = costItems(trip, timelines, dates)
    return { dates, items, verdicts: trip.group.length ? cardVerdicts(items, trip.group) : [] }
  }, [trip])
}
