import { describe, expect, it } from 'vitest'
import { rejseplanenUrl } from './geo'

describe('rejseplanenUrl', () => {
  it('builds a coordinate search with date and departure time', () => {
    const u = new URL(
      rejseplanenUrl(
        { coords: { lat: 55.67606, lng: 12.56891 }, name: 'Rådhuspladsen' },
        { coords: { lat: 55.96935, lng: 12.54316 }, name: 'Louisiana' },
        { date: '2026-10-29', depart: 14 * 60 + 5 },
      ),
    )
    expect(u.origin + u.pathname).toBe('https://www.rejseplanen.dk/web/')
    const q = Object.fromEntries(u.searchParams)
    expect(q).toMatchObject({
      SKOORD: '1',
      SX: '12568910',
      SY: '55676060',
      SNAME: 'Rådhuspladsen',
      ZKOORD: '1',
      ZX: '12543160',
      ZY: '55969350',
      ZNAME: 'Louisiana',
      date: '29.10.2026',
      time: '14:05',
      timeSel: 'depart',
    })
  })

  it('starts from the current location and departs now', () => {
    const q = new URL(rejseplanenUrl('here', { coords: { lat: 55.6895, lng: 12.554 }, name: 'Hotel' })).searchParams
    expect(q.get('SCURRENT')).toBe('1')
    expect(q.has('SX') || q.has('date') || q.has('time')).toBe(false)
    expect(q.get('ZNAME')).toBe('Hotel')
  })
})
