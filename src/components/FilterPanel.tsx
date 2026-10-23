import type { Effort, PlaceKind, Tag } from '@/data/types'
import { useT } from '@/i18n/useT'
import { DEFAULT_FILTERS, type Filters, type SortKey } from '@/logic/filters'
import { type IsoDate, formatDayShort } from '@/logic/time'
import { KIND_ICON } from './kindStyle'
import { Chip, Field } from './ui'
import { inputCls } from './cls'

const KINDS: PlaceKind[] = ['sight', 'museum', 'street-walk', 'park', 'viewpoint', 'food-market', 'neighbourhood', 'day-trip']
const TAGS: Tag[] = ['history', 'royal', 'art', 'design', 'architecture', 'food', 'hygge', 'view', 'nature', 'harbour', 'church', 'alternative', 'family']
const EFFORTS: Effort[] = ['easy', 'moderate', 'hard']
const DURATIONS = [30, 60, 90, 120]

const toggle = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v])

interface Props {
  value: Filters
  onChange: (f: Filters) => void
  /** Days offered by "open on": the active trip's days, or the next week. */
  days: IsoDate[]
}

export function FilterPanel({ value: f, onChange, days }: Props) {
  const { t, lang } = useT()
  const set = (patch: Partial<Filters>) => onChange({ ...f, ...patch })

  return (
    <div className="flex flex-col gap-4">
      <Field label={t('kind')}>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <Chip key={k} active={f.kinds.includes(k)} onClick={() => set({ kinds: toggle(f.kinds, k) })}>
              {KIND_ICON[k]} {t(`kind.${k}`)}
            </Chip>
          ))}
        </div>
      </Field>

      <div className="flex flex-wrap gap-2">
        <Chip active={f.rainOnly} onClick={() => set({ rainOnly: !f.rainOnly })}>
          ☔ {t('rainOnly')}
        </Chip>
        <Chip active={f.mustSeeOnly} onClick={() => set({ mustSeeOnly: !f.mustSeeOnly })}>
          ⭐ {t('mustSeeOnly')}
        </Chip>
        <Chip active={f.freeOnly} onClick={() => set({ freeOnly: !f.freeOnly })}>
          🆓 {t('freeOnly')}
        </Chip>
      </div>

      <Field label={t('tags')}>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <Chip key={tag} active={f.tags.includes(tag)} onClick={() => set({ tags: toggle(f.tags, tag) })}>
              {t(`tag.${tag}`)}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label={t('effort')}>
        <div className="flex flex-wrap gap-2">
          {EFFORTS.map((e) => (
            <Chip key={e} active={f.efforts.includes(e)} onClick={() => set({ efforts: toggle(f.efforts, e) })}>
              {t(`effort.${e}`)}
            </Chip>
          ))}
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t('minRating')}>
          <select className={inputCls} value={f.minRating} onChange={(e) => set({ minRating: Number(e.target.value) })}>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('maxDuration')}>
          <select
            className={inputCls}
            value={f.maxDuration ?? ''}
            onChange={(e) => set({ maxDuration: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">{t('any')}</option>
            {DURATIONS.map((m) => (
              <option key={m} value={m}>
                ≤ {m} min
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('openOn')}>
          <select className={inputCls} value={f.openOn ?? ''} onChange={(e) => set({ openOn: e.target.value || null })}>
            <option value="">{t('anyDay')}</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {formatDayShort(d, lang)}
              </option>
            ))}
          </select>
        </Field>
        <Field label={t('sortBy')}>
          <select className={inputCls} value={f.sort} onChange={(e) => set({ sort: e.target.value as SortKey })}>
            {(['rating', 'distance', 'duration', 'name'] as const).map((s) => (
              <option key={s} value={s}>
                {t(`sort.${s}`)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <button type="button" className="self-start text-sm text-accent underline" onClick={() => onChange({ ...DEFAULT_FILTERS, q: f.q, sort: f.sort })}>
        {t('clearFilters')}
      </button>
    </div>
  )
}
