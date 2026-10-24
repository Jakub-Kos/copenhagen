import { Link, useSearchParams } from 'react-router-dom'
import { Printer } from 'lucide-react'
import { DaySheet } from '@/components/DaySheet'
import { Button } from '@/components/ui'
import { useT } from '@/i18n/useT'
import { useActiveTrip } from '@/state/store'
import { dayOf, tripDates } from '@/state/tripOps'

/** Printable day sheets: `?d=YYYY-MM-DD` for one day, `?d=all` for every planned day. */
export default function Print() {
  const { t } = useT()
  const trip = useActiveTrip()
  const [params] = useSearchParams()
  if (!trip) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <p className="mb-3">{t('noActiveTrip')}</p>
        <Link to="/plan">{t('goPlan')}</Link>
      </div>
    )
  }
  const d = params.get('d')
  const dates = tripDates(trip).filter((x) => (d === 'all' || !d ? dayOf(trip, x).stops.length > 0 : x === d))

  return (
    <div className="flex flex-col gap-4 bg-slate-100 p-3 print:bg-white print:p-0 dark:bg-slate-900">
      <div className="mx-auto flex w-full max-w-[190mm] flex-wrap items-center gap-3 print:hidden">
        <Button variant="primary" onClick={() => window.print()}>
          <Printer size={18} /> {t('printNow')}
        </Button>
        <p className="flex-1 text-sm text-slate-600 dark:text-slate-300">{t('printHint')}</p>
      </div>
      {dates.map((date, i) => (
        <div key={date} className={i < dates.length - 1 ? 'break-after-page' : undefined}>
          <DaySheet trip={trip} date={date} />
        </div>
      ))}
      {dates.length === 0 && <p className="mx-auto max-w-xl">{t('emptyDay')}</p>}
    </div>
  )
}
