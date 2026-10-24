import { describe, expect, it } from 'vitest'
import { placeById, places } from '@/data/places'
import { fold, searchPlaces } from './search'

describe('place search', () => {
  it('folds accents and Danish letters', () => {
    expect(fold('Schønnemann')).toBe('schonnemann')
    expect(fold('Kodaň Ærø Tårn')).toBe('kodan aero tarn')
  })

  it('finds places by Czech or English name, without accents', () => {
    expect(searchPlaces('schonnemann', places, null).map((p) => p.id)).toEqual(['schonnemann'])
    expect(searchPlaces('mala morska', places, null)[0].id).toBe('little-mermaid')
    expect(searchPlaces('mermaid', places, null)[0].id).toBe('little-mermaid')
  })

  it('puts names starting with the query first', () => {
    const ids = searchPlaces('ros', places, null).map((p) => p.id)
    expect(ids[0]).toBe('rosenborg')
    expect(ids).toContain('roskilde-cathedral')
  })

  it('lists the nearest places for an empty query', () => {
    const from = placeById.get('nyhavn')!.coords
    const near = searchPlaces('', places, from, 3)
    expect(near[0].id).toBe('nyhavn')
    expect(near).toHaveLength(3)
  })

  it('returns nothing for nonsense', () => {
    expect(searchPlaces('xyzzy', places, null)).toEqual([])
  })
})
