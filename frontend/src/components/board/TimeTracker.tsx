import { useEffect, useState } from 'react'
import { useBoardStore } from '../../stores/boardStore'

interface TimeTrackerProps {
  cardId: number
  onLogAdded: () => void
}

export function TimeTracker({ cardId, onLogAdded }: TimeTrackerProps) {
  const { activeTimer, startTimer, stopTimer } = useBoardStore()
  const [description, setDescription] = useState('')
  const [elapsed, setElapsed] = useState(0)

  const isCurrentRunning = activeTimer?.card_id === cardId && activeTimer?.is_running

  useEffect(() => {
    if (isCurrentRunning && activeTimer) {
      setElapsed(activeTimer.elapsed_seconds || 0)
      const interval = setInterval(() => {
        setElapsed((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isCurrentRunning, activeTimer])

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

  const handleStart = async () => {
    try {
      await startTimer(cardId, description.trim() || undefined)
      setDescription('')
      onLogAdded()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to start timer.')
    }
  }

  const handleStop = async () => {
    try {
      await stopTimer(cardId)
      onLogAdded()
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to stop timer.')
    }
  }

  return (
    <div className="card bg-base-200/50 p-4 border border-base-200 rounded-xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-base-content/50">Stopwatch Tracker</span>
        {isCurrentRunning && (
          <span className="badge badge-success text-[10px] text-white font-extrabold uppercase tracking-wide animate-pulse">Running</span>
        )}
      </div>

      <div className="flex flex-col items-center justify-center py-4 bg-base-100 rounded-xl border border-base-200">
        <span className="font-mono text-3xl font-extrabold tracking-widest tabular-nums text-primary">
          {formatElapsed(isCurrentRunning ? elapsed : 0)}
        </span>
      </div>

      <div className="flex gap-2">
        {isCurrentRunning ? (
          <button type="button" onClick={handleStop} className="btn btn-error btn-sm text-white flex-1 font-bold">
            ⏹ Stop Timer
          </button>
        ) : (
          <div className="flex flex-col gap-2 w-full">
            <input
              type="text"
              placeholder="What are you working on?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input input-sm input-bordered focus:outline-none w-full"
              disabled={!!activeTimer}
            />
            <button
              type="button"
              onClick={handleStart}
              className="btn btn-primary btn-sm text-white font-bold w-full"
              disabled={!!activeTimer}
            >
              ▶ Start Timer
            </button>
            {activeTimer && (
              <span className="text-[10px] text-center text-error font-medium">
                You already have a running timer on card #{activeTimer.card_id}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
