import { NavLink } from 'react-router-dom'
import { CalendarDays, Info, Map, Navigation, Wallet } from 'lucide-react'
import { useT } from '@/i18n/useT'

export function BottomNav() {
  const { t } = useT()
  const items = [
    { to: '/', label: t('navGuide'), icon: Map, end: true },
    { to: '/plan', label: t('navPlan'), icon: CalendarDays, end: false },
    { to: '/today', label: t('navToday'), icon: Navigation, end: false },
    { to: '/costs', label: t('navCosts'), icon: Wallet, end: false },
    { to: '/info', label: t('navInfo'), icon: Info, end: false },
  ]
  return (
    <nav className="fixed inset-x-0 print:hidden bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-xl">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-sm no-underline ${
                isActive ? 'text-accent' : 'text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <Icon size={24} aria-hidden />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
