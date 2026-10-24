import { type ReactNode, useEffect } from 'react'

/**
 * Place detail container: a bottom sheet over the map on phones (above the tab bar, scrolls on
 * its own), a floating panel on wide screens. Escape or a tap on the dimmed map closes it.
 */
export function PlaceSheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-x-0 top-[12dvh] bottom-0 z-50 flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl md:inset-auto md:top-20 md:bottom-20 md:left-[436px] md:w-[420px] md:rounded-2xl dark:bg-slate-800"
      >
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </>
  )
}
