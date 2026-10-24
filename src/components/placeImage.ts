import { placeImages } from '@/data/images'
import type { PlaceImage } from '@/data/types'

/** Wikimedia serves standard thumbnail widths; the data stores the 960 px one. */
export type ThumbWidth = 250 | 500 | 960

export const imageFor = (placeId: string): PlaceImage | undefined => placeImages[placeId]

export const thumb = (img: PlaceImage, w: ThumbWidth): string => img.url.replace('/960px-', `/${w}px-`)
