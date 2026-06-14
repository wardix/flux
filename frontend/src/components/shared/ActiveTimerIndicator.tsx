import { useEffect, useState } from 'react'
import { useBoardStore } from '../../stores/boardStore'

export function ActiveTimerIndicator() {
  const { activeTimer, stopTimer } = useBoardStore()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (activeTimer?.is_running) {
      setElapsed(activeTimer.elapsed_seconds || 0)
      const interval = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [activeTimer])

  if (!activeTimer || !activeTimer.is_running) return null

  const formatElapsed = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0'),
    ].join(':')
  }

  return (
    <div className="flex items-center gap-2 bg-success/10 border border-success/30 px-3 py-1 rounded-full text-success shadow-sm">
      <span className="w-1.5 h-1.5 bg-success rounded-full animate-ping" />
      <span className="text-[10px] font-bold tracking-wider font-mono tabular-nums">
        ⏱ {formatElapsed(elapsed)}
      </span>
      {activeTimer.description && (
        <span className="text-[9px] opacity-75 max-w-[80px] truncate hidden md:inline font-medium">
          ({activeTimer.description})
        </span>
      )}
      <button
        type="button"
        onClick={async () => {
          try {
            await stopTimer(activeTimer.card_id)
          } catch (err) {
            console.error(err)
          }
        }}
        className="btn btn-circle btn-ghost btn-xs text-error hover:bg-error/20 font-bold ml-1 h-4 w-4 min-h-0"
        title="Stop tracking"
      >
        ✕
      </button>
    </div>
  )
}
