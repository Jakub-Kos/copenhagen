// Sunrise/sunset from the NOAA solar equations. Works offline; accurate to about a minute
// at Copenhagen's latitude, which is plenty for "is it still light?".

import type { LatLng } from '@/data/types'
import { type IsoDate, cphParts } from './time'

const rad = Math.PI / 180

/** UTC instant of sunrise or sunset on a calendar date, or null in polar day/night. */
function sunEventUtc(date: IsoDate, p: LatLng, rising: boolean): Date | null {
  const [y, m, d] = date.split('-').map(Number)
  const dayOfYear = (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000
  const gamma = ((2 * Math.PI) / 365) * (dayOfYear - 1)
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(gamma) -
      0.032077 * Math.sin(gamma) -
      0.014615 * Math.cos(2 * gamma) -
      0.040849 * Math.sin(2 * gamma))
  const decl =
    0.006918 -
    0.399912 * Math.cos(gamma) +
    0.070257 * Math.sin(gamma) -
    0.006758 * Math.cos(2 * gamma) +
    0.000907 * Math.sin(2 * gamma) -
    0.002697 * Math.cos(3 * gamma) +
    0.00148 * Math.sin(3 * gamma)
  // 90.833° = refraction + the sun's radius.
  const cosHa =
    Math.cos(90.833 * rad) / (Math.cos(p.lat * rad) * Math.cos(decl)) - Math.tan(p.lat * rad) * Math.tan(decl)
  if (cosHa < -1 || cosHa > 1) return null
  const ha = Math.acos(cosHa) / rad
  const minutesUtc = 720 - 4 * (p.lng + (rising ? ha : -ha)) - eqTime
  return new Date(Date.UTC(y, m - 1, d) + minutesUtc * 60000)
}

/** Sunrise and sunset as Copenhagen wall-clock minutes since midnight. */
export function sunTimes(date: IsoDate, p: LatLng): { sunrise: number; sunset: number } | null {
  const rise = sunEventUtc(date, p, true)
  const set = sunEventUtc(date, p, false)
  if (!rise || !set) return null
  return { sunrise: cphParts(rise).minutes, sunset: cphParts(set).minutes }
}
