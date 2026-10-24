import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Home, Navigation, TrainFront } from 'lucide-react'
import { KIND_ICON } from '@/components/kindStyle'
import { LegRow } from '@/components/LegRow'
import { legTripInto } from '@/components/legTrip'
import { LiveRoute, type LiveTarget } from '@/components/LiveRoute'
import { LunchHint } from '@/components/LunchHint'
import { ToiletNearby } from '@/components/ToiletNearby'
import { OfflineCard } from '@/components/OfflineCard'
import { Reminders } from '@/components/Reminders'
import { MapView, type MapLine } from '@/components/MapView'
import { cx } from '@/components/cls'
import { useTimeline } from '@/components/useTimeline'
import { WeatherStrip } from '@/components/WeatherStrip'
import { WeatherSwap } from '@/components/WeatherSwap'
import { imageFor, thumb } from '@/components/placeImage'
import { useT } from '@/i18n/useT'
import { googleMapsDirections, rejseplanenUrl } from '@/logic/geo'
import { entryPoint } from '@/logic/timeline'
import { type IsoDate, formatDayLong, fromMinutes, nowMinutesInCph, todayInCph } from '@/logic/time'
import { useActiveTrip } from '@/state/store'
import { dayOf, tripDates } from '@/state/tripOps'
import type { Trip } from '@/state/tripTypes'

/** Re-render every minute so "next stop" moves on by itself. */
function useNow() {
  const [now, setNow] = useState(() => ({ date: todayInCph(), min: nowMinutesInCph() }))
  useEffect(() => {
    const id = setInterval(() => setNow({ date: todayInCph(), min: nowMinutesInCph() }), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}

export default function Today() {
  const { t, lang } = useT()
  const trip = useActiveTrip()
  const now = useNow()

  if (!trip) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <p className="mb-3">{t('noActiveTrip')}</p>
        <Link to="/plan">{t('goPlan')}</Link>
      </div>
    )
  }

  const dates = tripDates(trip)
  if (!dates.includes(now.date)) {
    const next = dates.find((d) => d > now.date && dayOf(trip, d).stops.length)
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-3 p-4">
        <p>{t('notInTrip', { name: trip.name })}</p>
        <Reminders trip={trip} />
        {next && (
          <p>
            {t('nextDay', { day: formatDayLong(next, lang) })} –{' '}
            <Link to={`/plan?d=${next}`}>{t('showTodayPlan')}</Link>
          </p>
        )}
        <OfflineCard trip={trip} compact />
      </div>
    )
  }

  return <TodayPlan trip={trip} date={now.date} nowMin={now.min} />
}

function TodayPlan({ trip, date, nowMin }: { trip: Trip; date: IsoDate; nowMin: number }) {
  const { t, bi, lang } = useT()
  const { tl, legRoute, lines: dayLines } = useTimeline(trip, date)
  const [liveLine, setLiveLine] = useState<MapLine | null>(null)
  const warned = (stopId: string, kind: 'closed' | 'dark' | 'rain' | 'wind') =>
    tl.warnings.some((w) => w.kind === kind && w.stopId === stopId)
  // The next stop is the first one not yet left.
  const nextIdx = tl.stops.findIndex((s) => s.leave > nowMin)

  const lines = useMemo(() => (liveLine ? [...dayLines, liveLine] : dayLines), [dayLines, liveLine])
  const dayPlaces = useMemo(() => tl.stops.map((s) => s.place), [tl.stops])
  const badges = useMemo(() => new Map(tl.stops.map((s, i) => [s.place.id, String(i + 1)])), [tl.stops])
  const next = nextIdx >= 0 ? tl.stops[nextIdx] : null
  const fitPoints = useMemo(
    () => (liveLine ? liveLine.coords : next ? [next.place.coords] : dayPlaces.map((p) => p.coords)),
    [next, dayPlaces, liveLine],
  )
  const liveTargets: LiveTarget[] = [
    ...(next ? [{ id: 'next', label: t('routeToNext'), coords: entryPoint(next.place) }] : []),
    ...(trip.homeBase ? [{ id: 'home', label: t('routeHomeFromHere'), coords: trip.homeBase.coords }] : []),
  ]

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-3 p-4">
      <div>
        <h1 className="text-2xl font-bold first-letter:uppercase">{formatDayLong(date, lang)}</h1>
        {tl.sunset !== null && <p className="text-slate-500 dark:text-slate-400">🌇 {t('sunset', { t: fromMinutes(tl.sunset) })}</p>}
      </div>

      <Reminders trip={trip} />

      <WeatherStrip date={date} />

      {tl.stops.length === 0 ? (
        <p>
          {t('emptyDay')} <Link to={`/plan?d=${date}`}>{t('goPlan')}</Link>
        </p>
      ) : (
        <>
          <MapView
            className="h-[35dvh] w-full overflow-hidden rounded-xl"
            places={dayPlaces}
            selectedId={next?.place.id}
            badges={badges}
            home={trip.homeBase}
            lines={lines}
            fitPoints={fitPoints}
            fitKey={`${date}:${nextIdx}:${liveLine ? liveLine.coords.length : 0}`}
          />

          <ol className="flex flex-col">
            {tl.stops.map((s, i) => {
              const isNext = i === nextIdx
              const isDone = nextIdx === -1 || i < nextIdx
              return (
                <li key={s.stopId}>
                  {s.leg && <LegRow leg={s.leg} route={legRoute(s.leg)} trip={legTripInto(tl, i, date, trip.homeBase?.label ?? '')} />}
                  <div
                    className={cx(
                      'overflow-hidden rounded-xl border',
                      isNext
                        ? 'border-2 border-accent bg-accent/5 shadow-md'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800',
                      isDone && 'opacity-55',
                    )}
                  >
                    {isNext && imageFor(s.place.id) && (
                      <img src={thumb(imageFor(s.place.id)!, 500)} crossOrigin="anonymous" alt="" className="h-36 w-full object-cover" />
                    )}
                    <div className="flex flex-col gap-3 p-4">
                      <div className="flex items-start gap-3">
                        <span className={cx('grid size-9 shrink-0 place-items-center rounded-full font-bold text-white', isNext ? 'bg-accent' : 'bg-navy')}>
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          {isNext && <div className="text-sm font-bold tracking-wide text-accent uppercase">{t('nextStop')}</div>}
                          <div className="text-lg leading-tight font-semibold">
                            {KIND_ICON[s.place.kind]} {bi(s.place.name)}
                          </div>
                          <div className="text-slate-600 dark:text-slate-300">
                            {fromMinutes(s.arrive)} – {fromMinutes(s.leave)}
                            {isDone && ` · ✓ ${t('done')}`}
                          </div>
                          {!isDone && warned(s.stopId, 'closed') && (
                            <div className="font-medium text-red-600 dark:text-red-400">⚠️ {t('warn.closed')}</div>
                          )}
                          {!isDone && warned(s.stopId, 'dark') && (
                            <div className="font-medium text-amber-700 dark:text-amber-400">🌙 {t('warn.dark')}</div>
                          )}
                          {!isDone && warned(s.stopId, 'rain') && (
                            <div className="font-medium text-blue-700 dark:text-blue-300">🌧️ {t('warn.rain')}</div>
                          )}
                          {!isDone && warned(s.stopId, 'wind') && (
                            <div className="font-medium text-amber-700 dark:text-amber-400">💨 {t('warn.wind')}</div>
                          )}
                          {isNext && <p className="mt-1 text-sm">{bi(s.place.description)}</p>}
                        </div>
                      </div>
                      {!isDone && (warned(s.stopId, 'rain') || warned(s.stopId, 'wind')) && (
                        <WeatherSwap trip={trip} date={date} stop={s} />
                      )}
                      {isNext && (
                        <a
                          href={googleMapsDirections(s.place.waypoints?.[0] ?? s.place.coords, undefined, s.leg?.mode === 'transit' ? 'transit' : 'walking')}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-accent text-lg font-semibold text-white no-underline"
                        >
                          <Navigation size={20} /> {t('navigate')}
                        </a>
                      )}
                      {isNext && <ToiletNearby at={entryPoint(s.place)} />}
                      {isNext && <LiveRoute targets={liveTargets} speedKmh={trip.walkingSpeedKmh} onLine={setLiveLine} />}
                    </div>
                  </div>
                  {!isDone && <LunchHint tl={tl} date={date} speedKmh={trip.walkingSpeedKmh} index={i} />}
                </li>
              )
            })}
          </ol>
        </>
      )}

      {!next && liveTargets.length > 0 && (
        <LiveRoute targets={liveTargets} speedKmh={trip.walkingSpeedKmh} onLine={setLiveLine} />
      )}

      {trip.homeBase && (
        <a
          href={googleMapsDirections(trip.homeBase.coords)}
          target="_blank"
          rel="noreferrer"
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 no-underline dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <Home size={18} /> {t('navigateHome')} ({trip.homeBase.label})
        </a>
      )}
      {trip.homeBase && (
        <a
          href={rejseplanenUrl('here', { coords: trip.homeBase.coords, name: trip.homeBase.label })}
          target="_blank"
          rel="noreferrer"
          title={t('rejseplanenHint')}
          className="flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white font-medium text-slate-800 no-underline dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <TrainFront size={18} /> {t('transitHome')}
        </a>
      )}

      <OfflineCard trip={trip} compact />
    </div>
  )
}
