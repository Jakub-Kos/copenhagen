import { Suspense, lazy } from 'react'
import type { MapViewProps } from './MapView'
import { cx } from './cls'

// MapLibre is the largest part of the app; loading it separately lets the rest of the page
// (lists, today's plan) appear first. The download starts as soon as this module runs, not
// when a map first renders. The placeholder keeps the layout from jumping.
const mapModule = import('./MapView')
const MapViewImpl = lazy(() => mapModule.then((m) => ({ default: m.MapView })))

export function MapView(props: MapViewProps) {
  return (
    <Suspense fallback={<div className={cx(props.className, 'animate-pulse bg-slate-200 dark:bg-slate-800')} aria-hidden />}>
      <MapViewImpl {...props} />
    </Suspense>
  )
}
