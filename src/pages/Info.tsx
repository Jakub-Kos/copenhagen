import { Phone } from 'lucide-react'
import { EMBASSY_SOURCE, EMERGENCY, PHRASES, SECTIONS } from '@/data/practical'
import { useT } from '@/i18n/useT'

/** Practical information: emergency numbers to tap, everyday tips and a few Danish words. */
export default function Info() {
  const { t, bi } = useT()
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 p-4">
      <h1 className="text-2xl font-bold">{t('infoTitle')}</h1>

      <section className="rounded-xl border-2 border-red-300 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
        <h2 className="mb-2 text-lg font-bold text-red-800 dark:text-red-300">🆘 {t('infoEmergency')}</h2>
        <ul className="flex flex-col gap-2">
          {EMERGENCY.map((c) => (
            <li key={c.number}>
              <a
                href={`tel:${c.number}`}
                className="flex items-center gap-3 rounded-lg bg-white p-3 text-slate-900 no-underline shadow-sm dark:bg-slate-800 dark:text-slate-100"
              >
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-600 text-white">
                  <Phone size={20} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{bi(c.label)}</span>
                  <span className="block text-lg font-bold tracking-wide text-red-700 dark:text-red-300">{formatNumber(c.number)}</span>
                  {c.note && <span className="block text-sm text-slate-600 dark:text-slate-300">{bi(c.note)}</span>}
                </span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t('infoSources')}{' '}
          <a href={SECTIONS.find((s) => s.id === 'health')?.source} target="_blank" rel="noreferrer">
            international.kk.dk
          </a>
          ,{' '}
          <a href={EMBASSY_SOURCE} target="_blank" rel="noreferrer">
            mzv.gov.cz
          </a>
        </p>
      </section>

      {SECTIONS.map((s) => (
        <section key={s.id} className="flex flex-col gap-2">
          <h2 className="text-lg font-bold">{bi(s.title)}</h2>
          <ul className="flex flex-col gap-2">
            {s.items.map((it) => (
              <li key={it.title.en} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
                <span className="text-2xl leading-none" aria-hidden>
                  {it.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{bi(it.title)}</h3>
                  <p className="leading-relaxed text-slate-700 dark:text-slate-300">{bi(it.text)}</p>
                  {it.link && (
                    <a href={it.link.url} target="_blank" rel="noreferrer" className="mt-1 inline-block font-medium">
                      {bi(it.link.label)} ↗
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {s.source && (
            <a href={s.source} target="_blank" rel="noreferrer" className="text-xs">
              {t('priceSource')} ↗
            </a>
          )}
        </section>
      ))}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">🇩🇰 {t('infoPhrases')}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('infoPhrasesHint')}</p>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800">
          {PHRASES.map((p) => (
            <li key={p.da} className="flex flex-wrap items-baseline justify-between gap-x-3 px-3 py-2">
              <span>
                <span className="font-semibold">{p.da}</span> <span className="text-sm text-slate-500 dark:text-slate-400">[{p.say}]</span>
              </span>
              <span className="text-slate-700 dark:text-slate-300">{bi(p.mean)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/** "+4539101800" → "+45 39 10 18 00"; short numbers stay as they are. */
function formatNumber(n: string): string {
  const m = n.match(/^\+(45|420)(\d+)$/)
  if (!m) return n
  // Danish 8-digit numbers in pairs; short service numbers (1813) stay whole; Czech in threes.
  const rest = m[1] === '420' ? (m[2].match(/.{1,3}/g) ?? []) : m[2].length === 8 ? (m[2].match(/.{2}/g) ?? []) : [m[2]]
  return `+${m[1]} ${rest.join(' ')}`
}
