import { useT } from '@/i18n/useT'
import { useStore } from '@/state/store'

const SITE_URL = 'https://jakub-kos.github.io/WebPage/'

export function Header() {
  const { state, dispatch } = useStore()
  const { t, lang } = useT()
  const { largeText } = state.settings

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-navy px-4 py-2.5 text-navy-text">
      <div className="flex min-w-0 items-baseline gap-3">
        <a href={SITE_URL} className="truncate text-sm font-bold text-navy-text/70 no-underline hover:text-navy-text">
          {t('backToSite')}
        </a>
        <span className="text-lg font-bold">{t('appTitle')}</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-pressed={largeText}
          title={t('largeText')}
          onClick={() => dispatch({ type: 'settings', patch: { largeText: !largeText } })}
          className={`min-h-10 min-w-10 rounded-lg border px-2 font-bold ${largeText ? 'border-navy-text bg-navy-text text-navy' : 'border-navy-text/40'}`}
        >
          A<span className="text-xs">+</span>
        </button>
        <div className="flex overflow-hidden rounded-lg border border-navy-text/40" role="group" aria-label="Language">
          {(['cs', 'en'] as const).map((l) => (
            <button
              key={l}
              type="button"
              aria-pressed={lang === l}
              onClick={() => dispatch({ type: 'settings', patch: { lang: l } })}
              className={`min-h-10 px-2.5 text-sm font-semibold uppercase ${lang === l ? 'bg-navy-text text-navy' : ''}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
