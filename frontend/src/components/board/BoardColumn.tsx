import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useState } from 'react'
import type { List } from '../../lib/types'
import { useBoardStore } from '../../stores/boardStore'
import { useSearchStore } from '../../stores/searchStore'
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

  const isMultiSelectMode = useBoardStore((s) => s.isMultiSelectMode)
  const selectedCardIds = useBoardStore((s) => s.selectedCardIds)
  const selectCard = useBoardStore((s) => s.selectCard)
  const deselectCard = useBoardStore((s) => s.deselectCard)
  const selectRange = useBoardStore((s) => s.selectRange)

  const handleSelect = (cardId: number, isShiftClick: boolean) => {
    if (isShiftClick && selectedCardIds.length > 0) {
      const lastSelectedId = selectedCardIds[selectedCardIds.length - 1]
      selectRange(lastSelectedId, cardId)
    } else {
      if (selectedCardIds.includes(cardId)) {
        deselectCard(cardId)
      } else {
        selectCard(cardId)
      }
    }
  }

  const { activeFilters } = useSearchStore()

  const filteredCards = (list.cards || []).filter((card) => {
    // 1. Assignee Filter
    if (activeFilters.assigneeIds.length > 0) {
      if (!card.assignee_id || !activeFilters.assigneeIds.includes(card.assignee_id)) {
        return false
      }
    }

    // 2. Labels Filter
    if (activeFilters.labelIds.length > 0) {
      const cardLabelIds = card.labels?.map((l) => l.id) || []
      const hasMatchingLabel = cardLabelIds.some((id) => activeFilters.labelIds.includes(id))
      if (!hasMatchingLabel) {
        return false
      }
    }

    // 3. Due Date Filter
    if (activeFilters.dueStatus !== 'all') {
      if (activeFilters.dueStatus === 'no_date') {
        if (card.due_date) return false
      } else {
        if (!card.due_date) return false
        const d = new Date(card.due_date)
        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        if (activeFilters.dueStatus === 'overdue') {
          if (card.is_completed || d >= startOfToday) {
            return false
          }
        } else if (activeFilters.dueStatus === 'due_today') {
          const isToday =
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth() &&
            d.getDate() === now.getDate()
          if (!isToday) return false
        } else if (activeFilters.dueStatus === 'due_week') {
          const sevenDaysFromNow = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)
          const isThisWeek = d >= startOfToday && d <= sevenDaysFromNow
          if (!isThisWeek) return false
        }
      }
    }

    return true
  })

  const totalStoryPoints = filteredCards.reduce((sum, card) => sum + (card.story_points || 0), 0) || 0
  const userRole = useBoardStore((s) => s.userRole)
  const isObserver = userRole === 'observer'

  return (
    <div className="flex flex-col bg-base-200/60 border border-base-200 w-80 rounded-2xl p-4 max-h-[80vh] shadow-sm" data-list-id={list.id}>
      <div className="flex items-center justify-between pb-3 border-b border-base-300">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-base-content/90 text-sm tracking-wide">
            {list.title} ({filteredCards.length})
            {totalStoryPoints > 0 && ` • ${totalStoryPoints} pts`}
          </h3>
        </div>
        {!isObserver && (
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
        )}
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto py-3 space-y-3 scrollbar-thin" role="listbox" aria-label={`Cards in ${list.title}`}>
        <SortableContext
          items={filteredCards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {filteredCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              isSelected={selectedCardIds.includes(card.id)}
              isMultiSelectMode={isMultiSelectMode}
              onSelect={handleSelect}
            />
          ))}
        </SortableContext>
      </div>

      <div className="pt-2">
        {isAdding && !isObserver ? (
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
          !isObserver && (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              data-list-add-card={list.id}
              className="btn btn-ghost btn-sm btn-block text-primary/80 hover:text-primary hover:bg-primary/10 border border-dashed border-primary/20 hover:border-primary/40 rounded-xl"
            >
              + Add Card
            </button>
          )
        )}
      </div>
    </div>
  )
}
