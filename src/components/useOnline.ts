import { useSyncExternalStore } from 'react'

function subscribe(cb: () => void) {
  window.addEventListener('online', cb)
  window.addEventListener('offline', cb)
  return () => {
    window.removeEventListener('online', cb)
    window.removeEventListener('offline', cb)
  }
}

/** `navigator.onLine`: false means surely offline; true may still be a weak signal. */
export const useOnline = (): boolean => useSyncExternalStore(subscribe, () => navigator.onLine)
