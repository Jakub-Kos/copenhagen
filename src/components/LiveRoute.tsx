import { useEffect, useState } from 'react'
import { LocateFixed } from 'lucide-react'
import type { LatLng } from '@/data/types'
import { useT } from '@/i18n/useT'
import { steps } from '@/logic/geo'
import { formatDuration } from '@/logic/time'
import { Directions } from './Directions'
import type { MapLine } from './MapView'
import { Button } from './ui'
import { useRoutes } from './useRoutes'

export interface LiveTarget {
  id: string
  label: string
  coords: LatLng
}

/** Rounded to ~10 m so small GPS jitter reuses the cached route. */
const round = (p: LatLng): LatLng => ({ lat: Number(p.lat.toFixed(4)), lng: Number(p.lng.toFixed(4)) })

/** "Route from my location" to one of the targets, with turn-by-turn directions in the app. */
export function LiveRoute({
  targets,
  speedKmh,
  onLine,
}: {
  targets: LiveTarget[]
  speedKmh: number
  onLine: (l: MapLine | null) => void
}) {
  const { t, lang } = useT()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pos, setPos] = useState<LatLng | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState(false)

  const target = targets.find((x) => x.id === activeId)
  const specs = target && pos ? [{ id: 'live', points: [pos, target.coords] }] : []
  const entry = useRoutes(specs, speedKmh, lang).get('live')

  const shape = entry?.status === 'ok' ? entry.route.shape : null
  useEffect(() => {
    onLine(shape ? { id: 'live', coords: shape, style: 'route' } : null)
  }, [shape, onLine])

  function start(id: string) {
    setActiveId(id)
    setLocError(false)
    if (!navigator.geolocation) return setLocError(true)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false)
        setPos(round({ lat: p.coords.latitude, lng: p.coords.longitude }))
      },
      () => {
        setLocating(false)
        setLocError(true)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {targets.map((x) => (
          <Button key={x.id} onClick={() => start(x.id)} variant={x.id === activeId ? 'primary' : 'secondary'}>
            <LocateFixed size={18} /> {x.label}
          </Button>
        ))}
      </div>
      {target && (
        <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          {locating && <p>{t('locating')}</p>}
          {locError && <p className="text-red-600">{t('locationError')}</p>}
          {!locating && !locError && pos && (
            <>
              {(!entry || entry.status === 'loading') && <p>{t('routeLoading')}</p>}
              {entry?.status === 'error' && (
                <p className="text-amber-700 dark:text-amber-400">
                  {t(entry.rateLimited ? 'routeRateLimited' : 'routeError')}
                </p>
              )}
              {entry?.status === 'ok' && (
                <>
                  <p className="mb-2 font-semibold">
                    {(entry.route.metres / 1000).toFixed(1)} km · {formatDuration(entry.route.seconds / 60)} · ~
                    {steps(entry.route.metres).toLocaleString(lang)} 👣
                  </p>
                  <Directions route={entry.route} open />
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
