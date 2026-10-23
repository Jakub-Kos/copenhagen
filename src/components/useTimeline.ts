import { useMemo } from 'react'
import { placeById } from '@/data/places'
import { buildTimeline } from '@/logic/timeline'
import type { IsoDate } from '@/logic/time'
import { dayOf } from '@/state/tripOps'
import type { Trip } from '@/state/tripTypes'

export function useTimeline(trip: Trip, date: IsoDate) {
  const day = dayOf(trip, date)
  return useMemo(
    () =>
      buildTimeline(day, (id) => placeById.get(id), {
        date,
        speedKmh: trip.walkingSpeedKmh,
        origin: trip.homeBase?.coords ?? null,
        maxDayHours: trip.maxDayHours,
        maxDayKm: trip.maxDayKm,
        transitThresholdKm: trip.transitThresholdKm,
      }),
    [day, date, trip.walkingSpeedKmh, trip.homeBase, trip.maxDayHours, trip.maxDayKm, trip.transitThresholdKm],
  )
}
