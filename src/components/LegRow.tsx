import { Bus, Footprints } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { googleMapsDirections, rejseplanenUrl, steps } from '@/logic/geo'
import type { Leg } from '@/logic/timeline'
import { type IsoDate, formatDuration } from '@/logic/time'
import type { RouteEntry } from '@/state/routeStore'
import type { TransitEntry } from '@/state/transitStore'
import { TRANSITOUS_SOURCES } from '@/services/transitous'
import { fromMinutes } from '@/logic/time'
import type { LegMode } from '@/state/tripTypes'
import { cx } from './cls'
import { Directions } from './Directions'

const km = (m: number) => (m / 1000).toFixed(1)

/** Where and when a public-transport leg starts, for the Rejseplanen link. */
export interface LegTrip {
  date: IsoDate
  /** Departure, minutes since midnight. */
  depart: number
  fromName: string
  toName: string
}

/** The connector between two stops: mode, distance, time, directions. */
export function LegRow({
  leg,
  route,
  onMode,
  trip,
  transit,
}: {
  leg: Leg
  route?: RouteEntry
  transit?: TransitEntry
  onMode?: (m: LegMode) => void
  trip?: LegTrip
}) {
  const { t } = useT()
  const Icon = leg.mode === 'walk' ? Footprints : Bus
  const status =
    leg.mode !== 'walk' || !leg.estimated
      ? null
      : route?.status === 'loading' || !route
        ? t('routeLoading')
        : route.status === 'error'
          ? t(route.rateLimited ? 'routeRateLimited' : 'routeError')
          : null

  return (
    <div className="ml-4 flex flex-col gap-1 border-l-2 border-dashed border-slate-300 py-2 pl-4 text-sm text-slate-600 dark:border-slate-600 dark:text-slate-300">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Icon size={16} aria-hidden />
        <span>
          {km(leg.metres)} km · {formatDuration(leg.minutes)}
          {leg.mode === 'walk' && <> · ~{steps(leg.metres).toLocaleString()} 👣</>}
          {leg.estimated && <span className="text-slate-400"> ({status ?? t('estimated')})</span>}
        </span>
        {onMode && (
          <span className="flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-600">
            {(['walk', 'transit'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMode(m)}
                aria-pressed={leg.mode === m}
                className={cx('px-2 py-0.5', leg.mode === m && 'bg-accent text-white')}
              >
                {t(m)}
              </button>
            ))}
          </span>
        )}
        {leg.mode === 'transit' && trip && (
          <a
            href={rejseplanenUrl({ coords: leg.from, name: trip.fromName }, { coords: leg.to, name: trip.toName }, trip)}
            target="_blank"
            rel="noreferrer"
            title={t('rejseplanenHint')}
            className="inline-flex min-h-9 items-center rounded-md bg-accent px-2.5 font-semibold text-white no-underline hover:bg-accent-strong"
          >
            Rejseplanen ↗
          </a>
        )}
        <a
          href={googleMapsDirections(leg.to, leg.from, leg.mode === 'walk' ? 'walking' : 'transit')}
          target="_blank"
          rel="noreferrer"
          className="text-accent"
        >
          Google Maps ↗
        </a>
      </div>
      {route?.status === 'ok' && leg.mode === 'walk' && <Directions route={route.route} />}
      {leg.mode === 'transit' && transit?.status === 'ok' && (
        <ol className="flex flex-col gap-0.5">
          {transit.plan.legs.map((l, i) => (
            <li key={i} className="flex flex-wrap items-center gap-1.5">
              {l.mode === 'walk' ? (
                <span>🚶 {l.minutes} min</span>
              ) : (
                <>
                  <span className="rounded px-1.5 text-xs font-bold text-white" style={{ background: l.color }}>
                    {l.line || l.mode}
                  </span>
                  <span>
                    {fromMinutes(l.from.time)} {l.from.name} → {fromMinutes(l.to.time)} {l.to.name}
                    {l.headsign && <span className="text-slate-400"> ({l.headsign})</span>}
                  </span>
                </>
              )}
            </li>
          ))}
          <li className="text-xs text-slate-400">
            <a href={TRANSITOUS_SOURCES} target="_blank" rel="noreferrer" className="text-slate-400">
              Transitous ↗
            </a>
          </li>
        </ol>
      )}
    </div>
  )
}
