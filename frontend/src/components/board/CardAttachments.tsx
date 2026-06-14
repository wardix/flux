import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface Attachment {
  id: number
  card_id: number
  name: string
  file_path: string
  file_type: string
  size: number
  is_cover: boolean
  created_at: string
}

interface CardAttachmentsProps {
  cardId: number
  onCoverChange: () => void
  disabled?: boolean
}

export function CardAttachments({ cardId, onCoverChange, disabled = false }: CardAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)

  const fetchAttachments = async () => {
    try {
      const res = await api.get<Attachment[]>(`/cards/${cardId}/attachments`)
      setAttachments(res)
    } catch (err) {
      console.error('Failed to fetch attachments:', err)
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchAttachments is not memoized
  useEffect(() => {
    fetchAttachments()
  }, [cardId])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      await api.post(`/cards/${cardId}/attachments`, formData)
      await fetchAttachments()
    } catch (err) {
      console.error('Failed to upload file:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAttachment = async (attachmentId: number, wasCover: boolean) => {
    try {
      await api.delete(`/cards/${cardId}/attachments/${attachmentId}`)
      await fetchAttachments()
      if (wasCover) {
        onCoverChange()
      }
    } catch (err) {
      console.error('Failed to delete attachment:', err)
    }
  }

  const handleToggleCover = async (attachment: Attachment) => {
    const newCoverState = !attachment.is_cover
    try {
      await api.put(`/cards/${cardId}/attachments/${attachment.id}/cover`, {
        is_cover: newCoverState,
      })
      await fetchAttachments()
      onCoverChange()
    } catch (err) {
      console.error('Failed to toggle cover:', err)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    const kb = bytes / 1024
    if (kb < 1024) return `${kb.toFixed(1)} KB`
    const mb = kb / 1024
    return `${mb.toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      {/* Upload button/input */}
      {!disabled && (
        <div className="flex items-center gap-2">
          <label className="btn btn-sm btn-outline btn-primary gap-1 relative overflow-hidden cursor-pointer">
            <span>{uploading ? '⏳ Uploading...' : '📎 Upload File'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              disabled={uploading}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
          <span className="text-xs text-base-content/40">Images or documents</span>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {attachments.map((att) => {
            const isImage = att.file_type?.startsWith('image/')
            return (
              <div
                key={att.id}
                className="flex flex-col border border-base-200 bg-base-50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative group"
              >
                {/* Image preview */}
                {isImage && (
                  <div className="h-24 bg-base-200 overflow-hidden relative flex items-center justify-center">
                    <img
                      src={att.file_path}
                      alt={att.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* File details */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-xs text-base-content/85 truncate" title={att.name}>
                      {att.name}
                    </div>
                    <div className="text-[10px] text-base-content/45 font-medium">
                      {formatSize(att.size)} • {new Date(att.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  {!disabled && (
                    <div className="flex gap-2 pt-1 justify-between items-center mt-auto">
                      {isImage ? (
                        <button
                          type="button"
                          onClick={() => handleToggleCover(att)}
                          className={`btn btn-xs ${
                            att.is_cover ? 'btn-primary' : 'btn-outline text-base-content/75'
                          }`}
                        >
                          🖼️ {att.is_cover ? 'Remove Cover' : 'Make Cover'}
                        </button>
                      ) : (
                        <div />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteAttachment(att.id, att.is_cover)}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/15 rounded-md"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

