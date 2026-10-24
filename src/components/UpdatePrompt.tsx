import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useT } from '@/i18n/useT'

const CHECK_EVERY_MS = 60 * 60 * 1000

/** Registers the service worker and offers new versions instead of reloading mid-walk. */
export function UpdatePrompt() {
  const { t } = useT()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      if (reg) setInterval(() => navigator.onLine && void reg.update(), CHECK_EVERY_MS)
    },
  })
  const [hideReady, setHideReady] = useState(false)

  useEffect(() => {
    if (!offlineReady) return
    const id = setTimeout(() => setHideReady(true), 5000)
    return () => clearTimeout(id)
  }, [offlineReady])

  if (!needRefresh && !(offlineReady && !hideReady)) return null
  return (
    <div
      role="status"
      className="fixed inset-x-3 print:hidden bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-navy px-4 py-3 text-navy-text shadow-lg"
    >
      <span className="flex-1">{needRefresh ? t('updateReady') : t('offlineReady')}</span>
      {needRefresh && (
        <button type="button" onClick={() => void updateServiceWorker(true)} className="min-h-10 rounded-lg bg-accent px-3 font-semibold text-white">
          {t('updateNow')}
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setNeedRefresh(false)
          setOfflineReady(false)
        }}
        aria-label={t('close')}
        className="min-h-10 px-2 text-navy-text/70"
      >
        ✕
      </button>
    </div>
  )
}
