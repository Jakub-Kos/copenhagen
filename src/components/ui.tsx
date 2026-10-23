import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from './cls'

export function Chip({
  active,
  children,
  className,
  ...rest
}: { active?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cx(
        'rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors',
        active
          ? 'border-accent bg-accent text-white'
          : 'border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}

export function Button({
  variant = 'secondary',
  className,
  ...rest
}: { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors disabled:opacity-50',
        variant === 'primary' && 'bg-accent text-white hover:bg-accent-strong',
        variant === 'secondary' &&
          'border border-slate-300 bg-white text-slate-800 hover:border-accent dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100',
        variant === 'danger' && 'border border-red-300 bg-white text-red-700 dark:border-red-800 dark:bg-slate-800 dark:text-red-300',
        variant === 'ghost' && 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700',
        className,
      )}
      {...rest}
    />
  )
}

export function Stars({ n }: { n: number }) {
  return (
    <span className="text-mustsee tracking-tighter" aria-label={`${n}/5`}>
      {'★'.repeat(n)}
      <span className="text-slate-300 dark:text-slate-600">{'★'.repeat(5 - n)}</span>
    </span>
  )
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800', className)}>
      {children}
    </div>
  )
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      {children}
    </label>
  )
}
