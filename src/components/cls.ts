export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export const inputCls =
  'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100'
