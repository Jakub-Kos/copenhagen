import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, Settings } from 'lucide-react'
import { DayPlanner } from '@/components/DayPlanner'
import { TripSettings } from '@/components/TripSettings'
import { Button, Card, Field } from '@/components/ui'
import { cx, inputCls } from '@/components/cls'
import { useT } from '@/i18n/useT'
import { addDays, formatDayShort, todayInCph } from '@/logic/time'
import { useActiveTrip, useStore } from '@/state/store'
import { dayOf, tripDates } from '@/state/tripOps'
import { newTrip } from '@/state/tripTypes'

function NewTripForm({ onDone }: { onDone?: () => void }) {
  const { t } = useT()
  const { dispatch } = useStore()
  const today = todayInCph()
  const [name, setName] = useState('')
  const [start, setStart] = useState(today)
  const [end, setEnd] = useState(addDays(today, 2))

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">{t('newTrip')}</h2>
      <Field label={t('tripName')}>
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('from')}>
          <input className={inputCls} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label={t('to')}>
          <input className={inputCls} type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
        </Field>
      </div>
      <Button
        variant="primary"
        disabled={!name.trim() || !start || !end || end < start}
        onClick={() => {
          dispatch({ type: 'upsertTrip', trip: newTrip(name.trim(), start, end), activate: true })
          onDone?.()
        }}
      >
        {t('create')}
      </Button>
    </Card>
  )
}

export default function Plan() {
  const { t, lang } = useT()
  const { state, dispatch } = useStore()
  const trip = useActiveTrip()
  const [params, setParams] = useSearchParams()
  const [creating, setCreating] = useState(false)

  if (!trip || creating) {
    return (
      <div className="mx-auto flex max-w-xl flex-col gap-4 p-4">
        {!trip && <p>{t('noTrips')}</p>}
        <NewTripForm onDone={() => setCreating(false)} />
        {creating && (
          <Button variant="ghost" onClick={() => setCreating(false)}>
            {t('close')}
          </Button>
        )}
      </div>
    )
  }

  const dates = tripDates(trip)
  const today = todayInCph()
  const tab = params.get('d') ?? (dates.includes(today) ? today : dates[0])
  const setTab = (d: string) => setParams({ d }, { replace: true })

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <select
          className={inputCls}
          value={trip.id}
          onChange={(e) => dispatch({ type: 'activate', id: e.target.value })}
          aria-label={t('trips')}
        >
          {state.trips.map((x) => (
            <option key={x.id} value={x.id}>
              {x.name}
            </option>
          ))}
        </select>
        <Button aria-label={t('newTrip')} onClick={() => setCreating(true)}>
          <Plus size={20} />
        </Button>
      </div>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist">
        {dates.map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={tab === d}
            onClick={() => setTab(d)}
            className={cx(
              'flex min-h-11 shrink-0 flex-col items-center rounded-lg border px-3 py-1 text-sm',
              tab === d ? 'border-accent bg-accent text-white' : 'border-slate-300 dark:border-slate-600',
              d === today && tab !== d && 'border-accent',
            )}
          >
            <span className="font-semibold">{formatDayShort(d, lang)}</span>
            <span className="text-xs opacity-80">{dayOf(trip, d).stops.length || '–'}</span>
          </button>
        ))}
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'settings'}
          aria-label={t('tripSettings')}
          onClick={() => setTab('settings')}
          className={cx(
            'flex min-h-11 shrink-0 items-center rounded-lg border px-3',
            tab === 'settings' ? 'border-accent bg-accent text-white' : 'border-slate-300 dark:border-slate-600',
          )}
        >
          <Settings size={20} />
        </button>
      </div>

      {tab === 'settings' ? (
        <TripSettings key={trip.id} trip={trip} onDeleted={() => setParams({}, { replace: true })} />
      ) : dates.includes(tab) ? (
        <DayPlanner key={`${trip.id}:${tab}`} trip={trip} date={tab} />
      ) : null}
    </div>
  )
}
