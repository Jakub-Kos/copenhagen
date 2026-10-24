import type { Lang } from '@/data/types'
import type { useT } from '@/i18n/useT'
import type { PassOption } from '@/logic/costs'
import type { Reminder } from '@/logic/reminders'
import { formatDayShort, fromMinutes } from '@/logic/time'

type T = ReturnType<typeof useT>

export function passName(o: Exclude<PassOption, { kind: 'none' }>, t: T['t']): string {
  return o.kind === 'card'
    ? t('optCard', { variant: o.variant === 'discover' ? 'DISCOVER' : 'HOP', hours: o.hours })
    : t('optCityPass', { size: o.size === 'small' ? 'Small' : 'Large', hours: o.hours })
}

/** Icon, title and detail line for a reminder, in the UI language. */
export function reminderText(r: Reminder, { t, bi, lang }: Pick<T, 't' | 'bi'> & { lang: Lang }): { icon: string; title: string; detail: string } {
  const day = formatDayShort(r.date, lang)
  switch (r.kind) {
    case 'book':
      return { icon: '🎟️', title: t('remBook', { place: bi(r.place.name) }), detail: t('remBookDetail', { day, time: fromMinutes(r.at) }) }
    case 'leave':
      return {
        icon: r.transit ? '🚆' : '🚶',
        title: t('remLeave', { time: fromMinutes(r.at) }),
        detail: t('remLeaveDetail', { day, place: bi(r.place.name) }),
      }
    case 'pass':
      return {
        icon: '💳',
        title: t('remPass', { pass: passName(r.option, t), n: r.travellers }),
        detail: t('remPassDetail', { day, time: fromMinutes(r.at), place: r.place ? bi(r.place.name) : '' }),
      }
    case 'dst':
      return { icon: '🕒', title: t('remDst'), detail: t(r.shift < 0 ? 'remDstBack' : 'remDstForward', { day: formatDayShort(r.date, lang) }) }
  }
}
