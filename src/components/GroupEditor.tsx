import { Plus, Trash2 } from 'lucide-react'
import type { TravellerCategory } from '@/data/types'
import { useT } from '@/i18n/useT'
import { useStore } from '@/state/store'
import { type Traveller, type Trip, newId } from '@/state/tripTypes'
import { inputCls } from './cls'
import { Button, Card, Chip } from './ui'

const CATEGORIES: TravellerCategory[] = ['adult', 'senior', 'student', 'youth', 'child']

const t0 = (name: string, category: TravellerCategory, age: number | null = null): Traveller => ({
  id: newId(),
  name,
  category,
  age,
})

/** Who is travelling: category and age drive every price. */
export function GroupEditor({ trip }: { trip: Trip }) {
  const { t } = useT()
  const { dispatch } = useStore()
  const setGroup = (group: Traveller[]) => dispatch({ type: 'upsertTrip', trip: { ...trip, group } })
  const update = (id: string, patch: Partial<Traveller>) =>
    setGroup(trip.group.map((x) => (x.id === id ? { ...x, ...patch } : x)))

  const presets: [string, () => Traveller[]][] = [
    [t('preset2a'), () => [t0('1', 'adult'), t0('2', 'adult')]],
    [t('preset2s'), () => [t0('1', 'senior', 67), t0('2', 'senior', 67)]],
    [t('preset2a2c'), () => [t0('1', 'adult'), t0('2', 'adult'), t0('3', 'child', 8), t0('4', 'child', 5)]],
  ]

  return (
    <Card className="flex flex-col gap-3">
      <h2 className="text-lg font-bold">👥 {t('group')}</h2>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-500">{t('presets')}:</span>
        {presets.map(([label, make]) => (
          <Chip key={label} onClick={() => setGroup(make())}>
            {label}
          </Chip>
        ))}
      </div>
      <ul className="flex flex-col gap-2">
        {trip.group.map((x) => (
          <li key={x.id} className="grid grid-cols-[1fr_auto] gap-2 rounded-lg bg-slate-50 p-2 dark:bg-slate-900">
            <div className="grid grid-cols-[1fr_5rem] gap-2">
              <input
                className={`${inputCls} col-span-2`}
                aria-label={t('travellerName')}
                placeholder={t('travellerName')}
                value={x.name}
                onChange={(e) => update(x.id, { name: e.target.value })}
              />
              <select
                className={inputCls}
                value={x.category}
                onChange={(e) => update(x.id, { category: e.target.value as TravellerCategory })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`cat.${c}`)}
                  </option>
                ))}
              </select>
              <input
                className={inputCls}
                type="number"
                min={0}
                max={110}
                aria-label={t('age')}
                placeholder={t('age')}
                value={x.age ?? ''}
                onChange={(e) => update(x.id, { age: e.target.value === '' ? null : Number(e.target.value) })}
              />
            </div>
            <Button variant="ghost" className="px-2.5" aria-label={t('remove')} onClick={() => setGroup(trip.group.filter((y) => y.id !== x.id))}>
              <Trash2 size={18} />
            </Button>
          </li>
        ))}
      </ul>
      {trip.group.some((x) => x.category === 'child' && x.age === null) && (
        <p className="text-sm text-amber-700 dark:text-amber-400">{t('childNeedsAge')}</p>
      )}
      <Button className="self-start" onClick={() => setGroup([...trip.group, t0(String(trip.group.length + 1), 'adult')])}>
        <Plus size={18} /> {t('addTraveller')}
      </Button>
    </Card>
  )
}
