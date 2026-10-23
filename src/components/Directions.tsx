import { useT } from '@/i18n/useT'
import type { Route } from '@/services/valhalla'

const dist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m / 10) * 10} m`)

/** Collapsible turn-by-turn list. */
export function Directions({ route, open }: { route: Route; open?: boolean }) {
  const { t } = useT()
  return (
    <details open={open} className="group">
      <summary className="cursor-pointer text-accent select-none">{t('instructions', { n: route.maneuvers.length })}</summary>
      <ol className="mt-1 flex flex-col gap-1.5">
        {route.maneuvers.map((m, i) => (
          <li key={i} className="flex gap-2 text-base text-slate-800 dark:text-slate-100">
            <span className="w-5 shrink-0 text-right text-slate-400">{i + 1}.</span>
            <span className="flex-1">{m.instruction}</span>
            {m.metres > 0 && <span className="shrink-0 text-slate-500">{dist(m.metres)}</span>}
          </li>
        ))}
      </ol>
    </details>
  )
}
