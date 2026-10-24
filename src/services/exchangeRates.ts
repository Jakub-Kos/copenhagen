// DKK → CZK from the ECB reference rates via Frankfurter (free, no key, CORS).
// All exchange-rate network access is here.

const URL = 'https://api.frankfurter.dev/v1/latest?base=DKK&symbols=CZK'
const CACHE_KEY = 'cph:czk-rate'
const MAX_AGE_MS = 12 * 60 * 60 * 1000

export interface Rate {
  /** CZK per 1 DKK. */
  rate: number
  /** ECB reference date of the rate. */
  date: string
  fetchedAt: number
}

export function cachedRate(): Rate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? (JSON.parse(raw) as Rate) : null
  } catch {
    return null
  }
}

export const isFresh = (r: Rate | null) => r !== null && Date.now() - r.fetchedAt < MAX_AGE_MS

export async function fetchRate(): Promise<Rate> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 15000)
  try {
    const res = await fetch(URL, { signal: ctrl.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const j = (await res.json()) as { date: string; rates: { CZK: number } }
    const r: Rate = { rate: j.rates.CZK, date: j.date, fetchedAt: Date.now() }
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(r))
    } catch {
      // Storage unavailable: the rate is just fetched again next time.
    }
    return r
  } finally {
    clearTimeout(timer)
  }
}
