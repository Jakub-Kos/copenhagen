import type { Pricing } from '@/data/types'
import { useT } from '@/i18n/useT'
import { entryPrice } from '@/logic/costs'
import { formatDayShort } from '@/logic/time'
import { useActiveTrip } from '@/state/store'
import { formatDkk } from './money'

/** Price for the active trip's group (or the adult price), with notes, card inclusion and source. */
export function PriceInfo({ pricing: p }: { pricing: Pricing }) {
  const { t, bi, lang } = useT()
  const trip = useActiveTrip()
  if (p.free) return <span>{t(p.noTicket ? 'priceNoTicket' : 'priceFree')}</span>

  const group = trip?.group ?? []
  const each = group.map((x) => ({ x, price: entryPrice(p, x) }))
  const known = each.filter((e) => e.price !== null)
  const unknown = each.length - known.length
  const total = known.reduce((s, e) => s + e.price!, 0)

  return (
    <div className="flex flex-col gap-0.5">
      {group.length > 0 ? (
        <>
          <span className="font-medium">
            {known.length ? t('priceForGroup', { total: formatDkk(total, lang) }) : t('priceUnknown')}
            {unknown > 0 && known.length > 0 && <span className="font-normal text-slate-500"> {t('someUnknown', { n: unknown })}</span>}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {each.map((e) => `${e.x.name}: ${e.price === null ? '?' : formatDkk(e.price, lang)}`).join(' · ')}
          </span>
        </>
      ) : (
        <span className={p.adult === null ? 'text-slate-500' : ''}>
          {p.adult === null ? t('priceUnknown') : `${t('cat.adult')}: ${formatDkk(p.adult, lang)}`}
        </span>
      )}
      {p.note && <span className="text-xs text-slate-500 dark:text-slate-400">{bi(p.note)}</span>}
      {p.freeTimes && <span className="text-xs text-green-700 dark:text-green-400">🆓 {bi(p.freeTimes)}</span>}
      {p.includedInCopenhagenCard !== null && (
        <span className="text-xs">{p.includedInCopenhagenCard ? `💳 ${t('inCard')}` : t('notInCard')}</span>
      )}
      {p.source && (
        <a href={p.source} target="_blank" rel="noreferrer" className="text-xs">
          {t('priceSource')}
          {p.checkedOn && ` (${t('checkedOn', { date: formatDayShort(p.checkedOn, lang) })})`} ↗
        </a>
      )}
    </div>
  )
}
