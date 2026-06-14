import type React from 'react'
import { useEffect, useState } from 'react'
import { api } from '../../lib/api'
import type { Epic, Workspace } from '../../lib/types'
import { EpicProgress } from './EpicProgress'

interface EpicListProps {
  workspace: Workspace
  onSelectEpic: (epicId: number) => void
}

export function EpicList({ workspace, onSelectEpic }: EpicListProps) {
  const [epics, setEpics] = useState<Epic[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newColor, setNewColor] = useState('#6366f1')

  const fetchEpics = async () => {
    setIsLoading(true)
    try {
      const res = await api.get<{ data: Epic[] }>(`/workspaces/${workspace.id}/epics`)
      setEpics(res.data)
    } catch (err) {
      console.error('Failed to fetch epics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEpics()
  }, [workspace.id])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    try {
      await api.post(`/workspaces/${workspace.id}/epics`, {
        title: newTitle,
        description: newDescription || null,
        color: newColor,
      })
      setNewTitle('')
      setNewDescription('')
      setNewColor('#6366f1')
      setShowAddForm(false)
      fetchEpics()
    } catch (err) {
      console.error('Failed to create epic:', err)
    }
  }

  const handleDelete = async (epicId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this Epic? Linked cards will be unassigned.'))
      return

    try {
      await api.delete(`/workspaces/${workspace.id}/epics/${epicId}`)
      fetchEpics()
    } catch (err) {
      console.error('Failed to delete epic:', err)
    }
  }

  const handleToggleStatus = async (epic: Epic, e: React.MouseEvent) => {
    e.stopPropagation()
    const newStatus = epic.status === 'open' ? 'done' : 'open'
    try {
      await api.put(`/workspaces/${workspace.id}/epics/${epic.id}`, {
        status: newStatus,
      })
      fetchEpics()
    } catch (err) {
      console.error('Failed to update epic status:', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-base-content">Epic Tracking</h2>
          <p className="text-xs text-base-content/60">
            Manage epics and track their card progress in {workspace.name}
          </p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary btn-sm">
          {showAddForm ? 'Cancel' : '➕ New Epic'}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={handleCreate}
          className="card bg-base-100 border border-base-200 p-4 space-y-3 shadow-sm"
        >
          <h3 className="font-bold text-sm">Create New Epic</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs font-bold uppercase text-base-content/60">
                Title
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Epic Title"
                className="input input-bordered input-sm w-full"
              />
            </div>
            <div>
              <label className="label text-xs font-bold uppercase text-base-content/60">
                Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border border-base-300"
                />
                <span className="text-xs font-mono">{newColor}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="label text-xs font-bold uppercase text-base-content/60">
              Description
            </label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Epic Description"
              className="textarea textarea-bordered textarea-sm w-full h-20"
            />
          </div>
          <button type="submit" className="btn btn-primary btn-sm w-full">
            Save Epic
          </button>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <span className="loading loading-spinner text-primary"></span>
        </div>
      ) : epics.length === 0 ? (
        <div className="text-center py-12 bg-base-100 rounded-lg border border-dashed border-base-300">
          <p className="text-base-content/50">
            No Epics found. Create one to start tracking large initiatives!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {epics.map((epic) => (
            <div
              key={epic.id}
              onClick={() => onSelectEpic(epic.id)}
              className="card bg-base-100 border border-base-200 hover:border-primary/40 shadow-sm hover:shadow-md transition-all cursor-pointer p-4 space-y-3 relative group text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: epic.color }} />
                  <h3 className="font-bold text-base text-base-content line-clamp-1">
                    {epic.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleToggleStatus(epic, e)}
                    className={`btn btn-xs ${epic.status === 'done' ? 'btn-success text-white' : 'btn-outline'}`}
                    title={epic.status === 'done' ? 'Reopen Epic' : 'Mark as Done'}
                  >
                    {epic.status === 'done' ? '✓ Closed' : 'Open'}
                  </button>
                  <button
                    onClick={(e) => handleDelete(epic.id, e)}
                    className="btn btn-xs btn-ghost text-error"
                    title="Delete Epic"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {epic.description && (
                <p className="text-xs text-base-content/60 line-clamp-2 leading-relaxed">
                  {epic.description}
                </p>
              )}

              {epic.progress && (
                <EpicProgress
                  percentage={epic.progress.percentage}
                  totalCards={epic.progress.total_cards}
                  completedCards={epic.progress.completed_cards}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
