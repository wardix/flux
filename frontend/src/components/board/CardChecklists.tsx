import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

import { Checklist, ChecklistItem } from '../../lib/types'
import { ChecklistItemRow } from './ChecklistItemRow'

interface CardChecklistsProps {
  cardId: number
  onProgressChange: () => void
  disabled?: boolean
  boardMembers: Array<{ id: number; name: string; avatar_url: string | null }>
}

export function CardChecklists({
  cardId,
  onProgressChange,
  disabled = false,
  boardMembers,
}: CardChecklistsProps) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [newChecklistTitle, setNewChecklistTitle] = useState('')
  const [newItemTitles, setNewItemTitles] = useState<{ [key: number]: string }>({})
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null)
  const [editingChecklistTitle, setEditingChecklistTitle] = useState('')

  const fetchChecklists = async () => {
    try {
      const res = await api.get<Checklist[]>(`/cards/${cardId}/checklists`)
      setChecklists(res)
    } catch (err) {
      console.error('Failed to fetch checklists:', err)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchChecklists is not memoized
  useEffect(() => {
    fetchChecklists()
  }, [cardId])

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newChecklistTitle.trim()) return

    try {
      await api.post(`/cards/${cardId}/checklists`, { title: newChecklistTitle.trim() })
      setNewChecklistTitle('')
      await fetchChecklists()
      onProgressChange()
    } catch (err) {
      console.error('Failed to add checklist:', err)
    }
  }

  const handleDeleteChecklist = async (checklistId: number) => {
    try {
      await api.delete(`/cards/${cardId}/checklists/${checklistId}`)
      await fetchChecklists()
      onProgressChange()
    } catch (err) {
      console.error('Failed to delete checklist:', err)
    }
  }

  const handleRenameChecklist = async (checklistId: number) => {
    if (!editingChecklistTitle.trim()) return
    try {
      await api.put(`/cards/${cardId}/checklists/${checklistId}`, {
        title: editingChecklistTitle.trim(),
      })
      setEditingChecklistId(null)
      await fetchChecklists()
    } catch (err) {
      console.error('Failed to rename checklist:', err)
    }
  }

  const handleAddItem = async (checklistId: number) => {
    const title = newItemTitles[checklistId]
    if (!title || !title.trim()) return

    try {
      await api.post(`/checklists/${checklistId}/items`, { title: title.trim() })
      setNewItemTitles({ ...newItemTitles, [checklistId]: '' })
      await fetchChecklists()
      onProgressChange()
    } catch (err) {
      console.error('Failed to add item:', err)
    }
  }

  const handleToggleItem = async (checklistId: number, itemId: number, isCompleted: boolean) => {
    try {
      await api.put(`/checklists/${checklistId}/items/${itemId}`, {
        is_completed: isCompleted,
      })
      await fetchChecklists()
      onProgressChange()
    } catch (err) {
      console.error('Failed to toggle item:', err)
    }
  }

  const handleUpdateItem = async (checklistId: number, itemId: number, data: Partial<ChecklistItem>) => {
    try {
      await api.put(`/checklists/${checklistId}/items/${itemId}`, data)
      await fetchChecklists()
      onProgressChange()
    } catch (err) {
      console.error('Failed to update item:', err)
    }
  }

  const handleDeleteItem = async (checklistId: number, itemId: number) => {
    try {
      await api.delete(`/checklists/${checklistId}/items/${itemId}`)
      await fetchChecklists()
      onProgressChange()
    } catch (err) {
      console.error('Failed to delete item:', err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Existing Checklists */}
      {checklists.map((checklist) => {
        const totalItems = checklist.items.length
        const completedItems = checklist.items.filter((item) => item.is_completed).length
        const percentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0

        return (
          <div
            key={checklist.id}
            className="border border-base-200 bg-base-50 rounded-xl p-4 space-y-3 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex justify-between items-center">
              {editingChecklistId === checklist.id ? (
                <div className="flex gap-2 w-full max-w-sm">
                  <input
                    type="text"
                    value={editingChecklistTitle}
                    onChange={(e) => setEditingChecklistTitle(e.target.value)}
                    className="input input-bordered input-sm flex-1 focus:outline-none focus:input-primary"
                  />
                  <button
                    type="button"
                    onClick={() => handleRenameChecklist(checklist.id)}
                    className="btn btn-primary btn-sm"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingChecklistId(null)}
                    className="btn btn-ghost btn-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-base-content/85">📋 {checklist.title}</h4>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingChecklistId(checklist.id)
                        setEditingChecklistTitle(checklist.title)
                      }}
                      className="btn btn-ghost btn-xs text-base-content/40 hover:text-primary"
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}

              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleDeleteChecklist(checklist.id)}
                  className="btn btn-ghost btn-xs text-error hover:bg-error/15 rounded-md"
                >
                  Delete
                </button>
              )}
            </div>

            {/* Progress bar */}
            {totalItems > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-base-content/50">
                  <span>Progress</span>
                  <span>{percentage}%</span>
                </div>
                <progress
                  className="progress progress-success w-full h-2 transition-all duration-300"
                  value={completedItems}
                  max={totalItems}
                />
              </div>
            )}

            {/* Checklist items list */}
            <div className="space-y-1">
              {checklist.items.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  onToggle={(itemId, isCompleted) => handleToggleItem(checklist.id, itemId, isCompleted)}
                  onUpdate={(itemId, data) => handleUpdateItem(checklist.id, itemId, data)}
                  onDelete={(itemId) => handleDeleteItem(checklist.id, itemId)}
                  boardMembers={boardMembers}
                  disabled={disabled}
                />
              ))}
            </div>

            {/* Add new item */}
            {!disabled && (
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add item..."
                  value={newItemTitles[checklist.id] || ''}
                  onChange={(e) =>
                    setNewItemTitles({ ...newItemTitles, [checklist.id]: e.target.value })
                  }
                  onKeyDown={(e) => e.key === 'Enter' && handleAddItem(checklist.id)}
                  className="input input-bordered input-sm flex-1 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleAddItem(checklist.id)}
                  className="btn btn-success btn-outline btn-sm"
                >
                  Add
                </button>
              </div>
            )}
          </div>
        )
      })}

      {/* Add New Checklist Form */}
      {!disabled && (
        <form
          onSubmit={handleAddChecklist}
          className="flex gap-2 bg-base-100 p-2 border border-dashed border-base-300 rounded-xl"
        >
          <input
            type="text"
            placeholder="New Checklist title..."
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            className="input input-bordered input-sm flex-1 focus:outline-none"
          />
          <button type="submit" className="btn btn-primary btn-sm">
            ➕ Add Checklist
          </button>
        </form>
      )}
    </div>
  )
}
