import { useMemo, useState } from 'react'
import { Bell, CalendarPlus, ExternalLink } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { reminders, upcoming } from '@/logic/reminders'
import { nowMinutesInCph, todayInCph } from '@/logic/time'
import { useStore } from '@/state/store'
import type { Trip } from '@/state/tripTypes'
import { calendarEvents, downloadIcs } from './calendarExport'
import { cx } from './cls'
import { reminderText } from './reminderText'
import { Button } from './ui'
import { useTripCosts } from './useTripCosts'

const MAX_SHOWN = 3

/** Today's reminders (bookings, leaving time, pass, clock change) and the calendar export. */
export function Reminders({ trip }: { trip: Trip }) {
  const { t, bi, lang } = useT()
  const { dispatch } = useStore()
  const { items, verdicts, timelines } = useTripCosts(trip)
  const [showAll, setShowAll] = useState(false)
  const all = useMemo(() => reminders(trip, timelines, items, verdicts), [trip, timelines, items, verdicts])
  const today = todayInCph()
  const soon = upcoming(all, trip.done, today, nowMinutesInCph())
  const future = all.filter((r) => r.date >= today && r.kind !== 'leave')
  const list = showAll ? future : soon.slice(0, MAX_SHOWN)
  if (!all.length) return null

  const toggle = (key: string) => dispatch({ type: 'upsertTrip', trip: { ...trip, done: { ...trip.done, [key]: !trip.done[key] } } })

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
      <h2 className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
        <Bell size={18} aria-hidden /> {t('remTitle')}
      </h2>
      {list.length === 0 && <p className="text-sm text-slate-600 dark:text-slate-300">{t('remNothing')}</p>}
      <ul className="flex flex-col gap-2">
        {list.map((r) => {
          const { icon, title, detail } = reminderText(r, { t, bi, lang })
          const done = !!trip.done[r.key]
          const link = r.kind === 'book' ? r.place.links[0] : null
          const checkable = r.kind === 'book' || r.kind === 'pass'
          return (
            <li key={r.key} className={cx('flex items-start gap-3 rounded-lg bg-white p-2.5 dark:bg-slate-800', done && 'opacity-50')}>
              <span className="text-xl leading-none" aria-hidden>
                {icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className={cx('font-semibold', done && 'line-through')}>{title}</div>
                <div className="text-sm text-slate-600 dark:text-slate-300">{detail}</div>
                {link && (
                  <a href={link.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-medium">
                    {t('website')} <ExternalLink size={13} />
                  </a>
                )}
              </div>
              {checkable && (
                <label className="flex min-h-10 shrink-0 items-center gap-1.5 text-sm">
                  <input type="checkbox" className="size-5 accent-[var(--color-accent)]" checked={done} onChange={() => toggle(r.key)} />
                  {t('remMarkDone')}
                </label>
              )}
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap items-center gap-2">
        {(future.length > list.length || showAll) && (
          <Button variant="ghost" className="px-2 text-sm" onClick={() => setShowAll(!showAll)}>
            {showAll ? t('remHideAll') : t('remAll', { n: future.length })}
          </Button>
        )}
        <Button className="text-sm" onClick={() => downloadIcs(trip, calendarEvents(trip, timelines, all, { t, bi, lang }))} title={t('remCalendarHint')}>
          <CalendarPlus size={18} /> {t('remCalendar')}
        </Button>
      </div>
    </section>
  )
}
