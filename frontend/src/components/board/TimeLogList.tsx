import { format } from 'date-fns'
import { api } from '../../lib/api'
import type { TimeLog, UserTimeSummary } from '../../lib/types'

interface TimeLogListProps {
  logs: (TimeLog & { email: string })[]
  meta: {
    total_duration_seconds: number
    total_logs: number
    by_user: UserTimeSummary[]
  }
  currentUserId: number | null
  onLogDeleted: () => void
}

export function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.round((seconds % 3600) / 60)

  const parts: string[] = []
  if (hrs > 0) parts.push(`${hrs}h`)
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`)
  return parts.join(' ')
}

export function TimeLogList({ logs, meta, currentUserId, onLogDeleted }: TimeLogListProps) {
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this time log?')) return
    try {
      await api.delete('/time-logs/' + id)
      onLogDeleted()
    } catch (err) {
      console.error(err)
      alert('Failed to delete time log.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Summary Section */}
      <div className="bg-base-200/50 p-4 rounded-xl border border-base-200 grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wide text-base-content/50">
            Total Time
          </span>
          <span className="text-xl font-extrabold text-primary">
            {formatDuration(meta.total_duration_seconds)}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-wide text-base-content/50">
            Total Logs
          </span>
          <span className="text-xl font-extrabold text-primary">{meta.total_logs}</span>
        </div>
      </div>

      {/* User Breakdown */}
      {meta.by_user.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wide text-base-content/50">
            Breakdown by User
          </span>
          <div className="space-y-1">
            {meta.by_user.map((user) => (
              <div
                key={user.user_id}
                className="flex justify-between items-center text-xs bg-base-100 p-2 rounded-lg border border-base-200 shadow-sm"
              >
                <span className="truncate max-w-[180px] font-medium text-base-content/75">
                  {user.email}
                </span>
                <span className="font-extrabold text-primary">
                  {formatDuration(user.duration_seconds)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logs list */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-wide text-base-content/50">
          History Logs
        </span>
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {logs.map((log) => {
            const isOwner = log.user_id === currentUserId
            return (
              <div
                key={log.id}
                className="bg-base-100 p-3 rounded-lg border border-base-200 shadow-sm flex justify-between items-start gap-2 group"
              >
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold truncate max-w-[120px]" title={log.email}>
                      {log.email}
                    </span>
                    <span className="text-[10px] text-base-content/40">
                      {format(new Date(log.started_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  {log.description && (
                    <p className="text-xs text-base-content/70 italic break-words">
                      {log.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-primary whitespace-nowrap">
                    {formatDuration(log.duration_seconds || 0)}
                  </span>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDelete(log.id)}
                      className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                      title="Delete log"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {logs.length === 0 && (
            <div className="text-center text-xs text-base-content/40 py-6">No time tracked yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
