import { useSyncExternalStore } from 'react'
import { CloudDownload, WifiOff } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { offlineSupported } from '@/services/offline'
import { cancelPack, getPackState, planSig, startPack, subscribePack } from '@/state/offlinePack'
import type { Trip } from '@/state/tripTypes'
import { Button, Card } from './ui'
import { useOnline } from './useOnline'

const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || ('standalone' in navigator && navigator.standalone === true)

/** "Save for offline": routes for the trip's days, the guide's map area and photos. */
/** `compact`: once a complete, current copy exists, show just one line (the Today page). */
export function OfflineCard({ trip, compact = false }: { trip: Trip; compact?: boolean }) {
  const { t, lang } = useT()
  const online = useOnline()
  const s = useSyncExternalStore(subscribePack, getPackState)

  if (!offlineSupported()) {
    return (
      <Card>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('offlineUnsupported')}</p>
      </Card>
    )
  }

  const last = s.last
  const forThis = last?.tripId === trip.id
  const failed = last ? last.routesFailed + last.filesFailed : 0
  const when = last
    ? new Date(last.savedAt).toLocaleString(lang === 'cs' ? 'cs-CZ' : 'en-GB', {
        timeZone: 'Europe/Copenhagen',
        day: 'numeric',
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : ''
  const progress = s.running ? s.progress : null
  const pct = progress && progress.total ? Math.round((progress.done / progress.total) * 100) : 0

  if (compact && !s.running && forThis && failed === 0 && last.sig === planSig(trip)) {
    return (
      <p className="flex flex-wrap items-center gap-x-2 text-sm text-slate-600 dark:text-slate-300">
        <span className="text-green-700 dark:text-green-400">✓ {t('offlineSavedShort', { when })}</span>
        {online && (
          <button type="button" onClick={() => startPack(trip, lang)} className="min-h-10 font-medium text-accent">
            {t('offlineUpdate')}
          </button>
        )}
      </p>
    )
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <WifiOff size={20} aria-hidden /> {t('offlineTitle')}
      </h2>
      <p className="text-sm text-slate-600 dark:text-slate-300">{t('offlineIntro')}</p>

      {last && !s.running && (
        <div className="text-sm">
          {forThis ? (
            <p className="font-medium text-green-700 dark:text-green-400">✓ {t('offlineSaved', { when })}</p>
          ) : (
            <p className="text-slate-600 dark:text-slate-300">{t('offlineSavedOther')}</p>
          )}
          {forThis && failed > 0 && <p className="text-amber-700 dark:text-amber-400">⚠️ {t('offlinePartial', { n: failed })}</p>}
          {forThis && last.sig !== planSig(trip) && <p className="text-amber-700 dark:text-amber-400">⚠️ {t('offlineStale')}</p>}
        </div>
      )}

      {s.running ? (
        <div className="flex flex-col gap-2">
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${Math.max(4, pct)}%` }} />
          </div>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span>
              {progress
                ? t(progress.step === 'routes' ? 'offlineRoutes' : 'offlineFiles', { done: progress.done, total: progress.total })
                : '…'}
            </span>
            <Button variant="ghost" onClick={cancelPack}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant={forThis ? 'secondary' : 'primary'} disabled={!online} onClick={() => startPack(trip, lang)} className="self-start">
          <CloudDownload size={18} /> {forThis ? t('offlineUpdate') : t('offlineSave')}
        </Button>
      )}
      {!online && !s.running && <p className="text-sm text-slate-500 dark:text-slate-400">{t('offlineNeedsNet')}</p>}
      {!isStandalone() && <p className="text-sm text-slate-500 dark:text-slate-400">💡 {t('offlineInstall')}</p>}
    </Card>
  )
}
