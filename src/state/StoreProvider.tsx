import { type ReactNode, useEffect, useReducer } from 'react'
import { StoreContext, initialState, reducer } from './store'
import { save } from './storage'

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState)

  useEffect(() => save('settings', state.settings), [state.settings])
  useEffect(() => save('trips', state.trips), [state.trips])
  useEffect(() => save('activeTrip', state.activeTripId), [state.activeTripId])

  useEffect(() => {
    document.documentElement.lang = state.settings.lang
    document.documentElement.classList.toggle('large-text', state.settings.largeText)
  }, [state.settings])

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>
}
