import type React from 'react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus()

  if (isOnline) return null

  return (
    <div className="w-full bg-error text-error-content px-4 py-2 text-center text-xs font-bold shadow-md z-50 flex items-center justify-center gap-2 animate-pulse">
      <span>⚠️ You are offline. Changes will be synced when you reconnect.</span>
    </div>
  )
}
export default OfflineIndicator
