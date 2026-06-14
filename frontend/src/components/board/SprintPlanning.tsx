import { useState } from 'react'
import type { Card, Sprint } from '../../lib/types'

interface SprintPlanningProps {
  sprints: Sprint[]
  backlogCards: Card[]
  onAssignSprint: (cardId: number, sprintId: number | null) => Promise<void>
  onCreateSprint: (data: {
    title: string
    goal?: string
    start_date: string
    end_date: string
  }) => Promise<void>
  onDeleteSprint: (sprintId: number) => Promise<void>
  onStartSprint: (sprintId: number) => Promise<void>
  onCompleteSprint: (sprintId: number, moveToSprintId?: number | null) => Promise<void>
  disabled?: boolean
}

export function SprintPlanning({
  sprints,
  backlogCards,
  onAssignSprint,
  onCreateSprint,
  onDeleteSprint,
  onStartSprint,
  onCompleteSprint,
  disabled = false,
}: SprintPlanningProps) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showCompleteModal, setShowCompleteModal] = useState<number | null>(null)
  const [moveIncompleteToSprintId, setMoveIncompleteToSprintId] = useState<number | null>(null)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!title.trim() || !startDate || !endDate) return

    if (new Date(endDate) <= new Date(startDate)) {
      setError('End date must be after start date')
      return
    }

    try {
      await onCreateSprint({
        title: title.trim(),
        goal: goal.trim() || undefined,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
      })
      setTitle('')
      setGoal('')
      setStartDate('')
      setEndDate('')
      setShowCreateForm(false)
    } catch (err: any) {
      setError(err.message || 'Failed to create sprint')
    }
  }

  const activeSprint = sprints.find((s) => s.status === 'active')
  const planningSprints = sprints.filter((s) => s.status === 'planning')

  return (
    <div className="space-y-6 max-h-[85vh] overflow-y-auto px-1">
      {error && (
        <div className="alert alert-error text-xs py-2 rounded">
          <span>{error}</span>
        </div>
      )}

      {/* Header and Toggle Create Form Button */}
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg text-primary uppercase">Sprint Planning Backlog</h3>
        {!disabled && (
          <button
            type="button"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn btn-primary btn-sm text-white"
          >
            {showCreateForm ? 'Cancel' : '+ New Sprint'}
          </button>
        )}
      </div>

      {/* Create Sprint Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="bg-base-200/50 p-4 border border-base-200 rounded-xl space-y-3"
        >
          <span className="text-xs font-bold text-base-content/60 uppercase block">
            Create Sprint
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-xs">Sprint Name</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Sprint 1"
                className="input input-sm input-bordered"
                required
              />
            </div>
            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-xs">Sprint Goal</span>
              </label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Deliver OAuth login features"
                className="input input-sm input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-xs">Start Date</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input input-sm input-bordered"
                required
              />
            </div>
            <div className="form-control">
              <label className="label py-0.5">
                <span className="label-text text-xs">End Date</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input input-sm input-bordered"
                required
              />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-sm w-full text-white mt-1">
            Create Sprint
          </button>
        </form>
      )}

      {/* Complete Sprint Modal/Dialog */}
      {showCompleteModal !== null && (
        <div className="modal modal-open z-50">
          <div className="modal-box bg-base-100 border border-base-200 shadow-2xl relative">
            <h3 className="font-bold text-lg text-primary">Complete Sprint</h3>
            <p className="text-xs text-base-content/60 mt-2">
              You are about to complete this sprint. Choose what to do with incomplete cards:
            </p>
            <div className="form-control mt-4">
              <label className="label py-0.5">
                <span className="label-text text-xs">Move incomplete cards to</span>
              </label>
              <select
                value={moveIncompleteToSprintId ?? ''}
                onChange={(e) =>
                  setMoveIncompleteToSprintId(e.target.value ? Number(e.target.value) : null)
                }
                className="select select-bordered select-sm w-full focus:outline-none"
              >
                <option value="">Backlog (No Sprint)</option>
                {planningSprints.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} (Planning)
                  </option>
                ))}
              </select>
            </div>
            <div className="modal-action flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onCompleteSprint(showCompleteModal, moveIncompleteToSprintId)
                  setShowCompleteModal(null)
                  setMoveIncompleteToSprintId(null)
                }}
                className="btn btn-primary btn-sm text-white"
              >
                Complete Sprint
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCompleteModal(null)
                  setMoveIncompleteToSprintId(null)
                }}
                className="btn btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sprint Planning Divisions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backlog Column */}
        <div className="card bg-base-200/50 p-4 border border-base-200 rounded-2xl h-[70vh] flex flex-col">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-sm text-base-content/70 uppercase tracking-wide">
              Product Backlog ({backlogCards.filter((c) => !c.sprint_id).length})
            </span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {backlogCards
              .filter((card) => !card.sprint_id)
              .map((card) => (
                <div
                  key={card.id}
                  className="bg-base-100 p-2.5 rounded-xl border border-base-200 shadow-sm flex flex-col gap-1.5"
                >
                  <span className="text-xs font-semibold text-base-content/85">{card.title}</span>
                  <div className="flex justify-between items-center">
                    <span className="badge badge-sm badge-outline text-[10px]">
                      SP: {card.story_points ?? 0}
                    </span>
                    {!disabled && sprints.length > 0 && (
                      <select
                        onChange={(e) =>
                          onAssignSprint(card.id, e.target.value ? Number(e.target.value) : null)
                        }
                        value=""
                        className="select select-xs select-bordered w-28 focus:outline-none"
                      >
                        <option value="">Move to Sprint</option>
                        {sprints
                          .filter((s) => s.status !== 'completed')
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            {backlogCards.filter((c) => !c.sprint_id).length === 0 && (
              <div className="text-center py-8 text-xs text-base-content/40 italic">
                Backlog is empty
              </div>
            )}
          </div>
        </div>

        {/* Sprint View Column (Active & Planning) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Sprint Section */}
          <div className="card bg-indigo-50/20 dark:bg-indigo-950/10 p-4 border border-indigo-200/40 rounded-2xl">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="font-bold text-sm text-indigo-500 uppercase tracking-wide block">
                  Active Sprint
                </span>
                {activeSprint ? (
                  <span className="text-xs text-base-content/50 block">
                    {activeSprint.title} — Goal: {activeSprint.goal || 'None'}
                  </span>
                ) : (
                  <span className="text-xs text-base-content/40 italic">No active sprint</span>
                )}
              </div>
              {activeSprint && !disabled && (
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(activeSprint.id)}
                  className="btn btn-xs btn-error text-white"
                >
                  Complete Sprint
                </button>
              )}
            </div>

            {activeSprint && (
              <div className="space-y-2 max-h-[25vh] overflow-y-auto pr-1">
                {backlogCards
                  .filter((c) => c.sprint_id === activeSprint.id)
                  .map((card) => (
                    <div
                      key={card.id}
                      className="bg-base-100 p-2.5 rounded-xl border border-indigo-100/50 shadow-sm flex justify-between items-center"
                    >
                      <div>
                        <span className="text-xs font-semibold text-base-content/85 block">
                          {card.title}
                        </span>
                        <span className="badge badge-sm badge-outline text-[9px] mt-0.5">
                          SP: {card.story_points ?? 0}
                        </span>
                      </div>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => onAssignSprint(card.id, null)}
                          className="btn btn-xs btn-ghost text-base-content/50 hover:text-error"
                        >
                          Send to Backlog
                        </button>
                      )}
                    </div>
                  ))}
                {backlogCards.filter((c) => c.sprint_id === activeSprint.id).length === 0 && (
                  <div className="text-center py-6 text-xs text-base-content/40 italic">
                    No cards in active sprint. Drag/assign cards here.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Planning/Future Sprints */}
          <div className="space-y-4">
            <span className="font-bold text-sm text-base-content/60 uppercase tracking-wide block">
              Future Sprints (Planning)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {planningSprints.map((sprint) => {
                const sprintCards = backlogCards.filter((c) => c.sprint_id === sprint.id)
                const sprintSP = sprintCards.reduce((sum, c) => sum + (c.story_points || 0), 0)

                return (
                  <div
                    key={sprint.id}
                    className="bg-base-100 p-4 border border-base-200 rounded-2xl shadow-sm space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm text-base-content/95 block">
                          {sprint.title}
                        </span>
                        <span className="text-[10px] text-base-content/50 block">
                          {new Date(sprint.start_date).toLocaleDateString()} -{' '}
                          {new Date(sprint.end_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!disabled && !activeSprint && (
                          <button
                            type="button"
                            onClick={() => onStartSprint(sprint.id)}
                            className="btn btn-xs btn-primary text-white"
                          >
                            Start
                          </button>
                        )}
                        {!disabled && (
                          <button
                            type="button"
                            onClick={() => onDeleteSprint(sprint.id)}
                            className="btn btn-xs btn-ghost text-error"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-base-content/60">
                      Goal: {sprint.goal || 'No goal set'}
                    </div>

                    <div className="border-t border-base-100 pt-2 flex justify-between items-center text-[11px] text-base-content/55">
                      <span>Total Cards: {sprintCards.length}</span>
                      <span>Story Points: {sprintSP}</span>
                    </div>

                    {/* Quick list of sprint cards */}
                    <div className="space-y-1.5 max-h-[15vh] overflow-y-auto pr-1">
                      {sprintCards.map((card) => (
                        <div
                          key={card.id}
                          className="bg-base-50 p-2 rounded-lg border border-base-100 flex justify-between items-center text-xs"
                        >
                          <span className="truncate flex-1 pr-2">{card.title}</span>
                          {!disabled && (
                            <button
                              type="button"
                              onClick={() => onAssignSprint(card.id, null)}
                              className="text-[10px] text-error hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {planningSprints.length === 0 && (
                <div className="text-xs text-base-content/40 italic md:col-span-2 text-center py-6">
                  No planned sprints. Click "+ New Sprint" to start planning.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
