import { useId, useMemo, useRef, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { places } from '@/data/places'
import type { LatLng } from '@/data/types'
import { useT } from '@/i18n/useT'
import { haversineM } from '@/logic/geo'
import { hoursOn } from '@/logic/hours'
import { searchPlaces } from '@/logic/search'
import type { IsoDate } from '@/logic/time'
import { KIND_ICON } from './kindStyle'
import { Thumb } from './Thumb'
import { cx, inputCls } from './cls'

const km = (m: number) => (m < 1000 ? `${Math.round(m / 50) * 50} m` : `${(m / 1000).toFixed(1)} km`)

/**
 * "Add a place": type to search (Czech or English, accents optional) and tap a result.
 * With nothing typed it offers the places nearest to `near` (the day's last stop).
 */
export function PlacePicker({
  date,
  near,
  planned,
  onPick,
}: {
  date: IsoDate
  near: LatLng | null
  planned: { has: (placeId: string) => boolean }
  onPick: (placeId: string) => void
}) {
  const { t, bi } = useT()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const results = useMemo(() => searchPlaces(q, places, near, 8), [q, near])

  function pick(id: string) {
    onPick(id)
    setQ('')
    setActive(0)
    inputRef.current?.focus()
  }

  return (
    <div className="relative" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <div className="relative">
        <Search size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" aria-hidden />
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={t('addPlace')}
          placeholder={`➕ ${t('addPlaceSearch')}`}
          className={cx(inputCls, 'scroll-mt-20 pl-10')}
          value={q}
          onFocus={(e) => {
            setOpen(true)
            // On a phone the keyboard covers the lower half: bring the box (and its results) up.
            e.currentTarget.scrollIntoView({ block: 'start', behavior: 'smooth' })
          }}
          onChange={(e) => {
            setQ(e.target.value)
            setActive(0)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, results.length - 1))
            else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0))
            else if (e.key === 'Enter' && results[active]) pick(results[active].id)
            else if (e.key === 'Escape') setOpen(false)
            else return
            e.preventDefault()
          }}
        />
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-[60dvh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {!q && near && <li className="px-2 py-1 text-xs text-slate-500 dark:text-slate-400">{t('nearbyFirst')}</li>}
          {results.length === 0 && <li className="px-3 py-2 text-slate-500">{t('noMatch')}</li>}
          {results.map((p, i) => {
            const closed = hoursOn(p.openingHours, date) === null
            return (
              <li key={p.id} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onClick={() => pick(p.id)}
                  onMouseEnter={() => setActive(i)}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-lg p-2 text-left',
                    i === active ? 'bg-accent/10' : 'hover:bg-slate-100 dark:hover:bg-slate-700',
                  )}
                >
                  <Thumb placeId={p.id} className="size-11" />
                  <span className="min-w-0 flex-1">
                    <span className="block leading-tight font-medium">{bi(p.name)}</span>
                    <span className="block text-sm text-slate-500 dark:text-slate-400">
                      {KIND_ICON[p.kind]} {t(`kind.${p.kind}`)}
                      {near && ` · ${km(haversineM(near, p.coords))}`}
                      {planned.has(p.id) && <span className="text-green-700 dark:text-green-400"> · ✓ {t('alreadyPlanned')}</span>}
                      {closed && <span className="text-red-600 dark:text-red-400"> · {t('closed')}</span>}
                    </span>
                  </span>
                  <Plus size={20} className="shrink-0 text-accent" aria-hidden />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
