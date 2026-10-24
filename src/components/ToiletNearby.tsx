import type { LatLng } from '@/data/types'
import { useT } from '@/i18n/useT'
import { nearestToilets } from '@/logic/amenities'
import { googleMapsDirections } from '@/logic/geo'

/** "Toilet nearby: 180 m · free" with a walking link; nothing when none is within 1 km. */
export function ToiletNearby({ at }: { at: LatLng }) {
  const { t } = useT()
  const [x] = nearestToilets(at)
  if (!x) return null
  const d = x.metres < 1000 ? `${Math.round(x.metres / 10) * 10} m` : `${(x.metres / 1000).toFixed(1)} km`
  const fee = x.fee === 'yes' ? t('toiletPaid') : x.fee === 'no' ? t('toiletFree') : t('toiletFeeUnknown')
  return (
    <a
      href={googleMapsDirections(x.coords)}
      target="_blank"
      rel="noreferrer"
      className="text-sm text-slate-600 no-underline hover:underline dark:text-slate-300"
    >
      🚻 {t('nearestToilet', { d })} · {fee.toLowerCase()}
      {x.wheelchair && ' · ♿'} ↗
    </a>
  )
}
