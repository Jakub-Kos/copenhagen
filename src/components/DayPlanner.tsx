import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Shuffle, Trash2 } from 'lucide-react'
import { placeById, places } from '@/data/places'
import { useT } from '@/i18n/useT'
import { steps } from '@/logic/geo'
import { entryPoint, suggestLegMode } from '@/logic/timeline'
import { optimizedOrder } from '@/services/valhalla'
import { type IsoDate, fromMinutes } from '@/logic/time'
import { useStore } from '@/state/store'
import { addStop, dayOf, moveStop, plannedPlaces, removeStop, reorderStops, setStartTime, updateStop } from '@/state/tripOps'
import type { Trip } from '@/state/tripTypes'
import { KIND_ICON } from './kindStyle'
import { LegRow } from './LegRow'
import { Directions } from './Directions'
import { MapView } from './MapView'
import { Button, Field } from './ui'
import { inputCls } from './cls'
import { useTimeline } from './useTimeline'

export function DayPlanner({ trip, date }: { trip: Trip; date: IsoDate }) {
  const { t, bi, lang } = useT()
  const { dispatch } = useStore()
  const save = (next: Trip) => dispatch({ type: 'upsertTrip', trip: next })
  const day = dayOf(trip, date)
  const { tl, legRoute, walkRoute, lines } = useTimeline(trip, date)
  const [optimising, setOptimising] = useState(false)
  const [optimiseError, setOptimiseError] = useState(false)

  const closedStops = new Set(tl.warnings.flatMap((w) => (w.kind === 'closed' ? [w.stopId] : [])))
  const sortedPlaces = useMemo(() => [...places].sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang)), [lang])

  const unplannedMustSees = useMemo(() => {
    const planned = plannedPlaces(trip)
    return places.filter((p) => p.mustSee && !planned.has(p.id))
  }, [trip])

  const badges = useMemo(() => new Map(tl.stops.map((s, i) => [s.place.id, String(i + 1)])), [tl.stops])
  const dayPlaces = useMemo(() => tl.stops.map((s) => s.place), [tl.stops])
  const fitPoints = useMemo(
    () => [...dayPlaces.map((p) => p.coords), ...(trip.homeBase ? [trip.homeBase.coords] : [])],
    [dayPlaces, trip.homeBase],
  )

  function add(placeId: string) {
    const place = placeById.get(placeId)
    if (!place) return
    const prev = tl.stops.at(-1)?.place ?? null
    save(addStop(trip, date, placeId, suggestLegMode(prev, trip.homeBase?.coords ?? null, place, trip.transitThresholdKm)))
  }

  /** Valhalla keeps the first and last location fixed; with a home base those are home, so every stop can move. */
  async function optimise() {
    const stops = tl.stops
    const home = trip.homeBase?.coords
    const points = [...(home ? [home] : []), ...stops.map((s) => entryPoint(s.place)), ...(home ? [home] : [])]
    setOptimising(true)
    setOptimiseError(false)
    try {
      const order = await optimizedOrder(points, { speedKmh: trip.walkingSpeedKmh })
      const stopOrder = home ? order.slice(1, -1).map((i) => i - 1) : order
      let next = reorderStops(trip, date, stopOrder.map((i) => stops[i].stopId))
      // Legs changed, so re-suggest walk vs transport for each of them.
      const ordered = dayOf(next, date).stops
      ordered.forEach((st, i) => {
        const place = placeById.get(st.placeId)
        const prev = i > 0 ? (placeById.get(ordered[i - 1].placeId) ?? null) : null
        if (place) {
          const legMode = suggestLegMode(prev, home ?? null, place, trip.transitThresholdKm)
          next = updateStop(next, date, st.id, { legMode })
        }
      })
      save(next)
    } catch {
      setOptimiseError(true)
    } finally {
      setOptimising(false)
    }
  }

  const canOptimise = tl.stops.length >= (trip.homeBase ? 2 : 4)

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_1fr] md:items-start">
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-3">
          <Field label={t('startTime')}>
            <input
              type="time"
              className={inputCls}
              value={day.startTime}
              onChange={(e) => e.target.value && save(setStartTime(trip, date, e.target.value))}
            />
          </Field>
          {trip.homeBase && <p className="pb-2 text-sm text-slate-500">🏠 {trip.homeBase.label}</p>}
        </div>

        {tl.stops.length === 0 && <p className="text-slate-500">{t('emptyDay')}</p>}

        <ol className="flex flex-col">
          {tl.stops.map((s, i) => {
            const stop = day.stops.find((x) => x.id === s.stopId)!
            return (
              <li key={s.stopId}>
                {s.leg && <LegRow leg={s.leg} route={legRoute(s.leg)} onMode={(m) => save(updateStop(trip, date, s.stopId, { legMode: m }))} />}
                <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-start gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy font-bold text-white">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">
                        {KIND_ICON[s.place.kind]} {bi(s.place.name)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {fromMinutes(s.arrive)} – {fromMinutes(s.leave)}
                      </div>
                      {closedStops.has(s.stopId) && (
                        <div className="text-sm font-medium text-red-600 dark:text-red-400">⚠️ {t('warn.closed')}</div>
                      )}
                      {s.place.waypoints && (() => {
                        const r = walkRoute(s.place)
                        return r?.status === 'ok' ? <div className="mt-1 text-sm"><Directions route={r.route} /></div> : null
                      })()}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-1 text-sm" title={t('visitMin')}>
                      ⏱
                      <input
                        type="number"
                        min={5}
                        step={5}
                        aria-label={t('visitMin')}
                        className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-900"
                        value={stop.visitMin ?? s.place.durationMin}
                        onChange={(e) =>
                          save(updateStop(trip, date, s.stopId, { visitMin: Number(e.target.value) > 0 ? Number(e.target.value) : null }))
                        }
                      />
                      min
                    </label>
                    <span className="ml-auto" />
                    <Button variant="ghost" className="px-2.5" aria-label={t('moveUp')} disabled={i === 0} onClick={() => save(moveStop(trip, date, s.stopId, -1))}>
                      <ArrowUp size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2.5"
                      aria-label={t('moveDown')}
                      disabled={i === tl.stops.length - 1}
                      onClick={() => save(moveStop(trip, date, s.stopId, 1))}
                    >
                      <ArrowDown size={20} />
                    </Button>
                    <Button variant="ghost" className="px-2.5" aria-label={t('remove')} onClick={() => save(removeStop(trip, date, s.stopId))}>
                      <Trash2 size={20} />
                    </Button>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>

        {tl.homeLeg && trip.homeBase && (
          <div>
            <LegRow leg={tl.homeLeg} route={legRoute(tl.homeLeg)} />
            <div className="ml-1 text-sm font-medium">🏠 {t('backHome', { home: trip.homeBase.label })} · {fromMinutes(tl.end)}</div>
          </div>
        )}

        {canOptimise && (
          <div className="flex flex-col gap-1">
            <Button onClick={optimise} disabled={optimising} className="self-start">
              <Shuffle size={18} /> {optimising ? t('optimising') : t('optimise')}
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('optimiseHint')}</p>
            {optimiseError && <p className="text-sm text-red-600">{t('optimiseFailed')}</p>}
          </div>
        )}

        <select className={inputCls} value="" onChange={(e) => e.target.value && add(e.target.value)} aria-label={t('addPlace')}>
          <option value="">➕ {t('addPlace')}</option>
          {sortedPlaces.map((p) => (
            <option key={p.id} value={p.id}>
              {KIND_ICON[p.kind]} {bi(p.name)}
            </option>
          ))}
        </select>

        {tl.stops.length > 0 && (
          <div className="rounded-lg bg-slate-100 p-3 text-sm dark:bg-slate-900">
            <p className="font-medium">
              {t('dayTotals', {
                km: (tl.walkM / 1000).toFixed(1),
                steps: steps(tl.walkM).toLocaleString(lang),
                end: fromMinutes(tl.end),
              })}
            </p>
            {tl.warnings.map((w, i) =>
              w.kind === 'too-long' ? (
                <p key={i} className="text-amber-700 dark:text-amber-400">⚠️ {t('warn.too-long', { h: w.hours.toFixed(1) })}</p>
              ) : w.kind === 'too-far' ? (
                <p key={i} className="text-amber-700 dark:text-amber-400">⚠️ {t('warn.too-far', { km: w.km.toFixed(1) })}</p>
              ) : null,
            )}
          </div>
        )}

        {unplannedMustSees.length > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            ★ {t('unplannedMustSees', { list: unplannedMustSees.map((p) => bi(p.name)).join(', ') })}
          </p>
        )}
      </div>

      {tl.stops.length > 0 && (
        <MapView
          className="h-[45dvh] w-full overflow-hidden rounded-xl md:sticky md:top-20"
          places={dayPlaces}
          badges={badges}
          home={trip.homeBase}
          lines={lines}
          fitPoints={fitPoints}
          fitKey={`${date}:${fitPoints.length}`}
        />
      )}
    </div>
  )
}
