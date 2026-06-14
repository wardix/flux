import type React from 'react'

interface SyncStatusProps {
  pendingCount: number
  isSyncing: boolean
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ pendingCount, isSyncing }) => {
  if (pendingCount === 0 && !isSyncing) return null

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-warning/15 border border-warning/30 rounded-full text-warning text-[10px] font-bold tracking-wide">
      {isSyncing ? (
        <>
          <span className="loading loading-spinner loading-[10px]" />
          <span>Syncing...</span>
        </>
      ) : (
        <>
          <span className="w-1.5 h-1.5 bg-warning rounded-full animate-ping" />
          <span>{pendingCount} Pending</span>
        </>
      )}
    </div>
  )
}
export default SyncStatus
