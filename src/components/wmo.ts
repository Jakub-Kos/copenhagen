import type { Bi } from '@/data/types'

/** WMO weather code → icon and short label. */
export function wmo(code: number, night = false): { icon: string; label: Bi } {
  if (code === 0) return { icon: night ? '🌙' : '☀️', label: { cs: 'Jasno', en: 'Clear' } }
  if (code <= 2) return { icon: night ? '☁️' : '🌤️', label: { cs: 'Polojasno', en: 'Partly cloudy' } }
  if (code === 3) return { icon: '☁️', label: { cs: 'Zataženo', en: 'Overcast' } }
  if (code === 45 || code === 48) return { icon: '🌫️', label: { cs: 'Mlha', en: 'Fog' } }
  if (code >= 51 && code <= 57) return { icon: '🌦️', label: { cs: 'Mrholení', en: 'Drizzle' } }
  if (code >= 61 && code <= 67) return { icon: '🌧️', label: { cs: 'Déšť', en: 'Rain' } }
  if (code >= 71 && code <= 77) return { icon: '🌨️', label: { cs: 'Sníh', en: 'Snow' } }
  if (code >= 80 && code <= 82) return { icon: '🌦️', label: { cs: 'Přeháňky', en: 'Showers' } }
  if (code === 85 || code === 86) return { icon: '🌨️', label: { cs: 'Sněhové přeháňky', en: 'Snow showers' } }
  if (code >= 95) return { icon: '⛈️', label: { cs: 'Bouřky', en: 'Thunderstorms' } }
  return { icon: '☁️', label: { cs: 'Oblačno', en: 'Cloudy' } }
}
