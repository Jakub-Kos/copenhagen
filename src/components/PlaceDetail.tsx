import { type ReactNode, useMemo } from 'react'
import { ExternalLink, Navigation, X } from 'lucide-react'
import type { Place } from '@/data/types'
import { pricingFor } from '@/data/prices'
import { useT } from '@/i18n/useT'
import { googleMapsDirections } from '@/logic/geo'
import { hoursOn } from '@/logic/hours'
import { type IsoDate, addDays, formatDayShort, formatDuration } from '@/logic/time'
import { suggestLegMode } from '@/logic/timeline'
import { placeById } from '@/data/places'
import addresses from '@/data/addresses.json'
import { highlights } from '@/data/details'
import { walkMetres } from '@/data/walks'
import { nearestStations } from '@/logic/stations'
import { useActiveTrip, useStore } from '@/state/store'
import { addStop, dayOf, plannedPlaces, tripDates } from '@/state/tripOps'
import { KIND_ICON, WEATHER_ICON } from './kindStyle'
import { imageFor, thumb } from './placeImage'
import { Stars } from './ui'
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

  const img = imageFor(p.id)
  const start = p.waypoints?.[0] ?? p.coords
  const address = (addresses as Record<string, string>)[p.id]
  const stations = nearestStations(start)
  const walkM = walkMetres(p.id)
  const closeButton = (
    <button
      type="button"
      onClick={onClose}
      aria-label={t('close')}
      className="grid size-10 place-items-center rounded-full bg-black/55 text-white backdrop-blur-sm hover:bg-black/70"
    >
      <X size={20} />
    </button>
  )

  return (
    <article className="flex flex-col">
      {img ? (
        <figure className="relative">
          <img src={thumb(img, 960)} crossOrigin="anonymous" alt={bi(p.name)} className="h-52 w-full object-cover md:h-60" />
          <div className="absolute top-3 right-3">{closeButton}</div>
          <figcaption className="absolute right-0 bottom-0 max-w-full truncate rounded-tl-md bg-black/50 px-2 py-0.5 text-[10px] text-white">
            <a href={img.page} target="_blank" rel="noreferrer" className="font-normal text-white/90 no-underline hover:underline">
              © {img.author} · {img.license}
            </a>
          </figcaption>
        </figure>
      ) : (
        <div className="flex justify-end px-3 pt-3">{closeButton}</div>
      )}

      <div className="flex flex-col gap-4 p-4">
        <header>
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {KIND_ICON[p.kind]} {t(`kind.${p.kind}`)}
            {distanceLabel && <> · {t('away', { d: distanceLabel })}</>}
          </div>
          <h2 className="text-2xl leading-tight font-bold">{bi(p.name)}</h2>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <Stars n={p.myRating} />
            {p.mustSee && (
              <span className="rounded-full bg-mustsee/20 px-2 font-semibold text-amber-800 dark:text-amber-300">{t('mustSee')}</span>
            )}
          </div>
          <WeatherHint place={p} date={refDate} dates={hintDates} className="mt-1 block" />
        </header>

        <p className="leading-relaxed">{bi(p.description)}</p>
        {highlights[p.id] && (
          <Section title={t('whatToSee')}>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              {highlights[p.id].map((x) => (
                <li key={x.en}>{bi(x)}</li>
              ))}
            </ul>
          </Section>
        )}
        {p.notes && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-900/25 dark:text-amber-100">💡 {bi(p.notes)}</p>
        )}

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <Fact label={t('duration')}>
            ⏱ {formatDuration(p.durationMin)}
            {p.durationMax && ` – ${formatDuration(p.durationMax)}`}
          </Fact>
          <Fact label={t('weatherLabel')}>
            {WEATHER_ICON[p.weather]} {t(`weather.${p.weather}`)}
            {p.windSensitive && <div className="text-xs text-slate-500">💨 {t('windSensitive')}</div>}
          </Fact>
          <Fact label={t('effort')}>{t(`effort.${p.effort}`)}</Fact>
          <Fact label={t('bestTime')}>{p.bestTime.map((b) => t(`best.${b}`)).join(', ')}</Fact>
        </dl>

        <Section title={t('gettingThere')}>
          <ul className="flex flex-col gap-1 text-sm">
            {address && (
              <li>
                📍 {p.waypoints ? `${t('walkStart')}: ` : ''}
                {address}
              </li>
            )}
            {p.waypoints && walkM && <li>🚶 {t('walkLength', { km: (walkM / 1000).toFixed(1) })}</li>}
            {stations.map((s) => (
              <li key={`${s.mode}:${s.name}`}>
                {s.mode === 'metro' ? 'Ⓜ' : s.mode === 'stog' ? 'Ⓢ' : '🚆'} {s.name}
                {s.lines && <span className="text-slate-500 dark:text-slate-400"> ({s.lines})</span>} · {s.metres < 1000 ? `${Math.round(s.metres / 10) * 10} m` : `${(s.metres / 1000).toFixed(1)} km`}
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('price')}>
          <PriceInfo pricing={pricing} />
        </Section>

        <Section title={t('hours')}>
          {p.openingHours.regular === 'always' && !p.openingHours.seasonal ? (
            <p className="text-sm">{t('alwaysOpen')}</p>
          ) : (
            <ul className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-sm">
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
          {p.verifyHours && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">⚠️ {t('verifyHours')}</p>}
          {p.bookingNeeded && <p className="mt-2 text-sm font-medium">🎟️ {t('bookingNeeded')}</p>}
        </Section>

        <div className="flex flex-col gap-2">
          <a
            href={googleMapsDirections(p.waypoints?.[0] ?? p.coords)}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2 font-semibold text-white no-underline hover:bg-accent-strong"
          >
            <Navigation size={18} /> {t('directions')}
          </a>
          <div className="flex flex-wrap gap-2">
            {p.links.map((l) => (
              <a
                key={l.url}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 no-underline dark:border-slate-600 dark:text-slate-200"
              >
                {l.label} <ExternalLink size={14} />
              </a>
            ))}
          </div>
        </div>

        {trip && (
          <Section title={trip.name}>
            {planned.length > 0 && (
              <p className="mb-2 text-sm text-green-700 dark:text-green-400">
                ✓ {t('plannedOn', { days: planned.map((d) => formatDayShort(d, lang)).join(', ') })}
              </p>
            )}
            <select className={inputCls} value="" onChange={(e) => e.target.value && add(e.target.value)} aria-label={t('addToDay')}>
              <option value="">➕ {t('addToDay')}</option>
              {tripDates(trip).map((d) => (
                <option key={d} value={d}>
                  {formatDayShort(d, lang)} · {dayOf(trip, d).stops.length}
                </option>
              ))}
            </select>
          </Section>
        )}
      </div>
    </article>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-900">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
      <h3 className="mb-1.5 text-sm font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{title}</h3>
      {children}
    </section>
  )
}
