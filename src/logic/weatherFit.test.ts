import { describe, expect, it } from 'vitest'
import { placeById } from '@/data/places'
import { parseForecast, type Forecast, type HourWx } from '@/services/weather'
import { conditionsOf, fitFor, hintFor, hoursIn, weatherFit } from './weatherFit'

const p = (id: string) => placeById.get(id)!

/** A forecast with uniform hours per date. */
function forecast(byDate: Record<string, Partial<HourWx>>): Forecast {
  const hours: HourWx[] = []
  for (const [date, w] of Object.entries(byDate)) {
    for (let h = 0; h < 24; h++) {
      hours.push({ date, minute: h * 60, temp: 10, feels: 8, rainProb: 5, rainMm: 0, wind: 4, gust: 7, code: 3, ...w })
    }
  }
  return { fetchedAt: 0, hours, days: [] }
}

const dry = {}
const rainy = { rainProb: 90, rainMm: 1.2, code: 63 }
const stormy = { wind: 13, gust: 22 }

describe('weatherFit', () => {
  it('prefers indoor places in rain and outdoor places when dry', () => {
    const wet = conditionsOf(forecast({ d: rainy }).hours)!
    const fine = conditionsOf(forecast({ d: dry }).hours)!
    expect(weatherFit(p('glyptotek'), wet).score).toBeGreaterThan(weatherFit(p('kastellet'), wet).score)
    expect(weatherFit(p('kastellet'), fine).score).toBeGreaterThan(weatherFit(p('glyptotek'), fine).score)
    expect(weatherFit(p('kastellet'), wet).wet).toBe(true)
  })

  it('penalises wind-sensitive places in a storm', () => {
    const c = conditionsOf(forecast({ d: stormy }).hours)!
    expect(weatherFit(p('saviour-spire'), c).score).toBeLessThan(-5)
    expect(weatherFit(p('round-tower'), c).windy).toBe(true)
    expect(weatherFit(p('round-tower'), c).score).toBeGreaterThan(-1)
  })

  it('only looks at the hours of the visit', () => {
    const fc = forecast({ d: dry })
    for (const h of fc.hours) if (h.minute >= 14 * 60) Object.assign(h, rainy)
    expect(hoursIn(fc, 'd', 9 * 60, 11 * 60)).toHaveLength(2)
    expect(fitFor(p('kastellet'), fc, 'd', 9 * 60, 11 * 60)!.wet).toBe(false)
    expect(fitFor(p('kastellet'), fc, 'd', 14 * 60, 15 * 60)!.wet).toBe(true)
    expect(fitFor(p('kastellet'), fc, 'x', 9 * 60, 11 * 60)).toBeNull()
  })
})

describe('hintFor', () => {
  const fc = forecast({ '2026-10-24': rainy, '2026-10-25': dry, '2026-10-26': stormy })
  const dates = ['2026-10-24', '2026-10-25', '2026-10-26']

  it('suggests a better day for outdoor places', () => {
    expect(hintFor(p('kastellet'), fc, '2026-10-24', dates)).toEqual({ kind: 'better', date: '2026-10-25' })
    expect(hintFor(p('kastellet'), fc, '2026-10-25', dates)).toEqual({ kind: 'good' })
    expect(hintFor(p('saviour-spire'), fc, '2026-10-26', dates)).toEqual({ kind: 'better', date: '2026-10-25' })
  })

  it('marks indoor places good on rainy days only', () => {
    expect(hintFor(p('glyptotek'), fc, '2026-10-24', dates)).toEqual({ kind: 'good' })
    expect(hintFor(p('glyptotek'), fc, '2026-10-25', dates)).toBeNull()
  })

  it('returns null without forecast data', () => {
    expect(hintFor(p('kastellet'), fc, '2026-11-20', dates)).toBeNull()
  })
})

describe('parseForecast', () => {
  it('maps unix times to Copenhagen local hours across the DST change', () => {
    // 00:00 and 01:00 UTC on 25 Oct = 02:00 CEST and 02:00 CET (the repeated hour).
    const t0 = Date.UTC(2026, 9, 25, 0) / 1000
    const fc = parseForecast(
      {
        hourly: {
          time: [t0, t0 + 3600],
          temperature_2m: [10, 9],
          apparent_temperature: [8, 7],
          precipitation_probability: [null, 40],
          precipitation: [0, 0.1],
          wind_speed_10m: [3, 3],
          wind_gusts_10m: [6, 6],
          weather_code: [3, 61],
        },
        daily: {
          time: [Date.UTC(2026, 9, 24, 22) / 1000],
          sunrise: [Date.UTC(2026, 9, 25, 6, 58) / 1000],
          sunset: [Date.UTC(2026, 9, 25, 15, 48) / 1000],
          precipitation_sum: [0.1],
          precipitation_probability_max: [40],
          temperature_2m_max: [12],
          temperature_2m_min: [6],
          weather_code: [61],
        },
      },
      0,
    )
    expect(fc.hours.map((h) => [h.date, h.minute])).toEqual([
      ['2026-10-25', 120],
      ['2026-10-25', 120],
    ])
    expect(fc.hours[0].rainProb).toBeNull()
    expect(fc.days[0]).toMatchObject({ date: '2026-10-25', sunrise: 7 * 60 + 58, sunset: 16 * 60 + 48 })
  })
})
