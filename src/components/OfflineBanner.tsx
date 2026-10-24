import { WifiOff } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { useOnline } from './useOnline'

export function OfflineBanner() {
  const { t } = useT()
  if (useOnline()) return null
  return (
    <div role="status" className="flex items-center print:hidden gap-2 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-950 dark:bg-amber-900/40 dark:text-amber-100">
      <WifiOff size={18} aria-hidden className="shrink-0" /> {t('offlineBanner')}
    </div>
  )
}
