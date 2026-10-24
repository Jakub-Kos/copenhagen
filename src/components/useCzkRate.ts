import { useEffect, useState } from 'react'
import { type Rate, cachedRate, fetchRate, isFresh } from '@/services/exchangeRates'

/** ECB DKK→CZK rate (cached 12 h); `error` when it could not be loaded and nothing is cached. */
export function useCzkRate(): { rate: Rate | null; loading: boolean; error: boolean } {
  const [rate, setRate] = useState<Rate | null>(cachedRate)
  const [loading, setLoading] = useState(!isFresh(rate))
  const [error, setError] = useState(false)
  useEffect(() => {
    if (isFresh(cachedRate())) return
    let alive = true
    fetchRate().then(
      (r) => {
        if (!alive) return
        setRate(r)
        setLoading(false)
      },
      () => {
        if (!alive) return
        setError(true)
        setLoading(false)
      },
    )
    return () => {
      alive = false
    }
  }, [])
  return { rate, loading, error }
}
