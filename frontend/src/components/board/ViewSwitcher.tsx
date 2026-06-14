import React from 'react'
import type { BoardViewType } from '../../lib/types'

interface ViewSwitcherProps {
  activeView: BoardViewType
  onViewChange: (view: BoardViewType) => void
}

export function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) {
  const views: { id: BoardViewType; label: string }[] = [
    { id: 'kanban', label: 'Kanban' },
    { id: 'table', label: 'Table' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'timeline', label: 'Timeline' },
  ]

  return (
    <div className="tabs tabs-boxed bg-base-200">
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          className={`tab gap-2 ${activeView === view.id ? 'tab-active' : ''}`}
          onClick={() => onViewChange(view.id)}
        >
          <span className="hidden sm:inline">{view.label}</span>
        </button>
      ))}
    </div>
  )
}
