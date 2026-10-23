import { useT } from '@/i18n/useT'
import { type IsoDate, cphParts, formatDayShort, fromMinutes } from '@/logic/time'
import { cx } from './cls'
import { useForecast } from './useForecast'
import { wmo } from './wmo'

const FROM_HOUR = 6
const TO_HOUR = 23

/** Day summary and a compact hourly strip; daylight hours are shaded. */
export function WeatherStrip({ date }: { date: IsoDate }) {
  const { t, bi, lang } = useT()
  const { forecast, loading, error } = useForecast()
  const day = forecast?.days.find((d) => d.date === date)
  const hours = forecast?.hours.filter((h) => h.date === date && h.minute >= FROM_HOUR * 60 && h.minute <= TO_HOUR * 60) ?? []

  if (!forecast && loading) return <p className="text-sm text-slate-500">{t('wxLoading')}</p>

  const updated = forecast ? cphParts(new Date(forecast.fetchedAt)) : null

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
      {!day || hours.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">🌤️ {error && !forecast ? t('wxError') : t('wxNoForecast')}</p>
      ) : (
        <>
          <p className="mb-2 flex flex-wrap items-baseline gap-x-3 font-medium">
            <span className="text-xl">{wmo(day.code).icon}</span>
            <span>{bi(wmo(day.code).label)}</span>
            <span>
              {Math.round(day.tMin)}–{Math.round(day.tMax)} °C
            </span>
            {day.rainMm >= 0.1 && <span className="text-blue-700 dark:text-blue-300">💧 {day.rainMm.toFixed(1)} mm</span>}
          </p>
          <div className="-mx-3 overflow-x-auto px-3">
            <ol className="flex gap-1" aria-label={t('wxHourly')}>
              {hours.map((h) => {
                const light = h.minute + 60 > day.sunrise && h.minute < day.sunset
                const wet = (h.rainProb ?? 0) >= 35 || h.rainMm >= 0.2
                const gusty = h.gust >= 15
                return (
                  <li
                    key={`${h.minute}-${h.temp}`}
                    className={cx(
                      'flex w-12 shrink-0 flex-col items-center rounded-md py-1 text-xs',
                      light ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-slate-100 dark:bg-slate-900',
                    )}
                  >
                    <span className="text-slate-500">{fromMinutes(h.minute).slice(0, 2)}</span>
                    <span className="text-lg leading-6">{wmo(h.code, !light).icon}</span>
                    <span className="text-sm font-semibold">{Math.round(h.temp)}°</span>
                    <span className={cx(wet ? 'font-semibold text-blue-700 dark:text-blue-300' : 'text-slate-400')}>
                      {h.rainProb !== null ? `${h.rainProb}%` : h.rainMm > 0 ? `${h.rainMm.toFixed(1)}` : '–'}
                    </span>
                    <span className={cx(gusty ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-500')}>
                      {Math.round(gusty ? h.gust : h.wind)}
                      <span className="text-[10px]"> m/s</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            ☀️ {fromMinutes(day.sunrise)} – {fromMinutes(day.sunset)}
          </p>
        </>
      )}
      <p className="mt-1 text-[11px] text-slate-400">
        {updated &&
          t('wxUpdated', {
            t: `${updated.date === cphParts().date ? '' : `${formatDayShort(updated.date, lang)} `}${fromMinutes(updated.minutes)}`,
          })}
        {loading && ` · ${t('wxLoading')}`}
        {error && forecast && ` · ${t('wxStale')}`} ·{' '}
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="text-slate-400 underline">
          Open-Meteo (CC BY 4.0)
        </a>
      </p>
    </section>
  )
}
