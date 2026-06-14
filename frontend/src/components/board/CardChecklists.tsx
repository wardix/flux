import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface ChecklistItem {
  id: number
  checklist_id: number
  title: string
  is_completed: boolean
  position: number
}

interface Checklist {
  id: number
  card_id: number
  title: string
  position: number
  items: ChecklistItem[]
}

interface CardChecklistsProps {
  cardId: number
  onProgressChange: () => void
}

export function CardChecklists({ cardId, onProgressChange }: CardChecklistsProps) {
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
          <div key={checklist.id} className="border border-base-200 bg-base-50 rounded-xl p-4 space-y-3 shadow-sm transition-all hover:shadow-md">
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
                </div>
              )}

              <button
                type="button"
                onClick={() => handleDeleteChecklist(checklist.id)}
                className="btn btn-ghost btn-xs text-error hover:bg-error/15 rounded-md"
              >
                Delete
              </button>
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
            <div className="space-y-2">
              {checklist.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-base-200/50 transition-colors group"
                >
                  <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.is_completed}
                      onChange={(e) => handleToggleItem(checklist.id, item.id, e.target.checked)}
                      className="checkbox checkbox-success checkbox-sm rounded"
                    />
                    <span
                      className={`text-sm transition-all truncate ${
                        item.is_completed
                          ? 'line-through text-base-content/40'
                          : 'text-base-content/80'
                      }`}
                    >
                      {item.title}
                    </span>
                  </label>
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(checklist.id, item.id)}
                    className="btn btn-ghost btn-xs btn-circle text-error/60 opacity-0 group-hover:opacity-100 hover:bg-error/10 transition-opacity"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Add new item */}
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
          </div>
        )
      })}

      {/* Add New Checklist Form */}
      <form onSubmit={handleAddChecklist} className="flex gap-2 bg-base-100 p-2 border border-dashed border-base-300 rounded-xl">
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
    </div>
  )
}
