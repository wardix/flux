import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import type { EpicDetail, EpicDetailCard } from '../../lib/types'
import { EpicProgress } from './EpicProgress'

interface EpicDetailProps {
  workspaceId: number
  epicId: number
  onBack: () => void
}

export function EpicDetail({ workspaceId, epicId, onBack }: EpicDetailProps) {
  const [epic, setEpic] = useState<EpicDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editColor, setEditColor] = useState('#6366f1')

  const fetchEpicDetail = async () => {
    setIsLoading(true)
    try {
      const res = await api.get<{ data: EpicDetail }>(`/workspaces/${workspaceId}/epics/${epicId}`)
      setEpic(res.data)
      setEditTitle(res.data.title)
      setEditDescription(res.data.description || '')
      setEditColor(res.data.color)
    } catch (err) {
      console.error('Failed to fetch epic detail:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEpicDetail()
  }, [workspaceId, epicId])

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim()) return

    try {
      await api.put<{ data: any }>(`/workspaces/${workspaceId}/epics/${epicId}`, {
        title: editTitle,
        description: editDescription || null,
        color: editColor,
      })
      setIsEditing(false)
      fetchEpicDetail()
    } catch (err) {
      console.error('Failed to update epic:', err)
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-12"><span className="loading loading-spinner text-primary"></span></div>
  }

  if (!epic) {
    return (
      <div className="text-center py-12">
        <p className="text-error">Epic not found.</p>
        <button onClick={onBack} className="btn btn-ghost btn-sm mt-4">Back to list</button>
      </div>
    )
  }

  // Group cards by board
  const cardsByBoard: { [boardId: number]: { boardTitle: string; cards: EpicDetailCard[] } } = {}
  epic.cards.forEach((card) => {
    if (!cardsByBoard[card.board_id]) {
      cardsByBoard[card.board_id] = {
        boardTitle: card.board_title,
        cards: [],
      }
    }
    cardsByBoard[card.board_id].cards.push(card)
  })

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="btn btn-sm btn-ghost">← Back to Epics</button>
      </div>

      {isEditing ? (
        <form onSubmit={handleUpdate} className="card bg-base-100 border border-base-200 p-4 space-y-4 shadow-sm">
          <h3 className="font-bold text-lg">Edit Epic</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label text-xs font-bold uppercase text-base-content/60">Title</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div>
              <label className="label text-xs font-bold uppercase text-base-content/60">Color</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-base-300"
                />
                <span className="text-xs font-mono">{editColor}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="label text-xs font-bold uppercase text-base-content/60">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="textarea textarea-bordered textarea-sm w-full h-24"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
            <button type="button" onClick={() => setIsEditing(false)} className="btn btn-ghost btn-sm">Cancel</button>
          </div>
        </form>
      ) : (
        <div className="card bg-base-100 border border-base-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: epic.color }}
                />
                <h1 className="text-2xl font-black text-base-content">{epic.title}</h1>
                <span className={`badge ${epic.status === 'done' ? 'badge-success text-white' : 'badge-warning'} badge-sm font-semibold capitalize ml-2`}>
                  {epic.status}
                </span>
              </div>
              {epic.description && (
                <p className="text-sm text-base-content/70 whitespace-pre-line">{epic.description}</p>
              )}
            </div>
            <button onClick={() => setIsEditing(true)} className="btn btn-outline btn-sm btn-primary">✏️ Edit Epic</button>
          </div>

          {epic.progress && (
            <div className="max-w-md border-t border-base-200 pt-3">
              <EpicProgress
                percentage={epic.progress.percentage}
                totalCards={epic.progress.total_cards}
                completedCards={epic.progress.completed_cards}
              />
            </div>
          )}
        </div>
      )}

      {/* Cards grouped by board */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-base-content">Linked Cards</h2>
        {Object.keys(cardsByBoard).length === 0 ? (
          <div className="text-center py-8 bg-base-100 rounded-lg border border-base-200">
            <p className="text-base-content/50">No cards linked to this epic yet. You can assign cards from the board view.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(cardsByBoard).map(([boardId, { boardTitle, cards }]) => (
              <div key={boardId} className="space-y-2">
                <div className="flex items-center gap-2 border-b border-base-200 pb-1">
                  <span className="text-xs text-base-content/50 uppercase font-black tracking-wider">Board</span>
                  <h3 className="font-bold text-sm text-primary">{boardTitle}</h3>
                  <span className="badge badge-ghost badge-sm">{cards.length}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cards.map((card) => (
                    <div
                      key={card.id}
                      className="card bg-base-100 border border-base-200 p-3 shadow-sm hover:shadow transition-shadow flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="text-[10px] text-base-content/50 uppercase font-semibold">{card.list_title}</span>
                          <span className={`badge badge-xs ${card.is_completed ? 'badge-success text-white' : 'badge-ghost'}`}>
                            {card.is_completed ? 'Completed' : 'Active'}
                          </span>
                        </div>
                        <h4 className={`font-semibold text-sm line-clamp-2 ${card.is_completed ? 'line-through text-base-content/40' : 'text-base-content'}`}>
                          {card.title}
                        </h4>
                      </div>

                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-base-100 text-[10px] text-base-content/50">
                        <span>{card.due_date ? `📅 ${new Date(card.due_date).toLocaleDateString()}` : 'No due date'}</span>
                        <div className="flex items-center gap-1">
                          {card.assignees.map((ass) => (
                            <span key={ass.id} className="badge badge-sm badge-outline" title={ass.name}>{ass.name}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
