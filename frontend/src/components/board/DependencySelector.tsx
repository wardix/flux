import { useState, useMemo } from 'react'
import { api } from '../../lib/api'
import { useBoardStore } from '../../stores/boardStore'
import { DependencyWithCard } from '../../lib/types'
import { Lock, Search, Trash2 } from 'lucide-react'

interface DependencySelectorProps {
  cardId: number
  boardId: number
  dependencies: {
    blocking: DependencyWithCard[]
    blocked_by: DependencyWithCard[]
  }
  onAdd: (blockedCardId: number) => Promise<void>
  onRemove: (depId: number) => Promise<void>
  disabled?: boolean
}

export function DependencySelector({
  cardId,
  dependencies,
  onAdd,
  onRemove,
  disabled,
}: DependencySelectorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [search, setSearch] = useState('')
  const lists = useBoardStore((s) => s.activeBoard?.lists || [])
  
  const allCards = useMemo(() => {
    return lists.flatMap(l => l.cards || [])
  }, [lists])

  const availableCards = useMemo(() => {
    // Cannot block itself
    // Cannot block a card that already blocks it (circular)
    // Cannot block a card it already blocks
    const blockedByIds = dependencies.blocked_by.map(d => d.card.id)
    const blockingIds = dependencies.blocking.map(d => d.card.id)
    
    return allCards.filter(c => 
      c.id !== cardId && 
      !blockedByIds.includes(c.id) && 
      !blockingIds.includes(c.id) &&
      c.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [allCards, cardId, dependencies, search])

  return (
    <div className="space-y-3">
      {/* Blocked By List (Cards that are blocking this card) */}
      {dependencies.blocked_by.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs text-base-content/50 font-bold uppercase block">Blocked By</span>
          <div className="space-y-1">
            {dependencies.blocked_by.map((dep) => (
              <div key={dep.id} className="flex items-center justify-between bg-error/10 text-error-content px-3 py-2 rounded-lg text-sm border border-error/20">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-error" />
                  <span className={dep.card.is_completed ? 'line-through opacity-70' : ''}>
                    {dep.card.title}
                  </span>
                </div>
                {!disabled && (
                  <button
                    onClick={() => onRemove(dep.id)}
                    className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/20"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocking List (Cards this card is blocking) */}
      {dependencies.blocking.length > 0 && (
        <div className="space-y-2 mt-4">
          <span className="text-xs text-base-content/50 font-bold uppercase block">Blocking</span>
          <div className="space-y-1">
            {dependencies.blocking.map((dep) => (
              <div key={dep.id} className="flex items-center justify-between bg-base-200 px-3 py-2 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <span className={dep.card.is_completed ? 'line-through opacity-50' : ''}>
                    {dep.card.title}
                  </span>
                </div>
                {!disabled && (
                  <button
                    onClick={() => onRemove(dep.id)}
                    className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-error hover:bg-error/10"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Dependency Button */}
      {!disabled && !isAdding && (
        <button
          onClick={() => setIsAdding(true)}
          className="btn btn-ghost btn-sm w-full border border-dashed border-base-300 text-base-content/70 mt-2"
        >
          + Add Dependency
        </button>
      )}

      {/* Add Dependency Selector */}
      {isAdding && (
        <div className="bg-base-100 border border-base-300 rounded-lg p-2 shadow-sm mt-2">
          <div className="relative">
            <Search size={14} className="absolute left-2 top-2.5 text-base-content/50" />
            <input
              type="text"
              placeholder="Search cards to block..."
              className="input input-sm input-bordered w-full pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
            {availableCards.length === 0 ? (
              <div className="text-xs text-center text-base-content/50 py-2">No cards found</div>
            ) : (
              availableCards.map(c => (
                <button
                  key={c.id}
                  onClick={async () => {
                    await onAdd(c.id)
                    setIsAdding(false)
                    setSearch('')
                  }}
                  className="w-full text-left px-2 py-1.5 text-sm hover:bg-base-200 rounded text-base-content/80 truncate"
                >
                  {c.title}
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => setIsAdding(false)}
            className="btn btn-ghost btn-xs w-full mt-2"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
