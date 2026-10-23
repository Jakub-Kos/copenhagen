import type { Place } from '@/data/types'
import { useT } from '@/i18n/useT'
import { type IsoDate, formatDayShort } from '@/logic/time'
import { hintFor } from '@/logic/weatherFit'
import { cx } from './cls'
import { useForecast } from './useForecast'

/** "Good weather for this" / "Better weather on <day>" for a place on a date. Renders nothing without a hint. */
export function WeatherHint({ place, date, dates, className }: { place: Place; date: IsoDate; dates: IsoDate[]; className?: string }) {
  const { t, lang } = useT()
  const { forecast } = useForecast()
  const hint = forecast ? hintFor(place, forecast, date, dates) : null
  if (!hint) return null
  const text =
    hint.kind === 'good'
      ? place.weather === 'indoor'
        ? `☔ ${t('hintGoodRain')}`
        : `👍 ${t('hintGood')}`
      : hint.kind === 'better'
        ? `📅 ${t('hintBetter', { day: formatDayShort(hint.date, lang) })}`
        : `🌧️ ${t('hintPoor')}`
  return (
    <span
      className={cx(
        'text-sm',
        hint.kind === 'good' ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400',
        className,
      )}
    >
      {text}
    </span>
  )
}
