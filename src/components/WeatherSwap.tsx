import { ArrowRightLeft, CalendarArrowUp } from 'lucide-react'
import { places } from '@/data/places'
import { useT } from '@/i18n/useT'
import { type IsoDate, formatDayShort } from '@/logic/time'
import type { TimelineStop } from '@/logic/timeline'
import { fitFor, hintFor } from '@/logic/weatherFit'
import { swapsFor } from '@/logic/weatherSwap'
import { useStore } from '@/state/store'
import { moveStopToDay, plannedPlaces, resuggestLegModes, tripDates, updateStop } from '@/state/tripOps'
import type { Trip } from '@/state/tripTypes'
import { WEATHER_ICON } from './kindStyle'
import { Thumb } from './Thumb'
import { useForecast } from './useForecast'

/** Under a rainy/windy stop: swap it for a nearby place that suits the weather, or move it to a better day. */
export function WeatherSwap({ trip, date, stop }: { trip: Trip; date: IsoDate; stop: TimelineStop }) {
  const { t, bi, lang } = useT()
  const { dispatch } = useStore()
  const { forecast } = useForecast()
  if (!forecast) return null

  const planned = new Set(plannedPlaces(trip).keys())
  const swaps = swapsFor(stop, date, places, planned, (p, from, to) => fitFor(p, forecast, date, from, to))
  const hint = hintFor(stop.place, forecast, date, tripDates(trip))
  const better = hint?.kind === 'better' ? hint.date : null
  if (!swaps.length && !better) return null

  const save = (next: Trip) => dispatch({ type: 'upsertTrip', trip: next })
  const swap = (placeId: string) => save(resuggestLegModes(updateStop(trip, date, stop.stopId, { placeId, visitMin: null }), date))
  const move = (to: IsoDate) => save(resuggestLegModes(resuggestLegModes(moveStopToDay(trip, date, stop.stopId, to), date), to))

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg bg-sky-50 p-2.5 text-sm dark:bg-sky-900/20">
      {swaps.length > 0 && (
        <>
          <div className="font-medium text-sky-900 dark:text-sky-200">☔ {t('swapInstead')}</div>
          {swaps.map(({ place: p, metres }) => (
            <div key={p.id} className="flex items-center gap-2.5">
              <Thumb placeId={p.id} className="size-10" />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="font-medium">{bi(p.name)}</div>
                <div className="whitespace-nowrap text-slate-500 dark:text-slate-400">
                  {WEATHER_ICON[p.weather]} {t(`weather.${p.weather}`)} · {metres < 1000 ? `${Math.round(metres / 10) * 10} m` : `${(metres / 1000).toFixed(1)} km`}
                </div>
              </div>
              <button
                type="button"
                onClick={() => swap(p.id)}
                className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 font-medium dark:border-slate-600 dark:bg-slate-800"
              >
                <ArrowRightLeft size={16} /> {t('swapDo')}
              </button>
            </div>
          ))}
        </>
      )}
      {better && (
        <button
          type="button"
          onClick={() => move(better)}
          className="inline-flex min-h-10 items-center gap-1.5 self-start rounded-lg border border-slate-300 bg-white px-2.5 font-medium dark:border-slate-600 dark:bg-slate-800"
        >
          <CalendarArrowUp size={16} /> {t('moveToDay', { day: formatDayShort(better, lang) })}
        </button>
      )}
    </div>
  )
}
