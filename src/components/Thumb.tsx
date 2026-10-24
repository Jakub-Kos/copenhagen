import { placeById } from '@/data/places'
import { KIND_ICON } from './kindStyle'
import { imageFor, thumb } from './placeImage'
import { cx } from './cls'

/** Square photo thumbnail for lists; falls back to the kind icon. */
export function Thumb({ placeId, className }: { placeId: string; className?: string }) {
  const img = imageFor(placeId)
  const place = placeById.get(placeId)
  const cls = cx('size-16 shrink-0 rounded-lg', className)
  if (!img) {
    return (
      <span className={cx(cls, 'grid place-items-center bg-slate-100 text-2xl dark:bg-slate-700')} aria-hidden>
        {place ? KIND_ICON[place.kind] : '📍'}
      </span>
    )
  }
  return <img src={thumb(img, 250)} alt="" loading="lazy" className={cx(cls, 'bg-slate-200 object-cover dark:bg-slate-700')} />
}
