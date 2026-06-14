import type React from 'react'
import { useState } from 'react'
import type { Goal, GoalWithKeyResults } from '../../lib/types'
import { GoalTreeItem } from './GoalTreeItem'

interface GoalTreeProps {
  objectives: GoalWithKeyResults[]
  onSelectGoal: (goal: Goal) => void
}

export const GoalTree: React.FC<GoalTreeProps> = ({ objectives, onSelectGoal }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({})

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  if (objectives.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-base-300 rounded-2xl bg-base-50/20">
        <span className="text-4xl block mb-3">🎯</span>
        <h3 className="font-semibold text-base-content/80 text-sm">
          Belum ada Sasaran (Objectives)
        </h3>
        <p className="text-xs text-base-content/40 mt-1">
          Buat objective baru untuk mulai merencanakan dan memantau target strategis Anda.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {objectives.map((obj) => {
        const isExpanded = !!expanded[obj.id]
        const hasKeyResults = obj.key_results && obj.key_results.length > 0

        return (
          <div key={obj.id} className="space-y-2">
            <GoalTreeItem
              goal={obj}
              depth={0}
              isExpanded={isExpanded}
              onToggle={hasKeyResults ? () => toggleExpand(obj.id) : undefined}
              onSelect={onSelectGoal}
            />

            {isExpanded && hasKeyResults && (
              <div className="space-y-2 relative before:absolute before:left-3 before:top-0 before:bottom-3 before:w-0.5 before:bg-base-200/80 before:rounded">
                {obj.key_results.map((kr) => (
                  <GoalTreeItem key={kr.id} goal={kr} depth={1} onSelect={onSelectGoal} />
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
