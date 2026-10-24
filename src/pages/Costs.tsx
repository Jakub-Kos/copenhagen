import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { placeById } from '@/data/places'
import { inputCls, cx } from '@/components/cls'
import { formatCzk, formatDkk } from '@/components/money'
import { Button, Card, Field } from '@/components/ui'
import { useCzkRate } from '@/components/useCzkRate'
import { useTripCosts } from '@/components/useTripCosts'
import { useT } from '@/i18n/useT'
import { type CardVerdict, type CostItem, type PassOption, extrasTotal, sumItems, windowDays } from '@/logic/costs'
import { type IsoDate, formatDayShort } from '@/logic/time'
import { useActiveTrip, useStore } from '@/state/store'
import { type ExtraCost, type Trip, newId } from '@/state/tripTypes'

export default function Costs() {
  const { t } = useT()
  const trip = useActiveTrip()
  if (!trip) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <p className="mb-3">{t('noActiveTrip')}</p>
        <Link to="/plan">{t('goPlan')}</Link>
      </div>
    )
  }
  return <TripCostsView trip={trip} />
}

function TripCostsView({ trip }: { trip: Trip }) {
  const { t, bi, lang } = useT()
  const { dispatch } = useStore()
  const save = (next: Trip) => dispatch({ type: 'upsertTrip', trip: next })
  const { dates, items, verdicts } = useTripCosts(trip)
  const { rate: ecb, error: rateError } = useCzkRate()
  const rate = trip.czkRate ?? ecb?.rate ?? null
  const dkk = (n: number) => formatDkk(n, lang)
  const both = (n: number) => (rate ? `${dkk(n)} (${formatCzk(n, rate, lang)})` : dkk(n))

  const togglePaid = (key: string) => save({ ...trip, paid: { ...trip.paid, [key]: !trip.paid[key] } })

  const itemsTotal = sumItems(items)
  const extras = extrasTotal(trip.extraCosts)
  const total = itemsTotal.dkk + extras
  const paid =
    items.filter((i) => trip.paid[i.key]).reduce((s, i) => s + sumItems([i]).dkk, 0) +
    trip.extraCosts.filter((x) => x.paid).reduce((s, x) => s + x.amountDkk, 0)

  if (!trip.group.length) {
    return (
      <div className="mx-auto max-w-xl p-4">
        <p className="mb-3">{t('noGroup')}</p>
        <Link to="/plan?d=settings">{t('tripSettings')}</Link>
      </div>
    )
  }

  const itemLabel = (it: CostItem) => {
    const name = bi(placeById.get(it.placeId)!.name)
    return it.kind === 'entry' ? name : t('transportRide', { place: name })
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold">
        {t('costsTitle')} · {trip.name}
      </h1>

      <CardAdvice verdicts={verdicts} dates={dates} rateText={both} itemsUnknown={itemsTotal.unknown} />

      {dates.map((d) => {
        const dayItems = items.filter((i) => i.date === d)
        const dayExtras = trip.extraCosts.filter((x) => x.date === d)
        if (!dayItems.length && !dayExtras.length) return null
        const dayTotal = sumItems(dayItems)
        return (
          <Card key={d} className="flex flex-col gap-2">
            <h2 className="font-bold first-letter:uppercase">{formatDayShort(d, lang)}</h2>
            <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              {dayItems.map((it) => {
                const sum = sumItems([it])
                return (
                  <li key={it.key} className="flex items-start gap-3 py-2">
                    <input
                      type="checkbox"
                      className="mt-1 size-5 accent-accent"
                      checked={!!trip.paid[it.key]}
                      onChange={() => togglePaid(it.key)}
                      aria-label={t('paid')}
                    />
                    <div className="min-w-0 flex-1">
                      <div className={cx('font-medium', trip.paid[it.key] && 'text-slate-400 line-through')}>
                        {it.kind === 'transport' ? '🚆 ' : '🎟️ '}
                        {itemLabel(it)}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {trip.group
                          .map((x) => `${x.name}: ${it.prices[x.id] === null ? '?' : dkk(it.prices[x.id]!)}`)
                          .join(' · ')}
                        {it.zones && <> · {t('zonesEstimate', { n: it.zones })}</>}
                      </div>
                    </div>
                    <div className="text-right font-semibold whitespace-nowrap">
                      {sum.unknown > 0 && sum.dkk === 0 ? '?' : dkk(sum.dkk)}
                      {sum.unknown > 0 && <div className="text-xs font-normal text-slate-500">{t('someUnknown', { n: sum.unknown })}</div>}
                    </div>
                  </li>
                )
              })}
              {dayExtras.map((x) => (
                <ExtraRow key={x.id} x={x} trip={trip} />
              ))}
            </ul>
            <p className="text-right font-semibold">
              {t('dayTotal')}: {both(dayTotal.dkk + extrasTotal(trip.extraCosts, d))}
            </p>
          </Card>
        )
      })}

      <Extras trip={trip} dates={dates} />

      <Card className="flex flex-col gap-2">
        <p className="text-lg font-bold">
          {t('tripTotal')}: {both(total)}
        </p>
        {itemsTotal.unknown > 0 && <p className="text-sm text-slate-500">{t('someUnknown', { n: itemsTotal.unknown })}</p>}
        <ul className="text-sm">
          {trip.group.map((x) => (
            <li key={x.id}>
              {t('perPerson')} – {x.name}: {both(sumItems(items, [x.id]).dkk + extras / trip.group.length)}
            </li>
          ))}
        </ul>
        <p className="text-sm">{t('paidSoFar', { amount: both(paid) })}</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('budget')}>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={trip.budgetDkk ?? ''}
              onChange={(e) => save({ ...trip, budgetDkk: Number(e.target.value) > 0 ? Number(e.target.value) : null })}
            />
          </Field>
          <Field label={t('czkRateManual')}>
            <input
              className={inputCls}
              type="number"
              step="0.01"
              min={0}
              placeholder={ecb ? ecb.rate.toFixed(3) : ''}
              value={trip.czkRate ?? ''}
              onChange={(e) => save({ ...trip, czkRate: Number(e.target.value) > 0 ? Number(e.target.value) : null })}
            />
          </Field>
        </div>
        {trip.budgetDkk && (
          <div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className={cx('h-full', total > trip.budgetDkk ? 'bg-red-500' : 'bg-green-600')}
                style={{ width: `${Math.min(100, (total / trip.budgetDkk) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-sm">{t('budgetUsed', { pct: Math.round((total / trip.budgetDkk) * 100) })}</p>
          </div>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {ecb && t('czkRateEcb', { date: ecb.date, rate: ecb.rate.toFixed(3) })}
          {!ecb && rateError && t('czkRateError')}
          {ecb && ' · Frankfurter / ECB'}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('pricesNote')}</p>
      </Card>
    </div>
  )
}

function optionLabel(o: PassOption, t: ReturnType<typeof useT>['t']): string {
  if (o.kind === 'none') return t('optNone')
  if (o.kind === 'cityPass') return t('optCityPass', { size: o.size === 'small' ? 'Small' : 'Large', hours: o.hours })
  return t('optCard', { variant: o.variant === 'discover' ? 'DISCOVER' : 'HOP', hours: o.hours })
}

/** Travellers with the same recommended option share one block; each gets their own saving. */
function CardAdvice({
  verdicts,
  dates,
  rateText,
  itemsUnknown,
}: {
  verdicts: CardVerdict[]
  dates: IsoDate[]
  rateText: (n: number) => string
  itemsUnknown: number
}) {
  const { t, bi, lang } = useT()
  const groups = new Map<string, CardVerdict[]>()
  for (const v of verdicts) {
    const k = JSON.stringify(v.best.option)
    groups.set(k, [...(groups.get(k) ?? []), v])
  }
  const bestTotal = verdicts.reduce((s, v) => s + v.best.dkk, 0)
  const dayName = (i: number) => formatDayShort(dates[Math.min(i, dates.length - 1)], lang)

  return (
    <Card className="flex flex-col gap-3 border-accent">
      <h2 className="text-lg font-bold">💳 {t('cardTitle')}</h2>
      {[...groups.values()].map((vs) => {
        const o = vs[0].best.option
        const w = windowDays(o)
        const covered = vs[0].best.covered
        const coveredNames = [...new Set(covered.filter((c) => c.kind === 'entry').map((c) => bi(placeById.get(c.placeId)!.name)))]
        const rides = covered.filter((c) => c.kind === 'transport').length
        const isCard = o.kind === 'card'
        return (
          <div key={JSON.stringify(o)} className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-900">
            <p className={cx('font-semibold', isCard && 'text-green-700 dark:text-green-400')}>
              {isCard ? '✅ ' : '➡️ '}
              {optionLabel(o, t)}
            </p>
            <ul className="text-sm">
              {vs.map((v) => (
                <li key={v.traveller.id}>
                  <span className="font-medium">{v.traveller.name}: </span>
                  {isCard && v.saving !== null
                    ? t('cardSaves', { saving: rateText(Math.round(v.saving)) })
                    : v.withCard
                      ? t('cardCheaperWithout', { diff: rateText(Math.round(v.withCard.dkk - v.withoutCard.dkk)) })
                      : t('cardNotNeeded')}
                </li>
              ))}
            </ul>
            {w && (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('cardCovers', {
                  days: w[0] === w[1] ? dayName(w[0]) : `${dayName(w[0])} – ${dayName(w[1])}`,
                  list: [...coveredNames, ...(rides ? [`🚆 ${rides}×`] : [])].join(', ') || '–',
                })}
              </p>
            )}
            {!isCard && vs.some((v) => v.withCard) && (
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('cardBreakEvenShort')}</p>
            )}
          </div>
        )
      })}
      <p className="font-medium">{t('bestTotal', { total: rateText(Math.round(bestTotal)) })}</p>
      {itemsUnknown > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">{t('cardUnknownHint', { n: itemsUnknown })}</p>}
    </Card>
  )
}

function ExtraRow({ x, trip }: { x: ExtraCost; trip: Trip }) {
  const { t, lang } = useT()
  const { dispatch } = useStore()
  const save = (extraCosts: ExtraCost[]) => dispatch({ type: 'upsertTrip', trip: { ...trip, extraCosts } })
  return (
    <li className="flex items-start gap-3 py-2">
      <input
        type="checkbox"
        className="mt-1 size-5 accent-accent"
        checked={x.paid}
        aria-label={t('paid')}
        onChange={() => save(trip.extraCosts.map((y) => (y.id === x.id ? { ...y, paid: !y.paid } : y)))}
      />
      <div className={cx('min-w-0 flex-1 font-medium', x.paid && 'text-slate-400 line-through')}>
        {x.label} <span className="text-sm font-normal text-slate-500">· {t(`xcat.${x.category}`)}</span>
      </div>
      <div className="font-semibold whitespace-nowrap">{formatDkk(x.amountDkk, lang)}</div>
      <button
        type="button"
        aria-label={t('remove')}
        className="text-slate-400"
        onClick={() => save(trip.extraCosts.filter((y) => y.id !== x.id))}
      >
        <Trash2 size={16} />
      </button>
    </li>
  )
}

function Extras({ trip, dates }: { trip: Trip; dates: IsoDate[] }) {
  const { t, lang } = useT()
  const { dispatch } = useStore()
  const [label, setLabel] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState<IsoDate | ''>('')
  const [category, setCategory] = useState<ExtraCost['category']>('food')
  const general = trip.extraCosts.filter((x) => x.date === null)

  function add() {
    const amountDkk = Number(amount)
    if (!label.trim() || !(amountDkk > 0)) return
    const x: ExtraCost = { id: newId(), date: date || null, label: label.trim(), category, amountDkk, paid: false }
    dispatch({ type: 'upsertTrip', trip: { ...trip, extraCosts: [...trip.extraCosts, x] } })
    setLabel('')
    setAmount('')
  }

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="font-bold">{t('extras')}</h2>
      {general.length > 0 && (
        <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
          {general.map((x) => (
            <ExtraRow key={x.id} x={x} trip={trip} />
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Field label={t('extraLabel')}>
          <input className={inputCls} value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label={t('amountDkk')}>
          <input className={inputCls} type="number" min={0} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
        <select className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} aria-label={t('from')}>
          <option value="">{t('wholeTrip')}</option>
          {dates.map((d) => (
            <option key={d} value={d}>
              {formatDayShort(d, lang)}
            </option>
          ))}
        </select>
        <select className={inputCls} value={category} onChange={(e) => setCategory(e.target.value as ExtraCost['category'])}>
          {(['food', 'transport', 'souvenir', 'other'] as const).map((c) => (
            <option key={c} value={c}>
              {t(`xcat.${c}`)}
            </option>
          ))}
        </select>
      </div>
      <Button variant="primary" className="self-start" onClick={add}>
        <Plus size={18} /> {t('addExtra')}
      </Button>
    </Card>
  )
}
