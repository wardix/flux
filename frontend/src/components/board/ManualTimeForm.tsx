import { useState } from 'react'
import { api } from '../../lib/api'

interface ManualTimeFormProps {
  cardId: number
  onLogAdded: () => void
}

export function ManualTimeForm({ cardId, onLogAdded }: ManualTimeFormProps) {
  const [startedAt, setStartedAt] = useState(() => {
    const now = new Date()
    // format to YYYY-MM-DDTHH:mm
    return now.toISOString().slice(0, 16)
  })
  const [inputMethod, setInputMethod] = useState<'duration' | 'endTime'>('duration')
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [endedAt, setEndedAt] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const body: any = {
        started_at: new Date(startedAt).toISOString(),
        description: description.trim() || undefined,
      }

      if (inputMethod === 'duration') {
        const durationSeconds = (hours * 3600) + (minutes * 60)
        if (durationSeconds <= 0) {
          alert('Duration must be greater than 0.')
          setIsSubmitting(false)
          return
        }
        body.duration_seconds = durationSeconds
      } else {
        if (!endedAt) {
          alert('Please select an end time.')
          setIsSubmitting(false)
          return
        }
        const start = new Date(startedAt).getTime()
        const end = new Date(endedAt).getTime()
        if (end <= start) {
          alert('End time must be after start time.')
          setIsSubmitting(false)
          return
        }
        body.ended_at = new Date(endedAt).toISOString()
      }

      await api.post(`/cards/${cardId}/time-logs`, body)
      setHours(0)
      setMinutes(0)
      setEndedAt('')
      setDescription('')
      onLogAdded()
    } catch (err: any) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to add manual time log.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card bg-base-200/50 p-4 border border-base-200 rounded-xl space-y-3">
      <span className="text-xs font-bold uppercase tracking-wider text-base-content/50">Log Time Manually</span>

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-base-content/60">Started At</label>
        <input
          type="datetime-local"
          value={startedAt}
          onChange={(e) => setStartedAt(e.target.value)}
          className="input input-sm input-bordered w-full focus:outline-none"
          required
        />
      </div>

      <div className="flex justify-center border-b border-base-300 pb-2 gap-4">
        <label className="label cursor-pointer flex gap-1 text-xs">
          <input
            type="radio"
            name="inputMethod"
            checked={inputMethod === 'duration'}
            onChange={() => setInputMethod('duration')}
            className="radio radio-xs radio-primary"
          />
          <span>Duration</span>
        </label>
        <label className="label cursor-pointer flex gap-1 text-xs">
          <input
            type="radio"
            name="inputMethod"
            checked={inputMethod === 'endTime'}
            onChange={() => setInputMethod('endTime')}
            className="radio radio-xs radio-primary"
          />
          <span>End Time</span>
        </label>
      </div>

      {inputMethod === 'duration' ? (
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-base-content/60">Hours</label>
            <input
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="input input-sm input-bordered w-full focus:outline-none"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-base-content/60">Minutes</label>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
              className="input input-sm input-bordered w-full focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-base-content/60">Ended At</label>
          <input
            type="datetime-local"
            value={endedAt}
            onChange={(e) => setEndedAt(e.target.value)}
            className="input input-sm input-bordered w-full focus:outline-none"
            required
          />
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[10px] font-bold text-base-content/60">Description (Optional)</label>
        <input
          type="text"
          placeholder="What did you do?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input input-sm input-bordered w-full focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary btn-sm text-white w-full font-bold"
      >
        {isSubmitting ? 'Logging...' : 'Submit Log'}
      </button>
    </form>
  )
}
