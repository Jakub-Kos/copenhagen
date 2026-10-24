// Per-user trip data. Lives in localStorage and share links only, never in the repo.

import type { LatLng, TravellerCategory } from '@/data/types'
import type { IsoDate } from '@/logic/time'

export interface Traveller {
  id: string
  name: string
  /** adult, senior (65+), student, youth (18–26), child (needs an age). */
  category: TravellerCategory
  age: number | null
}

export interface HomeBase {
  label: string
  coords: LatLng
}

/** How the traveller gets *to* a stop from the previous one. */
export type LegMode = 'walk' | 'transit'

export interface PlannedStop {
  /** Unique within the day (the same place may appear twice). */
  id: string
  placeId: string
  legMode: LegMode
  /** Overrides the place's typical visit time. */
  visitMin: number | null
}

export interface DayPlan {
  startTime: string
  stops: PlannedStop[]
}

export interface ExtraCost {
  id: string
  date: IsoDate | null
  label: string
  category: 'food' | 'transport' | 'souvenir' | 'other'
  amountDkk: number
  paid: boolean
}

export interface Trip {
  v: 1
  id: string
  name: string
  start: IsoDate
  end: IsoDate
  group: Traveller[]
  homeBase: HomeBase | null
  walkingSpeedKmh: number
  transitThresholdKm: number
  maxDayHours: number
  maxDayKm: number
  days: Record<IsoDate, DayPlan>
  extraCosts: ExtraCost[]
  /** Paid flags of computed cost items (entries, transport), by cost-item key. */
  paid: Record<string, boolean>
  budgetDkk: number | null
  /** Manual DKK→CZK rate; null = use the ECB rate. */
  czkRate: number | null
}

export const DEFAULT_START_TIME = '09:30'

export function emptyDay(): DayPlan {
  return { startTime: DEFAULT_START_TIME, stops: [] }
}

export function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function newTrip(name: string, start: IsoDate, end: IsoDate): Trip {
  return {
    v: 1,
    id: newId(),
    name,
    start,
    end,
    group: [],
    homeBase: null,
    walkingSpeedKmh: 4.5,
    transitThresholdKm: 3,
    maxDayHours: 9,
    maxDayKm: 15,
    days: {},
    extraCosts: [],
    paid: {},
    budgetDkk: null,
    czkRate: null,
  }
}
