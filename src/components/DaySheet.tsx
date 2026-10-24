import { pricingFor } from '@/data/prices'
import type { Place } from '@/data/types'
import { useT } from '@/i18n/useT'
import { entryPrice } from '@/logic/costs'
import { hoursOn } from '@/logic/hours'
import { fitSketch, scaleBar } from '@/logic/sketch'
import { type IsoDate, formatDayLong, formatDuration, fromMinutes } from '@/logic/time'
import type { Leg } from '@/logic/timeline'
import type { RouteEntry } from '@/state/routeStore'
import { dayOf } from '@/state/tripOps'
import type { Trip } from '@/state/tripTypes'
import { KIND_ICON } from './kindStyle'
import type { MapLine } from './MapView'
import { formatDkk } from './money'
import { useForecast } from './useForecast'
import { useTimeline } from './useTimeline'
import { wmo } from './wmo'

const MAP_W = 680
const MAP_H = 210
const dist = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m / 10) * 10} m`)

/** One printable A4 page for a planned day. */
export function DaySheet({ trip, date }: { trip: Trip; date: IsoDate }) {
  const { t, bi, lang } = useT()
  const { tl, legRoute, walkRoute, lines } = useTimeline(trip, date)
  const { forecast } = useForecast()
  const wx = forecast?.days.find((d) => d.date === date)
  const warned = (stopId: string) => tl.warnings.filter((w) => 'stopId' in w && w.stopId === stopId).map((w) => w.kind)

  const price = (p: Place): string => {
    const pr = pricingFor(p.id)
    if (pr.free) return pr.noTicket ? t('sheetNoTicket') : t('priceFree')
    const people = trip.group.length ? trip.group : null
    if (!people) return pr.adult === null ? '?' : `${formatDkk(pr.adult, lang)} / ${t('cat.adult').toLowerCase()}`
    const each = people.map((x) => entryPrice(pr, x))
    if (each.every((x) => x === null)) return '?'
    const sum = each.reduce<number>((s, x) => s + (x ?? 0), 0)
    return `${formatDkk(sum, lang)}${each.some((x) => x === null) ? ' + ?' : ''}`
  }

  const hours = (p: Place): string => {
    const h = hoursOn(p.openingHours, date)
    return h === 'always' ? t('alwaysOpen') : h ? `${h.open}–${h.close}` : t('closed')
  }

  return (
    <article className="sheet mx-auto flex max-w-[190mm] flex-col gap-3 bg-white p-4 text-[13px] leading-snug text-black print:p-0">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 border-b-2 border-black pb-1">
        <h1 className="text-xl font-bold first-letter:uppercase">{formatDayLong(date, lang)}</h1>
        <span className="text-sm">{trip.name}</span>
      </header>
      <p className="flex flex-wrap gap-x-4 gap-y-0.5">
        <span>
          ▶ {t('sheetStart', { time: dayOf(trip, date).startTime })}
          {trip.homeBase && ` · ${trip.homeBase.label}`}
        </span>
        {tl.stops.length > 0 && <span>⏹ {t('sheetEnd', { time: fromMinutes(tl.end) })}</span>}
        <span>🚶 {t('sheetWalk', { km: (tl.walkM / 1000).toFixed(1) })}</span>
        {tl.sunset !== null && <span>🌇 {t('sunset', { t: fromMinutes(tl.sunset) })}</span>}
        {wx && (
          <span>
            {wmo(wx.code).icon} {Math.round(wx.tMin)}–{Math.round(wx.tMax)} °C
            {wx.rainMm >= 0.1 && ` · 💧 ${wx.rainMm.toFixed(1)} mm`}
          </span>
        )}
      </p>
      <p className="text-xs">
        🆘 112 · {t('sheetHelpline')} +45 1813 · {t('sheetEmbassy')} +45 39 10 18 00
        {trip.homeBase && (
          <>
            {' '}
            · 🏠 {trip.homeBase.label} ({trip.homeBase.coords.lat.toFixed(5)}, {trip.homeBase.coords.lng.toFixed(5)})
          </>
        )}
      </p>

      {tl.stops.length > 0 && <SketchMap trip={trip} places={tl.stops.map((s) => s.place)} lines={lines} />}

      {tl.stops.length === 0 ? (
        <p>{t('emptyDay')}</p>
      ) : (
        <ol className="flex flex-col">
          {tl.stops.map((s, i) => (
            <li key={s.stopId} className="break-inside-avoid">
              {s.leg && <SheetLeg leg={s.leg} route={legRoute(s.leg)} />}
              <div className="flex gap-3 rounded border border-black/40 px-2 py-1.5">
                <div className="w-[4.5rem] shrink-0 font-semibold tabular-nums">
                  {fromMinutes(s.arrive)}
                  <br />
                  <span className="font-normal">– {fromMinutes(s.leave)}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold">
                    <span className="mr-1 inline-grid size-5 place-items-center rounded-full border border-black text-[11px]">{i + 1}</span>
                    {KIND_ICON[s.place.kind]} {bi(s.place.name)}
                    {lang === 'cs' && s.place.name.en !== s.place.name.cs && <span className="font-normal"> ({s.place.name.en})</span>}
                  </div>
                  <div>
                    🕘 {hours(s.place)} · 💰 {price(s.place)}
                    {s.place.bookingNeeded && ` · 🎟️ ${t('bookingNeeded')}`}
                  </div>
                  {warned(s.stopId).map((w) => (
                    <div key={w} className="font-semibold">
                      ⚠️ {t(`warn.${w as 'closed' | 'dark' | 'rain' | 'wind'}`)}
                    </div>
                  ))}
                  {s.place.notes && <div className="italic">💡 {bi(s.place.notes)}</div>}
                  {s.place.waypoints && (() => {
                    const r = walkRoute(s.place)
                    return r?.status === 'ok' ? <Steps route={r} /> : null
                  })()}
                </div>
              </div>
            </li>
          ))}
          {tl.homeLeg && trip.homeBase && (
            <li className="break-before-avoid break-inside-avoid">
              <SheetLeg leg={tl.homeLeg} route={legRoute(tl.homeLeg)} />
              <div className="font-semibold">🏠 {t('backHome', { home: trip.homeBase.label })} · {fromMinutes(tl.end)}</div>
            </li>
          )}
        </ol>
      )}

    </article>
  )
}

function SheetLeg({ leg, route }: { leg: Leg; route?: RouteEntry }) {
  const { t } = useT()
  return (
    <div className="ml-6 border-l-2 border-dashed border-black/50 py-1 pl-3">
      {leg.mode === 'walk' ? '🚶' : '🚆'} {dist(leg.metres)} · {formatDuration(leg.minutes)}
      {leg.mode === 'transit' && ` · ${t('sheetTransit')}`}
      {leg.mode === 'walk' && route?.status === 'ok' && <Steps route={route} />}
    </div>
  )
}

/** Steps shorter than this are left out on paper (Valhalla lists every 10 m footpath turn). */
const MIN_STEP_M = 40

/** Turn-by-turn steps in two compact columns, without the tiny ones. */
function Steps({ route }: { route: Extract<RouteEntry, { status: 'ok' }> }) {
  const all = route.route.maneuvers
  const steps = all.filter((m, i) => i === 0 || i === all.length - 1 || m.metres >= MIN_STEP_M)
  return (
    <ol className="mt-0.5 list-decimal columns-2 gap-4 pl-5 text-[11px] leading-tight">
      {steps.map((m, i) => (
        <li key={i} className="break-inside-avoid">
          {m.instruction}
          {m.metres > 0 && ` (${dist(m.metres)})`}
        </li>
      ))}
    </ol>
  )
}

/** North-up sketch of the day: routes, numbered stops and home. No tiles, so it prints crisply. */
function SketchMap({ trip, places, lines }: { trip: Trip; places: Place[]; lines: MapLine[] }) {
  const home = trip.homeBase?.coords
  const pts = [...places.map((p) => p.coords), ...lines.flatMap((l) => l.coords), ...(home ? [home] : [])]
  const s = fitSketch(pts, MAP_W, MAP_H, 22)
  if (!s) return null
  const bar = scaleBar(s.metresPerUnit, 120)
  const path = (l: MapLine) => l.coords.map((p, i) => `${i ? 'L' : 'M'}${s.project(p).map((v) => v.toFixed(1)).join(' ')}`).join('')
  return (
    <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="w-full rounded border border-black/40" role="img" aria-label="Map">
      <rect width={MAP_W} height={MAP_H} fill="#f8fafc" />
      {lines.map((l) => (
        <path
          key={l.id}
          d={path(l)}
          fill="none"
          stroke={l.style === 'transit' ? '#64748b' : '#4338ca'}
          strokeWidth={l.style === 'route' ? 3 : 2}
          strokeDasharray={l.style === 'route' ? undefined : l.style === 'transit' ? '6 5' : '2 4'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {home && (() => {
        const [x, y] = s.project(home)
        return (
          <g>
            <rect x={x - 9} y={y - 9} width={18} height={18} rx={3} fill="#0b1220" />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fill="#fff" fontWeight={700}>
              H
            </text>
          </g>
        )
      })()}
      {places.map((p, i) => {
        const [x, y] = s.project(p.coords)
        return (
          <g key={`${p.id}-${i}`}>
            <circle cx={x} cy={y} r={10} fill="#fff" stroke="#000" strokeWidth={2} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700}>
              {i + 1}
            </text>
          </g>
        )
      })}
      <g transform={`translate(${MAP_W - bar.units - 16} ${MAP_H - 14})`}>
        <line x1={0} x2={bar.units} y1={0} y2={0} stroke="#000" strokeWidth={2} />
        <line x1={0} x2={0} y1={-4} y2={4} stroke="#000" strokeWidth={2} />
        <line x1={bar.units} x2={bar.units} y1={-4} y2={4} stroke="#000" strokeWidth={2} />
        <text x={bar.units / 2} y={-6} textAnchor="middle" fontSize={10}>
          {bar.metres >= 1000 ? `${bar.metres / 1000} km` : `${bar.metres} m`}
        </text>
      </g>
      <text x={14} y={20} fontSize={12} fontWeight={700}>
        N ↑
      </text>
    </svg>
  )
}
