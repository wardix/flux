import React from 'react'
import { Filter, X } from 'lucide-react'
import { useSearchStore } from '../../stores/searchStore'
import { useBoardStore } from '../../stores/boardStore'

export const FilterPanel: React.FC = () => {
  const { activeFilters, setFilter, clearFilters, isFilterPanelOpen, toggleFilterPanel } = useSearchStore()
  const boardMembers = useBoardStore((s) => s.boardMembers)
  const labels = useBoardStore((s) => s.labels)

  if (!isFilterPanelOpen) return null

  const handleToggleAssignee = (id: number) => {
    const current = activeFilters.assigneeIds
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    setFilter({ assigneeIds: next })
  }

  const handleToggleLabel = (id: number) => {
    const current = activeFilters.labelIds
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    setFilter({ labelIds: next })
  }

  const hasActiveFilters =
    activeFilters.assigneeIds.length > 0 ||
    activeFilters.labelIds.length > 0 ||
    activeFilters.dueStatus !== 'all'

  return (
    <div className="bg-base-100 border border-base-200/50 rounded-xl p-4 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2 z-10 relative">
      <div className="flex items-center justify-between border-b border-base-200 pb-2">
        <div className="flex items-center gap-2 font-bold text-xs uppercase text-base-content/75">
          <Filter className="w-4 h-4 text-primary" /> Filter Cards
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[10px] text-error hover:underline font-semibold"
            >
              Clear All
            </button>
          )}
          <button
            type="button"
            onClick={toggleFilterPanel}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Filter by Assignee */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/40 block">
            Assignees
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {boardMembers.map((member) => {
              const active = activeFilters.assigneeIds.includes(member.user_id)
              return (
                <button
                  key={member.user_id}
                  type="button"
                  onClick={() => handleToggleAssignee(member.user_id)}
                  className={`px-2 py-1 text-[10px] rounded-lg transition-all border ${
                    active
                      ? 'bg-primary text-white border-primary font-bold'
                      : 'bg-base-200 border-base-300 text-base-content/70 hover:bg-base-300'
                  }`}
                >
                  {member.email.split('@')[0]}
                </button>
              )
            })}
            {boardMembers.length === 0 && (
              <span className="text-[10px] text-neutral-400 italic">No board members</span>
            )}
          </div>
        </div>

        {/* Filter by Labels */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/40 block">
            Labels
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {labels.map((l) => {
              const active = activeFilters.labelIds.includes(l.id)
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleToggleLabel(l.id)}
                  style={{
                    backgroundColor: active ? l.color : undefined,
                    borderColor: l.color,
                  }}
                  className={`px-2.5 py-1 text-[10px] rounded-lg border transition-all ${
                    active ? 'text-white font-bold' : 'bg-transparent text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  {l.name}
                </button>
              )
            })}
            {labels.length === 0 && (
              <span className="text-[10px] text-neutral-400 italic">No board labels</span>
            )}
          </div>
        </div>

        {/* Filter by Due Date Status */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-base-content/40 block">
            Due Date Status
          </span>
          <select
            value={activeFilters.dueStatus}
            onChange={(e) => setFilter({ dueStatus: e.target.value as any })}
            className="select select-bordered select-xs w-full focus:outline-none focus:select-primary"
          >
            <option value="all">Show All</option>
            <option value="overdue">Overdue (incomplete)</option>
            <option value="due_today">Due Today</option>
            <option value="due_week">Due this Week</option>
            <option value="no_date">No Date Specified</option>
          </select>
        </div>
      </div>
    </div>
  )
}
export default FilterPanel
