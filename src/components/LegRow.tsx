import { Bus, Footprints } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { googleMapsDirections, steps } from '@/logic/geo'
import type { Leg } from '@/logic/timeline'
import { formatDuration } from '@/logic/time'
import type { RouteEntry } from '@/state/routeStore'
import type { LegMode } from '@/state/tripTypes'
import { cx } from './cls'
import { Directions } from './Directions'

const km = (m: number) => (m / 1000).toFixed(1)

/** The connector between two stops: mode, distance, time, directions. */
export function LegRow({ leg, route, onMode }: { leg: Leg; route?: RouteEntry; onMode?: (m: LegMode) => void }) {
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
    </div>
  )
}
