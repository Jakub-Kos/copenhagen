// Place search for pickers and the guide (pure): accent- and case-insensitive, Danish letters
// folded too, so "schonnemann" finds Schønnemann and "kodan" finds Kodaň.

import type { LatLng, Place } from '@/data/types'
import { haversineM } from './geo'

export const fold = (s: string): string =>
  s
    .toLocaleLowerCase()
    .replace(/ø/g, 'o')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')

const words = (s: string) => s.split(/[^\p{L}\p{N}]+/u).filter(Boolean)

/** True when every word of the query appears in the place's Czech or English name. */
export function nameMatches(p: Place, query: string): boolean {
  const hay = fold(`${p.name.cs} ${p.name.en}`)
  return words(fold(query)).every((w) => hay.includes(w))
}

/**
 * Places matching `query`, best first: names starting with it, then names with a word
 * starting with it, then any match; ties go to the nearest to `from` (or the best rated).
 * An empty query lists the nearest places (or the best rated).
 */
export function searchPlaces(query: string, all: Place[], from: LatLng | null, limit = 8): Place[] {
  const q = fold(query.trim())
  const first = words(q)[0] ?? ''
  const rank = (p: Place): number => {
    if (!q) return 0
    const names = [fold(p.name.cs), fold(p.name.en)]
    if (names.some((n) => n.startsWith(q))) return 0
    if (names.some((n) => words(n).some((w) => w.startsWith(first)))) return 1
    return 2
  }
  const tie = (a: Place, b: Place) =>
    from ? haversineM(from, a.coords) - haversineM(from, b.coords) : b.myRating - a.myRating
  return all
    .filter((p) => !q || nameMatches(p, query))
    .map((p) => ({ p, r: rank(p) }))
    .sort((a, b) => a.r - b.r || tie(a.p, b.p))
    .slice(0, limit)
    .map((x) => x.p)
}
