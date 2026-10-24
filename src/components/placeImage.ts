import { placeImages } from '@/data/images'
import type { PlaceImage } from '@/data/types'

/** Wikimedia serves standard thumbnail widths; the data stores the 960 px one. */
export type ThumbWidth = 250 | 500 | 960

export const imageFor = (placeId: string): PlaceImage | undefined => placeImages[placeId]

const ORIGINAL = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/(\w\/\w\w)\/([^/]+)$/

export function thumb(img: PlaceImage, w: ThumbWidth): string {
  if (img.url.includes('/960px-')) return img.url.replace('/960px-', `/${w}px-`)
  // Originals narrower than 960 px are stored as the file itself (all are at least 500 px wide);
  // list thumbnails still use Wikimedia's 250 px version instead of the full file.
  const m = w === 250 ? img.url.match(ORIGINAL) : null
  return m ? `${m[1]}/thumb/${m[2]}/${m[3]}/250px-${m[3]}` : img.url
}
