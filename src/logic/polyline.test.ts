import { describe, expect, it } from 'vitest'
import { decodePolyline } from './polyline'

describe('decodePolyline', () => {
  it('decodes the reference precision-5 example', () => {
    // https://developers.google.com/maps/documentation/utilities/polylinealgorithm
    const pts = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@', 5)
    expect(pts).toEqual([
      { lat: 38.5, lng: -120.2 },
      { lat: 40.7, lng: -120.95 },
      { lat: 43.252, lng: -126.453 },
    ])
  })

  it('decodes a precision-6 Valhalla shape in Copenhagen', () => {
    // Start of a real Valhalla pedestrian route from Nyhavn.
    const [first] = decodePolyline('yyleiBkzn_WpEcYarAceAaKaIsc@i]mA_AqCwByW')
    expect(first.lat).toBeCloseTo(55.6798, 3)
    expect(first.lng).toBeCloseTo(12.591, 3)
  })

  it('returns nothing for an empty string', () => {
    expect(decodePolyline('')).toEqual([])
  })
})
