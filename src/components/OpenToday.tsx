import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { todayInCph } from '@/logic/time'
import { useActiveTrip } from '@/state/store'

/** On first load of the bare site, jump to Today if the active trip has a plan for today. */
export function OpenToday() {
  const trip = useActiveTrip()
  const location = useLocation()
  const navigate = useNavigate()
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    const bare = location.pathname === '/' && !location.search
    if (bare && trip?.days[todayInCph()]?.stops.length) navigate('/today', { replace: true })
  }, [trip, location, navigate])

  return null
}
