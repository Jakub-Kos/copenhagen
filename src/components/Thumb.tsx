import { useEffect, useRef, useState } from 'react'
import { placeById } from '@/data/places'
import { KIND_ICON } from './kindStyle'
import { imageFor, thumb } from './placeImage'
import { cx } from './cls'

/** Start loading a thumbnail this close to the screen (the browser's own lazy loading reaches much further). */
const NEAR = '300px'

/** Square photo thumbnail for lists; falls back to the kind icon. */
export function Thumb({ placeId, className }: { placeId: string; className?: string }) {
  const img = imageFor(placeId)
  const place = placeById.get(placeId)
  const cls = cx('size-16 shrink-0 rounded-lg', className)
  const ref = useRef<HTMLSpanElement>(null)
  const [near, setNear] = useState(typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (near || !ref.current) return
    const io = new IntersectionObserver(
      (es) => {
        if (es.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: NEAR },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [near])

  if (!img) {
    return (
      <span className={cx(cls, 'grid place-items-center bg-slate-100 text-2xl dark:bg-slate-700')} aria-hidden>
        {place ? KIND_ICON[place.kind] : '📍'}
      </span>
    )
  }
  if (!near) return <span ref={ref} className={cx(cls, 'block bg-slate-200 dark:bg-slate-700')} aria-hidden />
  return (
    <img
      src={thumb(img, 250)}
      crossOrigin="anonymous"
      alt=""
      decoding="async"
      fetchPriority="low"
      className={cx(cls, 'bg-slate-200 object-cover dark:bg-slate-700')}
    />
  )
}
