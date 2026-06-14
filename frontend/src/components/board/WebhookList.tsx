import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface Webhook {
  id: number
  board_id: number
  url: string
  secret: string | null
  is_active: boolean
  created_at: string
}

interface WebhookListProps {
  boardId: number
  disabled?: boolean
}

export function WebhookList({ boardId, disabled = false }: WebhookListProps) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [newSecret, setNewSecret] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const fetchWebhooks = async () => {
    try {
      const res = await api.get<{ data: Webhook[] }>(`/boards/${boardId}/webhooks`)
      setWebhooks(res.data)
    } catch (err) {
      console.error('Failed to fetch webhooks:', err)
    }
  }

  useEffect(() => {
    fetchWebhooks()
  }, [boardId])

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl.trim()) return
    setIsLoading(true)
    try {
      await api.post(`/boards/${boardId}/webhooks`, {
        url: newUrl.trim(),
        secret: newSecret.trim() || undefined,
      })
      setNewUrl('')
      setNewSecret('')
      fetchWebhooks()
    } catch (err) {
      console.error('Failed to create webhook:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteWebhook = async (id: number) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return
    try {
      await api.delete(`/boards/${boardId}/webhooks/${id}`)
      fetchWebhooks()
    } catch (err) {
      console.error('Failed to delete webhook:', err)
    }
  }

  return (
    <div className="space-y-4">
      <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wide">
        Board Webhooks
      </span>

      {!disabled && (
        <form onSubmit={handleCreateWebhook} className="space-y-2 pb-2 border-b border-base-300">
          <input
            type="url"
            placeholder="Payload URL (https://...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="input input-xs input-bordered w-full focus:outline-none"
            required
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Secret (optional)"
              value={newSecret}
              onChange={(e) => setNewSecret(e.target.value)}
              className="input input-xs input-bordered flex-1 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary btn-xs text-white"
            >
              Add Webhook
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {webhooks.length === 0 ? (
          <p className="text-xs text-base-content/40 italic py-2 text-center">
            No webhooks registered.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {webhooks.map((wh) => (
              <div
                key={wh.id}
                className="flex items-center justify-between p-2 rounded-lg bg-base-100 border border-base-300 text-xs"
              >
                <div className="truncate flex-1 mr-2">
                  <p className="font-semibold truncate text-base-content/90" title={wh.url}>
                    {wh.url}
                  </p>
                  {wh.secret && (
                    <span className="text-[9px] px-1 border border-success/35 text-success rounded">
                      Secured
                    </span>
                  )}
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => handleDeleteWebhook(wh.id)}
                    className="btn btn-xs btn-error btn-outline"
                  >
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
