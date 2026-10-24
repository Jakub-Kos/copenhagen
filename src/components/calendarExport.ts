import { googleMapsDirections } from '@/logic/geo'
import { type IcsEvent, toIcs } from '@/logic/ics'
import type { Reminder } from '@/logic/reminders'
import type { IsoDate } from '@/logic/time'
import type { Timeline } from '@/logic/timeline'
import type { Trip } from '@/state/tripTypes'
import type { Bi, Lang } from '@/data/types'
import type { useT } from '@/i18n/useT'
import { reminderText } from './reminderText'

/** Calendar events: every planned stop, plus the reminders with alarms. */
export function calendarEvents(
  trip: Trip,
  timelines: ReadonlyMap<IsoDate, Timeline>,
  rems: Reminder[],
  tx: Pick<ReturnType<typeof useT>, 't'> & { bi: (b: Bi) => string; lang: Lang },
): IcsEvent[] {
  const uid = (k: string) => `${trip.id}-${k}@copenhagen-guide`
  const events: IcsEvent[] = []
  for (const [date, tl] of timelines) {
    tl.stops.forEach((s, i) => {
      events.push({
        uid: uid(`stop:${date}:${s.stopId}`),
        date,
        start: s.arrive,
        minutes: Math.max(15, s.leave - s.arrive),
        title: `${i + 1}. ${tx.bi(s.place.name)}`,
        description: `${tx.bi(s.place.description)}\n${googleMapsDirections(s.place.coords)}`,
        geo: s.place.coords,
      })
    })
  }
  for (const r of rems) {
    if (trip.done[r.key]) continue
    const { icon, title, detail } = reminderText(r, tx)
    const at = r.kind === 'leave' ? r.at : r.dueMin
    const date = r.kind === 'book' ? r.due : r.date
    events.push({
      uid: uid(r.key),
      date,
      start: r.kind === 'pass' ? r.at - 30 : at,
      minutes: 10,
      title: `${icon} ${title}`,
      description: detail,
      alarmBefore: r.kind === 'leave' ? 15 : 0,
    })
  }
  return events
}

export function downloadIcs(trip: Trip, events: IcsEvent[]): void {
  const blob = new Blob([toIcs(trip.name, events)], { type: 'text/calendar;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${trip.name.replace(/[^\p{L}\p{N}]+/gu, '-').toLowerCase() || 'trip'}.ics`
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Some mobile browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
}
