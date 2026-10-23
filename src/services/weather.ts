// Forecast from Open-Meteo (free, no key, CORS; data CC BY 4.0). All weather network access is here.
//
// Times are requested as Unix timestamps and converted with the Copenhagen time zone, so the
// DST change (25 Oct 2026) can't produce duplicate or missing local hours.

import { CITY_CENTRE } from '@/logic/geo'
import { type IsoDate, cphParts } from '@/logic/time'

const URL_BASE = 'https://api.open-meteo.com/v1/forecast'
const CACHE_KEY = 'cph:forecast'
/** A forecast younger than this is used without asking again. */
export const FORECAST_MAX_AGE_MS = 60 * 60 * 1000
const TIMEOUT_MS = 15000

export interface HourWx {
  date: IsoDate
  /** Local start of the hour, minutes since midnight. */
  minute: number
  temp: number
  feels: number
  /** null when the model gives no probability (far ahead). */
  rainProb: number | null
  rainMm: number
  /** m/s */
  wind: number
  gust: number
  code: number
}

export interface DayWx {
  date: IsoDate
  sunrise: number
  sunset: number
  rainMm: number
  rainProbMax: number | null
  tMax: number
  tMin: number
  code: number
}

export interface Forecast {
  fetchedAt: number
  hours: HourWx[]
  days: DayWx[]
}

interface OpenMeteoResponse {
  hourly: {
    time: number[]
    temperature_2m: number[]
    apparent_temperature: number[]
    precipitation_probability: (number | null)[]
    precipitation: number[]
    wind_speed_10m: number[]
    wind_gusts_10m: number[]
    weather_code: number[]
  }
  daily: {
    time: number[]
    sunrise: number[]
    sunset: number[]
    precipitation_sum: number[]
    precipitation_probability_max: (number | null)[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
  }
}

const at = (unix: number) => cphParts(new Date(unix * 1000))

/** Parses an Open-Meteo response (exported for tests). Skips hours with missing values. */
export function parseForecast(r: OpenMeteoResponse, fetchedAt: number): Forecast {
  const h = r.hourly
  const hours: HourWx[] = []
  h.time.forEach((t, i) => {
    const temp = h.temperature_2m[i]
    if (temp === null || temp === undefined) return
    const p = at(t)
    hours.push({
      date: p.date,
      minute: p.minutes,
      temp,
      feels: h.apparent_temperature[i],
      rainProb: h.precipitation_probability[i] ?? null,
      rainMm: h.precipitation[i] ?? 0,
      wind: h.wind_speed_10m[i],
      gust: h.wind_gusts_10m[i],
      code: h.weather_code[i],
    })
  })
  const d = r.daily
  const days: DayWx[] = d.time.map((t, i) => ({
    date: at(t).date,
    sunrise: at(d.sunrise[i]).minutes,
    sunset: at(d.sunset[i]).minutes,
    rainMm: d.precipitation_sum[i] ?? 0,
    rainProbMax: d.precipitation_probability_max[i] ?? null,
    tMax: d.temperature_2m_max[i],
    tMin: d.temperature_2m_min[i],
    code: d.weather_code[i],
  }))
  return { fetchedAt, hours, days }
}

export function cachedForecast(): Forecast | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Forecast) : null
  } catch {
    return null
  }
}

export async function fetchForecast(): Promise<Forecast> {
  const params = new URLSearchParams({
    latitude: String(CITY_CENTRE.lat),
    longitude: String(CITY_CENTRE.lng),
    timezone: 'Europe/Copenhagen',
    timeformat: 'unixtime',
    wind_speed_unit: 'ms',
    forecast_days: '16',
    hourly:
      'temperature_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,weather_code',
    daily:
      'sunrise,sunset,precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,weather_code',
  })
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${URL_BASE}?${params}`, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const fc = parseForecast((await res.json()) as OpenMeteoResponse, Date.now())
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(fc))
    } catch {
      // Storage full: keep the forecast for this session only.
    }
    return fc
  } finally {
    clearTimeout(timer)
  }
}
