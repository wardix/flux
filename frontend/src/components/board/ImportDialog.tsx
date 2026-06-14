import React, { useState } from 'react'
import { api } from '../../lib/api'
import { useBoardStore } from '../../stores/boardStore'

interface ImportDialogProps {
  workspaceId: number
  onSuccess: () => void
  onClose: () => void
}

export function ImportDialog({ workspaceId, onSuccess, onClose }: ImportDialogProps) {
  const [importType, setImportType] = useState<'trello' | 'jira'>('trello')
  const [boardTitle, setBoardTitle] = useState('')
  const [fileContent, setFileContent] = useState<string>('')
  const [previewData, setPreviewData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setFileContent(content)
      setError(null)

      try {
        if (importType === 'trello') {
          const parsed = JSON.parse(content)
          if (!parsed.name) {
            setError('Invalid Trello JSON: Missing "name" attribute.')
            setPreviewData(null)
            return
          }
          const listsCount = parsed.lists ? parsed.lists.filter((l: any) => !l.closed).length : 0
          const cardsCount = parsed.cards ? parsed.cards.filter((c: any) => !c.closed).length : 0
          setPreviewData({
            name: parsed.name,
            listsCount,
            cardsCount,
          })
          setBoardTitle(parsed.name)
        } else {
          // Parse Jira CSV helper
          const lines = content.split('\n').map((line) => line.trim()).filter(Boolean)
          if (lines.length < 2) {
            setError('Invalid Jira CSV: Must contain headers and at least one row.')
            setPreviewData(null)
            return
          }

          // Simple CSV parsing (assuming first row is headers: summary, description, status, storyPoints, dueDate, assignee)
          const headers = lines[0].toLowerCase().split(',')
          const rows: any[] = []
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',')
            const row: any = {}
            headers.forEach((h, index) => {
              const cleanedHeader = h.trim().replace(/^["']|["']$/g, '')
              const value = cols[index]?.trim().replace(/^["']|["']$/g, '') || ''
              if (cleanedHeader === 'summary') row.summary = value
              else if (cleanedHeader === 'description') row.description = value
              else if (cleanedHeader === 'status') row.status = value
              else if (cleanedHeader === 'storypoints' || cleanedHeader === 'story points') row.storyPoints = Number(value) || undefined
              else if (cleanedHeader === 'duedate' || cleanedHeader === 'due date') row.dueDate = value
              else if (cleanedHeader === 'assignee') row.assignee = value
            })
            if (row.summary) {
              rows.push(row)
            }
          }

          const statuses = Array.from(new Set(rows.map((r) => r.status || 'To Do')))
          setPreviewData({
            rows,
            listsCount: statuses.length,
            cardsCount: rows.length,
            statuses,
          })
        }
      } catch (err: any) {
        setError('Failed to parse file content. Please verify format.')
        setPreviewData(null)
      }
    }
    reader.readAsText(file)
  }

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileContent) return
    setIsLoading(true)
    setError(null)

    try {
      if (importType === 'trello') {
        const trelloData = JSON.parse(fileContent)
        const res = await api.post<any>('/import/trello', {
          workspace_id: workspaceId,
          trello_data: trelloData,
        })
        const fetchBoard = useBoardStore.getState().fetchBoard
        const fetchBoards = useBoardStore.getState().fetchBoards
        await fetchBoards()
        if (res.data?.id) {
          await fetchBoard(res.data.id)
        }
      } else {
        if (!boardTitle.trim()) {
          setError('Board title is required for Jira Import.')
          setIsLoading(false)
          return
        }
        const res = await api.post<any>('/import/jira', {
          workspace_id: workspaceId,
          board_title: boardTitle.trim(),
          jira_rows: previewData?.rows || [],
        })
        const fetchBoard = useBoardStore.getState().fetchBoard
        const fetchBoards = useBoardStore.getState().fetchBoards
        await fetchBoards()
        if (res.data?.id) {
          await fetchBoard(res.data.id)
        }
      }

      alert('Project imported successfully!')
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Import failed. Check logs.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg bg-base-100 border border-base-200 shadow-2xl p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-base-200 pb-3">
          <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
            📥 Import Project
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            ✕
          </button>
        </div>

        <div className="flex gap-2 justify-center">
          <button
            type="button"
            onClick={() => {
              setImportType('trello')
              setPreviewData(null)
              setFileContent('')
              setError(null)
            }}
            className={`btn btn-sm flex-1 ${importType === 'trello' ? 'btn-primary text-white' : 'btn-outline'}`}
          >
            Trello (JSON)
          </button>
          <button
            type="button"
            onClick={() => {
              setImportType('jira')
              setPreviewData(null)
              setFileContent('')
              setError(null)
            }}
            className={`btn btn-sm flex-1 ${importType === 'jira' ? 'btn-primary text-white' : 'btn-outline'}`}
          >
            Jira (CSV)
          </button>
        </div>

        <form onSubmit={handleImportSubmit} className="space-y-4">
          {importType === 'jira' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-base-content/60">Board Title</label>
              <input
                type="text"
                placeholder="Enter title for imported Jira board..."
                value={boardTitle}
                onChange={(e) => setBoardTitle(e.target.value)}
                className="input input-bordered input-sm w-full focus:outline-none"
                required={importType === 'jira'}
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-base-content/60">
              Select {importType === 'trello' ? 'Trello JSON File' : 'Jira CSV File'}
            </label>
            <input
              type="file"
              accept={importType === 'trello' ? '.json' : '.csv'}
              onChange={handleFileChange}
              className="file-input file-input-bordered file-input-sm w-full"
              required
            />
          </div>

          {error && (
            <div className="alert alert-error text-xs p-2 rounded-lg bg-error/10 border-error/25 text-error-content">
              {error}
            </div>
          )}

          {previewData && (
            <div className="p-3 bg-base-200/50 rounded-xl border border-base-300 text-xs space-y-1">
              <span className="font-bold text-base-content/80 block uppercase tracking-wide mb-1">
                🔍 Import Preview
              </span>
              {importType === 'trello' ? (
                <>
                  <p><strong>Board Name:</strong> {previewData.name}</p>
                  <p><strong>Active Lists:</strong> {previewData.listsCount}</p>
                  <p><strong>Active Cards:</strong> {previewData.cardsCount}</p>
                </>
              ) : (
                <>
                  <p><strong>Columns Detected:</strong> {previewData.listsCount} ({previewData.statuses?.join(', ')})</p>
                  <p><strong>Total Cards Detected:</strong> {previewData.cardsCount}</p>
                </>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={isLoading || !previewData}
              className="btn btn-primary btn-sm flex-1 text-white"
            >
              {isLoading ? 'Importing...' : 'Confirm Import'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-sm flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
