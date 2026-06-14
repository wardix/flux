import { useState } from 'react'

interface ExportDialogProps {
  boardId: number
  boardTitle: string
  isOpen: boolean
  onClose: () => void
}

export function ExportDialog({ boardId, boardTitle, isOpen, onClose }: ExportDialogProps) {
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleExport = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const token = localStorage.getItem('token')

      const res = await fetch(`${apiBaseUrl}/export/${boardId}?format=${format}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!res.ok) {
        throw new Error(`Failed to export: ${res.statusText}`)
      }

      const filename = `${boardTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-export.${format}`

      if (format === 'json') {
        const json = await res.json()
        const dataStr =
          'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json, null, 2))
        const downloadAnchor = document.createElement('a')
        downloadAnchor.setAttribute('href', dataStr)
        downloadAnchor.setAttribute('download', filename)
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
      } else {
        const csvText = await res.text()
        const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const downloadAnchor = document.createElement('a')
        downloadAnchor.setAttribute('href', url)
        downloadAnchor.setAttribute('download', filename)
        document.body.appendChild(downloadAnchor)
        downloadAnchor.click()
        downloadAnchor.remove()
        URL.revokeObjectURL(url)
      }
      onClose()
    } catch (err: any) {
      console.error('Export error:', err)
      setError(err.message || 'Export failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box bg-base-100 border border-base-200 shadow-2xl relative space-y-4 max-w-sm">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg text-primary">Export Board Data</h3>
        <p className="text-xs text-base-content/60">
          Export all lists, cards, and details from <strong>{boardTitle}</strong>.
        </p>

        {error && (
          <div className="alert alert-error text-xs py-2 rounded-md">
            <span>{error}</span>
          </div>
        )}

        <div className="form-control space-y-2">
          <span className="text-xs text-base-content/50 font-bold uppercase">Format</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="radio"
                name="export-format"
                className="radio radio-primary radio-sm"
                checked={format === 'json'}
                onChange={() => setFormat('json')}
                disabled={isLoading}
              />
              JSON Format
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
              <input
                type="radio"
                name="export-format"
                className="radio radio-primary radio-sm"
                checked={format === 'csv'}
                onChange={() => setFormat('csv')}
                disabled={isLoading}
              />
              CSV Format
            </label>
          </div>
        </div>

        <div className="modal-action flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="btn btn-ghost btn-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isLoading}
            className={`btn btn-primary btn-sm px-6 ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  )
}
