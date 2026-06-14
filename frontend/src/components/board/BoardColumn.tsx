import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import type { List } from '../../lib/types'
import { useBoardStore } from '../../stores/boardStore'
import { CardItem } from './CardItem'

interface BoardColumnProps {
  list: List
}

export function BoardColumn({ list }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: `list-${list.id}`,
  })

  const [newCardTitle, setNewCardTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const createCard = useBoardStore((s) => s.createCard)
  const deleteList = useBoardStore((s) => s.deleteList)
  const archiveList = useBoardStore((s) => s.archiveList)

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCardTitle.trim()) return
    await createCard(list.id, newCardTitle.trim())
    setNewCardTitle('')
    setIsAdding(false)
  }

  return (
    <div className="flex flex-col bg-base-200/60 border border-base-200 w-80 rounded-2xl p-4 max-h-[80vh] shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-base-300">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base-content/90 text-sm tracking-wide">{list.title}</h3>
          <span className="badge badge-sm bg-base-300 border-none font-bold text-[10px]">
            {list.cards?.length || 0}
          </span>
        </div>
        <div className="dropdown dropdown-end">
          <button
            type="button"
            tabIndex={0}
            className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content/85"
            title="Column Options"
          >
            ⋮
          </button>
          <ul className="dropdown-content menu p-2 shadow-lg bg-base-200 rounded-box w-40 z-[2] border border-base-300 gap-1 mt-1">
            <li>
              <button
                type="button"
                onClick={() => archiveList(list.id)}
                className="text-warning text-xs font-semibold py-1.5"
              >
                📦 Archive List
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => deleteList(list.id)}
                className="text-error text-xs font-semibold py-1.5"
              >
                🗑️ Delete List
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto py-3 space-y-3 scrollbar-thin">
        <SortableContext
          items={list.cards?.map((c) => c.id) || []}
          strategy={verticalListSortingStrategy}
        >
          {list.cards?.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </SortableContext>
      </div>

      <div className="pt-2">
        {isAdding ? (
          <form onSubmit={handleCreateCard} className="space-y-2">
            <input
              type="text"
              placeholder="Enter card title..."
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              className="input input-sm input-bordered input-primary w-full focus:outline-none"
            />
            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-xs flex-1">
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false)
                  setNewCardTitle('')
                }}
                className="btn btn-ghost btn-xs flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="btn btn-ghost btn-sm btn-block text-primary/80 hover:text-primary hover:bg-primary/10 border border-dashed border-primary/20 hover:border-primary/40 rounded-xl"
          >
            + Add Card
          </button>
        )}
      </div>
    </div>
  )
}
