import { Lock, AlertTriangle } from 'lucide-react'

interface DependencyBadgeProps {
  blockingCount: number
  blockedByCount: number
  isBlocked: boolean
}

export function DependencyBadge({ blockingCount, blockedByCount, isBlocked }: DependencyBadgeProps) {
  if (!isBlocked && blockingCount === 0) return null

  return (
    <div className="flex gap-1 items-center mt-1">
      {isBlocked && (
        <span className="badge badge-error badge-sm gap-1 font-semibold text-xs py-2 shadow-sm text-white">
          <Lock size={12} className="stroke-[3]" /> Blocked
        </span>
      )}
      {!isBlocked && blockingCount > 0 && (
        <span className="badge badge-warning badge-sm gap-1 font-semibold text-xs py-2 shadow-sm text-yellow-950">
          <AlertTriangle size={12} className="stroke-[3]" /> {blockingCount}
        </span>
      )}
    </div>
  )
}
