import { useBoardStore } from '../../stores/boardStore'

export type BatchAction = 'move' | 'assign' | 'add_label' | 'remove_label' | 'set_due_date' | 'archive' | 'delete'

export interface FloatingActionBarProps {
  selectedCount: number
  selectedCardIds: number[]
  onAction: (action: BatchAction, params?: Record<string, any>) => void
  onClearSelection: () => void
}

export function FloatingActionBar({
  selectedCount,
  onAction,
  onClearSelection,
}: FloatingActionBarProps) {
  const activeBoard = useBoardStore((s) => s.activeBoard)
  const labels = useBoardStore((s) => s.labels)
  const boardMembers = useBoardStore((s) => s.boardMembers)
  const lists = activeBoard?.lists || []

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="flex items-center gap-3 bg-base-300 shadow-2xl rounded-2xl px-5 py-3 border border-base-200 text-sm">
        <div className="flex items-center gap-2 pr-3 border-r border-base-content/10">
          <span className="badge badge-primary badge-sm text-white font-bold">{selectedCount}</span>
          <span className="font-semibold text-base-content/80">Selected</span>
        </div>

        {/* Move Action */}
        <div className="dropdown dropdown-top">
          <button id="batch-action-move" tabIndex={0} type="button" className="btn btn-sm btn-ghost gap-1 font-medium text-xs">
            📁 Move
          </button>
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-52 z-30 mb-2 border border-base-300 max-h-[300px] overflow-y-auto">
            <li className="menu-title text-[10px] font-bold uppercase tracking-wider">Move to List</li>
            {lists.map((list) => (
              <li key={list.id}>
                <button type="button" onClick={() => onAction('move', { list_id: list.id })} className="text-xs">
                  {list.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Assign Action */}
        <div className="dropdown dropdown-top">
          <button tabIndex={0} type="button" className="btn btn-sm btn-ghost gap-1 font-medium text-xs">
            👤 Assign
          </button>
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-52 z-30 mb-2 border border-base-300 max-h-[300px] overflow-y-auto">
            <li className="menu-title text-[10px] font-bold uppercase tracking-wider">Assign to Member</li>
            {boardMembers.map((member) => (
              <li key={member.user_id}>
                <button type="button" onClick={() => onAction('assign', { user_id: member.user_id })} className="text-xs truncate">
                  {member.email}
                </button>
              </li>
            ))}
            <li className="border-t border-base-300 mt-1 pt-1">
              <button type="button" onClick={() => onAction('assign', { user_id: null })} className="text-xs text-error font-semibold">
                🚫 Unassign All
              </button>
            </li>
          </ul>
        </div>

        {/* Label Action */}
        <div className="dropdown dropdown-top">
          <button tabIndex={0} type="button" className="btn btn-sm btn-ghost gap-1 font-medium text-xs">
            🏷️ Label
          </button>
          <ul tabIndex={0} className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-56 z-30 mb-2 border border-base-300 max-h-[350px] overflow-y-auto">
            <li className="menu-title text-[10px] font-bold uppercase tracking-wider">Add Label</li>
            {labels.map((lbl) => (
              <li key={`add-${lbl.id}`}>
                <button type="button" onClick={() => onAction('add_label', { label_id: lbl.id })} className="text-xs flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lbl.color }} />
                  <span className="truncate">{lbl.name}</span>
                </button>
              </li>
            ))}
            <li className="menu-title text-[10px] font-bold uppercase tracking-wider border-t border-base-300 mt-2 pt-2">Remove Label</li>
            {labels.map((lbl) => (
              <li key={`remove-${lbl.id}`}>
                <button type="button" onClick={() => onAction('remove_label', { label_id: lbl.id })} className="text-xs text-error flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lbl.color }} />
                  <span className="truncate">{lbl.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Due Date Action */}
        <div className="dropdown dropdown-top dropdown-end">
          <button tabIndex={0} type="button" className="btn btn-sm btn-ghost gap-1 font-medium text-xs">
            📅 Due Date
          </button>
          <div tabIndex={0} className="dropdown-content p-4 shadow-lg bg-base-200 rounded-box w-64 z-30 mb-2 border border-base-300 flex flex-col gap-2">
            <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide">Set Due Date</span>
            <input 
              type="date" 
              className="input input-sm input-bordered w-full text-xs focus:outline-none"
              onChange={(e) => {
                if (e.target.value) {
                  onAction('set_due_date', { due_date: new Date(e.target.value).toISOString() })
                }
              }}
            />
            <button 
              type="button"
              onClick={() => onAction('set_due_date', { due_date: null })}
              className="btn btn-xs btn-outline btn-error w-full mt-1"
            >
              Clear Due Date
            </button>
          </div>
        </div>

        {/* Archive Action */}
        <button 
          type="button"
          onClick={() => {
            if (confirm(`Are you sure you want to archive ${selectedCount} cards?`)) {
              onAction('archive')
            }
          }}
          className="btn btn-sm btn-ghost gap-1 font-medium text-xs text-warning hover:bg-warning/10"
        >
          📦 Archive
        </button>

        {/* Delete Action */}
        <button 
          type="button"
          onClick={() => {
            if (confirm(`Are you sure you want to delete ${selectedCount} cards? This cannot be undone.`)) {
              onAction('delete')
            }
          }}
          className="btn btn-sm btn-ghost gap-1 font-medium text-xs text-error hover:bg-error/10"
        >
          🗑️ Delete
        </button>

        {/* Clear Selection (✕) */}
        <button 
          type="button"
          onClick={onClearSelection} 
          className="btn btn-xs btn-ghost btn-circle text-base-content/50 hover:text-base-content ml-2"
          title="Clear selection"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
