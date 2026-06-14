import React, { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface BoardEmail {
  id: number
  board_id: number
  target_list_id: number
  email_address: string
  is_active: boolean
  created_at: string
}

interface EmailSettingsProps {
  boardId: number
  lists: Array<{ id: number; title: string }>
}

export function EmailSettings({ boardId, lists }: EmailSettingsProps) {
  const [emails, setEmails] = useState<BoardEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedListId, setSelectedListId] = useState<number>(lists[0]?.id || 0)

  useEffect(() => {
    fetchEmails()
  }, [boardId])

  const fetchEmails = async () => {
    try {
      const res = await api.get<{ data: BoardEmail[] }>(`/boards/${boardId}/email`)
      setEmails(res.data)
    } catch (error) {
      console.error('Failed to fetch board emails', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedListId) return
    try {
      await api.post(`/boards/${boardId}/email`, { target_list_id: selectedListId })
      fetchEmails()
    } catch (error) {
      console.error('Failed to generate email', error)
    }
  }

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      await api.put(`/boards/${boardId}/email/${id}`, { is_active: !currentStatus })
      fetchEmails()
    } catch (error) {
      console.error('Failed to update email status', error)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this email address? It will no longer accept emails.')) return
    try {
      await api.delete(`/boards/${boardId}/email/${id}`)
      fetchEmails()
    } catch (error) {
      console.error('Failed to delete email', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Email copied to clipboard!')
  }

  if (isLoading) return <div className="p-4 text-center">Loading...</div>

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <select 
          className="select select-bordered select-sm flex-1" 
          value={selectedListId} 
          onChange={e => setSelectedListId(Number(e.target.value))}
        >
          {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
        <button type="button" onClick={handleGenerate} className="btn btn-primary btn-sm text-white">
          Generate New Email
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-xs w-full">
          <thead>
            <tr>
              <th>Email Address</th>
              <th>Target List</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {emails.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4 text-base-content/50">
                  No email addresses generated yet.
                </td>
              </tr>
            )}
            {emails.map(email => (
              <tr key={email.id}>
                <td className="font-mono text-xs flex items-center gap-2">
                  {email.email_address}
                  <button 
                    type="button" 
                    className="btn btn-ghost btn-xs text-base-content/50" 
                    onClick={() => copyToClipboard(email.email_address)}
                    title="Copy"
                  >
                    📋
                  </button>
                </td>
                <td>{lists.find(l => l.id === email.target_list_id)?.title || 'Unknown List'}</td>
                <td>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-sm toggle-primary" 
                    checked={email.is_active} 
                    onChange={() => handleToggleActive(email.id, email.is_active)}
                  />
                </td>
                <td>
                  <button 
                    type="button" 
                    className="btn btn-ghost btn-xs text-error" 
                    onClick={() => handleDelete(email.id)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
