import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, GripVertical, Shuffle, Sparkles, Trash2, Undo2 } from 'lucide-react'
import { placeById, places } from '@/data/places'
import { useT } from '@/i18n/useT'
import { steps } from '@/logic/geo'
import { suggestDay } from '@/logic/suggest'
import { entryPoint, suggestLegMode } from '@/logic/timeline'
import { fitFor } from '@/logic/weatherFit'
import { costItems, sumItems } from '@/logic/costs'
import { optimizedOrder } from '@/services/valhalla'
import { type IsoDate, fromMinutes } from '@/logic/time'
import { useStore } from '@/state/store'
import {
  addStop,
  dayOf,
  tripDates,
  moveStop,
  moveStopTo,
  plannedPlaces,
  removeStop,
  reorderStops,
  resuggestLegModes,
  setStartTime,
  updateStop,
} from '@/state/tripOps'
import type { Trip } from '@/state/tripTypes'
import { KIND_ICON } from './kindStyle'
import { LegRow } from './LegRow'
import { Directions } from './Directions'
import { MapView } from './MapView'
import { Button, Field } from './ui'
import { cx, inputCls } from './cls'
import { formatDkk } from './money'
import { useForecast } from './useForecast'
import { useTimeline } from './useTimeline'
import { WeatherHint } from './WeatherHint'
import { WeatherStrip } from './WeatherStrip'

type StopWarning = 'closed' | 'dark' | 'rain' | 'wind'

const WARN_STYLE: Record<StopWarning, { icon: string; cls: string }> = {
  closed: { icon: '⚠️', cls: 'text-red-600 dark:text-red-400' },
  dark: { icon: '🌙', cls: 'text-amber-700 dark:text-amber-400' },
  rain: { icon: '🌧️', cls: 'text-blue-700 dark:text-blue-300' },
  wind: { icon: '💨', cls: 'text-amber-700 dark:text-amber-400' },
}

export function DayPlanner({ trip, date }: { trip: Trip; date: IsoDate }) {
  const { t, bi, lang } = useT()
  const { dispatch } = useStore()
  const save = (next: Trip) => dispatch({ type: 'upsertTrip', trip: next })
  const day = dayOf(trip, date)
  const { tl, legRoute, walkRoute, lines } = useTimeline(trip, date)
  const { forecast } = useForecast()
  const dates = tripDates(trip)
  const [optimising, setOptimising] = useState(false)
  const [notice, setNotice] = useState<'optimiseFailed' | 'nothingFits' | null>(null)
  /** The trip before the last automatic change (suggest/optimise), for one-step undo. */
  const [undo, setUndo] = useState<Trip | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  const stopWarnings = useMemo(() => {
    const m = new Map<string, StopWarning[]>()
    for (const w of tl.warnings) {
      if ('stopId' in w) m.set(w.stopId, [...(m.get(w.stopId) ?? []), w.kind])
    }
    return m
  }, [tl.warnings])
  const sortedPlaces = useMemo(() => [...places].sort((a, b) => a.name[lang].localeCompare(b.name[lang], lang)), [lang])

  const planned = useMemo(() => plannedPlaces(trip), [trip])
  const unplannedMustSees = useMemo(() => places.filter((p) => p.mustSee && !planned.has(p.id)), [planned])

  const badges = useMemo(() => new Map(tl.stops.map((s, i) => [s.place.id, String(i + 1)])), [tl.stops])
  const dayPlaces = useMemo(() => tl.stops.map((s) => s.place), [tl.stops])
  const fitPoints = useMemo(
    () => [...dayPlaces.map((p) => p.coords), ...(trip.homeBase ? [trip.homeBase.coords] : [])],
    [dayPlaces, trip.homeBase],
  )

  /** Automatic changes keep an undo step. */
  function saveWithUndo(next: Trip) {
    setUndo(trip)
    save(next)
  }

  function add(placeId: string) {
    const place = placeById.get(placeId)
    if (!place) return
    const prev = tl.stops.at(-1)?.place ?? null
    save(addStop(trip, date, placeId, suggestLegMode(prev, trip.homeBase?.coords ?? null, place, trip.transitThresholdKm)))
  }

  function suggest() {
    setNotice(null)
    const picks = suggestDay({
      date,
      day,
      candidates: places,
      planned: new Set(planned.keys()),
      origin: trip.homeBase?.coords ?? null,
      speedKmh: trip.walkingSpeedKmh,
      maxDayHours: trip.maxDayHours,
      maxDayKm: trip.maxDayKm,
      transitThresholdKm: trip.transitThresholdKm,
      extraScore: forecast ? (p, from, to) => fitFor(p, forecast, date, from, to)?.score ?? 0 : undefined,
    })
    if (!picks.length) return setNotice('nothingFits')
    saveWithUndo(picks.reduce((tr, p) => addStop(tr, date, p.placeId, p.legMode), trip))
  }

  /** Valhalla keeps the first and last location fixed; with a home base those are home, so every stop can move. */
  async function optimise() {
    const stops = tl.stops
    const home = trip.homeBase?.coords
    const points = [...(home ? [home] : []), ...stops.map((s) => entryPoint(s.place)), ...(home ? [home] : [])]
    setOptimising(true)
    setNotice(null)
    try {
      const order = await optimizedOrder(points, { speedKmh: trip.walkingSpeedKmh })
      const stopOrder = home ? order.slice(1, -1).map((i) => i - 1) : order
      saveWithUndo(resuggestLegModes(reorderStops(trip, date, stopOrder.map((i) => stops[i].stopId)), date))
    } catch {
      setNotice('optimiseFailed')
    } finally {
      setOptimising(false)
    }
  }

  function drop(targetIndex: number) {
    if (dragId) save(resuggestLegModes(moveStopTo(trip, date, dragId, targetIndex), date))
    setDragId(null)
    setOverId(null)
  }

  const canOptimise = tl.stops.length >= (trip.homeBase ? 2 : 4)

  return (
    <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_1fr] md:items-start">
      <div className="flex flex-col gap-3">
        <WeatherStrip date={date} />
        <div className="flex items-end gap-3">
          <Field label={t('startTime')}>
            <input
              type="time"
              className={inputCls}
              value={day.startTime}
              onChange={(e) => e.target.value && save(setStartTime(trip, date, e.target.value))}
            />
          </Field>
          <div className="pb-2 text-sm text-slate-500 dark:text-slate-400">
            {trip.homeBase && <div>🏠 {trip.homeBase.label}</div>}
            {tl.sunset !== null && <div>🌇 {t('sunset', { t: fromMinutes(tl.sunset) })}</div>}
          </div>
        </div>

        {tl.stops.length === 0 && <p className="text-slate-500">{t('emptyDay')}</p>}

        <ol className="flex flex-col">
          {tl.stops.map((s, i) => {
            const stop = day.stops.find((x) => x.id === s.stopId)!
            const warns = stopWarnings.get(s.stopId) ?? []
            return (
              <li
                key={s.stopId}
                onDragOver={(e) => {
                  if (!dragId) return
                  e.preventDefault()
                  setOverId(s.stopId)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  drop(i)
                }}
              >
                {s.leg && <LegRow leg={s.leg} route={legRoute(s.leg)} onMode={(m) => save(updateStop(trip, date, s.stopId, { legMode: m }))} />}
                <div
                  draggable
                  onDragStart={(e) => {
                    setDragId(s.stopId)
                    e.dataTransfer.effectAllowed = 'move'
                  }}
                  onDragEnd={() => {
                    setDragId(null)
                    setOverId(null)
                  }}
                  className={cx(
                    'rounded-xl border bg-white p-3 dark:bg-slate-800',
                    overId === s.stopId && dragId !== s.stopId
                      ? 'border-accent ring-2 ring-accent/40'
                      : 'border-slate-200 dark:border-slate-700',
                    dragId === s.stopId && 'opacity-50',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <GripVertical size={20} className="mt-1.5 hidden shrink-0 cursor-grab text-slate-400 md:block" aria-hidden />
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-navy font-bold text-white">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">
                        {KIND_ICON[s.place.kind]} {bi(s.place.name)}
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {fromMinutes(s.arrive)} – {fromMinutes(s.leave)}
                      </div>
                      {warns.map((w) => (
                        <div key={w} className={`text-sm font-medium ${WARN_STYLE[w].cls}`}>
                          {WARN_STYLE[w].icon} {t(`warn.${w}`)}
                        </div>
                      ))}
                      {(warns.includes('rain') || warns.includes('wind')) && (
                        <WeatherHint place={s.place} date={date} dates={dates} />
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
                    <Button
                      variant="ghost"
                      className="px-2.5"
                      aria-label={t('moveUp')}
                      disabled={i === 0}
                      onClick={() => save(resuggestLegModes(moveStop(trip, date, s.stopId, -1), date))}
                    >
                      <ArrowUp size={20} />
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2.5"
                      aria-label={t('moveDown')}
                      disabled={i === tl.stops.length - 1}
                      onClick={() => save(resuggestLegModes(moveStop(trip, date, s.stopId, 1), date))}
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

        <div className="flex flex-wrap gap-2">
          <Button variant="primary" onClick={suggest}>
            <Sparkles size={18} /> {tl.stops.length ? t('suggestMore') : t('suggestDay')}
          </Button>
          {canOptimise && (
            <Button onClick={optimise} disabled={optimising}>
              <Shuffle size={18} /> {optimising ? t('optimising') : t('optimise')}
            </Button>
          )}
          {undo && (
            <Button
              variant="ghost"
              onClick={() => {
                save(undo)
                setUndo(null)
              }}
            >
              <Undo2 size={18} /> {t('undo')}
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('suggestHint')}</p>
        {notice && <p className="text-sm text-amber-700 dark:text-amber-400">{t(notice)}</p>}

        <select className={inputCls} value="" onChange={(e) => e.target.value && add(e.target.value)} aria-label={t('addPlace')}>
          <option value="">➕ {t('addPlace')}</option>
          {sortedPlaces.map((p) => (
            <option key={p.id} value={p.id}>
              {KIND_ICON[p.kind]} {bi(p.name)}
              {planned.has(p.id) ? ' ✓' : ''}
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
            {trip.group.length > 0 && (() => {
              const its = costItems(trip, new Map([[date, tl]]), [date])
              const e = sumItems(its.filter((i) => i.kind === 'entry'))
              const tr = sumItems(its.filter((i) => i.kind === 'transport'))
              const unknown = e.unknown + tr.unknown
              return (
                <p>
                  💰 {t('dayCosts', { entries: formatDkk(e.dkk, lang), transport: formatDkk(tr.dkk, lang) })}
                  {unknown > 0 && ` ${t('someUnknown', { n: unknown })}`}
                </p>
              )
            })()}
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
