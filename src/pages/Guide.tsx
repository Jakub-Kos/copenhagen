import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Route as RouteIcon, SlidersHorizontal } from 'lucide-react'
import { placeById, places } from '@/data/places'
import type { LatLng } from '@/data/types'
import { pricingFor } from '@/data/prices'
import { FilterPanel } from '@/components/FilterPanel'
import { KIND_ICON, WEATHER_ICON } from '@/components/kindStyle'
import { MapView, type MapLine } from '@/components/MapView'
import { PlaceDetail } from '@/components/PlaceDetail'
import { RouteBuilder } from '@/components/RouteBuilder'
import { WeatherHint } from '@/components/WeatherHint'
import { useRoutedTimeline } from '@/components/useTimeline'
import { Stars } from '@/components/ui'
import { cx, inputCls } from '@/components/cls'
import { useT } from '@/i18n/useT'
import { DEFAULT_FILTERS, type Filters, activeFilterCount, applyFilters } from '@/logic/filters'
import { CITY_CENTRE, haversineM } from '@/logic/geo'
import { addDays, datesBetween, formatDuration, todayInCph } from '@/logic/time'
import { useActiveTrip } from '@/state/store'
import type { DayPlan } from '@/state/tripTypes'
import { plannedPlaces, tripDates } from '@/state/tripOps'

function formatKm(m: number): string {
  return m < 1000 ? `${Math.round(m / 50) * 50} m` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} km`
}

export default function Guide() {
  const { t, bi, lang } = useT()
  const trip = useActiveTrip()
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('p')
  const selected = selectedId ? placeById.get(selectedId) : undefined
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [userLoc, setUserLoc] = useState<LatLng | null>(null)

  const today = todayInCph()
  const days = useMemo(() => {
    const ds = trip ? tripDates(trip).filter((d) => d >= today) : []
    return ds.length ? ds : datesBetween(today, addDays(today, 6))
  }, [trip, today])
  const refDate = filters.openOn ?? days[0]

  const origin = userLoc ?? trip?.homeBase?.coords ?? CITY_CENTRE
  const list = useMemo(() => applyFilters(places, filters, lang, origin), [filters, lang, origin])

  // Route mode: ?r=id1,id2,… (present but empty = route mode with no stops yet).
  const routeParam = params.get('r')
  const routeMode = routeParam !== null
  const routeIds = useMemo(() => (routeParam ? routeParam.split(',').filter((id) => placeById.has(id)) : []), [routeParam])
  const speedKmh = trip?.walkingSpeedKmh ?? 4.5
  const routeDay = useMemo<DayPlan>(
    () => ({
      startTime: '00:00',
      stops: routeIds.map((placeId, i) => ({ id: String(i), placeId, legMode: 'walk', visitMin: 0 })),
    }),
    [routeIds],
  )
  const routeOpts = useMemo(
    () => ({ date: today, speedKmh, origin: null, maxDayHours: 24, maxDayKm: 100, transitThresholdKm: 100 }),
    [today, speedKmh],
  )
  const routed = useRoutedTimeline(routeDay, routeOpts)

  const routeIdSet = useMemo(() => new Set(routeIds), [routeIds])
  const routePoints = useMemo(() => routeIds.map((id) => placeById.get(id)!.coords), [routeIds])

  const setRoute = (ids: string[] | null) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        n.delete('p')
        if (ids === null) n.delete('r')
        else n.set('r', ids.join(','))
        return n
      },
      { replace: true },
    )
  const appendToRoute = (id: string) => {
    if (routeIds.at(-1) !== id) setRoute([...routeIds, id])
  }

  const badges = useMemo(() => {
    const m = new Map<string, string>()
    if (routeMode) {
      routeIds.forEach((id, i) => m.set(id, m.has(id) ? `${m.get(id)},${i + 1}` : String(i + 1)))
    } else if (trip) {
      for (const id of plannedPlaces(trip).keys()) m.set(id, '✓')
    }
    return m
  }, [trip, routeMode, routeIds])

  const walkLines = useMemo<MapLine[]>(
    () => list.filter((p) => p.waypoints).map((p) => ({ id: p.id, coords: p.waypoints!, style: 'walk' })),
    [list],
  )

  const cityPoints = useMemo(() => places.filter((p) => p.kind !== 'day-trip').map((p) => p.coords), [])

  const select = (id: string | null) =>
    setParams(
      (prev) => {
        const n = new URLSearchParams(prev)
        if (id) n.set('p', id)
        else n.delete('p')
        return n
      },
      { replace: true },
    )

  const nActive = activeFilterCount(filters)

  return (
    <div className="md:grid md:h-[calc(100dvh-7.5rem)] md:grid-cols-[minmax(340px,420px)_1fr]">
      <div className="h-[42dvh] md:order-2 md:h-full">
        <MapView
          className="h-full w-full"
          places={list}
          selectedId={routeMode ? null : selectedId}
          onSelect={routeMode ? appendToRoute : select}
          badges={badges}
          home={trip?.homeBase}
          lines={routeMode ? routed.lines : walkLines}
          highlight={routeMode && routeIds.length > 0 ? routeIdSet : undefined}
          fitPoints={routeIds.length >= 2 ? routePoints : cityPoints}
          fitKey={routeIds.length >= 2 ? `route:${routeIds.join(',')}` : 'city'}
          onUserLocation={setUserLoc}
        />
      </div>

      <div className="flex flex-col gap-3 p-4 md:overflow-y-auto">
        <div className="flex gap-2">
          <input
            className={inputCls}
            type="search"
            placeholder={t('search')}
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            className={cx(
              'relative flex min-h-11 items-center gap-1 rounded-lg border px-3',
              showFilters ? 'border-accent text-accent' : 'border-slate-300 dark:border-slate-600',
            )}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">{t('filters')}</span>
            {nActive > 0 && (
              <span className="absolute -top-2 -right-2 rounded-full bg-accent px-1.5 text-xs text-white">{nActive}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setRoute(routeMode ? null : [])}
            aria-pressed={routeMode}
            title={t('routeMode')}
            className={cx(
              'flex min-h-11 items-center gap-1 rounded-lg border px-3',
              routeMode ? 'border-accent bg-accent text-white' : 'border-slate-300 dark:border-slate-600',
            )}
          >
            <RouteIcon size={18} />
            <span className="hidden sm:inline">{t('routeMode')}</span>
          </button>
        </div>

        {routeMode && <RouteBuilder ids={routeIds} onChange={setRoute} routed={routed} speedKmh={speedKmh} />}

        {showFilters && <FilterPanel value={filters} onChange={setFilters} days={days} />}

        <p className="text-sm text-slate-500 dark:text-slate-400">{t('results', { n: list.length })}</p>
        {list.length === 0 && <p>{t('noResults')}</p>}

        <ul className="flex flex-col gap-2">
          {list.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => (routeMode ? appendToRoute(p.id) : select(p.id))}
                className={cx(
                  'flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors',
                  p.id === selectedId
                    ? 'border-accent bg-accent/5'
                    : 'border-slate-200 bg-white hover:border-accent dark:border-slate-700 dark:bg-slate-800',
                )}
              >
                <span className="text-2xl" aria-hidden>
                  {KIND_ICON[p.kind]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="truncate">{bi(p.name)}</span>
                    {p.mustSee && <span className="text-mustsee" title={t('mustSee')}>★</span>}
                    {badges.has(p.id) && <span className="text-sm text-green-600">✓</span>}
                  </span>
                  <span className="flex flex-wrap gap-x-2 text-sm text-slate-500 dark:text-slate-400">
                    <Stars n={p.myRating} />
                    <span>{formatDuration(p.durationMin)}</span>
                    <span title={t(`weather.${p.weather}`)}>{WEATHER_ICON[p.weather]}</span>
                    {pricingFor(p.id).free && <span>🆓</span>}
                    <span>{formatKm(haversineM(origin, p.coords))}</span>
                  </span>
                  <WeatherHint place={p} date={refDate} dates={days} className="block" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {selected && !routeMode && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 max-h-[65dvh] overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-2xl md:right-auto md:bottom-4 md:left-4 md:w-[400px] md:rounded-2xl md:border dark:border-slate-700 dark:bg-slate-800">
          <PlaceDetail
            place={selected}
            refDate={refDate}
            distanceLabel={formatKm(haversineM(origin, selected.coords))}
            onClose={() => select(null)}
          />
        </div>
      )}
    </div>
  )
}
