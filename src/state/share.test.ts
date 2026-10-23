import { describe, expect, it } from 'vitest'
import { decodeTrip, encodeTrip, parseTrip } from './share'
import { addStop, moveStop, reorderStops, setDates } from './tripOps'
import { newTrip } from './tripTypes'

describe('trip sharing', () => {
  it('round-trips a trip through the share encoding', () => {
    let t = newTrip('Rodiče', '2026-10-24', '2026-10-29')
    t = { ...t, homeBase: { label: 'Byt', coords: { lat: 55.69, lng: 12.55 } } }
    t = addStop(t, '2026-10-24', 'nyhavn')
    expect(decodeTrip(encodeTrip(t))).toEqual(t)
  })

  it('rejects garbage', () => {
    expect(decodeTrip('not-a-trip')).toBeNull()
    expect(parseTrip({ v: 2 })).toBeNull()
    expect(parseTrip(null)).toBeNull()
  })
})

describe('trip ops', () => {
  it('reorders stops and drops days outside new dates', () => {
    let t = newTrip('x', '2026-10-24', '2026-10-26')
    t = addStop(addStop(t, '2026-10-24', 'nyhavn'), '2026-10-24', 'tivoli')
    t = addStop(t, '2026-10-26', 'smk')
    const [a] = t.days['2026-10-24'].stops
    t = moveStop(t, '2026-10-24', a.id, 1)
    expect(t.days['2026-10-24'].stops.map((s) => s.placeId)).toEqual(['tivoli', 'nyhavn'])
    const ids = t.days['2026-10-24'].stops.map((s) => s.id)
    t = reorderStops(t, '2026-10-24', [ids[1]])
    expect(t.days['2026-10-24'].stops.map((s) => s.placeId)).toEqual(['nyhavn', 'tivoli'])
    t = setDates(t, '2026-10-24', '2026-10-25')
    expect(Object.keys(t.days)).toEqual(['2026-10-24'])
  })
})
