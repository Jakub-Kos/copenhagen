import { describe, expect, it } from 'vitest'
import { mapsLink, shareMessage } from './shareLocation'

const t = (key: string, v: Record<string, string>) => `${key}|${Object.entries(v).map(([k, x]) => `${k}=${x}`).join(',')}`

describe('share location message', () => {
  it('has the position link, time and accuracy, then the next stop and home', () => {
    const msg = shareMessage(
      {
        pos: { lat: 55.676098, lng: 12.568337 },
        accuracy: 23,
        now: 14 * 60 + 5,
        next: { name: 'Glyptotek', arrive: 14 * 60 + 30, coords: { lat: 55.6727, lng: 12.5724 } },
        home: 'Hotel',
      },
      t,
    )
    expect(msg.split('\n')).toEqual([
      'shareHere|time=14:05,acc= ±25 m',
      'https://maps.google.com/?q=55.67610,12.56834',
      'shareNext|place=Glyptotek,time=14:30',
      'https://maps.google.com/?q=55.67270,12.57240',
      'shareHome|home=Hotel',
    ])
  })

  it('leaves out what is unknown', () => {
    expect(shareMessage({ pos: { lat: 55, lng: 12 }, accuracy: null, now: 600 }, t).split('\n')).toEqual([
      'shareHere|time=10:00,acc=',
      mapsLink({ lat: 55, lng: 12 }),
    ])
  })
})
