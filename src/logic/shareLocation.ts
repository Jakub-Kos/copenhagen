// "Share where we are": the message text (pure). The position goes only into the text the
// user sends through their own phone; nothing is stored or sent by the app.

import type { LatLng } from '@/data/types'
import { fromMinutes } from './time'

export interface WhereWeAre {
  pos: LatLng
  /** GPS accuracy in metres, if known. */
  accuracy: number | null
  /** Copenhagen time now, minutes since midnight. */
  now: number
  next?: { name: string; arrive: number; coords: LatLng } | null
  home?: string | null
}

export const mapsLink = (p: LatLng) => `https://maps.google.com/?q=${p.lat.toFixed(5)},${p.lng.toFixed(5)}`

type Tr = (key: 'shareHere' | 'shareNext' | 'shareHome', vars: Record<string, string>) => string

export function shareMessage(w: WhereWeAre, t: Tr): string {
  const acc = w.accuracy !== null ? ` ±${Math.max(5, Math.round(w.accuracy / 5) * 5)} m` : ''
  const lines = [t('shareHere', { time: fromMinutes(w.now), acc }), mapsLink(w.pos)]
  if (w.next) lines.push(t('shareNext', { place: w.next.name, time: fromMinutes(w.next.arrive) }), mapsLink(w.next.coords))
  if (w.home) lines.push(t('shareHome', { home: w.home }))
  return lines.join('\n')
}
