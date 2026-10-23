import { useState } from 'react'
import { Shuffle, X } from 'lucide-react'
import { placeById } from '@/data/places'
import { useT } from '@/i18n/useT'
import { steps } from '@/logic/geo'
import { entryPoint, suggestLegMode } from '@/logic/timeline'
import { formatDayShort, formatDuration } from '@/logic/time'
import { optimizedOrder } from '@/services/valhalla'
import { useActiveTrip, useStore } from '@/state/store'
import { addStop, dayOf, tripDates } from '@/state/tripOps'
import { inputCls } from './cls'
import { KIND_ICON } from './kindStyle'
import { LegRow } from './LegRow'
import { Button } from './ui'
import type { RoutedTimeline } from './useTimeline'

interface Props {
  ids: string[]
  onChange: (ids: string[]) => void
  routed: RoutedTimeline
  speedKmh: number
}

/** Ad-hoc walking route built by tapping places in the guide. */
export function RouteBuilder({ ids, onChange, routed, speedKmh }: Props) {
  const { t, bi, lang } = useT()
  const { dispatch } = useStore()
  const trip = useActiveTrip()
  const [optimising, setOptimising] = useState(false)
  const [optimiseError, setOptimiseError] = useState(false)
  const { tl, legRoute } = routed

  // Walking time = legs + walking inside street walks; visits are not counted here.
  const minutes = tl.stops.reduce((m, s) => m + (s.leg?.minutes ?? 0), 0)

  async function optimise() {
    setOptimising(true)
    setOptimiseError(false)
    try {
      const order = await optimizedOrder(tl.stops.map((s) => entryPoint(s.place)), { speedKmh })
      onChange(order.map((i) => ids[i]))
    } catch {
      setOptimiseError(true)
    } finally {
      setOptimising(false)
    }
  }

  function saveToDay(date: string) {
    if (!trip) return
    let next = trip
    for (const id of ids) {
      const place = placeById.get(id)
      if (!place) continue
      const last = dayOf(next, date).stops.at(-1)
      const prev = last ? (placeById.get(last.placeId) ?? null) : null
      next = addStop(next, date, id, suggestLegMode(prev, trip.homeBase?.coords ?? null, place, trip.transitThresholdKm))
    }
    dispatch({ type: 'upsertTrip', trip: next })
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">🧭 {t('routeMode')}</h2>
        {ids.length > 0 && (
          <button type="button" className="text-sm text-accent underline" onClick={() => onChange([])}>
            {t('clearRoute')}
          </button>
        )}
      </div>
      {ids.length < 2 && <p className="text-sm text-slate-500 dark:text-slate-400">{t('routeModeHint')}</p>}

      <ol className="flex flex-col">
        {tl.stops.map((s, i) => (
          <li key={s.stopId}>
            {s.leg && <LegRow leg={s.leg} route={legRoute(s.leg)} />}
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-navy text-sm font-bold text-white">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate font-medium">
                {KIND_ICON[s.place.kind]} {bi(s.place.name)}
              </span>
              <button
                type="button"
                aria-label={t('remove')}
                className="p-1 text-slate-500"
                onClick={() => onChange(ids.filter((_, j) => j !== i))}
              >
                <X size={18} />
              </button>
            </div>
          </li>
        ))}
      </ol>

      {tl.stops.length >= 2 && (
        <p className="font-semibold">
          {t('routeTotal', {
            km: (tl.walkM / 1000).toFixed(1),
            time: formatDuration(minutes),
            steps: steps(tl.walkM).toLocaleString(lang),
          })}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {ids.length >= 4 && (
          <Button onClick={optimise} disabled={optimising}>
            <Shuffle size={18} /> {optimising ? t('optimising') : t('optimise')}
          </Button>
        )}
        {trip && ids.length > 0 && (
          <select
            className={`${inputCls} w-auto`}
            value=""
            aria-label={t('saveRouteToDay')}
            onChange={(e) => e.target.value && saveToDay(e.target.value)}
          >
            <option value="">💾 {t('saveRouteToDay')}</option>
            {tripDates(trip).map((d) => (
              <option key={d} value={d}>
                {formatDayShort(d, lang)}
              </option>
            ))}
          </select>
        )}
      </div>
      {optimiseError && <p className="text-sm text-red-600">{t('optimiseFailed')}</p>}
      <p className="text-xs text-slate-400">{t('osmCredit')}</p>
    </div>
  )
}
