import { useState } from 'react'
import type { CreateSubtaskRequest, SubtaskCard } from '../../lib/types'
import { CardItem } from './CardItem'
import { SubtaskAddForm } from './SubtaskAddForm'
import { SubtaskProgress } from './SubtaskProgress'

interface SubtaskListProps {
  subtasks: SubtaskCard[]
  total: number
  completed: number
  onAdd: (data: CreateSubtaskRequest) => void
  onToggle: (subtaskId: number, isCompleted: boolean) => void
  onDelete: (subtaskId: number) => void
}

export function SubtaskList({
  subtasks,
  total,
  completed,
  onAdd,
  onToggle,
  onDelete,
}: SubtaskListProps) {
  const [isAdding, setIsAdding] = useState(false)

  const handleAddSubmit = (title: string) => {
    onAdd({ title })
    setIsAdding(false)
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs text-base-content/50 font-bold uppercase tracking-wider">
            Sub-tasks
          </span>
          {total > 0 && <SubtaskProgress completed={completed} total={total} />}
        </div>
        {!isAdding && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="btn btn-ghost btn-xs text-primary font-semibold"
          >
            + Add sub-task
          </button>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {subtasks.map((subtask) => {
            const isOverdue =
              subtask.due_date && new Date(subtask.due_date) < new Date() && !subtask.archived_at

            return (
              <div
                key={subtask.id}
                className="flex items-center justify-between p-2 rounded-lg bg-base-200/40 hover:bg-base-200 border border-base-200/50 transition-all text-xs"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={subtask.is_completed}
                    onChange={(e) => onToggle(subtask.id, e.target.checked)}
                    className="checkbox checkbox-xs checkbox-primary"
                  />
                  <CardItem card={subtask} isSubtask={true} />
                </div>

                <div className="flex items-center gap-2 ml-2">
                  {subtask.due_date && (
                    <span
                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${
                        isOverdue
                          ? 'bg-error/10 text-error font-bold'
                          : 'bg-base-300/50 text-base-content/50'
                      }`}
                    >
                      {isOverdue ? '⚠️ ' : '📅 '}
                      {new Date(subtask.due_date).toLocaleDateString()}
                    </span>
                  )}

                  {subtask.story_points !== null && subtask.story_points !== undefined && (
                    <span className="badge badge-xs badge-outline font-semibold text-primary">
                      {subtask.story_points} pts
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onDelete(subtask.id)}
                    className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                    title="Delete subtask"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {isAdding && (
        <SubtaskAddForm onSubmit={handleAddSubmit} onCancel={() => setIsAdding(false)} />
      )}
    </div>
  )
}
