import { useCallback } from 'react'
import type { Bi, Lang } from '@/data/types'
import { useStore } from '@/state/store'
import { cs } from './cs'
import { type Key, en } from './en'

const dicts = { cs, en }

export function translate(lang: Lang, key: Key, vars?: Record<string, string | number>): string {
  let s = dicts[lang][key]
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v))
  return s
}

export function useT() {
  const { state } = useStore()
  const lang = state.settings.lang
  const t = useCallback((key: Key, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang])
  const bi = useCallback((b: Bi) => b[lang], [lang])
  return { t, bi, lang }
}
