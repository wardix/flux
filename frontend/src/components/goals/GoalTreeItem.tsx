import type React from 'react'
import type { Goal, GoalWithKeyResults } from '../../lib/types'
import { GoalProgressBar } from './GoalProgressBar'

interface GoalTreeItemProps {
  goal: Goal | GoalWithKeyResults
  depth: number // 0 for objective, 1 for key result
  isExpanded?: boolean
  onToggle?: () => void
  onSelect: (goal: Goal) => void
}

export const GoalTreeItem: React.FC<GoalTreeItemProps> = ({
  goal,
  depth,
  isExpanded = false,
  onToggle,
  onSelect,
}) => {
  const isObjective = depth === 0
  const displayProgress = goal.progress || 0

  const handleItemClick = (e: React.MouseEvent) => {
    // If clicking on the expand/collapse button, don't trigger select
    const target = e.target as HTMLElement
    if (target.closest('.toggle-btn')) {
      return
    }
    onSelect(goal)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleItemClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onSelect(goal)
      }}
      className={`border border-base-200/60 rounded-xl p-3 bg-base-100/50 hover:bg-base-200/40 hover:border-primary/20 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none ${
        depth > 0 ? 'ml-6 border-dashed border-l-2' : ''
      }`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {isObjective ? (
          <div className="flex items-center gap-1 mt-0.5">
            {onToggle && (
              <button
                type="button"
                className="toggle-btn btn btn-xs btn-ghost btn-circle p-0"
                onClick={(e) => {
                  e.stopPropagation()
                  onToggle()
                }}
              >
                {isExpanded ? '▼' : '►'}
              </button>
            )}
            <span className="text-xl">🎯</span>
          </div>
        ) : (
          <span className="text-xl mt-0.5">📊</span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-bold truncate text-sm text-base-content/90`}>{goal.title}</h4>
            {isObjective && goal.color && (
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                style={{ backgroundColor: goal.color }}
              />
            )}
            <span className="badge badge-xs uppercase font-bold text-[8px] tracking-wider py-1.5 px-2">
              {goal.status}
            </span>
          </div>
          {goal.description && (
            <p className="text-xs text-base-content/50 line-clamp-1 mt-0.5">{goal.description}</p>
          )}
          {goal.due_date && (
            <span className="text-[10px] text-base-content/40 mt-1 block">
              📅 Tenggat: {new Date(goal.due_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 w-full md:w-48 shrink-0">
        <GoalProgressBar progress={displayProgress} />
        {!isObjective && goal.target_value && (
          <span className="text-[10px] text-base-content/50 font-medium font-mono">
            {goal.current_value} / {goal.target_value} {goal.unit || ''}
          </span>
        )}
      </div>
    </div>
  )
}
