import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card } from '@/components/ui'
import { useT } from '@/i18n/useT'
import { formatDayShort } from '@/logic/time'
import { decodeTrip } from '@/state/share'
import { useStore } from '@/state/store'
import { tripDates } from '@/state/tripOps'

export default function ShareImport() {
  const { data = '' } = useParams()
  const { t, lang } = useT()
  const { state, dispatch } = useStore()
  const navigate = useNavigate()
  const trip = useMemo(() => decodeTrip(data), [data])

  if (!trip) return <p className="p-4">{t('invalidLink')}</p>

  const exists = state.trips.some((x) => x.id === trip.id)
  const dates = tripDates(trip)
  const nStops = dates.reduce((n, d) => n + (trip.days[d]?.stops.length ?? 0), 0)

  return (
    <div className="mx-auto max-w-xl p-4">
      <Card className="flex flex-col gap-3">
        <p className="text-sm text-slate-500">{t('sharedTrip')}</p>
        <h1 className="text-2xl font-bold">{trip.name}</h1>
        <p>
          {formatDayShort(trip.start, lang)} – {formatDayShort(trip.end, lang)} ·{' '}
          {t('tripDays', { n: dates.length, stops: nStops })}
        </p>
        {trip.homeBase && <p>🏠 {trip.homeBase.label}</p>}
        <Button
          variant="primary"
          onClick={() => {
            dispatch({ type: 'upsertTrip', trip, activate: true })
            navigate('/today', { replace: true })
          }}
        >
          {exists ? t('replaceTrip') : t('saveTrip')}
        </Button>
      </Card>
    </div>
  )
}
