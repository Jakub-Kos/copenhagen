import { Link } from 'react-router-dom'
import { Plus, UtensilsCrossed } from 'lucide-react'
import { places } from '@/data/places'
import { useT } from '@/i18n/useT'
import { lunchOptions } from '@/logic/food'
import type { IsoDate } from '@/logic/time'
import type { Timeline } from '@/logic/timeline'
import { Thumb } from './Thumb'

/** "Lunch nearby": food places close to the stop where the day breaks for lunch. */
export function LunchHint({
  tl,
  date,
  speedKmh,
  index,
  onAdd,
}: {
  tl: Timeline
  date: IsoDate
  speedKmh: number
  /** Shown only after this stop. */
  index: number
  onAdd?: (placeId: string) => void
}) {
  const { t, bi } = useT()
  const lunch = lunchOptions(tl, date, places, speedKmh)
  if (!lunch || lunch.after !== index) return null
  return (
    <div className="my-2 ml-4 rounded-xl border border-dashed border-amber-400 bg-amber-50/60 p-3 dark:border-amber-700 dark:bg-amber-900/15">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
        <UtensilsCrossed size={16} aria-hidden /> {t('lunchNearby')}
      </div>
      <ul className="flex flex-col gap-2">
        {lunch.options.map(({ place: p, metres }) => (
          <li key={p.id} className="flex items-center gap-3">
            <Thumb placeId={p.id} className="size-10" />
            <Link to={`/?p=${p.id}`} className="min-w-0 flex-1 no-underline">
              <div className="leading-tight font-medium text-slate-900 dark:text-slate-100">{bi(p.name)}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                {metres < 1000 ? `${Math.round(metres / 10) * 10} m` : `${(metres / 1000).toFixed(1)} km`}
                {p.bookingNeeded && ` · 🎟️ ${t('bookingNeeded')}`}
              </div>
            </Link>
            {onAdd && (
              <button
                type="button"
                onClick={() => onAdd(p.id)}
                className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
              >
                <Plus size={16} /> {t('addHere')}
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
