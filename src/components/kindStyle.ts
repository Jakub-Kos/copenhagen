import type { PlaceKind, WeatherExposure } from '@/data/types'

export const KIND_ICON: Record<PlaceKind, string> = {
  sight: '🏰',
  museum: '🖼️',
  'street-walk': '🚶',
  park: '🌳',
  viewpoint: '🔭',
  'food-market': '🍽️',
  neighbourhood: '🏘️',
  'day-trip': '🚆',
}

export const WEATHER_COLOR: Record<WeatherExposure, string> = {
  indoor: 'var(--color-indoor)',
  covered: 'var(--color-covered)',
  outdoor: 'var(--color-outdoor)',
}

export const WEATHER_ICON: Record<WeatherExposure, string> = {
  indoor: '🏠',
  covered: '⛱️',
  outdoor: '🌤️',
}
