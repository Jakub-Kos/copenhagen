import { Minus, Plus } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { fromMinutes, toMinutes } from '@/logic/time'
import { cx } from './cls'

const btn =
  'grid size-11 shrink-0 place-items-center rounded-lg border border-slate-300 bg-white text-slate-800 active:bg-slate-100 disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100'

const QUICK = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00']
const EARLIEST = 6 * 60
const LATEST = 14 * 60

/** Day start time set by tapping: −/+ 15 minutes and quick choices; no typing needed. */
export function StartTimePicker({ value, onChange }: { value: string; onChange: (hhmm: string) => void }) {
  const { t } = useT()
  const min = toMinutes(value)
  const set = (m: number) => onChange(fromMinutes(Math.min(LATEST, Math.max(EARLIEST, m))))
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('startTime')}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => set(min - 15)} disabled={min <= EARLIEST} aria-label={t('earlier')}>
          <Minus size={20} />
        </button>
        <span className="min-w-[4.5rem] text-center text-2xl font-bold tabular-nums">{value}</span>
        <button type="button" className={btn} onClick={() => set(min + 15)} disabled={min >= LATEST} aria-label={t('later')}>
          <Plus size={20} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {QUICK.map((q) => (
          <button
            key={q}
            type="button"
            aria-pressed={q === value}
            onClick={() => onChange(q)}
            className={cx(
              'min-h-9 rounded-full border px-3 text-sm tabular-nums',
              q === value
                ? 'border-accent bg-accent text-white'
                : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
            )}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Visit length in 15-minute steps. */
export function MinutesStepper({ value, onChange, label }: { value: number; onChange: (min: number) => void; label: string }) {
  const { t } = useT()
  const step = (d: number) => onChange(Math.max(15, Math.round((value + d) / 15) * 15))
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label={label}>
      <span aria-hidden>⏱</span>
      <button type="button" className={cx(btn, 'size-9')} onClick={() => step(-15)} disabled={value <= 15} aria-label={t('shorter')}>
        <Minus size={16} />
      </button>
      <span className="min-w-[3.5rem] text-center text-sm font-semibold tabular-nums">{value} min</span>
      <button type="button" className={cx(btn, 'size-9')} onClick={() => step(15)} aria-label={t('longer')}>
        <Plus size={16} />
      </button>
    </div>
  )
}
