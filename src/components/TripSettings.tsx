import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Link2, LocateFixed, Printer, Trash2, Upload } from 'lucide-react'
import { useT } from '@/i18n/useT'
import { parseLatLng } from '@/logic/geo'
import { useStore } from '@/state/store'
import { downloadJson, parseTrip, shareUrl } from '@/state/share'
import { setDates } from '@/state/tripOps'
import type { Trip } from '@/state/tripTypes'
import { GroupEditor } from './GroupEditor'
import { OfflineCard } from './OfflineCard'
import { Button, Card, Field } from './ui'
import { inputCls } from './cls'

export function TripSettings({ trip, onDeleted }: { trip: Trip; onDeleted: () => void }) {
  const { t, lang } = useT()
  const { dispatch } = useStore()
  const save = (next: Trip) => dispatch({ type: 'upsertTrip', trip: next })

  const [hbLabel, setHbLabel] = useState(trip.homeBase?.label ?? '')
  const [hbCoords, setHbCoords] = useState(
    trip.homeBase ? `${trip.homeBase.coords.lat.toFixed(5)}, ${trip.homeBase.coords.lng.toFixed(5)}` : '',
  )
  const [hbError, setHbError] = useState('')
  const [copied, setCopied] = useState(false)
  const [importError, setImportError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  function saveHomeBase() {
    const coords = parseLatLng(hbCoords)
    if (!coords) return setHbError(t('invalidCoords'))
    setHbError('')
    save({ ...trip, homeBase: { label: hbLabel.trim() || t('homeBase'), coords } })
  }

  function locate() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setHbCoords(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`),
      () => setHbError(t('locationError')),
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  async function copyShare() {
    const url = shareUrl(trip, lang)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      window.prompt(t('shareLink'), url)
    }
  }

  async function importFile(f: File) {
    try {
      const parsed = parseTrip(JSON.parse(await f.text()))
      if (!parsed) throw new Error('invalid')
      // A trip with the same id replaces the existing copy; otherwise it is added.
      dispatch({ type: 'upsertTrip', trip: parsed, activate: true })
      setImportError('')
    } catch {
      setImportError(t('importFailed'))
    }
  }

  const num = (v: string, fallback: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : fallback)

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t('tripSettings')}</h2>
        <Field label={t('tripName')}>
          <input className={inputCls} value={trip.name} onChange={(e) => save({ ...trip, name: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('from')}>
            <input
              className={inputCls}
              type="date"
              value={trip.start}
              onChange={(e) => e.target.value && save(setDates(trip, e.target.value, trip.end < e.target.value ? e.target.value : trip.end))}
            />
          </Field>
          <Field label={t('to')}>
            <input
              className={inputCls}
              type="date"
              value={trip.end}
              min={trip.start}
              onChange={(e) => e.target.value && save(setDates(trip, trip.start, e.target.value))}
            />
          </Field>
          <Field label={t('walkingSpeed')}>
            <input
              className={inputCls}
              type="number"
              step="0.1"
              min="2"
              max="7"
              value={trip.walkingSpeedKmh}
              onChange={(e) => save({ ...trip, walkingSpeedKmh: num(e.target.value, 4.5) })}
            />
          </Field>
          <Field label={t('transitThreshold')}>
            <input
              className={inputCls}
              type="number"
              step="0.5"
              min="0.5"
              value={trip.transitThresholdKm}
              onChange={(e) => save({ ...trip, transitThresholdKm: num(e.target.value, 3) })}
            />
          </Field>
          <Field label={t('maxDayHours')}>
            <input
              className={inputCls}
              type="number"
              min="1"
              value={trip.maxDayHours}
              onChange={(e) => save({ ...trip, maxDayHours: num(e.target.value, 9) })}
            />
          </Field>
          <Field label={t('maxDayKm')}>
            <input
              className={inputCls}
              type="number"
              min="1"
              value={trip.maxDayKm}
              onChange={(e) => save({ ...trip, maxDayKm: num(e.target.value, 15) })}
            />
          </Field>
        </div>
      </Card>

      <GroupEditor trip={trip} />

      <Card className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">🏠 {t('homeBase')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('homeBaseHint')}</p>
        <Field label={t('homeBaseLabel')}>
          <input className={inputCls} value={hbLabel} onChange={(e) => setHbLabel(e.target.value)} />
        </Field>
        <Field label={t('homeBaseCoords')}>
          <input
            className={inputCls}
            inputMode="decimal"
            placeholder="55.68, 12.57"
            value={hbCoords}
            onChange={(e) => setHbCoords(e.target.value)}
          />
        </Field>
        {hbError && <p className="text-sm text-red-600">{hbError}</p>}
        <div className="flex flex-wrap gap-2">
          <Button onClick={locate}>
            <LocateFixed size={18} /> {t('useMyLocation')}
          </Button>
          <Button variant="primary" onClick={saveHomeBase}>
            {t('save')}
          </Button>
          {trip.homeBase && (
            <Button
              variant="ghost"
              onClick={() => {
                save({ ...trip, homeBase: null })
                setHbLabel('')
                setHbCoords('')
              }}
            >
              {t('remove')}
            </Button>
          )}
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Button onClick={copyShare}>
            <Link2 size={18} /> {copied ? t('copied') : t('shareLink')}
          </Button>
          <Button onClick={() => downloadJson(trip)}>
            <Download size={18} /> {t('exportJson')}
          </Button>
          <Button onClick={() => fileRef.current?.click()}>
            <Upload size={18} /> {t('importJson')}
          </Button>
          <Link
            to="/print?d=all"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 no-underline dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <Printer size={18} /> {t('printAll')}
          </Link>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void importFile(f)
              e.target.value = ''
            }}
          />
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('shareHint')}</p>
        {importError && <p className="text-sm text-red-600">{importError}</p>}
      </Card>

      <OfflineCard trip={trip} />

      <Button
        variant="danger"
        className="self-start"
        onClick={() => {
          if (window.confirm(t('confirmDelete', { name: trip.name }))) {
            dispatch({ type: 'deleteTrip', id: trip.id })
            onDeleted()
          }
        }}
      >
        <Trash2 size={18} /> {t('delete')}
      </Button>
    </div>
  )
}
