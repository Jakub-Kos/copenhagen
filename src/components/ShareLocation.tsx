import { useState } from 'react'
import { Share2 } from 'lucide-react'
import type { LatLng } from '@/data/types'
import { useT } from '@/i18n/useT'
import { shareMessage } from '@/logic/shareLocation'
import { nowMinutesInCph } from '@/logic/time'
import { Button } from './ui'

type State = 'idle' | 'locating' | 'error' | 'copied' | 'shared'

/**
 * "Share where we are": reads the GPS once and hands a short message (map link, next stop,
 * home) to the phone's share menu, or copies it. Nothing leaves the phone otherwise.
 */
export function ShareLocation({ next, home }: { next?: { name: string; arrive: number; coords: LatLng } | null; home?: string | null }) {
  const { t } = useT()
  const [state, setState] = useState<State>('idle')
  const [text, setText] = useState('')

  async function send(msg: string) {
    setText(msg)
    if (navigator.share) {
      try {
        await navigator.share({ text: msg })
        setState('shared')
        return
      } catch (e) {
        // Cancelled by the user: stay quiet; anything else falls back to copying.
        if (e instanceof DOMException && e.name === 'AbortError') return setState('idle')
      }
    }
    try {
      await navigator.clipboard.writeText(msg)
      setState('copied')
    } catch {
      setState('copied') // the text is shown below to copy by hand
    }
  }

  function share() {
    if (!navigator.geolocation) return setState('error')
    setState('locating')
    navigator.geolocation.getCurrentPosition(
      (p) =>
        void send(
          shareMessage(
            {
              pos: { lat: p.coords.latitude, lng: p.coords.longitude },
              accuracy: Number.isFinite(p.coords.accuracy) ? p.coords.accuracy : null,
              now: nowMinutesInCph(),
              next,
              home,
            },
            t,
          ),
        ),
      () => setState('error'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={share} disabled={state === 'locating'} className="w-full">
        <Share2 size={18} /> {state === 'locating' ? t('locating') : t('shareWhere')}
      </Button>
      {state === 'error' && <p className="text-sm text-red-600">{t('locationError')}</p>}
      {state === 'shared' && <p className="text-sm text-green-700 dark:text-green-400">✓ {t('shareSent')}</p>}
      {state === 'copied' && (
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-green-700 dark:text-green-400">✓ {t('shareCopied')}</p>
          <textarea readOnly value={text} rows={5} className="w-full rounded-md border border-slate-300 bg-white p-2 text-xs dark:border-slate-600 dark:bg-slate-900" onFocus={(e) => e.target.select()} />
          <a href={`sms:?&body=${encodeURIComponent(text)}`} className="self-start font-medium">
            {t('shareSms')} ↗
          </a>
        </div>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400">{t('sharePrivacy')}</p>
    </div>
  )
}
