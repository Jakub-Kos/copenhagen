// Shared data model for the static guide (places, walks, prices).

export type Lang = 'cs' | 'en'

/** Text in both UI languages. */
export interface Bi {
  cs: string
  en: string
}

export interface LatLng {
  lat: number
  lng: number
}

export type PlaceKind =
  | 'sight'
  | 'museum'
  | 'street-walk'
  | 'park'
  | 'viewpoint'
  | 'food-market'
  | 'neighbourhood'
  | 'day-trip'

export type Tag =
  | 'history'
  | 'royal'
  | 'design'
  | 'art'
  | 'architecture'
  | 'food'
  | 'hygge'
  | 'view'
  | 'free'
  | 'nature'
  | 'harbour'
  | 'church'
  | 'alternative'
  | 'family'

/** Rain-friendliness. */
export type WeatherExposure = 'indoor' | 'covered' | 'outdoor'

export type Effort = 'easy' | 'moderate' | 'hard'

export type BestTime = 'morning' | 'afternoon' | 'evening' | 'daylight-only'

export type Weekday = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

/** "HH:MM", 24h, Copenhagen local time. */
export type HHMM = `${number}:${number}`

export interface TimeRange {
  open: HHMM
  close: HHMM
}

/** null = closed that weekday. */
export type WeekHours = Record<Weekday, TimeRange | null>

/** Inclusive calendar range within a year, "MM-DD". May wrap over New Year (from > to). */
export interface SeasonalHours {
  from: `${number}-${number}`
  to: `${number}-${number}`
  hours: WeekHours
  label?: Bi
}

export interface OpeningHours {
  /** 'always' = public space, no opening hours. */
  regular: WeekHours | 'always'
  /** First matching season wins over `regular`. */
  seasonal?: SeasonalHours[]
}

export interface Link {
  label: string
  url: string
}

export interface Place {
  id: string
  name: Bi
  kind: PlaceKind
  coords: LatLng
  /** Ordered waypoints for street-walk entries; the walk is routed through them. */
  waypoints?: LatLng[]
  myRating: 1 | 2 | 3 | 4 | 5
  mustSee: boolean
  tags: Tag[]
  durationMin: number
  durationMax?: number
  weather: WeatherExposure
  windSensitive: boolean
  openingHours: OpeningHours
  bookingNeeded: boolean
  /** true until the hours have been checked against the official site. */
  verifyHours: boolean
  effort: Effort
  bestTime: BestTime[]
  description: Bi
  notes?: Bi
  links: Link[]
}

/** A price in DKK, or null when it could not be confirmed. */
export type Dkk = number | null

export type TravellerCategory = 'adult' | 'senior' | 'student' | 'youth' | 'child'

export interface ChildBand {
  minAge: number
  maxAge: number
  price: Dkk
}

export interface ExtraItem {
  id: string
  name: Bi
  adult: Dkk
  child: Dkk
}

export interface PaidPricing {
  free: false
  adult: Dkk
  senior: Dkk
  student: Dkk
  youth: Dkk
  /** Age bands for children; children under `freeUnderAge` pay nothing. */
  childBands: ChildBand[]
  freeUnderAge: number | null
  freeTimes?: Bi
  includedInCopenhagenCard: boolean | null
  extras: ExtraItem[]
  source: string | null
  checkedOn: string | null
}

export interface FreePricing {
  free: true
  extras: ExtraItem[]
  source: string | null
  checkedOn: string | null
}

export type Pricing = PaidPricing | FreePricing
