import type { Lang } from '@/data/types'

const loc = (lang: Lang) => (lang === 'cs' ? 'cs-CZ' : 'en-GB')

export const formatDkk = (n: number, lang: Lang) =>
  `${new Intl.NumberFormat(loc(lang), { maximumFractionDigits: n % 1 ? 1 : 0 }).format(n)} DKK`

export const formatCzk = (dkk: number, rate: number, lang: Lang) =>
  `≈ ${new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 0 }).format(Math.round((dkk * rate) / 10) * 10)} Kč`
