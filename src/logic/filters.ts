import type { Effort, Lang, LatLng, Place, PlaceKind, Tag } from '@/data/types'
import { pricingFor } from '@/data/prices'
import { haversineM } from './geo'
import { isOpenOnDay } from './hours'
import type { IsoDate } from './time'

export type SortKey = 'rating' | 'duration' | 'distance' | 'name'

export interface Filters {
  q: string
  kinds: PlaceKind[]
  tags: Tag[]
  minRating: number
  rainOnly: boolean
  mustSeeOnly: boolean
  freeOnly: boolean
  /** Minutes; null = any. */
  maxDuration: number | null
  efforts: Effort[]
  openOn: IsoDate | null
  sort: SortKey
}

export const DEFAULT_FILTERS: Filters = {
  q: '',
  kinds: [],
  tags: [],
  minRating: 1,
  rainOnly: false,
  mustSeeOnly: false,
  freeOnly: false,
  maxDuration: null,
  efforts: [],
  openOn: null,
  sort: 'rating',
}

const fold = (s: string) => s.toLocaleLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

export function matches(p: Place, f: Filters): boolean {
  if (f.q) {
    const q = fold(f.q)
    if (!fold(`${p.name.cs} ${p.name.en}`).includes(q)) return false
  }
  if (f.kinds.length && !f.kinds.includes(p.kind)) return false
  if (f.tags.length && !f.tags.some((t) => p.tags.includes(t))) return false
  if (p.myRating < f.minRating) return false
  if (f.rainOnly && p.weather === 'outdoor') return false
  if (f.mustSeeOnly && !p.mustSee) return false
  if (f.freeOnly && !pricingFor(p.id).free) return false
  if (f.maxDuration !== null && p.durationMin > f.maxDuration) return false
  if (f.efforts.length && !f.efforts.includes(p.effort)) return false
  if (f.openOn && !isOpenOnDay(p.openingHours, f.openOn)) return false
  return true
}

export function applyFilters(all: Place[], f: Filters, lang: Lang, from: LatLng): Place[] {
  const out = all.filter((p) => matches(p, f))
  const by: Record<SortKey, (a: Place, b: Place) => number> = {
    rating: (a, b) => b.myRating - a.myRating || Number(b.mustSee) - Number(a.mustSee),
    duration: (a, b) => a.durationMin - b.durationMin,
    distance: (a, b) => haversineM(from, a.coords) - haversineM(from, b.coords),
    name: () => 0,
  }
  const byName = (a: Place, b: Place) => a.name[lang].localeCompare(b.name[lang], lang)
  return out.sort((a, b) => by[f.sort](a, b) || byName(a, b))
}

export function activeFilterCount(f: Filters): number {
  return (
    f.kinds.length +
    f.tags.length +
    f.efforts.length +
    Number(f.minRating > 1) +
    Number(f.rainOnly) +
    Number(f.mustSeeOnly) +
    Number(f.freeOnly) +
    Number(f.maxDuration !== null) +
    Number(f.openOn !== null)
  )
}
