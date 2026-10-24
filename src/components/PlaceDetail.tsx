import { useMemo } from 'react'
import { ExternalLink, Navigation, X } from 'lucide-react'
import type { Place } from '@/data/types'
import { pricingFor } from '@/data/prices'
import { useT } from '@/i18n/useT'
import { googleMapsDirections } from '@/logic/geo'
import { hoursOn } from '@/logic/hours'
import { type IsoDate, addDays, formatDayShort, formatDuration } from '@/logic/time'
import { suggestLegMode } from '@/logic/timeline'
import { placeById } from '@/data/places'
import { useActiveTrip, useStore } from '@/state/store'
import { addStop, dayOf, plannedPlaces, tripDates } from '@/state/tripOps'
import { KIND_ICON, WEATHER_ICON } from './kindStyle'
import { Button, Stars } from './ui'
import { PriceInfo } from './PriceInfo'
import { WeatherHint } from './WeatherHint'
import { cx, inputCls } from './cls'

const week0 = (d: IsoDate) => Array.from({ length: 7 }, (_, i) => addDays(d, i))

interface Props {
  place: Place
  /** Date the hours are shown for. */
  refDate: IsoDate
  distanceLabel?: string
  onClose: () => void
}

export function PlaceDetail({ place: p, refDate, distanceLabel, onClose }: Props) {
  const { t, bi, lang } = useT()
  const { dispatch } = useStore()
  const trip = useActiveTrip()
  const pricing = pricingFor(p.id)
  const planned = trip ? (plannedPlaces(trip).get(p.id) ?? []) : []

  const hintDates = trip ? tripDates(trip) : week0(refDate)
  const week = useMemo(() => week0(refDate), [refDate])

  function add(date: IsoDate) {
    if (!trip) return
    const last = dayOf(trip, date).stops.at(-1)
    const prev = last ? placeById.get(last.placeId) : undefined
    const mode = suggestLegMode(prev ?? null, trip.homeBase?.coords ?? null, p, trip.transitThresholdKm)
    dispatch({ type: 'upsertTrip', trip: addStop(trip, date, p.id, mode) })
  }

  return (
    <article className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {KIND_ICON[p.kind]} {t(`kind.${p.kind}`)}
            {distanceLabel && <> · {t('away', { d: distanceLabel })}</>}
          </div>
          <h2 className="text-xl leading-tight font-bold">{bi(p.name)}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <Stars n={p.myRating} />
            {p.mustSee && (
              <span className="rounded-full bg-mustsee/20 px-2 font-semibold text-amber-800 dark:text-amber-300">
                {t('mustSee')}
              </span>
            )}
          </div>
        </div>
        <Button variant="ghost" onClick={onClose} aria-label={t('close')} className="-mr-2 shrink-0">
          <X />
        </Button>
      </div>

      <WeatherHint place={p} date={refDate} dates={hintDates} />
      <p>{bi(p.description)}</p>
      {p.notes && <p className="text-sm text-slate-600 dark:text-slate-300">💡 {bi(p.notes)}</p>}

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
        <dt className="text-slate-500 dark:text-slate-400">{t('duration')}</dt>
        <dd>
          {formatDuration(p.durationMin)}
          {p.durationMax && ` – ${formatDuration(p.durationMax)}`}
        </dd>
        <dt className="text-slate-500 dark:text-slate-400">{t('price')}</dt>
        <dd>
          <PriceInfo pricing={pricing} />
        </dd>
        <dt className="text-slate-500 dark:text-slate-400">{WEATHER_ICON[p.weather]}</dt>
        <dd>
          {t(`weather.${p.weather}`)}
          {p.windSensitive && <> · 💨 {t('windSensitive')}</>}
        </dd>
        <dt className="text-slate-500 dark:text-slate-400">{t('effort')}</dt>
        <dd>{t(`effort.${p.effort}`)}</dd>
        <dt />
        <dd className="text-slate-500 dark:text-slate-400">{p.bestTime.map((b) => t(`best.${b}`)).join(', ')}</dd>
      </dl>

      <section>
        <h3 className="mb-1 font-semibold">{t('hours')}</h3>
        {p.openingHours.regular === 'always' && !p.openingHours.seasonal ? (
          <p className="text-sm">{t('alwaysOpen')}</p>
        ) : (
          <ul className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
            {week.map((d) => {
              const h = hoursOn(p.openingHours, d)
              return (
                <li key={d} className={cx('contents', d === refDate && 'font-semibold')}>
                  <span>{formatDayShort(d, lang)}</span>
                  <span className={cx(!h && 'text-red-600 dark:text-red-400')}>
                    {h === 'always' ? t('alwaysOpen') : h ? `${h.open}–${h.close}` : t('closed')}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
        {p.verifyHours && <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">⚠️ {t('verifyHours')}</p>}
        {p.bookingNeeded && <p className="mt-1 text-sm font-medium">🎟️ {t('bookingNeeded')}</p>}
      </section>

      <div className="flex flex-wrap gap-2">
        <a
          href={googleMapsDirections(p.waypoints?.[0] ?? p.coords)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-white no-underline"
        >
          <Navigation size={18} /> {t('directions')}
        </a>
        {p.links.map((l) => (
          <a
            key={l.url}
            href={l.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 no-underline dark:border-slate-600"
          >
            {l.label} <ExternalLink size={14} />
          </a>
        ))}
      </div>

      {trip && (
        <section className="rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
          {planned.length > 0 && (
            <p className="mb-2 text-sm">
              ✓ {t('plannedOn', { days: planned.map((d) => formatDayShort(d, lang)).join(', ') })}
            </p>
          )}
          <select
            className={inputCls}
            value=""
            onChange={(e) => e.target.value && add(e.target.value)}
            aria-label={t('addToDay')}
          >
            <option value="">➕ {t('addToDay')} ({trip.name})</option>
            {tripDates(trip).map((d) => (
              <option key={d} value={d}>
                {formatDayShort(d, lang)} · {dayOf(trip, d).stops.length}
              </option>
            ))}
          </select>
        </section>
      )}
    </article>
  )
}
